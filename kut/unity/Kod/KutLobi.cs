// Kut Arena seviyeli maç kuralları: kut/lobi.js'in birebir C# karşılığı (saf, belirlenimci).
// Deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3).
// Değiştirirken lobi.js'i de aynı şekilde değiştir ve kut/unity/Test ile eşdeğerliği sına.
using System.Collections.Generic;
using System.Linq;

namespace Kut
{
    public struct SeviyeDurum { public int Seviye, Xp; }

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
