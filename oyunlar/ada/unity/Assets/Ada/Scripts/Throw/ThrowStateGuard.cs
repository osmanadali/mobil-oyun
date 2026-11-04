using UnityEngine;

namespace Ada.Throw
{
    /// <summary>
    /// Animator'daki Throw durumuna eklenir.
    /// - Girişte: controller bu atışı "animasyonda" olarak işaretler; Throw durumundan çıkılana kadar yeni atış başlamaz.
    /// - Çıkışta: yalnız KENDİ atışı bırakılmadıysa (kesinti, geçiş) iptal edilir; sonraki bir atışa dokunmaz.
    /// </summary>
    public sealed class ThrowStateGuard : StateMachineBehaviour
    {
        ThrowController controller;

        ThrowController Get(Animator animator)
        {
            if (controller == null) controller = animator.GetComponentInParent<ThrowController>();
            return controller;
        }

        public override void OnStateEnter(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
        {
            var c = Get(animator);
            if (c != null) c.OnThrowStateEnter();
        }

        public override void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
        {
            var c = Get(animator);
            if (c != null) c.OnThrowStateExit();
        }
    }
}
