# Boğaz

Gece İstanbul Boğazı'nda geçen sakin bir mobil web oyunu. Vapurlar, balıkçı tekneleri ve tankerler
kuzeyden ve güneyden Boğaz'a girer; parmağınla rota çizip her gemiyi kendi rengindeki iskeleye
(Beşiktaş, Üsküdar, Bebek…) ulaştırırsın. Tankerlerin iskelesi yoktur: onları karşı uçtan çıkar.
İki gemi birbirine değerse oyun biter; zorluk zamanla artar, yeni iskeleler açılır.

Çalıştırmak için: `index.html` dosyasını tarayıcıda açman yeterli (sunucu, kütüphane, internet gerekmez).
İstersen `python3 -m http.server` ile bu klasörü sunup telefondan da açabilirsin.
Dosyalar: `index.html`, `style.css`, `game.js` (Canvas 2D + Web Audio ile sentezlenen sesler).
En iyi skor ve ses/müzik ayarları tarayıcının localStorage'ında saklanır.
