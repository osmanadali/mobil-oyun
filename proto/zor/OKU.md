# Zor kurallar: tasarım prototipleri (yalnız başvuru)

Bu dal yalnız başvuru içindir; main'e birleştirilmez.

- `tasarimlar.json`: üç tasarımcının bütün önerileri (mekanik, kanıt, ölçüm, çizim, riskler).
- `gizli/plugins.cjs`: kapak, silik kol, kapalı durak ve gizli depo eklenti taslakları (üretim + oyun mantığı, çizim yok).
- `kisit/nehir.cjs`, `kisit/bolge*.cjs`: nehir ve tarife bölgesi taslakları.

Ölçüm betikleri artık doğrudan çalışmaz. `gizli/corepatch.cjs` ve `kisit/core.cjs` kancaları game.js'e metin yamasıyla ekliyordu, oysa bu kancalar artık main'de (commit b2c79c4). Main'deki birleşik kancalar şunlar:

- `cands(P, i)`: gizli karo maskeleri (prototipteki H1 ile aynı).
- `P.void`: prototipteki H2 ile aynı.
- `open(P, i, k)`: eşi olmadan biten kol, tahta kenarında da geçerli.
  - Prototipteki `P.exit` + `edge` (H3) ve kisit `open` yerine geçer.
  - Çözücüde `open` doğru dönen kenar serbesttir; iç kenarda simetrik olmalı.
  - Lit'te `L.open` sayılır, adet `check` ile denetlenir.
- `prune(P, C, M, unit, units)`: daralan birimler ya da −1 döndürür. Bu, kisit imzasıdır. gizli/H5'teki `prune(P, view) → bool` biçimi bu imzaya çevrilmeli.
- `difficulty(P, leaf, cap)` ve `api.difficulty`, `api.lit` (H4).
- `P.reject` (H7).
- `P.self`: çekirdek o karonun rayını, parlamasını ve durağını çizmez (H6).
