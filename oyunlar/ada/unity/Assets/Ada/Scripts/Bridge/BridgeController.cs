using System;
using System.Collections;
using UnityEngine;
using Ada.Core;
using Ada.InputLayer;
using Ada.Player;

namespace Ada.Bridge
{
    /// <summary>
    /// Ezber köprüsü: desen üretimi, ezber gösterimi, hedef seçimi, doğru/yanlış kararı, düşüş ve kontrol noktasına dönüş.
    /// Bir komut (dokunma ya da kaydırma) bir sonraki sıradaki platformu seçer; hedef kalkışta kesinleşir.
    /// İnişe ~130 ms kala verilen komut tamponlanır ve inişte uygulanır.
    /// </summary>
    public sealed class BridgeController : MonoBehaviour
    {
        [Serializable]
        public class Row
        {
            public BridgePlatform[] platforms = new BridgePlatform[3]; // 0 sol, 1 orta, 2 sağ
        }

        [Header("Sahne")]
        [Tooltip("Alttan (başlangıç) üste (bitiş) sıralar.")]
        [SerializeField] Row[] rows;
        [SerializeField] Transform startPoint;   // iskele ucu; forward = parkur yönü
        [SerializeField] Transform finishPoint;  // bitiş platformu iniş noktası
        [SerializeField] PlayerMotor motor;
        [SerializeField] TouchInput input;
        [SerializeField] Camera cam;
        [SerializeField] LayerMask platformMask;
        [SerializeField] RaceTimer timer;

        [Header("Ezber")]
        [SerializeField] float memorizeStepSeconds = 0.6f;
        [SerializeField] Color glowColor = new Color(1f, 0.85f, 0.45f);
        [Tooltip("0 = her denemede rastgele. Günün Adası için sabit tohum verin.")]
        [SerializeField] int seed = 0;

        [Header("Kurallar")]
        [SerializeField] float wrongPenalty = 4f;
        [SerializeField] float hintPenalty = 6f;
        [SerializeField] float inputBufferSeconds = 0.13f;
        [SerializeField] float swimBackSpeed = 2.4f;

        public event Action MemorizeStarted;
        public event Action MemorizeEnded;
        public event Action Finished;
        public event Action<float> PenaltyAdded;
        public event Action<int, int> RowReached; // ulaşılan sıra (1 tabanlı), toplam

        int[] solid;
        int currentRow = -1;     // üzerinde durulan doğru sıra; -1 = iskele
        int checkpointRow = -1;
        bool playing, busy;
        int bufferedLane = -1;
        float bufferedAt;

        public int RowCount => rows.Length;
        public bool IsPlaying => playing;

        void OnEnable()
        {
            input.Tapped += OnTap;
            input.Swiped += OnSwipe;
            motor.Landed += OnLanded;
        }

        void OnDisable()
        {
            input.Tapped -= OnTap;
            input.Swiped -= OnSwipe;
            motor.Landed -= OnLanded;
        }

        public void Begin()
        {
            StopAllCoroutines();
            var rng = new System.Random(seed != 0 ? seed : Environment.TickCount);
            solid = new int[rows.Length];
            for (int i = 0; i < rows.Length; i++)
            {
                solid[i] = rng.Next(0, 3);
                foreach (var p in rows[i].platforms) p.ResetVisual();
            }
            currentRow = -1;
            checkpointRow = -1;
            bufferedLane = -1;
            motor.PlaceGrounded(startPoint.position, startPoint.forward);
            StartCoroutine(MemorizeThenPlay());
        }

        IEnumerator MemorizeThenPlay()
        {
            playing = false;
            busy = true;
            MemorizeStarted?.Invoke();
            yield return ShowPattern();
            MemorizeEnded?.Invoke();
            busy = false;
            playing = true;
        }

        IEnumerator ShowPattern()
        {
            for (int r = 0; r < rows.Length; r++)
                yield return rows[r].platforms[solid[r]].Glow(glowColor, memorizeStepSeconds);
        }

        /// <summary>Fener: deseni bir kez daha gösterir, süreye ceza ekler.</summary>
        public void UseHint()
        {
            if (!playing || busy || !motor.IsGrounded) return;
            AddPenalty(hintPenalty);
            StartCoroutine(HintRoutine());
        }

        IEnumerator HintRoutine()
        {
            busy = true;
            yield return ShowPattern();
            busy = false;
        }

        void OnTap(Vector2 screen)
        {
            if (!playing) return;
            int next = currentRow + 1;
            if (next >= rows.Length) return;
            Ray ray = cam.ScreenPointToRay(screen);
            if (!Physics.Raycast(ray, out RaycastHit hit, 200f, platformMask, QueryTriggerInteraction.Ignore)) return;
            var plat = hit.collider.GetComponentInParent<BridgePlatform>();
            if (plat == null) return;
            int lane = Array.IndexOf(rows[next].platforms, plat);
            if (lane >= 0) Command(lane);
        }

        void OnSwipe(Vector2 a, Vector2 b)
        {
            if (!playing) return;
            Vector2 d = b - a;
            if (d.y <= 0f) return;                                  // yalnız yukarı kaydırma
            float angle = Mathf.Atan2(d.x, d.y) * Mathf.Rad2Deg;     // 0 = düz yukarı
            Command(angle < -20f ? 0 : angle > 20f ? 2 : 1);         // mutlak eşleme: sol / orta / sağ
        }

        void Command(int lane)
        {
            if (busy) return;
            if (motor.State == MotorState.Jumping)
            {
                bufferedLane = lane;
                bufferedAt = Time.time;
                return;
            }
            if (motor.IsGrounded) JumpTo(lane);
        }

        void OnLanded()
        {
            if (bufferedLane < 0) return;
            int lane = bufferedLane;
            bufferedLane = -1;
            if (Time.time - bufferedAt > inputBufferSeconds) return; // havada çok erken verilen komut atılır
            // Motor, Landed olayını varış geri çağrısından ÖNCE yayar. Kararın verilmesi için bir kare bekle.
            StartCoroutine(JumpNextFrame(lane));
        }

        IEnumerator JumpNextFrame(int lane)
        {
            yield return null;
            if (playing && !busy && motor.IsGrounded) JumpTo(lane);
        }

        void JumpTo(int lane)
        {
            int next = currentRow + 1;
            if (next >= rows.Length) return;
            if (currentRow == -1 && !timer.IsRunning) timer.StartTimer();
            var plat = rows[next].platforms[lane];
            motor.TryJump(plat.LandingPoint, () => OnArrived(next, lane));
        }

        void OnArrived(int row, int lane)
        {
            if (solid[row] == lane)
            {
                currentRow = row;
                checkpointRow = row;
                RowReached?.Invoke(row + 1, rows.Length);
                if (row == rows.Length - 1) StartCoroutine(ToFinish());
            }
            else
            {
                StartCoroutine(WrongRoutine(row, lane));
            }
        }

        IEnumerator ToFinish()
        {
            busy = true;
            bufferedLane = -1;
            yield return null;
            bool arrived = false;
            motor.TryJump(finishPoint.position, () => arrived = true);
            while (!arrived) yield return null;
            playing = false;
            busy = false;
            Finished?.Invoke();
        }

        IEnumerator WrongRoutine(int row, int lane)
        {
            busy = true;
            bufferedLane = -1;
            var plat = rows[row].platforms[lane];
            AddPenalty(wrongPenalty);
            plat.Break();
            yield return new WaitForSeconds(0.12f);
            motor.StartFall();
            while (!motor.InWater) yield return null;
            yield return new WaitForSeconds(0.5f);

            Vector3 back = checkpointRow >= 0
                ? rows[checkpointRow].platforms[solid[checkpointRow]].LandingPoint
                : startPoint.position;
            Vector3 courseFwd = startPoint.forward;
            courseFwd.y = 0f;
            courseFwd.Normalize();
            Vector3 swimTarget = back - courseFwd * 0.9f;

            while (true)
            {
                Vector3 d = swimTarget - motor.transform.position;
                d.y = 0f;
                if (d.magnitude < 0.12f) break;
                motor.SwimMove(d.normalized * swimBackSpeed, motor.SwimRootY);
                yield return null;
            }

            yield return new WaitForSeconds(0.15f); // ileride: tırmanma animasyonu + kısa geçiş
            motor.PlaceGrounded(back, courseFwd);
            plat.ResetVisual();
            currentRow = checkpointRow;
            busy = false;
        }

        void AddPenalty(float seconds)
        {
            timer.AddPenalty(seconds);
            PenaltyAdded?.Invoke(seconds);
        }

#if UNITY_EDITOR
        /// <summary>Editör testi: doğru şeridi döndürür.</summary>
        public int DebugSolidLane(int row) => solid != null && row >= 0 && row < solid.Length ? solid[row] : -1;
#endif
    }
}
