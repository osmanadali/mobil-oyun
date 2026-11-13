// OTOMATİK ÜRETİLDİ: kut/tools/csharp_veri.cjs (kaynak: kut/data.js). Elle düzenleme.
using System.Collections.Generic;

namespace Kut
{
    public sealed class SoyBilgi { public string Id, Ad, Emoji; public int[] Esik; public string[] Aciklama; }
    public sealed class Kahraman { public string Id, Ad, Emoji, Renk, Yetenek, Pasif; public int Kademe, Menzil; public string[] Soy; public double Can, Atk, As, Mana; }
    public sealed class Metin { public string Ad, M; }
    public sealed class Alamet { public string Id, Ad, Emoji, M; }

    public static class KutVeri
    {
        public static readonly SoyBilgi[] Soylar = {
            new SoyBilgi { Id = "gok", Ad = "Gök", Emoji = "☁️", Esik = new[] { 2, 4 }, Aciklama = new[] { "+%15 saldırı hızı", "+%35 saldırı hızı" } },
            new SoyBilgi { Id = "yer", Ad = "Yer", Emoji = "⛰️", Esik = new[] { 2, 4 }, Aciklama = new[] { "+150 can", "+400 can" } },
            new SoyBilgi { Id = "ates", Ad = "Od", Emoji = "🔥", Esik = new[] { 2, 4 }, Aciklama = new[] { "Vuruşlar 2 sn yakar (12/sn)", "Vuruşlar 3 sn yakar (28/sn)" } },
            new SoyBilgi { Id = "su", Ad = "Su", Emoji = "💧", Esik = new[] { 2, 4 }, Aciklama = new[] { "Saniyede %2 can yeniler", "Saniyede %5 can yeniler" } },
            new SoyBilgi { Id = "kis", Ad = "Ayaz", Emoji = "❄️", Esik = new[] { 2, 4 }, Aciklama = new[] { "Düşman saldırı hızı -%15", "Düşman saldırı hızı -%30" } },
            new SoyBilgi { Id = "karanlik", Ad = "Karanlık", Emoji = "🌑", Esik = new[] { 2, 4 }, Aciklama = new[] { "Canı yarının altındakine +%20 hasar", "+%50 hasar" } },
            new SoyBilgi { Id = "dev", Ad = "Dev", Emoji = "🗿", Esik = new[] { 2, 4 }, Aciklama = new[] { "Alınan hasar -%12", "Alınan hasar -%28" } },
            new SoyBilgi { Id = "avci", Ad = "Avcı", Emoji = "🏹", Esik = new[] { 2, 4 }, Aciklama = new[] { "+%20 hasar", "+%45 hasar" } },
            new SoyBilgi { Id = "bilge", Ad = "Bilge", Emoji = "📜", Esik = new[] { 2, 4 }, Aciklama = new[] { "+%30 mana kazanımı", "+%70 mana kazanımı" } },
            new SoyBilgi { Id = "atli", Ad = "Çevik", Emoji = "🐾", Esik = new[] { 2, 4 }, Aciklama = new[] { "İlk 4 sn +%40 saldırı hızı", "İlk 4 sn +%90 saldırı hızı" } },
        };

        public static readonly Kahraman[] Kahramanlar = {
            new Kahraman { Id = "golem", Ad = "Kaya Golemi", Emoji = "🪨", Renk = "#a3775a", Kademe = 1, Soy = new[] { "yer", "dev" }, Can = 820.0, Atk = 48.0, As = 0.65, Menzil = 1, Mana = 80.0, Yetenek = "tasFirlat", Pasif = "tasDeri" },
            new Kahraman { Id = "kurt", Ad = "Kristal Kurt", Emoji = "🐺", Renk = "#8c97a8", Kademe = 1, Soy = new[] { "atli", "avci" }, Can = 520.0, Atk = 52.0, As = 0.95, Menzil = 1, Mana = 60.0, Yetenek = "uluma", Pasif = "suru" },
            new Kahraman { Id = "kurbaga", Ad = "Davulcu Kurbağa", Emoji = "🐸", Renk = "#c9a24a", Kademe = 1, Soy = new[] { "bilge", "gok" }, Can = 500.0, Atk = 38.0, As = 0.7, Menzil = 3, Mana = 60.0, Yetenek = "davul", Pasif = "ruhBagi" },
            new Kahraman { Id = "yarasa", Ad = "Sis Yarasası", Emoji = "🦇", Renk = "#b4435a", Kademe = 1, Soy = new[] { "karanlik", "su" }, Can = 500.0, Atk = 50.0, As = 0.85, Menzil = 1, Mana = 70.0, Yetenek = "ruhEmme", Pasif = "canEmici" },
            new Kahraman { Id = "ruzgar", Ad = "Rüzgâr Ruhu", Emoji = "🌪️", Renk = "#7fc8c0", Kademe = 1, Soy = new[] { "gok", "avci" }, Can = 430.0, Atk = 44.0, As = 0.9, Menzil = 3, Mana = 80.0, Yetenek = "kasirga", Pasif = "kacis" },
            new Kahraman { Id = "koc", Ad = "Dağ Koçu", Emoji = "🐏", Renk = "#d06a3c", Kademe = 2, Soy = new[] { "yer", "atli" }, Can = 680.0, Atk = 62.0, As = 0.85, Menzil = 1, Mana = 90.0, Yetenek = "deliOfke", Pasif = "deliCesaret" },
            new Kahraman { Id = "yilan", Ad = "Zümrüt Yılan", Emoji = "🐍", Renk = "#5aa86a", Kademe = 2, Soy = new[] { "su", "bilge" }, Can = 560.0, Atk = 40.0, As = 0.75, Menzil = 3, Mana = 80.0, Yetenek = "zehir", Pasif = "zehirDis" },
            new Kahraman { Id = "kaplumbaga", Ad = "Buz Kaplumbağası", Emoji = "🐢", Renk = "#7aa6d6", Kademe = 2, Soy = new[] { "kis", "dev" }, Can = 860.0, Atk = 46.0, As = 0.6, Menzil = 1, Mana = 90.0, Yetenek = "buzNefes", Pasif = "soguk" },
            new Kahraman { Id = "semender", Ad = "Kor Semenderi", Emoji = "🦎", Renk = "#ef8a3a", Kademe = 2, Soy = new[] { "ates", "su" }, Can = 600.0, Atk = 42.0, As = 0.75, Menzil = 2, Mana = 90.0, Yetenek = "ocak", Pasif = "sicakKalp" },
            new Kahraman { Id = "bulutat", Ad = "Bulut Atı", Emoji = "🦄", Renk = "#e7d9b5", Kademe = 2, Soy = new[] { "gok", "atli" }, Can = 540.0, Atk = 58.0, As = 1.0, Menzil = 1, Mana = 70.0, Yetenek = "dortnal", Pasif = "ruzgar" },
            new Kahraman { Id = "kugu", Ad = "Işık Kuğusu", Emoji = "🦢", Renk = "#f1e7a6", Kademe = 3, Soy = new[] { "gok", "su" }, Can = 640.0, Atk = 38.0, As = 0.7, Menzil = 3, Mana = 90.0, Yetenek = "kanat", Pasif = "ana" },
            new Kahraman { Id = "ayi", Ad = "Gece Ayısı", Emoji = "🐻", Renk = "#5b3f7a", Kademe = 3, Soy = new[] { "karanlik", "dev" }, Can = 920.0, Atk = 60.0, As = 0.7, Menzil = 1, Mana = 100.0, Yetenek = "karaGolge", Pasif = "karanlikPay" },
            new Kahraman { Id = "anka", Ad = "Anka", Emoji = "🐦‍🔥", Renk = "#ff6a3d", Kademe = 3, Soy = new[] { "ates", "gok" }, Can = 600.0, Atk = 56.0, As = 0.8, Menzil = 3, Mana = 100.0, Yetenek = "kulDogus", Pasif = "yenidenDogus" },
            new Kahraman { Id = "baykus", Ad = "Ayaz Baykuşu", Emoji = "🦉", Renk = "#bfe0ff", Kademe = 3, Soy = new[] { "kis", "bilge" }, Can = 560.0, Atk = 42.0, As = 0.7, Menzil = 3, Mana = 100.0, Yetenek = "ayaz", Pasif = "kisNefesi" },
            new Kahraman { Id = "tilki", Ad = "Gölge Tilki", Emoji = "🦊", Renk = "#4a5578", Kademe = 3, Soy = new[] { "karanlik", "avci" }, Can = 520.0, Atk = 70.0, As = 0.85, Menzil = 3, Mana = 80.0, Yetenek = "golgeOk", Pasif = "avKoku" },
            new Kahraman { Id = "ejder", Ad = "Fırtına Ejderi", Emoji = "🐉", Renk = "#ffd84a", Kademe = 3, Soy = new[] { "ates", "bilge" }, Can = 560.0, Atk = 46.0, As = 0.75, Menzil = 3, Mana = 110.0, Yetenek = "yildirim", Pasif = "gokGurultu" },
        };

        public static readonly Dictionary<string, Metin> Yetenekler = new Dictionary<string, Metin> {
            { "tasFirlat", new Metin { Ad = "Kaya Fırlat", M = "Hedefe 200 hasar, 1,5 sn sersemletir." } },
            { "uluma", new Metin { Ad = "Uluma", M = "Kendisi ve 2 hücredeki dostlar 4 sn +%45 saldırı hızı." } },
            { "davul", new Metin { Ad = "Savaş Davulu", M = "Bütün dostlar 4 sn +%30 hasar." } },
            { "ruhEmme", new Metin { Ad = "Can Emme", M = "Hedefe 170 hasar, o kadar can kazanır." } },
            { "kasirga", new Metin { Ad = "Kasırga", M = "Hedef çevresindekilere 110 hasar, onları 1,5 hücre iter." } },
            { "deliOfke", new Metin { Ad = "Boynuz Öfkesi", M = "Sonraki 3 vuruşu 2 kat, canının %20’sini yeniler." } },
            { "zehir", new Metin { Ad = "Zümrüt Zehri", M = "Hedefi 4 sn zehirler (55/sn), en yaralı dosta 160 can." } },
            { "buzNefes", new Metin { Ad = "Buz Nefesi", M = "Hedef çevresine 120 hasar, 1,2 sn dondurur." } },
            { "ocak", new Metin { Ad = "Kor Halkası", M = "2 hücredeki düşmanları 4 sn yakar (40/sn), dostlara 110 can." } },
            { "dortnal", new Metin { Ad = "Bulut Hücumu", M = "En arka düşmana atılır, 190 hasar." } },
            { "kanat", new Metin { Ad = "Işık Kanadı", M = "Bütün dostlara 140 kalkan." } },
            { "karaGolge", new Metin { Ad = "Kara Gölge", M = "En güçlü düşmana 140 hasar, 5 sn -%45 hasar." } },
            { "kulDogus", new Metin { Ad = "Kül Yağmuru", M = "Hedef çevresine 170 hasar ve 3 sn yanık." } },
            { "ayaz", new Metin { Ad = "Ayaz", M = "Bütün düşmanlara 70 hasar, 3 sn -%40 saldırı hızı." } },
            { "golgeOk", new Metin { Ad = "Gölge Oku", M = "Canı en az düşmana 320 hasar." } },
            { "yildirim", new Metin { Ad = "Yıldırım", M = "3 rastgele düşmana 150 hasar, 0,6 sn sersemletir." } },
        };

        public static readonly Dictionary<string, Metin> Pasifler = new Dictionary<string, Metin> {
            { "tasDeri", new Metin { Ad = "Taş Deri", M = "Alınan hasar -%20." } },
            { "suru", new Metin { Ad = "Sürü", M = "Yaşayan her dost için +%6 hasar." } },
            { "ruhBagi", new Metin { Ad = "Ruh Bağı", M = "Bir dost ölünce 35 mana kazanır." } },
            { "canEmici", new Metin { Ad = "Can Emici", M = "Verdiği hasarın %20’si kadar can kazanır." } },
            { "kacis", new Metin { Ad = "Yel Gibi", M = "Vuruşların %25’inden kaçar." } },
            { "deliCesaret", new Metin { Ad = "Gözü Kara", M = "Canı yarının altındayken +%50 hasar." } },
            { "zehirDis", new Metin { Ad = "Zehirli Diş", M = "Vuruşları 3 sn zehirler (18/sn)." } },
            { "soguk", new Metin { Ad = "Soğuk Dokunuş", M = "Vuruşları 2 sn -%20 saldırı hızı verir." } },
            { "sicakKalp", new Metin { Ad = "Sıcak Kalp", M = "Saniyede %3 can yeniler." } },
            { "ruzgar", new Metin { Ad = "Rüzgâr Ayak", M = "İlk 5 sn +%35 saldırı hızı." } },
            { "ana", new Metin { Ad = "Koruyucu Tüy", M = "Savaş başında komşu dostlara 90 kalkan." } },
            { "karanlikPay", new Metin { Ad = "Karanlık Pay", M = "Her düşman ölümünde +%12 hasar (birikir)." } },
            { "yenidenDogus", new Metin { Ad = "Yeniden Doğuş", M = "İlk ölümde %40 canla dirilir." } },
            { "kisNefesi", new Metin { Ad = "Kış Nefesi", M = "Savaşa %50 mana ile başlar." } },
            { "avKoku", new Metin { Ad = "Av Kokusu", M = "Canı %30’un altındaki düşmana 2 kat hasar." } },
            { "gokGurultu", new Metin { Ad = "Gök Gürültüsü", M = "Her 4. vuruş yakındaki 2 düşmana sıçrar." } },
        };

        public static readonly Alamet[] Alametler = {
            new Alamet { Id = "yok", Ad = "Durgun Gök", Emoji = "🌤️", M = "Bu tur özel bir şey yok." },
            new Alamet { Id = "kanAyi", Ad = "Kan Ayı", Emoji = "🌕", M = "Herkes +%20 hasar verir." },
            new Alamet { Id = "sis", Ad = "Sis", Emoji = "🌫️", M = "Menzilliler -1 menzil." },
            new Alamet { Id = "tipi", Ad = "Tipi", Emoji = "🌨️", M = "Herkes -%20 saldırı hızı; Ayaz soyu etkilenmez." },
            new Alamet { Id = "kutYagmur", Ad = "Kut Yağmuru", Emoji = "✨", M = "Herkes savaşa %40 mana ile başlar." },
            new Alamet { Id = "pazar", Ad = "Bereketli Pazar", Emoji = "🪙", M = "Bu tur +2 altın." },
            new Alamet { Id = "tutulma", Ad = "Tutulma", Emoji = "🌒", M = "Karanlık soyu +%30 can." },
            new Alamet { Id = "yaz", Ad = "Yaz Sıcağı", Emoji = "☀️", M = "Od soyu 2 kat yakar; Ayaz soyu -%15 can." },
        };

        // Ekonomi ve maç sabitleri (data.js KURAL)
        public const int AltinTur = 10, Yenile = 1, Kaynastir = 3, SatisIade = 1, Dukkan = 5, Yedek = 4, BaslangicCan = 5, ZaferHedef = 7;
        public const double SavasSuresi = 30.0;
        public static readonly double[] YildizCarpan = { 0.0, 1.0, 1.8, 3.0 };
        static readonly int[] yuvaTablo = { 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6 };
        public static int Yuva(int tur) => yuvaTablo[System.Math.Min(System.Math.Max(tur, 1), yuvaTablo.Length) - 1];
        static readonly double[][] olasilikTablo = { new[] { 1.0, 0.0, 0.0 }, new[] { 1.0, 0.0, 0.0 }, new[] { 0.65, 0.35, 0.0 }, new[] { 0.65, 0.35, 0.0 }, new[] { 0.45, 0.4, 0.15 }, new[] { 0.45, 0.4, 0.15 }, new[] { 0.3, 0.4, 0.3 }, new[] { 0.3, 0.4, 0.3 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 } };
        public static double[] KademeOlasilik(int tur) => olasilikTablo[System.Math.Min(System.Math.Max(tur, 1), olasilikTablo.Length) - 1];

        static Dictionary<string, Kahraman> _kahraman;
        public static Kahraman KahramanBul(string id)
        {
            if (_kahraman == null) { _kahraman = new Dictionary<string, Kahraman>(); foreach (var h in Kahramanlar) _kahraman[h.Id] = h; }
            return _kahraman[id];
        }
        public static int KahramanSira(string id) { for (int i = 0; i < Kahramanlar.Length; i++) if (Kahramanlar[i].Id == id) return i; return -1; }
        public static SoyBilgi SoyBul(string id) { foreach (var x in Soylar) if (x.Id == id) return x; return null; }
    }
}
