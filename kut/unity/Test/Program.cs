// dotnet run  → C# motoru ve kuralları (Kod/) ile tarayıcı sürümünün (sim.js, online.js, lobi.js) kayıtlı sonuçlarını karşılaştırır.
// Fikstür: node kut/test/esdeger_uret.cjs
using System; using System.Collections.Generic; using System.IO; using System.Linq; using System.Text.Json;
using Kut;

static TakimBirimi Birim(JsonElement b) => new TakimBirimi {
    H = b.GetProperty("h").GetString(), S = b.GetProperty("s").GetInt32(),
    F = b.TryGetProperty("f", out var f) ? f.GetString() : null,
    X = b.TryGetProperty("x", out var x) ? x.GetInt32() : 0, Y = b.TryGetProperty("y", out var y) ? y.GetInt32() : 0,
    E = b.TryGetProperty("e", out var e) ? e.EnumerateArray().Select(z => z.GetString()).ToList() : new List<string>() };
static List<TakimBirimi> Takim(JsonElement e) => e.EnumerateArray().Select(b => b.ValueKind == JsonValueKind.Null ? null : Birim(b)).ToList();
static bool Ayni(List<TakimBirimi> a, List<TakimBirimi> b) => a.Count == b.Count && a.Zip(b).All(p => p.First.H == p.Second.H && p.First.S == p.Second.S && p.First.F == p.Second.F
    && p.First.X == p.Second.X && p.First.Y == p.Second.Y && p.First.E.SequenceEqual(p.Second.E));

var dosya = Path.Combine(AppContext.BaseDirectory, "../../../esdeger.json");
var kok = JsonDocument.Parse(File.ReadAllText(dosya)).RootElement;
int toplamHata = 0;

// ── 1) savaşlar ──
int i = 0, hata = 0, takimHata = 0, kodHata = 0;
foreach (var v in kok.GetProperty("savas").EnumerateArray())
{
    var A = Takim(v.GetProperty("A")); var B = Takim(v.GetProperty("B"));
    if (!v.TryGetProperty("elle", out _))
    {
        int svA = v.TryGetProperty("sv", out var s1) ? s1.GetInt32() : 0, svB = v.TryGetProperty("svB", out var s2) ? s2.GetInt32() : 0;
        var a2 = KutHayalet.BotTakim(v.GetProperty("tur").GetInt32(), v.GetProperty("tohumA").GetDouble(), v.GetProperty("gucA").GetDouble(), svA);
        var b2 = KutHayalet.BotTakim(v.GetProperty("tur").GetInt32(), v.GetProperty("tohumB").GetDouble(), v.GetProperty("gucB").GetDouble(), svB);
        if (!Ayni(a2, A) || !Ayni(b2, B)) { takimHata++; if (takimHata < 4) Console.WriteLine($"✗ vaka {i}: bot takımı farklı"); }
    }
    var kod = v.GetProperty("kod").GetString(); var ad = KutHayalet.Coz(kod);
    if (ad == null || !Ayni(ad.Takim, A) || KutHayalet.Kodla(A, ad.Ad) != kod) { kodHata++; if (kodHata < 4) Console.WriteLine($"✗ vaka {i}: düello kodu farklı"); }

    var o = v.GetProperty("opt");
    var kut = o.TryGetProperty("kut", out var ke) ? ke.EnumerateArray().Select(k => new KutKaydi { T = k.GetProperty("t").GetDouble(), Taraf = k.GetProperty("taraf").GetInt32(), I = k.GetProperty("i").GetInt32() }).ToList() : null;
    var yz = o.TryGetProperty("yz", out var ye) ? ye.EnumerateArray().Select(x => x.GetInt32()).ToArray() : null;
    var sv = new KutSavas(A, B, o.GetProperty("tohum").GetDouble(), o.GetProperty("alamet").GetString(), kut, yz);
    int n = 0; while (!sv.Bitti && n < 100000) { sv.Adim(); n++; }
    var s = v.GetProperty("sonuc"); var so = s.GetProperty("sonuc");
    var hp = s.GetProperty("hp").EnumerateArray().Select(x => x.GetDouble()).ToArray();
    var xy = s.GetProperty("xy").EnumerateArray().Select(x => x.EnumerateArray().Select(y => y.GetDouble()).ToArray()).ToArray();
    bool ok = n == s.GetProperty("adim").GetInt32() && sv.T == s.GetProperty("t").GetDouble()
        && sv.Sonuc.Kazanan == so.GetProperty("kazanan").GetInt32()
        && Math.Abs(sv.Sonuc.Kalan - so.GetProperty("kalan").GetDouble()) < 1e-9
        && sv.Sonuc.KalanPuan == so.GetProperty("kalanPuan").GetInt32() && sv.Sonuc.KalanSayi == so.GetProperty("kalanSayi").GetInt32()
        && sv.Sonuc.Sure == so.GetProperty("sure").GetDouble()
        && sv.Birimler.Select(u => u.Hp).SequenceEqual(hp)
        && sv.Birimler.Select((u, j) => u.X == xy[j][0] && u.Y == xy[j][1]).All(x => x);
    if (!ok) { hata++; if (hata < 6) Console.WriteLine($"✗ vaka {i}: adım {n}/{s.GetProperty("adim").GetInt32()} kazanan {sv.Sonuc.Kazanan}/{so.GetProperty("kazanan").GetInt32()} t {sv.T:R}/{s.GetProperty("t").GetDouble():R} hp0 {sv.Birimler[0].Hp:R}/{hp[0]:R}"); }
    i++;
}
Console.WriteLine($"{i} savaş: {i - hata} birebir aynı, {hata} farklı · bot takımı farkı {takimHata} · düello kodu farkı {kodHata}");
toplamHata += hata + takimHata + kodHata;

// ── 2) eski KUT1- kodları ──
int k1 = 0, k1Hata = 0;
foreach (var v in kok.GetProperty("kut1").EnumerateArray())
{
    var r = KutHayalet.Coz(v.GetProperty("kod").GetString()); var c = v.GetProperty("cozum");
    if (r == null || r.Ad != c.GetProperty("ad").GetString() || !Ayni(r.Takim, Takim(c.GetProperty("takim")))) { k1Hata++; if (k1Hata < 4) Console.WriteLine($"✗ KUT1 {k1}: çözüm farklı"); }
    k1++;
}
Console.WriteLine($"{k1} eski KUT1 kodu: {k1 - k1Hata} aynı çözüldü");
toplamHata += k1Hata;

// ── 2b) KUT2- kodları: eşyalı gidiş-dönüş ve bozuk kodlar ──
int k2 = 0, k2Hata = 0;
foreach (var v in kok.GetProperty("kut2").EnumerateArray())
{
    var r = KutHayalet.Coz(v.GetProperty("kod").GetString()); var c = v.GetProperty("cozum");
    bool ok = c.ValueKind == JsonValueKind.Null ? r == null
        : r != null && r.Ad == c.GetProperty("ad").GetString() && Ayni(r.Takim, Takim(c.GetProperty("takim")));
    if (ok && r != null && c.ValueKind != JsonValueKind.Null && v.GetProperty("kod").GetString().StartsWith("KUT2-") && !r.Ad.StartsWith("a") && !r.Ad.StartsWith("b"))
        ok = KutHayalet.Kodla(r.Takim, r.Ad) == v.GetProperty("kod").GetString();
    if (!ok) { k2Hata++; if (k2Hata < 4) Console.WriteLine($"✗ KUT2 {k2}: çözüm farklı ({v.GetProperty("kod").GetString()})"); }
    k2++;
}
Console.WriteLine($"{k2} KUT2 kodu (eşyalı ve bozuk): {k2 - k2Hata} aynı");
toplamHata += k2Hata;

// ── 3) seviye ve deneyim ──
int x1 = 0, xHata = 0;
foreach (var v in kok.GetProperty("xp").EnumerateArray())
{
    var r = KutLobi.XpEkle(v.GetProperty("seviye").GetInt32(), v.GetProperty("xp").GetInt32(), v.GetProperty("miktar").GetInt32()); var c = v.GetProperty("sonuc");
    if (r.Seviye != c.GetProperty("seviye").GetInt32() || r.Xp != c.GetProperty("xp").GetInt32()) { xHata++; if (xHata < 4) Console.WriteLine($"✗ deneyim {x1}: {r.Seviye}/{r.Xp}"); }
    x1++;
}
int bsHata = 0; { int r = 0; foreach (var v in kok.GetProperty("botSeviye").EnumerateArray()) { if (KutHayalet.BotSeviye(r) != v.GetInt32()) bsHata++; r++; } }
Console.WriteLine($"{x1} deneyim eklemesi: {x1 - xHata} aynı · bot seviyesi farkı {bsHata}");
toplamHata += xHata + bsHata;

// ── 4) kahraman havuzu ──
int h1 = 0, hHata = 0;
foreach (var v in kok.GetProperty("havuz").EnumerateArray())
{
    var gruplar = v.GetProperty("gruplar").EnumerateArray().Select(g => Takim(g)).ToList();
    var r = KutLobi.HavuzKalan(gruplar); var c = v.GetProperty("sonuc");
    bool ok = c.EnumerateObject().Count() == r.Count && c.EnumerateObject().All(p => r.TryGetValue(p.Name, out int n) && n == p.Value.GetInt32());
    if (!ok) { hHata++; if (hHata < 4) Console.WriteLine($"✗ havuz {h1}: farklı"); }
    h1++;
}
Console.WriteLine($"{h1} havuz hesabı: {h1 - hHata} aynı");
toplamHata += hHata;

// ── 5) seviyeye bağlı dükkân çekimi ──
int d1 = 0, dHata = 0;
foreach (var v in kok.GetProperty("dukkan").EnumerateArray())
{
    var kalan = v.GetProperty("kalan").EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetInt32());
    var r = KutLobi.DukkanCek(v.GetProperty("seviye").GetInt32(), kalan, new KutRng(v.GetProperty("tohum").GetDouble()));
    var c = v.GetProperty("sonuc").EnumerateArray().Select(z => z.ValueKind == JsonValueKind.Null ? null : z.GetString()).ToArray();
    if (!r.SequenceEqual(c)) { dHata++; if (dHata < 4) Console.WriteLine($"✗ dükkân {d1}: {string.Join(",", r)} / {string.Join(",", c)}"); }
    d1++;
}
Console.WriteLine($"{d1} dükkân çekimi: {d1 - dHata} aynı");
toplamHata += dHata;

int toplam = i + k1 + k2 + x1 + h1 + d1;
Console.WriteLine($"TOPLAM: {toplam - toplamHata}/{toplam} birebir aynı");
return toplamHata == 0 ? 0 : 1;
