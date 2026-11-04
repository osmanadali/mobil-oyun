using System;
using System.Collections;
using UnityEngine;
using Ada.Bridge;
using Ada.CameraSystem;
using Ada.Core;
using Ada.Player;
using Ada.Throw;
using Ada.Water;

namespace Ada.Flow
{
    /// <summary>
    /// İlk oynanabilir döngü: köprü → atış standı → kısa dalış → bitiş. Süre ilk zıplamada başlar, bitişte durur.
    /// UI bu sınıfın olaylarını dinler (sonuç ekranı, ceza yazıları).
    /// </summary>
    public sealed class LevelFlow : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] PlayerAnimatorBridge anim;
        [SerializeField] CameraRig cameraRig;
        [SerializeField] RaceTimer timer;
        [SerializeField] BridgeController bridge;
        [SerializeField] ThrowCourse throwCourse;
        [SerializeField] DiveController dive;

        [Header("Noktalar")]
        [SerializeField] Transform throwStand;
        [SerializeField] Transform diveEntry;      // su yüzeyindeki giriş noktası
        [SerializeField] Transform diveJumpFrom;   // havuz kenarı
        [SerializeField] Transform finishSpot;

        [Header("His")]
        [SerializeField] float finalHitStop = 0.04f;
        [SerializeField] float finalShakeSeconds = 0.1f;
        [SerializeField] float finalShakeFraction = 0.0025f;

        public event Action<float, float> LevelCompleted; // toplam süre, ceza

        void OnEnable() => throwCourse.FinalHit += OnFinalHit;
        void OnDisable() => throwCourse.FinalHit -= OnFinalHit;

        IEnumerator Start()
        {
            yield return null;
            timer.ResetTimer();

            // 1) Köprü
            cameraRig.SetProfile(CamProfileId.Bridge, instant: true);
            bool bridgeDone = false;
            void OnBridge() => bridgeDone = true;
            bridge.Finished += OnBridge;
            bridge.Begin();
            while (!bridgeDone) yield return null;
            bridge.Finished -= OnBridge;

            // 2) Atış standı
            yield return RunTo(throwStand.position);
            motor.PlaceGrounded(throwStand.position, throwStand.forward);
            cameraRig.SetProfile(CamProfileId.Aim);
            yield return throwCourse.Run();

            // 3) Kısa dalış
            yield return RunTo(diveJumpFrom.position);
            bool inWater = false;
            motor.TryJump(diveEntry.position, () => { }, intoWater: true);
            void OnWater() => inWater = true;
            motor.EnteredWater += OnWater;
            while (!inWater) yield return null;
            motor.EnteredWater -= OnWater;
            cameraRig.SetProfile(CamProfileId.Dive);
            bool diveDone = false;
            void OnDive() => diveDone = true;
            dive.Completed += OnDive;
            dive.Begin();
            while (!diveDone) yield return null;
            dive.Completed -= OnDive;

            // 4) Bitiş
            yield return RunTo(finishSpot.position);
            timer.StopTimer();
            cameraRig.SetProfile(CamProfileId.Finish);
            anim.PlayVictory();
            LevelCompleted?.Invoke(timer.Total, timer.Penalty);
        }

        IEnumerator RunTo(Vector3 point)
        {
            bool arrived = false;
            motor.RunTo(point, false, () => arrived = true);
            while (!arrived) yield return null;
        }

        void OnFinalHit()
        {
            GameClock.HitStop(finalHitStop);
            cameraRig.Shake(finalShakeSeconds, finalShakeFraction);
        }
    }
}
