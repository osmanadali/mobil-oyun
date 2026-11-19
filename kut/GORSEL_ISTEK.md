# Kut Arena: görsel istek listesi (robot / ChatGPT görsel)

Görselleri üret, `kut/gelen_gorsel/` klasörüne aşağıdaki **dosya adlarıyla** koy ve `claude/epic-albattani-jbmonn` dalına push et. Her görselin bir veya iki çeşidini üret. Çeşitlerin adı `_a` ve `_b` ile bitsin.

## Tarz referansları (her isteğe ekle)
Görsellerin hepsi aşağıdaki dosyalarla aynı tarzda olmalı:
- `kut/gorsel/arena_konsept.webp`: arena ve renk dünyası. Ana referans budur.
- `kut/konsept/golem.webp`, `kurbaga.webp`, `baykus.webp`, `ejder.webp`, `kurt.webp`, `anka.webp`: kahramanlar.
- `kut/arayuz/logo.png`: logo. Görsellerin içine logo **konmayacak**, oyun logoyu kendisi ekler.

Her komutun başına şunu yaz:
```
Match the exact art style, colors and lighting of the attached reference images. Stylized hand-painted 3D fantasy game art, rich and cinematic, premium mobile/PC game quality (not childish, not cartoon-flat). Purple-violet dusk sky, warm gold accents, glowing magic crystals, floating island arena. Creatures are NOT human: no human faces, no gender cues, no real-world culture, religion or nation symbols. NO TEXT, NO LOGO, NO UI, NO watermark.
```

## 1. Karşılama ekranı arka planı: `karsilama_arka.png`
- Yatay 16:10, en az 2560×1600.
```
Wide cinematic key art of the round stone arena on a floating island at golden-violet dusk: carved stone arches with gold inlay, large purple crystals, distant floating islands and soft clouds, volumetric light rays, gentle magical particles in the air. On the arena floor, the creatures from the references (mossy boulder golem, drummer frog, snowy owl mage, small storm dragon, crystal wolf) stand calmly facing the viewer in a loose group, low camera angle, heroic but calm. Keep the TOP-CENTER third empty sky (space for the game logo) and the BOTTOM 25% calm and darker (space for buttons). Depth of field, atmospheric perspective.
```

## 2. Yükleme ekranı arka planı: `yukleme_arka.png`
- Yatay 16:10, en az 2560×1600.
```
Moody wide shot of the same floating island arena seen from far away at twilight, mist between islands, one bright crystal glowing at the arena center, soft volumetric god rays, lots of calm negative space in the CENTER (space for logo and loading bar). Darker and calmer than a title screen, deep purple and indigo with small gold highlights.
```

## 3. Maçın Yıldızı (MVP) sahne arka planı: `mvp_arka.png`
- Yatay 16:9, en az 2560×1440.
```
Dark cinematic stage backdrop for a hero spotlight moment: deep violet-black void with a single strong warm-gold volumetric spotlight from above-behind, drifting embers and dust motes, faint arena arches silhouettes far behind, empty CENTER (a 3D creature will stand there). Elegant and mature, like an esports MVP screen. No creature in the image.
```

## 4. Büyük OYNA düğmesi: `dugme_oyna.png` ve `dugme_oyna_basili.png`
- Şeffaf arka plan (PNG). Yatay, yaklaşık 1200×360. Üzerinde yazı olmasın, yazıyı oyun koyar.
```
Game UI button, large horizontal rounded-rectangle, polished gold frame with small violet gem caps on both ends, inner surface warm glossy gold-to-amber gradient with subtle engraved runic border, soft inner glow, front view, flat lighting, transparent background, NO text. Second version: same button pressed (slightly darker, inner shadow, 2px lower highlight).
```

## 5. Profil çerçevesi: `profil_cerceve.png`
- Şeffaf arka plan (PNG), kare, yaklaşık 1024×1024. Ortası boş ve şeffaf olsun.
```
Circular avatar frame for a game profile: ornate gold ring with violet crystal at the top and small laurel-like stone leaves (not real-world symbols), empty transparent center, transparent background, front view, NO text.
```

## 6. Menü paneli süsü: `menu_panel.png`
- Şeffaf arka plan (PNG), yaklaşık 1600×1000. 9-slice'a uygun olsun: köşe süsleri köşelerde, kenarlar düz tekrar edebilir.
```
Ornate dark-violet glass game menu panel with gold filigree corners and thin gold border, semi-transparent dark interior, corner ornaments only at the corners, straight repeatable edges, front view, transparent background, NO text.
```

## Teslim
- Dosyaları `kut/gelen_gorsel/` klasörüne koy. Beğenmediğin bir çeşidi koymasan da olur.
- Commit mesajı: `Kut Arena: gelen görseller (robot)`.
- Görseller gelince Claude onları sıkıştırıp (webp) oyuna bağlayacak.
