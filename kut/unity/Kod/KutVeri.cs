// OTOMATİK ÜRETİLDİ: kut/tools/csharp_veri.cjs (kaynak: kut/data.js). Elle düzenleme.
using System.Collections.Generic;

namespace Kut
{
    public sealed class SoyBilgi { public string Id, Ad, Emoji; public int[] Esik; public string[] Aciklama; }
    public sealed class Kahraman { public string Id, Ad, Emoji, Renk, Yetenek, Pasif; public int Kademe, Menzil; public string[] Soy; public double Can, Atk, As, Mana; }
    public sealed class Metin { public string Ad, M; }
    /// <summary>Alamet: W lobide seçilme ağırlığı; Lobi yalnız seviyeli maçta çıkar (Hızlı Maç eski 8 alameti kullanır).</summary>
    public sealed class Alamet { public string Id, Ad, Emoji, M; public double W; public bool Lobi; }
    /// <summary>Kut Armağanı (bölüm 6): Kademe "kivilcim" | "alev" | "gunes"; Savas: motorda opt.armagan ile çalışır.</summary>
    public sealed class Armagan { public string Id, Ad, Kademe, Tur, M, Neden; public bool Savas; }
    /// <summary>Bileşen istatistiği (tam eşyada iki bileşeninki toplanır).</summary>
    public sealed class EsyaStat { public double Atk, As, Yg, Mana0, Azalt, Can, Cal, Kalkan0; }
    /// <summary>Eşya: Tip "bilesen" | "tam" | "ozel". Tam eşyada Tarif iki bileşen; Soy Mührü'nde Soy dolu.</summary>
    public sealed class Esya { public string Id, Ad, Simge, M, Tip, Soy; public string[] Tarif; public EsyaStat Stat; }
    /// <summary>Ganimet parçası (OYNANIS_DERINLIK.md 5.4). Tip: "bilesen" | "altin" | "kahraman" | "secim" | "zarf" | "esya"; Tur (seçimde): "bilesen" | "tam"; W: zarf ağırlığı.</summary>
    public sealed class GanimetParca { public string Tip, Tur, Id; public int N, Kademe; public double W; }
    /// <summary>Kervan seçenek satırı: kademe adayları ve yıldız.</summary>
    public sealed class KervanSatir { public int[] Kademe; public int S; }
    /// <summary>Bir bölümün Kervan planı: Kaynasmis (ilk seçenek hazır kaynaşmış, [kademe, kademe]) ya da null; Esya "bilesen" | "tam".</summary>
    public sealed class KervanPlan { public int[] Kaynasmis; public KervanSatir[] Secenek; public string Esya; }
    /// <summary>Canavar dalgasındaki birim: canavar kimliği ve tahta konumu (taraf 1).</summary>
    public sealed class DalgaBirim { public string H; public int X, Y; }

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

        /// <summary>Canavarlar (5.5): kademe 0, soy yok; yeteneksizlerin manası 9999. KahramanBul bunlara da bakar.</summary>
        public static readonly Kahraman[] Canavarlar = {
            new Kahraman { Id = "cakil", Ad = "Çakıl Kıpırı", Emoji = "🪨", Renk = "#9a8f80", Kademe = 0, Soy = new string[0], Can = 280.0, Atk = 22.0, As = 0.7, Menzil = 1, Mana = 9999.0, Yetenek = null, Pasif = null },
            new Kahraman { Id = "kirpi", Ad = "Diken Kirpi", Emoji = "🦔", Renk = "#a0764e", Kademe = 0, Soy = new string[0], Can = 420.0, Atk = 30.0, As = 0.8, Menzil = 1, Mana = 9999.0, Yetenek = null, Pasif = "dikenKirpi" },
            new Kahraman { Id = "tasKabuk", Ad = "Taş Kabuk", Emoji = "🐚", Renk = "#8c8c8c", Kademe = 0, Soy = new string[0], Can = 900.0, Atk = 28.0, As = 0.5, Menzil = 1, Mana = 9999.0, Yetenek = null, Pasif = null },
            new Kahraman { Id = "kumAkrebi", Ad = "Kum Akrebi", Emoji = "🦂", Renk = "#d4a95a", Kademe = 0, Soy = new string[0], Can = 700.0, Atk = 50.0, As = 0.8, Menzil = 1, Mana = 9999.0, Yetenek = null, Pasif = null },
            new Kahraman { Id = "anaAkrep", Ad = "Ana Akrep", Emoji = "🦂", Renk = "#b8742c", Kademe = 0, Soy = new string[0], Can = 1500.0, Atk = 70.0, As = 0.7, Menzil = 1, Mana = 80.0, Yetenek = "akrepZehir", Pasif = null },
            new Kahraman { Id = "gokBalinasi", Ad = "Gök Balinası", Emoji = "🐋", Renk = "#7fb8e6", Kademe = 0, Soy = new string[0], Can = 5200.0, Atk = 85.0, As = 0.5, Menzil = 3, Mana = 100.0, Yetenek = "balinaSarki", Pasif = null },
            new Kahraman { Id = "kadimBekci", Ad = "Kadim Bekçi", Emoji = "🗿", Renk = "#8a9a7a", Kademe = 0, Soy = new string[0], Can = 3200.0, Atk = 110.0, As = 0.6, Menzil = 1, Mana = 90.0, Yetenek = "bekciDarbe", Pasif = null },
            new Kahraman { Id = "yildizYiyen", Ad = "Yıldız Yiyen", Emoji = "🌌", Renk = "#5a3f9a", Kademe = 0, Soy = new string[0], Can = 9000.0, Atk = 140.0, As = 0.6, Menzil = 3, Mana = 100.0, Yetenek = "yildizYutan", Pasif = null },
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
            { "akrepZehir", new Metin { Ad = "Akrep Zehri", M = "Hedefi 4 sn zehirler (60/sn)." } },
            { "balinaSarki", new Metin { Ad = "Balina Şarkısı", M = "Bütün düşmanlara 110 hasar." } },
            { "bekciDarbe", new Metin { Ad = "Bekçi Darbesi", M = "Hedefe 250 hasar, 1,5 sn sersemletir." } },
            { "yildizYutan", new Metin { Ad = "Yıldız Yutan", M = "En yakın 3 düşmana 220 hasar." } },
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
            { "dikenKirpi", new Metin { Ad = "Diken Sırt", M = "Aldığı yakın vuruş hasarının %15’ini saldırgana geri verir." } },
        };

        /// <summary>Sekiz bileşen (OYNANIS_DERINLIK.md 5.2).</summary>
        public static readonly Esya[] Bilesenler = {
            new Esya { Id = "dis", Ad = "Diş", Simge = "b_dis", M = "+%15 saldırı", Tip = "bilesen", Stat = new EsyaStat { Atk = 0.15 } },
            new Esya { Id = "tuy", Ad = "Tüy", Simge = "b_tuy", M = "+%15 saldırı hızı", Tip = "bilesen", Stat = new EsyaStat { As = 0.15 } },
            new Esya { Id = "kor", Ad = "Kor", Simge = "b_kor", M = "+%20 yetenek gücü", Tip = "bilesen", Stat = new EsyaStat { Yg = 0.2 } },
            new Esya { Id = "ciy", Ad = "Çiy", Simge = "b_ciy", M = "Savaşa +15 mana ile başlar", Tip = "bilesen", Stat = new EsyaStat { Mana0 = 15.0 } },
            new Esya { Id = "kabuk", Ad = "Kabuk", Simge = "b_kabuk", M = "Alınan hasar −%10", Tip = "bilesen", Stat = new EsyaStat { Azalt = 0.1 } },
            new Esya { Id = "yurek", Ad = "Yürek", Simge = "b_yurek", M = "+180 can", Tip = "bilesen", Stat = new EsyaStat { Can = 180.0 } },
            new Esya { Id = "pul", Ad = "Pul", Simge = "b_pul", M = "%10 can çalma (vuruşta)", Tip = "bilesen", Stat = new EsyaStat { Cal = 0.1 } },
            new Esya { Id = "buz", Ad = "Buz", Simge = "b_buz", M = "Savaş başında 120 kalkan", Tip = "bilesen", Stat = new EsyaStat { Kalkan0 = 120.0 } },
        };
        /// <summary>36 tam eşya (5.3), tablo sırasıyla.</summary>
        public static readonly Esya[] Esyalar = {
            new Esya { Id = "yirticiPence", Ad = "Yırtıcı Pençe", Simge = "e01", M = "Her 3. vuruş, hedefin azami canının %8'i kadar ek hasar.", Tip = "tam", Tarif = new[] { "dis", "dis" } },
            new Esya { Id = "avCoskusu", Ad = "Av Coşkusu", Simge = "e02", M = "Takımından biri düşman öldürünce 3 sn +%40 saldırı hızı.", Tip = "tam", Tarif = new[] { "dis", "tuy" } },
            new Esya { Id = "kizginDis", Ad = "Kızgın Diş", Simge = "e03", M = "Yeteneğinin vurduğu her düşman 3 sn yanar: 30/sn ×★×YG.", Tip = "tam", Tarif = new[] { "dis", "kor" } },
            new Esya { Id = "keskinGoz", Ad = "Keskin Göz", Simge = "e04", M = "Vuruş başına mana 10 yerine 15.", Tip = "tam", Tarif = new[] { "dis", "ciy" } },
            new Esya { Id = "ofkeTilsimi", Ad = "Öfke Tılsımı", Simge = "e05", M = "Canı ilk kez yarının altına inince 5 sn +%35 saldırı ve −%20 alınan hasar.", Tip = "tam", Tarif = new[] { "dis", "kabuk" } },
            new Esya { Id = "devYumrugu", Ad = "Dev Yumruğu", Simge = "e06", M = "Vuruşlar, kendi azami canının %2'si kadar ek hasar verir.", Tip = "tam", Tarif = new[] { "dis", "yurek" } },
            new Esya { Id = "geceAvcisi", Ad = "Gece Avcısı", Simge = "e07", M = "Bir düşmanı öldürünce onun azami canının %20'si kadar iyileşir.", Tip = "tam", Tarif = new[] { "dis", "pul" } },
            new Esya { Id = "buzMizragi", Ad = "Buz Mızrağı", Simge = "e08", M = "Her yeni hedefe ilk vuruşu 0,8 sn sersemletir.", Tip = "tam", Tarif = new[] { "dis", "buz" } },
            new Esya { Id = "yelKanadi", Ad = "Yel Kanadı", Simge = "e09", M = "Her 5. vuruşun ardından anında bir vuruş daha yapar.", Tip = "tam", Tarif = new[] { "tuy", "tuy" } },
            new Esya { Id = "simsekTuyu", Ad = "Şimşek Tüyü", Simge = "e10", M = "Her 5. vuruşta hedefe en yakın 2 düşmana 70 ×★×YG yıldırım.", Tip = "tam", Tarif = new[] { "tuy", "kor" } },
            new Esya { Id = "ruzgarCani", Ad = "Rüzgâr Çanı", Simge = "e11", M = "Yetenek kullandıktan sonra 3 sn +%40 saldırı hızı.", Tip = "tam", Tarif = new[] { "tuy", "ciy" } },
            new Esya { Id = "sisPelerini", Ad = "Sis Pelerini", Simge = "e12", M = "Savaşın ilk 2,5 sn'si hedef alınamaz.", Tip = "tam", Tarif = new[] { "tuy", "kabuk" } },
            new Esya { Id = "bulutNali", Ad = "Bulut Nalı", Simge = "e13", M = "Hareket hızı +%50; savaştaki ilk vuruşu 2 kat.", Tip = "tam", Tarif = new[] { "tuy", "yurek" } },
            new Esya { Id = "geceKanadi", Ad = "Gece Kanadı", Simge = "e14", M = "Canı ilk kez %30'un altına inince 3 sn +%60 saldırı hızı ve %30 can çalma.", Tip = "tam", Tarif = new[] { "tuy", "pul" } },
            new Esya { Id = "karTanesi", Ad = "Kar Tanesi", Simge = "e15", M = "Vuruşları hedefe 2 sn −%15 saldırı hızı verir.", Tip = "tam", Tarif = new[] { "tuy", "buz" } },
            new Esya { Id = "kutOcagi", Ad = "Kut Ocağı", Simge = "e16", M = "Kut ile patlayan yeteneği ×1,5.", Tip = "tam", Tarif = new[] { "kor", "kor" } },
            new Esya { Id = "bilgeAsasi", Ad = "Bilge Asası", Simge = "e17", M = "Yeteneğin ardından 25 mana geri kazanır.", Tip = "tam", Tarif = new[] { "kor", "ciy" } },
            new Esya { Id = "tasMuhur", Ad = "Taş Mühür", Simge = "e18", M = "Her yetenek kullanımında kendine 120 ×★×YG kalkan.", Tip = "tam", Tarif = new[] { "kor", "kabuk" } },
            new Esya { Id = "canAtesi", Ad = "Can Ateşi", Simge = "e19", M = "Her yetenek, en yaralı dosta 100 ×★×YG iyileştirme de verir.", Tip = "tam", Tarif = new[] { "kor", "yurek" } },
            new Esya { Id = "golgeMurekkebi", Ad = "Gölge Mürekkebi", Simge = "e20", M = "Can çalma yetenek hasarına da uygulanır, yeteneklerde %25 olur.", Tip = "tam", Tarif = new[] { "kor", "pul" } },
            new Esya { Id = "ayazAsasi", Ad = "Ayaz Asası", Simge = "e21", M = "Yeteneğin vurduğu düşmanlar 2 sn −%30 saldırı hızı alır.", Tip = "tam", Tarif = new[] { "kor", "buz" } },
            new Esya { Id = "dolunayTestisi", Ad = "Dolunay Testisi", Simge = "e22", M = "Yetenek için gereken mana −%20.", Tip = "tam", Tarif = new[] { "ciy", "ciy" } },
            new Esya { Id = "sabirTasi", Ad = "Sabır Taşı", Simge = "e23", M = "Hasar alınca kazanılan mana iki katı.", Tip = "tam", Tarif = new[] { "ciy", "kabuk" } },
            new Esya { Id = "sifaPinari", Ad = "Şifa Pınarı", Simge = "e24", M = "Saniyede azami canının %2'si kadar iyileşir.", Tip = "tam", Tarif = new[] { "ciy", "yurek" } },
            new Esya { Id = "ruhTestisi", Ad = "Ruh Testisi", Simge = "e25", M = "Bir dost ölünce 30 mana kazanır ve azami canının %10'u kadar iyileşir.", Tip = "tam", Tarif = new[] { "ciy", "pul" } },
            new Esya { Id = "buzPinari", Ad = "Buz Pınarı", Simge = "e26", M = "Yetenek kullanınca 2 hücre içindeki dostlara 80 ×★ kalkan.", Tip = "tam", Tarif = new[] { "ciy", "buz" } },
            new Esya { Id = "anaKaya", Ad = "Ana Kaya", Simge = "e27", M = "Canı ilk kez %40'ın altına inince 2 sn hiç hasar almaz.", Tip = "tam", Tarif = new[] { "kabuk", "kabuk" } },
            new Esya { Id = "devKukremesi", Ad = "Dev Kükremesi", Simge = "e28", M = "Savaş başında 2,5 hücre içindeki düşmanlar 3 sn yalnız onu hedef alır.", Tip = "tam", Tarif = new[] { "kabuk", "yurek" } },
            new Esya { Id = "dikenKabuk", Ad = "Diken Kabuk", Simge = "e29", M = "Aldığı yakın vuruş hasarının %25'ini saldırgana geri verir.", Tip = "tam", Tarif = new[] { "kabuk", "pul" } },
            new Esya { Id = "buzulZirh", Ad = "Buzul Zırh", Simge = "e30", M = "Ona vuran 2 sn −%20 saldırı hızı alır.", Tip = "tam", Tarif = new[] { "kabuk", "buz" } },
            new Esya { Id = "uluKok", Ad = "Ulu Kök", Simge = "e31", M = "Savaş başında 2 hücre içindeki dostlara +150 azami can.", Tip = "tam", Tarif = new[] { "yurek", "yurek" } },
            new Esya { Id = "geceYuregi", Ad = "Gece Yüreği", Simge = "e32", M = "Ölünce 2 hücre içindeki dostlara kendi azami canının %25'i kadar kalkan.", Tip = "tam", Tarif = new[] { "yurek", "pul" } },
            new Esya { Id = "buzDagi", Ad = "Buz Dağı", Simge = "e33", M = "Savaş başında azami canının %20'si kadar ek kalkan.", Tip = "tam", Tarif = new[] { "yurek", "buz" } },
            new Esya { Id = "golgePelerini", Ad = "Gölge Pelerini", Simge = "e34", M = "Bir düşmanı öldürünce 1,5 sn hedef alınamaz.", Tip = "tam", Tarif = new[] { "pul", "pul" } },
            new Esya { Id = "karaBuz", Ad = "Kara Buz", Simge = "e35", M = "Canı ilk kez yarının altına inince 2 hücre içindeki düşmanlar 1 sn sersemler.", Tip = "tam", Tarif = new[] { "pul", "buz" } },
            new Esya { Id = "isikKalkani", Ad = "Işık Kalkanı", Simge = "e36", M = "Savaş başında 2 hücre içindeki dostlara 120 kalkan.", Tip = "tam", Tarif = new[] { "buz", "buz" } },
        };
        /// <summary>Özel eşyalar. Soy Mührü kimliği "muhur-<soy>".</summary>
        public static readonly Esya[] OzelEsyalar = {
            new Esya { Id = "sokumTasi", Ad = "Söküm Taşı", Simge = "o_sokum", M = "Bir kahramana bırakılınca bütün eşyalarını rafa geri indirir; taş harcanır.", Tip = "ozel" },
            new Esya { Id = "kutTasi", Ad = "Kut Taşı", Simge = "o_kuttasi", M = "Yuva kaplar. Taşıyana Kut verilince Kut Yankısı iki kat çalışır.", Tip = "ozel" },
            new Esya { Id = "muhur", Ad = "Soy Mührü", Simge = "o_muhur", M = "Yuva kaplar. Taşıyan bu soyu da taşır.", Tip = "ozel" },
        };

        public static readonly Alamet[] Alametler = {
            new Alamet { Id = "yok", Ad = "Durgun Gök", Emoji = "🌤️", M = "Bu tur özel bir şey yok.", W = 2.0, Lobi = false },
            new Alamet { Id = "kanAyi", Ad = "Kan Ayı", Emoji = "🌕", M = "Herkes +%20 hasar verir.", W = 1.0, Lobi = false },
            new Alamet { Id = "sis", Ad = "Sis", Emoji = "🌫️", M = "Menzilliler -1 menzil.", W = 1.0, Lobi = false },
            new Alamet { Id = "tipi", Ad = "Tipi", Emoji = "🌨️", M = "Herkes -%20 saldırı hızı; Ayaz soyu etkilenmez.", W = 1.0, Lobi = false },
            new Alamet { Id = "kutYagmur", Ad = "Kut Yağmuru", Emoji = "✨", M = "Herkes savaşa %40 mana ile başlar.", W = 1.0, Lobi = false },
            new Alamet { Id = "pazar", Ad = "Bereketli Pazar", Emoji = "🪙", M = "Bu tur +2 altın.", W = 1.0, Lobi = false },
            new Alamet { Id = "tutulma", Ad = "Tutulma", Emoji = "🌒", M = "Karanlık soyu +%30 can.", W = 1.0, Lobi = false },
            new Alamet { Id = "yaz", Ad = "Yaz Sıcağı", Emoji = "☀️", M = "Od soyu 2 kat yakar; Ayaz soyu -%15 can.", W = 1.0, Lobi = false },
            new Alamet { Id = "demirci", Ad = "Demirci Ateşi", Emoji = "⚒️", M = "Bu turun savaşını kazanan 1 rastgele bileşen alır.", W = 1.0, Lobi = true },
            new Alamet { Id = "gocMevsimi", Ad = "Göç Mevsimi", Emoji = "🍂", M = "Bu hazırlıkta ilk 2 yenileme bedava.", W = 1.0, Lobi = true },
            new Alamet { Id = "kutSessiz", Ad = "Kut Sessizliği", Emoji = "🌑", M = "Bu tur Kut yok; herkes savaşa %25 mana ile başlar.", W = 1.0, Lobi = true },
            new Alamet { Id = "uzunGolge", Ad = "Uzun Gölge", Emoji = "🌇", M = "Gün Batımı 20. yerine 12. saniyede başlar.", W = 1.0, Lobi = true },
        };

        /// <summary>Kut Armağanları (6.2), tablo sırasıyla.</summary>
        public static readonly Armagan[] Armaganlar = {
            new Armagan { Id = "cifteKut", Ad = "Çifte Kut", Kademe = "gunes", Tur = "Kut", Savas = true, M = "Savaş başına 2 Kut hakkı; ikincisi ilkinden en az 4 sn sonra kullanılabilir.", Neden = "Kut'u iki kez patlatmak istiyorsan." },
            new Armagan { Id = "uyanis", Ad = "Uyanış", Kademe = "kivilcim", Tur = "Kut", Savas = true, M = "Kut verilen birim savaş sonuna dek +%25 saldırı hızı kazanır.", Neden = "Kut'u vuruşçu bir kahramana veriyorsan." },
            new Armagan { Id = "kutMirasi", Ad = "Kut Mirası", Kademe = "alev", Tur = "Kut", Savas = true, M = "Kut verilen birim ölürse Kut hakkı bir kez geri gelir.", Neden = "Kut'u öndeki kahramana veriyorsan." },
            new Armagan { Id = "isikSutunu", Ad = "Işık Sütunu", Kademe = "alev", Tur = "Kut", Savas = true, M = "Kut, hedefin 2 hücre çevresindeki dostlara da azami manalarının %50'si kadar mana verir.", Neden = "Kahramanların sık diziliyse." },
            new Armagan { Id = "sakliKut", Ad = "Saklı Kut", Kademe = "kivilcim", Tur = "Kut", Savas = false, M = "Bir savaşta Kut'u kullanmazsan savaş sonunda 3 altın kazanırsın.", Neden = "Altın biriktiriyorsan." },
            new Armagan { Id = "ocakUstasi", Ad = "Ocak Ustası", Kademe = "kivilcim", Tur = "Kaynaştırma", Savas = false, M = "Kaynaştırma 1 altın. Hemen 1 bedava kaynaştırma hakkı.", Neden = "Çok kaynaştırmak istiyorsan." },
            new Armagan { Id = "kusursuzMelez", Ad = "Kusursuz Melez", Kademe = "alev", Tur = "Kaynaştırma", Savas = true, M = "Kaynaşmış birimlerin istatistik çarpanı ×1,15 yerine ×1,30.", Neden = "Takımında kaynaşmış kahramanlar varsa." },
            new Armagan { Id = "ucluKaynasma", Ad = "Üçlü Kaynaşma", Kademe = "gunes", Tur = "Kaynaştırma", Savas = false, M = "Kaynaşmış bir birim bir kez daha kaynaşabilir. Üçüncü kahramandan yalnız soyları ve +%10 istatistik gelir.", Neden = "Soy eşiklerini doldurmak istiyorsan." },
            new Armagan { Id = "soyMuhru", Ad = "Soy Mührü", Kademe = "alev", Tur = "Eşya", Savas = false, M = "Seçtiğin bir soyun Mührü'nü (özel eşya) ve 1 bileşen al.", Neden = "Bir soy eşiğine bir kahraman eksikse." },
            new Armagan { Id = "gozcuBaykusu", Ad = "Gözcü Baykuşu", Kademe = "kivilcim", Tur = "Önceden görme", Savas = false, M = "Sonraki 2 turun rakibini de görürsün. Hemen 4 altın.", Neden = "Takımını rakibe göre kuruyorsan." },
            new Armagan { Id = "karsiHamle", Ad = "Karşı Hamle", Kademe = "alev", Tur = "Önceden görme", Savas = true, M = "Rakibin en kalabalık soyu, senin takımına karşı savaşta bir eşik düşük sayılır.", Neden = "Rakiplerin tek soya yükleniyorsa." },
            new Armagan { Id = "alametBilgesi", Ad = "Alamet Bilgesi", Kademe = "kivilcim", Tur = "Alamet", Savas = false, M = "Sonraki 3 turun alametini görürsün. Her bölümde bir kez kendi savaşının alametini Durgun Gök yapabilirsin.", Neden = "Alametler takımını bozuyorsa." },
            new Armagan { Id = "kizilGok", Ad = "Kızıl Gök Çocuğu", Kademe = "alev", Tur = "Alamet", Savas = true, M = "Alametin Durgun Gök olmadığı turlarda takımın +%10 hasar verir.", Neden = "Alametler sık değişiyorsa." },
            new Armagan { Id = "bereketKupu", Ad = "Bereket Küpü", Kademe = "kivilcim", Tur = "Ekonomi", Savas = false, M = "Faiz tavanı 5'ten 7'ye çıkar (70 altında doyar).", Neden = "Altın biriktiriyorsan." },
            new Armagan { Id = "pazarDostu", Ad = "Pazar Dostu", Kademe = "kivilcim", Tur = "Ekonomi", Savas = false, M = "Her hazırlıkta ilk yenileme bedava.", Neden = "Aynı kahramanı arıyorsan." },
            new Armagan { Id = "altinYumurta", Ad = "Altın Yumurta", Kademe = "alev", Tur = "Ekonomi", Savas = false, M = "5 savaş turu sonra yumurta çatlar: 22 altın.", Neden = "Şimdi güçlüysen, sonrası için." },
            new Armagan { Id = "hizliBuyume", Ad = "Hızlı Büyüme", Kademe = "kivilcim", Tur = "Seviye", Savas = false, M = "Hemen +8 deneyim; deneyim alımı 4 yerine 3 altın.", Neden = "Erken seviye atlamak istiyorsan." },
            new Armagan { Id = "ganimetKesesi", Ad = "Ganimet Kesesi", Kademe = "kivilcim", Tur = "Eşya", Savas = false, M = "Hemen 2 rastgele bileşen.", Neden = "Eşya taşıyıcın hazırsa." },
            new Armagan { Id = "ustaDemirci", Ad = "Usta Demirci", Kademe = "gunes", Tur = "Eşya", Savas = false, M = "3 tam eşyadan birini seç, ayrıca 1 Söküm Taşı.", Neden = "Eşyalarını yeniden dağıtmak istiyorsan." },
            new Armagan { Id = "sonDirenis", Ad = "Son Direniş", Kademe = "alev", Tur = "Geri dönüş", Savas = true, M = "Canın 40'ın altındaysa takımın +%20 can kazanır. Seçince hemen 1 bileşen.", Neden = "Canın azaldıysa." },
        };
        public static Armagan ArmaganBul(string id) { foreach (var a in Armaganlar) if (a.Id == id) return a; return null; }

        // Ortak sabitler ve seviyeli maç (data.js KURAL)
        public const int SatisIade = 1, Dukkan = 5, Yedek = 7, TahtaSutun = 4, TahtaSira = 3, TakimTavan = 8;
        public const int CanBaslangic = 100, SeviyeBaslangic = 2, SeviyeTavan = 8, PasifXp = 2, XpBedel = 4, XpMiktar = 4;
        public const double SavasSuresi = 30.0;
        public static readonly double[] YildizCarpan = { 0.0, 1.0, 1.8, 3.0 };
        /// <summary>İndeks = mevcut seviye → sonraki seviyeye gereken deneyim.</summary>
        public static readonly int[] XpTablo = { 0, 0, 2, 6, 10, 20, 32, 48 };
        /// <summary>İndeks = yıldız → havuzdan tutulan kopya (★1 = 1, ★2 = 3, ★3 = 9).</summary>
        public static readonly int[] YildizKopya = { 0, 1, 3, 9 };
        /// <summary>İndeks = kademe → havuzdaki kopya sayısı.</summary>
        public static readonly int[] HavuzAdet = { 0, 22, 18, 14 };
        public static int TakimBoyutu(int seviye) => seviye;
        static readonly double[][] seviyeOlasilik = { new[] { 1.0, 0.0, 0.0 }, new[] { 1.0, 0.0, 0.0 }, new[] { 1.0, 0.0, 0.0 }, new[] { 0.75, 0.25, 0.0 }, new[] { 0.55, 0.4, 0.05 }, new[] { 0.4, 0.45, 0.15 }, new[] { 0.3, 0.45, 0.25 }, new[] { 0.2, 0.4, 0.4 }, new[] { 0.15, 0.35, 0.5 } };
        /// <summary>Seviyeye bağlı dükkân kademe olasılıkları [K1, K2, …].</summary>
        public static double[] KademeOlasilik(int seviye) => seviyeOlasilik[System.Math.Min(System.Math.Max(seviye, 2), seviyeOlasilik.Length - 1)];

        // Tur planı (bölüm 1.1), birikimli ekonomi (bölüm 3), kaybedince hasar (bölüm 4.4)
        public const int Bolum1Tur = 3, BolumTur = 7, KervanTur = 4, CanavarTur = 7;
        public const int TabanGelir = 5, FaizAdim = 10, FaizTavan = 5, GalibiyetBonus = 1, PazarBonus = 2;
        public const int Yenile = 2, KaynastirTaban = 2, SonUcEk = 3, SonIkiEk = 5;
        /// <summary>Bölüm 1'in turlarındaki taban gelir (1-1, 1-2, 1-3).</summary>
        public static readonly int[] TabanGelirBolum1 = { 3, 3, 4 };
        /// <summary>İndeks = seri uzunluğu (sonuncusu tavan) → seri bonusu.</summary>
        public static readonly int[] SeriTablo = { 0, 0, 1, 2, 2, 3 };
        /// <summary>İndeks = bölüm (sonuncusu tavan) → kaybedince alınan hasarın tabanı.</summary>
        public static readonly int[] BolumTabani = { 0, 0, 4, 8, 12, 16, 20, 24 };
        /// <summary>Bölüm → Kut Armağanı'nın geldiği tur.</summary>
        public static readonly Dictionary<int, int> ArmaganTur = new Dictionary<int, int> { { 2, 1 }, { 3, 2 }, { 4, 3 } };
        public const int EsyaYuva = 3, EsyaRaf = 10;
        public const double EsyaAzaltTavan = 0.4;
        /// <summary>Ganimet planı (5.4): "bölüm-tur" → parçalar. GanimetGecBolum ve sonrası GanimetGec (tur → parçalar).</summary>
        public static readonly Dictionary<string, GanimetParca[]> Ganimet = new Dictionary<string, GanimetParca[]> { { "1-1", new[] { new GanimetParca { Tip = "bilesen", N = 1 } } }, { "1-2", new[] { new GanimetParca { Tip = "kahraman", Kademe = 1 }, new GanimetParca { Tip = "altin", N = 2 } } }, { "1-3", new[] { new GanimetParca { Tip = "secim", Tur = "bilesen", N = 2 }, new GanimetParca { Tip = "altin", N = 2 } } }, { "2-7", new[] { new GanimetParca { Tip = "bilesen", N = 1 }, new GanimetParca { Tip = "zarf" } } }, { "3-7", new[] { new GanimetParca { Tip = "bilesen", N = 2 }, new GanimetParca { Tip = "altin", N = 3 } } }, { "4-7", new[] { new GanimetParca { Tip = "secim", Tur = "tam", N = 3 } } }, { "5-7", new[] { new GanimetParca { Tip = "esya", Id = "kutTasi" }, new GanimetParca { Tip = "esya", Id = "sokumTasi" } } } };
        public static readonly Dictionary<int, GanimetParca[]> GanimetGec = new Dictionary<int, GanimetParca[]> { { 7, new[] { new GanimetParca { Tip = "secim", Tur = "tam", N = 3 } } } };
        /// <summary>2-7 zarfı: ağırlıklı (W) parçalar.</summary>
        public static readonly GanimetParca[] Zarf = new[] { new GanimetParca { Tip = "altin", N = 3, W = 0.4 }, new GanimetParca { Tip = "bilesen", N = 1, W = 0.3 }, new GanimetParca { Tip = "kahraman", Kademe = 2, W = 0.3 } };
        public const int GanimetGecBolum = 6, KervanGecBolum = 5, PveDalgaGecBolum = 6, BaslangicSecenek = 3;
        /// <summary>Kervan planı (5.4): bölüm → plan; KervanGecBolum ve sonrası son satır.</summary>
        public static readonly Dictionary<int, KervanPlan> Kervan = new Dictionary<int, KervanPlan> { { 2, new KervanPlan { Kaynasmis = null, Secenek = new[] { new KervanSatir { Kademe = new[] { 1, 2 }, S = 1 } }, Esya = "bilesen" } }, { 3, new KervanPlan { Kaynasmis = new[] { 2, 1 }, Secenek = new[] { new KervanSatir { Kademe = new[] { 2, 3 }, S = 1 } }, Esya = "bilesen" } }, { 4, new KervanPlan { Kaynasmis = null, Secenek = new[] { new KervanSatir { Kademe = new[] { 3 }, S = 1 }, new KervanSatir { Kademe = new[] { 2 }, S = 2 } }, Esya = "bilesen" } }, { 5, new KervanPlan { Kaynasmis = null, Secenek = new[] { new KervanSatir { Kademe = new[] { 3 }, S = 1 } }, Esya = "tam" } } };
        /// <summary>İndeks = sıralama (1..8) → Kervan seçenek sayısı.</summary>
        public static readonly int[] KervanAdet = { 0, 3, 3, 4, 4, 5, 5, 5, 5 };
        /// <summary>Canavar dalgaları (5.5): "bölüm-tur" → birimler; PveDalgaGecBolum ve sonrası PveDalgaGec.</summary>
        public static readonly Dictionary<string, DalgaBirim[]> PveDalga = new Dictionary<string, DalgaBirim[]> { { "1-1", new[] { new DalgaBirim { H = "cakil", X = 1, Y = 0 }, new DalgaBirim { H = "cakil", X = 2, Y = 0 } } }, { "1-2", new[] { new DalgaBirim { H = "cakil", X = 1, Y = 0 }, new DalgaBirim { H = "cakil", X = 2, Y = 0 }, new DalgaBirim { H = "cakil", X = 0, Y = 0 } } }, { "1-3", new[] { new DalgaBirim { H = "tasKabuk", X = 1, Y = 0 }, new DalgaBirim { H = "kirpi", X = 2, Y = 0 }, new DalgaBirim { H = "kirpi", X = 0, Y = 1 } } }, { "2-7", new[] { new DalgaBirim { H = "kumAkrebi", X = 1, Y = 0 }, new DalgaBirim { H = "kumAkrebi", X = 2, Y = 0 }, new DalgaBirim { H = "kumAkrebi", X = 0, Y = 0 }, new DalgaBirim { H = "anaAkrep", X = 2, Y = 1 } } }, { "3-7", new[] { new DalgaBirim { H = "gokBalinasi", X = 1, Y = 2 } } }, { "4-7", new[] { new DalgaBirim { H = "kadimBekci", X = 1, Y = 0 }, new DalgaBirim { H = "kadimBekci", X = 2, Y = 0 } } }, { "5-7", new[] { new DalgaBirim { H = "yildizYiyen", X = 1, Y = 2 } } } };
        public static readonly DalgaBirim[] PveDalgaGec = new[] { new DalgaBirim { H = "yildizYiyen", X = 1, Y = 2 }, new DalgaBirim { H = "kadimBekci", X = 1, Y = 0 }, new DalgaBirim { H = "kadimBekci", X = 2, Y = 0 } };
        /// <summary>Gün Batımı (1.4): GunBatimiBasla saniyesinden sonra her tam saniye hasar +GunBatimiArtis.</summary>
        public const double GunBatimiBasla = 20.0, GunBatimiArtis = 0.1;
        // 8 kişilik hayalet lobi (bölüm 4)
        public const int LobiBoyut = 8, YasakTur = 3, EslesmeDeneme = 50, LobiTurTavan = 80, KupaKoruma = 400, UstalikKursu = 2, UstalikBirinci = 4, LobiEsles = 150;
        /// <summary>İndeks = sıra (1..8) → kupa değişimi (bölüm 4.5).</summary>
        public static readonly int[] KupaTablo = { 0, 40, 30, 20, 10, -10, -20, -30, -40 };
        /// <summary>Bot izi eğrisi (4.8): satır [r, seviye, ★2 oranı, ★3 oranı, tam eşya, kaynaşmış]; Tavan sütun başına üst sınır.</summary>
        public static readonly double[][] BotIzEgri = { new[] { 0.0, 2.0, 0.1, 0.0, 0.0, 0.0 }, new[] { 2.0, 3.0, 0.2, 0.0, 0.0, 0.0 }, new[] { 5.0, 4.0, 0.35, 0.0, 1.0, 0.0 }, new[] { 12.0, 6.0, 0.55, 0.0, 3.0, 1.0 }, new[] { 19.0, 7.0, 0.75, 0.05, 5.0, 1.0 }, new[] { 26.0, 8.0, 0.85, 0.12, 7.0, 2.0 } };
        public static readonly double[] BotIzTavan = { 0.0, 8.0, 0.95, 0.3, 10.0, 3.0 };
        public const double BotIzGucTaban = 0.8, BotIzGucAdim = 0.4, BotIzGucTur = 4.0;
        public const int BotIzBilesen = 2;
        // Kut hakkı ve yapay zekâ (bölüm 7.2, 7.4), Kut Sessizliği ve Uzun Gölge (8)
        public const int KutHak = 1, SonIkiKutHak = 2;
        public const double KutAra = 4.0, KutYzZaman = 5.0, KutYzZaman2 = 12.0, KutYzBilesen = 20.0, KutYzOcak = 60.0, KutSessizMana = 0.25, UzunGolgeBasla = 12.0;
        // Kut Yankısı (7.1)
        public const int YankiDisVurus = 3;
        public const double YankiDisOran = 0.5, YankiTuySure = 3.0, YankiTuyOran = 0.5, YankiKor = 1.25, YankiCiy = 30.0, YankiKabukSure = 3.0, YankiKabukOran = 0.4, YankiKabukTavan = 0.8;
        public const double YankiYurek = 0.15, YankiPulSure = 3.0, YankiPulOran = 0.4, YankiBuz = 150.0, YankiKutTasi = 2.0, YankiOcak = 1.5;
        // Kut Armağanı (bölüm 6): kademeler, bölüm → kademe olasılıkları, armağan sayıları (6.2)
        public static readonly string[] ArmaganKademeler = { "kivilcim", "alev", "gunes" };
        public static readonly Dictionary<int, double[]> ArmaganOlasilik = new Dictionary<int, double[]> { { 2, new[] { 0.5, 0.4, 0.1 } }, { 3, new[] { 0.3, 0.5, 0.2 } }, { 4, new[] { 0.2, 0.45, 0.35 } } };
        public const int ArmaganSecenekSayi = 3, ArmaganYenileme = 1;
        public const double ArmUyanis = 0.25, ArmIsikSutunu = 0.5, ArmIsikMenzil = 2.1, KaynasCarpan = 1.15, ArmKusursuzMelez = 1.3, ArmUcluKaynas = 0.1, ArmKizilGok = 0.1, ArmSonDirenisOran = 0.2;
        public const int ArmBereketFaiz = 7, ArmSonDirenisCan = 40;

        /// <summary>Hızlı Maç: prototipin kuralları (data.js KURAL.hizli).</summary>
        public static class Hizli
        {
            public const int AltinTur = 10, Yenile = 1, Kaynastir = 3, Yedek = 4, BaslangicCan = 5, ZaferHedef = 7;
            static readonly int[] yuvaTablo = { 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6 };
            public static int Yuva(int tur) => yuvaTablo[System.Math.Min(System.Math.Max(tur, 1), yuvaTablo.Length) - 1];
            static readonly double[][] olasilikTablo = { new[] { 1.0, 0.0, 0.0 }, new[] { 1.0, 0.0, 0.0 }, new[] { 0.65, 0.35, 0.0 }, new[] { 0.65, 0.35, 0.0 }, new[] { 0.45, 0.4, 0.15 }, new[] { 0.45, 0.4, 0.15 }, new[] { 0.3, 0.4, 0.3 }, new[] { 0.3, 0.4, 0.3 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 }, new[] { 0.2, 0.35, 0.45 } };
            public static double[] KademeOlasilik(int tur) => olasilikTablo[System.Math.Min(System.Math.Max(tur, 1), olasilikTablo.Length) - 1];
        }

        static Dictionary<string, Kahraman> _kahraman;
        public static Kahraman KahramanBul(string id)
        {
            if (_kahraman == null) { _kahraman = new Dictionary<string, Kahraman>(); foreach (var h in Kahramanlar) _kahraman[h.Id] = h; foreach (var c in Canavarlar) if (!_kahraman.ContainsKey(c.Id)) _kahraman[c.Id] = c; }
            return _kahraman[id];
        }
        /// <summary>Yalnız canavarlar; bulamazsa null.</summary>
        public static Kahraman CanavarBul(string id) { foreach (var c in Canavarlar) if (c.Id == id) return c; return null; }
        public static int KahramanSira(string id) { for (int i = 0; i < Kahramanlar.Length; i++) if (Kahramanlar[i].Id == id) return i; return -1; }
        public static SoyBilgi SoyBul(string id) { foreach (var x in Soylar) if (x.Id == id) return x; return null; }
        static Dictionary<string, Esya> _esya;
        /// <summary>data.js esya(id): bileşen, tam eşya, özel; "muhur-<soy>" Soy Mührü. Bilinmeyen → null.</summary>
        public static Esya EsyaBul(string id)
        {
            if (id == null) return null;
            if (_esya == null) { _esya = new Dictionary<string, Esya>(); foreach (var b in Bilesenler) _esya[b.Id] = b; foreach (var e in Esyalar) _esya[e.Id] = e; foreach (var o in OzelEsyalar) if (o.Id != "muhur") _esya[o.Id] = o; }
            if (_esya.TryGetValue(id, out var x)) return x;
            if (id.StartsWith("muhur-", System.StringComparison.Ordinal) && SoyBul(id.Substring(6)) != null)
            {
                var m = OzelEsyalar[2]; var sy = id.Substring(6);
                var yeni = new Esya { Id = id, Ad = m.Ad + " (" + SoyBul(sy).Ad + ")", Simge = m.Simge, M = m.M, Tip = "ozel", Soy = sy }; _esya[id] = yeni; return yeni;
            }
            return null;
        }
        /// <summary>İki bileşenin tam eşyası (sıra önemsiz); yoksa null.</summary>
        public static string Tarif(string a, string b) { foreach (var e in Esyalar) if ((e.Tarif[0] == a && e.Tarif[1] == b) || (e.Tarif[0] == b && e.Tarif[1] == a)) return e.Id; return null; }
    }
}
