using System;
using System.Collections.Generic;
using UnityEngine;

namespace Ada.Core
{
    /// <summary>
    /// Oyunun tek saati. Duraklatma ve hit-stop Time.timeScale üzerinden yapılır; böylece fizik sorguları,
    /// Animator (Update Mode: Normal), parçacıklar, yarış saati ve nefes aynı anda durur.
    /// UI animasyonları ve geri sayım unscaled zaman kullanmalıdır.
    /// </summary>
    [DefaultExecutionOrder(-1000)]
    public sealed class GameClock : MonoBehaviour
    {
        public static GameClock Instance { get; private set; }

        /// <summary>true: oyun duraklatıldı, false: tüm nedenler kalktı.</summary>
        public static event Action<bool> PauseChanged;

        /// <summary>Uygulama öne geldi. ResumeCountdown dinler, sayım bitince Resume(PauseReasons.App) çağırır.</summary>
        public static event Action AppResumed;

        public static bool IsPaused => Instance != null && Instance.reasons.Count > 0;

        readonly HashSet<string> reasons = new HashSet<string>();
        float hitStopUntil = -1f;

        void Awake()
        {
            // Tek sahneli akış: kalıcı (DontDestroyOnLoad) değil. Kopya varsa yalnız bu bileşen silinir,
            // aynı nesnedeki RaceTimer / TouchInput / ResumeCountdown etkilenmez.
            if (Instance != null && Instance != this) { Destroy(this); return; }
            Instance = this;
            Apply();
        }

        void OnDestroy()
        {
            if (Instance != this) return;
            Instance = null;
            Time.timeScale = 1f;
        }

        public static bool IsPausedBy(string reason) => Instance != null && Instance.reasons.Contains(reason);

        public static void Pause(string reason)
        {
            if (Instance == null) return;
            bool was = IsPaused;
            Instance.reasons.Add(reason);
            Instance.Apply();
            if (!was) PauseChanged?.Invoke(true);
        }

        public static void Resume(string reason)
        {
            if (Instance == null || !Instance.reasons.Remove(reason)) return;
            Instance.Apply();
            if (!IsPaused) PauseChanged?.Invoke(false);
        }

        /// <summary>Kısa vuruş durması (ör. son hedef, 30–50 ms). Duraklatma sırasında yok sayılır.</summary>
        public static void HitStop(float seconds)
        {
            if (Instance == null || IsPaused || seconds <= 0f) return;
            Instance.hitStopUntil = Mathf.Max(Instance.hitStopUntil, Time.unscaledTime + seconds);
            Instance.Apply();
        }

        void Update()
        {
            if (hitStopUntil >= 0f && Time.unscaledTime >= hitStopUntil)
            {
                hitStopUntil = -1f;
                Apply();
            }
        }

        void Apply()
        {
            bool stopped = reasons.Count > 0 || (hitStopUntil >= 0f && Time.unscaledTime < hitStopUntil);
            Time.timeScale = stopped ? 0f : 1f;
        }

        void OnApplicationPause(bool paused)
        {
            if (paused) Pause(PauseReasons.App);
            else if (IsPausedBy(PauseReasons.App)) AppResumed?.Invoke();
        }

        void OnApplicationFocus(bool focus)
        {
            if (!focus) Pause(PauseReasons.App);
            else if (IsPausedBy(PauseReasons.App)) AppResumed?.Invoke();
        }
    }

    public static class PauseReasons
    {
        public const string App = "app";
        public const string Ad = "ad";
        public const string Menu = "menu";
    }
}
