// Kut Arena savaş motoru: kut/sim.js'in birebir C# karşılığı (Unity'den bağımsız, saf C#).
// Aynı takımlar + aynı tohum + aynı Kut dokunuşları → tarayıcı sürümüyle bit bit aynı sonuç.
// Değiştirirken sim.js'i de aynı şekilde değiştir ve kut/unity/Test ile eşdeğerliği sına.
using System;
using System.Collections.Generic;
using System.Linq;

namespace Kut
{
    /// <summary>mulberry32: sim.js rng() ile aynı dizi.</summary>
    public sealed class KutRng
    {
        uint a;
        public KutRng(double tohum) { a = ToUint32(tohum); }
        public static uint ToUint32(double d)
        {
            if (double.IsNaN(d) || double.IsInfinity(d)) return 0;
            double t = Math.Truncate(d);
            double m = t % 4294967296.0; if (m < 0) m += 4294967296.0;
            return (uint)m;
        }
        public double Sonraki()
        {
            unchecked
            {
                a = a + 0x6D2B79F5u;
                uint t = a;
                t = (t ^ (t >> 15)) * (t | 1u);
                t ^= t + (t ^ (t >> 7)) * (t | 61u);
                return (t ^ (t >> 14)) / 4294967296.0;
            }
        }
    }

    /// <summary>Takımdaki bir birim: kahraman, yıldız, kaynaşan kahraman (pasif + soy ondan), tahta konumu.</summary>
    public sealed class TakimBirimi
    {
        public string H;      // kahraman id
        public int S = 1;     // yıldız 1..3
        public string F;      // kaynaşan kahraman id (yoksa null)
        public string F2;     // Üçlü Kaynaşma'nın üçüncü kahramanı (yalnız soy ve +%10 istatistik; yoksa null)
        public int X, Y;      // X: 0..3 (sütun), Y: 0 ön | 1 orta | 2 arka (tahta 4×3)
        public List<string> E = new List<string>(); // eşya kimlikleri (0–3): bileşen, tam eşya ya da özel (KutVeri.EsyaBul)
        public TakimBirimi Kopya() => new TakimBirimi { H = H, S = S, F = F, F2 = F2, X = X, Y = Y, E = new List<string>(E ?? new List<string>()) };
    }

    public sealed class BirimStat
    {
        public string Ad, Yetenek, Pasif; public double Can, Atk, As, Mana, Kc; public int Menzil, Kademe; public List<string> Soy;
        // eşyalardan: saldırı hızı eki, yetenek gücü, başlangıç manası, hasar azaltma (≤ %40), can çalma, başlangıç kalkanı
        public double AsEk, Yg, Mana0, Azalt, Cal, Kalkan0;
        public List<string> Esya = new List<string>();                         // tam eşyalar (yuva sırasıyla, tekrarsız): etkileri bir kez çalışır
        public Dictionary<string, int> KutYanki = new Dictionary<string, int>(); // bileşen → sayı (Kut Yankısı için)
        public List<string> YankiSira = new List<string>();                     // yankı sırası: yuva 0, 1, 2; tam eşyada tarif sırası
        public int KutTasi;
    }

    public sealed class SoyDurum { public int N, Seviye; }

    public sealed class Durum { public double Sure, Deger; }

    public sealed class Fx
    {
        public double T; public string Tip; public int U = -1, K = -1; public double N; public string Ad; public bool Menzilli;
    }

    public sealed class KutKaydi { public double T; public int Taraf, I; }

    /// <summary>Kalan: eski ölçü (Σ kc × kademe). KalanPuan: kazanan taraftaki sağ birimlerin yıldız toplamı (lobi hasarı). KalanSayi: sağ birim sayısı.</summary>
    /// <summary>Kut: tarafların kullandığı Kut sayısı (Saklı Kut armağanı için).</summary>
    public sealed class SavasSonucu { public int Kazanan; public double Sure; public double Kalan; public int KalanPuan, KalanSayi; public int[] Kut = new int[2]; }

    public sealed class SavasBirimi
    {
        public int Uid, Taraf, I; public TakimBirimi B;
        public string Ad, Yetenek, Pasif; public double Atk, As, Mana, Kc; public int Menzil, Kademe; public List<string> Soy;
        public double Mx, Hp, X, Y, X0, Y0, Mp, Cd, Kalkan; public bool Olu, Dirildi; public int Vurus, PayYigin, Ofke;
        public double AsEk, Yg, Azalt, Cal, Kalkan0, Mana0, VurusMana = 8, KutCarpan = 1; public bool IlkVurusYapildi; public int SonHedefUid = -1;
        public HashSet<string> Ef = new HashSet<string>(), EsikTetik = new HashSet<string>();
        // Kut Yankısı (7.1): bileşen sayıları ve sırası, Kut Taşı; Diş yankısının kalan vuruşu ve oranı, Çiy yankısının bekleyen manası; Kut Mirası işareti
        public Dictionary<string, int> KutYanki = new Dictionary<string, int>(); public List<string> YankiSira = new List<string>(); public int KutTasi, BilesenSay;
        public int YankiDis; public double YankiDisOran, YankiCiy; public bool KutMiras;
        public bool E(string id) => Ef.Contains(id);
        public Dictionary<string, Durum> Durum = new Dictionary<string, Durum>();
        public SavasBirimi Hedef;
        public bool Var(string d) => Durum.ContainsKey(d);
    }

    public static class KutMotor
    {
        public static double JsRound(double x) => Math.Floor(x + 0.5);

        /// <summary>sim.js esyaTopla: istatistikler yuva sırasıyla (0, 1, 2), tam eşyada tarif sırasıyla toplanır.</summary>
        static void EsyaTopla(List<string> e, EsyaStat st, List<string> esya, Dictionary<string, int> yanki, List<string> sira, List<string> muhur, ref int kutTasi)
        {
            if (e == null) return;
            for (int i = 0; i < e.Count && i < KutVeri.EsyaYuva; i++)
            {
                var x = KutVeri.EsyaBul(e[i]); if (x == null) continue;
                if (x.Tip == "bilesen") Bilesen(x, st, yanki, sira);
                else if (x.Tip == "tam") { Bilesen(KutVeri.EsyaBul(x.Tarif[0]), st, yanki, sira); Bilesen(KutVeri.EsyaBul(x.Tarif[1]), st, yanki, sira); if (!esya.Contains(x.Id)) esya.Add(x.Id); }
                else if (x.Soy != null) { if (!muhur.Contains(x.Soy)) muhur.Add(x.Soy); }
                else if (x.Id == "kutTasi") kutTasi++;
            }
            st.Azalt = Math.Min(KutVeri.EsyaAzaltTavan, st.Azalt);
        }
        static void Bilesen(Esya b, EsyaStat st, Dictionary<string, int> yanki, List<string> sira)
        {
            var s = b.Stat;
            st.Atk += s.Atk; st.As += s.As; st.Yg += s.Yg; st.Mana0 += s.Mana0; st.Azalt += s.Azalt; st.Can += s.Can; st.Cal += s.Cal; st.Kalkan0 += s.Kalkan0;
            yanki.TryGetValue(b.Id, out int n); yanki[b.Id] = n + 1; sira.Add(b.Id);
        }

        /// <param name="kaynasCarpan">Kaynaşmış birimin istatistik çarpanı (1,15; Kusursuz Melez 1,30). Üçlü Kaynaşma (F2): soylar ve ×1,10 can/saldırı.</param>
        public static BirimStat BirimStatHesapla(TakimBirimi b, double kaynasCarpan = KutVeri.KaynasCarpan)
        {
            var A = KutVeri.KahramanBul(b.H); var B = b.F != null ? KutVeri.KahramanBul(b.F) : null; var C = B != null && b.F2 != null ? KutVeri.KahramanBul(b.F2) : null;
            double c = KutVeri.YildizCarpan[b.S == 0 ? 1 : b.S], kk = kaynasCarpan;
            double can = A.Can, atk = A.Atk, hiz = A.As;
            if (B != null) { can = (A.Can + B.Can) / 2 * kk; atk = (A.Atk + B.Atk) / 2 * kk; hiz = (A.As + B.As) / 2; }
            if (C != null) { can = can * (1 + KutVeri.ArmUcluKaynas); atk = atk * (1 + KutVeri.ArmUcluKaynas); }
            var soy = new List<string>(A.Soy);
            if (B != null) foreach (var s in B.Soy) if (!soy.Contains(s)) soy.Add(s);
            if (C != null) foreach (var s in C.Soy) if (!soy.Contains(s)) soy.Add(s);
            var st = new EsyaStat(); var esya = new List<string>(); var yanki = new Dictionary<string, int>(); var sira = new List<string>(); var muhur = new List<string>(); int kutTasi = 0;
            EsyaTopla(b.E, st, esya, yanki, sira, muhur, ref kutTasi);
            foreach (var s in muhur) if (!soy.Contains(s)) soy.Add(s); // Soy Mührü
            return new BirimStat { Ad = B != null ? A.Ad + " × " + B.Ad + (C != null ? " × " + C.Ad : "") : A.Ad, Can = JsRound(can * c) + st.Can, Atk = JsRound(atk * c * (1 + st.Atk)), As = hiz, Menzil = A.Menzil, Mana = A.Mana,
                Yetenek = A.Yetenek, Pasif = B != null ? B.Pasif : A.Pasif, Soy = soy, Kc = c, Kademe = A.Kademe,
                AsEk = st.As, Yg = st.Yg, Mana0 = st.Mana0, Azalt = st.Azalt, Cal = st.Cal, Kalkan0 = st.Kalkan0, Esya = esya, KutYanki = yanki, YankiSira = sira, KutTasi = kutTasi };
        }

        /// <summary>Soy sayımı (aynı kahraman iki kez sayılmaz; kaynaşmış birim kendi kimliğiyle sayılır). Sıra: ilk görülme.</summary>
        public static List<KeyValuePair<string, SoyDurum>> SoySay(IList<TakimBirimi> takim)
        {
            var sira = new List<string>(); var say = new Dictionary<string, HashSet<string>>();
            foreach (var b in takim)
                foreach (var s in BirimStatHesapla(b).Soy)
                {
                    if (!say.ContainsKey(s)) { say[s] = new HashSet<string>(); sira.Add(s); }
                    say[s].Add(b.H + (b.F != null ? "+" + b.F : "") + (b.F != null && b.F2 != null ? "+" + b.F2 : ""));
                }
            var outp = new List<KeyValuePair<string, SoyDurum>>();
            foreach (var k in sira)
            {
                int n = say[k].Count; var e = KutVeri.SoyBul(k).Esik;
                outp.Add(new KeyValuePair<string, SoyDurum>(k, new SoyDurum { N = n, Seviye = n >= e[1] ? 2 : n >= e[0] ? 1 : 0 }));
            }
            return outp;
        }
    }

    /// <summary>Bir savaş. Adim() 0,05 sn ilerletir; Fx o adımın olaylarını taşır (görsel katman bunları animasyona çevirir).</summary>
    public sealed class KutSavas
    {
        public const double DT = 0.05;
        public readonly List<SavasBirimi> Birimler = new List<SavasBirimi>();
        public readonly List<Fx> Fx = new List<Fx>();
        public double T { get; private set; }
        public bool Bitti { get; private set; }
        public SavasSonucu Sonuc { get; private set; }
        public readonly List<KeyValuePair<string, SoyDurum>>[] Soylar = new List<KeyValuePair<string, SoyDurum>>[2];

        readonly KutRng R; readonly string alamet; readonly int[] yz, yzYedek, yzTaraf; readonly double yzZaman, yzZaman2;
        readonly double? gbBas; bool gbBasladi; // Gün Batımı başlangıcı (null: yok)
        // Kut hakkı (7.2): kalan hak, kullanılan, son Kut anı (ikinci hak KutAra sn sonra), Kut Mirası kullanıldı mı; Kut Sessizliği
        readonly int[] kutKalan = new int[2], kutSayac = new int[2]; readonly double[] sonKutT = { -1e9, -1e9 }; readonly bool[] kutMirasK = new bool[2];
        public readonly bool KutYok;
        readonly HashSet<string>[] ar = { new HashSet<string>(), new HashSet<string>() }; // Kut Armağanları (savas: true olanlar)
        readonly List<KutKaydi> kutSira; readonly List<KutKaydi> kayit;
        bool Ar(int taraf, string id) => ar[taraf].Contains(id);

        static readonly double[] Y0 = { 5, 6, 7 }, Y1 = { 3, 2, 1 };
        static readonly double[] GOK = { 0, 0.15, 0.35 }, ATLI = { 0, 0.3, 0.6 }, KIS = { 0, 0.15, 0.3 }, AVCI = { 0, 0.2, 0.45 }, KARA = { 0, 0.2, 0.5 },
            DEV = { 0, 0.12, 0.28 }, YER = { 0, 150, 400 }, SU = { 0, 0.02, 0.05 }, BILGE = { 0, 0.3, 0.7 }, OD_SURE = { 0, 2, 3 }, OD_DEGER = { 0, 12, 28 };

        /// <param name="kut">Tekrar oynatma için Kut dokunuşları (t, taraf, i).</param>
        /// <param name="yz">Kut'u yapay zekânın kullanacağı taraflar (ör. bot rakip: {1}).</param>
        /// <param name="kayit">Verilirse oyuncunun Kut dokunuşları buraya yazılır (paylaşım / doğrulama için).</param>
        /// <param name="gunBatimi">Gün Batımı'nın başladığı saniye (Arena: KutVeri.GunBatimiBasla); null: yok (Hızlı Maç). Uzun Gölge alametinde 20.</param>
        /// <param name="armagan">İki tarafın savaş armağanları (sim.js opt.armagan; Son Direniş'in can koşulu çağıranda: KutLobi.SavasArmagan).</param>
        /// <param name="kutHak">Tarafların Kut hakkı (varsayılan 1; Son İki'de 2). Çifte Kut +1.</param>
        /// <param name="yzYedek">Kayıtlı dokunuşu olan taraflar: yapay zekâ yalnız kayıttaki dokunuşlar bittikten sonra kalan hakları kullanır.</param>
        public KutSavas(IList<TakimBirimi> takimA, IList<TakimBirimi> takimB, double tohum = 1, string alamet = "yok",
            IEnumerable<KutKaydi> kut = null, int[] yz = null, double yzZaman = KutVeri.KutYzZaman, List<KutKaydi> kayit = null, double? gunBatimi = null,
            IList<IList<string>> armagan = null, int[] kutHak = null, int[] yzYedek = null, double yzZaman2 = KutVeri.KutYzZaman2, bool kutYok = false)
        {
            R = new KutRng(tohum == 0 ? 1 : tohum);
            this.alamet = alamet ?? "yok"; this.yz = yz ?? new int[0]; this.yzZaman = yzZaman; this.yzZaman2 = yzZaman2; this.kayit = kayit;
            this.yzYedek = yzYedek ?? new int[0]; yzTaraf = this.yz.Concat(this.yzYedek).Distinct().ToArray();
            gbBas = !gunBatimi.HasValue ? (double?)null : this.alamet == "uzunGolge" ? Math.Min(gunBatimi.Value, KutVeri.UzunGolgeBasla) : gunBatimi.Value;
            if (armagan != null) for (int t = 0; t < 2 && t < armagan.Count; t++) if (armagan[t] != null) foreach (var id in armagan[t]) ar[t].Add(id);
            KutYok = this.alamet == "kutSessiz" || kutYok;
            for (int t = 0; t < 2; t++) kutKalan[t] = KutYok ? 0 : (kutHak != null ? kutHak[t] : KutVeri.KutHak) + (Ar(t, "cifteKut") ? 1 : 0);
            kutSira = (kut ?? Enumerable.Empty<KutKaydi>()).OrderBy(k => k.T).ToList();
            Soylar[0] = KutMotor.SoySay(takimA); Soylar[1] = KutMotor.SoySay(takimB);
            // Karşı Hamle: rakibin en kalabalık soyu (eşitlikte ilk görülen) bu savaşta bir eşik düşük
            for (int t = 0; t < 2; t++) if (Ar(t, "karsiHamle"))
            {
                var l = Soylar[1 - t]; int en = -1;
                for (int q = 0; q < l.Count; q++) if (en < 0 || l[q].Value.N > l[en].Value.N) en = q;
                if (en >= 0) l[en] = new KeyValuePair<string, SoyDurum>(l[en].Key, new SoyDurum { N = l[en].Value.N, Seviye = Math.Max(0, l[en].Value.Seviye - 1) });
            }

            var takimlar = new[] { takimA, takimB };
            for (int taraf = 0; taraf < 2; taraf++)
                for (int i = 0; i < takimlar[taraf].Count; i++)
                {
                    var b = takimlar[taraf][i]; var st = KutMotor.BirimStatHesapla(b, Ar(taraf, "kusursuzMelez") ? KutVeri.ArmKusursuzMelez : KutVeri.KaynasCarpan);
                    // tahta 4 sütun × 3 sıra: x = 0,75 + 1,5·sütun; taraf 0 y = 5/6/7, taraf 1 y = 3/2/1 (ön, orta, arka)
                    double x = 0.75 + b.X * 1.5, y = taraf == 0 ? Y0[b.Y] : Y1[b.Y];
                    double can = st.Can;
                    int y1 = Sv(taraf, "yer"); can += YER[y1] * 1;
                    if (this.alamet == "tutulma" && st.Soy.Contains("karanlik")) can *= 1.3;
                    if (this.alamet == "yaz" && st.Soy.Contains("kis")) can *= 0.85;
                    if (Ar(taraf, "sonDirenis")) can *= 1 + KutVeri.ArmSonDirenisOran; // Son Direniş
                    can = KutMotor.JsRound(can);
                    var ef = new HashSet<string>(st.Esya);
                    double mana = ef.Contains("dolunayTestisi") ? Math.Floor(st.Mana * 0.8 + 0.5) : st.Mana; // Dolunay Testisi
                    Birimler.Add(new SavasBirimi { Uid = taraf * 10 + i, Taraf = taraf, I = i, B = b, Ad = st.Ad, Yetenek = st.Yetenek, Pasif = st.Pasif, Atk = st.Atk, As = st.As,
                        Mana = mana, Kc = st.Kc, Menzil = st.Menzil, Kademe = st.Kademe, Soy = st.Soy, Mx = can, Hp = can, X = x, Y = y, X0 = x, Y0 = y, Mp = 0, Cd = 0.3 + R.Sonraki() * 0.3,
                        AsEk = st.AsEk, Yg = st.Yg, Azalt = st.Azalt, Cal = st.Cal, Kalkan0 = st.Kalkan0, Mana0 = st.Mana0, Ef = ef, VurusMana = ef.Contains("keskinGoz") ? 12 : 8,
                        KutYanki = st.KutYanki, YankiSira = st.YankiSira, KutTasi = st.KutTasi, BilesenSay = st.YankiSira.Count });
                }

            // Savaş başı etkileri
            foreach (var u in Birimler)
            {
                if (u.Pasif == "kisNefesi") u.Mp = u.Mana * 0.5;
                if (this.alamet == "kutYagmur") u.Mp = Math.Max(u.Mp, u.Mana * 0.4);
                if (this.alamet == "kutSessiz") u.Mp = Math.Max(u.Mp, u.Mana * KutVeri.KutSessizMana);
                if (u.Pasif == "ana") foreach (var d in Dostlar(u)) if (d != u && Mesafe(u, d) <= 2.6) KalkanVer(d, 90 * u.Kc);
            }
            // Eşyaların savaş başı etkileri (birim sırasıyla). "2 hücre" = 2,1; "2,5 hücre" = 2,6.
            foreach (var u in Birimler)
            {
                if (u.Mana0 != 0) u.Mp = Math.Min(u.Mana - 1, u.Mp + u.Mana0);
                if (u.Kalkan0 != 0) KalkanVer(u, u.Kalkan0);
                if (u.E("buzDagi")) KalkanVer(u, u.Mx * 0.2);
                if (u.E("isikKalkani")) foreach (var d in Dostlar(u)) if (d != u && Mesafe(u, d) <= 2.1) KalkanVer(d, 120);
                if (u.E("uluKok")) foreach (var d in Dostlar(u)) if (d != u && Mesafe(u, d) <= 2.1) { d.Mx += 150; d.Hp += 150; }
                if (u.E("devKukremesi")) foreach (var o in Dusmanlar(u)) if (Mesafe(u, o) <= 2.6) DurumVer(o, "zorla", 3, u.Uid);
                if (u.E("sisPelerini")) DurumVer(u, "hedefAlinmaz", 2.5);
            }
        }

        public int Sv(int taraf, string soy) { foreach (var kv in Soylar[taraf]) if (kv.Key == soy) return kv.Value.Seviye; return 0; }
        List<SavasBirimi> Dostlar(SavasBirimi u) => Birimler.Where(o => o.Taraf == u.Taraf && !o.Olu).ToList();
        List<SavasBirimi> Dusmanlar(SavasBirimi u) => Birimler.Where(o => o.Taraf != u.Taraf && !o.Olu).ToList();
        public static double Mesafe(SavasBirimi a, SavasBirimi b) { double dx = a.X - b.X, dy = a.Y - b.Y; return Math.Sqrt(dx * dx + dy * dy); }
        /// <summary>Dev Kükremesi'nin zorladığı hedef; sonra hedef alınabilenlerden en yakın; hepsi hedef alınamazsa en yakın.</summary>
        SavasBirimi EnYakin(SavasBirimi u)
        {
            if (u.Var("zorla")) { int zu = (int)u.Durum["zorla"].Deger; var z = Birimler.FirstOrDefault(o => o.Uid == zu && !o.Olu); if (z != null) return z; }
            SavasBirimi en = null; double m = 1e9;
            foreach (var o in Dusmanlar(u)) { if (o.Var("hedefAlinmaz")) continue; double d = Mesafe(u, o) + o.I * 1e-4; if (d < m) { m = d; en = o; } }
            if (en != null) return en;
            foreach (var o in Dusmanlar(u)) { double d = Mesafe(u, o) + o.I * 1e-4; if (d < m) { m = d; en = o; } }
            return en;
        }
        void Ekle(string tip, SavasBirimi u, double n = 0, int k = -1, string ad = null, bool menzilli = false) => Fx.Add(new Fx { T = T, Tip = tip, U = u.Uid, N = n, K = k, Ad = ad, Menzilli = menzilli });
        void KalkanVer(SavasBirimi u, double n) { u.Kalkan += n; Ekle("kalkan", u, KutMotor.JsRound(n)); }
        void Iyiles(SavasBirimi u, double n) { if (u.Olu) return; double v = Math.Min(u.Mx - u.Hp, n); u.Hp += v; if (v > 1) Ekle("iyi", u, KutMotor.JsRound(v)); }
        static void DurumVer(SavasBirimi u, string ad, double sure, double deger = 0)
        {
            u.Durum.TryGetValue(ad, out var d);
            if (d == null || d.Sure < sure || deger > d.Deger) u.Durum[ad] = new Durum { Sure = sure, Deger = deger };
        }
        int MenzilAl(SavasBirimi u) { int m = u.Menzil; if (alamet == "sis" && m > 1) m -= 1; return m; }
        double HizCarpan(SavasBirimi u)
        {
            int g = Sv(u.Taraf, "gok");
            double k = 1 + GOK[g != 0 && u.Soy.Contains("gok") ? g : 0];
            int atl = Sv(u.Taraf, "atli"); if (atl != 0 && u.Soy.Contains("atli") && T < 6) k += ATLI[atl]; // tempo: ilk 4 sn → ilk 6 sn
            if (u.Pasif == "ruzgar" && T < 7) k += 0.35;
            if (u.Var("uluma")) k += 0.45;
            k += u.AsEk;
            if (u.Var("cosku")) k += 0.4;
            if (u.Var("canRuzgar")) k += 0.4;
            if (u.Var("geceKanat")) k += 0.6;
            if (u.Var("yankiTuy")) k += u.Durum["yankiTuy"].Deger; // Tüy yankısı
            if (u.Var("uyanis")) k += u.Durum["uyanis"].Deger;     // Uyanış
            int kis = Sv(1 - u.Taraf, "kis"); if (kis != 0) k -= KIS[kis];
            if (u.Var("yavas")) k -= u.Durum["yavas"].Deger;
            if (alamet == "tipi" && !u.Soy.Contains("kis")) k -= 0.2;
            return Math.Max(0.25, k);
        }

        SavasBirimi yetenekSahip; List<SavasBirimi> vurulan; // Yetenek() sırasında vurulan düşmanlar
        double Hasar(SavasBirimi kaynak, SavasBirimi hedef, double miktar, string tur)
        {
            if (hedef.Olu) return 0;
            if (vurulan != null && kaynak == yetenekSahip && tur == "yetenek" && !vurulan.Contains(hedef)) vurulan.Add(hedef);
            double m = miktar;
            if (kaynak != null && tur != "yansima")
            {
                int av = Sv(kaynak.Taraf, "avci"); if (av != 0 && kaynak.Soy.Contains("avci")) m *= 1 + AVCI[av];
                int kr = Sv(kaynak.Taraf, "karanlik"); if (kr != 0 && hedef.Hp < hedef.Mx * 0.5) m *= 1 + KARA[kr];
                if (alamet == "kanAyi") m *= 1.2;
                if (kaynak.Var("davul")) m *= 1.3;
                if (kaynak.Var("lanet")) m *= 0.55;
                if (kaynak.Pasif == "deliCesaret" && kaynak.Hp < kaynak.Mx * 0.5) m *= 1.5;
                if (kaynak.Pasif == "avKoku" && hedef.Hp < hedef.Mx * 0.3) m *= 2;
                if (kaynak.Pasif == "suru") m *= 1 + 0.06 * (Dostlar(kaynak).Count - 1);
                if (kaynak.PayYigin != 0) m *= 1 + 0.12 * kaynak.PayYigin;
                if (tur == "vurus" && kaynak.Ofke > 0) { m *= 2; kaynak.Ofke--; }
                if (kaynak.Var("ofkeT")) m *= 1.35; // Öfke Tılsımı
                if (tur == "vurus" && kaynak.YankiDis > 0) { m *= 1 + kaynak.YankiDisOran; kaynak.YankiDis--; } // Diş yankısı
                if (Ar(kaynak.Taraf, "kizilGok") && alamet != "yok") m *= 1 + KutVeri.ArmKizilGok;             // Kızıl Gök Çocuğu
            }
            // Gün Batımı: bütün türlerde (yansıma hariç: artmış vuruştan hesaplanır)
            if (gbBas.HasValue && tur != "yansima") { double gt = T - gbBas.Value + 1e-9; if (gt >= 0) m *= 1 + KutVeri.GunBatimiArtis * Math.Floor(gt); }
            if (tur == "vurus" && hedef.Pasif == "kacis" && R.Sonraki() < 0.25) { Ekle("kac", hedef); return 0; }
            if (hedef.Var("dokunulmaz")) return 0; // Ana Kaya
            int dv = Sv(hedef.Taraf, "dev"); if (dv != 0 && hedef.Soy.Contains("dev")) m *= 1 - DEV[dv];
            if (hedef.Pasif == "tasDeri") m *= 0.8;
            double az = Math.Min(KutVeri.EsyaAzaltTavan, hedef.Azalt + (hedef.Var("ofkeT") ? 0.2 : 0)); if (az > 0) m *= 1 - az;
            if (hedef.Var("yankiKabuk")) m *= 1 - hedef.Durum["yankiKabuk"].Deger; // Kabuk yankısı
            if (hedef.Kalkan > 0) { double e = Math.Min(hedef.Kalkan, m); hedef.Kalkan -= e; m -= e; }
            m = Math.Max(0, m);
            hedef.Hp -= m;
            if (tur != "dot" && tur != "yansima") hedef.Mp = Math.Min(hedef.Mana, hedef.Mp + m * (hedef.E("sabirTasi") ? 0.1 : 0.05));
            if (m >= 1) Ekle(tur == "dot" ? "dot" : "hasar", hedef, KutMotor.JsRound(m), kaynak != null ? kaynak.Uid : -1);
            if (kaynak != null && kaynak.Pasif == "canEmici" && tur != "dot" && tur != "yansima") Iyiles(kaynak, m * 0.2);
            if (kaynak != null && tur != "dot" && tur != "yansima")
            {   // can çalma: Pul (vuruşta), Gece Kanadı (vuruşta +%30), Gölge Mürekkebi (yetenekte %25), Pul yankısı (ikisinde)
                double yp = kaynak.Var("yankiPul") ? kaynak.Durum["yankiPul"].Deger : 0;
                double o = tur == "vurus" ? kaynak.Cal + (kaynak.Var("geceKanat") ? 0.3 : 0) + yp : tur == "yetenek" ? (kaynak.E("golgeMurekkebi") ? 0.25 : 0) + yp : 0;
                if (o > 0) Iyiles(kaynak, m * o);
            }
            // Diken Kabuk (%25) ve Diken Kirpi'nin Diken Sırt'ı (%15)
            if (tur == "vurus" && kaynak != null && kaynak.Menzil <= 1 && m > 0 && !kaynak.Olu)
            {
                double yo = (hedef.E("dikenKabuk") ? 0.25 : 0) + (hedef.Pasif == "dikenKirpi" ? 0.15 : 0);
                if (yo > 0) Hasar(hedef, kaynak, m * yo, "yansima");
            }
            if (tur == "vurus" && kaynak != null && hedef.E("buzulZirh") && !kaynak.Olu) DurumVer(kaynak, "yavas", 2, 0.2);
            if (hedef.Hp > 0) EsikKontrol(hedef);
            if (hedef.Hp <= 0) Olum(hedef, kaynak);
            return m;
        }

        /// <summary>"Canı ilk kez %N'nin altına inince" etkileri: savaş başına bir kez.</summary>
        void EsikKontrol(SavasBirimi u)
        {
            var e = u.EsikTetik; double oran = u.Hp / u.Mx;
            if (u.E("ofkeTilsimi") && !e.Contains("ofke") && oran < 0.5) { e.Add("ofke"); DurumVer(u, "ofkeT", 5); Ekle("esya", u, 0, -1, "ofkeTilsimi"); }
            if (u.E("geceKanadi") && !e.Contains("geceKanat") && oran < 0.3) { e.Add("geceKanat"); DurumVer(u, "geceKanat", 3); Ekle("esya", u, 0, -1, "geceKanadi"); }
            if (u.E("anaKaya") && !e.Contains("anaKaya") && oran < 0.4) { e.Add("anaKaya"); DurumVer(u, "dokunulmaz", 2); Ekle("esya", u, 0, -1, "anaKaya"); }
            if (u.E("karaBuz") && !e.Contains("karaBuz") && oran < 0.5)
            {
                e.Add("karaBuz"); Ekle("esya", u, 0, -1, "karaBuz");
                foreach (var o in Dusmanlar(u)) if (Mesafe(u, o) <= 2.1) DurumVer(o, "sersem", 1);
            }
        }

        void Olum(SavasBirimi u, SavasBirimi katil)
        {
            if (u.Pasif == "yenidenDogus" && !u.Dirildi) { u.Dirildi = true; u.Hp = u.Mx * 0.4; u.Durum = new Dictionary<string, Durum>(); Ekle("dirilis", u); return; }
            u.Olu = true; u.Hp = 0; Ekle("olum", u);
            if (u.KutMiras && Ar(u.Taraf, "kutMirasi") && !kutMirasK[u.Taraf]) { kutMirasK[u.Taraf] = true; kutKalan[u.Taraf]++; Ekle("kutMiras", u); } // Kut Mirası
            if (u.E("geceYuregi")) foreach (var d in Dostlar(u)) if (Mesafe(u, d) <= 2.1) KalkanVer(d, u.Mx * 0.25);
            foreach (var d in Birimler)
            {
                if (d.Olu) continue;
                if (d.Taraf == u.Taraf && d.Pasif == "ruhBagi") d.Mp = Math.Min(d.Mana, d.Mp + 25); // tempo: 35 → 25
                if (d.Taraf != u.Taraf && d.Pasif == "karanlikPay") d.PayYigin++;
                if (d.Taraf == u.Taraf && d.E("ruhTestisi")) { d.Mp = Math.Min(d.Mana, d.Mp + 20); Iyiles(d, d.Mx * 0.1); }
                if (d.Taraf != u.Taraf && d.E("avCoskusu")) DurumVer(d, "cosku", 3);
            }
            if (katil != null && !katil.Olu && katil.Taraf != u.Taraf)
            {
                if (katil.E("geceAvcisi")) Iyiles(katil, u.Mx * 0.2);
                if (katil.E("golgePelerini")) { DurumVer(katil, "hedefAlinmaz", 1.5); Iyiles(katil, katil.Mx * 0.15); }
            }
        }

        bool yeniHedef; // bu vuruş yeni bir hedefe mi (Buz Mızrağı)
        void VurusEtki(SavasBirimi u, SavasBirimi h)
        {
            int od = Sv(u.Taraf, "ates");
            if (od != 0 && u.Soy.Contains("ates")) DurumVer(h, "yanik", OD_SURE[od], OD_DEGER[od] * (alamet == "yaz" ? 2 : 1));
            if (u.Pasif == "zehirDis") DurumVer(h, "zehir", 3, 18 * u.Kc);
            if (u.Pasif == "soguk") DurumVer(h, "yavas", 2, 0.2);
            if (u.Pasif == "gokGurultu" && u.Vurus % 4 == 0)
            {
                var yak = Dusmanlar(u).Where(o => o != h).OrderBy(o => Mesafe(h, o)).Take(2).ToList();
                foreach (var o in yak) { Hasar(u, o, u.Atk * 0.7, "yetenek"); Fx.Add(new Fx { T = T, Tip = "simsek", K = h.Uid, U = o.Uid }); }
            }
            if (h.Olu) return;
            if (u.E("buzMizragi") && yeniHedef) DurumVer(h, "sersem", 0.8);
            if (u.E("karTanesi")) DurumVer(h, "yavas", 2, 0.15);
            if (u.E("simsekTuyu") && u.Vurus % 5 == 0)
            {
                var yak = Dusmanlar(u).Where(o => o != h).OrderBy(o => Mesafe(h, o)).Take(2).ToList();
                foreach (var o in yak) { Hasar(u, o, 70 * u.Kc * (1 + u.Yg), "yetenek"); Fx.Add(new Fx { T = T, Tip = "simsek", K = h.Uid, U = o.Uid }); }
            }
            if (u.E("yelKanadi") && u.Vurus % 5 == 0 && !h.Olu) { Fx.Add(new Fx { T = T, Tip = "vurus", K = u.Uid, U = h.Uid, Menzilli = u.Menzil > 1 }); Hasar(u, h, u.Atk, "vurus"); }
        }

        void Yetenek(SavasBirimi u)
        {
            double c = u.Kc * (1 + u.Yg) * u.KutCarpan; var h = u.Hedef != null && !u.Hedef.Olu ? u.Hedef : EnYakin(u);
            u.KutCarpan = 1;
            yetenekSahip = u; vurulan = new List<SavasBirimi>();
            YetenekCalis(u, c, h);
            var v = vurulan; vurulan = null; yetenekSahip = null;
            // yetenek sonrası eşya kancaları (sabit sıra)
            double ky = u.Kc * (1 + u.Yg);
            if (u.E("kizginDis")) foreach (var o in v) if (!o.Olu) DurumVer(o, "yanik", 3, 30 * ky);
            if (u.E("ayazAsasi")) foreach (var o in v) if (!o.Olu) DurumVer(o, "yavas", 2, 0.3);
            if (u.Olu) return;
            if (u.E("tasMuhur")) KalkanVer(u, 120 * ky);
            if (u.E("canAtesi")) { var y = Dostlar(u).OrderBy(a => a.Hp / a.Mx).FirstOrDefault(); if (y != null) Iyiles(y, 100 * ky); }
            if (u.E("buzPinari")) foreach (var d in Dostlar(u)) if (d != u && Mesafe(d, u) <= 2.1) KalkanVer(d, 80 * u.Kc);
            if (u.E("bilgeAsasi")) u.Mp = Math.Min(u.Mana, u.Mp + 25);
            if (u.E("ruzgarCani")) DurumVer(u, "canRuzgar", 3);
            if (u.YankiCiy != 0) { u.Mp = Math.Min(u.Mana, u.Mp + u.YankiCiy); u.YankiCiy = 0; } // Çiy yankısı
        }

        void YetenekCalis(SavasBirimi u, double c, SavasBirimi h)
        {
            Ekle("yetenek", u, 0, -1, u.Yetenek);
            Func<SavasBirimi, double, List<SavasBirimi>> cevre = (merkez, r) => Dusmanlar(u).Where(o => Mesafe(o, merkez) <= r).ToList();
            switch (u.Yetenek)
            {
                case "tasFirlat": if (h != null) { Hasar(u, h, 200 * c, "yetenek"); DurumVer(h, "sersem", 1.5); } break;
                case "uluma": foreach (var d in Dostlar(u)) if (Mesafe(d, u) <= 2.1) DurumVer(d, "uluma", 4); break;
                case "davul": foreach (var d in Dostlar(u)) DurumVer(d, "davul", 4); break;
                case "ruhEmme": if (h != null) { double v = Hasar(u, h, 170 * c, "yetenek"); Iyiles(u, v); } break;
                case "kasirga":
                    if (h != null) foreach (var o in cevre(h, 1.6)) { Hasar(u, o, 110 * c, "yetenek"); o.Y += (o.Taraf == 0 ? 1.5 : -1.5); o.Y = Math.Max(0.4, Math.Min(7.6, o.Y)); }
                    break;
                case "deliOfke": u.Ofke = 3; Iyiles(u, u.Mx * 0.2); break;
                case "zehir":
                    if (h != null) DurumVer(h, "zehir", 4, 55 * c);
                    { var y = Dostlar(u).OrderBy(a => a.Hp / a.Mx).FirstOrDefault(); if (y != null) Iyiles(y, 160 * c); }
                    break;
                case "buzNefes": if (h != null) foreach (var o in cevre(h, 1.6)) { Hasar(u, o, 120 * c, "yetenek"); DurumVer(o, "sersem", 1.2); } break;
                case "ocak":
                    foreach (var o in cevre(u, 2.2)) DurumVer(o, "yanik", 4, 40 * c);
                    foreach (var d in Dostlar(u)) if (Mesafe(d, u) <= 2.2) Iyiles(d, 110 * c);
                    break;
                case "dortnal":
                    {
                        var arka = Dusmanlar(u).OrderByDescending(b => Mesafe(u, b)).FirstOrDefault();
                        if (arka != null) { u.X = arka.X; u.Y = arka.Y + (u.Taraf == 0 ? 0.8 : -0.8); u.Hedef = arka; Hasar(u, arka, 190 * c, "yetenek"); }
                    }
                    break;
                case "kanat": foreach (var d in Dostlar(u)) KalkanVer(d, 140 * c); break;
                case "karaGolge":
                    { var g2 = Dusmanlar(u).OrderByDescending(b => b.Atk).FirstOrDefault(); if (g2 != null) { Hasar(u, g2, 140 * c, "yetenek"); DurumVer(g2, "lanet", 5); } }
                    break;
                case "kulDogus": if (h != null) foreach (var o in cevre(h, 1.6)) { Hasar(u, o, 170 * c, "yetenek"); DurumVer(o, "yanik", 3, 25 * c); } break;
                case "ayaz": foreach (var o in Dusmanlar(u)) { Hasar(u, o, 70 * c, "yetenek"); DurumVer(o, "yavas", 3, 0.4); } break;
                case "golgeOk": { var z = Dusmanlar(u).OrderBy(a => a.Hp).FirstOrDefault(); if (z != null) Hasar(u, z, 320 * c, "yetenek"); } break;
                // canavar yetenekleri (bölüm 5.5)
                case "akrepZehir": if (h != null) DurumVer(h, "zehir", 4, 60 * c); break;
                case "balinaSarki": foreach (var o in Dusmanlar(u)) Hasar(u, o, 110 * c, "yetenek"); break;
                case "bekciDarbe": if (h != null) { Hasar(u, h, 250 * c, "yetenek"); DurumVer(h, "sersem", 1.5); } break;
                case "yildizYutan": foreach (var o in Dusmanlar(u).OrderBy(q => Mesafe(u, q)).Take(3).ToList()) Hasar(u, o, 220 * c, "yetenek"); break;
                case "yildirim":
                    {
                        var ds = Dusmanlar(u);
                        for (int k = 0; k < 3 && ds.Count > 0; k++)
                        {
                            int j = (int)Math.Floor(R.Sonraki() * ds.Count); var o = ds[j]; ds.RemoveAt(j);
                            Hasar(u, o, 150 * c, "yetenek"); DurumVer(o, "sersem", 0.6); Fx.Add(new Fx { T = T, Tip = "simsek", K = u.Uid, U = o.Uid });
                        }
                    }
                    break;
            }
        }

        /// <summary>Kut: kendi biriminin manasını anında doldurur (oyuncu dokunuşunda çağır). Hak sayısı kutHak (+Çifte Kut); ikinci hak KutAra sn sonra.
        /// Kut Yankısı (7.1) ve Kut armağanları (Uyanış, Kut Mirası, Işık Sütunu) burada.</summary>
        public bool Kut(int taraf, int i)
        {
            if (KutYok || kutKalan[taraf] <= 0 || Bitti) return false;
            if (T - sonKutT[taraf] + 1e-9 < KutVeri.KutAra) return false;
            var u = Birimler.FirstOrDefault(o => o.Taraf == taraf && o.I == i && !o.Olu); if (u == null) return false;
            kutKalan[taraf]--; kutSayac[taraf]++; sonKutT[taraf] = T;
            u.Mp = u.Mana; Ekle("kut", u);
            KutYankiUygula(u);
            if (Ar(taraf, "uyanis")) DurumVer(u, "uyanis", 999, KutVeri.ArmUyanis);
            if (Ar(taraf, "kutMirasi")) u.KutMiras = true;
            if (Ar(taraf, "isikSutunu")) foreach (var d in Dostlar(u)) if (d != u && Mesafe(u, d) <= KutVeri.ArmIsikMenzil) d.Mp = Math.Min(d.Mana, d.Mp + d.Mana * KutVeri.ArmIsikSutunu);
            if (kayit != null) kayit.Add(new KutKaydi { T = Math.Round(T, 2, MidpointRounding.AwayFromZero), Taraf = taraf, I = i });
            return true;
        }
        /// <summary>Yankılar: fx yuva/tarif sırasıyla (bileşen başına bir "kutYanki"); etkiler sabit sırayla Kor, Diş, Tüy, Kabuk, Yürek, Pul, Buz (Çiy yetenekten sonra).</summary>
        void KutYankiUygula(SavasBirimi u)
        {
            foreach (var id in u.YankiSira) Ekle("kutYanki", u, 0, -1, id);
            double kat = u.KutTasi > 0 ? KutVeri.YankiKutTasi : 1;
            Func<string, double> n = id => (u.KutYanki.TryGetValue(id, out int c) ? c : 0) * kat;
            double kc = 1; for (int k = 0; k < n("kor"); k++) kc *= KutVeri.YankiKor;
            if (u.E("kutOcagi")) kc *= KutVeri.YankiOcak; // Kut Ocağı: ek ×1,5
            u.KutCarpan = kc;
            if (n("dis") != 0) { u.YankiDis = KutVeri.YankiDisVurus; u.YankiDisOran = KutVeri.YankiDisOran * n("dis"); }
            if (n("tuy") != 0) DurumVer(u, "yankiTuy", KutVeri.YankiTuySure, KutVeri.YankiTuyOran * n("tuy"));
            if (n("kabuk") != 0) DurumVer(u, "yankiKabuk", KutVeri.YankiKabukSure, Math.Min(KutVeri.YankiKabukTavan, KutVeri.YankiKabukOran * n("kabuk")));
            if (n("yurek") != 0) Iyiles(u, u.Mx * KutVeri.YankiYurek * n("yurek"));
            if (n("pul") != 0) DurumVer(u, "yankiPul", KutVeri.YankiPulSure, KutVeri.YankiPulOran * n("pul"));
            if (n("buz") != 0) KalkanVer(u, KutVeri.YankiBuz * u.Kc * n("buz"));
            if (n("ciy") != 0) u.YankiCiy = KutVeri.YankiCiy * n("ciy");
        }
        /// <summary>Kut hakkı kaldı mı.</summary>
        public bool KutVar(int taraf) => !KutYok && kutKalan[taraf] > 0;
        /// <summary>Kut şu an kullanılabilir mi (ikinci hakta ara süresi).</summary>
        public bool KutHazir(int taraf) => KutVar(taraf) && T - sonKutT[taraf] + 1e-9 >= KutVeri.KutAra;
        public int KutKalanSay(int taraf) => kutKalan[taraf];
        public int KutHakSay(int taraf) => kutKalan[taraf] + kutSayac[taraf];
        /// <summary>Şu anki Gün Batımı hasar çarpanı (yoksa ya da başlamadıysa 1).</summary>
        public double GunBatimiCarpan() { if (!gbBas.HasValue) return 1; double gt = T - gbBas.Value + 1e-9; return gt >= 0 ? 1 + KutVeri.GunBatimiArtis * Math.Floor(gt) : 1; }
        public double? GunBatimiBasla => gbBas;
        /// <summary>Yapay zekâ Kut'u (7.4): puan = (mana − mp) × kc + 20 × bileşen + (Kut Ocağı 60); eşitlikte küçük i.</summary>
        void KutYZ(int taraf)
        {
            SavasBirimi en = null; double ep = double.NegativeInfinity;
            foreach (var o in Birimler)
            {
                if (o.Taraf != taraf || o.Olu) continue;
                double p = (o.Mana - o.Mp) * o.Kc + KutVeri.KutYzBilesen * o.BilesenSay + (o.E("kutOcagi") ? KutVeri.KutYzOcak : 0);
                if (p > ep) { ep = p; en = o; }
            }
            if (en != null) Kut(taraf, en.I);
        }

        public void Adim()
        {
            if (Bitti) return;
            Fx.Clear();
            while (kutSira.Count > 0 && kutSira[0].T <= T + 1e-9) { var k = kutSira[0]; kutSira.RemoveAt(0); Kut(k.Taraf, k.I); }
            foreach (int tr in yzTaraf)
                if (kutKalan[tr] > 0 && T >= (kutSayac[tr] != 0 ? yzZaman2 : yzZaman) && (!yzYedek.Contains(tr) || !kutSira.Any(k => k.Taraf == tr))) KutYZ(tr);
            if (gbBas.HasValue && !gbBasladi && T - gbBas.Value + 1e-9 >= 0) { gbBasladi = true; Fx.Add(new Fx { T = T, Tip = "gunBatimi" }); }

            foreach (var u in Birimler)
            {
                if (u.Olu) continue;
                foreach (var key in u.Durum.Keys.ToList()) { var d = u.Durum[key]; d.Sure -= DT; if (d.Sure <= 0) u.Durum.Remove(key); }
                if (u.Var("yanik")) Hasar(null, u, u.Durum["yanik"].Deger * DT, "dot");
                if (u.Var("zehir") && !u.Olu) Hasar(null, u, u.Durum["zehir"].Deger * DT, "dot");
                if (u.Olu) continue;
                int su = Sv(u.Taraf, "su"); if (su != 0 && u.Soy.Contains("su")) IyilesSessiz(u, u.Mx * SU[su] * DT);
                if (u.Pasif == "sicakKalp") IyilesSessiz(u, u.Mx * 0.03 * DT);
                if (u.E("sifaPinari")) IyilesSessiz(u, u.Mx * 0.02 * DT);
                if (u.Var("sersem")) continue;

                if (u.Mp >= u.Mana) { u.Mp = 0; Yetenek(u); if (BittiMi()) return; continue; }
                if (u.Hedef == null || u.Hedef.Olu || T % 0.5 < DT) u.Hedef = EnYakin(u);
                var h = u.Hedef; if (h == null) continue;
                double dd = Mesafe(u, h);
                if (dd > MenzilAl(u) + 0.05)
                {
                    double hiz = (u.Soy.Contains("atli") ? 1.6 : 1.2) * (u.E("bulutNali") ? 1.5 : 1) * DT; // tempo: 1,7 → 1,2, Çevik 2,4 → 1,6
                    u.X += (h.X - u.X) / dd * Math.Min(hiz, dd - MenzilAl(u));
                    u.Y += (h.Y - u.Y) / dd * Math.Min(hiz, dd - MenzilAl(u));
                }
                else
                {
                    u.Cd -= DT * HizCarpan(u);
                    if (u.Cd <= 0)
                    {
                        u.Cd = 1 / u.As; u.Vurus++;
                        Fx.Add(new Fx { T = T, Tip = "vurus", K = u.Uid, U = h.Uid, Menzilli = u.Menzil > 1 });
                        double vm = u.Atk;
                        if (u.E("yirticiPence") && u.Vurus % 3 == 0) vm += h.Mx * 0.08;
                        if (u.E("devYumrugu")) vm += u.Mx * 0.02;
                        if (u.E("bulutNali") && !u.IlkVurusYapildi) vm *= 2;
                        u.IlkVurusYapildi = true; yeniHedef = h.Uid != u.SonHedefUid; u.SonHedefUid = h.Uid;
                        Hasar(u, h, vm, "vurus");
                        if (!h.Olu && !u.Olu) VurusEtki(u, h);
                        int bs = Sv(u.Taraf, "bilge");
                        double bl = bs != 0 && u.Soy.Contains("bilge") ? BILGE[bs] : 0;
                        if (!u.Olu) u.Mp = Math.Min(u.Mana, u.Mp + u.VurusMana * (1 + bl));
                    }
                }
                if (BittiMi()) return;
            }
            // son düşman zaman içi hasarla öldüyse ve kalanlar hedefsiz kaldıysa savaş bu adımda biter
            if (BittiMi()) return;
            T += DT;
            if (T + 1e-9 >= KutVeri.SavasSuresi) // T 0,05 adımlarla birikir: 45 sn 44,999… olarak gelir
            {
                double o0 = 0, o1 = 0;
                foreach (var o in Birimler) { if (o.Taraf == 0) o0 += Math.Max(0, o.Hp) / o.Mx; else o1 += Math.Max(0, o.Hp) / o.Mx; }
                double fark = o0 - o1;
                Bitir(Math.Abs(fark) < 0.05 ? -1 : fark > 0 ? 0 : 1);
            }
        }
        static void IyilesSessiz(SavasBirimi u, double n) { u.Hp = Math.Min(u.Mx, u.Hp + n); }
        bool BittiMi()
        {
            bool a = Birimler.Any(o => o.Taraf == 0 && !o.Olu), b = Birimler.Any(o => o.Taraf == 1 && !o.Olu);
            if (a && b) return false; Bitir(a ? 0 : b ? 1 : -1); return true;
        }
        void Bitir(int k)
        {
            Bitti = true;
            double kalan = 0; int puan = 0, sayi = 0;
            foreach (var o in Birimler) if (!o.Olu && o.Taraf == k) { kalan += o.Kc * o.Kademe; puan += o.B.S == 0 ? 1 : o.B.S; sayi++; }
            Sonuc = new SavasSonucu { Kazanan = k, Sure = Math.Round(T, 2, MidpointRounding.AwayFromZero), Kalan = kalan, KalanPuan = puan, KalanSayi = sayi, Kut = new[] { kutSayac[0], kutSayac[1] } };
        }
        public SavasSonucu SonunaKadar() { int n = 0; while (!Bitti && n++ < 100000) Adim(); return Sonuc; }
    }
}
