using UnityEngine;

namespace Ada.Player
{
    /// <summary>
    /// Kalkış/iniş ezilme-esnemesi, yalnız VisualRoot üzerinde. VisualRoot'un pivotu ayak tabanında olmalı
    /// (PlayerRoot altında yerel konum 0), böylece ölçek değişirken ayak zeminde kalır.
    /// PlayerRoot ve çarpışma ölçeklenmez.
    /// </summary>
    public sealed class VisualSquash : MonoBehaviour
    {
        [SerializeField] PlayerMotor motor;
        [SerializeField] Transform visualRoot;
        [SerializeField] Vector3 takeoffScale = new Vector3(0.976f, 1.05f, 0.976f);
        [SerializeField] Vector3 landScale = new Vector3(1.03f, 0.94f, 1.03f);
        [Range(0.05f, 0.3f)] [SerializeField] float recoverSeconds = 0.11f;

        Vector3 from = Vector3.one;
        float t = 1f;

        void OnEnable()
        {
            motor.TookOff += OnTakeoff;
            motor.Landed += OnLand;
        }

        void OnDisable()
        {
            motor.TookOff -= OnTakeoff;
            motor.Landed -= OnLand;
            if (visualRoot) visualRoot.localScale = Vector3.one;
            t = 1f;
        }

        void OnTakeoff() => Kick(takeoffScale);
        void OnLand() => Kick(landScale);

        void Kick(Vector3 scale)
        {
            from = scale;
            t = 0f;
            visualRoot.localScale = scale;
        }

        void Update()
        {
            if (t >= 1f) return;
            t = Mathf.Min(1f, t + Time.deltaTime / recoverSeconds);
            float e = 1f - (1f - t) * (1f - t); // ease-out
            visualRoot.localScale = Vector3.LerpUnclamped(from, Vector3.one, e);
        }
    }
}
