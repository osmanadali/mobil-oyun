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

    /// <summary>Kayıttaki Kut dokunuşu: birim sırası ve saniye.</summary>
    public sealed class KutDokunus { public int I; public double T; }
    /// <summary>Maç izinin bir turu (OYNANIS_DERINLIK.md 4.7): {r, seviye, takim (x, y, e), yedek, armagan, kut}.</summary>
    public sealed class IzTur
    {
        public int R, Seviye; public List<TakimBirimi> Takim = new List<TakimBirimi>(); public List<TakimBirimi> Yedek = new List<TakimBirimi>();
        public List<string> Armagan = new List<string>(); public KutDokunus Kut;
    }
    /// <summary>Bir oyuncunun maç izi (havuza yazılır). Sira: maç sonundaki sıra (0: bilinmiyor); Surum: oyun sürümü (null: herhangi).</summary>
    public sealed class MacIzi { public string MacId, Oyuncu, Ad; public int Kupa, Sira; public int? Surum; public List<IzTur> Turlar = new List<IzTur>(); }
    /// <summary>Lobideki bir hayaletin izi: kayıtlı (Turlar) ya da bot (Bot = true, BotTohum, BotGuc).</summary>
    public sealed class LobiIz { public string Ad, Oyuncu; public int Kupa; public List<IzTur> Turlar; public bool Bot; public double BotTohum, BotGuc; }
    /// <summary>Maç izi havuzu (uzak). Uygun iz yoksa LobiBul boş liste döner.</summary>
    public interface IIzHavuzu
    {
        void IzYaz(MacIzi iz);
        List<MacIzi> LobiBul(int kupa, string oyuncu, int adet, int? surum);
    }

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

        /// <summary>Bot eşyaları (online.js botEsya): r'den önceki turların eşya ganimeti, botun tohumuyla. Bileşenler ikişer birleşir;
        /// tam eşyalar, Kut Taşı ve artan bileşen en güçlü (kademe × yıldız) birime yığılır, 3'e dolunca sonrakine.</summary>
        public static List<TakimBirimi> BotEsya(IList<TakimBirimi> takim, int r, double tohum)
        {
            var bil = new List<string>(); var diger = new List<string>();
            for (int rr = 0; rr < r; rr++) foreach (var id in KutLobi.GanimetEsya(rr, new KutRng(tohum * 977 + rr * 7919))) (KutVeri.EsyaBul(id).Tip == "bilesen" ? bil : diger).Add(id);
            var liste = new List<string>();
            for (int i = 0; i + 1 < bil.Count; i += 2) liste.Add(KutVeri.Tarif(bil[i], bil[i + 1]));
            foreach (var id in diger) if (id != "sokumTasi") liste.Add(id);
            if (bil.Count % 2 == 1) liste.Add(bil[bil.Count - 1]);
            Func<TakimBirimi, int> guc = b => KutVeri.KahramanBul(b.H).Kademe * (b.S == 0 ? 1 : b.S);
            var sira = Enumerable.Range(0, takim.Count).OrderByDescending(i => guc(takim[i])).ToList();
            var outp = takim.Select(b => b.Kopya()).ToList();
            foreach (var id in liste) foreach (int i in sira) { var t = KutLobi.EsyaTak(outp[i], id); if (t != null) { outp[i].E = t.E; break; } }
            return outp;
        }

        // ── Bot izi (bölüm 4.8; online.js izEgri / botIzTur / botIz / izTur / lobiIzler ile birebir) ──

        /// <summary>Eğri değeri: [seviye, ★2 oranı, ★3 oranı, tam eşya, kaynaşmış]; parça parça doğrusal, son satırdan sonra son eğimle, tavana kadar.</summary>
        public static double[] IzEgri(double r)
        {
            var E = KutVeri.BotIzEgri; var T = KutVeri.BotIzTavan; var outp = new double[E[0].Length - 1];
            int a = 0; while (a < E.Length - 2 && r >= E[a + 1][0]) a++;
            for (int c = 1; c < E[0].Length; c++)
            {
                double v = r <= E[0][0] ? E[0][c] : E[a][c] + (E[a + 1][c] - E[a][c]) * (r - E[a][0]) / (E[a + 1][0] - E[a][0]);
                if (v > T[c]) v = T[c]; if (v < 0) v = 0;
                outp[c - 1] = v;
            }
            return outp;
        }

        /// <summary>Eşyaları en güçlü (kademe × yıldız) birime yığar, 3'e dolunca sonrakine. Liste yerinde değişir.</summary>
        public static List<TakimBirimi> EsyaYig(List<TakimBirimi> outp, IEnumerable<string> liste)
        {
            Func<TakimBirimi, int> guc = b => KutVeri.KahramanBul(b.H).Kademe * (b.S == 0 ? 1 : b.S);
            var sira = Enumerable.Range(0, outp.Count).OrderByDescending(i => guc(outp[i])).ToList();
            foreach (var id in liste) foreach (int i in sira) { var t = KutLobi.EsyaTak(outp[i], id); if (t != null) { outp[i].E = t.E; break; } }
            return outp;
        }

        /// <summary>Bot izinin r. turu. guc 0–1: ★2 ve eşya sayısı × (0,8 + 0,4 × guc), eğride ± 2 tur kayma.</summary>
        public static IzTur BotIzTur(double tohum, double guc, int r)
        {
            var eg = IzEgri(Math.Max(0, r + (guc - 0.5) * KutVeri.BotIzGucTur)); double f = KutVeri.BotIzGucTaban + KutVeri.BotIzGucAdim * guc;
            int sv = Math.Max(KutVeri.SeviyeBaslangic, Math.Min(KutVeri.SeviyeTavan, (int)Math.Floor(eg[0])));
            var Rs = new KutRng(tohum * 7919 + 3); var soyAd = KutVeri.Soylar.Select(x => x.Id).ToArray();
            var sevilen = new[] { soyAd[(int)Math.Floor(Rs.Sonraki() * soyAd.Length)], soyAd[(int)Math.Floor(Rs.Sonraki() * soyAd.Length)] };
            var R = new KutRng(tohum * 7919 + r * 104729.0 + 17); var ol = KutVeri.KademeOlasilik(sv);
            Func<Kahraman> sec = () =>
            {
                int k = KademeZar(ol, R.Sonraki());
                var aday = KutVeri.Kahramanlar.Where(h => h.Kademe <= k).ToList();
                var agir = aday.Select(h => (h.Kademe == k ? 2 : 1) + (h.Soy.Any(x => sevilen.Contains(x)) ? 3 : 0)).ToList();
                double top = 0; foreach (var w in agir) top += w;
                double x2 = R.Sonraki() * top;
                for (int i = 0; i < aday.Count; i++) { x2 -= agir[i]; if (x2 <= 0) return aday[i]; }
                return aday[aday.Count - 1];
            };
            var takim = new List<TakimBirimi>(); var kullan = new HashSet<string>(); int deneme = 0;
            while (takim.Count < KutVeri.TakimBoyutu(sv) && deneme++ < 60) { var h = sec(); if (kullan.Contains(h.Id)) continue; kullan.Add(h.Id); takim.Add(new TakimBirimi { H = h.Id, S = 1 }); }
            int n = takim.Count; Func<int, int> kd = i => KutVeri.KahramanBul(takim[i].H).Kademe;
            int n2 = Math.Min(n, (int)Math.Floor(n * eg[1] * f + 0.5)), n3 = Math.Min(n2, (int)Math.Floor(n * eg[2] + 0.5));
            var sira = Enumerable.Range(0, n).OrderBy(i => kd(i)).ToList();
            for (int k = 0; k < n2; k++) takim[sira[k]].S = k < n3 ? 3 : 2;
            int kay = (int)Math.Floor(eg[4] + 0.5); var fKul = new List<string>();
            for (int k = 0; k < kay && k < n; k++)
            {
                int j = sira[n - 1 - k];
                var aday = KutVeri.Kahramanlar.Where(h => !kullan.Contains(h.Id) && !fKul.Contains(h.Id) && h.Kademe <= kd(j)).ToList();
                if (aday.Count == 0) continue;
                var fh = aday[(int)Math.Floor(R.Sonraki() * aday.Count)]; takim[j].F = fh.Id; fKul.Add(fh.Id);
            }
            int tam = (int)Math.Floor(eg[3] * f + 0.5), bil = r < 1 ? 0 : tam == 0 ? Math.Min(KutVeri.BotIzBilesen, r) : 1;
            var liste = new List<string>();
            for (int k = 0; k < tam; k++) liste.Add(KutVeri.Esyalar[(int)Math.Floor(R.Sonraki() * KutVeri.Esyalar.Length)].Id);
            for (int k = 0; k < bil; k++) liste.Add(KutVeri.Bilesenler[(int)Math.Floor(R.Sonraki() * KutVeri.Bilesenler.Length)].Id);
            return new IzTur { R = r, Seviye = sv, Takim = Yerlestir(EsyaYig(takim, liste)), Armagan = KutLobi.BotArmagan(tohum, r) };
        }
        public static List<IzTur> BotIz(double tohum, double guc, int n = 40) => Enumerable.Range(0, n).Select(r => BotIzTur(tohum, guc, r)).ToList();

        /// <summary>Kayıtlı izin r. turu: r'ye kadarki en son tur (yoksa ilk tur). İz tükendiyse her ek tur ★'ı en düşük birim
        /// (eşitlikte en soldaki, sonra dizi sırası) bir ★ yükselir (en çok ★2); her bölüm değişiminde 1 tam eşya.</summary>
        public static IzTur IzTurAl(IList<IzTur> turlar, int r)
        {
            if (turlar == null || turlar.Count == 0) return null;
            IzTur son = null, ilk = turlar[0], enSon = turlar[0];
            foreach (var t in turlar) { if (t.R <= r && (son == null || t.R > son.R)) son = t; if (t.R < ilk.R) ilk = t; if (t.R > enSon.R) enSon = t; }
            if (son == null) son = ilk;
            var takim = son.Takim.Select(b => b.Kopya()).ToList();
            if (r > enSon.R)
            {
                Func<TakimBirimi, int> sy = b => b.S == 0 ? 1 : b.S;
                for (int k = 0; k < r - son.R; k++)
                {
                    int j = -1;
                    for (int i = 0; i < takim.Count; i++) { int s = sy(takim[i]); if (s >= 2) continue; if (j < 0 || s < sy(takim[j]) || (s == sy(takim[j]) && takim[i].X < takim[j].X)) j = i; }
                    if (j < 0) break; takim[j].S = sy(takim[j]) + 1;
                }
                int bf = KutLobi.TurPlan(r).Bolum - KutLobi.TurPlan(son.R).Bolum; var liste = new List<string>();
                for (int k = 0; k < bf; k++) liste.Add(KutVeri.Esyalar[(int)Math.Floor(new KutRng(son.R * 7919.0 + k * 104729.0 + 5).Sonraki() * KutVeri.Esyalar.Length)].Id);
                EsyaYig(takim, liste);
            }
            return new IzTur { R = r, Seviye = son.Seviye, Takim = takim, Yedek = son.Yedek ?? new List<TakimBirimi>(), Armagan = son.Armagan ?? new List<string>(), Kut = son.Kut };
        }

        /// <summary>Lobi için 7 iz: önce uygun kayıtlar (kendi izi değil, kupa ±150, aynı sürüm; oyuncu başına 1; ilk 4'e girmişler önde), sonra bot izi.</summary>
        public static List<LobiIz> LobiIzler(int kupa, double tohum, IList<MacIzi> kayitlar = null, string oyuncu = null, int? surum = null, int adet = KutVeri.LobiBoyut - 1)
        {
            var R = new KutRng(tohum * 13 + 7); var outp = new List<LobiIz>(); var gorulen = new List<string>();
            var uygun = (kayitlar ?? new List<MacIzi>()).Where(z => z != null && z.Turlar != null && z.Turlar.Count > 0 && (oyuncu == null || z.Oyuncu != oyuncu)
                && Math.Abs(z.Kupa - kupa) <= KutVeri.LobiEsles && (surum == null || z.Surum == surum)).ToList();
            Func<MacIzi, bool> ilk4 = z => z.Sira > 0 && z.Sira <= 4;
            foreach (var z in uygun.Where(ilk4).Concat(uygun.Where(z => !ilk4(z))))
            {
                if (outp.Count >= adet) break;
                if (!string.IsNullOrEmpty(z.Oyuncu)) { if (gorulen.Contains(z.Oyuncu)) continue; gorulen.Add(z.Oyuncu); }
                outp.Add(new LobiIz { Ad = string.IsNullOrEmpty(z.Ad) ? "Hayalet" : z.Ad, Kupa = z.Kupa, Oyuncu = string.IsNullOrEmpty(z.Oyuncu) ? null : z.Oyuncu, Turlar = z.Turlar });
            }
            var adlar = ADLAR.ToArray();
            for (int i = adlar.Length - 1; i > 0; i--) { int j = (int)Math.Floor(R.Sonraki() * (i + 1)); var t = adlar[i]; adlar[i] = adlar[j]; adlar[j] = t; }
            double taban = Math.Max(0, Math.Min(1, 0.35 + kupa / 2000.0));
            for (int k = 0; outp.Count < adet; k++)
            {
                double guc = Math.Max(0, Math.Min(1, taban + (R.Sonraki() - 0.5) * 0.5)); double bt = Math.Floor(R.Sonraki() * 1e9);
                outp.Add(new LobiIz { Ad = adlar[k % adlar.Length], Kupa = kupa, Bot = true, BotTohum = bt, BotGuc = guc });
            }
            return outp;
        }

        /// <summary>Lobi kur: önce uzak iz havuzu, sonra verilen yerel izler, eksik kalan bot izi.</summary>
        public static List<LobiIz> LobiKur(int kupa, string oyuncu, double tohum, IIzHavuzu havuz = null, IList<MacIzi> yerel = null, int? surum = null)
        {
            var kayit = new List<MacIzi>();
            if (havuz != null) { try { var l = havuz.LobiBul(kupa, oyuncu, KutVeri.LobiBoyut - 1, surum); if (l != null) kayit.AddRange(l); } catch { } }
            if (yerel != null) kayit.AddRange(yerel);
            return LobiIzler(kupa, tohum, kayit, oyuncu, surum);
        }

        /// <summary>Rakip bul: önce uzak havuz, yoksa kupaya göre güçlenen bot.</summary>
        /// <param name="sv">Seviyeli maçta rakibin seviyesi (0: Hızlı Maç).</param>
        /// <param name="r">Seviyeli maçta tur sırası (0'dan): verilirse bot o tura kadarki eşya ganimetini taşır.</param>
        public static Rakip RakipBul(int tur, int kupa, string oyuncu, double tohum, IHayaletHavuzu havuz = null, int sv = 0, int r = -1)
        {
            if (havuz != null)
            {
                try { var uz = havuz.Bul(tur, kupa, oyuncu, sv > 0 ? "arena" : "hizli"); if (uz != null && uz.Takim != null && uz.Takim.Count > 0) { uz.Kaynak = "cevrimici"; return uz; } } catch { }
            }
            double guc = Math.Max(0, Math.Min(1, 0.35 + kupa / 2000.0));
            var takim = BotTakim(tur, tohum, guc, sv);
            return new Rakip { Ad = BotAd((int)(tohum + tur)), Takim = r > 0 ? BotEsya(takim, r, tohum) : takim, Kupa = kupa, Kaynak = "bot", Seviye = sv };
        }
    }
}
