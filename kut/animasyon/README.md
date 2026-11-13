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
