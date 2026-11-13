# Kut Arena: Unity kodu

`Kod/` klasörü Unity'ye hazır, saf C# (MonoBehaviour değil). `Assets/Kut/Kod/` altına kopyalanır.

| Dosya | İş |
|---|---|
| `KutVeri.cs` | Kahraman, soy, alamet ve ekonomi verisi. **Otomatik üretilir:** `node kut/tools/csharp_veri.cjs` (kaynak `kut/data.js`). Elle düzenleme. |
| `KutSavas.cs` | Savaş motoru. `new KutSavas(takimA, takimB, tohum, alamet, kut, yz, kayit)`, her 0,05 sn'de `Adim()`, olaylar `Fx` listesinde, oyuncu dokunuşu `Kut(0, i)`. |
| `KutHayalet.cs` | Bot rakip (`BotTakim`), düello kodu (`Kodla` / `Coz`), uzak havuz arayüzü `IHayaletHavuzu`. |

## Tarayıcı sürümüyle eşdeğerlik

C# motoru `kut/sim.js` ile **bit bit aynı** sonucu verir. Aynı takımlar, tohum, alamet ve Kut dokunuşları; aynı adım sayısı, kazanan, her birimin son canı ve konumu. Bu sayede çevrimiçi doğrulama ve tekrar izleme iki tarafta da çalışır.

```bash
node kut/test/esdeger_uret.cjs          # JS motorundan 496 savaş kaydı → unity/Test/esdeger.json
cd kut/unity/Test && dotnet run         # C# motoru aynı savaşları oynar, karşılaştırır
```

Son sonuç: 496/496 savaş birebir aynı; bot takımı ve düello kodu farkı 0.

Kuralları değiştirirken iki motoru birlikte değiştir: önce `sim.js`, sonra `KutSavas.cs`. Ardından iki komutu yeniden çalıştır.

Belirlenimcilik için dikkat edilenler:
- `Math.hypot` yerine `sqrt(dx*dx+dy*dy)`.
- JS `Math.round` yerine `floor(x+0.5)`.
- Sıralamalar kararlı (stable); C#'ta LINQ `OrderBy`, `List.Sort` değil.
- mulberry32 `uint` aritmetiğiyle.
