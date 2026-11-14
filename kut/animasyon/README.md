# Animasyonlar

`ual.gltf` (+ `.bin`): Quaternius **Universal Animation Library** (Standard), **CC0** (ticari kullanım dahil serbest; lisans `LICENSE-UAL-CC0.txt`).
Evcil hayvan oyunundan (`osmanadali/evcil-hayvan`, `assets/anim/`) alındı. 46 animasyon, insan iskeleti.

İki ayaklı Kut Arena yaratıkları (Tripo, Mixamo adlı iskelet) için eşleme:

| Oyunda | UAL animasyonu |
|---|---|
| bekle | Idle_Loop |
| yuru | Walk_Loop (koşu: Jog_Fwd_Loop) |
| saldir (yakın) | Punch_Jab, Punch_Cross, Sword_Attack |
| atis (menzilli) | Spell_Simple_Shoot |
| yetenek | Spell_Simple_Enter → Spell_Simple_Shoot |
| vurul | Hit_Chest, Hit_Head |
| olum | Death01 |
| zafer | Dance_Loop, Jump_Start/Jump_Loop/Jump_Land |

Kemik eşlemesi (UAL `DEF-*` → Mixamo): `scripts/anim_retarget.gd` (evcil-hayvan) ve Unity'de Humanoid avatar.

## UAL2 (Universal Animation Library 2, Standard, CC0)

Quaternius'un itch.io sayfasından ücretsiz sürüm (lisans `ual2/LICENSE-UAL2-CC0.txt`). Web için sıkıştırılmış hali `web/modeller/ual2.glb` (43 animasyon). Unity için FBX'ler kullanıcının bilgisayarında (`Universal Animation Library 2-Standard`) ve itch.io'da.
İskelet adları Unreal tarzıdır; Mixamo eşlemesi: pelvis→Hips, spine_01/02/03→Spine/Spine1/Spine2, neck_01→Neck, Head→Head, clavicle_l→LeftShoulder, upperarm_l→LeftArm, lowerarm_l→LeftForeArm, hand_l→LeftHand, thigh_l→LeftUpLeg, calf_l→LeftLeg, foot_l→LeftFoot, ball_l→LeftToeBase (sağ taraf _r).
Kullanışlı klipler: OverhandThrow (Kaya Fırlat), Zombie_Scratch (Sis Yarasası pençesi), Melee_Hook, Sword_Heavy_Combo, Sword_Regular_A/B/C, Shield_Dash ve Sword_Dash (hücum), Hit_Knockback (geri savrulma), NinjaJump_Start/Land (Fırtına Ejderi, Anka), Idle_FoldArms_Loop, Yes, Zombie_Walk_Fwd_Loop.
