// Kut Arena rakip katmanı: kut/online.js'in C# karşılığı.
// Bot takım üretimi (tarayıcıyla aynı tohum → aynı takım), 4×3 yerleştirme ve düello kodu (KUT2-…, eski KUT1- de çözülür; iki sürüm birbirinin kodunu çözer).
// Uzak hayalet havuzu (Firebase vb.) IHayaletHavuzu arayüzüyle takılır.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Kut
{
    public sealed class Rakip { public string Ad; public List<TakimBirimi> Takim; public int Kupa; public string Kaynak; public int Seviye; }

    /// <summary>Çevrimiçi havuz: her tur sonunda takım fotoğrafı bırakılır; rakip aynı tur ve benzer kupadan çekilir.</summary>
    public interface IHayaletHavuzu
    {
        /// <param name="mod">"arena" (seviyeli) ya da "hizli" (Hızlı Maç); havuzlar ayrı tutulur.</param>
        void Birak(int tur, int kupa, string oyuncu, string ad, List<TakimBirimi> takim, string mod = "hizli");
        /// <summary>Uygun kayıt yoksa null döner (o zaman bot kullanılır).</summary>
        Rakip Bul(int tur, int kupa, string oyuncu, string mod = "hizli");
    }

    public static class KutHayalet
    {
        static readonly string[] ADLAR = { "Kara Bulut", "Ak Doğan", "Demir Yay", "Mavi Kıvılcım", "Yalın Kılıç", "Gece Rüzgârı", "Taş Yürek", "Ay Kaya", "Sessiz Ok", "Kor Göz", "Bulut Avcısı", "Buz Pençe" };
        public static string BotAd(int n) => ADLAR[Math.Abs(n) % ADLAR.Length];

        /// <summary>Kademe zarı: olasılık dizisinin uzunluğu kadar kademe. r &lt; ol[0] → 1, r &lt; ol[0]+ol[1] → 2 …</summary>
        public static int KademeZar(double[] ol, double r) { int k = 1; double top = ol[0]; while (k < ol.Length && r >= top) { top += ol[k]; k++; } return k; }

        /// <summary>Seviyeli maçta botun seviyesi (r = 0'dan başlayan tur sırası). online.js botSeviye ile aynı.</summary>
        public static int BotSeviye(int r) => r < 1 ? 2 : r < 5 ? 3 : r < 9 ? 4 : r < 12 ? 5 : r < 19 ? 6 : r < 26 ? 7 : 8;

        /// <param name="sv">0: Hızlı Maç (takım boyu ve dükkân olasılığı tura bağlı). &gt;0: takım boyu = seviye, olasılık seviyeye bağlı.</param>
        public static List<TakimBirimi> BotTakim(int tur, double tohum, double guc = 0.5, int sv = 0)
        {
            var R = new KutRng(tohum * 7919 + tur * 104729);
            int yuva = sv > 0 ? KutVeri.TakimBoyutu(sv) : KutVeri.Hizli.Yuva(tur);
            var soyAd = KutVeri.Soylar.Select(s => s.Id).ToArray();
            var sevilen = new[] { soyAd[(int)Math.Floor(R.Sonraki() * soyAd.Length)], soyAd[(int)Math.Floor(R.Sonraki() * soyAd.Length)] };
            var ol = sv > 0 ? KutVeri.KademeOlasilik(sv) : KutVeri.Hizli.KademeOlasilik(tur);
            Func<Kahraman> sec = () =>
            {
                int k = KademeZar(ol, R.Sonraki());
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

        static readonly int[] SUTUN = { 1, 2, 0, 3 };
        static readonly int[][] SIRA_TERCIH = { null, new[] { 0, 1, 2 }, new[] { 1, 2, 0 }, new[] { 2, 1, 0 } };
        /// <summary>Tahta 4×3: yakın dövüşçüler ön sıraya, menzil 2 ortaya, menzil 3 arkaya; sıra dolunca bir sonrakine. Sütun sırası 1, 2, 0, 3.
        /// Dönen sıra: önce yakın dövüşçüler, sonra menzil 2, sonra menzil 3.</summary>
        public static List<TakimBirimi> Yerlestir(List<TakimBirimi> takim)
        {
            Func<TakimBirimi, int> mz = b => Math.Min(3, KutVeri.KahramanBul(b.H).Menzil);
            var sira = takim.Where(b => mz(b) == 1).Concat(takim.Where(b => mz(b) == 2)).Concat(takim.Where(b => mz(b) == 3)).ToList();
            var dolu = new int[3]; var yer = new List<TakimBirimi>();
            foreach (var b in sira)
                foreach (int y in SIRA_TERCIH[mz(b)])
                    if (dolu[y] < KutVeri.TahtaSutun) { var k = b.Kopya(); k.X = SUTUN[dolu[y]++]; k.Y = y; yer.Add(k); break; }
            return yer;
        }

        /// <summary>Takımı kısa metne çevirir: KUT2-&lt;base64(ad|h.s.f.x.y.e1,e2,e3_…)&gt;.</summary>
        public static string Kodla(IList<TakimBirimi> takim, string ad = "")
        {
            var ham = string.Join("_", takim.Select(b => string.Join(".", KutVeri.KahramanSira(b.H), b.S, b.F != null ? KutVeri.KahramanSira(b.F) : -1, b.X, b.Y,
                string.Join(",", b.E ?? new List<string>()))));
            var a = ad ?? ""; if (a.Length > 14) a = a.Substring(0, 14);
            return "KUT2-" + Convert.ToBase64String(Encoding.UTF8.GetBytes(a + "|" + ham)).TrimEnd('=');
        }

        static readonly UTF8Encoding KatiUtf8 = new UTF8Encoding(false, true);
        static readonly System.Text.RegularExpressions.Regex TamSayi = new System.Text.RegularExpressions.Regex("^-?[0-9]{1,6}\\z");

        /// <summary>KUT2- ve eski KUT1- (3×2 tahta: x aynen, arka sıra → y 2, eşya yok) kodlarını çözer. Bozuksa null.</summary>
        public static Rakip Coz(string kod)
        {
            try
            {
                var k = kod.Trim(); bool v2 = k.StartsWith("KUT2-");
                if (k.StartsWith("KUT1-") || v2) k = k.Substring(5);
                while (k.Length % 4 != 0) k += "=";
                var ic = KatiUtf8.GetString(Convert.FromBase64String(k)); // bozuk UTF-8 → hata (JS decodeURIComponent gibi)
                var parca = ic.Split('|'); var ad = parca[0]; var ham = parca[1];
                var takim = ham.Split('_').Select(p =>
                {
                    var pp = p.Split('.');
                    // ilk beş alan tam sayı olmalı (online.js coz ile aynı kural: isteğe bağlı eksi, 1–6 rakam); konum eksi olamaz
                    if (pp.Length < 5 || !pp.Take(5).All(z => TamSayi.IsMatch(z))) throw new FormatException("bozuk");
                    var n = pp.Take(5).Select(z => int.Parse(z, System.Globalization.CultureInfo.InvariantCulture)).ToArray();
                    if (n[0] < 0 || n[0] >= KutVeri.Kahramanlar.Length || n[3] < 0 || n[4] < 0) throw new FormatException("bozuk");
                    var b = v2 ? new TakimBirimi { H = KutVeri.Kahramanlar[n[0]].Id, S = Math.Max(1, Math.Min(3, n[1])), X = n[3] % KutVeri.TahtaSutun, Y = n[4] % KutVeri.TahtaSira }
                               : new TakimBirimi { H = KutVeri.Kahramanlar[n[0]].Id, S = Math.Max(1, Math.Min(3, n[1])), X = n[3] % 3, Y = (n[4] % 2) * 2 };
                    if (n[2] >= 0) b.F = KutVeri.Kahramanlar[n[2]].Id;
                    if (v2 && pp.Length > 5 && pp[5].Length > 0) b.E = pp[5].Split(',').Where(e => e.Length > 0).Take(3).ToList();
                    return b;
                }).ToList().Take(v2 ? KutVeri.TakimTavan : 6).ToList(); // önce hepsi çözülür (JS gibi): fazladan bozuk parça da kodu bozar
                return new Rakip { Ad = ad, Takim = takim, Kaynak = "duello" };
            }
            catch { return null; }
        }

        /// <summary>Rakip bul: önce uzak havuz, yoksa kupaya göre güçlenen bot.</summary>
        /// <param name="sv">Seviyeli maçta rakibin seviyesi (0: Hızlı Maç).</param>
        public static Rakip RakipBul(int tur, int kupa, string oyuncu, double tohum, IHayaletHavuzu havuz = null, int sv = 0)
        {
            if (havuz != null)
            {
                try { var r = havuz.Bul(tur, kupa, oyuncu, sv > 0 ? "arena" : "hizli"); if (r != null && r.Takim != null && r.Takim.Count > 0) { r.Kaynak = "cevrimici"; return r; } } catch { }
            }
            double guc = Math.Max(0, Math.Min(1, 0.35 + kupa / 2000.0));
            return new Rakip { Ad = BotAd((int)(tohum + tur)), Takim = BotTakim(tur, tohum, guc, sv), Kupa = kupa, Kaynak = "bot", Seviye = sv };
        }
    }
}
