# Kut Arena: Unity kodu

`Kod/` klasörü Unity'ye hazır, saf C# (MonoBehaviour değil). `Assets/Kut/Kod/` altına kopyalanır.

| Dosya | İş |
|---|---|
| `KutVeri.cs` | Kahraman, soy, alamet ve ekonomi verisi. **Otomatik üretilir:** `node kut/tools/csharp_veri.cjs` (kaynak `kut/data.js`). Elle düzenleme. |
| `KutSavas.cs` | Savaş motoru. `new KutSavas(takimA, takimB, tohum, alamet, kut, yz, kayit)`, her 0,05 sn'de `Adim()`, olaylar `Fx` listesinde, oyuncu dokunuşu `Kut(0, i)`. |
| `KutHayalet.cs` | Bot rakip (`BotTakim`; `sv > 0` ise seviyeli maç: takım boyu = seviye), 4×3 yerleştirme (`Yerlestir`), düello kodu (`Kodla` / `Coz`; `KUT2-`, eski `KUT1-` de çözülür), uzak havuz arayüzü `IHayaletHavuzu`. |
| `KutLobi.cs` | Seviyeli maç kuralları (`kut/lobi.js` karşılığı): deneyim ve seviye (`XpEkle`), kahraman havuzu (`KopyaSay`, `HavuzKalan`), seviyeye bağlı dükkân çekimi (`DukkanCek`). |

## Tarayıcı sürümüyle eşdeğerlik

C# motoru `kut/sim.js` ile **bit bit aynı** sonucu verir. Aynı takımlar, tohum, alamet ve Kut dokunuşları; aynı adım sayısı, kazanan, her birimin son canı ve konumu. Bu sayede çevrimiçi doğrulama ve tekrar izleme iki tarafta da çalışır.

```bash
node kut/test/esdeger_uret.cjs          # JS'ten 802 savaş + seviye/havuz/dükkân vakaları → unity/Test/esdeger.json
cd kut/unity/Test && dotnet run         # C# aynı vakaları oynar, karşılaştırır
```

Son sonuç: 1892/1892 birebir aynı (802 savaş: Hızlı Maç botları, Sv 2–8 botları, elle kurulmuş 3×2 ve 4×3 takımlar; 40 eski KUT1 kodu; 400 deneyim eklemesi; 150 havuz hesabı; 500 dükkân çekimi). Bot takımı ve düello kodu farkı 0.

Kuralları değiştirirken iki tarafı birlikte değiştir: önce `sim.js` / `online.js` / `lobi.js`, sonra `KutSavas.cs` / `KutHayalet.cs` / `KutLobi.cs`. Ardından iki komutu yeniden çalıştır.

Belirlenimcilik için dikkat edilenler:
- `Math.hypot` yerine `sqrt(dx*dx+dy*dy)`.
- JS `Math.round` yerine `floor(x+0.5)`.
- Sıralamalar kararlı (stable); C#'ta LINQ `OrderBy`, `List.Sort` değil.
- mulberry32 `uint` aritmetiğiyle.
