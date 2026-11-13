// dotnet run  → C# motoru (Kod/) ile tarayıcı motorunun (sim.js) kayıtlı sonuçlarını karşılaştırır.
using System; using System.Collections.Generic; using System.IO; using System.Linq; using System.Text.Json;
using Kut;

static List<TakimBirimi> Takim(JsonElement e) => e.EnumerateArray().Select(b => new TakimBirimi {
    H = b.GetProperty("h").GetString(), S = b.GetProperty("s").GetInt32(),
    F = b.TryGetProperty("f", out var f) ? f.GetString() : null, X = b.GetProperty("x").GetInt32(), Y = b.GetProperty("y").GetInt32() }).ToList();
static bool Ayni(List<TakimBirimi> a, List<TakimBirimi> b) => a.Count == b.Count && a.Zip(b).All(p => p.First.H == p.Second.H && p.First.S == p.Second.S && p.First.F == p.Second.F && p.First.X == p.Second.X && p.First.Y == p.Second.Y);

var dosya = Path.Combine(AppContext.BaseDirectory, "../../../esdeger.json");
var vakalar = JsonDocument.Parse(File.ReadAllText(dosya)).RootElement;
int i = 0, hata = 0, takimHata = 0, kodHata = 0;
foreach (var v in vakalar.EnumerateArray())
{
    var A = Takim(v.GetProperty("A")); var B = Takim(v.GetProperty("B"));
    if (!v.TryGetProperty("elle", out _))
    {
        var a2 = KutHayalet.BotTakim(v.GetProperty("tur").GetInt32(), v.GetProperty("tohumA").GetDouble(), v.GetProperty("gucA").GetDouble());
        var b2 = KutHayalet.BotTakim(v.GetProperty("tur").GetInt32(), v.GetProperty("tohumB").GetDouble(), v.GetProperty("gucB").GetDouble());
        if (!Ayni(a2, A) || !Ayni(b2, B)) { takimHata++; if (takimHata < 4) Console.WriteLine($"✗ vaka {i}: bot takımı farklı"); }
    }
    var kod = v.GetProperty("kod").GetString(); var ad = KutHayalet.Coz(kod);
    if (ad == null || !Ayni(ad.Takim, A) || KutHayalet.Kodla(A, ad.Ad) != kod) { kodHata++; if (kodHata < 4) Console.WriteLine($"✗ vaka {i}: düello kodu farklı"); }

    var o = v.GetProperty("opt");
    var kut = o.TryGetProperty("kut", out var ke) ? ke.EnumerateArray().Select(k => new KutKaydi { T = k.GetProperty("t").GetDouble(), Taraf = k.GetProperty("taraf").GetInt32(), I = k.GetProperty("i").GetInt32() }).ToList() : null;
    var yz = o.TryGetProperty("yz", out var ye) ? ye.EnumerateArray().Select(x => x.GetInt32()).ToArray() : null;
    var sv = new KutSavas(A, B, o.GetProperty("tohum").GetDouble(), o.GetProperty("alamet").GetString(), kut, yz);
    int n = 0; while (!sv.Bitti && n < 100000) { sv.Adim(); n++; }
    var s = v.GetProperty("sonuc");
    var hp = s.GetProperty("hp").EnumerateArray().Select(x => x.GetDouble()).ToArray();
    var xy = s.GetProperty("xy").EnumerateArray().Select(x => x.EnumerateArray().Select(y => y.GetDouble()).ToArray()).ToArray();
    bool ok = n == s.GetProperty("adim").GetInt32() && sv.T == s.GetProperty("t").GetDouble()
        && sv.Sonuc.Kazanan == s.GetProperty("sonuc").GetProperty("kazanan").GetInt32()
        && Math.Abs(sv.Sonuc.Kalan - s.GetProperty("sonuc").GetProperty("kalan").GetDouble()) < 1e-9
        && sv.Birimler.Select(u => u.Hp).SequenceEqual(hp)
        && sv.Birimler.Select((u, j) => u.X == xy[j][0] && u.Y == xy[j][1]).All(x => x);
    if (!ok) { hata++; if (hata < 6) Console.WriteLine($"✗ vaka {i}: adım {n}/{s.GetProperty("adim").GetInt32()} kazanan {sv.Sonuc.Kazanan}/{s.GetProperty("sonuc").GetProperty("kazanan").GetInt32()} t {sv.T:R}/{s.GetProperty("t").GetDouble():R} hp0 {sv.Birimler[0].Hp:R}/{hp[0]:R}"); }
    i++;
}
Console.WriteLine($"{i} savaş: {i - hata} birebir aynı, {hata} farklı · bot takımı farkı {takimHata} · düello kodu farkı {kodHata}");
return hata + takimHata + kodHata == 0 ? 0 : 1;
