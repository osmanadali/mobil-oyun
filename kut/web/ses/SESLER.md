# Kut Arena ses efektleri

34 ses, ElevenLabs Sound Effects (`eleven_text_to_sound_v2`) ile üretildi. İşlenmiş hâlleri: baştaki sessizlik kırpıldı, uzunluk sınırlandı, sonuna 0.15 sn sönme eklendi, ses düzeyi −16 LUFS'a eşitlendi, mono 96 kbps MP3. Toplam ~660 KB.

Web sürümünde sesleri `kut/web/ses.js` çalar. Ses ilk dokunuştan sonra açılır ve Ayarlar'dan kapatılabilir (`kut.ses`). Savaş sesleri görsel zamanlamaya bağlıdır: `sahne3d.js` → `dinle('ses')`. Vuruş sesi darbe anında, menzilli atış sesi mermi çıkarken, yetenek sesi efekt anında çalar.

## Eşleme (Unity'de de aynısı kullanılmalı)

| Dosya | Ne zaman | Not |
|---|---|---|
| vurus_yumruk | Yakın vuruş: golem, ayı, koç, kaplumbağa | perde ±%8 rastgele |
| vurus_isirma | Yakın vuruş: yılan, kurt, semender | |
| vurus_pence | Öteki yakın dövüşçüler | |
| atis_ok | Tilkinin atışı (mermi çıkışı) | |
| atis_buyu | Öteki menzilli atışlar (mermi çıkışı) | |
| isabet_buyu | Menzilli merminin çarpması | |
| kaya_firlat … yildirim | Yetenek: `YETENEK_SES` tablosu (ses.js) | tasFirlat→kaya_firlat, uluma, davul, ruhEmme→can_emme, kasirga, deliOfke→boynuz, zehir, buzNefes→buz, ocak→ates_halkasi, dortnal, kanat→isik_kanat, karaGolge→kara_golge, kulDogus→kul_yagmuru, ayaz, golgeOk→golge_ok, yildirim |
| kut | Kut kullanıldı | |
| olum / dirilis | Birim düştü / Anka dirildi | |
| kalkan_kir | Kalkan sıfırlandı (birim ölmeden) | |
| savas_basla | Arena yüklenip savaş başladı | |
| zafer / yenilgi | Savaş sonucu (beraberede zafer sesi biraz yavaş çalınır) | |
| satin_al | Dükkândan alım (satışta 0.8 hızla) | |
| yenile | Dükkân yenileme | |
| birlesme | 3'ü 1 yıldız atlama | |
| kaynasma | İki kahramanın kaynaşması | |
| dugme | Her düğme dokunuşu | |

Düzeyler: sık çalanlar kısık (vuruş 0.4, atış 0.3, düğme 0.35); büyük anlar yüksek (kut 1.0, zafer 0.9). Aynı ses en az 40–60 ms arayla çalınır ve aynı anda en çok 10 ses çalar.

## Unity için
- `Assets/Audio/SFX/` altına koyun. Import: *Decompress On Load* (kısa sesler), *Force To Mono*.
- Bir `SesYoneticisi` yazın: 10 kaynaklı AudioSource havuzu, ad→clip sözlüğü, pitch ±0.08. `KutSavas` olaylarını görsel zamanla (darbe anında) çalın, motor zamanıyla değil.
- İleride: müzik (dükkân ve savaş döngüsü), soy etkinleşme sesi, altın/faiz sesi.

## Seçim (kullanıcı, 4 çeşit arasından)

`vurus_yumruk=4 vurus_pence=eski vurus_isirma=3 atis_buyu=2 atis_ok=2 isabet_buyu=1 kaya_firlat=2 uluma=1 davul=eski can_emme=1 kasirga=2 boynuz=1 zehir=1 buz=3 ates_halkasi=2 dortnal=4 isik_kanat=4 kara_golge=eski kul_yagmuru=4 ayaz=4 yildirim=2 kut=4 olum=1 dirilis=eski kalkan_kir=3 savas_basla=1 zafer=eski yenilgi=eski satin_al=1 yenile=eski birlesme=1 kaynasma=eski dugme=eski golge_ok=eski`

Adaylar `kut/ses_aday/` altında duruyor (ad_1..4.mp3).
