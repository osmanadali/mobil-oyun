using System;
using UnityEngine;

namespace Ada.Throw
{
    [Serializable]
    public struct BallisticsSettings
    {
        [Tooltip("Yerçekimi ivmesi (m/sn², pozitif). Rigidbody.useGravity kapalı; bu değer kodla uygulanır.")]
        public float gravity;
        [Tooltip("Rüzgâr ivmesi (m/sn²). Atış anında dondurulur.")]
        public Vector3 wind;
        [Tooltip("Doğrusal sürükleme (1/sn): a = -drag·v. Rigidbody.linearDamping 0 tutulur.")]
        public float drag;
        [Tooltip("Top yarıçapı (m). SphereCollider ile aynı olmalı.")]
        public float radius;

        public static BallisticsSettings Default => new BallisticsSettings
        {
            gravity = 9.81f,
            wind = Vector3.zero,
            drag = 0.08f,
            radius = 0.11f
        };
    }

    /// <summary>
    /// Önizleme ile gerçek top aynı hareket modelini kullanır:
    ///   a(v) = (0, -g, 0) + rüzgâr - drag·v
    ///   v ← v + a(v)·dt ;  x ← x + v·dt     (yarı örtük Euler; PhysX'in gövde entegrasyonuyla aynı sıra)
    /// Gerçek topta a(v), her FixedUpdate'te Rigidbody.AddForce(..., ForceMode.Acceleration) ile verilir;
    /// önizleme dt = Time.fixedDeltaTime ile aynı adımları hesaplar. Gizli düzeltme ya da hedefe yapışma yoktur.
    /// </summary>
    public static class Ballistics
    {
        public static Vector3 Acceleration(Vector3 velocity, in BallisticsSettings s)
            => new Vector3(0f, -s.gravity, 0f) + s.wind - velocity * s.drag;

        public static void Advance(ref Vector3 pos, ref Vector3 vel, in BallisticsSettings s, float dt)
        {
            vel += Acceleration(vel, s) * dt;
            pos += vel * dt;
        }

        public static bool Cast(Vector3 from, Vector3 to, float radius, LayerMask mask, out RaycastHit hit)
        {
            Vector3 d = to - from;
            float len = d.magnitude;
            if (len < 1e-5f)
            {
                hit = default;
                return false;
            }
            return Physics.SphereCast(from, radius, d / len, out hit, len, mask, QueryTriggerInteraction.Ignore);
        }

        /// <summary>
        /// Yörünge noktalarını buffer'a yazar; ilk gerçek çarpışmada (ya da minY altında) durur, hedefin arkasına devam etmez.
        /// Dönen değer nokta sayısıdır. Bellek ayırmaz.
        /// </summary>
        public static int Predict(Vector3 pos, Vector3 vel, in BallisticsSettings s, float dt, Vector3[] buffer,
            LayerMask mask, float minY, out bool didHit, out RaycastHit hit)
        {
            didHit = false;
            hit = default;
            if (buffer == null || buffer.Length == 0) return 0;
            int n = 0;
            buffer[n++] = pos;
            while (n < buffer.Length)
            {
                Vector3 prev = pos;
                Advance(ref pos, ref vel, s, dt);
                if (Cast(prev, pos, s.radius, mask, out hit))
                {
                    buffer[n++] = hit.point + hit.normal * s.radius;
                    didHit = true;
                    return n;
                }
                buffer[n++] = pos;
                if (pos.y < minY) return n;
            }
            return n;
        }
    }
}
