using System.Collections;
using UnityEngine;

namespace Ada.Bridge
{
    /// <summary>
    /// Platformun yalnız görsel durumları (parlama, kırılma). Doğru/yanlış bilgisi burada tutulmaz: BridgeController'da.
    /// Collider bu nesnede ya da çocuğunda, "Platform" katmanında olmalı.
    /// Parlama için malzemede Emission açık olmalı (URP Lit: _EMISSION anahtar kelimesi).
    /// </summary>
    public sealed class BridgePlatform : MonoBehaviour
    {
        [SerializeField] Renderer glowRenderer;
        [Tooltip("Üst yüzey merkezi. Boşsa transform konumu + topY kullanılır.")]
        [SerializeField] Transform landingPoint;
        [SerializeField] float topY = 0.55f;
        [Tooltip("Kırılma parçaları. Boşsa tüm platform eğilip batar.")]
        [SerializeField] Transform leftHalf, rightHalf;

        static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");
        MaterialPropertyBlock mpb;
        Vector3 rootPos, leftPos, rightPos;
        Quaternion rootRot, leftRot, rightRot;
        Coroutine breaking;

        public Vector3 LandingPoint => landingPoint
            ? landingPoint.position
            : new Vector3(transform.position.x, topY, transform.position.z);

        void Awake()
        {
            mpb = new MaterialPropertyBlock();
            rootPos = transform.localPosition; rootRot = transform.localRotation;
            if (leftHalf) { leftPos = leftHalf.localPosition; leftRot = leftHalf.localRotation; }
            if (rightHalf) { rightPos = rightHalf.localPosition; rightRot = rightHalf.localRotation; }
        }

        public IEnumerator Glow(Color color, float seconds)
        {
            SetEmission(color * 1.6f);
            yield return new WaitForSeconds(seconds * 0.8f);
            SetEmission(Color.black);
            yield return new WaitForSeconds(seconds * 0.2f);
        }

        void SetEmission(Color c)
        {
            if (!glowRenderer) return;
            glowRenderer.GetPropertyBlock(mpb);
            mpb.SetColor(EmissionColorId, c);
            glowRenderer.SetPropertyBlock(mpb);
        }

        public void Break()
        {
            if (breaking != null) StopCoroutine(breaking);
            breaking = StartCoroutine(BreakRoutine());
        }

        IEnumerator BreakRoutine()
        {
            const float dur = 0.6f;
            for (float t = 0f; t < 1f; t += Time.deltaTime / dur)
            {
                float e = t * t;
                if (leftHalf && rightHalf)
                {
                    leftHalf.localRotation = leftRot * Quaternion.Euler(0f, 0f, 35f * e);
                    rightHalf.localRotation = rightRot * Quaternion.Euler(0f, 0f, -35f * e);
                    leftHalf.localPosition = leftPos + new Vector3(-0.15f, -0.9f, 0f) * e;
                    rightHalf.localPosition = rightPos + new Vector3(0.15f, -0.9f, 0f) * e;
                }
                else
                {
                    transform.localRotation = rootRot * Quaternion.Euler(20f * e, 0f, 0f);
                    transform.localPosition = rootPos + Vector3.down * (0.9f * e);
                }
                yield return null;
            }
            breaking = null;
        }

        public void ResetVisual()
        {
            if (breaking != null) { StopCoroutine(breaking); breaking = null; }
            transform.localPosition = rootPos; transform.localRotation = rootRot;
            if (leftHalf) { leftHalf.localPosition = leftPos; leftHalf.localRotation = leftRot; }
            if (rightHalf) { rightHalf.localPosition = rightPos; rightHalf.localRotation = rightRot; }
            SetEmission(Color.black);
        }
    }
}
