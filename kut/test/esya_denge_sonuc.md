# Eşya denge taraması

Üreten: `node kut/test/esya_denge.cjs 2000` (belirlenimci; aynı sayıyla aynı tablo). Süre: 96 sn, 90000 savaş.

Yöntem: 2000 vaka. Her vakada iki seviyeli bot takımı (3-x ve 4-x turları, Sv 5–7) dövüşür. A takımının en güçlü birimi (kademe × yıldız) taşıyıcıdır; eşya yalnız ona verilir, B eşyasızdır. İki taraf da Kut'u yapay zekâyla kullanır. Alamet yok. Beraberlik yarım galibiyet sayılır.

- Taban (iki taraf eşyasız): A kazanma oranı **%52,3**, ortalama savaş 16,2 sn.
- 36 tam eşyanın ortalaması: **%61,8** (taban +9,5 puan).
- Hedef (bölüm 11): her tam eşya ortalamanın ±5 puanı içinde. Bantta: **34/36**; güçlü: Ruh Testisi; zayıf: Gölge Pelerini.

## Tam eşyalar (kazanma oranına göre)

| # | Eşya | Tarif | Kazanma | Tabana göre | Ortalamaya göre | Durum |
|---|---|---|---|---|---|---|
| 1 | Ruh Testisi | Çiy + Pul | %67,4 | +15,1 | +5,6 | güçlü |
| 2 | Kut Ocağı | Kor + Kor | %65,5 | +13,2 | +3,7 | bantta |
| 3 | Can Ateşi | Kor + Yürek | %64,9 | +12,6 | +3,1 | bantta |
| 4 | Şimşek Tüyü | Tüy + Kor | %64,3 | +12,0 | +2,5 | bantta |
| 5 | Taş Mühür | Kor + Kabuk | %63,8 | +11,5 | +2,0 | bantta |
| 6 | Ulu Kök | Yürek + Yürek | %63,7 | +11,4 | +1,9 | bantta |
| 7 | Buz Mızrağı | Diş + Buz | %63,6 | +11,3 | +1,8 | bantta |
| 8 | Ana Kaya | Kabuk + Kabuk | %63,4 | +11,1 | +1,6 | bantta |
| 9 | Öfke Tılsımı | Diş + Kabuk | %63,3 | +11,0 | +1,5 | bantta |
| 10 | Dolunay Testisi | Çiy + Çiy | %63,3 | +11,0 | +1,4 | bantta |
| 11 | Yel Kanadı | Tüy + Tüy | %63,2 | +10,9 | +1,3 | bantta |
| 12 | Av Coşkusu | Diş + Tüy | %62,8 | +10,5 | +1,0 | bantta |
| 13 | Kızgın Diş | Diş + Kor | %62,4 | +10,1 | +0,6 | bantta |
| 14 | Yırtıcı Pençe | Diş + Diş | %62,4 | +10,1 | +0,5 | bantta |
| 15 | Sabır Taşı | Çiy + Kabuk | %62,4 | +10,1 | +0,5 | bantta |
| 16 | Dev Yumruğu | Diş + Yürek | %62,2 | +9,9 | +0,4 | bantta |
| 17 | Keskin Göz | Diş + Çiy | %62,2 | +9,9 | +0,3 | bantta |
| 18 | Gece Kanadı | Tüy + Pul | %62,1 | +9,8 | +0,3 | bantta |
| 19 | Bilge Asası | Kor + Çiy | %62,1 | +9,8 | +0,2 | bantta |
| 20 | Şifa Pınarı | Çiy + Yürek | %61,7 | +9,4 | -0,1 | bantta |
| 21 | Buzul Zırh | Kabuk + Buz | %61,7 | +9,4 | -0,1 | bantta |
| 22 | Buz Pınarı | Çiy + Buz | %61,7 | +9,4 | -0,2 | bantta |
| 23 | Rüzgâr Çanı | Tüy + Çiy | %61,6 | +9,3 | -0,2 | bantta |
| 24 | Bulut Nalı | Tüy + Yürek | %61,3 | +9,0 | -0,6 | bantta |
| 25 | Sis Pelerini | Tüy + Kabuk | %61,2 | +8,9 | -0,7 | bantta |
| 26 | Gece Avcısı | Diş + Pul | %60,7 | +8,4 | -1,1 | bantta |
| 27 | Gölge Mürekkebi | Kor + Pul | %60,5 | +8,2 | -1,3 | bantta |
| 28 | Kar Tanesi | Tüy + Buz | %60,5 | +8,2 | -1,4 | bantta |
| 29 | Buz Dağı | Yürek + Buz | %59,8 | +7,5 | -2,0 | bantta |
| 30 | Işık Kalkanı | Buz + Buz | %59,7 | +7,4 | -2,1 | bantta |
| 31 | Gece Yüreği | Yürek + Pul | %59,5 | +7,2 | -2,3 | bantta |
| 32 | Dev Kükremesi | Kabuk + Yürek | %59,1 | +6,8 | -2,8 | bantta |
| 33 | Kara Buz | Pul + Buz | %58,9 | +6,6 | -2,9 | bantta |
| 34 | Diken Kabuk | Kabuk + Pul | %58,8 | +6,5 | -3,1 | bantta |
| 35 | Ayaz Asası | Kor + Buz | %58,0 | +5,7 | -3,8 | bantta |
| 36 | Gölge Pelerini | Pul + Pul | %56,8 | +4,5 | -5,0 | zayıf |

## Bileşenler (tek başına)

| Bileşen | Kazanma | Tabana göre |
|---|---|---|
| Tüy | %56,7 | +4,4 |
| Kor | %55,7 | +3,4 |
| Yürek | %55,6 | +3,3 |
| Diş | %55,1 | +2,8 |
| Kabuk | %55,1 | +2,8 |
| Pul | %54,8 | +2,4 |
| Çiy | %54,5 | +2,2 |
| Buz | %54,3 | +2,0 |

## Okuma notları

- Tarama tek taşıyıcı ve tek eşyayla yapılır. Eşyanın doğal taşıyıcısı (ör. Kut Ocağı için yetenekçi, Diken Kabuk için ön sıradaki tank) her vakada seçilmez; taşıyıcı yalnız kademe × yıldıza göre seçilir. Takım etkili eşyalar (Işık Kalkanı, Ulu Kök, Av Coşkusu) ve Kut'a bağlı eşyalar bu yüzden olduğundan zayıf ya da güçlü görünebilir.
- Bir tam eşya iki bileşenin istatistiğini de verir; "tabana göre" sütunu bu toplamın etkisidir. Eşyanın kendi etkisinin payı için iki bileşenin satırlarına bakılabilir.
- Sayılar belgedeki değerlerle (bölüm 5.2–5.3) ölçüldü; ayar yapılmadı. Ayar kararı denge adımında (bölüm 11, lobi benzetimi) verilmeli.
