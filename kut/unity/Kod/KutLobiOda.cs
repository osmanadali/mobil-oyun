// Kut Arena 8 kişilik hayalet lobi: kut/lobi.js'in lobi bölümünün (lobiYeni … havuzLobi) birebir C# karşılığı (saf, belirlenimci).
// Eşleşme sırası ve Yansıma (OYNANIS_DERINLIK.md 4.2), hayalet × hayalet savaşları (4.6), kaybedince hasar (4.4), sıralama ve kupa (4.5),
// lobi alameti (8), lobide havuz (2.3). Değiştirirken lobi.js'i de aynı şekilde değiştir ve kut/unity/Test ile eşdeğerliği sına.
using System.Collections.Generic;
using System.Linq;

namespace Kut
{
    /// <summary>Lobideki bir oyuncu. Canli: canlı oyuncu (iz yok); öbürleri Iz ile oynar. GecmisRakip: her PvP turunda rakibin indeksi (Yansıma -1).</summary>
    public sealed class LobiOyuncu
    {
        public int I; public string Ad; public int Kupa; public bool Canli; public LobiIz Iz;
        public int Can = KutVeri.CanBaslangic, ElenmeR = -1, TurBasiCan = KutVeri.CanBaslangic, Sira;
        public bool Olu, SonYansima; public List<int> GecmisRakip = new List<int>(); public Seri Seri = new Seri();
    }
    /// <summary>Lobi durumu: lobi tohumu, sıradaki tur (R), 8 oyuncu, son tur raporu.</summary>
    public sealed class Lobi { public double Tohum; public int R; public List<LobiOyuncu> Oyuncular = new List<LobiOyuncu>(); public LobiRapor Son; }
    /// <summary>Bir turun eşleşmesi. Yansima: null ya da { a, kopya }.</summary>
    public sealed class Eslesme { public int R; public List<int[]> Ciftler = new List<int[]>(); public int[] Yansima; }
    /// <summary>Lobideki bir savaşın sonucu (kazanan a'ya göre; Yansıma'da b kopyalanan, canavarda -1). Hasar: [a'nın, b'nin].</summary>
    public sealed class LobiSonuc { public int A, B; public string Tip; public int Kazanan, KalanPuan, KalanSayi; public double Sure; public int[] Hasar; }
    public sealed class LobiRapor { public int R; public string Tip, Alamet; public int Yasayan; public List<LobiSonuc> Sonuclar = new List<LobiSonuc>(); public int[] Hasar; public List<int> Elenen = new List<int>(); }
    /// <summary>Canlı oyuncunun bu turki savaşı (taraf 0) — lobiTurOyna'ya dışarıdan verilir.</summary>
    public sealed class CanliSonuc { public int Kazanan, KalanPuan, KalanSayi; public double Sure; }

    public static partial class KutLobi
    {
        /// <summary>Lobi kur. canliIz null ise oyuncu 0 canlı oyuncudur; verilirse o da hayalet gibi oynar (benzetim). tohum uint'e indirilir (JS &gt;&gt;&gt; 0).</summary>
        public static Lobi LobiYeni(string ad, int kupa, LobiIz canliIz, IList<LobiIz> izler, double tohum)
        {
            var lb = new Lobi { Tohum = KutRng.ToUint32(tohum), R = 0 };
            lb.Oyuncular.Add(new LobiOyuncu { I = 0, Ad = ad, Kupa = kupa, Canli = canliIz == null, Iz = canliIz });
            for (int k = 0; k < izler.Count && lb.Oyuncular.Count < KutVeri.LobiBoyut; k++)
                lb.Oyuncular.Add(new LobiOyuncu { I = k + 1, Ad = izler[k].Ad, Kupa = izler[k].Kupa, Iz = izler[k] });
            return lb;
        }
        static List<int> Yasayanlar(Lobi lb) => lb.Oyuncular.Where(o => !o.Olu).Select(o => o.I).ToList();
        public static int YasayanSay(Lobi lb) => lb.Oyuncular.Count(o => !o.Olu);

        /// <summary>i. oyuncunun r. turdaki kadrosu. Canlı oyuncu için canliTakim (verilmediyse boş).</summary>
        public static IzTur LobiKadro(Lobi lb, int i, int r, List<TakimBirimi> canliTakim = null)
        {
            var o = lb.Oyuncular[i];
            if (o.Canli) return new IzTur { R = r, Takim = canliTakim ?? new List<TakimBirimi>() };
            if (o.Iz.Bot) return KutHayalet.BotIzTur(o.Iz.BotTohum, o.Iz.BotGuc, r);
            return KutHayalet.IzTurAl(o.Iz.Turlar, r) ?? new IzTur { R = r };
        }

        /// <summary>Lobinin r. turunun alameti: bölüm 1'de ve Kervan'da Durgun Gök; aynı alamet art arda gelmez.</summary>
        public static string LobiAlamet(double tohum, int r)
        {
            string once = null, al = "yok";
            for (int q = 0; q <= r; q++)
            {
                var p = TurPlan(q);
                if (p.Bolum == 1 || p.Tip == "kervan") { al = "yok"; continue; }
                var l = KutVeri.Alametler.Where(a => a.Id != once).ToList(); var R = new KutRng(tohum + q * 7919.0 + 3);
                double top = 0; foreach (var a in l) top += a.W; // ağırlıklı (bölüm 8: Durgun Gök 2)
                double x = R.Sonraki() * top; al = l[l.Count - 1].Id;
                foreach (var a in l) { x -= a.W; if (x < 0) { al = a.Id; break; } }
                once = al;
            }
            return al;
        }
        /// <summary>r'den başlayarak n turun alameti (sıradaki alamet önceden görünür).</summary>
        public static List<string> AlametSirasi(double tohum, int r, int n) { var l = new List<string>(); for (int k = 0; k < n; k++) l.Add(LobiAlamet(tohum, r + k)); return l; }

        static List<int> Karistir(List<int> l, KutRng R)
        {
            var a = l.ToList();
            for (int i = a.Count - 1; i > 0; i--) { int j = (int)System.Math.Floor(R.Sonraki() * (i + 1)); int t = a[i]; a[i] = a[j]; a[j] = t; }
            return a;
        }
        static bool Yasakli(Lobi lb, int a, int b, int k)
        {
            if (k <= 0) return false;
            var ga = lb.Oyuncular[a].GecmisRakip; var gb = lb.Oyuncular[b].GecmisRakip;
            return ga.Skip(System.Math.Max(0, ga.Count - k)).Contains(b) || gb.Skip(System.Math.Max(0, gb.Count - k)).Contains(a);
        }
        static List<int[]> Acgozlu(Lobi lb, List<int> s, int k)
        {
            var kul = new bool[s.Count]; var outp = new List<int[]>();
            for (int x = 0; x < s.Count; x++)
            {
                if (kul[x]) continue;
                int y = x + 1; while (y < s.Count && (kul[y] || Yasakli(lb, s[x], s[y], k))) y++;
                if (y >= s.Count) return null;
                kul[x] = kul[y] = true; outp.Add(new[] { s[x], s[y] });
            }
            return outp;
        }
        /// <summary>Eşleşme sırası (bölüm 4.2): Yansıma (tek sayıda yaşayan), son K = min(3, yaşayan − 2) turun rakibi yasak, 50 deneme, sonra yasak kısalır.</summary>
        public static Eslesme EslesmeKur(Lobi lb, int r)
        {
            var R = new KutRng(lb.Tohum + r * 7919.0); var yas = Yasayanlar(lb); var outp = new Eslesme { R = r };
            if (yas.Count < 2) return outp;
            var liste = yas;
            if (yas.Count % 2 == 1)
            {
                var aday = yas.Where(i => !lb.Oyuncular[i].SonYansima).ToList(); var hv = aday.Count > 0 ? aday : yas;
                int a = hv[(int)System.Math.Floor(R.Sonraki() * hv.Count)]; var diger = yas.Where(i => i != a).ToList();
                outp.Yansima = new[] { a, diger[(int)System.Math.Floor(R.Sonraki() * diger.Count)] };
                liste = diger;
            }
            for (int k = System.Math.Min(KutVeri.YasakTur, yas.Count - 2); k >= 0; k--)
                for (int d = 0; d < KutVeri.EslesmeDeneme; d++) { var c = Acgozlu(lb, Karistir(liste, R), k); if (c != null) { outp.Ciftler = c; return outp; } }
            return outp;
        }
        /// <summary>i. oyuncunun rakibi: (j, yansima) ya da null.</summary>
        public static (int j, bool yansima)? LobiRakip(Eslesme es, int i)
        {
            if (es.Yansima != null && es.Yansima[0] == i) return (es.Yansima[1], true);
            foreach (var c in es.Ciftler) { if (c[0] == i) return (c[1], false); if (c[1] == i) return (c[0], false); }
            return null;
        }
        /// <summary>Kayıttaki dokunuşu olan tarafta yapay zekâ yedek (ölü birim, ikinci hak); armağanlar iki taraf için; Son İki'de 2 Kut hakkı.</summary>
        static SavasSonucu GolgeSavas(IzTur ka, IzTur kb, string alamet, double tohum, bool pve, int yasayan, int canA, int canB)
        {
            var kut = new List<KutKaydi>(); var yz = new List<int>(); var yzYedek = new List<int>();
            if (ka.Kut != null) { kut.Add(new KutKaydi { T = ka.Kut.T, Taraf = 0, I = ka.Kut.I }); yzYedek.Add(0); } else yz.Add(0);
            if (!pve) { if (kb.Kut != null) { kut.Add(new KutKaydi { T = kb.Kut.T, Taraf = 1, I = kb.Kut.I }); yzYedek.Add(1); } else yz.Add(1); }
            int hak = yasayan == 2 ? KutVeri.SonIkiKutHak : KutVeri.KutHak;
            var ar = new List<IList<string>> { SavasArmagan(ka.Armagan, canA), pve ? new List<string>() : SavasArmagan(kb.Armagan, canB) };
            return new KutSavas(ka.Takim, kb.Takim, tohum, alamet, kut, yz.ToArray(), gunBatimi: KutVeri.GunBatimiBasla,
                armagan: ar, kutHak: new[] { hak, pve ? 0 : hak }, yzYedek: yzYedek.ToArray()).SonunaKadar();
        }
        static LobiSonuc Bir(int a, int b, string tip, SavasSonucu s) => new LobiSonuc { A = a, B = b, Tip = tip, Kazanan = s.Kazanan, KalanPuan = s.KalanPuan, KalanSayi = s.KalanSayi, Sure = s.Sure };
        /// <summary>Hayalet × hayalet savaşları (bölüm 4.6): canlı oyuncunun dahil olmadığı eşleşmeler; canavar turunda her hayalet kendi dalgasıyla.</summary>
        public static List<LobiSonuc> GolgeSavaslari(Lobi lb, int r, string alamet, Eslesme es, List<TakimBirimi> canliTakim = null)
        {
            var p = TurPlan(r); var outp = new List<LobiSonuc>(); int yas = Yasayanlar(lb).Count;
            if (p.Tip == "pve")
            {
                var dalga = new IzTur { Takim = PveDalga(r) };
                foreach (int i in Yasayanlar(lb)) if (!lb.Oyuncular[i].Canli)
                    outp.Add(Bir(i, -1, "pve", GolgeSavas(LobiKadro(lb, i, r), dalga, alamet, lb.Tohum + r * 104729.0 + i * 7907.0 + 50021, true, yas, lb.Oyuncular[i].Can, 0)));
                return outp;
            }
            if (p.Tip != "pvp") return outp;
            for (int k = 0; k < es.Ciftler.Count; k++)
            {
                int a = es.Ciftler[k][0], b = es.Ciftler[k][1];
                if (lb.Oyuncular[a].Canli || lb.Oyuncular[b].Canli) continue;
                outp.Add(Bir(a, b, "pvp", GolgeSavas(LobiKadro(lb, a, r), LobiKadro(lb, b, r), alamet, lb.Tohum + r * 104729.0 + k * 7907.0 + 1, false, yas, lb.Oyuncular[a].Can, lb.Oyuncular[b].Can)));
            }
            if (es.Yansima != null && !lb.Oyuncular[es.Yansima[0]].Canli)
                outp.Add(Bir(es.Yansima[0], es.Yansima[1], "yansima", GolgeSavas(LobiKadro(lb, es.Yansima[0], r), LobiKadro(lb, es.Yansima[1], r, canliTakim), alamet, lb.Tohum + r * 104729.0 + 97, false, yas, lb.Oyuncular[es.Yansima[0]].Can, lb.Oyuncular[es.Yansima[1]].Can)));
            return outp;
        }

        /// <summary>Bir turu lobide oynat: eşleşme, hayalet savaşları, canlı oyuncunun sonucu, hasar (Son Üç / Son İki dahil), seri, elenme, sıralama.</summary>
        public static LobiRapor LobiTurOyna(Lobi lb, int r, Eslesme eslesme = null, List<TakimBirimi> canliTakim = null, CanliSonuc canliSonuc = null)
        {
            var p = TurPlan(r); string alamet = LobiAlamet(lb.Tohum, r); var yas = Yasayanlar(lb);
            var rapor = new LobiRapor { R = r, Tip = p.Tip, Alamet = alamet, Yasayan = yas.Count, Hasar = new int[lb.Oyuncular.Count] };
            if (p.Tip == "kervan" || yas.Count < 2) { lb.R = r + 1; lb.Son = rapor; return rapor; }
            foreach (int i in yas) lb.Oyuncular[i].TurBasiCan = lb.Oyuncular[i].Can;
            var es = p.Tip == "pvp" ? (eslesme ?? EslesmeKur(lb, r)) : new Eslesme { R = r };
            var sonuclar = GolgeSavaslari(lb, r, alamet, es, canliTakim);
            int ci = lb.Oyuncular.FindIndex(o => o.Canli && !o.Olu);
            if (ci >= 0 && canliSonuc != null)
            {
                var cs = canliSonuc;
                LobiSonuc B(int a, int b, string tip, int k) => new LobiSonuc { A = a, B = b, Tip = tip, Kazanan = k, KalanPuan = cs.KalanPuan, KalanSayi = cs.KalanSayi, Sure = cs.Sure };
                if (p.Tip == "pve") sonuclar.Add(B(ci, -1, "pve", cs.Kazanan));
                else
                {
                    var rk = LobiRakip(es, ci);
                    if (rk != null)
                    {
                        if (rk.Value.yansima) sonuclar.Add(B(ci, rk.Value.j, "yansima", cs.Kazanan));
                        else
                        {
                            var c = es.Ciftler.First(x => x[0] == ci || x[1] == ci);
                            int ters = cs.Kazanan == 0 ? 1 : cs.Kazanan == 1 ? 0 : cs.Kazanan;
                            sonuclar.Add(c[0] == ci ? B(c[0], c[1], "pvp", cs.Kazanan) : B(c[0], c[1], "pvp", ters));
                        }
                    }
                }
            }
            foreach (var s in sonuclar)
            {
                var h = KayipHasar(r, s.Kazanan, s.KalanPuan, s.KalanSayi, yas.Count);
                s.Hasar = s.Tip == "pvp" ? h : new[] { h[0], 0 };
                rapor.Hasar[s.A] += s.Hasar[0]; if (s.Tip == "pvp") rapor.Hasar[s.B] += s.Hasar[1];
                if (s.Tip != "pve")
                {
                    var oa = lb.Oyuncular[s.A]; oa.Seri = SeriGuncelle(oa.Seri, s.Kazanan, "pvp");
                    if (s.Tip == "pvp") { var ob = lb.Oyuncular[s.B]; ob.Seri = SeriGuncelle(ob.Seri, s.Kazanan == 0 ? 1 : s.Kazanan == 1 ? 0 : -1, "pvp"); }
                }
            }
            foreach (int i in yas) { var o = lb.Oyuncular[i]; o.Can = System.Math.Max(0, o.Can - rapor.Hasar[i]); }
            if (p.Tip == "pvp")
                foreach (int i in yas) { var rk = LobiRakip(es, i); var o = lb.Oyuncular[i]; o.GecmisRakip.Add(rk == null ? -1 : rk.Value.yansima ? -1 : rk.Value.j); o.SonYansima = rk != null && rk.Value.yansima; }
            rapor.Sonuclar = sonuclar;
            rapor.Elenen = SiralamaGuncelle(lb, r);
            lb.R = r + 1; lb.Son = rapor;
            return rapor;
        }
        /// <summary>Canı biten elenir; aynı turda elenenlerde tur başı canı fazla olan önde (eşitlikte küçük indeks). Tek kişi kalınca o birinci.</summary>
        public static List<int> SiralamaGuncelle(Lobi lb, int r)
        {
            var yeni = lb.Oyuncular.Where(o => !o.Olu && o.Can <= 0).OrderByDescending(o => o.TurBasiCan).ThenBy(o => o.I).ToList();
            foreach (var o in yeni) { o.Olu = true; o.ElenmeR = r; }
            int kalan = YasayanSay(lb);
            for (int k = 0; k < yeni.Count; k++) yeni[k].Sira = kalan + 1 + k;
            if (kalan == 1) lb.Oyuncular.First(o => !o.Olu).Sira = 1;
            return yeni.Select(o => o.I).ToList();
        }
        public static bool LobiBitti(Lobi lb) => YasayanSay(lb) <= 1;
        /// <summary>Lobiyi sona kadar oynat; tur tavanında kalanlar cana göre sıralanır.</summary>
        public static Lobi LobiSonaKadar(Lobi lb, List<TakimBirimi> canliTakim = null)
        {
            while (!LobiBitti(lb) && lb.R < KutVeri.LobiTurTavan) LobiTurOyna(lb, lb.R, null, canliTakim);
            if (!LobiBitti(lb))
            {
                var l = lb.Oyuncular.Where(o => !o.Olu).OrderByDescending(o => o.Can).ThenBy(o => o.I).ToList();
                for (int k = 0; k < l.Count; k++) { l[k].Sira = k + 1; l[k].Olu = k > 0; if (k > 0) l[k].ElenmeR = lb.R - 1; }
            }
            return lb;
        }
        /// <summary>Anlık sıra: elendiyse kesin sırası; yaşıyorsa 1 + canı fazla olan yaşayanlar (eşitlikte küçük indeks önde).</summary>
        public static int LobiSira(Lobi lb, int i)
        {
            var o = lb.Oyuncular[i]; if (o.Olu) return o.Sira;
            return 1 + lb.Oyuncular.Count(x => !x.Olu && x.I != i && (x.Can > o.Can || (x.Can == o.Can && x.I < i)));
        }
        /// <summary>Sıralama kupası (bölüm 4.5): 0–400 kupada kayıp yarı; kupa 0'ın altına düşmez. Dönen: gerçek değişim.</summary>
        public static int KupaDegisim(int sira, int kupa)
        {
            int d = KutVeri.KupaTablo[System.Math.Max(1, System.Math.Min(KutVeri.KupaTablo.Length - 1, sira))];
            if (d < 0 && kupa <= KutVeri.KupaKoruma) d = d / 2;
            return System.Math.Max(0, kupa + d) - kupa;
        }
        /// <summary>Lobide havuzda kalan kopyalar: oyuncunun birimleri + yaşayan hayaletlerin r. turdaki kadrosu ve yedeği düşülür.</summary>
        public static Dictionary<string, int> HavuzLobi(Lobi lb, int r, IEnumerable<TakimBirimi> oyuncuBirimler)
        {
            var gr = new List<IEnumerable<TakimBirimi>> { oyuncuBirimler ?? new List<TakimBirimi>() };
            foreach (var o in lb.Oyuncular) if (!o.Olu && !o.Canli) { var k = LobiKadro(lb, o.I, r); gr.Add(k.Takim); gr.Add(k.Yedek ?? new List<TakimBirimi>()); }
            return HavuzKalan(gr);
        }
    }
}
