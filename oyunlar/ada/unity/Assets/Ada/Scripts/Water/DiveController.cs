using System;
using UnityEngine;
using Ada.Core;
using Ada.InputLayer;
using Ada.Player;

namespace Ada.Water
{
    /// <summary>
    /// Kısa dalış alanı: karakter otomatik olarak çıkışa doğru yüzer. Basılı tut = dal (nefes tut), bırak = yüzeye çık.
    /// Dipteki jetonu almak gerekir; alınmazsa ceza. Nefes biterse zorla yüzeye çıkış ve ceza. Mikrofon yok.
    /// </summary>
    public sealed class DiveController : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] TouchInput input;
        [SerializeField] BreathSystem breath;
        [SerializeField] RaceTimer timer;
        [SerializeField] Transform exitPoint;     // sudan çıkış (forward = çıkış yönü)
        [SerializeField] Transform token;
        [SerializeField] float bottomRootY = -2.4f;
        [SerializeField] float forwardSpeed = 2.2f;
        [SerializeField] float diveSpeed = 1.8f;
        [SerializeField] float riseSpeed = 2.4f;
        [SerializeField] float tokenRadius = 0.7f;
        [SerializeField] float breathPenalty = 5f;
        [SerializeField] float missedTokenPenalty = 5f;

        public event Action TokenCollected;
        public event Action Completed;
        public event Action<float> PenaltyAdded;

        bool active, holding, forcedUp, hasToken;

        public bool IsActive => active;

        void OnEnable()
        {
            input.HoldStarted += OnHoldStart;
            input.HoldEnded += OnHoldEnd;
            breath.Depleted += OnDepleted;
        }

        void OnDisable()
        {
            input.HoldStarted -= OnHoldStart;
            input.HoldEnded -= OnHoldEnd;
            breath.Depleted -= OnDepleted;
        }

        /// <summary>Oyuncu suya girdikten sonra çağırın (motor.InWater).</summary>
        public void Begin()
        {
            active = true;
            hasToken = false;
            forcedUp = false;
            holding = false;
            breath.Refill();
            if (token) token.gameObject.SetActive(true);
        }

        void OnHoldStart() => holding = true;

        void OnHoldEnd()
        {
            holding = false;
            forcedUp = false;
        }

        void OnDepleted()
        {
            forcedUp = true;
            AddPenalty(breathPenalty);
        }

        void Update()
        {
            if (!active || !motor.InWater || Time.deltaTime <= 0f) return;

            Vector3 pos = motor.transform.position;
            Vector3 toExit = exitPoint.position - pos;
            toExit.y = 0f;
            bool wantDown = holding && !forcedUp;
            Vector3 v = toExit.sqrMagnitude > 1e-4f ? toExit.normalized * forwardSpeed : Vector3.zero;
            v.y = wantDown ? -diveSpeed : riseSpeed;
            motor.SwimMove(v, bottomRootY);

            bool under = motor.transform.position.y < motor.SwimRootY - 0.2f;
            motor.SetDiving(under);
            breath.SetSubmerged(under);

            if (!hasToken && token && Vector3.Distance(motor.transform.position + Vector3.up * 0.9f, token.position) < tokenRadius)
            {
                hasToken = true;
                token.gameObject.SetActive(false);
                TokenCollected?.Invoke();
            }

            if (toExit.magnitude < 0.4f && !under)
            {
                active = false;
                breath.SetSubmerged(false);
                if (!hasToken) AddPenalty(missedTokenPenalty);
                motor.PlaceGrounded(exitPoint.position, exitPoint.forward);
                Completed?.Invoke();
            }
        }

        void AddPenalty(float s)
        {
            timer.AddPenalty(s);
            PenaltyAdded?.Invoke(s);
        }
    }
}
