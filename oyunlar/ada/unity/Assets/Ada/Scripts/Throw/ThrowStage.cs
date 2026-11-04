using System;
using System.Collections;
using UnityEngine;
using Ada.CameraSystem;
using Ada.Core;
using Ada.Effects;
using Ada.Player;

namespace Ada.Throw
{
    /// <summary>
    /// Final atış etabı: alana giriş → atış konumu → nişan → atış → uçuş → isabet/ıska → hazırlanma → 3 hedef → zafer.
    /// Hedefler HERHANGİ sırayla vurulabilir; her biri bir kez sayılır. Skor, ses, efekt ve UI aynı isabet olayından beslenir.
    /// </summary>
    public sealed class ThrowStage : MonoBehaviour
    {
        [Header("Bağlantılar")]
        [SerializeField] TargetBoard[] targets;
        [SerializeField] ThrowController thrower;
        [SerializeField] PlayerMotor motor;
        [SerializeField] PlayerAnimatorBridge anim;
        [SerializeField] CameraRig cameraRig;
        [SerializeField] RaceTimer timer;
        [SerializeField] Transform throwSpot;         // iskelede atış konumu; forward = hedeflere

        [Header("Efekt ve ses")]
        [SerializeField] FxPool hitFx;
        [SerializeField] FxPool finalFx;
        [SerializeField] AudioSource sfx;
        [SerializeField] AudioClip throwClip, hitClip, finalClip, missClip;

        [Header("His")]
        [SerializeField] float cameraSettleSeconds = 0.5f;
        [SerializeField] float finalHitStop = 0.04f;
        [SerializeField] float finalShakeSeconds = 0.1f;
        [SerializeField] float finalShakeFraction = 0.0025f;
        [SerializeField] float victoryDelay = 0.35f;
        [SerializeField] float resultDelay = 1.4f;

        const string TutorialKey = "ada.tutorial.throw";

        public event Action Entered;
        public event Action<int, int> CountChanged;    // vurulan, toplam
        public event Action<TargetBoard> Hit;
        public event Action Missed;
        public event Action TutorialFinished;
        public event Action Completed;
        public event Action Restarted;

        public int Count { get; private set; }
        public int Total => targets.Length;
        public bool IsComplete => Count >= targets.Length;
        public bool ShowTutorial { get; private set; }
        /// <summary>Reklam yalnız nişan/uçuş yokken ve etap sonucu gösterilirken açılır.</summary>
        public bool IsSafeForAds => thrower.IsSafeForAds;

        bool running;

        void OnEnable()
        {
            thrower.TargetHit += OnTargetHit;
            thrower.Missed += OnMissed;
            thrower.Released += OnReleased;
        }

        void OnDisable()
        {
            thrower.TargetHit -= OnTargetHit;
            thrower.Missed -= OnMissed;
            thrower.Released -= OnReleased;
        }

        /// <summary>Etabı başlatır (kendi coroutine'i). Bitişte Completed yayılır.</summary>
        public void Begin()
        {
            StopAllCoroutines();
            StartCoroutine(Run());
        }

        IEnumerator Run()
        {
            running = true;
            Count = 0;
            foreach (var t in targets) t.ResetBoard();
            ShowTutorial = PlayerPrefs.GetInt(TutorialKey, 0) == 0;

            motor.PlaceGrounded(throwSpot.position, throwSpot.forward);
            cameraRig.SetProfile(CamProfileId.Aim);
            Entered?.Invoke();
            CountChanged?.Invoke(0, Total);
            yield return new WaitForSeconds(cameraSettleSeconds);

            thrower.BeginAiming();
            while (!IsComplete) yield return null;

            yield return new WaitForSeconds(victoryDelay);
            anim.PlayVictory();     // önce zafer: Aim/Recover → Victory geçişi Aiming=false'tan önceliklidir
            thrower.EndAiming();
            yield return new WaitForSeconds(resultDelay);
            running = false;
            Completed?.Invoke();
        }

        /// <summary>Tüm hedefler, toplar, efektler ve UI sıfırlanır; etap baştan başlar.</summary>
        public void Restart()
        {
            StopAllCoroutines();
            running = false;
            thrower.EndAiming();          // nişanı yalnız Run içindeki BeginAiming açar
            thrower.ResetAll();
            anim.ResetForStage();         // Victory'den Locomotion'a: tekrar oynamada Throw tetikleyicisi tüketilir
            if (hitFx) hitFx.StopAll();
            if (finalFx) finalFx.StopAll();
            foreach (var t in targets) t.ResetBoard();
            Count = 0;
            Restarted?.Invoke();
            StartCoroutine(Run());
        }

        void OnReleased(Vector3 position, Vector3 velocity)
        {
            if (running && !IsComplete && sfx && throwClip) sfx.PlayOneShot(throwClip, 0.8f);
        }

        void OnTargetHit(TargetBoard target, Vector3 point, Vector3 normal)
        {
            if (!running || IsComplete) return;
            if (Array.IndexOf(targets, target) < 0) return;
            if (!target.RegisterHit(point))              // zaten devrilmiş hedef: puan yok, ıska geri bildirimi
            {
                OnMissed();
                return;
            }

            Count++;
            bool final = IsComplete;
            FxPool fx = final && finalFx ? finalFx : hitFx;
            if (fx) fx.Play(point, normal);
            AudioClip clip = final && finalClip ? finalClip : hitClip;
            if (sfx && clip) sfx.PlayOneShot(clip);

            if (ShowTutorial)
            {
                ShowTutorial = false;
                PlayerPrefs.SetInt(TutorialKey, 1);
                TutorialFinished?.Invoke();
            }

            Hit?.Invoke(target);
            CountChanged?.Invoke(Count, Total);

            if (final)
            {
                thrower.EndAiming();     // son isabetle girdi hemen kilitlenir: zafer sırasında top atılamaz
                GameClock.HitStop(finalHitStop);
                cameraRig.Shake(finalShakeSeconds, finalShakeFraction);
            }
        }

        void OnMissed()
        {
            if (!running || IsComplete) return;
            if (sfx && missClip) sfx.PlayOneShot(missClip, 0.7f);
            Missed?.Invoke();
        }
    }
}
