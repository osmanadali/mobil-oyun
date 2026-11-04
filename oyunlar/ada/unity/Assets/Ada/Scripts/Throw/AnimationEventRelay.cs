using UnityEngine;
using UnityEngine.Events;

namespace Ada.Throw
{
    /// <summary>
    /// Animator ile AYNI nesnede (Character) durur; klip olaylarını oyun bileşenlerine iletir.
    /// Klip olayı adları: ThrowRelease, Footstep.
    /// </summary>
    public sealed class AnimationEventRelay : MonoBehaviour
    {
        [SerializeField] ThrowController throwController;
        [SerializeField] UnityEvent footstep;

        public void ThrowRelease()
        {
            if (throwController) throwController.OnReleaseEvent();
        }

        public void Footstep() => footstep?.Invoke();
    }
}
