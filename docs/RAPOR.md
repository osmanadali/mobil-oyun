# Ray — Rapor

## 1. Pazar araştırması (özet)
Tutan, tek elle oynanan, çevrimdışı çalışan hiper/hibrit-casual bulmacalar:
- **Blok yerleştirme** (Block Blast vb.) — çok popüler, ama pazar doygun.
- **Sıralama bulmacaları** (su/top/vida sıralama) — kısa bölümler, reklam modeline çok uygun.
- **Ok / kaçış bulmacaları** (oklara dokunup tahtayı boşaltma) — tek dokunuş mekaniği.
- **Klasikler:** Sudoku, 2048, Nonogram, Two Dots, Wordscapes — sakin oyun döngüsü + sonsuz tekrar oynanabilirlik.

Ortak başarı formülü: tek dokunuş, 30–90 sn bölüm, anında görsel geri bildirim, ilerleme hissi (yıldız/seri), çevrimdışı oynanış, reklamın bölüm arasında olması.

## 2. Seçilen fikir: Ray
Klasik "Net/boru döndürme" mekaniği + **metro haritası** teması. Toplu taşımada oynayan kitleyle doğrudan bağ kuruyor; görsel dil (metro haritası çizgileri) doğal olarak sade ve göz yormayan.

Neden:
- Tek dokunuş → tek elle, ayakta bile oynanır.
- Prosedürel üretim → içerik maliyeti sıfır, sonsuz bölüm, uygulama küçük.
- Bölüm 20–90 sn → 15–20 dk'lık oturumda 10–20 bölüm.
- Her dokunuşta hat "yanıyor" → küçük ödül döngüsü, "bir tane daha" etkisi.

## 3. Aşama raporları
### Aşama 1 — MVP (tamam)
- Oyun çekirdeği, sonsuz bölüm, Günün Hattı, seri, ipucu, yıldız.
- Tema (koyu/açık/oto), ses, titreşim, animasyonlar, bildirim (toast).
- Çevrimdışı PWA + Capacitor/AdMob iskeleti.
- Test: 1.197 üretilen bulmacanın tamamı çözülebilir, hiçbiri hazır çözülü değil; konsol hatası yok.

### Sonraki adımlar (öneri)
- Android derleme + gerçek cihazda test.
- AdMob hesabı / kimlikleri.
- Mağaza görselleri ve açıklaması.
