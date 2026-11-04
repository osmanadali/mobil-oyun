using System.Collections;
using UnityEngine;

namespace Ada.Throw
{
    /// <summary>Hedef tahtası: yanıp sönme ve devrilme. Collider "Target" katmanında, bu nesne ya da çocuğunda.</summary>
    public sealed class TargetBoard : MonoBehaviour
    {
        [SerializeField] Transform pivot;          // devrilme ekseni (tahtanın alt kenarı)
        [SerializeField] Renderer highlight;       // Emission açık malzeme
        [SerializeField] float fallSeconds = 0.25f;

        static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");
        MaterialPropertyBlock mpb;
        Quaternion pivotRest;

        public bool IsDown { get; private set; }

        void Awake()
        {
            mpb = new MaterialPropertyBlock();
            if (!pivot) pivot = transform;
            pivotRest = pivot.localRotation;
        }

        public IEnumerator Flash(Color color, float seconds)
        {
            SetEmission(color * 1.6f);
            yield return new WaitForSeconds(seconds * 0.8f);
            SetEmission(Color.black);
            yield return new WaitForSeconds(seconds * 0.2f);
        }

        public void KnockDown()
        {
            if (IsDown) return;
            IsDown = true;
            StartCoroutine(FallRoutine());
        }

        IEnumerator FallRoutine()
        {
            for (float t = 0f; t < 1f; t += Time.deltaTime / fallSeconds)
            {
                float e = 1f - (1f - t) * (1f - t);
                pivot.localRotation = pivotRest * Quaternion.Euler(-85f * e, 0f, 0f);
                yield return null;
            }
            pivot.localRotation = pivotRest * Quaternion.Euler(-85f, 0f, 0f);
        }

        public void ResetBoard()
        {
            StopAllCoroutines();
            IsDown = false;
            pivot.localRotation = pivotRest;
            SetEmission(Color.black);
        }

        void SetEmission(Color c)
        {
            if (!highlight) return;
            highlight.GetPropertyBlock(mpb);
            mpb.SetColor(EmissionColorId, c);
            highlight.SetPropertyBlock(mpb);
        }
    }
}
