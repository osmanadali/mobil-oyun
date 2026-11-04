using System;
using System.Collections;
using UnityEngine;
using Ada.Core;

namespace Ada.Throw
{
    /// <summary>
    /// "Hedef Dizisi" ezber varyantı: hedefler sırayla yanar, aynı sırayla vurulmalıdır.
    /// (Final atış sahnesi için sırasız ThrowStage kullanılır.) Sıra ve doğruluk burada tutulur.
    /// </summary>
    public sealed class ThrowCourse : MonoBehaviour
    {
        [SerializeField] TargetBoard[] targets;
        [SerializeField] ThrowController thrower;
        [SerializeField] RaceTimer timer;
        [SerializeField] int sequenceLength = 3;
        [SerializeField] float showStepSeconds = 0.6f;
        [SerializeField] float penalty = 3f;
        [SerializeField] Color flashColor = new Color(1f, 0.85f, 0.45f);
        [SerializeField] int seed = 0;

        public event Action SequenceShown;
        public event Action FinalHit;
        public event Action<float> PenaltyAdded;

        int[] order;
        int next;
        bool active;

        void OnEnable()
        {
            thrower.TargetHit += OnHit;
            thrower.Missed += OnMiss;
        }

        void OnDisable()
        {
            thrower.TargetHit -= OnHit;
            thrower.Missed -= OnMiss;
        }

        public IEnumerator Run()
        {
            var rng = new System.Random(seed != 0 ? seed : Environment.TickCount);
            int n = Mathf.Clamp(sequenceLength, 1, targets.Length);
            int[] idx = new int[targets.Length];
            for (int i = 0; i < idx.Length; i++) idx[i] = i;
            for (int i = idx.Length - 1; i > 0; i--)
            {
                int j = rng.Next(0, i + 1);
                (idx[i], idx[j]) = (idx[j], idx[i]);
            }
            order = new int[n];
            Array.Copy(idx, order, n);
            next = 0;
            foreach (var t in targets) t.ResetBoard();

            for (int i = 0; i < order.Length; i++)
                yield return targets[order[i]].Flash(flashColor, showStepSeconds);
            SequenceShown?.Invoke();

            active = true;
            thrower.BeginAiming();
            while (next < order.Length) yield return null;
            active = false;
            thrower.EndAiming();
        }

        void OnHit(TargetBoard t, Vector3 point, Vector3 normal)
        {
            if (!active || next >= order.Length || t.IsDown) return;
            if (t == targets[order[next]])
            {
                t.RegisterHit(point);
                next++;
                if (next == order.Length) FinalHit?.Invoke();
            }
            else AddPenalty();
        }

        void OnMiss()
        {
            if (active && next < order.Length) AddPenalty();
        }

        void AddPenalty()
        {
            timer.AddPenalty(penalty);
            PenaltyAdded?.Invoke(penalty);
        }
    }
}
