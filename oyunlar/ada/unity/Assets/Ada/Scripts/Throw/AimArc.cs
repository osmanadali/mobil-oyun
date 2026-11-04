using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Yarı saydam beyaz nişan yayı (atıştan önceki gelecekteki yol). Topun hareket izinden (TrailRenderer) ayrı sistemdir.
    /// - İnce, süt beyazı, ~%35–50 opaklık; kenarları yumuşak (çalışma anında üretilen yumuşak doku).
    /// - Yay üzerinde seyrek küçük yumuşak noktalar.
    /// - Geçerli hedef üzerinde küçük beyaz halka.
    /// - FadeOut: top elden çıkınca ~0,12 sn'de söner.
    /// Malzemeler: URP "Particles/Unlit", Surface Transparent, Blend Alpha (bkz. FINAL_ATIS.md). Bellek ayırmaz.
    /// </summary>
    public sealed class AimArc : MonoBehaviour
    {
        [SerializeField] LineRenderer line;
        [Tooltip("Küçük nokta: Quad + yumuşak nokta malzemesi. Collider olmamalı.")]
        [SerializeField] Renderer dotPrefab;
        [SerializeField] Transform targetRing;
        [SerializeField] Camera cam;

        [SerializeField] [Range(0f, 1f)] float opacity = 0.42f;
        [SerializeField] [Range(0f, 1f)] float dotOpacity = 0.75f;
        [SerializeField] float lineWidth = 0.045f;
        [SerializeField] int maxDots = 14;
        [SerializeField] float firstDotDistance = 0.6f;
        [SerializeField] float dotSpacing = 0.75f;
        [SerializeField] float dotSize = 0.07f;
        [SerializeField] float fadeSeconds = 0.12f;

        static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        static readonly int BaseMapId = Shader.PropertyToID("_BaseMap");

        Renderer[] dots;
        MaterialPropertyBlock mpb;
        Vector3[] points = new Vector3[256];
        int count;
        float alpha, fadeT = -1f;
        bool visible;

        void Awake()
        {
            mpb = new MaterialPropertyBlock();
            line.useWorldSpace = true;
            line.widthMultiplier = lineWidth;
            line.textureMode = LineTextureMode.Stretch;
            line.numCapVertices = 4;
            // Genişlik boyunca yumuşak kenar dokusu (kenarlar saydam, orta beyaz).
            line.material.SetTexture(BaseMapId, MakeSoftLineTexture());

            dots = new Renderer[maxDots];
            var dotTex = MakeSoftDotTexture();
            for (int i = 0; i < maxDots; i++)
            {
                dots[i] = Instantiate(dotPrefab, transform);
                dots[i].transform.localScale = Vector3.one * dotSize;
                dots[i].GetPropertyBlock(mpb);
                mpb.SetTexture(BaseMapId, dotTex);
                dots[i].SetPropertyBlock(mpb);
                dots[i].enabled = false;
            }
            if (targetRing) targetRing.gameObject.SetActive(false);
            SetVisible(false);
        }

        /// <summary>Yayı günceller. hitTarget: yay geçerli bir hedefte bitiyorsa halka gösterilir.</summary>
        public void Show(Vector3[] path, int n, bool hitTarget, Vector3 hitPoint, Vector3 hitNormal)
        {
            fadeT = -1f;
            count = Mathf.Min(n, points.Length);
            System.Array.Copy(path, points, count);
            line.positionCount = count;
            for (int i = 0; i < count; i++) line.SetPosition(i, points[i]);
            PlaceDots();
            if (targetRing)
            {
                targetRing.gameObject.SetActive(hitTarget);
                if (hitTarget)
                {
                    targetRing.position = hitPoint + hitNormal * 0.01f;
                    // Unity Quad'ı -Z yönüne bakar: halkayı yüzey normaline çevir.
                    targetRing.rotation = Quaternion.LookRotation(-hitNormal, Vector3.up);
                }
            }
            alpha = 1f;
            ApplyAlpha();
            SetVisible(true);
        }

        public void Hide()
        {
            fadeT = -1f;
            SetVisible(false);
        }

        /// <summary>Top elden çıktı: yay kısa sürede söner.</summary>
        public void FadeOut()
        {
            if (!visible) return;
            fadeT = 0f;
            if (targetRing) targetRing.gameObject.SetActive(false);
        }

        void Update()
        {
            if (fadeT < 0f) return;
            fadeT += Time.deltaTime / Mathf.Max(0.01f, fadeSeconds);
            alpha = Mathf.Clamp01(1f - fadeT);
            ApplyAlpha();
            if (fadeT >= 1f) Hide();
        }

        void LateUpdate()
        {
            if (!visible || cam == null) return;
            Quaternion face = Quaternion.LookRotation(cam.transform.forward, cam.transform.up);
            for (int i = 0; i < dots.Length; i++)
                if (dots[i].enabled) dots[i].transform.rotation = face;
        }

        void PlaceDots()
        {
            int d = 0;
            float next = firstDotDistance, travelled = 0f;
            for (int i = 1; i < count && d < dots.Length; i++)
            {
                Vector3 a = points[i - 1], b = points[i];
                float seg = Vector3.Distance(a, b);
                while (d < dots.Length && travelled + seg >= next)
                {
                    float t = seg > 1e-5f ? (next - travelled) / seg : 0f;
                    dots[d].transform.position = Vector3.Lerp(a, b, t);
                    dots[d].enabled = true;
                    d++;
                    next += dotSpacing;
                }
                travelled += seg;
            }
            for (; d < dots.Length; d++) dots[d].enabled = false;
        }

        void ApplyAlpha()
        {
            Color c = new Color(1f, 1f, 1f, opacity * alpha);
            line.startColor = c;
            line.endColor = new Color(1f, 1f, 1f, opacity * alpha * 0.85f);
            Color dc = new Color(1f, 1f, 1f, dotOpacity * alpha);
            for (int i = 0; i < dots.Length; i++)
            {
                if (!dots[i].enabled) continue;
                dots[i].GetPropertyBlock(mpb);
                mpb.SetColor(BaseColorId, dc);
                dots[i].SetPropertyBlock(mpb);
            }
        }

        void SetVisible(bool on)
        {
            visible = on;
            line.enabled = on;
            if (!on)
            {
                for (int i = 0; i < dots.Length; i++) dots[i].enabled = false;
                if (targetRing) targetRing.gameObject.SetActive(false);
            }
        }

        static Texture2D MakeSoftLineTexture()
        {
            const int h = 32;
            var tex = new Texture2D(4, h, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "AimArcSoftLine" };
            for (int y = 0; y < h; y++)
            {
                float v = Mathf.Abs((y + 0.5f) / h * 2f - 1f);           // 0 orta, 1 kenar
                float a = Mathf.SmoothStep(1f, 0f, Mathf.InverseLerp(0.35f, 1f, v));
                for (int x = 0; x < 4; x++) tex.SetPixel(x, y, new Color(1f, 1f, 1f, a));
            }
            tex.Apply(false, true);
            return tex;
        }

        static Texture2D MakeSoftDotTexture()
        {
            const int s = 32;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "AimArcSoftDot" };
            for (int y = 0; y < s; y++)
            for (int x = 0; x < s; x++)
            {
                float dx = (x + 0.5f) / s * 2f - 1f, dy = (y + 0.5f) / s * 2f - 1f;
                float r = Mathf.Sqrt(dx * dx + dy * dy);
                tex.SetPixel(x, y, new Color(1f, 1f, 1f, Mathf.SmoothStep(1f, 0f, Mathf.InverseLerp(0.45f, 1f, r))));
            }
            tex.Apply(false, true);
            return tex;
        }
    }
}
