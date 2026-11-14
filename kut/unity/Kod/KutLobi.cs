// Kut Arena seviyeli maç kuralları: kut/lobi.js'in birebir C# karşılığı (saf, belirlenimci).
// Deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3),
// tur planı (1.1), birikimli ekonomi (3) ve kaybedince alınan hasar (4.4).
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
        public static int GanimetAltin(int r) => KutVeri.GanimetAltin.TryGetValue(TurAd(r), out int a) ? a : 0;

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
    }
}
