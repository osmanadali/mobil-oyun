// Kut Arena rakip katmanı: kut/online.js'in C# karşılığı.
// Bot takım üretimi (tarayıcıyla aynı tohum → aynı takım) ve düello kodu (KUT1-…; iki sürüm birbirinin kodunu çözer).
// Uzak hayalet havuzu (Firebase vb.) IHayaletHavuzu arayüzüyle takılır.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Kut
{
    public sealed class Rakip { public string Ad; public List<TakimBirimi> Takim; public int Kupa; public string Kaynak; }

    /// <summary>Çevrimiçi havuz: her tur sonunda takım fotoğrafı bırakılır; rakip aynı tur ve benzer kupadan çekilir.</summary>
    public interface IHayaletHavuzu
    {
        void Birak(int tur, int kupa, string oyuncu, string ad, List<TakimBirimi> takim);
        /// <summary>Uygun kayıt yoksa null döner (o zaman bot kullanılır).</summary>
        Rakip Bul(int tur, int kupa, string oyuncu);
    }

    public static class KutHayalet
    {
        static readonly string[] ADLAR = { "Kara Bulut", "Ak Doğan", "Demir Yay", "Mavi Kıvılcım", "Yalın Kılıç", "Gece Rüzgârı", "Taş Yürek", "Ay Kaya", "Sessiz Ok", "Kor Göz", "Bulut Avcısı", "Buz Pençe" };
        public static string BotAd(int n) => ADLAR[Math.Abs(n) % ADLAR.Length];

        public static List<TakimBirimi> BotTakim(int tur, double tohum, double guc = 0.5)
        {
            var R = new KutRng(tohum * 7919 + tur * 104729);
            int yuva = KutVeri.Yuva(tur);
            var soyAd = KutVeri.Soylar.Select(s => s.Id).ToArray();
            var sevilen = new[] { soyAd[(int)Math.Floor(R.Sonraki() * soyAd.Length)], soyAd[(int)Math.Floor(R.Sonraki() * soyAd.Length)] };
            var ol = KutVeri.KademeOlasilik(tur);
            Func<Kahraman> sec = () =>
            {
                double r = R.Sonraki(); int k = r < ol[0] ? 1 : r < ol[0] + ol[1] ? 2 : 3;
                var aday = KutVeri.Kahramanlar.Where(h => h.Kademe <= k).ToList();
                var agir = aday.Select(h => (h.Kademe == k ? 2 : 1) + (h.Soy.Any(s => sevilen.Contains(s)) ? 3 : 0)).ToList();
                double top = 0; foreach (var a in agir) top += a;
                double x = R.Sonraki() * top;
                for (int i = 0; i < aday.Count; i++) { x -= agir[i]; if (x <= 0) return aday[i]; }
                return aday[aday.Count - 1];
            };
            var takim = new List<TakimBirimi>(); var kullan = new HashSet<string>();
            int deneme = 0;
            while (takim.Count < yuva && deneme++ < 60)
            {
                var h = sec(); if (kullan.Contains(h.Id)) continue; kullan.Add(h.Id);
                int s = 1; double p2 = Math.Max(0, Math.Min(0.8, (tur - 2) * 0.09 + (guc - 0.5) * 0.3));
                if (R.Sonraki() < p2) s = 2;
                if (tur >= 9 && R.Sonraki() < 0.12 + (guc - 0.5) * 0.2) s = 3;
                var b = new TakimBirimi { H = h.Id, S = s };
                if (tur >= 4 && s == 1 && R.Sonraki() < 0.25)
                {
                    var f = KutVeri.Kahramanlar[(int)Math.Floor(R.Sonraki() * KutVeri.Kahramanlar.Length)];
                    if (f.Id != h.Id && f.Kademe <= Math.Max(1, (int)Math.Ceiling(tur / 3.0))) b.F = f.Id;
                }
                takim.Add(b);
            }
            return Yerlestir(takim);
        }

        /// <summary>Yakın dövüşçüler öne, menzilliler arkaya.</summary>
        public static List<TakimBirimi> Yerlestir(List<TakimBirimi> takim)
        {
            var on = takim.Where(b => KutVeri.KahramanBul(b.H).Menzil == 1); var arka = takim.Where(b => KutVeri.KahramanBul(b.H).Menzil > 1);
            var sira = on.Concat(arka).ToList();
            var onY = new List<int[]> { new[] { 1, 0 }, new[] { 0, 0 }, new[] { 2, 0 } };
            var arY = new List<int[]> { new[] { 1, 1 }, new[] { 0, 1 }, new[] { 2, 1 } };
            var yer = new List<TakimBirimi>();
            foreach (var b in sira)
            {
                var liste = KutVeri.KahramanBul(b.H).Menzil == 1 ? (onY.Count > 0 ? onY : arY) : (arY.Count > 0 ? arY : onY);
                var p = liste[0]; liste.RemoveAt(0);
                var k = b.Kopya(); k.X = p[0]; k.Y = p[1]; yer.Add(k);
            }
            return yer;
        }

        /// <summary>Takımı kısa metne çevirir: KUT1-&lt;base64(ad|h.s.f.x.y_…)&gt;.</summary>
        public static string Kodla(IList<TakimBirimi> takim, string ad = "")
        {
            var ham = string.Join("_", takim.Select(b => string.Join(".", KutVeri.KahramanSira(b.H), b.S, b.F != null ? KutVeri.KahramanSira(b.F) : -1, b.X, b.Y)));
            var a = ad ?? ""; if (a.Length > 14) a = a.Substring(0, 14);
            return "KUT1-" + Convert.ToBase64String(Encoding.UTF8.GetBytes(a + "|" + ham)).TrimEnd('=');
        }

        public static Rakip Coz(string kod)
        {
            try
            {
                var k = kod.Trim(); if (k.StartsWith("KUT1-")) k = k.Substring(5);
                while (k.Length % 4 != 0) k += "=";
                var ic = Encoding.UTF8.GetString(Convert.FromBase64String(k));
                var parca = ic.Split('|'); var ad = parca[0]; var ham = parca[1];
                var takim = ham.Split('_').Select(p =>
                {
                    var n = p.Split('.').Select(int.Parse).ToArray();
                    var b = new TakimBirimi { H = KutVeri.Kahramanlar[n[0]].Id, S = Math.Max(1, Math.Min(3, n[1])), X = n[3] % 3, Y = n[4] % 2 };
                    if (n[2] >= 0) b.F = KutVeri.Kahramanlar[n[2]].Id;
                    return b;
                }).Take(6).ToList();
                return new Rakip { Ad = ad, Takim = takim, Kaynak = "duello" };
            }
            catch { return null; }
        }

        /// <summary>Rakip bul: önce uzak havuz, yoksa kupaya göre güçlenen bot.</summary>
        public static Rakip RakipBul(int tur, int kupa, string oyuncu, double tohum, IHayaletHavuzu havuz = null)
        {
            if (havuz != null)
            {
                try { var r = havuz.Bul(tur, kupa, oyuncu); if (r != null && r.Takim != null && r.Takim.Count > 0) { r.Kaynak = "cevrimici"; return r; } } catch { }
            }
            double guc = Math.Max(0, Math.Min(1, 0.35 + kupa / 2000.0));
            return new Rakip { Ad = BotAd((int)(tohum + tur)), Takim = BotTakim(tur, tohum, guc), Kupa = kupa, Kaynak = "bot" };
        }
    }
}
