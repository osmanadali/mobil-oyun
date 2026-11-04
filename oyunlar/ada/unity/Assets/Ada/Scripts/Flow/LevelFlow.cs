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
    /// İlk oynanabilir döngü: köprü → kısa dalış → final atışı → sonuç.
    /// Süre ilk zıplamada başlar, final etabı tamamlanınca durur. Etaplar kendi coroutine'lerini yönetir;
    /// LevelFlow yalnız olaylarını bekler (yeniden başlatmada çift akış oluşmaz).
    /// </summary>
    public sealed class LevelFlow : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] CameraRig cameraRig;
        [SerializeField] RaceTimer timer;
        [SerializeField] BridgeController bridge;
        [SerializeField] DiveController dive;
        [SerializeField] ThrowStage finalThrow;

        [Header("Noktalar")]
        [SerializeField] Transform diveJumpFrom;   // havuz kenarı
        [SerializeField] Transform diveEntry;      // su yüzeyindeki giriş noktası
        [SerializeField] Transform throwAreaEntry; // final atış alanına giriş (iskele başı)

        public event Action<float, float> LevelCompleted; // toplam süre, ceza

        IEnumerator Start()
        {
            yield return null;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            timer.ResetTimer();

            // 1) Köprü
            cameraRig.SetProfile(CamProfileId.Bridge, instant: true);
            bool bridgeDone = false;
            void OnBridge() => bridgeDone = true;
            bridge.Finished += OnBridge;
            bridge.Begin();
            while (!bridgeDone) yield return null;
            bridge.Finished -= OnBridge;

            // 2) Kısa dalış
            yield return RunTo(diveJumpFrom.position);
            bool inWater = false;
            void OnWater() => inWater = true;
            motor.EnteredWater += OnWater;
            motor.TryJump(diveEntry.position, null, intoWater: true);
            while (!inWater) yield return null;
            motor.EnteredWater -= OnWater;
            cameraRig.SetProfile(CamProfileId.Dive);
            bool diveDone = false;
            void OnDive() => diveDone = true;
            dive.Completed += OnDive;
            dive.Begin();
            while (!diveDone) yield return null;
            dive.Completed -= OnDive;

            // 3) Final atışı
            yield return RunTo(throwAreaEntry.position);
            bool throwDone = false;
            void OnThrow() => throwDone = true;
            finalThrow.Completed += OnThrow;
            finalThrow.Begin();
            while (!throwDone) yield return null;
            finalThrow.Completed -= OnThrow;

            timer.StopTimer();
            LevelCompleted?.Invoke(timer.Total, timer.Penalty);
        }

        IEnumerator RunTo(Vector3 point)
        {
            bool arrived = false;
            motor.RunTo(point, false, () => arrived = true);
            while (!arrived) yield return null;
        }
    }
}
