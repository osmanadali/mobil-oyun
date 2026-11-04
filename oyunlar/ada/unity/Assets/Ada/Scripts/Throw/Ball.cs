using System;
using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Havuzlanan top: Rigidbody + SphereCollider (+ isteğe bağlı kısa TrailRenderer).
    /// - Elde: kinematik, collider kapalı, HandSocket'in çocuğu.
    /// - Uçuşta: uçuşu YALNIZ Rigidbody yönetir (Transform'la taşınmaz). useGravity kapalı, linearDamping 0;
    ///   yerçekimi + rüzgâr + sürükleme Ballistics.Acceleration ile her FixedUpdate'te uygulanır.
    /// - İnce hedeflerden geçmemek için ContinuousDynamic çarpışma algılama.
    /// Geliştirme yapılarında önizlemeye göre en büyük sapmayı ölçer (LastMaxError).
    /// </summary>
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class Ball : MonoBehaviour
    {
        public event Action<Ball, Collision> FirstContact;
        public event Action<Ball> Finished;

        [SerializeField] TrailRenderer trail;
        [SerializeField] float maxLifeSeconds = 5f;
        [SerializeField] float lingerAfterContact = 0.8f;

        const int MaxPrediction = 256;

        Rigidbody rb;
        SphereCollider col;
        BallisticsSettings settings;
        float killY, launchTime, contactTime;
        bool active;

        readonly Vector3[] predicted = new Vector3[MaxPrediction];
        int predictedCount, step;

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

        public void Launch(int throwId, Vector3 position, Vector3 velocity, in BallisticsSettings s, float minY,
            Vector3[] prediction, int predictionCount)
        {
            ThrowId = throwId;
            transform.SetParent(null, true);
            transform.position = position;
            rb.position = position;
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
            LastMaxError = 0f;
            step = 0;
            predictedCount = 0;
            if (prediction != null)
            {
                predictedCount = Mathf.Min(predictionCount, MaxPrediction);
                Array.Copy(prediction, predicted, predictedCount);
            }
            if (trail)
            {
                trail.Clear();
                trail.emitting = true;
            }
        }

        void FixedUpdate()
        {
            if (!active) return;

            // Bu FixedUpdate, launch'tan sonraki 'step'. fizik adımından önce çalışır → konum predicted[step] olmalı.
            if (!Contacted && step < predictedCount)
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
            if (!active || Contacted) return;
            Contacted = true;
            contactTime = Time.time;
            if (trail) trail.emitting = false;
            FirstContact?.Invoke(this, collision);
        }

        void Finish()
        {
            active = false;
            if (trail) trail.emitting = false;
            Finished?.Invoke(this);
        }
    }
}
