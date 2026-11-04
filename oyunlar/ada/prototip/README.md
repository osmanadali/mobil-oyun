# Ada — oynanabilir 3D prototip (mobil web)

Üçlü Köprü (ezber köprüsü) ve Hedef Dizisi (sıralı atış) bölümlerini, menü / bölüm seçimi / HUD / sonuç ekranlarıyla dikey telefon ekranında denemek için Three.js prototipi. Unity sürümü için his ve arayüz akışının referansıdır.

- Çalıştırma: klasörü bir http sunucusuyla açın (`npx http-server oyunlar/ada/prototip`), GLB `fetch` ile yüklendiği için `file://` çalışmaz.
- Dosyalar: `index.html`, `style.css`, `game.js` (sahne + oynanış), `ui.js` (ekranlar), `audio.js` (Web Audio sesleri), `data.js` (bölümler, kayıt), `assets/ortam_uclu_kopru.glb`.
- Karakter: şimdilik takım renginde yer tutucu. Rigli `kerem.glb` / `deniz.glb` gelince `assets/` içine koyup `assets/karakterler.json` dosyasına adlarını yazın; klipler `Bekleme, Kosu, Sprint, Ziplama, Yuzme, Atis, Zafer, Takla` adlarıyla oynatılır.
- Kayıt (ilerleme, yıldız, en iyi süre, ayarlar) yalnızca bu cihazdaki `localStorage` içindedir; sıralama da yereldir.
- Test kancası: tarayıcı konsolunda `window.__ada` (ör. `__ada.startLevel(1)`, `__ada.pattern()`, `__ada.skipMemorize()`).
