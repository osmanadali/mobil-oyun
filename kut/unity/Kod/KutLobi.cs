// Kut Arena seviyeli maç kuralları: kut/lobi.js'in birebir C# karşılığı (saf, belirlenimci).
// Deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3),
// tur planı (1.1), birikimli ekonomi (3), kaybedince alınan hasar (4.4), eşya kuralları (5.1),
// canavar dalgaları (5.5), ganimet ve Kervan seçenekleri (5.4), bölüm 1'in bedava kahraman seçimi (1.1).
// Değiştirirken lobi.js'i de aynı şekilde değiştir ve kut/unity/Test ile eşdeğerliği sına.
using System.Collections.Generic;
using System.Linq;

namespace Kut
{
    public struct SeviyeDurum { public int Seviye, Xp; }

    /// <summary>Tur planı satırı. Tip: "pve", "pvp" ya da "kervan".</summary>
    public sealed class TurBilgi { public int R, Bolum, Tur; public string Tip; public bool Armagan; }

    /// <summary>Seri: Tip "G" (kazanma), "M" (kaybetme) ya da null; N uzunluk.</summary>
    public sealed class Seri { public string Tip; public int N; }

    /// <summary>Hazırlık başı geliri ve dökümü.</summary>
    public sealed class Gelir { public int Taban, Faiz, Seri, Galibiyet, Alamet, Toplam; }

    /// <summary>Oyuncunun ekonomi durumu (lobi.js turBasi/turSonu'nun d nesnesi). Yerinde değişir.</summary>
    public sealed class EkonomiDurum
    {
        public int Altin, Can = KutVeri.CanBaslangic, Seviye = KutVeri.SeviyeBaslangic, Xp;
        public Seri Seri = new Seri(); public bool Galibiyet;
    }

    /// <summary>Tur sonu dökümü: alınan hasar, ganimet altını, savaş deneyimi.</summary>
    public struct TurSonuOzet { public int Hasar, Altin, Xp; }

    /// <summary>Canavar turu ganimeti (lobi.js ganimet). Altin toplam; EkAltin zarftan (sabit kısım TurSonu'nda). Secim null değilse biri seçilir.</summary>
    public sealed class GanimetSonuc
    {
        public int Altin, EkAltin; public List<string> Esya = new List<string>(); public List<TakimBirimi> Kahraman = new List<TakimBirimi>();
        public List<string> Secim; public string Zarf;
    }
    /// <summary>Kervan seçeneği: kahraman (kaynaşmış olabilir) ve üstündeki eşya.</summary>
    public sealed class KervanSecenekSonuc { public TakimBirimi Birim; public string Esya; }

    public static class KutLobi
    {
        /// <summary>Sonraki seviyeye gereken deneyim (tavanda 0).</summary>
        public static int XpGerek(int seviye) => seviye >= KutVeri.SeviyeTavan ? 0 : KutVeri.XpTablo[seviye];

        /// <summary>Deneyim ekler; artan deneyim sonraki seviyeye taşınır. Tavanda deneyim 0.</summary>
        public static SeviyeDurum XpEkle(int seviye, int xp, int miktar)
        {
            int sv = seviye, x = xp + miktar;
            while (sv < KutVeri.SeviyeTavan && x >= KutVeri.XpTablo[sv]) { x -= KutVeri.XpTablo[sv]; sv++; }
            if (sv >= KutVeri.SeviyeTavan) { sv = KutVeri.SeviyeTavan; x = 0; }
            return new SeviyeDurum { Seviye = sv, Xp = x };
        }

        /// <summary>Birimlerin havuzdan tuttuğu kopyalar: ★1 = 1, ★2 = 3, ★3 = 9; kaynaşmış birimin ikinci kahramanı 1. null birimler atlanır.</summary>
        public static Dictionary<string, int> KopyaSay(IEnumerable<TakimBirimi> birimler, Dictionary<string, int> say = null)
        {
            say = say ?? new Dictionary<string, int>();
            foreach (var b in birimler)
            {
                if (b == null) continue;
                say.TryGetValue(b.H, out int n); say[b.H] = n + KutVeri.YildizKopya[b.S == 0 ? 1 : b.S];
                if (b.F != null) { say.TryGetValue(b.F, out int m); say[b.F] = m + 1; }
            }
            return say;
        }

        /// <summary>Kalan kopya: havuzAdet(kademe) − bütün grupların (oyuncu, hayaletler) tuttuğu kopyalar; 0'ın altına inmez.</summary>
        public static Dictionary<string, int> HavuzKalan(IEnumerable<IEnumerable<TakimBirimi>> gruplar)
        {
            var say = new Dictionary<string, int>();
            foreach (var l in gruplar) KopyaSay(l, say);
            var outp = new Dictionary<string, int>();
            foreach (var h in KutVeri.Kahramanlar) { say.TryGetValue(h.Id, out int n); outp[h.Id] = System.Math.Max(0, KutVeri.HavuzAdet[h.Kademe] - n); }
            return outp;
        }

        public static int KademeZar(double[] ol, double r) => KutHayalet.KademeZar(ol, r);

        // ── Tur planı (bölüm 1.1) ──
        public static TurBilgi TurPlan(int r)
        {
            if (r < KutVeri.Bolum1Tur) return new TurBilgi { R = r, Bolum = 1, Tur = r + 1, Tip = "pve", Armagan = false };
            int q = r - KutVeri.Bolum1Tur, bolum = 2 + q / KutVeri.BolumTur, tur = q % KutVeri.BolumTur + 1;
            string tip = tur == KutVeri.KervanTur ? "kervan" : tur == KutVeri.CanavarTur ? "pve" : "pvp";
            return new TurBilgi { R = r, Bolum = bolum, Tur = tur, Tip = tip, Armagan = KutVeri.ArmaganTur.TryGetValue(bolum, out int at) && at == tur };
        }
        public static string TurAd(int r) { var p = TurPlan(r); return p.Bolum + "-" + p.Tur; }

        // ── Ekonomi (bölüm 3) ──
        public static int TabanGelir(int r) { var p = TurPlan(r); return p.Bolum == 1 ? KutVeri.TabanGelirBolum1[p.Tur - 1] : KutVeri.TabanGelir; }
        /// <summary>Gelir eklenmeden önceki altına göre: her 10 altına 1, en çok 5. Bölüm 1'de 0.</summary>
        public static int Faiz(int altin, int r) => TurPlan(r).Bolum == 1 ? 0 : System.Math.Min(KutVeri.FaizTavan, System.Math.Max(0, altin) / KutVeri.FaizAdim);
        public static int SeriBonus(int n) => KutVeri.SeriTablo[System.Math.Max(0, System.Math.Min(n, KutVeri.SeriTablo.Length - 1))];
        public static Gelir GelirHesapla(int r, int altin, Seri seri, bool galibiyet, string alamet)
        {
            var g = new Gelir();
            if (TurPlan(r).Tip == "kervan") return g;
            g.Taban = TabanGelir(r); g.Faiz = Faiz(altin, r); g.Seri = SeriBonus(seri != null ? seri.N : 0);
            g.Galibiyet = galibiyet ? KutVeri.GalibiyetBonus : 0; g.Alamet = alamet == "pazar" ? KutVeri.PazarBonus : 0;
            g.Toplam = g.Taban + g.Faiz + g.Seri + g.Galibiyet + g.Alamet;
            return g;
        }
        /// <summary>Yalnız PvP sonuçları sayılır; beraberlik (-1) ve canavar turu seriyi değiştirmez. Yeni nesne döner.</summary>
        public static Seri SeriGuncelle(Seri seri, int kazanan, string tip)
        {
            var s = new Seri { Tip = seri?.Tip, N = seri?.N ?? 0 };
            if (tip != "pvp" || (kazanan != 0 && kazanan != 1)) return s;
            string t = kazanan == 0 ? "G" : "M";
            return s.Tip == t ? new Seri { Tip = t, N = s.N + 1 } : new Seri { Tip = t, N = 1 };
        }
        public static int KaynastirBedel(int ka, int kb = 0) => KutVeri.KaynastirTaban + System.Math.Max(ka, kb);
        /// <summary>Turun ganimet planı (5.4); Kervan turunda ve plansız turda boş.</summary>
        public static GanimetParca[] GanimetPlan(int r)
        {
            var p = TurPlan(r); GanimetParca[] plan;
            if (p.Bolum >= KutVeri.GanimetGecBolum) return KutVeri.GanimetGec.TryGetValue(p.Tur, out plan) ? plan : new GanimetParca[0];
            return KutVeri.Ganimet.TryGetValue(p.Bolum + "-" + p.Tur, out plan) ? plan : new GanimetParca[0];
        }
        /// <summary>Ganimetin sabit altın kısmı (TurSonu ekler).</summary>
        public static int GanimetAltin(int r) { int a = 0; foreach (var x in GanimetPlan(r)) if (x.Tip == "altin") a += x.N; return a; }

        // ── Kaybedince alınan hasar (bölüm 4.4) ──
        public static int BolumTaban(int bolum, int yasayan)
        {
            int t = KutVeri.BolumTabani[System.Math.Min(bolum, KutVeri.BolumTabani.Length - 1)];
            return t + (yasayan == 2 ? KutVeri.SonIkiEk : yasayan == 3 ? KutVeri.SonUcEk : 0);
        }
        /// <summary>[taraf 0'ın hasarı, taraf 1'in hasarı]. yasayan 0 = lobi eki yok.</summary>
        public static int[] KayipHasar(int r, int kazanan, int kalanPuan, int kalanSayi, int yasayan = 0)
        {
            var p = TurPlan(r);
            if (p.Tip == "kervan" || (p.Tip == "pve" && p.Bolum == 1)) return new[] { 0, 0 };
            int t = BolumTaban(p.Bolum, yasayan);
            if (p.Tip == "pve") return new[] { kazanan == 0 ? 0 : kazanan == 1 ? t + kalanSayi : t, 0 };
            if (kazanan == 0) return new[] { 0, t + kalanPuan };
            if (kazanan == 1) return new[] { t + kalanPuan, 0 };
            return new[] { t, t };
        }

        // ── Tur başı ve tur sonu: durum yerinde değişir ──
        public static Gelir TurBasi(EkonomiDurum d, int r, string alamet) { var g = GelirHesapla(r, d.Altin, d.Seri, d.Galibiyet, alamet); d.Altin += g.Toplam; return g; }
        public static TurSonuOzet TurSonu(EkonomiDurum d, int r, int kazanan, int kalanPuan, int kalanSayi, int yasayan = 0)
        {
            var p = TurPlan(r); var o = new TurSonuOzet();
            if (p.Tip == "kervan") return o;
            o.Hasar = KayipHasar(r, kazanan, kalanPuan, kalanSayi, yasayan)[0];
            d.Can = System.Math.Max(0, d.Can - o.Hasar);
            d.Seri = SeriGuncelle(d.Seri, kazanan, p.Tip);
            if (p.Tip == "pvp") d.Galibiyet = kazanan == 0;
            o.Altin = GanimetAltin(r); d.Altin += o.Altin;
            if (r >= 1 && d.Seviye < KutVeri.SeviyeTavan) { var x = XpEkle(d.Seviye, d.Xp, KutVeri.PasifXp); d.Seviye = x.Seviye; d.Xp = x.Xp; o.Xp = KutVeri.PasifXp; }
            return o;
        }

        /// <summary>Seviyeye göre kademe zarı, sonra o kademede kalan kopyayla ağırlıklı seçim; kademe boşsa bir alt kademe.
        /// Çıkan kart o çekim boyunca havuzdan düşülür. Hiç kopya yoksa yuva null. Verilen sözlük değişmez.</summary>
        public static string[] DukkanCek(int seviye, IDictionary<string, int> kalan, KutRng R, int adet = KutVeri.Dukkan)
        {
            var k = new Dictionary<string, int>();
            foreach (var h in KutVeri.Kahramanlar) k[h.Id] = kalan != null && kalan.TryGetValue(h.Id, out int n) ? n : 0;
            var ol = KutVeri.KademeOlasilik(seviye); var outp = new string[adet];
            for (int s = 0; s < adet; s++)
            {
                int kd = KademeZar(ol, R.Sonraki()); var aday = new List<Kahraman>(); int top = 0;
                for (; kd >= 1; kd--)
                {
                    int kk = kd;
                    aday = KutVeri.Kahramanlar.Where(h => h.Kademe == kk && k[h.Id] > 0).ToList();
                    top = 0; foreach (var h in aday) top += k[h.Id];
                    if (top > 0) break;
                }
                if (top <= 0) { outp[s] = null; continue; }
                double x = R.Sonraki() * top; var sec = aday[aday.Count - 1];
                foreach (var h in aday) { x -= k[h.Id]; if (x < 0) { sec = h; break; } }
                k[sec.Id]--; outp[s] = sec.Id;
            }
            return outp;
        }

        // ── Eşyalar (bölüm 5.1; lobi.js ile birebir) ──
        /// <summary>Birimin taşıdığı soylar: kahraman + kaynaşan kahraman + Soy Mühürleri.</summary>
        public static List<string> BirimSoy(TakimBirimi b)
        {
            var soy = new List<string>(KutVeri.KahramanBul(b.H).Soy);
            if (b.F != null) foreach (var s in KutVeri.KahramanBul(b.F).Soy) if (!soy.Contains(s)) soy.Add(s);
            if (b.E != null) for (int i = 0; i < b.E.Count && i < KutVeri.EsyaYuva; i++) { var x = KutVeri.EsyaBul(b.E[i]); if (x != null && x.Soy != null && !soy.Contains(x.Soy)) soy.Add(x.Soy); }
            return soy;
        }
        public sealed class TakSonuc { public List<string> E; public string Birlesen; }
        /// <summary>Eşya takma: bileşen, ilk tamamlanmamış bileşenle tam eşyaya dönüşür (dolu birimde de); yoksa boş yuvaya (en çok 3).
        /// Söküm Taşı takılmaz; Soy Mührü taşınan soyu veremez. Takılamıyorsa null. Birim değişmez.</summary>
        public static TakSonuc EsyaTak(TakimBirimi b, string id)
        {
            var x = KutVeri.EsyaBul(id); if (x == null || id == "sokumTasi") return null;
            var e = (b.E ?? new List<string>()).Take(KutVeri.EsyaYuva).ToList();
            if (x.Tip == "bilesen")
                for (int j = 0; j < e.Count; j++) { var y = KutVeri.EsyaBul(e[j]); if (y != null && y.Tip == "bilesen") { var t = KutVeri.Tarif(e[j], id); e[j] = t; return new TakSonuc { E = e, Birlesen = t }; } }
            if (e.Count >= KutVeri.EsyaYuva) return null;
            if (x.Soy != null && BirimSoy(b).Contains(x.Soy)) return null;
            e.Add(id); return new TakSonuc { E = e, Birlesen = null };
        }
        public sealed class ToplaSonuc { public List<string> E; public List<string> Tasan; }
        /// <summary>★ birleşmesi ve kaynaştırmada eşyalar sırayla yeni birime takılır; takılamayanlar rafa döner.</summary>
        public static ToplaSonuc EsyaToplaBirim(TakimBirimi b, IEnumerable<IList<string>> listeler)
        {
            var u = b.Kopya(); u.E = new List<string>(); var tasan = new List<string>();
            foreach (var l in listeler) if (l != null) foreach (var id in l) { var t = EsyaTak(u, id); if (t != null) u.E = t.E; else tasan.Add(id); }
            return new ToplaSonuc { E = u.E, Tasan = tasan };
        }
        /// <summary>Rafta iki bileşeni birleştir: tam eşya küçük indekse, öbürü çıkar. Olmazsa null.</summary>
        public static List<string> RafBirlestir(IList<string> raf, int i, int j)
        {
            if (i == j || i < 0 || j < 0 || i >= raf.Count || j >= raf.Count || raf[i] == null || raf[j] == null) return null;
            var a = KutVeri.EsyaBul(raf[i]); var b = KutVeri.EsyaBul(raf[j]);
            if (a == null || b == null || a.Tip != "bilesen" || b.Tip != "bilesen") return null;
            var t = KutVeri.Tarif(raf[i], raf[j]); int k = System.Math.Min(i, j), z = System.Math.Max(i, j); var outp = raf.ToList();
            outp[k] = t; outp.RemoveAt(z); return outp;
        }
        // ── Canavar turu, ganimet ve Kervan (bölüm 5.4, 5.5; lobi.js ile birebir) ──
        /// <summary>Canavar dalgası (★1, taraf 1 konumları). Canavar turu değilse boş.</summary>
        public static List<TakimBirimi> PveDalga(int r)
        {
            var p = TurPlan(r); var outp = new List<TakimBirimi>(); if (p.Tip != "pve") return outp;
            DalgaBirim[] l;
            if (p.Bolum >= KutVeri.PveDalgaGecBolum) l = KutVeri.PveDalgaGec;
            else if (!KutVeri.PveDalga.TryGetValue(p.Bolum + "-" + p.Tur, out l)) l = new DalgaBirim[0];
            foreach (var d in l) outp.Add(new TakimBirimi { H = d.H, S = 1, X = d.X, Y = d.Y });
            return outp;
        }
        static Dictionary<string, int> HavuzKopya(IDictionary<string, int> kalan)
        {
            var k = new Dictionary<string, int>();
            foreach (var h in KutVeri.Kahramanlar) k[h.Id] = kalan != null ? (kalan.TryGetValue(h.Id, out int n) ? n : 0) : KutVeri.HavuzAdet[h.Kademe];
            return k;
        }
        /// <summary>Kademe-kd kahraman, en az `kopya` kopyası kalanlardan kalanla ağırlıklı (k'dan düşer); yoksa kademeden eşit olasılıkla. Tam 1 zar.</summary>
        public static string KahramanCek(int kd, Dictionary<string, int> k, KutRng R, int kopya = 1)
        {
            var aday = KutVeri.Kahramanlar.Where(h => h.Kademe == kd && k[h.Id] >= kopya).ToList(); int top = 0; foreach (var h in aday) top += k[h.Id];
            if (top <= 0) { var hep = KutVeri.Kahramanlar.Where(h => h.Kademe == kd).ToList(); return hep[(int)System.Math.Floor(R.Sonraki() * hep.Count)].Id; }
            double x = R.Sonraki() * top; var sec = aday[aday.Count - 1];
            foreach (var h in aday) { x -= k[h.Id]; if (x < 0) { sec = h; break; } }
            k[sec.Id] -= kopya; return sec.Id;
        }
        static string RastBilesen(KutRng R) => KutVeri.Bilesenler[(int)System.Math.Floor(R.Sonraki() * KutVeri.Bilesenler.Length)].Id;
        static string RastTam(KutRng R) => KutVeri.Esyalar[(int)System.Math.Floor(R.Sonraki() * KutVeri.Esyalar.Length)].Id;
        static List<string> FarkliEsya(string tur, int n, KutRng R)
        {
            var l = (tur == "tam" ? KutVeri.Esyalar : KutVeri.Bilesenler).Select(x => x.Id).ToList(); var outp = new List<string>();
            for (int i = 0; i < n && l.Count > 0; i++) { int j = (int)System.Math.Floor(R.Sonraki() * l.Count); outp.Add(l[j]); l.RemoveAt(j); }
            return outp;
        }
        /// <summary>Canavar turunun ganimeti (kaybedilse de verilir). kalan: havuzda kalan kopyalar (null: tam havuz).</summary>
        public static GanimetSonuc Ganimet(int r, KutRng R, IDictionary<string, int> kalan = null)
        {
            var o = new GanimetSonuc(); var k = HavuzKopya(kalan);
            foreach (var x in GanimetPlan(r))
            {
                if (x.Tip == "bilesen") { for (int i = 0; i < x.N; i++) o.Esya.Add(RastBilesen(R)); }
                else if (x.Tip == "altin") o.Altin += x.N;
                else if (x.Tip == "kahraman") o.Kahraman.Add(new TakimBirimi { H = KahramanCek(x.Kademe, k, R), S = 1 });
                else if (x.Tip == "secim") o.Secim = FarkliEsya(x.Tur, x.N, R);
                else if (x.Tip == "esya") o.Esya.Add(x.Id);
                else if (x.Tip == "zarf")
                {
                    double z = R.Sonraki(), top = 0; var sec = KutVeri.Zarf[KutVeri.Zarf.Length - 1];
                    foreach (var y in KutVeri.Zarf) { top += y.W; if (z < top) { sec = y; break; } }
                    o.Zarf = sec.Tip;
                    if (sec.Tip == "altin") { o.Altin += sec.N; o.EkAltin += sec.N; }
                    else if (sec.Tip == "bilesen") { for (int i = 0; i < sec.N; i++) o.Esya.Add(RastBilesen(R)); }
                    else if (sec.Tip == "kahraman") o.Kahraman.Add(new TakimBirimi { H = KahramanCek(sec.Kademe, k, R), S = 1 });
                }
            }
            return o;
        }
        /// <summary>Kervan seçenek sayısı: 1–2. sıra 3, 3–4. 4, 5–8. 5.</summary>
        public static int KervanAdet(int sira) => KutVeri.KervanAdet[System.Math.Max(1, System.Math.Min(KutVeri.KervanAdet.Length - 1, sira))];
        /// <summary>Kervan seçenekleri (5.4); Kervan turu değilse boş. kalan null: tam havuz.</summary>
        public static List<KervanSecenekSonuc> KervanSecenek(int r, KutRng R, int adet, IDictionary<string, int> kalan = null)
        {
            var p = TurPlan(r); var outp = new List<KervanSecenekSonuc>(); if (p.Tip != "kervan") return outp;
            var plan = KutVeri.Kervan[System.Math.Min(p.Bolum, KutVeri.KervanGecBolum)]; var k = HavuzKopya(kalan);
            for (int n = 0; n < adet; n++)
            {
                TakimBirimi b;
                if (plan.Kaynasmis != null && n == 0) { var h = KahramanCek(plan.Kaynasmis[0], k, R); var f = KahramanCek(plan.Kaynasmis[1], k, R); b = new TakimBirimi { H = h, F = f, S = 1 }; }
                else
                {
                    var sp = plan.Secenek[n % plan.Secenek.Length];
                    int kd = sp.Kademe.Length > 1 ? sp.Kademe[(int)System.Math.Floor(R.Sonraki() * sp.Kademe.Length)] : sp.Kademe[0];
                    b = new TakimBirimi { H = KahramanCek(kd, k, R, KutVeri.YildizKopya[sp.S]), S = sp.S };
                }
                outp.Add(new KervanSecenekSonuc { Birim = b, Esya = plan.Esya == "tam" ? RastTam(R) : RastBilesen(R) });
            }
            return outp;
        }
        /// <summary>Bot ve hayaletler için turun eşya ganimeti: seçimde ilk seçenek, Kervan'da ilk seçeneğin eşyası.</summary>
        public static List<string> GanimetEsya(int r, KutRng R)
        {
            if (TurPlan(r).Tip == "kervan") { var l = KervanSecenek(r, R, KervanAdet(1)); return l.Count > 0 ? new List<string> { l[0].Esya } : new List<string>(); }
            var g = Ganimet(r, R); var outp = new List<string>(g.Esya); if (g.Secim != null) outp.Add(g.Secim[0]);
            return outp;
        }
        /// <summary>Bölüm 1: 1-1'den önce bedava seçilecek farklı kademe-1 kahramanlar (kalanla ağırlıklı).</summary>
        public static List<string> BaslangicSecenek(KutRng R, IDictionary<string, int> kalan = null, int adet = KutVeri.BaslangicSecenek)
        {
            var k = HavuzKopya(kalan); var outp = new List<string>();
            for (int n = 0; n < adet; n++)
            {
                var aday = KutVeri.Kahramanlar.Where(h => h.Kademe == 1 && k[h.Id] > 0 && !outp.Contains(h.Id)).ToList(); int top = 0; foreach (var h in aday) top += k[h.Id];
                if (top <= 0) break;
                double x = R.Sonraki() * top; var sec = aday[aday.Count - 1];
                foreach (var h in aday) { x -= k[h.Id]; if (x < 0) { sec = h; break; } }
                outp.Add(sec.Id);
            }
            return outp;
        }
    }
}
