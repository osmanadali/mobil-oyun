using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace Ada.Core
{
    /// <summary>
    /// Uygulamadan ya da reklamdan dönüşte basılı kalan girdileri temizler, 3-2-1 sayar, sonra oyunu sürdürür.
    /// Bekleyen TÜM nedenler (ör. Android'de reklam hem Ad hem App nedeni bırakır) sayım sonunda birlikte kaldırılır;
    /// yeni bir neden gelirse sayım baştan başlar ama önceki neden kaybolmaz. Sayım unscaled zamanla çalışır.
    /// </summary>
    public sealed class ResumeCountdown : MonoBehaviour
    {
        [SerializeField] GameObject overlay;
        [SerializeField] TMP_Text label;
        [SerializeField] Ada.InputLayer.TouchInput input;
        [SerializeField] int seconds = 3;

        readonly HashSet<string> pending = new HashSet<string>();
        readonly List<string> toResume = new List<string>(4);
        static readonly string[] digits = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" };
        Coroutine running;

        void OnEnable()
        {
            GameClock.AppResumed += OnAppResumed;
            if (overlay) overlay.SetActive(false);
        }

        void OnDisable() => GameClock.AppResumed -= OnAppResumed;

        void OnAppResumed() => Begin(PauseReasons.App);

        /// <summary>Reklam kapandığında çağırın (AdMob olayları ana iş parçacığına yönlendirilmiş olmalı).</summary>
        public void OnAdClosed() => Begin(PauseReasons.Ad);

        public void Begin(string reason)
        {
            if (!GameClock.IsPausedBy(reason)) return;
            pending.Add(reason);
            if (running != null) StopCoroutine(running);
            running = StartCoroutine(Run());
        }

        IEnumerator Run()
        {
            if (input) input.ClearAll();
            if (overlay) overlay.SetActive(true);
            for (int i = seconds; i > 0; i--)
            {
                if (label) label.text = i < digits.Length ? digits[i] : i.ToString();
                yield return new WaitForSecondsRealtime(1f);
            }
            if (overlay) overlay.SetActive(false);
            running = null;
            if (input) input.ClearAll();
            toResume.Clear();
            toResume.AddRange(pending);
            pending.Clear();
            for (int i = 0; i < toResume.Count; i++) GameClock.Resume(toResume[i]);
        }
    }
}
