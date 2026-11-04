using System.Collections;
using TMPro;
using UnityEngine;

namespace Ada.Core
{
    /// <summary>
    /// Uygulamadan ya da reklamdan dönüşte basılı kalan girdileri temizler, 3-2-1 sayar, sonra oyunu sürdürür.
    /// Sayım unscaled zamanla çalışır (oyun saati dururken).
    /// </summary>
    public sealed class ResumeCountdown : MonoBehaviour
    {
        [SerializeField] GameObject overlay;
        [SerializeField] TMP_Text label;
        [SerializeField] Ada.InputLayer.TouchInput input;
        [SerializeField] int seconds = 3;

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
            if (running != null) StopCoroutine(running);
            running = StartCoroutine(Run(reason));
        }

        IEnumerator Run(string reason)
        {
            if (input) input.ClearAll();
            if (overlay) overlay.SetActive(true);
            for (int i = seconds; i > 0; i--)
            {
                if (label) label.text = i.ToString();
                yield return new WaitForSecondsRealtime(1f);
            }
            if (overlay) overlay.SetActive(false);
            running = null;
            if (input) input.ClearAll();
            GameClock.Resume(reason);
        }
    }
}
