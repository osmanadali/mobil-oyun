# Fiske Arena: 2 kişilik rekabetçi oyun

Sıra tabanlı fiske oyunu. Her oyuncunun 3 pulu var. Sıra sendeyken kendi pulunu çekip bırakıyorsun, amaç rakibin pullarını arenadan düşürmek.

## Çalıştır
```bash
npm run fiske        # http://localhost:8081
npm run fiske:test   # fizik + bot + sunucu yeniden oynatma testleri
```

## Kurallar
- Rakibin 3 pulunu da düşüren kazanır. Aynı atışta kendi son pulun da düşerse kaybedersin.
- Maçın ilk atışı yarım güçte yapılır (`FIRST_POW`). Bu kural ilk başlayanın avantajını dengeler: bot maçlarında ilk başlayanın kazanma oranı %60–90'dan yaklaşık %46'ya indi.
- 40 atış dolarsa pulu çok kalan kazanır, eşitse maç berabere biter.
- Rövanşta diğer oyuncu başlar.

## Arenalar
| Arena | Özellik |
|---|---|
| Yuvarlak | Engelsiz, temel arena |
| Halka | Ortada pulu yutan bir delik var |
| Buz Pisti | Ortadaki buzda sürtünme ×0.28, pullar kayar |
| Tamponlu | Dikdörtgen arena, iki tampon pulu sert geri fırlatır |
| Çamurlu | İki yandaki çamurda sürtünme ×3.2, pullar durur |

## Görsel tasarım
- **Ana menü:** Arkada iki bot canlı bir demo maç oynar ve maç bittikçe sıradaki arenaya geçilir. Önde logo, üç mod kartı (Bota karşı, Arkadaşınla, Çevrimiçi · yakında), bot rekorları (kazanma–kaybetme), "Nasıl oynanır?" ve ses düğmesi var.
- **Kurulum:** Zorluk kartları (bot yüzleri) ve canlı önizlemeli arena kartları. Seçimler hatırlanır.
- **Arena temaları:** Yuvarlak taş mavisi, Halka mor ve dönen girdaplı, Buz Pisti parıltılı buz, Tamponlu yeşil keçe ve ahşap kenar, Çamurlu kum ve çamur. Her arenanın kendi arka planı ve uçuşan toz zerreleri var.
- **Pullar:** Parlak ve kalın. Turkuaz pulda halka, Mercan pulda elmas amblemi var, böylece renk körü oyuncular da ayırt edebilir.
- **Oyun içi:** Sıradaki oyuncunun levhası parlar. "Sıra sende", "ÇİFTE!", "Kendi pulun!" gibi bantlar çıkar. Bir de duraklat menüsü var.
- **Sonuç:** Kupa, kazananın renginde konfeti, seri skoru, Rövanş, Arena değiştir ve Menü düğmeleri.

## Mimari
| Dosya | İş |
|---|---|
| `fiske/physics.js` | Kurallar ve fizik. Deterministik: simülasyonda yalnızca `+ - * /` ve `Math.sqrt` kullanılır, atışlar 0.01'e yuvarlanır. Tarayıcıda da ileride sunucuda da aynı dosya çalışır. |
| `fiske/bot.js` | Bot aday atışları fizik motoruyla dener ve en iyisini seçer. Kolay/Orta/Zor seviyeleri, denenen aday sayısı ve nişan titremesiyle ayrılır. |
| `fiske/main.js` | Çizim (canvas), dokunma, ses, menü |
| `tools/fiske-test.mjs` | 60 bot maçı oynatır ve her maçı atış listesinden (`replay`) birebir yeniden kurar |

**Sunucu doğrulaması:** Bir maç yalnızca `arena + ilk başlayan + atış listesi` ile tanımlanır. Sunucu `replay()` ile maçı yeniden oynatır ve kazananı kendisi belirler. İstemci "kazandım" diye yalan söyleyemez.

## Yol haritası
1. **Prototip (bitti):** Bota karşı ve tek telefonda 2 kişi oynanabiliyor, 5 arena var.
2. **Çevrimiçi:** Cloudflare Workers üzerinde Durable Objects. Her maç bir oda olur ve WebSocket ile yalnızca atışlar gönderilir. Sunucu `physics.js` ile doğrular. Oda kodu ve davet linki (`@capacitor/share`) eklenir.
3. **Rekabet:** ELO/lig puanı ve haftalık sezon. Eşleştirmede 10 saniyede rakip bulunmazsa bot veya hayalet rakip devreye girer.
4. **Ray Düello:** Aynı sunucu altyapısına ikinci mod olarak eklenir. İki oyuncuya aynı seed ile aynı Ray bulmacası verilir, önce bitiren kazanır. Sunucu hamle listesini doğrular (`www/game.js` → `generate(cols, rows, seed)`).

## Açık işler
- Halka arenasında ilk başlayan hâlâ önde (~%70). Delik boyutu veya başlangıç dizilimi ayarlanmalı.
- Maçlar ortalama 7–12 atış sürüyor. Tam bir maç için 3 set (en iyi 2/3) düşünülebilir.
- Mağaza paketi (Capacitor, ayrı uygulama kimliği) henüz yok. Prototip yalnızca tarayıcıda çalışıyor.
