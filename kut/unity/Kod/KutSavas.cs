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
        public int X, Y;      // X: 0..2, Y: 0 ön | 1 arka
        public TakimBirimi Kopya() => new TakimBirimi { H = H, S = S, F = F, X = X, Y = Y };
    }

    public sealed class BirimStat
    {
        public string Ad, Yetenek, Pasif; public double Can, Atk, As, Mana, Kc; public int Menzil; public List<string> Soy;
    }

    public sealed class SoyDurum { public int N, Seviye; }

    public sealed class Durum { public double Sure, Deger; }

    public sealed class Fx
    {
        public double T; public string Tip; public int U = -1, K = -1; public double N; public string Ad; public bool Menzilli;
    }

    public sealed class KutKaydi { public double T; public int Taraf, I; }

    public sealed class SavasSonucu { public int Kazanan; public double Sure; public double Kalan; }

    public sealed class SavasBirimi
    {
        public int Uid, Taraf, I; public TakimBirimi B;
        public string Ad, Yetenek, Pasif; public double Atk, As, Mana, Kc; public int Menzil; public List<string> Soy;
        public double Mx, Hp, X, Y, X0, Y0, Mp, Cd, Kalkan; public bool Olu, Dirildi; public int Vurus, PayYigin, Ofke;
        public Dictionary<string, Durum> Durum = new Dictionary<string, Durum>();
        public SavasBirimi Hedef;
        public bool Var(string d) => Durum.ContainsKey(d);
    }

    public static class KutMotor
    {
        public static double JsRound(double x) => Math.Floor(x + 0.5);

        public static BirimStat BirimStatHesapla(TakimBirimi b)
        {
            var A = KutVeri.KahramanBul(b.H); var B = b.F != null ? KutVeri.KahramanBul(b.F) : null;
            double c = KutVeri.YildizCarpan[b.S == 0 ? 1 : b.S];
            double can = A.Can, atk = A.Atk, hiz = A.As;
            if (B != null) { can = (A.Can + B.Can) / 2 * 1.15; atk = (A.Atk + B.Atk) / 2 * 1.15; hiz = (A.As + B.As) / 2; }
            var soy = new List<string>(A.Soy);
            if (B != null) foreach (var s in B.Soy) if (!soy.Contains(s)) soy.Add(s);
            return new BirimStat { Ad = B != null ? A.Ad + " × " + B.Ad : A.Ad, Can = JsRound(can * c), Atk = JsRound(atk * c), As = hiz, Menzil = A.Menzil, Mana = A.Mana,
                Yetenek = A.Yetenek, Pasif = B != null ? B.Pasif : A.Pasif, Soy = soy, Kc = c };
        }

        /// <summary>Soy sayımı (aynı kahraman iki kez sayılmaz; kaynaşmış birim kendi kimliğiyle sayılır). Sıra: ilk görülme.</summary>
        public static List<KeyValuePair<string, SoyDurum>> SoySay(IList<TakimBirimi> takim)
        {
            var sira = new List<string>(); var say = new Dictionary<string, HashSet<string>>();
            foreach (var b in takim)
                foreach (var s in BirimStatHesapla(b).Soy)
                {
                    if (!say.ContainsKey(s)) { say[s] = new HashSet<string>(); sira.Add(s); }
                    say[s].Add(b.H + (b.F != null ? "+" + b.F : ""));
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

        readonly KutRng R; readonly string alamet; readonly int[] yz; readonly double yzZaman;
        readonly bool[] kutKullanildi = new bool[2];
        readonly List<KutKaydi> kutSira; readonly List<KutKaydi> kayit;

        static readonly double[] GOK = { 0, 0.15, 0.35 }, ATLI = { 0, 0.4, 0.9 }, KIS = { 0, 0.15, 0.3 }, AVCI = { 0, 0.2, 0.45 }, KARA = { 0, 0.2, 0.5 },
            DEV = { 0, 0.12, 0.28 }, YER = { 0, 150, 400 }, SU = { 0, 0.02, 0.05 }, BILGE = { 0, 0.3, 0.7 }, OD_SURE = { 0, 2, 3 }, OD_DEGER = { 0, 12, 28 };

        /// <param name="kut">Tekrar oynatma için Kut dokunuşları (t, taraf, i).</param>
        /// <param name="yz">Kut'u yapay zekânın kullanacağı taraflar (ör. bot rakip: {1}).</param>
        /// <param name="kayit">Verilirse oyuncunun Kut dokunuşları buraya yazılır (paylaşım / doğrulama için).</param>
        public KutSavas(IList<TakimBirimi> takimA, IList<TakimBirimi> takimB, double tohum = 1, string alamet = "yok",
            IEnumerable<KutKaydi> kut = null, int[] yz = null, double yzZaman = 5, List<KutKaydi> kayit = null)
        {
            R = new KutRng(tohum == 0 ? 1 : tohum);
            this.alamet = alamet ?? "yok"; this.yz = yz ?? new int[0]; this.yzZaman = yzZaman; this.kayit = kayit;
            kutSira = (kut ?? Enumerable.Empty<KutKaydi>()).OrderBy(k => k.T).ToList();
            Soylar[0] = KutMotor.SoySay(takimA); Soylar[1] = KutMotor.SoySay(takimB);

            var takimlar = new[] { takimA, takimB };
            for (int taraf = 0; taraf < 2; taraf++)
                for (int i = 0; i < takimlar[taraf].Count; i++)
                {
                    var b = takimlar[taraf][i]; var st = KutMotor.BirimStatHesapla(b);
                    double x = b.X * 2 + 1, y = taraf == 0 ? (b.Y != 0 ? 6.6 : 5) : (b.Y != 0 ? 1.4 : 3);
                    double can = st.Can;
                    int y1 = Sv(taraf, "yer"); can += YER[y1] * 1;
                    if (this.alamet == "tutulma" && st.Soy.Contains("karanlik")) can *= 1.3;
                    if (this.alamet == "yaz" && st.Soy.Contains("kis")) can *= 0.85;
                    can = KutMotor.JsRound(can);
                    Birimler.Add(new SavasBirimi { Uid = taraf * 10 + i, Taraf = taraf, I = i, B = b, Ad = st.Ad, Yetenek = st.Yetenek, Pasif = st.Pasif, Atk = st.Atk, As = st.As,
                        Mana = st.Mana, Kc = st.Kc, Menzil = st.Menzil, Soy = st.Soy, Mx = can, Hp = can, X = x, Y = y, X0 = x, Y0 = y, Mp = 0, Cd = 0.3 + R.Sonraki() * 0.3 });
                }

            // Savaş başı etkileri
            foreach (var u in Birimler)
            {
                if (u.Pasif == "kisNefesi") u.Mp = u.Mana * 0.5;
                if (this.alamet == "kutYagmur") u.Mp = Math.Max(u.Mp, u.Mana * 0.4);
                if (u.Pasif == "ana") foreach (var d in Dostlar(u)) if (d != u && Mesafe(u, d) <= 2.6) KalkanVer(d, 90 * u.Kc);
            }
        }

        public int Sv(int taraf, string soy) { foreach (var kv in Soylar[taraf]) if (kv.Key == soy) return kv.Value.Seviye; return 0; }
        List<SavasBirimi> Dostlar(SavasBirimi u) => Birimler.Where(o => o.Taraf == u.Taraf && !o.Olu).ToList();
        List<SavasBirimi> Dusmanlar(SavasBirimi u) => Birimler.Where(o => o.Taraf != u.Taraf && !o.Olu).ToList();
        public static double Mesafe(SavasBirimi a, SavasBirimi b) { double dx = a.X - b.X, dy = a.Y - b.Y; return Math.Sqrt(dx * dx + dy * dy); }
        SavasBirimi EnYakin(SavasBirimi u) { SavasBirimi en = null; double m = 1e9; foreach (var o in Dusmanlar(u)) { double d = Mesafe(u, o) + o.I * 1e-4; if (d < m) { m = d; en = o; } } return en; }
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
            int atl = Sv(u.Taraf, "atli"); if (atl != 0 && u.Soy.Contains("atli") && T < 4) k += ATLI[atl];
            if (u.Pasif == "ruzgar" && T < 5) k += 0.35;
            if (u.Var("uluma")) k += 0.45;
            int kis = Sv(1 - u.Taraf, "kis"); if (kis != 0) k -= KIS[kis];
            if (u.Var("yavas")) k -= u.Durum["yavas"].Deger;
            if (alamet == "tipi" && !u.Soy.Contains("kis")) k -= 0.2;
            return Math.Max(0.25, k);
        }

        double Hasar(SavasBirimi kaynak, SavasBirimi hedef, double miktar, string tur)
        {
            if (hedef.Olu) return 0;
            double m = miktar;
            if (kaynak != null)
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
            }
            if (tur == "vurus" && hedef.Pasif == "kacis" && R.Sonraki() < 0.25) { Ekle("kac", hedef); return 0; }
            int dv = Sv(hedef.Taraf, "dev"); if (dv != 0 && hedef.Soy.Contains("dev")) m *= 1 - DEV[dv];
            if (hedef.Pasif == "tasDeri") m *= 0.8;
            if (hedef.Kalkan > 0) { double e = Math.Min(hedef.Kalkan, m); hedef.Kalkan -= e; m -= e; }
            m = Math.Max(0, m);
            hedef.Hp -= m;
            if (tur != "dot") hedef.Mp = Math.Min(hedef.Mana, hedef.Mp + m * 0.05);
            if (m >= 1) Ekle(tur == "dot" ? "dot" : "hasar", hedef, KutMotor.JsRound(m), kaynak != null ? kaynak.Uid : -1);
            if (kaynak != null && kaynak.Pasif == "canEmici" && tur != "dot") Iyiles(kaynak, m * 0.2);
            if (hedef.Hp <= 0) Olum(hedef);
            return m;
        }

        void Olum(SavasBirimi u)
        {
            if (u.Pasif == "yenidenDogus" && !u.Dirildi) { u.Dirildi = true; u.Hp = u.Mx * 0.4; u.Durum = new Dictionary<string, Durum>(); Ekle("dirilis", u); return; }
            u.Olu = true; u.Hp = 0; Ekle("olum", u);
            foreach (var d in Birimler)
            {
                if (d.Olu) continue;
                if (d.Taraf == u.Taraf && d.Pasif == "ruhBagi") d.Mp = Math.Min(d.Mana, d.Mp + 35);
                if (d.Taraf != u.Taraf && d.Pasif == "karanlikPay") d.PayYigin++;
            }
        }

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
        }

        void Yetenek(SavasBirimi u)
        {
            double c = u.Kc; var h = u.Hedef != null && !u.Hedef.Olu ? u.Hedef : EnYakin(u);
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

        /// <summary>Kut: savaş başına bir kez, kendi biriminin manasını anında doldurur. Oyuncu dokunuşunda çağır.</summary>
        public bool Kut(int taraf, int i)
        {
            if (kutKullanildi[taraf] || Bitti) return false;
            var u = Birimler.FirstOrDefault(o => o.Taraf == taraf && o.I == i && !o.Olu); if (u == null) return false;
            kutKullanildi[taraf] = true; u.Mp = u.Mana; Ekle("kut", u);
            if (kayit != null) kayit.Add(new KutKaydi { T = Math.Round(T, 2, MidpointRounding.AwayFromZero), Taraf = taraf, I = i });
            return true;
        }
        public bool KutVar(int taraf) => !kutKullanildi[taraf];
        void KutYZ(int taraf)
        {
            var ad = Birimler.Where(o => o.Taraf == taraf && !o.Olu).OrderByDescending(o => (o.Mana - o.Mp) * o.Kc).FirstOrDefault();
            if (ad != null) Kut(taraf, ad.I);
        }

        public void Adim()
        {
            if (Bitti) return;
            Fx.Clear();
            while (kutSira.Count > 0 && kutSira[0].T <= T + 1e-9) { var k = kutSira[0]; kutSira.RemoveAt(0); Kut(k.Taraf, k.I); }
            foreach (int tr in yz) if (!kutKullanildi[tr] && T >= yzZaman) KutYZ(tr);

            foreach (var u in Birimler)
            {
                if (u.Olu) continue;
                foreach (var key in u.Durum.Keys.ToList()) { var d = u.Durum[key]; d.Sure -= DT; if (d.Sure <= 0) u.Durum.Remove(key); }
                if (u.Var("yanik")) Hasar(null, u, u.Durum["yanik"].Deger * DT, "dot");
                if (u.Var("zehir") && !u.Olu) Hasar(null, u, u.Durum["zehir"].Deger * DT, "dot");
                if (u.Olu) continue;
                int su = Sv(u.Taraf, "su"); if (su != 0 && u.Soy.Contains("su")) IyilesSessiz(u, u.Mx * SU[su] * DT);
                if (u.Pasif == "sicakKalp") IyilesSessiz(u, u.Mx * 0.03 * DT);
                if (u.Var("sersem")) continue;

                if (u.Mp >= u.Mana) { u.Mp = 0; Yetenek(u); if (BittiMi()) return; continue; }
                if (u.Hedef == null || u.Hedef.Olu || T % 0.5 < DT) u.Hedef = EnYakin(u);
                var h = u.Hedef; if (h == null) continue;
                double dd = Mesafe(u, h);
                if (dd > MenzilAl(u) + 0.05)
                {
                    double hiz = (u.Soy.Contains("atli") ? 2.4 : 1.7) * DT;
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
                        Hasar(u, h, u.Atk, "vurus");
                        if (!h.Olu) VurusEtki(u, h);
                        int bs = Sv(u.Taraf, "bilge");
                        double bl = bs != 0 && u.Soy.Contains("bilge") ? BILGE[bs] : 0;
                        u.Mp = Math.Min(u.Mana, u.Mp + 10 * (1 + bl));
                    }
                }
                if (BittiMi()) return;
            }
            T += DT;
            if (T >= KutVeri.SavasSuresi)
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
            double kalan = 0; foreach (var o in Birimler) if (!o.Olu && o.Taraf == k) kalan += o.Kc * KutVeri.KahramanBul(o.B.H).Kademe;
            Sonuc = new SavasSonucu { Kazanan = k, Sure = Math.Round(T, 2, MidpointRounding.AwayFromZero), Kalan = kalan };
        }
        public SavasSonucu SonunaKadar() { int n = 0; while (!Bitti && n++ < 100000) Adim(); return Sonuc; }
    }
}
