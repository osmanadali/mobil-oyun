# Ada — Ezber Parkuru

Dikey (portre) mobil oyun. Oyuncu başta bir deseni ezberler, sonra ada parkurunda mini oyunlardan geçer (platform atlama, dalış ve nefes tutma, hedefe atış) ve en kısa sürede bitirmeye çalışır. Sıralama süre + cezalar − bonus ile yapılır. Motor: Unity.

- Tasarım tuvali (parkurlar, sıralama sistemi, eski 2D karakter taslakları): https://claude.ai/artifact/RtVmQDT5nenuBgxnDaCziN
- 2D karakter taslakları beğenilmedi; karakterler aşağıdaki istemlerle üretilecek yeni referanslardan 3D'ye çevrilecek.

## İş akışı

1. **Referans görseller** (kullanıcı): Gemini'de Nano Banana Pro ile aşağıdaki istemler. Her karakter için dönüş tablosu, ayrı ön / yan / arka görseller ve ifade tablosu; bir de ortam konsepti. Görseller `oyunlar/ada/referans/` klasörüne konur.
2. **3D model**: Meshy API, çoklu görselden 3D (ön + yan + arka) → dokulu `.glb`.
3. **İskelet ve animasyon**: Meshy otomatik iskelet + animasyon kütüphanesi (koşu, zıplama, bekleme). Dalış, nefes tutma, atış ve zafer Blender'da elle.
4. **Render**: Blender 4.2 (başsız). Dönüş görüntüleri ve her animasyon için dikey klip. Unity için `.glb`.
5. **Ortam**: Blender'da prosedürel Üçlü Köprü lagünü (`3d/scripts/`), ek parçalar (palmiye, kaya, iskele) Meshy'den.

### Gerekenler
- `MESHY_API_KEY` ortam gizli değişkeni (Meshy Pro planı). Bulut ortamı menüsü → Edit → Network secrets. Yeni oturumda görünür. Alternatif: `TRIPO_API_KEY`.
- Ağ kısıtlıysa `api.meshy.ai` izinli olmalı.
- Blender oturuma bağlı geçici klasöre kuruluyor; yeni oturumda betikler yeniden indirir.

## İstemler (Nano Banana Pro)

İpuçları: her karakteri ayrı sohbette üret; düzeltmeyi tek cümleyle iste ("sadece X'i değiştir, başka hiçbir şeye dokunma"); 3D için beyaz arka plan, gölgesiz, A-poz ve ayakların görünmesi şart.

### 1) Kerem — dönüş tablosu
```
Create a professional 3D character turnaround model sheet for a stylized mobile game character.
Layout: four full-body views of the SAME character side by side in one image, evenly spaced, identical scale,
all standing on the same floor line: FRONT, LEFT SIDE (profile), BACK, THREE-QUARTER FRONT.
Orthographic camera at chest height, no perspective distortion.
Pose: neutral A-pose — standing straight, feet shoulder-width apart, arms relaxed about 30° away from the body,
palms facing the thighs, fingers together, closed mouth, neutral expression, eyes looking straight ahead.
Whole body visible from the top of the hair to the soles, nothing cropped.
Background: plain pure white, no floor texture, no cast shadows, no text, no labels, no logos, no props.
Lighting: soft, even, frontal studio light with minimal shading so shapes and colors read clearly.
Render style: high-quality stylized 3D game character render — modern stylized hero-game look,
NOT cartoon, NOT chibi, NOT photorealistic. Clean readable forms, soft PBR materials, subtle skin subsurface,
crisp silhouette, simplified but correct anatomy, head-to-body ratio about 1:6.5.

Character: "Kerem", 26-year-old Turkish man, a competitor on a tropical island obstacle-course game show.
Body: 1.84 m, athletic swimmer build — broad shoulders, defined but not bulky arms, flat stomach, strong legs,
proportionate hands with five fingers; shoulders, elbows, wrists, hips, knees and ankles connect naturally.
Skin: warm wheat / olive tan, Mediterranean, even tone.
Face: oval face, defined jawline, slightly square chin, high cheekbones, straight medium nose,
almond-shaped dark brown eyes, thick dark eyebrows, natural lips, short well-groomed stubble on jaw and upper lip,
friendly confident look.
Hair: dark brown-black, low fade on the sides, slightly longer textured top swept up and back.
Outfit:
- sleeveless athletic tank top, coral red (#E2553F), light technical fabric with subtle side mesh panels,
  white number "12" small on the left chest and large on the back
- navy board shorts (#2B3550) ending just above the knee, coral-red stripe on each outer side, white drawstring
- coral-red sweatband across the forehead, tied at the back with two short tails
- white fabric wristbands on both wrists
- charcoal grey minimalist water shoes with coral-red rubber soles
- swim goggles with turquoise lenses hanging around his neck on their strap
All four views must show exactly the same character, outfit details and colors.
```

### 2) Deniz — dönüş tablosu
```
Create a professional 3D character turnaround model sheet for a stylized mobile game character.
Layout: four full-body views of the SAME character side by side in one image, evenly spaced, identical scale,
all standing on the same floor line: FRONT, LEFT SIDE (profile), BACK, THREE-QUARTER FRONT.
Orthographic camera at chest height, no perspective distortion.
Pose: neutral A-pose — standing straight, feet hip-width apart, arms relaxed about 30° away from the body,
palms facing the thighs, fingers together, closed mouth, neutral expression, eyes looking straight ahead.
Whole body visible from the top of the ponytail to the soles, nothing cropped.
Background: plain pure white, no floor texture, no cast shadows, no text, no labels, no logos, no props.
Lighting: soft, even, frontal studio light with minimal shading so shapes and colors read clearly.
Render style: high-quality stylized 3D game character render — modern stylized hero-game look,
NOT cartoon, NOT chibi, NOT photorealistic. Clean readable forms, soft PBR materials, subtle skin subsurface,
crisp silhouette, simplified but correct anatomy, head-to-body ratio about 1:6.5.

Character: "Deniz", 24-year-old Turkish woman, a competitor on a tropical island obstacle-course game show.
Body: 1.70 m, athletic and toned with a clearly feminine figure — narrower shoulders, defined waist,
curvier hips, natural bust, slim strong arms and legs, proportionate hands with five fingers;
shoulders, elbows, wrists, hips, knees and ankles connect naturally.
Skin: warm light honey tan, even tone.
Face: soft oval face, gentle jaw, high cheekbones, small straight nose, large almond-shaped hazel-brown eyes
with natural lashes, naturally arched brows, fuller lips, determined but warm look.
Hair: long dark chestnut-brown hair in a high ponytail reaching mid-back, tied with a blue hair tie,
a couple of loose face-framing strands.
Outfit:
- racerback sports tank top, azure blue (#2F7DD1), light technical fabric,
  white number "07" small on the chest and large on the back
- navy board shorts (#2B3550) at mid-thigh, azure-blue stripe on each outer side, white drawstring
- azure-blue sweatband across the forehead, tied at the back with two short tails
- swim goggles with turquoise lenses pushed up on the forehead, resting above the sweatband
- white fabric wristbands on both wrists
- charcoal grey minimalist water shoes with azure-blue rubber soles
All four views must show exactly the same character, outfit details and colors.
```

### 3) Tek tek görünümler (aynı sohbette, 3D çevirisi için)
```
Using the sheet above, render ONLY the FRONT view of this exact character as a single image:
1:1 square, full body centered with a small margin, same A-pose, orthographic, plain white background,
even lighting, no shadows, no text. Keep every detail identical.
```
Aynısını `BACK view` ve `LEFT SIDE view` için tekrarla.

### 4) İfade tablosu
```
Same character as above. Create a facial expression sheet: four head-and-shoulders portraits in a 2×2 grid,
front view, same style and lighting, plain white background, no text:
1) neutral  2) intense focus while memorizing — eyes slightly narrowed, brows drawn together, lips pressed
3) holding breath underwater — goggles pulled down over the eyes, cheeks puffed, lips sealed
4) joyful victory — big open smile, eyes squinting with joy
```

### 5) Ortam konsepti — Üçlü Köprü
```
Vertical 9:16 concept art of a level in a stylized 3D mobile game, third-person camera behind and above the player.
A tropical lagoon in late afternoon: clear turquoise water, a wooden start dock at the bottom,
five rows of three square sandstone stepping platforms floating over the water leading away from the camera
(all platforms look identical), a finish platform with a red flag at the far end, white sand beach,
palm trees, mossy rocks, distant green islands, warm soft sky with a few clouds.
Clean stylized look matching a modern stylized hero game, soft lighting, readable shapes,
no characters, no UI, no text.
```
