using System;
using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Havuzlanan top. Elde tutulur (HandSocket), bırakılınca Ballistics ile ilerler.
    /// Rigidbody yok: önizlemeyle birebir aynı yörünge için hareket kodla, sabit adımla yapılır.
    /// </summary>
    public sealed class Ball : MonoBehaviour
    {
        public event Action<Ball, RaycastHit> HitSomething;
        public event Action<Ball> Expired;

        [SerializeField] float maxLifeSeconds = 6f;

        Vector3 velocity;
        BallisticsSettings settings;
        LayerMask mask;
        float accumulator, life, killY;
        bool flying;

        public bool IsFlying => flying;

        public void Hold(Transform socket)
        {
            flying = false;
            transform.SetParent(socket, false);
            transform.localPosition = Vector3.zero;
            transform.localRotation = Quaternion.identity;
        }

        public void Launch(Vector3 position, Vector3 initialVelocity, in BallisticsSettings s, LayerMask hitMask, float minY)
        {
            transform.SetParent(null, true);
            transform.position = position;
            velocity = initialVelocity;
            settings = s;
            mask = hitMask;
            killY = minY;
            accumulator = 0f;
            life = 0f;
            flying = true;
        }

        void Update()
        {
            if (!flying) return;
            float dt = Time.deltaTime;
            accumulator += dt;
            life += dt;
            Vector3 p = transform.position;
            while (accumulator >= Ballistics.Step)
            {
                accumulator -= Ballistics.Step;
                Vector3 prev = p;
                Ballistics.Advance(ref p, ref velocity, settings);
                if (Ballistics.Cast(prev, p, settings.radius, mask, out RaycastHit hit))
                {
                    transform.position = hit.point + hit.normal * settings.radius;
                    flying = false;
                    HitSomething?.Invoke(this, hit);
                    return;
                }
                if (p.y < killY || life > maxLifeSeconds)
                {
                    transform.position = p;
                    flying = false;
                    Expired?.Invoke(this);
                    return;
                }
            }
            transform.position = p;
        }
    }
}
