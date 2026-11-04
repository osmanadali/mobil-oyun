using UnityEngine;

namespace Ada.Player
{
    /// <summary>
    /// Hareket ayarlarının TEK kaynağı. Kerem ve Deniz prefabları aynı varlığa bağlanır;
    /// böylece zıplama süresi, yüksekliği ve hızlar karakter başına sessizce farklılaşamaz.
    /// </summary>
    [CreateAssetMenu(fileName = "MotorTuning", menuName = "Ada/Motor Tuning")]
    public sealed class MotorTuning : ScriptableObject
    {
        [Header("Zıplama (iki karakter için ortak)")]
        public float jumpDuration = 0.42f;
        public float jumpApexHeight = 0.9f;

        [Header("Yer hareketi")]
        public float runSpeed = 4.2f;
        public float sprintSpeed = 6.5f;
        public float turnSpeedDeg = 720f;

        [Header("Düşüş")]
        public float gravity = 22f;
    }
}
