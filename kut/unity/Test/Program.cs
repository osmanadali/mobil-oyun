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
        bool pve = v.TryGetProperty("pveR", out var pr);
        var b2 = pve ? KutLobi.PveDalga(pr.GetInt32()) : KutHayalet.BotTakim(v.GetProperty("tur").GetInt32(), v.GetProperty("tohumB").GetDouble(), v.GetProperty("gucB").GetDouble(), svB);
        if (v.TryGetProperty("esyaR", out var er)) a2 = KutHayalet.BotEsya(a2, er.GetInt32(), v.GetProperty("tohumA").GetDouble());
        if (v.TryGetProperty("esyaRB", out var erb)) b2 = KutHayalet.BotEsya(b2, erb.GetInt32(), v.GetProperty("tohumB").GetDouble());
        if (!Ayni(a2, A) || !Ayni(b2, B)) { takimHata++; if (takimHata < 4) Console.WriteLine($"✗ vaka {i}: bot takımı farklı"); }
    }
    if (v.TryGetProperty("kod", out var kodE))
    {
        var kod = kodE.GetString(); var ad = KutHayalet.Coz(kod);
        if (ad == null || !Ayni(ad.Takim, A) || KutHayalet.Kodla(A, ad.Ad) != kod) { kodHata++; if (kodHata < 4) Console.WriteLine($"✗ vaka {i}: düello kodu farklı"); }
    }

    var o = v.GetProperty("opt");
    var kut = o.TryGetProperty("kut", out var ke) ? ke.EnumerateArray().Select(k => new KutKaydi { T = k.GetProperty("t").GetDouble(), Taraf = k.GetProperty("taraf").GetInt32(), I = k.GetProperty("i").GetInt32() }).ToList() : null;
    var yz = o.TryGetProperty("yz", out var ye) ? ye.EnumerateArray().Select(x => x.GetInt32()).ToArray() : null;
    double? gb = o.TryGetProperty("gunBatimi", out var gbE) ? gbE.GetDouble() : (double?)null;
    var sv = new KutSavas(A, B, o.GetProperty("tohum").GetDouble(), o.GetProperty("alamet").GetString(), kut, yz, gunBatimi: gb);
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

// ── 6) tur planı, birikimli ekonomi ve kaybedince hasar ──
var ek = kok.GetProperty("ekonomi");
static Seri SeriOku(JsonElement e) => new Seri { Tip = e.GetProperty("tip").ValueKind == JsonValueKind.Null ? null : e.GetProperty("tip").GetString(), N = e.GetProperty("n").GetInt32() };
static bool SeriAyni(Seri a, JsonElement e) { var b = SeriOku(e); return a.Tip == b.Tip && a.N == b.N; }
static bool GelirAyni(Gelir g, JsonElement e) => g.Taban == e.GetProperty("taban").GetInt32() && g.Faiz == e.GetProperty("faiz").GetInt32() && g.Seri == e.GetProperty("seri").GetInt32()
    && g.Galibiyet == e.GetProperty("galibiyet").GetInt32() && g.Alamet == e.GetProperty("alamet").GetInt32() && g.Toplam == e.GetProperty("toplam").GetInt32();
int e1 = 0, eHata = 0;
void EkKontrol(bool ok, string ne) { e1++; if (!ok) { eHata++; if (eHata < 8) Console.WriteLine($"✗ ekonomi: {ne}"); } }
foreach (var v in ek.GetProperty("turPlan").EnumerateArray())
{
    int r = v.GetProperty("r").GetInt32(); var p = KutLobi.TurPlan(r);
    EkKontrol(p.Bolum == v.GetProperty("bolum").GetInt32() && p.Tur == v.GetProperty("tur").GetInt32() && p.Tip == v.GetProperty("tip").GetString()
        && p.Armagan == v.GetProperty("armagan").GetBoolean() && KutLobi.TurAd(r) == v.GetProperty("ad").GetString(), $"tur planı r {r}");
}
foreach (var v in ek.GetProperty("gelir").EnumerateArray())
{
    var g = KutLobi.GelirHesapla(v.GetProperty("r").GetInt32(), v.GetProperty("altin").GetInt32(), SeriOku(v.GetProperty("seri")), v.GetProperty("galibiyet").GetBoolean(), v.GetProperty("alamet").GetString());
    EkKontrol(GelirAyni(g, v.GetProperty("sonuc")), $"gelir r {v.GetProperty("r").GetInt32()} altın {v.GetProperty("altin").GetInt32()}");
}
foreach (var v in ek.GetProperty("seri").EnumerateArray())
    EkKontrol(SeriAyni(KutLobi.SeriGuncelle(SeriOku(v.GetProperty("seri")), v.GetProperty("kazanan").GetInt32(), v.GetProperty("tip").GetString()), v.GetProperty("sonuc")), "seri");
foreach (var v in ek.GetProperty("hasar").EnumerateArray())
{
    var h = KutLobi.KayipHasar(v.GetProperty("r").GetInt32(), v.GetProperty("kazanan").GetInt32(), v.GetProperty("kalanPuan").GetInt32(), v.GetProperty("kalanSayi").GetInt32(), v.GetProperty("yasayan").GetInt32());
    EkKontrol(h.SequenceEqual(v.GetProperty("sonuc").EnumerateArray().Select(x => x.GetInt32())), $"hasar r {v.GetProperty("r").GetInt32()}");
}
foreach (var v in ek.GetProperty("kaynastir").EnumerateArray())
    EkKontrol(KutLobi.KaynastirBedel(v.GetProperty("a").GetInt32(), v.GetProperty("b").GetInt32()) == v.GetProperty("sonuc").GetInt32(), "kaynaştırma bedeli");
{ int r = 0; foreach (var v in ek.GetProperty("ganimet").EnumerateArray()) { EkKontrol(KutLobi.GanimetAltin(r) == v.GetInt32(), $"ganimet r {r}"); r++; } }
int zTur = 0;
foreach (var z in ek.GetProperty("zincir").EnumerateArray())
{
    var d = new EkonomiDurum(); int yasayan = z.GetProperty("yasayan").GetInt32(); bool zok = true;
    foreach (var t in z.GetProperty("turlar").EnumerateArray())
    {
        int r = t.GetProperty("r").GetInt32(); var g = KutLobi.TurBasi(d, r, t.GetProperty("alamet").GetString());
        d.Altin -= t.GetProperty("harca").GetInt32();
        if (t.GetProperty("xpAl").GetBoolean()) { d.Altin -= KutVeri.XpBedel; var x = KutLobi.XpEkle(d.Seviye, d.Xp, KutVeri.XpMiktar); d.Seviye = x.Seviye; d.Xp = x.Xp; }
        var so = t.GetProperty("sonuc");
        var o = KutLobi.TurSonu(d, r, so.GetProperty("kazanan").GetInt32(), so.GetProperty("kalanPuan").GetInt32(), so.GetProperty("kalanSayi").GetInt32(), yasayan);
        var oz = t.GetProperty("ozet"); var du = t.GetProperty("durum");
        bool ok = GelirAyni(g, t.GetProperty("gelir")) && o.Hasar == oz.GetProperty("hasar").GetInt32() && o.Altin == oz.GetProperty("altin").GetInt32() && o.Xp == oz.GetProperty("xp").GetInt32()
            && d.Altin == du.GetProperty("altin").GetInt32() && d.Can == du.GetProperty("can").GetInt32() && d.Seviye == du.GetProperty("seviye").GetInt32() && d.Xp == du.GetProperty("xp").GetInt32()
            && d.Galibiyet == du.GetProperty("galibiyet").GetBoolean() && SeriAyni(d.Seri, du.GetProperty("seri"));
        if (!ok && zok) { zok = false; Console.WriteLine($"✗ zincir tur r {r}: altın {d.Altin}/{du.GetProperty("altin").GetInt32()} can {d.Can}/{du.GetProperty("can").GetInt32()}"); }
        zTur++;
    }
    EkKontrol(zok, "zincir");
}
Console.WriteLine($"{e1} ekonomi vakası (tur planı, gelir, seri, hasar, kaynaştırma, ganimet, {zTur} turluk zincirler): {e1 - eHata} aynı");
toplamHata += eHata;

// ── 7) eşyalar: birim istatistiği, takma, toplama, raf birleştirme, ganimet ──
var es = kok.GetProperty("esya");
int q1 = 0, qHata = 0;
void EsKontrol(bool ok, string ne) { q1++; if (!ok) { qHata++; if (qHata < 8) Console.WriteLine($"✗ eşya: {ne}"); } }
static List<string> Liste(JsonElement e) => e.EnumerateArray().Select(z => z.GetString()).ToList();
foreach (var v in es.GetProperty("stat").EnumerateArray())
{
    var st = KutMotor.BirimStatHesapla(Birim(v.GetProperty("b"))); var c = v.GetProperty("sonuc");
    var yk = c.GetProperty("yanki").EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetInt32());
    bool ok = st.Can == c.GetProperty("can").GetDouble() && st.Atk == c.GetProperty("atk").GetDouble() && st.AsEk == c.GetProperty("asEk").GetDouble()
        && st.Yg == c.GetProperty("yg").GetDouble() && st.Mana0 == c.GetProperty("mana0").GetDouble() && st.Azalt == c.GetProperty("azalt").GetDouble()
        && st.Cal == c.GetProperty("cal").GetDouble() && st.Kalkan0 == c.GetProperty("kalkan0").GetDouble() && st.KutTasi == c.GetProperty("kutTasi").GetInt32()
        && st.Esya.SequenceEqual(Liste(c.GetProperty("esya"))) && st.Soy.SequenceEqual(Liste(c.GetProperty("soy")))
        && yk.Count == st.KutYanki.Count && yk.All(p => st.KutYanki.TryGetValue(p.Key, out int n) && n == p.Value);
    EsKontrol(ok, $"istatistik {q1}: can {st.Can}/{c.GetProperty("can").GetDouble()} atk {st.Atk}/{c.GetProperty("atk").GetDouble()}");
}
foreach (var v in es.GetProperty("tak").EnumerateArray())
{
    var r = KutLobi.EsyaTak(Birim(v.GetProperty("b")), v.GetProperty("id").GetString()); var c = v.GetProperty("sonuc");
    bool ok = c.ValueKind == JsonValueKind.Null ? r == null
        : r != null && r.E.SequenceEqual(Liste(c.GetProperty("e"))) && r.Birlesen == (c.GetProperty("birlesen").ValueKind == JsonValueKind.Null ? null : c.GetProperty("birlesen").GetString());
    EsKontrol(ok, $"takma {q1}");
}
foreach (var v in es.GetProperty("topla").EnumerateArray())
{
    var ls = v.GetProperty("listeler").EnumerateArray().Select(l => (IList<string>)Liste(l)).ToList();
    var r = KutLobi.EsyaToplaBirim(Birim(v.GetProperty("b")), ls); var c = v.GetProperty("sonuc");
    EsKontrol(r.E.SequenceEqual(Liste(c.GetProperty("e"))) && r.Tasan.SequenceEqual(Liste(c.GetProperty("tasan"))), $"toplama {q1}");
}
foreach (var v in es.GetProperty("raf").EnumerateArray())
{
    var r = KutLobi.RafBirlestir(Liste(v.GetProperty("raf")), v.GetProperty("i").GetInt32(), v.GetProperty("j").GetInt32()); var c = v.GetProperty("sonuc");
    EsKontrol(c.ValueKind == JsonValueKind.Null ? r == null : r != null && r.SequenceEqual(Liste(c)), $"raf {q1}");
}
foreach (var v in es.GetProperty("ganimet").EnumerateArray())
    EsKontrol(KutLobi.GanimetEsya(v.GetProperty("r").GetInt32(), new KutRng(v.GetProperty("tohum").GetDouble())).SequenceEqual(Liste(v.GetProperty("sonuc"))), $"ganimet {q1}");
Console.WriteLine($"{q1} eşya vakası (istatistik, takma, toplama, raf, ganimet): {q1 - qHata} aynı");
toplamHata += qHata;

// ── 8) canavar dalgaları, ganimet, Kervan, bedava kahraman seçimi ──
var cv = kok.GetProperty("canavar");
int c1 = 0, cHata = 0;
void CKontrol(bool ok, string ne) { c1++; if (!ok) { cHata++; if (cHata < 8) Console.WriteLine($"✗ canavar: {ne}"); } }
static Dictionary<string, int> Kalan(JsonElement e) => e.ValueKind == JsonValueKind.Null ? null : e.EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetInt32());
static bool BirimAyni(TakimBirimi a, JsonElement e) => a.H == e.GetProperty("h").GetString() && a.S == e.GetProperty("s").GetInt32()
    && a.F == (e.TryGetProperty("f", out var f) ? f.GetString() : null);
{ int r = 0; foreach (var v in cv.GetProperty("pveDalga").EnumerateArray()) { var d = KutLobi.PveDalga(r); CKontrol(Ayni(d, Takim(v)), $"dalga r {r}"); r++; } }
foreach (var v in cv.GetProperty("ganimet").EnumerateArray())
{
    int r = v.GetProperty("r").GetInt32(); var g = KutLobi.Ganimet(r, new KutRng(v.GetProperty("tohum").GetDouble()), Kalan(v.GetProperty("kalan"))); var c = v.GetProperty("sonuc");
    var ks = c.GetProperty("kahraman").EnumerateArray().ToList();
    bool ok = g.Altin == c.GetProperty("altin").GetInt32() && g.EkAltin == c.GetProperty("ekAltin").GetInt32() && g.Esya.SequenceEqual(Liste(c.GetProperty("esya")))
        && g.Kahraman.Count == ks.Count && g.Kahraman.Zip(ks).All(p => BirimAyni(p.First, p.Second))
        && (c.GetProperty("secim").ValueKind == JsonValueKind.Null ? g.Secim == null : g.Secim != null && g.Secim.SequenceEqual(Liste(c.GetProperty("secim"))))
        && g.Zarf == (c.GetProperty("zarf").ValueKind == JsonValueKind.Null ? null : c.GetProperty("zarf").GetString());
    CKontrol(ok, $"ganimet r {r}");
}
foreach (var v in cv.GetProperty("kervan").EnumerateArray())
{
    int r = v.GetProperty("r").GetInt32();
    var l = KutLobi.KervanSecenek(r, new KutRng(v.GetProperty("tohum").GetDouble()), v.GetProperty("adet").GetInt32(), Kalan(v.GetProperty("kalan")));
    var c = v.GetProperty("sonuc").EnumerateArray().ToList();
    CKontrol(l.Count == c.Count && l.Zip(c).All(p => BirimAyni(p.First.Birim, p.Second.GetProperty("birim")) && p.First.Esya == p.Second.GetProperty("esya").GetString()), $"Kervan r {r}");
}
foreach (var v in cv.GetProperty("baslangic").EnumerateArray())
    CKontrol(KutLobi.BaslangicSecenek(new KutRng(v.GetProperty("tohum").GetDouble()), Kalan(v.GetProperty("kalan"))).SequenceEqual(Liste(v.GetProperty("sonuc"))), "bedava seçim");
{ int s0 = -1; foreach (var v in cv.GetProperty("kervanAdet").EnumerateArray()) { CKontrol(KutLobi.KervanAdet(s0) == v.GetInt32(), $"Kervan adet {s0}"); s0++; } }
Console.WriteLine($"{c1} canavar/ganimet vakası (dalga, ganimet, Kervan, bedava seçim): {c1 - cHata} aynı");
toplamHata += cHata;

int toplam = i + k1 + k2 + x1 + h1 + d1 + e1 + q1 + c1;
Console.WriteLine($"TOPLAM: {toplam - toplamHata}/{toplam} birebir aynı");
return toplamHata == 0 ? 0 : 1;
