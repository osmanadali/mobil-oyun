using UnityEngine;

namespace Ada.Player
{
    /// <summary>
    /// Motorun durumunu Animator parametrelerine çevirir; oyun kararı vermez.
    /// İniş yalnız motorun onayladığı Landed olayıyla tetiklenir; kalkışta Land temizlenir.
    /// Böylece kalkış karesindeki eski Grounded değeri JumpAir→Land geçişini erken açamaz.
    /// </summary>
    public sealed class PlayerAnimatorBridge : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] Animator animator;

        [Tooltip("Koşu klibinin 1 ölçekteki ortalama hızı (m/sn). Klip içe aktarma ekranında Average Velocity.")]
        [SerializeField] float runClipSpeed = 3.6f;
        [SerializeField] float sprintClipSpeed = 6.0f;
        [Tooltip("Bacak uzunluğu oranı (Kerem 1, Deniz ~0,92). Yalnız animasyon oynatma hızını etkiler, oyunu değil.")]
        [SerializeField] float strideScale = 1f;
        [SerializeField] float blendDamp = 0.08f;

        static readonly int SpeedId = Animator.StringToHash("Speed");
        static readonly int MoveAnimSpeedId = Animator.StringToHash("MoveAnimSpeed");
        static readonly int GroundedId = Animator.StringToHash("Grounded");
        static readonly int JumpId = Animator.StringToHash("Jump");
        static readonly int LandId = Animator.StringToHash("Land");
        static readonly int FallId = Animator.StringToHash("Fall");
        static readonly int InWaterId = Animator.StringToHash("InWater");
        static readonly int DivingId = Animator.StringToHash("Diving");
        static readonly int SwimSpeedId = Animator.StringToHash("SwimSpeed");
        static readonly int AimingId = Animator.StringToHash("Aiming");
        static readonly int ThrowId = Animator.StringToHash("Throw");
        static readonly int VictoryId = Animator.StringToHash("Victory");
        static readonly int RollId = Animator.StringToHash("Roll");

        void Awake() => animator.applyRootMotion = false;

        void OnEnable()
        {
            motor.TookOff += OnTookOff;
            motor.Landed += OnLanded;
            motor.FallStarted += OnFall;
        }

        void OnDisable()
        {
            motor.TookOff -= OnTookOff;
            motor.Landed -= OnLanded;
            motor.FallStarted -= OnFall;
        }

        void OnTookOff()
        {
            animator.ResetTrigger(LandId);
            animator.SetTrigger(JumpId);
        }

        void OnLanded()
        {
            animator.ResetTrigger(JumpId);
            animator.SetTrigger(LandId);
        }

        void OnFall()
        {
            animator.ResetTrigger(LandId);
            animator.SetTrigger(FallId);
        }

        public void SetAiming(bool on) => animator.SetBool(AimingId, on);
        public void PlayThrow() => animator.SetTrigger(ThrowId);
        public void ClearThrow() => animator.ResetTrigger(ThrowId);
        public void PlayVictory() => animator.SetTrigger(VictoryId);
        public void PlayRoll() => animator.SetTrigger(RollId);

        void Update()
        {
            float dt = Time.deltaTime;
            float blend = motor.LocomotionBlend;
            animator.SetFloat(SpeedId, blend, blendDamp, dt);

            // Ayak kaymasını azaltmak için oynatma hızını gerçek hıza oranla (oyun hızı iki karakterde aynı).
            float clipSpeed = (blend <= 0.5f ? runClipSpeed : Mathf.Lerp(runClipSpeed, sprintClipSpeed, (blend - 0.5f) * 2f)) * strideScale;
            float moveAnim = motor.IsGrounded && motor.PlanarSpeed > 0.05f
                ? Mathf.Clamp(motor.PlanarSpeed / Mathf.Max(0.01f, clipSpeed), 0.6f, 1.6f)
                : 1f;
            animator.SetFloat(MoveAnimSpeedId, moveAnim);

            animator.SetBool(GroundedId, motor.IsGrounded);
            animator.SetBool(InWaterId, motor.InWater);
            animator.SetBool(DivingId, motor.IsDiving);
            animator.SetFloat(SwimSpeedId, motor.InWater ? Mathf.Clamp01(motor.PlanarSpeed / 2f) : 0f, blendDamp, dt);
        }
    }
}
