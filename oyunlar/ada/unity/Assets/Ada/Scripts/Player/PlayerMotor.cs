using System;
using UnityEngine;

namespace Ada.Player
{
    public enum MotorState { Grounded, Jumping, Falling, Swimming, Diving }

    /// <summary>
    /// Oyuncunun konumunu yöneten TEK sistem: kinematik Transform hareketi.
    /// Rigidbody ve CharacterController kullanılmaz; fizik yalnız sorgular (raycast/spherecast) için.
    /// Zıplama süresi, tepe yüksekliği ve iniş noktası karakterden bağımsızdır: Kerem ve Deniz aynı değerleri kullanır.
    /// Animator yalnızca görselleştirir (root motion kapalı, OnAnimatorMove yok).
    /// </summary>
    public sealed class PlayerMotor : MonoBehaviour
    {
        [Header("Zıplama (iki karakter için ortak)")]
        [SerializeField] float jumpDuration = 0.42f;
        [SerializeField] float jumpApexHeight = 0.9f;

        [Header("Yer hareketi")]
        [SerializeField] float runSpeed = 4.2f;
        [SerializeField] float sprintSpeed = 6.5f;
        [SerializeField] float turnSpeedDeg = 720f;

        [Header("Düşüş ve su")]
        [SerializeField] float gravity = 22f;
        [SerializeField] float waterSurfaceY = 0f;
        [Tooltip("Yüzerken kökün (ayak tabanı) su yüzeyinin ne kadar altında durduğu.")]
        [SerializeField] float swimRootOffset = -1.0f;

        public MotorState State { get; private set; } = MotorState.Grounded;
        public bool IsGrounded => State == MotorState.Grounded;
        public bool InWater => State == MotorState.Swimming || State == MotorState.Diving;
        public bool IsDiving => State == MotorState.Diving;
        public float RunSpeed => runSpeed;
        public float SprintSpeed => sprintSpeed;
        public float SwimRootY => waterSurfaceY + swimRootOffset;

        /// <summary>0 = durma, 0,5 = koşu, 1 = sprint. Locomotion blend tree'yi besler.</summary>
        public float LocomotionBlend { get; private set; }
        public float PlanarSpeed { get; private set; }
        public float VerticalSpeed { get; private set; }

        public event Action TookOff;
        public event Action Landed;
        public event Action FallStarted;
        public event Action EnteredWater;
        public event Action ExitedWater;

        Vector3 jumpFrom, jumpTo, prevPos, fallVelocity;
        float jumpT;
        bool jumpIntoWater;
        Action onJumpArrive;

        Vector3? runTarget;
        float runSpeedNow;
        Action onRunArrive;

        void Awake() => prevPos = transform.position;

        /// <summary>
        /// Hedef kalkışta kesinleşir; havada değiştirilemez. intoWater: varışta suya girer (Landed yerine EnteredWater).
        /// </summary>
        public bool TryJump(Vector3 target, Action onArrived, bool intoWater = false)
        {
            if (State != MotorState.Grounded) return false;
            runTarget = null;
            jumpFrom = transform.position;
            jumpTo = target;
            jumpT = 0f;
            jumpIntoWater = intoWater;
            onJumpArrive = onArrived;
            Face(jumpTo - jumpFrom, true);
            State = MotorState.Jumping;
            TookOff?.Invoke();
            return true;
        }

        /// <summary>Düz zeminde koşu (iskele, final alanı). Varışta geri çağrı.</summary>
        public void RunTo(Vector3 target, bool sprint, Action onArrived)
        {
            if (State != MotorState.Grounded) return;
            runTarget = target;
            runSpeedNow = sprint ? sprintSpeed : runSpeed;
            onRunArrive = onArrived;
        }

        public void StopRunning() => runTarget = null;

        /// <summary>Yanlış platform: yerdeyken suya düşüş başlar.</summary>
        public void StartFall()
        {
            if (State != MotorState.Grounded) return;
            runTarget = null;
            fallVelocity = Vector3.zero;
            State = MotorState.Falling;
            FallStarted?.Invoke();
        }

        /// <summary>Su içinde hareket. Dalış/yüzme denetleyicisi her karede hız verir; konumu yalnız motor değiştirir.</summary>
        public void SwimMove(Vector3 velocity, float minRootY)
        {
            if (!InWater) return;
            float dt = Time.deltaTime;
            if (dt <= 0f) return;
            Vector3 p = transform.position + velocity * dt;
            p.y = Mathf.Clamp(p.y, minRootY, SwimRootY);
            transform.position = p;
            Face(velocity, false);
        }

        public void SetDiving(bool diving)
        {
            if (!InWater) return;
            State = diving ? MotorState.Diving : MotorState.Swimming;
        }

        /// <summary>Kontrol noktasına ya da sudan çıkış noktasına yerleştirir (tırmanma geçişinin sonunda).</summary>
        public void PlaceGrounded(Vector3 position, Vector3 forward)
        {
            bool wasInWater = InWater;
            runTarget = null;
            onJumpArrive = null;
            transform.position = position;
            prevPos = position;
            Face(forward, true);
            State = MotorState.Grounded;
            if (wasInWater) ExitedWater?.Invoke();
        }

        void Update()
        {
            float dt = Time.deltaTime;
            if (dt <= 0f) return;
            Vector3 p = transform.position;

            switch (State)
            {
                case MotorState.Jumping:
                {
                    jumpT = Mathf.Min(1f, jumpT + dt / jumpDuration);
                    p = Vector3.Lerp(jumpFrom, jumpTo, jumpT);
                    p.y += 4f * jumpApexHeight * jumpT * (1f - jumpT);
                    transform.position = p;
                    if (jumpT >= 1f)
                    {
                        var cb = onJumpArrive;
                        onJumpArrive = null;
                        if (jumpIntoWater)
                        {
                            State = MotorState.Falling; // su yüzeyinin altına kısa batış, sonra Swimming
                            fallVelocity = new Vector3(0f, -3f, 0f);
                        }
                        else
                        {
                            State = MotorState.Grounded;
                            Landed?.Invoke();
                        }
                        cb?.Invoke();
                    }
                    break;
                }

                case MotorState.Grounded:
                    if (runTarget.HasValue)
                    {
                        Vector3 tgt = runTarget.Value;
                        Vector3 d = tgt - p;
                        d.y = 0f;
                        float step = runSpeedNow * dt;
                        if (d.magnitude <= step)
                        {
                            transform.position = new Vector3(tgt.x, p.y, tgt.z);
                            runTarget = null;
                            var cb = onRunArrive;
                            onRunArrive = null;
                            cb?.Invoke();
                        }
                        else
                        {
                            transform.position = p + d.normalized * step;
                            Face(d, false);
                        }
                    }
                    break;

                case MotorState.Falling:
                    fallVelocity.y -= gravity * dt;
                    p += fallVelocity * dt;
                    if (p.y <= SwimRootY)
                    {
                        p.y = SwimRootY;
                        State = MotorState.Swimming;
                        transform.position = p;
                        EnteredWater?.Invoke();
                    }
                    else transform.position = p;
                    break;
            }

            Vector3 delta = transform.position - prevPos;
            VerticalSpeed = delta.y / dt;
            delta.y = 0f;
            PlanarSpeed = delta.magnitude / dt;

            if (State != MotorState.Grounded || PlanarSpeed < 0.05f) LocomotionBlend = 0f;
            else if (PlanarSpeed <= runSpeed) LocomotionBlend = 0.5f * PlanarSpeed / runSpeed;
            else LocomotionBlend = 0.5f + 0.5f * Mathf.InverseLerp(runSpeed, sprintSpeed, PlanarSpeed);

            prevPos = transform.position;
        }

        void Face(Vector3 dir, bool instant)
        {
            dir.y = 0f;
            if (dir.sqrMagnitude < 1e-6f) return;
            Quaternion target = Quaternion.LookRotation(dir.normalized, Vector3.up);
            transform.rotation = instant
                ? target
                : Quaternion.RotateTowards(transform.rotation, target, turnSpeedDeg * Time.deltaTime);
        }
    }
}
