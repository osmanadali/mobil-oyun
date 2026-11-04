using UnityEngine;

namespace Ada.Core
{
    /// <summary>Yarış süresi ve cezalar. Oyun saatiyle (Time.deltaTime) ilerler; duraklatma ve hit-stop'ta durur.</summary>
    public sealed class RaceTimer : MonoBehaviour
    {
        public float Elapsed { get; private set; }
        public float Penalty { get; private set; }
        public bool IsRunning { get; private set; }
        public float Total => Elapsed + Penalty;

        public void ResetTimer()
        {
            Elapsed = 0f;
            Penalty = 0f;
            IsRunning = false;
        }

        public void StartTimer() => IsRunning = true;
        public void StopTimer() => IsRunning = false;
        public void AddPenalty(float seconds) => Penalty += Mathf.Max(0f, seconds);

        void Update()
        {
            if (IsRunning) Elapsed += Time.deltaTime;
        }
    }
}
