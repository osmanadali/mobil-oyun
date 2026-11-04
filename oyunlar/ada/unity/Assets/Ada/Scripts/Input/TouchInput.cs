using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.EnhancedTouch;
using ETouch = UnityEngine.InputSystem.EnhancedTouch.Touch;
using ETouchPhase = UnityEngine.InputSystem.TouchPhase;

namespace Ada.InputLayer
{
    /// <summary>
    /// Tek parmak: dokunma, kaydırma, sürükleme ve basılı tutma. Input System paketinin EnhancedTouch API'si.
    /// Editörde fare TouchSimulation ile çalışır. UI üzerinde başlayan dokunuşlar oyuna geçmez.
    /// Duraklatmadan dönüşte ClearAll() çağrılır; o anda basılı parmaklar bırakılana kadar yok sayılır.
    /// </summary>
    [DefaultExecutionOrder(-500)] // PlayerMotor'dan önce: iniş karesindeki komut her zaman tampon yolundan geçer
    public sealed class TouchInput : MonoBehaviour
    {
        public event Action<Vector2> Tapped;
        public event Action<Vector2, Vector2> Swiped;            // başlangıç, bitiş (px)
        public event Action<Vector2> DragStarted;
        public event Action<Vector2, Vector2> Dragging;          // başlangıç, şu an
        public event Action<Vector2, Vector2, float> DragEnded;  // başlangıç, bitiş, süre (sn)
        public event Action HoldStarted;
        public event Action HoldEnded;
        /// <summary>Takip edilen dokunuş bitti (hareketli ya da hareketsiz), DragEnded'den SONRA yayılır.</summary>
        public event Action<Vector2> TouchEnded;
        /// <summary>ClearAll çağrıldı (odak kaybı, reklam dönüşü): bekleyen nişanlar iptal edilmeli.</summary>
        public event Action Cleared;

        [SerializeField] float tapMaxSeconds = 0.25f;
        [SerializeField] float moveThresholdDp = 12f;
        [SerializeField] float swipeMinDp = 40f;
        [SerializeField] float holdMinSeconds = 0.15f;

        int fingerId = -1;
        Vector2 startPos;
        float startTime;
        bool moved, holding, blockUntilAllUp;

        static readonly List<RaycastResult> uiHits = new List<RaycastResult>();
        PointerEventData pointerData;

        static float DpToPx(float dp) => dp * ((Screen.dpi > 1f ? Screen.dpi : 160f) / 160f);

        public bool IsHolding => holding;

        void OnEnable()
        {
            EnhancedTouchSupport.Enable();
#if UNITY_EDITOR
            TouchSimulation.Enable();
#endif
            Ada.Core.GameClock.PauseChanged += OnPauseChanged;
        }

        // Her duraklatmada açık dokunuş ve basılı tutma kapanır (parmak duraklatmada kalkarsa Ended kaçmasın).
        void OnPauseChanged(bool paused)
        {
            if (paused) ClearAll();
        }

        void OnDisable()
        {
            Ada.Core.GameClock.PauseChanged -= OnPauseChanged;
            ClearAll();
#if UNITY_EDITOR
            TouchSimulation.Disable();
#endif
            EnhancedTouchSupport.Disable();
        }

        /// <summary>Açık dokunuşu kapatır ve tüm parmaklar kalkana kadar yeni girdiyi engeller.</summary>
        public void ClearAll()
        {
            if (holding)
            {
                holding = false;
                HoldEnded?.Invoke();
            }
            fingerId = -1;
            moved = false;
            blockUntilAllUp = true;
            Cleared?.Invoke();
        }

        void Update()
        {
            var touches = ETouch.activeTouches;
            if (blockUntilAllUp)
            {
                if (touches.Count == 0) blockUntilAllUp = false;
                return;
            }
            if (Ada.Core.GameClock.IsPaused) return;

            // Güvence: izlenen parmak artık yoksa (Ended karesi kaçtıysa) durumu kapat.
            if (fingerId != -1)
            {
                bool found = false;
                for (int i = 0; i < touches.Count; i++)
                    if (touches[i].touchId == fingerId) { found = true; break; }
                if (!found)
                {
                    if (holding) { holding = false; HoldEnded?.Invoke(); }
                    fingerId = -1;
                    TouchEnded?.Invoke(startPos);
                }
            }

            for (int i = 0; i < touches.Count; i++)
            {
                var t = touches[i];

                if (fingerId == -1)
                {
                    if (t.phase != ETouchPhase.Began || OverUI(t.screenPosition)) continue;
                    fingerId = t.touchId;
                    startPos = t.screenPosition;
                    startTime = Time.unscaledTime;
                    moved = false;
                    holding = false;
                    DragStarted?.Invoke(startPos);
                    continue;
                }
                if (t.touchId != fingerId) continue;

                Vector2 pos = t.screenPosition;
                float age = Time.unscaledTime - startTime;
                if (!moved && (pos - startPos).magnitude > DpToPx(moveThresholdDp)) moved = true;

                switch (t.phase)
                {
                    case ETouchPhase.Moved:
                    case ETouchPhase.Stationary:
                        if (moved) Dragging?.Invoke(startPos, pos);
                        if (!holding && !moved && age >= holdMinSeconds)
                        {
                            holding = true;
                            HoldStarted?.Invoke();
                        }
                        break;

                    case ETouchPhase.Ended:
                    case ETouchPhase.Canceled:
                        if (holding)
                        {
                            holding = false;
                            HoldEnded?.Invoke();
                        }
                        if (t.phase == ETouchPhase.Ended)
                        {
                            Vector2 delta = pos - startPos;
                            if (!moved && age <= tapMaxSeconds) Tapped?.Invoke(pos);
                            else if (moved && delta.magnitude >= DpToPx(swipeMinDp)) Swiped?.Invoke(startPos, pos);
                            if (moved) DragEnded?.Invoke(startPos, pos, age);
                        }
                        fingerId = -1;
                        TouchEnded?.Invoke(pos);
                        break;
                }
            }
        }

        bool OverUI(Vector2 screenPos)
        {
            var es = EventSystem.current;
            if (es == null) return false;
            if (pointerData == null || pointerData.currentInputModule == null) pointerData = new PointerEventData(es);
            pointerData.position = screenPos;
            uiHits.Clear();
            es.RaycastAll(pointerData, uiHits);
            return uiHits.Count > 0;
        }
    }
}
