using UnityEngine;

namespace Ada.Player
{
    /// <summary>
    /// Dalış/yüzeye çıkış eğimi, yalnız VisualRoot üzerinde (özel dalış klibi yokken Swim klibini öne/arkaya yatırır).
    /// </summary>
    public sealed class SwimTilt : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] Transform visualRoot;
        [SerializeField] float maxPitchDeg = 50f;
        [SerializeField] float verticalSpeedForMax = 2f;
        [SerializeField] float sharpness = 10f;

        float pitch;

        void Update()
        {
            float target = 0f;
            if (motor.InWater)
                target = Mathf.Clamp(-motor.VerticalSpeed / verticalSpeedForMax, -1f, 1f) * maxPitchDeg;
            pitch = Mathf.Lerp(pitch, target, 1f - Mathf.Exp(-sharpness * Time.deltaTime));
            visualRoot.localRotation = Quaternion.Euler(pitch, 0f, 0f);
        }
    }
}
