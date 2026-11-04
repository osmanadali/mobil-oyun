using System;
using UnityEngine;

namespace Ada.Throw
{
    [Serializable]
    public struct BallisticsSettings
    {
        [Tooltip("Yerçekimi ivmesi (m/sn², pozitif).")] public float gravity;
        [Tooltip("Rüzgâr ivmesi (m/sn²). Atış anında dondurulur.")] public Vector3 wind;
        [Tooltip("Doğrusal sürükleme (1/sn).")] public float drag;
        [Tooltip("Top yarıçapı (m).")] public float radius;

        public static BallisticsSettings Default => new BallisticsSettings
        {
            gravity = 9.81f,
            wind = Vector3.zero,
            drag = 0.05f,
            radius = 0.11f
        };
    }

    /// <summary>
    /// Nişan önizlemesi ve gerçek top AYNI sabit adımlı entegrasyonu kullanır (yarı örtük Euler, 1/60 sn).
    /// Kare hızından bağımsızdır; aynı başlangıç koşulu → aynı yörünge.
    /// </summary>
    public static class Ballistics
    {
        public const float Step = 1f / 60f;

        public static void Advance(ref Vector3 pos, ref Vector3 vel, in BallisticsSettings s)
        {
            Vector3 acc = new Vector3(0f, -s.gravity, 0f) + s.wind - vel * s.drag;
            vel += acc * Step;
            pos += vel * Step;
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
            return Physics.SphereCast(from, radius, d / len, out hit, len, mask, QueryTriggerInteraction.Collide);
        }

        /// <summary>Yörünge noktalarını buffer'a yazar; çarpmada ya da minY altında durur. Nokta sayısını döndürür.</summary>
        public static int Predict(Vector3 pos, Vector3 vel, in BallisticsSettings s, Vector3[] buffer,
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
                Advance(ref pos, ref vel, s);
                if (Cast(prev, pos, s.radius, mask, out hit))
                {
                    buffer[n++] = hit.point;
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
