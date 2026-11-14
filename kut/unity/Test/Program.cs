// dotnet run  → C# motoru ve kuralları (Kod/) ile tarayıcı sürümünün (sim.js, online.js, lobi.js) kayıtlı sonuçlarını karşılaştırır.
// Fikstür: node kut/test/esdeger_uret.cjs
using System; using System.Collections.Generic; using System.IO; using System.Linq; using System.Text.Json;
using Kut;

static TakimBirimi Birim(JsonElement b) => new TakimBirimi {
    H = b.GetProperty("h").GetString(), S = b.GetProperty("s").GetInt32(),
    F = b.TryGetProperty("f", out var f) ? f.GetString() : null, F2 = b.TryGetProperty("f2", out var f2) ? f2.GetString() : null,
    X = b.TryGetProperty("x", out var x) ? x.GetInt32() : 0, Y = b.TryGetProperty("y", out var y) ? y.GetInt32() : 0,
    E = b.TryGetProperty("e", out var e) ? e.EnumerateArray().Select(z => z.GetString()).ToList() : new List<string>() };
static List<TakimBirimi> Takim(JsonElement e) => e.EnumerateArray().Select(b => b.ValueKind == JsonValueKind.Null ? null : Birim(b)).ToList();
static bool Ayni(List<TakimBirimi> a, List<TakimBirimi> b) => a.Count == b.Count && a.Zip(b).All(p => p.First.H == p.Second.H && p.First.S == p.Second.S && p.First.F == p.Second.F && p.First.F2 == p.Second.F2
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
    var arm = o.TryGetProperty("armagan", out var arE) ? arE.EnumerateArray().Select(l => (IList<string>)l.EnumerateArray().Select(z => z.GetString()).ToList()).ToList() : null;
    var hak = o.TryGetProperty("kutHak", out var hkE) ? hkE.EnumerateArray().Select(x => x.GetInt32()).ToArray() : null;
    var yzy = o.TryGetProperty("yzYedek", out var yyE) ? yyE.EnumerateArray().Select(x => x.GetInt32()).ToArray() : null;
    var sv = new KutSavas(A, B, o.GetProperty("tohum").GetDouble(), o.GetProperty("alamet").GetString(), kut, yz, gunBatimi: gb, armagan: arm, kutHak: hak, yzYedek: yzy);
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
        && sv.Birimler.Select((u, j) => u.X == xy[j][0] && u.Y == xy[j][1]).All(x => x)
        && sv.Sonuc.Kut.SequenceEqual(so.GetProperty("kut").EnumerateArray().Select(x => x.GetInt32()))
        && sv.Birimler.Select(u => u.Mp).SequenceEqual(s.GetProperty("mp").EnumerateArray().Select(x => x.GetDouble()))
        && sv.Birimler.Select(u => u.Kalkan).SequenceEqual(s.GetProperty("kalkan").EnumerateArray().Select(x => x.GetDouble()));
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
    var g = KutLobi.GelirHesapla(v.GetProperty("r").GetInt32(), v.GetProperty("altin").GetInt32(), SeriOku(v.GetProperty("seri")), v.GetProperty("galibiyet").GetBoolean(), v.GetProperty("alamet").GetString(), v.GetProperty("faizTavan").GetInt32());
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
    d.Armagan = z.GetProperty("armagan").EnumerateArray().Select(x => x.GetString()).ToList();
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
    double km = v.GetProperty("km").GetDouble(); var stk = km != 0 ? KutMotor.BirimStatHesapla(Birim(v.GetProperty("b")), km) : st;
    var yk = c.GetProperty("yanki").EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetInt32());
    bool ok = stk.Can == c.GetProperty("can").GetDouble() && stk.Atk == c.GetProperty("atk").GetDouble() && st.AsEk == c.GetProperty("asEk").GetDouble()
        && st.YankiSira.SequenceEqual(Liste(c.GetProperty("yankiSira")))
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

// ── 9) 8 kişilik hayalet lobi: bot izi, kayıtlı iz, lobi izleri, alamet, kupa, eşleşme, tam lobi benzetimleri ──
var lj = kok.GetProperty("lobi");
int l1 = 0, lHata = 0;
void LKontrol(bool ok, string ne) { l1++; if (!ok) { lHata++; if (lHata < 10) Console.WriteLine($"✗ lobi: {ne}"); } }
static KutDokunus Dokunus(JsonElement e) => e.ValueKind == JsonValueKind.Null || e.ValueKind == JsonValueKind.Undefined ? null : new KutDokunus { I = e.GetProperty("i").GetInt32(), T = e.GetProperty("t").GetDouble() };
static IzTur IzT(JsonElement e) => new IzTur { R = e.GetProperty("r").GetInt32(), Seviye = e.TryGetProperty("seviye", out var sv) ? sv.GetInt32() : 0, Takim = Takim(e.GetProperty("takim")),
    Yedek = e.TryGetProperty("yedek", out var y) ? Takim(y) : new List<TakimBirimi>(), Kut = e.TryGetProperty("kut", out var k) ? Dokunus(k) : null,
    Armagan = e.TryGetProperty("armagan", out var ar) ? ar.EnumerateArray().Select(z => z.GetString()).ToList() : new List<string>() };
static bool IzAyni(IzTur a, JsonElement e) => a != null && a.R == e.GetProperty("r").GetInt32() && a.Seviye == e.GetProperty("seviye").GetInt32() && Ayni(a.Takim, Takim(e.GetProperty("takim")))
    && Ayni(a.Yedek, Takim(e.GetProperty("yedek"))) && a.Armagan.SequenceEqual(e.GetProperty("armagan").EnumerateArray().Select(z => z.GetString())) && (e.GetProperty("kut").ValueKind == JsonValueKind.Null ? a.Kut == null : a.Kut != null && a.Kut.I == e.GetProperty("kut").GetProperty("i").GetInt32() && a.Kut.T == e.GetProperty("kut").GetProperty("t").GetDouble());
static MacIzi Mac(JsonElement e) => new MacIzi { MacId = e.GetProperty("macId").GetString(), Oyuncu = e.GetProperty("oyuncu").ValueKind == JsonValueKind.Null ? null : e.GetProperty("oyuncu").GetString(),
    Ad = e.GetProperty("ad").GetString(), Kupa = e.GetProperty("kupa").GetInt32(), Sira = e.GetProperty("sira").GetInt32(), Surum = e.GetProperty("surum").GetInt32(), Turlar = e.GetProperty("turlar").EnumerateArray().Select(IzT).ToList() };
static int? Sayi(JsonElement e) => e.ValueKind == JsonValueKind.Null ? (int?)null : e.GetInt32();
foreach (var v in lj.GetProperty("izEgri").EnumerateArray())
    LKontrol(KutHayalet.IzEgri(v.GetProperty("r").GetDouble()).SequenceEqual(v.GetProperty("v").EnumerateArray().Select(x => x.GetDouble())), $"eğri r {v.GetProperty("r").GetDouble()}");
foreach (var v in lj.GetProperty("botIz").EnumerateArray())
    LKontrol(IzAyni(KutHayalet.BotIzTur(v.GetProperty("tohum").GetDouble(), v.GetProperty("guc").GetDouble(), v.GetProperty("r").GetInt32()), v.GetProperty("sonuc")), $"bot izi r {v.GetProperty("r").GetInt32()}");
foreach (var v in lj.GetProperty("izTur").EnumerateArray())
{
    var turlar = v.GetProperty("turlar").EnumerateArray().Select(IzT).ToList(); var c = v.GetProperty("sonuc");
    var a2 = KutHayalet.IzTurAl(turlar, v.GetProperty("r").GetInt32());
    LKontrol(c.ValueKind == JsonValueKind.Null ? a2 == null : IzAyni(a2, c), $"kayıtlı iz r {v.GetProperty("r").GetInt32()}");
}
foreach (var v in lj.GetProperty("lobiIz").EnumerateArray())
{
    var kayit = v.GetProperty("kayit").EnumerateArray().Select(Mac).ToList();
    var l = KutHayalet.LobiIzler(v.GetProperty("kupa").GetInt32(), v.GetProperty("tohum").GetDouble(), kayit, v.GetProperty("oyuncu").ValueKind == JsonValueKind.Null ? null : v.GetProperty("oyuncu").GetString(), Sayi(v.GetProperty("surum")));
    var c = v.GetProperty("sonuc").EnumerateArray().ToList();
    LKontrol(l.Count == c.Count && l.Zip(c).All(p => p.First.Ad == p.Second.GetProperty("ad").GetString() && p.First.Kupa == p.Second.GetProperty("kupa").GetInt32()
        && (p.Second.TryGetProperty("bot", out var bt) ? p.First.Bot && p.First.BotTohum == bt.GetProperty("tohum").GetDouble() && p.First.BotGuc == bt.GetProperty("guc").GetDouble()
            : !p.First.Bot && p.First.Oyuncu == (p.Second.GetProperty("oyuncu").ValueKind == JsonValueKind.Null ? null : p.Second.GetProperty("oyuncu").GetString()) && p.First.Turlar.Count == p.Second.GetProperty("turlar").GetArrayLength())), "lobi izleri");
}
foreach (var v in lj.GetProperty("alamet").EnumerateArray())
    LKontrol(KutLobi.LobiAlamet(v.GetProperty("tohum").GetDouble(), v.GetProperty("r").GetInt32()) == v.GetProperty("al").GetString(), "lobi alameti");
foreach (var v in lj.GetProperty("kupa").EnumerateArray())
    LKontrol(KutLobi.KupaDegisim(v.GetProperty("sira").GetInt32(), v.GetProperty("kupa").GetInt32()) == v.GetProperty("d").GetInt32(), "kupa");
static bool EsAyni(Eslesme ez, JsonElement e) => ez.R == e.GetProperty("r").GetInt32()
    && ez.Ciftler.Count == e.GetProperty("ciftler").GetArrayLength() && ez.Ciftler.Zip(e.GetProperty("ciftler").EnumerateArray()).All(p => p.First.SequenceEqual(p.Second.EnumerateArray().Select(x => x.GetInt32())))
    && (e.GetProperty("yansima").ValueKind == JsonValueKind.Null ? ez.Yansima == null : ez.Yansima != null && ez.Yansima[0] == e.GetProperty("yansima").GetProperty("a").GetInt32() && ez.Yansima[1] == e.GetProperty("yansima").GetProperty("kopya").GetInt32());
foreach (var v in lj.GetProperty("eslesme").EnumerateArray())
{
    var lb = new Lobi { Tohum = v.GetProperty("tohum").GetDouble() };
    var olu = v.GetProperty("olu").EnumerateArray().ToList(); var sy = v.GetProperty("sonYansima").EnumerateArray().ToList(); var gc = v.GetProperty("gecmis").EnumerateArray().ToList();
    for (int q = 0; q < olu.Count; q++) lb.Oyuncular.Add(new LobiOyuncu { I = q, Olu = olu[q].GetBoolean(), SonYansima = sy[q].GetBoolean(), GecmisRakip = gc[q].EnumerateArray().Select(x => x.GetInt32()).ToList() });
    LKontrol(EsAyni(KutLobi.EslesmeKur(lb, v.GetProperty("r").GetInt32()), v.GetProperty("es")), $"eşleşme r {v.GetProperty("r").GetInt32()}");
}
// tam lobiler: aynı izlerle kurulup tur tur oynatılır; her tur eşleşme, savaş sonuçları, hasar, can, sıra, seri ve elenenler karşılaştırılır
int lobiSavas = 0;
foreach (var v in lj.GetProperty("lobi").EnumerateArray())
{
    double tohum = v.GetProperty("tohum").GetDouble(); int kupa = v.GetProperty("kupa").GetInt32(); bool kayitli = v.GetProperty("kayitli").GetBoolean(), canli = v.GetProperty("canli").GetBoolean();
    var iz = KutHayalet.LobiIzler(kupa, tohum, null, null, null, 8);
    if (kayitli) for (int k = 1; k < 8; k += 3)
    {
        var bi = KutHayalet.BotIz(iz[k].BotTohum, iz[k].BotGuc, 8 + k * 3);
        var tl = bi.Where((x, q) => KutLobi.TurPlan(q).Tip != "kervan" && (q % 3 != 1 || (8 + k * 3) % 2 == 1)).ToList();
        for (int q = 0; q < tl.Count; q++) if (q % 2 == 1) tl[q] = new IzTur { R = tl[q].R, Seviye = tl[q].Seviye, Takim = tl[q].Takim, Yedek = tl[q].Yedek, Armagan = tl[q].Armagan, Kut = new KutDokunus { I = q % tl[q].Takim.Count, T = 2 + (q % 7) * 0.65 } };
        iz[k] = new LobiIz { Ad = iz[k].Ad, Kupa = kupa, Turlar = tl };
    }
    var lb = KutLobi.LobiYeni(canli ? "Sen" : iz[0].Ad, kupa, canli ? null : iz[0], iz.Skip(1).ToList(), tohum * 2654435761.0);
    bool ok = true; string ne = "";
    foreach (var t in v.GetProperty("turlar").EnumerateArray())
    {
        int r = t.GetProperty("r").GetInt32(); if (lb.R != r || KutLobi.LobiBitti(lb)) { ok = false; ne = $"tur sırası r {r}"; break; }
        Eslesme tes = null;
        if (t.GetProperty("es").ValueKind != JsonValueKind.Null) { tes = KutLobi.EslesmeKur(lb, r); if (!EsAyni(tes, t.GetProperty("es"))) { ok = false; ne = $"eşleşme r {r}"; break; } }
        List<TakimBirimi> ct = t.TryGetProperty("canliTakim", out var cte) ? Takim(cte) : null;
        CanliSonuc cs = t.TryGetProperty("canliSonuc", out var cse) ? new CanliSonuc { Kazanan = cse.GetProperty("kazanan").GetInt32(), KalanPuan = cse.GetProperty("kalanPuan").GetInt32(), KalanSayi = cse.GetProperty("kalanSayi").GetInt32(), Sure = cse.GetProperty("sure").GetDouble() } : null;
        var rp = KutLobi.LobiTurOyna(lb, r, tes, ct, cs);
        var sj = t.GetProperty("sonuclar").EnumerateArray().ToList(); lobiSavas += sj.Count;
        bool tOk = rp.Alamet == t.GetProperty("alamet").GetString() && rp.Sonuclar.Count == sj.Count && rp.Sonuclar.Zip(sj).All(p => p.First.A == p.Second.GetProperty("a").GetInt32() && p.First.B == p.Second.GetProperty("b").GetInt32()
                && p.First.Tip == p.Second.GetProperty("tip").GetString() && p.First.Kazanan == p.Second.GetProperty("kazanan").GetInt32() && p.First.KalanPuan == p.Second.GetProperty("kalanPuan").GetInt32()
                && p.First.KalanSayi == p.Second.GetProperty("kalanSayi").GetInt32() && p.First.Sure == p.Second.GetProperty("sure").GetDouble() && p.First.Hasar.SequenceEqual(p.Second.GetProperty("hasar").EnumerateArray().Select(x => x.GetInt32())))
            && rp.Hasar.SequenceEqual(t.GetProperty("hasar").EnumerateArray().Select(x => x.GetInt32())) && rp.Elenen.SequenceEqual(t.GetProperty("elenen").EnumerateArray().Select(x => x.GetInt32()))
            && lb.Oyuncular.Select(o => o.Can).SequenceEqual(t.GetProperty("can").EnumerateArray().Select(x => x.GetInt32()))
            && lb.Oyuncular.Select(o => KutLobi.LobiSira(lb, o.I)).SequenceEqual(t.GetProperty("sira").EnumerateArray().Select(x => x.GetInt32()))
            && lb.Oyuncular.Select(o => (o.Seri.Tip ?? "") + o.Seri.N).SequenceEqual(t.GetProperty("seri").EnumerateArray().Select(x => x.GetString()));
        if (tOk && t.TryGetProperty("havuz", out var hv))
        {
            var h = KutLobi.HavuzLobi(lb, r, KutHayalet.BotIzTur(tohum, 0.5, r).Takim);
            tOk = hv.EnumerateObject().All(p => h[p.Name] == p.Value.GetInt32()) && h.Count == hv.EnumerateObject().Count();
        }
        if (!tOk) { ok = false; ne = $"tur {KutLobi.TurAd(r)} (r {r})"; break; }
    }
    if (ok)
    {
        KutLobi.LobiSonaKadar(lb);
        ok = lb.Oyuncular.Select(o => o.Sira).SequenceEqual(v.GetProperty("sira").EnumerateArray().Select(x => x.GetInt32()))
            && lb.Oyuncular.Select(o => o.ElenmeR).SequenceEqual(v.GetProperty("elenmeR").EnumerateArray().Select(x => x.GetInt32()));
        if (!ok) ne = "son sıralama";
    }
    LKontrol(ok, $"tam lobi {tohum}: {ne}");
}
Console.WriteLine($"{l1} lobi vakası (eğri, bot izi, kayıtlı iz, lobi izleri, alamet, kupa, eşleşme, {lj.GetProperty("lobi").GetArrayLength()} tam lobi / {lobiSavas} lobi savaşı): {l1 - lHata} aynı");
toplamHata += lHata;

// ── 10) Kut Armağanı kuralları: aşama seçenekleri, yenileme, savaş armağanları, bot armağanları, alamet sırası ──
var aj = kok.GetProperty("armagan");
int a1 = 0, aHata = 0;
void AKontrol(bool ok, string ne) { a1++; if (!ok) { aHata++; if (aHata < 8) Console.WriteLine($"✗ armağan: {ne}"); } }
foreach (var v in aj.GetProperty("secenek").EnumerateArray())
{
    var r = KutLobi.ArmaganSecenek(v.GetProperty("bolum").GetInt32(), new KutRng(v.GetProperty("tohum").GetDouble()), Liste(v.GetProperty("alinan"))); var c = v.GetProperty("sonuc");
    AKontrol(r.Kademe == c.GetProperty("kademe").GetString() && r.Secenek.SequenceEqual(Liste(c.GetProperty("secenek"))), $"seçenek bölüm {v.GetProperty("bolum").GetInt32()}");
}
foreach (var v in aj.GetProperty("cek").EnumerateArray())
    AKontrol(KutLobi.ArmaganCek(v.GetProperty("kd").GetString(), new KutRng(v.GetProperty("tohum").GetDouble()), Liste(v.GetProperty("alinan")), Liste(v.GetProperty("haric"))).SequenceEqual(Liste(v.GetProperty("sonuc"))), "yenileme");
foreach (var v in aj.GetProperty("savas").EnumerateArray())
    AKontrol(KutLobi.SavasArmagan(Liste(v.GetProperty("liste")), Sayi(v.GetProperty("can"))).SequenceEqual(Liste(v.GetProperty("sonuc"))), "savaş armağanı");
foreach (var v in aj.GetProperty("bot").EnumerateArray())
    AKontrol(KutLobi.BotArmagan(v.GetProperty("tohum").GetDouble(), v.GetProperty("r").GetInt32()).SequenceEqual(Liste(v.GetProperty("sonuc"))), "bot armağanı");
foreach (var v in aj.GetProperty("alametSira").EnumerateArray())
    AKontrol(KutLobi.AlametSirasi(v.GetProperty("tohum").GetDouble(), v.GetProperty("r").GetInt32(), v.GetProperty("n").GetInt32()).SequenceEqual(Liste(v.GetProperty("sonuc"))), "alamet sırası");
Console.WriteLine($"{a1} armağan vakası (seçenek, yenileme, savaş, bot, alamet sırası): {a1 - aHata} aynı");
toplamHata += aHata;

int toplam = i + k1 + k2 + x1 + h1 + d1 + e1 + q1 + c1 + l1 + a1;
Console.WriteLine($"TOPLAM: {toplam - toplamHata}/{toplam} birebir aynı");
return toplamHata == 0 ? 0 : 1;
