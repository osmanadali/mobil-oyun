using UnityEngine;

namespace Ada.Effects
{
    /// <summary>
    /// Sabit boyutlu halka tampon parçacık havuzu: oyun sırasında bellek ayırmaz, efektler birikmez
    /// (en eski örnek yeniden kullanılır). Prefab: Play On Awake kapalı, Stop Action None.
    /// </summary>
    public sealed class FxPool : MonoBehaviour
    {
        [SerializeField] ParticleSystem prefab;
        [SerializeField] [Range(1, 8)] int size = 3;

        ParticleSystem[] items;
        int next;

        void Awake()
        {
            items = new ParticleSystem[size];
            for (int i = 0; i < size; i++)
            {
                items[i] = Instantiate(prefab, transform);
                items[i].Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            }
        }

        public void Play(Vector3 position, Vector3 normal)
        {
            var ps = items[next];
            next = (next + 1) % items.Length;
            Quaternion rot = normal.sqrMagnitude > 1e-6f ? Quaternion.LookRotation(normal) : Quaternion.identity;
            ps.transform.SetPositionAndRotation(position, rot);
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            ps.Play(true);
        }

        public void StopAll()
        {
            if (items == null) return;
            for (int i = 0; i < items.Length; i++) items[i].Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
        }
    }
}
