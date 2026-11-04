using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Pool;
using Ada.Core;
using Ada.InputLayer;
using Ada.Player;

namespace Ada.Throw
{
    /// <summary>
    /// Sapan tipi nişan: alt güvenli bölgede dokun → GERİ (aşağı) çek = güç, yatay = yön → bırak = atış.
    /// - Eşikler dp cinsinden (çözünürlükten bağımsız). Eşik altı hareket top fırlatmaz. UI dokunuşları TouchInput'ta elenir.
    /// - Yay (AimArc) ve gerçek top aynı başlangıç (ThrowOrigin), hız, BallisticsSettings ve fixedDeltaTime ile hesaplanır.
    /// - Top bırakma karesine kadar HandSocket'ta durur; Throw klibinin "ThrowRelease" olayıyla elden çıkar.
    /// - pendingId + released: çift top yok. Kesilen/zaman aşımına uğrayan atış temizlenir; kilitlenme yok.
    /// - Odak kaybı / reklam dönüşü (TouchInput.Cleared, GameClock.PauseChanged) bekleyen nişanı iptal eder.
    /// </summary>
    public sealed class ThrowController : MonoBehaviour
    {
        [Header("Bağlantılar")]
        [SerializeField] TouchInput input;
        [SerializeField] PlayerAnimatorBridge anim;
        [Tooltip("Sağ el kemiğinin çocuğu (top elde burada durur).")]
        [SerializeField] Transform handSocket;
        [Tooltip("Throw klibinin bırakma karesindeki el konumuna hizalı sabit nokta (PlayerRoot çocuğu). Yay buradan başlar.")]
        [SerializeField] Transform throwOrigin;
        [Tooltip("Nişan yönü referansı (genelde PlayerRoot; hedeflere bakar).")]
        [SerializeField] Transform aimReference;
        [SerializeField] Ball ballPrefab;
        [SerializeField] AimArc arc;
        [Tooltip("Yayın ve topun çarpacağı katmanlar: Target + çevre (stand, iskele, kaya, zemin). Su hariç.")]
        [SerializeField] LayerMask hitMask;

        [Header("Kontrol (dp)")]
        [Tooltip("Dokunuşun başlaması gereken bölge: güvenli alanın alttan bu oranı.")]
        [SerializeField] [Range(0.2f, 0.7f)] float touchZoneHeight = 0.45f;
        [SerializeField] float minPullDp = 28f;
        [SerializeField] float maxPullDp = 220f;
        [SerializeField] float sideRangeDp = 160f;
        [Tooltip("Açık: sola çekmek sağa nişan alır (sapan). Kapalı: parmak yönüne nişan.")]
        [SerializeField] bool slingshotHorizontal = true;

        [Header("Atış")]
        [SerializeField] float maxYawDeg = 16f;
        [SerializeField] float pitchDeg = 24f;
        [SerializeField] float minSpeed = 8f;
        [SerializeField] float maxSpeed = 14f;
        [SerializeField] float killY = -0.6f;
        [SerializeField] int maxPredictSteps = 150;
        [Tooltip("Bırakma olayı bu süre içinde gelmezse atış iptal edilir.")]
        [SerializeField] float releaseTimeout = 1.2f;
        [SerializeField] float nextBallDelay = 0.4f;
        [SerializeField] bool logTrajectoryError = true;

        public BallisticsSettings settings = BallisticsSettings.Default;

        public event Action<Vector3, Vector3> Released;                 // konum, hız (ses/parçacık tek kaynak)
        public event Action<TargetBoard, Vector3, Vector3> TargetHit;    // hedef, temas noktası, normal (fiziksel isabet)
        public event Action Missed;
        public event Action AimStarted;
        public event Action AimCanceled;

        bool aimEnabled, touchActive, validAim, released, throwStateActive;
        int throwId, pendingId = -1, animThrowId = -1;
        Vector3 pendingVelocity, lastPreviewVelocity;
        BallisticsSettings pendingSettings;
        float throwStartedAt;
        Ball heldBall;
        ObjectPool<Ball> pool;
        readonly List<Ball> active = new List<Ball>(8);
        Vector3[] buffer;
        Coroutine nextBallRoutine;

        public bool IsAiming => touchActive;
        /// <summary>Bekleyen atış var ya da Throw animasyonu henüz bitmedi: yeni atış başlamaz.</summary>
        public bool IsBusy => pendingId >= 0 || throwStateActive;
        public int BallsInFlight => active.Count;
        /// <summary>Reklam yalnız nişan ve uçuş yokken açılabilir.</summary>
        public bool IsSafeForAds => !touchActive && !IsBusy && active.Count == 0;

        void Awake()
        {
            buffer = new Vector3[Mathf.Clamp(maxPredictSteps, 8, 256)];
            pool = new ObjectPool<Ball>(
                createFunc: () =>
                {
                    var b = Instantiate(ballPrefab);
                    b.FirstContact += OnBallContact;
                    b.Finished += OnBallFinished;
                    b.gameObject.SetActive(false);
                    return b;
                },
                actionOnGet: b => b.gameObject.SetActive(true),
                actionOnRelease: b => b.gameObject.SetActive(false),
                actionOnDestroy: b => { if (b) Destroy(b.gameObject); },
                collectionCheck: true,
                defaultCapacity: 4,
                maxSize: 8);

            var animator = anim ? anim.Animator : null;
            if (animator && animator.updateMode != AnimatorUpdateMode.Normal)
                Debug.LogWarning("ThrowController: Animator Update Mode 'Normal' olmalı (bırakma olayı ile önizleme hizası).", this);
        }

        void OnEnable()
        {
            input.DragStarted += OnTouchStart;
            input.Dragging += OnDrag;
            input.DragEnded += OnDragEnd;
            input.TouchEnded += OnTouchEnded;
            input.Cleared += CancelAim;
            GameClock.PauseChanged += OnPauseChanged;
        }

        void OnDisable()
        {
            input.DragStarted -= OnTouchStart;
            input.Dragging -= OnDrag;
            input.DragEnded -= OnDragEnd;
            input.TouchEnded -= OnTouchEnded;
            input.Cleared -= CancelAim;
            GameClock.PauseChanged -= OnPauseChanged;
        }

        // ---------------------------------------------------------------- dışarıdan
        public void BeginAiming()
        {
            aimEnabled = true;
            anim.SetAiming(true);
            EnsureHeldBall();
        }

        /// <summary>Nişanı kapatır: girdi kilitlenir, bekleyen atış iptal edilir, yay gizlenir, eldeki top bırakılır.</summary>
        public void EndAiming()
        {
            aimEnabled = false;
            CancelAim();
            CancelPending();
            if (arc) arc.Hide();
            anim.SetAiming(false);
            if (nextBallRoutine != null) { StopCoroutine(nextBallRoutine); nextBallRoutine = null; }
            if (heldBall != null) { pool.Release(heldBall); heldBall = null; }
        }

        /// <summary>Yeniden başlatma: bekleyen atış, yay, uçan toplar ve eldeki top sıfırlanır.</summary>
        public void ResetAll()
        {
            CancelAim();
            CancelPending();
            throwStateActive = false;
            animThrowId = -1;
            if (nextBallRoutine != null) { StopCoroutine(nextBallRoutine); nextBallRoutine = null; }
            for (int i = active.Count - 1; i >= 0; i--) pool.Release(active[i]);
            active.Clear();
            if (heldBall != null) { pool.Release(heldBall); heldBall = null; }
            if (aimEnabled) EnsureHeldBall();
        }

        // ---------------------------------------------------------------- girdi
        void OnTouchStart(Vector2 p)
        {
            touchActive = aimEnabled && !IsBusy && InTouchZone(p);
            validAim = false;
            if (touchActive) AimStarted?.Invoke();
        }

        bool InTouchZone(Vector2 p)
        {
            Rect safe = Screen.safeArea;
            return safe.Contains(p) && p.y <= safe.yMin + safe.height * touchZoneHeight;
        }

        void OnDrag(Vector2 start, Vector2 current)
        {
            if (!touchActive) return;
            validAim = ComputeLaunch(start, current, out Vector3 v0);
            if (!validAim)
            {
                arc.Hide();
                return;
            }
            int n = Ballistics.Predict(throwOrigin.position, v0, settings, Time.fixedDeltaTime, buffer, hitMask, killY,
                out bool didHit, out RaycastHit hit);
            TargetBoard tb = didHit ? hit.collider.GetComponentInParent<TargetBoard>() : null;
            bool onTarget = tb != null && !tb.IsDown;
            arc.Show(buffer, n, onTarget, onTarget ? hit.point : Vector3.zero, onTarget ? hit.normal : Vector3.up);
            lastPreviewVelocity = v0;
        }

        void OnDragEnd(Vector2 start, Vector2 end, float seconds)
        {
            if (!touchActive) return;
            touchActive = false;
            // Yalnız ekranda SON ÇİZİLEN yay atılır. Yay görünmüyorsa (eşik altı / iptal hareketi) atış yok.
            if (!validAim)
            {
                arc.Hide();
                AimCanceled?.Invoke();
                return;
            }
            Vector3 v0 = lastPreviewVelocity;
            validAim = false;
            pendingId = ++throwId;
            released = false;
            pendingVelocity = v0;
            pendingSettings = settings;      // rüzgâr dahil, atış anında dondurulur
            throwStartedAt = Time.time;
            EnsureHeldBall();
            anim.PlayThrow();                 // yay bırakma karesine kadar donuk kalır, sonra söner
        }

        void OnTouchEnded(Vector2 p)
        {
            if (!touchActive) return;         // DragEnded işlemediyse (hareketsiz dokunuş): atış yok
            touchActive = false;
            arc.Hide();
            AimCanceled?.Invoke();
        }

        void CancelAim()
        {
            bool was = touchActive;
            touchActive = false;
            validAim = false;
            if (!IsBusy && arc) arc.Hide();
            if (was) AimCanceled?.Invoke();
        }

        void OnPauseChanged(bool paused)
        {
            if (paused) CancelAim();
        }

        bool ComputeLaunch(Vector2 start, Vector2 current, out Vector3 v0)
        {
            v0 = default;
            float dpScale = (Screen.dpi > 1f ? Screen.dpi : 160f) / 160f;
            Vector2 d = (current - start) / dpScale;          // dp
            float pull = -d.y;                                  // aşağı çekme pozitif
            if (pull < minPullDp) return false;
            float power = Mathf.Clamp01((pull - minPullDp) / Mathf.Max(1f, maxPullDp - minPullDp));
            float side = Mathf.Clamp(d.x / Mathf.Max(1f, sideRangeDp), -1f, 1f);
            float yaw = (slingshotHorizontal ? -side : side) * maxYawDeg;
            float speed = Mathf.Lerp(minSpeed, maxSpeed, power);
            Vector3 fwd = aimReference.forward;
            fwd.y = 0f;
            if (fwd.sqrMagnitude < 1e-6f) fwd = Vector3.forward;
            Quaternion rot = Quaternion.LookRotation(fwd.normalized, Vector3.up) * Quaternion.Euler(-pitchDeg, yaw, 0f);
            v0 = rot * Vector3.forward * speed;
            return true;
        }

        // ---------------------------------------------------------------- bırakma
        /// <summary>Throw klibinin bırakma karesindeki Animation Event (AnimationEventRelay.ThrowRelease).</summary>
        public void OnReleaseEvent()
        {
            if (pendingId < 0 || released) return;   // iptal edilmiş atış ya da çift olay
            if (!aimEnabled)                           // etap bitti / nişan kapandı: top fırlatılmaz
            {
                CancelPending();
                return;
            }
            released = true;
            int id = pendingId;
            pendingId = -1;

            Vector3 origin = throwOrigin.position;
            int n = Ballistics.Predict(origin, pendingVelocity, pendingSettings, Time.fixedDeltaTime, buffer, hitMask, killY,
                out bool endsInHit, out _);
            var ball = heldBall != null ? heldBall : pool.Get();
            heldBall = null;
            ball.Launch(id, origin, pendingVelocity, pendingSettings, hitMask, killY, buffer, n, endsInHit);
            active.Add(ball);

            arc.FadeOut();
            Released?.Invoke(origin, pendingVelocity);
            if (nextBallRoutine != null) StopCoroutine(nextBallRoutine);
            nextBallRoutine = StartCoroutine(GiveNextBall());
        }

        IEnumerator GiveNextBall()
        {
            yield return new WaitForSeconds(nextBallDelay);
            nextBallRoutine = null;
            if (aimEnabled && pendingId < 0) EnsureHeldBall();
        }

        /// <summary>ThrowStateGuard.OnStateEnter: bu atış animasyonda; zaman aşımı buradan sayılır.</summary>
        public void OnThrowStateEnter()
        {
            throwStateActive = true;
            animThrowId = pendingId;
            throwStartedAt = Time.time;
        }

        /// <summary>ThrowStateGuard.OnStateExit: yalnız kendi atışı bırakılmadıysa iptal edilir.</summary>
        public void OnThrowStateExit()
        {
            throwStateActive = false;
            if (animThrowId >= 0) CancelPending(animThrowId);
            animThrowId = -1;
            if (aimEnabled && pendingId < 0) EnsureHeldBall();
        }

        /// <summary>Bekleyen atışı iptal eder. id verilirse yalnız o atış iptal edilir.</summary>
        public void CancelPending(int id = -1)
        {
            if (pendingId < 0 || released) return;
            if (id >= 0 && id != pendingId) return;
            pendingId = -1;
            anim.ClearThrow();
            if (arc) arc.Hide();
            AimCanceled?.Invoke();
        }

        void Update()
        {
            if (pendingId >= 0 && !released && Time.time - throwStartedAt > releaseTimeout)
            {
                CancelPending();
                throwStateActive = false;   // animasyon hiç girmediyse ya da takıldıysa kilit kalmasın
                animThrowId = -1;
            }
        }

        // ---------------------------------------------------------------- top olayları
        void OnBallContact(Ball ball, Collider other, Vector3 point, Vector3 normal)
        {
            if (logTrajectoryError && Debug.isDebugBuild)
                Debug.Log($"[Atış] önizleme sapması (temas öncesi en büyük): {ball.LastMaxError * 100f:F1} cm");

            var target = other ? other.GetComponentInParent<TargetBoard>() : null;
            if (target != null) TargetHit?.Invoke(target, point, normal);
            else Missed?.Invoke();
        }

        void OnBallFinished(Ball ball)
        {
            if (!ball.Contacted) Missed?.Invoke();       // hiçbir şeye değmeden düştü / süresi doldu
            active.Remove(ball);
            pool.Release(ball);
        }

        void EnsureHeldBall()
        {
            if (heldBall != null) return;
            heldBall = pool.Get();
            heldBall.Hold(handSocket);
        }
    }
}
