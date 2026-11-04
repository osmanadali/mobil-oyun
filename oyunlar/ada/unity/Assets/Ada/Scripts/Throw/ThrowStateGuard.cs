using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Animator'daki Throw durumuna eklenir. Bırakma karesinden önce durumdan çıkılırsa (kesinti, geçiş)
    /// bekleyen atışı temizler; atış durumu kilitlenmez. Normal akışta (top bırakıldıysa) etkisizdir.
    /// </summary>
    public sealed class ThrowStateGuard : StateMachineBehaviour
    {
        ThrowController controller;

        public override void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
        {
            if (controller == null) controller = animator.GetComponentInParent<ThrowController>();
            if (controller != null) controller.CancelPending();
        }
    }
}
