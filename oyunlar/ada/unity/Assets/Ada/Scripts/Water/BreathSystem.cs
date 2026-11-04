using System;
using UnityEngine;

namespace Ada.Water
{
    /// <summary>Nefes kaynağı. Su altındayken azalır, yüzeyde dolar. Oyun saatiyle ilerler (duraklatmada durur).</summary>
    public sealed class BreathSystem : MonoBehaviour
    {
        [SerializeField] float capacitySeconds = 6f;
        [SerializeField] float refillPerSecond = 2.5f;

        public float Current { get; private set; }
        public float Normalized => capacitySeconds > 0f ? Current / capacitySeconds : 0f;
        public bool Submerged { get; private set; }

        public event Action Depleted;

        bool depletedFired;

        void Awake() => Current = capacitySeconds;

        public void Refill()
        {
            Current = capacitySeconds;
            depletedFired = false;
        }

        public void SetSubmerged(bool submerged)
        {
            Submerged = submerged;
            if (!submerged) depletedFired = false;
        }

        void Update()
        {
            float dt = Time.deltaTime;
            if (Submerged)
            {
                Current = Mathf.Max(0f, Current - dt);
                if (Current <= 0f && !depletedFired)
                {
                    depletedFired = true;
                    Depleted?.Invoke();
                }
            }
            else Current = Mathf.Min(capacitySeconds, Current + refillPerSecond * dt);
        }
    }
}
