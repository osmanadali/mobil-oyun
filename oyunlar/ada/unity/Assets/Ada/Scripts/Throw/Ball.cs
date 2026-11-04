using System;
using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Havuzlanan top: Rigidbody + SphereCollider (+ isteğe bağlı kısa TrailRenderer).
    /// - Elde: kinematik, collider kapalı, HandSocket'in çocuğu.
    /// - Uçuşta: uçuşu YALNIZ Rigidbody yönetir (Transform'la taşınmaz). useGravity kapalı, linearDamping 0;
    ///   yerçekimi + rüzgâr + sürükleme Ballistics.Acceleration ile her FixedUpdate'te uygulanır.
    /// - İnce hedeflerden geçmemek için ContinuousDynamic. excludeLayers = ~hitMask: top yalnız önizlemenin
    ///   gördüğü katmanlara çarpar (yayın görmediği bir collider topu durduramaz).
    /// - Aynı fizik adımındaki temaslar biriktirilir; hedef teması çevre temasına göre önceliklidir.
    ///   İlk temas bir sonraki FixedUpdate başında TEK kez yayılır.
    /// Geliştirme yapılarında önizlemeye göre en büyük sapmayı ölçer (LastMaxError).
    /// </summary>
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class Ball : MonoBehaviour
    {
        /// <summary>top, temas edilen collider, temas noktası, yüzey normali</summary>
        public event Action<Ball, Collider, Vector3, Vector3> FirstContact;
        public event Action<Ball> Finished;

        [SerializeField] TrailRenderer trail;
        [SerializeField] float maxLifeSeconds = 5f;
        [SerializeField] float lingerAfterContact = 0.8f;

        const int MaxPrediction = 256;

        Rigidbody rb;
        SphereCollider col;
        BallisticsSettings settings;
        float killY, launchTime, contactTime;
        bool active, dispatched;

        bool hasPending, pendingIsTarget;
        Collider pendingCollider;
        Vector3 pendingPoint, pendingNormal;

        readonly Vector3[] predicted = new Vector3[MaxPrediction];
        int comparableCount, step;

        public int ThrowId { get; private set; }
        public bool IsActive => active;
        public bool Contacted { get; private set; }
        /// <summary>İlk temasa kadar ölçülen en büyük önizleme sapması (m).</summary>
        public float LastMaxError { get; private set; }

        void Awake()
        {
            rb = GetComponent<Rigidbody>();
            col = GetComponent<SphereCollider>();
            rb.useGravity = false;
            rb.linearDamping = 0f;
            rb.angularDamping = 0.5f;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
        }

        public void Hold(Transform socket)
        {
            active = false;
            Contacted = false;
            hasPending = false;
            dispatched = false;
            // Kinematik gövde yalnız Speculative CCD destekler: önce modu değiştir, sonra kinematik yap.
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
            rb.isKinematic = true;
            col.enabled = false;
            transform.SetParent(socket, false);
            transform.localPosition = Vector3.zero;
            transform.localRotation = Quaternion.identity;
            if (trail)
            {
                trail.emitting = false;
                trail.Clear();
            }
        }

        /// <param name="prediction">Önizleme noktaları (aynı başlangıç/hız/ayar ile hesaplanmış).</param>
        /// <param name="predictionEndsInHit">Son nokta bir adım değil temas merkeziyse true (karşılaştırmaya girmez).</param>
        public void Launch(int throwId, Vector3 position, Vector3 velocity, in BallisticsSettings s, LayerMask hitMask,
            float minY, Vector3[] prediction, int predictionCount, bool predictionEndsInHit)
        {
            ThrowId = throwId;
            transform.SetParent(null, true);
            transform.position = position;
            rb.position = position;
            rb.excludeLayers = ~hitMask;
            rb.isKinematic = false;
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            rb.linearVelocity = velocity;
            rb.angularVelocity = Vector3.zero;
            col.enabled = true;

            settings = s;
            killY = minY;
            launchTime = Time.time;
            active = true;
            Contacted = false;
            hasPending = false;
            dispatched = false;
            LastMaxError = 0f;
            step = 0;
            comparableCount = 0;
            if (prediction != null)
            {
                int n = Mathf.Min(predictionCount, MaxPrediction);
                Array.Copy(prediction, predicted, n);
                comparableCount = predictionEndsInHit ? n - 1 : n;
            }
            if (trail)
            {
                trail.Clear();
                trail.emitting = true;
            }

            // Animator 'Animate Physics' modundaysa olay script FixedUpdate'lerinden SONRA, fizik adımından ÖNCE gelir:
            // ilk adımın ivmesini hemen uygula ki yörünge önizlemeyle aynı kalsın.
            if (Time.inFixedTimeStep)
            {
                rb.AddForce(Ballistics.Acceleration(velocity, s), ForceMode.Acceleration);
                step = 1;
            }
        }

        void FixedUpdate()
        {
            if (!active) return;

            if (hasPending && !dispatched)
            {
                dispatched = true;
                FirstContact?.Invoke(this, pendingCollider, pendingPoint, pendingNormal);
                if (!active) return; // dinleyici topu havuza geri vermiş olabilir
            }

            // Bu FixedUpdate, fizik adımından önce çalışır → konum predicted[step] olmalı.
            if (!Contacted && step < comparableCount)
                LastMaxError = Mathf.Max(LastMaxError, Vector3.Distance(rb.position, predicted[step]));
            step++;

            rb.AddForce(Ballistics.Acceleration(rb.linearVelocity, settings), ForceMode.Acceleration);

            bool expired = Time.time - launchTime > maxLifeSeconds
                           || rb.position.y < killY
                           || (Contacted && Time.time - contactTime > lingerAfterContact);
            if (expired) Finish();
        }

        void OnCollisionEnter(Collision collision)
        {
            if (!active || dispatched) return;
            bool isTarget = collision.collider.GetComponentInParent<TargetBoard>() != null;
            if (hasPending && (pendingIsTarget || !isTarget)) return;   // aynı adımda hedef teması önceliklidir

            Vector3 point, normal;
            if (collision.contactCount > 0)
            {
                ContactPoint cp = collision.GetContact(0);
                point = cp.point;
                normal = cp.normal;
            }
            else
            {
                point = rb.position;
                Vector3 v = rb.linearVelocity;
                normal = v.sqrMagnitude > 1e-6f ? -v.normalized : Vector3.up;
            }

            hasPending = true;
            pendingIsTarget = isTarget;
            pendingCollider = collision.collider;
            pendingPoint = point;
            pendingNormal = normal;
            if (!Contacted)
            {
                Contacted = true;
                contactTime = Time.time;
                if (trail) trail.emitting = false;
            }
        }

        void Finish()
        {
            if (hasPending && !dispatched)
            {
                dispatched = true;
                FirstContact?.Invoke(this, pendingCollider, pendingPoint, pendingNormal);
            }
            active = false;
            if (trail) trail.emitting = false;
            Finished?.Invoke(this);
        }
    }
}
