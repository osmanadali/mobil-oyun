using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Pool;
using Ada.Core;
using Ada.InputLayer;
using Ada.Player;

namespace Ada.Throw
{
    /// <summary>
    /// Nişan (yukarı sürükleme), önizleme, atış animasyonu ve bırakma olayı.
    /// - Top bırakma karesine kadar HandSocket'ta durur.
    /// - Bırakma, Throw klibindeki Animation Event ile gelir (AnimationEventRelay.ThrowRelease).
    /// - Atış kimliği + released bayrağı çift top üretimini engeller; bırakmadan önce kesilen atış temizlenir.
    /// - Önizleme ve gerçek top aynı başlangıç noktası (ThrowOrigin), hız, ayar ve Ballistics hesabını kullanır.
    /// </summary>
    public sealed class ThrowController : MonoBehaviour
    {
        [Header("Bağlantılar")]
        [SerializeField] TouchInput input;
        [SerializeField] PlayerAnimatorBridge anim;
        [Tooltip("Sağ el kemiğinin çocuğu.")]
        [SerializeField] Transform handSocket;
        [Tooltip("PlayerRoot çocuğu, sabit nokta: Throw klibinin bırakma karesindeki el konumuna hizalayın.")]
        [SerializeField] Transform throwOrigin;
        [Tooltip("Nişan yönü referansı (genelde PlayerRoot).")]
        [SerializeField] Transform aimReference;
        [SerializeField] Ball ballPrefab;
        [SerializeField] LineRenderer preview;
        [SerializeField] LayerMask hitMask;

        [Header("Nişan")]
        [SerializeField] float maxYawDeg = 25f;
        [SerializeField] float pitchDeg = 28f;
        [SerializeField] float minSpeed = 7f;
        [SerializeField] float maxSpeed = 15f;
        [SerializeField] float fullPowerDragDp = 260f;
        [SerializeField] float minDragDp = 24f;
        [SerializeField] int previewSteps = 90;
        [SerializeField] float killY = -0.5f;
        [Tooltip("Bırakma olayı bu süre içinde gelmezse atış iptal edilir (kilitlenme koruması).")]
        [SerializeField] float releaseTimeout = 1.2f;
        [SerializeField] float nextBallDelay = 0.35f;

        public BallisticsSettings settings = BallisticsSettings.Default;

        /// <summary>Bırakma anı: ses, parçacık, kamera bu tek olaydan beslenir.</summary>
        public event Action<Vector3, Vector3> Released;   // konum, hız
        public event Action<TargetBoard> TargetHit;
        public event Action Missed;

        bool aimEnabled, dragging, released;
        int throwId, pendingId = -1;
        Vector3 pendingVelocity;
        BallisticsSettings pendingSettings;
        float throwStartedAt;
        Ball heldBall;
        ObjectPool<Ball> pool;
        Vector3[] buffer;

        public bool IsBusy => pendingId >= 0;

        void Awake()
        {
            buffer = new Vector3[Mathf.Max(2, previewSteps)];
            pool = new ObjectPool<Ball>(
                createFunc: () =>
                {
                    var b = Instantiate(ballPrefab);
                    b.HitSomething += OnBallHit;
                    b.Expired += OnBallExpired;
                    return b;
                },
                actionOnGet: b => b.gameObject.SetActive(true),
                actionOnRelease: b => b.gameObject.SetActive(false),
                actionOnDestroy: b => { if (b) Destroy(b.gameObject); },
                collectionCheck: true,
                defaultCapacity: 4,
                maxSize: 8);
            if (preview) preview.enabled = false;
        }

        void OnEnable()
        {
            input.Dragging += OnDrag;
            input.DragEnded += OnDragEnd;
            GameClock.PauseChanged += OnPauseChanged;
        }

        void OnDisable()
        {
            input.Dragging -= OnDrag;
            input.DragEnded -= OnDragEnd;
            GameClock.PauseChanged -= OnPauseChanged;
        }

        public void BeginAiming()
        {
            aimEnabled = true;
            anim.SetAiming(true);
            EnsureHeldBall();
        }

        public void EndAiming()
        {
            aimEnabled = false;
            dragging = false;
            if (preview) preview.enabled = false;
            anim.SetAiming(false);
            CancelPending();
            ReturnHeldBall();
        }

        void OnPauseChanged(bool paused)
        {
            if (!paused) return;
            dragging = false;
            if (preview) preview.enabled = false;
        }

        bool ComputeLaunch(Vector2 a, Vector2 b, out Vector3 v0)
        {
            v0 = default;
            float dpScale = (Screen.dpi > 1f ? Screen.dpi : 160f) / 160f;
            Vector2 d = b - a;
            if (d.y < minDragDp * dpScale) return false;               // yukarı sürükleme gerekli
            float power = Mathf.Clamp01(d.magnitude / (fullPowerDragDp * dpScale));
            float yaw = Mathf.Clamp(Mathf.Atan2(d.x, d.y) * Mathf.Rad2Deg, -maxYawDeg, maxYawDeg);
            float speed = Mathf.Lerp(minSpeed, maxSpeed, power);
            Vector3 fwd = aimReference.forward;
            fwd.y = 0f;
            if (fwd.sqrMagnitude < 1e-6f) fwd = Vector3.forward;
            Quaternion rot = Quaternion.LookRotation(fwd.normalized, Vector3.up) * Quaternion.Euler(-pitchDeg, yaw, 0f);
            v0 = rot * Vector3.forward * speed;
            return true;
        }

        void OnDrag(Vector2 a, Vector2 b)
        {
            if (!aimEnabled || IsBusy) return;
            if (!ComputeLaunch(a, b, out Vector3 v0))
            {
                dragging = false;
                if (preview) preview.enabled = false;
                return;
            }
            dragging = true;
            if (!preview) return;
            int n = Ballistics.Predict(throwOrigin.position, v0, settings, buffer, hitMask, killY, out _, out _);
            preview.positionCount = n;
            for (int i = 0; i < n; i++) preview.SetPosition(i, buffer[i]);
            preview.enabled = true;
        }

        void OnDragEnd(Vector2 a, Vector2 b, float seconds)
        {
            if (!aimEnabled || !dragging || IsBusy) return;
            dragging = false;
            if (preview) preview.enabled = false;
            if (!ComputeLaunch(a, b, out Vector3 v0)) return;

            pendingId = ++throwId;
            released = false;
            pendingVelocity = v0;
            pendingSettings = settings;   // rüzgâr dahil, atış anında dondurulur
            throwStartedAt = Time.time;
            EnsureHeldBall();
            anim.PlayThrow();
        }

        /// <summary>Throw klibinin bırakma karesindeki Animation Event (AnimationEventRelay üzerinden).</summary>
        public void OnReleaseEvent()
        {
            if (pendingId < 0 || released) return;   // iptal edilmiş atış ya da çift olay
            released = true;
            int id = pendingId;
            pendingId = -1;

            var ball = heldBall != null ? heldBall : pool.Get();
            heldBall = null;
            ball.Launch(throwOrigin.position, pendingVelocity, pendingSettings, hitMask, killY);
            Released?.Invoke(throwOrigin.position, pendingVelocity);
            StartCoroutine(GiveNextBall(id));
        }

        IEnumerator GiveNextBall(int id)
        {
            yield return new WaitForSeconds(nextBallDelay);
            if (aimEnabled && pendingId < 0 && id == throwId) EnsureHeldBall();
        }

        /// <summary>Bırakmadan önce animasyon kesildiğinde (ThrowStateGuard) ya da zaman aşımında çağrılır.</summary>
        public void CancelPending()
        {
            if (pendingId < 0 || released) return;
            pendingId = -1;
            anim.ClearThrow();
        }

        void Update()
        {
            if (pendingId >= 0 && !released && Time.time - throwStartedAt > releaseTimeout) CancelPending();
        }

        void EnsureHeldBall()
        {
            if (heldBall != null) return;
            heldBall = pool.Get();
            heldBall.Hold(handSocket);
        }

        void ReturnHeldBall()
        {
            if (heldBall == null) return;
            pool.Release(heldBall);
            heldBall = null;
        }

        void OnBallHit(Ball b, RaycastHit hit)
        {
            var target = hit.collider.GetComponentInParent<TargetBoard>();
            if (target != null) TargetHit?.Invoke(target);
            else Missed?.Invoke();
            StartCoroutine(ReturnLater(b, 0.4f));
        }

        void OnBallExpired(Ball b)
        {
            Missed?.Invoke();
            pool.Release(b);
        }

        IEnumerator ReturnLater(Ball b, float seconds)
        {
            yield return new WaitForSeconds(seconds);
            if (b && b.gameObject.activeSelf && !b.IsFlying) pool.Release(b);
        }
    }
}
