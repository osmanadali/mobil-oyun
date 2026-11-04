using System;
using System.Collections;
using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Menteşeli hedef diski. Fiziksel isabet (top çarpışması) RegisterHit ile bildirilir; hedef yalnız BİR kez sayılır.
    /// Devrilme serbest fizik değil, kontrollü: menteşe ekseninde kısa geri tepki + geriye devrilme (ease-out-back).
    /// Kurulum: 'hinge' diskin alt kenarında; yerel +X disk genişliği boyunca, +Z oyuncudan UZAĞA bakar.
    /// Collider diskte, "Target" katmanında. Devrildikten sonra da collider kalır (sonraki toplar sekip düşer, puan vermez).
    /// </summary>
    public sealed class TargetBoard : MonoBehaviour
    {
        [SerializeField] Transform hinge;
        [Tooltip("0 sol, 1 orta, 2 sağ: üstteki hedef simgesiyle eşleşir.")]
        [SerializeField] int slotIndex;
        [SerializeField] float fallDeg = 82f;
        [SerializeField] float fallSeconds = 0.32f;
        [SerializeField] Renderer flashRenderer;   // Emission açık malzeme (dizi modunda yanıp sönme)

        static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");
        MaterialPropertyBlock mpb;
        Quaternion hingeRest;
        Coroutine anim;

        public int SlotIndex => slotIndex;
        public bool IsDown { get; private set; }

        /// <summary>İlk sayılan isabet. Tekrar temaslar puan vermez.</summary>
        public event Action<TargetBoard, Vector3> Knocked;

        void Awake()
        {
            mpb = new MaterialPropertyBlock();
            if (!hinge) hinge = transform;
            hingeRest = hinge.localRotation;
        }

        /// <summary>Topun hedefe fiziksel temasında çağrılır. true: bu isabet sayıldı.</summary>
        public bool RegisterHit(Vector3 point)
        {
            if (IsDown) return false;
            IsDown = true;
            if (anim != null) StopCoroutine(anim);
            anim = StartCoroutine(FallRoutine());
            Knocked?.Invoke(this, point);
            return true;
        }

        IEnumerator FallRoutine()
        {
            const float s = 1.70158f;   // ease-out-back aşımı
            for (float t = 0f; t < 1f; t += Time.deltaTime / fallSeconds)
            {
                float x = t - 1f;
                float e = 1f + (s + 1f) * x * x * x + s * x * x;
                hinge.localRotation = hingeRest * Quaternion.Euler(fallDeg * e, 0f, 0f);
                yield return null;
            }
            hinge.localRotation = hingeRest * Quaternion.Euler(fallDeg, 0f, 0f);
            anim = null;
        }

        public IEnumerator Flash(Color color, float seconds)
        {
            SetEmission(color * 1.6f);
            yield return new WaitForSeconds(seconds * 0.8f);
            SetEmission(Color.black);
            yield return new WaitForSeconds(seconds * 0.2f);
        }

        public void ResetBoard()
        {
            if (anim != null) { StopCoroutine(anim); anim = null; }
            IsDown = false;
            hinge.localRotation = hingeRest;
            SetEmission(Color.black);
        }

        void SetEmission(Color c)
        {
            if (!flashRenderer) return;
            flashRenderer.GetPropertyBlock(mpb);
            mpb.SetColor(EmissionColorId, c);
            flashRenderer.SetPropertyBlock(mpb);
        }
    }
}
