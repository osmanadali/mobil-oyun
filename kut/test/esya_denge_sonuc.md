# Eşya denge taraması

Üreten: `node kut/test/esya_denge.cjs 2000` (belirlenimci; aynı sayıyla aynı tablo). Süre: 86 sn, 90000 savaş.

Yöntem: 2000 vaka. Her vakada iki seviyeli bot takımı (3-x ve 4-x turları, Sv 5–7) dövüşür. A takımının en güçlü birimi (kademe × yıldız) taşıyıcıdır; eşya yalnız ona verilir, B eşyasızdır. İki taraf da Kut'u yapay zekâyla kullanır. Alamet yok. Beraberlik yarım galibiyet sayılır.

- Taban (iki taraf eşyasız): A kazanma oranı **%51,5**, ortalama savaş 16,1 sn.
- 36 tam eşyanın ortalaması: **%62,0** (taban +10,5 puan).
- Hedef (bölüm 11): her tam eşya ortalamanın ±5 puanı içinde. Bantta: **36/36**; güçlü: yok; zayıf: yok.

## Tam eşyalar (kazanma oranına göre)

| # | Eşya | Tarif | Kazanma | Tabana göre | Ortalamaya göre | Durum |
|---|---|---|---|---|---|---|
| 1 | Kut Ocağı | Kor + Kor | %65,6 | +14,1 | +3,6 | bantta |
| 2 | Can Ateşi | Kor + Yürek | %65,5 | +14,0 | +3,5 | bantta |
| 3 | Ruh Testisi | Çiy + Pul | %65,3 | +13,7 | +3,2 | bantta |
| 4 | Ulu Kök | Yürek + Yürek | %64,8 | +13,2 | +2,7 | bantta |
| 5 | Dolunay Testisi | Çiy + Çiy | %64,3 | +12,8 | +2,3 | bantta |
| 6 | Taş Mühür | Kor + Kabuk | %64,3 | +12,8 | +2,3 | bantta |
| 7 | Şimşek Tüyü | Tüy + Kor | %64,3 | +12,7 | +2,2 | bantta |
| 8 | Öfke Tılsımı | Diş + Kabuk | %63,4 | +11,9 | +1,4 | bantta |
| 9 | Ana Kaya | Kabuk + Kabuk | %63,1 | +11,6 | +1,1 | bantta |
| 10 | Av Coşkusu | Diş + Tüy | %63,0 | +11,5 | +1,0 | bantta |
| 11 | Dev Yumruğu | Diş + Yürek | %63,0 | +11,5 | +1,0 | bantta |
| 12 | Buz Mızrağı | Diş + Buz | %62,9 | +11,4 | +0,9 | bantta |
| 13 | Yırtıcı Pençe | Diş + Diş | %62,7 | +11,2 | +0,7 | bantta |
| 14 | Sabır Taşı | Çiy + Kabuk | %62,6 | +11,1 | +0,6 | bantta |
| 15 | Keskin Göz | Diş + Çiy | %62,6 | +11,1 | +0,6 | bantta |
| 16 | Yel Kanadı | Tüy + Tüy | %62,3 | +10,8 | +0,2 | bantta |
| 17 | Bilge Asası | Kor + Çiy | %62,3 | +10,8 | +0,2 | bantta |
| 18 | Kızgın Diş | Diş + Kor | %62,2 | +10,7 | +0,2 | bantta |
| 19 | Buz Pınarı | Çiy + Buz | %62,1 | +10,6 | +0,1 | bantta |
| 20 | Buzul Zırh | Kabuk + Buz | %62,1 | +10,6 | +0,1 | bantta |
| 21 | Sis Pelerini | Tüy + Kabuk | %61,9 | +10,4 | -0,1 | bantta |
| 22 | Şifa Pınarı | Çiy + Yürek | %61,8 | +10,3 | -0,2 | bantta |
| 23 | Gece Kanadı | Tüy + Pul | %61,6 | +10,1 | -0,4 | bantta |
| 24 | Bulut Nalı | Tüy + Yürek | %61,5 | +10,0 | -0,5 | bantta |
| 25 | Rüzgâr Çanı | Tüy + Çiy | %60,8 | +9,3 | -1,2 | bantta |
| 26 | Buz Dağı | Yürek + Buz | %60,8 | +9,3 | -1,3 | bantta |
| 27 | Kar Tanesi | Tüy + Buz | %60,5 | +9,0 | -1,5 | bantta |
| 28 | Gölge Mürekkebi | Kor + Pul | %60,3 | +8,8 | -1,7 | bantta |
| 29 | Işık Kalkanı | Buz + Buz | %60,3 | +8,8 | -1,7 | bantta |
| 30 | Gece Avcısı | Diş + Pul | %60,3 | +8,8 | -1,8 | bantta |
| 31 | Dev Kükremesi | Kabuk + Yürek | %60,2 | +8,7 | -1,8 | bantta |
| 32 | Gece Yüreği | Yürek + Pul | %59,5 | +8,0 | -2,6 | bantta |
| 33 | Kara Buz | Pul + Buz | %58,9 | +7,4 | -3,1 | bantta |
| 34 | Diken Kabuk | Kabuk + Pul | %58,7 | +7,2 | -3,3 | bantta |
| 35 | Gölge Pelerini | Pul + Pul | %58,7 | +7,2 | -3,3 | bantta |
| 36 | Ayaz Asası | Kor + Buz | %58,5 | +7,0 | -3,5 | bantta |

## Bileşenler (tek başına)

| Bileşen | Kazanma | Tabana göre |
|---|---|---|
| Tüy | %56,0 | +4,5 |
| Kor | %55,4 | +3,9 |
| Yürek | %55,3 | +3,8 |
| Kabuk | %55,1 | +3,6 |
| Diş | %54,9 | +3,3 |
| Çiy | %54,8 | +3,3 |
| Pul | %54,4 | +2,9 |
| Buz | %53,4 | +1,9 |

## Okuma notları

- Tarama tek taşıyıcı ve tek eşyayla yapılır. Eşyanın doğal taşıyıcısı (ör. Kut Ocağı için yetenekçi, Diken Kabuk için ön sıradaki tank) her vakada seçilmez; taşıyıcı yalnız kademe × yıldıza göre seçilir. Takım etkili eşyalar (Işık Kalkanı, Ulu Kök, Av Coşkusu) ve Kut'a bağlı eşyalar bu yüzden olduğundan zayıf ya da güçlü görünebilir.
- Bir tam eşya iki bileşenin istatistiğini de verir; "tabana göre" sütunu bu toplamın etkisidir. Eşyanın kendi etkisinin payı için iki bileşenin satırlarına bakılabilir.
- Sayılar belgedeki değerlerle (bölüm 5.2–5.3) ölçüldü; son denetimde iki eşya ayarlandı: Ruh Testisi dost ölünce 30 yerine 20 mana, Gölge Pelerini öldürünce ek %15 iyileşme. Ayrıntı: `test/DENGE_RAPORU.md`.
