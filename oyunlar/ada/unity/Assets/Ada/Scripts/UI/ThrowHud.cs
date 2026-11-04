using System;
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using Ada.Throw;

namespace Ada.UI
{
    /// <summary>
    /// Final atış arayüzü. Yalnız ThrowStage olaylarıyla güncellenir (her kare metin yazılmaz).
    /// Üstte 3 hedef simgesi (vurulan hedefin SlotIndex'iyle eşleşen simge işaretlenir), sayaç, giriş başlığı,
    /// ilk kullanım ipucu, isabet/ıska kısa yazısı, etap sonu paneli. Animasyonlar unscaled zamanla çalışır.
    /// </summary>
    public sealed class ThrowHud : MonoBehaviour
    {
        [SerializeField] ThrowStage stage;

        [Header("Üst bar")]
        [SerializeField] TMP_Text counterText;
        [Tooltip("Sol, orta, sağ hedef simgelerinin onay işaretleri (TargetBoard.SlotIndex sırası).")]
        [SerializeField] GameObject[] slotChecks;
        [SerializeField] RectTransform[] slotIcons;

        [Header("Giriş başlığı")]
        [SerializeField] CanvasGroup entryGroup;
        [SerializeField] TMP_Text entryTitle, entrySubtitle;

        [Header("İpucu")]
        [SerializeField] CanvasGroup tutorialGroup;
        [SerializeField] TMP_Text tutorialLine1, tutorialLine2;

        [Header("Kısa yazı")]
        [SerializeField] CanvasGroup popupGroup;
        [SerializeField] TMP_Text popupText;

        [Header("Sonuç")]
        [SerializeField] CanvasGroup resultGroup;
        [SerializeField] TMP_Text resultTitle;
        [SerializeField] Button continueButton, replayButton;
        [SerializeField] TMP_Text continueLabel, replayLabel;

        public event Action ContinuePressed;

        string[] counters;
        Coroutine entryRoutine, popupRoutine, resultRoutine;

        void Awake()
        {
            entryTitle.text = UiTexts.FinalTitle;
            entrySubtitle.text = UiTexts.FinalSubtitle;
            tutorialLine1.text = UiTexts.TutorialAim;
            tutorialLine2.text = UiTexts.TutorialRelease;
            resultTitle.text = UiTexts.StageComplete;
            continueLabel.text = UiTexts.Continue;
            replayLabel.text = UiTexts.PlayAgain;
            continueButton.onClick.AddListener(() => ContinuePressed?.Invoke());
            replayButton.onClick.AddListener(() => stage.Restart());
            ResetView();
        }

        void OnEnable()
        {
            stage.Entered += OnEntered;
            stage.CountChanged += OnCount;
            stage.Hit += OnHit;
            stage.Missed += OnMiss;
            stage.TutorialFinished += OnTutorialFinished;
            stage.Completed += OnCompleted;
            stage.Restarted += ResetView;
        }

        void OnDisable()
        {
            stage.Entered -= OnEntered;
            stage.CountChanged -= OnCount;
            stage.Hit -= OnHit;
            stage.Missed -= OnMiss;
            stage.TutorialFinished -= OnTutorialFinished;
            stage.Completed -= OnCompleted;
            stage.Restarted -= ResetView;
        }

        void ResetView()
        {
            StopAllCoroutines();
            entryRoutine = popupRoutine = resultRoutine = null;
            foreach (var c in slotChecks) if (c) c.SetActive(false);
            Hide(entryGroup);
            Hide(tutorialGroup);
            Hide(popupGroup);
            Hide(resultGroup);
        }

        void OnEntered()
        {
            if (entryRoutine != null) StopCoroutine(entryRoutine);
            entryRoutine = StartCoroutine(EntryBanner());
        }

        IEnumerator EntryBanner()
        {
            yield return Fade(entryGroup, 0f, 1f, 0.2f);
            yield return new WaitForSecondsRealtime(1.1f);
            yield return Fade(entryGroup, 1f, 0f, 0.25f);
            if (stage.ShowTutorial) yield return Fade(tutorialGroup, 0f, 1f, 0.2f);
            entryRoutine = null;
        }

        void OnCount(int count, int total)
        {
            if (counters == null || counters.Length != total + 1) counters = UiTexts.BuildTargetCounters(total);
            counterText.text = counters[Mathf.Clamp(count, 0, total)];
        }

        void OnHit(TargetBoard target)
        {
            int i = target.SlotIndex;
            if (i >= 0 && i < slotChecks.Length && slotChecks[i]) slotChecks[i].SetActive(true);
            if (i >= 0 && i < slotIcons.Length && slotIcons[i]) StartCoroutine(Punch(slotIcons[i]));
            ShowPopup(UiTexts.Hit);
        }

        void OnMiss() => ShowPopup(UiTexts.Miss);

        void OnTutorialFinished() => StartCoroutine(Fade(tutorialGroup, tutorialGroup.alpha, 0f, 0.2f));

        void ShowPopup(string text)
        {
            popupText.text = text;
            if (popupRoutine != null) StopCoroutine(popupRoutine);
            popupRoutine = StartCoroutine(Popup());
        }

        IEnumerator Popup()
        {
            popupGroup.alpha = 1f;
            var t = popupGroup.transform;
            for (float k = 0f; k < 1f; k += Time.unscaledDeltaTime / 0.18f)
            {
                t.localScale = Vector3.one * Mathf.LerpUnclamped(0.7f, 1f, 1f + 2.70158f * Mathf.Pow(k - 1f, 3) + 1.70158f * Mathf.Pow(k - 1f, 2));
                yield return null;
            }
            t.localScale = Vector3.one;
            yield return new WaitForSecondsRealtime(0.55f);
            yield return Fade(popupGroup, 1f, 0f, 0.2f);
            popupRoutine = null;
        }

        void OnCompleted()
        {
            if (resultRoutine != null) StopCoroutine(resultRoutine);
            resultRoutine = StartCoroutine(Result());
        }

        IEnumerator Result()
        {
            Hide(tutorialGroup);
            Hide(popupGroup);
            resultGroup.interactable = true;
            resultGroup.blocksRaycasts = true;
            var t = resultGroup.transform;
            for (float k = 0f; k < 1f; k += Time.unscaledDeltaTime / 0.25f)
            {
                resultGroup.alpha = k;
                t.localScale = Vector3.one * Mathf.Lerp(0.9f, 1f, k);
                yield return null;
            }
            resultGroup.alpha = 1f;
            t.localScale = Vector3.one;
            resultRoutine = null;
        }

        static IEnumerator Punch(RectTransform r)
        {
            for (float k = 0f; k < 1f; k += Time.unscaledDeltaTime / 0.22f)
            {
                r.localScale = Vector3.one * (1f + 0.25f * Mathf.Sin(k * Mathf.PI));
                yield return null;
            }
            r.localScale = Vector3.one;
        }

        static IEnumerator Fade(CanvasGroup g, float from, float to, float seconds)
        {
            for (float k = 0f; k < 1f; k += Time.unscaledDeltaTime / Mathf.Max(0.01f, seconds))
            {
                g.alpha = Mathf.Lerp(from, to, k);
                yield return null;
            }
            g.alpha = to;
        }

        static void Hide(CanvasGroup g)
        {
            if (!g) return;
            g.alpha = 0f;
            g.interactable = false;
            g.blocksRaycasts = false;
            g.transform.localScale = Vector3.one;
        }
    }
}
