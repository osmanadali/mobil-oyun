# Kut Arena: eksik 3D modeller (ChatGPT görsel → Tripo)

Oyunda 16 kahramanın ve 6 çevre nesnesinin modeli var. **8 canavarın kendi modeli yok**: şu an kahraman modellerini renk değiştirerek kullanıyorlar (Çakıl Kıpırı golem, Gök Balinası kuğu, vb.). Ayrıca yeni karşılama görsellerinde gördüğümüz 3 arena parçası da eksik.

## Akış (her model için)
1. **ChatGPT / robot:** Aşağıdaki komutla konsept görselini üret. Tarz referansı olarak `kut/konsept/golem.webp` ve `kut/gelen_gorsel/karsilama_arka_a.png` dosyalarını ekle. Görseli `kut/gelen_gorsel/canavar_<kimlik>.png` olarak kaydet (çevre nesnesiyse `nesne_<kimlik>.png`).
2. **Tripo:** Image to 3D seç, kullanılabilen en yeni modeli kullan, doku açık olsun.
   - Üçgen sayısı: canavarlar 15–30 bin, çevre nesneleri 3–8 bin.
   - İskelet: tabloda **iskelet** sütununda ne yazıyorsa onu seç: `biped` (iki ayaklı insansı), `quadruped` (dört ayaklı) ya da `yok`.
   - Dışa aktarma: **GLB**, doku gömülü olsun.
3. Dosyayı `kut/gelen_model/<kimlik>.glb` olarak kaydet ve `claude/epic-albattani-jbmonn` dalına push et. Commit mesajı: `Kut Arena: gelen modeller (Tripo)`.

Gerisini Claude yapar: modelleri sıkıştırır, ölçekler, animasyon bağlar ve oyuna koyar.

## Ortak tarz bloğu (her canavar komutunun başına)
```
Match the exact art style, colors and lighting of the attached reference images. Stylized 3D game creature concept art, hand-painted texture look, chunky readable proportions, bold clear silhouette, saturated but soft colors, glowing elemental details, premium game quality (not childish). The creature is NOT human: no human face, no gender cues, no real-world culture, religion or nation symbols. Original fantasy design. Single creature only, centered, plain light grey background, soft even studio lighting, no cast shadow, no ground, no text, no logo, no motion blur, no cropping, no floating effects detached from the body.
```
Ardından duruş satırı gelir:
- **İki ayaklı:** `FULL BODY, FRONT VIEW, standing upright on two legs, A-POSE: arms held 30 degrees away from the body, legs slightly apart, both feet visible, calm neutral pose.`
- **Dört ayaklı / diğer:** `FULL BODY, THREE-QUARTER FRONT VIEW, standing on its legs, legs clearly separated, tail held away from the body, calm neutral pose.`

## Canavarlar (8)
| Kimlik | Ad | İskelet | Komut (tarz bloğu + duruş satırından sonra) |
|---|---|---|---|
| `cakil` | Çakıl Kıpırı | biped | `A small knee-high creature made of rounded river pebbles held together by glowing amber moss, two short stubby legs and two little pebble arms, one big curious glowing eye-gem in the chest, grey-brown stones (#9a8f80).` |
| `kirpi` | Diken Kirpi | quadruped | `A round hedgehog-like beast with long crystal-tipped bark spines on its back, small strong paws, warm brown fur (#a0764e), spines glow faintly orange at the tips.` |
| `tasKabuk` | Taş Kabuk | quadruped | `A heavy armored beast with a huge spiral stone shell like a fossil on its back, thick elephant-like legs, a short head peeking from the shell, cool grey stone (#8c8c8c) with lichen and tiny glowing blue cracks.` |
| `kumAkrebi` | Kum Akrebi | yok | `A sand scorpion beast with a segmented sandstone-plated body, two big pincers, a curled tail with a glowing amber crystal stinger, six legs, golden sand colors (#d4a95a).` |
| `anaAkrep` | Ana Akrep | yok | `A giant queen sand scorpion, larger and more ornate than a normal one: crown-like crest of amber crystals on its head, massive pincers, long curled tail with a big glowing crystal stinger, eight legs, dark amber and bronze plates (#b8742c).` |
| `gokBalinasi` | Gök Balinası | yok | `A gentle sky whale that swims through the air: long smooth body, large wing-like pectoral fins, a cloud-white belly, soft sky-blue back (#7fb8e6) with glowing constellation dots, small floating islands of moss on its back. Side view, floating.` |
| `kadimBekci` | Kadim Bekçi | biped | `A towering ancient guardian made of carved ruin stone blocks and roots, broad shoulders, huge stone fists, a glowing green rune-light core in the chest and two glowing eyes in a mask-like stone head (abstract runes, no real-world script), moss and vines (#8a9a7a).` |
| `yildizYiyen` | Yıldız Yiyen | quadruped | `A cosmic void dragon-beast, deep violet and black body (#5a3f9a) whose skin shows a starry night sky inside, four strong legs, long tail, curved crystal horns, a glowing mouth of starlight, small orbiting star particles attached close to the body.` |

## Arena nesneleri (3)
Bu üç nesnede yaratık tarz bloğu yerine şunu başa yaz:
```
Single 3D game prop concept, stylized hand-painted, matching the attached reference images, front three-quarter view, plain light grey background, no shadow, no ground, no text, no real-world cultural symbols.
```

| Kimlik | İskelet | Komut |
|---|---|---|
| `sutun` | yok | `A broken ancient stone pillar with gold inlay swirl patterns, vines and small flowers, weathered.` |
| `amblem` | yok | `A large golden ornamental emblem with a violet crystal in the center, the kind set into the edge of a round stone arena platform, abstract swirls.` |
| `rune_tasi` | yok | `A flat round rune stone pedestal with glowing golden abstract swirl lines, set into a stone floor.` |

**Not:** Şelale, sis ve ışık huzmeleri model değil, oyun içinde efektle yapılacak.
