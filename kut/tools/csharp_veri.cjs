// node kut/tools/csharp_veri.cjs → kut/unity/Kod/KutVeri.cs
// data.js'teki oyun verisini Unity C# dosyasına çevirir. Veri değişince yeniden çalıştır; elle düzenleme.
const fs = require('fs'), path = require('path');
const D = require('../data.js');
const s = (v) => JSON.stringify(v);            // C# string olarak da geçerli (çift tırnak, \u kaçışları)
const sayi = (v) => Number.isInteger(v) ? v.toFixed(1) : String(v);
const satir = [];
satir.push('// OTOMATİK ÜRETİLDİ: kut/tools/csharp_veri.cjs (kaynak: kut/data.js). Elle düzenleme.');
satir.push('using System.Collections.Generic;');
satir.push('');
satir.push('namespace Kut');
satir.push('{');
satir.push('    public sealed class SoyBilgi { public string Id, Ad, Emoji; public int[] Esik; public string[] Aciklama; }');
satir.push('    public sealed class Kahraman { public string Id, Ad, Emoji, Renk, Yetenek, Pasif; public int Kademe, Menzil; public string[] Soy; public double Can, Atk, As, Mana; }');
satir.push('    public sealed class Metin { public string Ad, M; }');
satir.push('    public sealed class Alamet { public string Id, Ad, Emoji, M; }');
satir.push('');
satir.push('    public static class KutVeri');
satir.push('    {');
satir.push('        public static readonly SoyBilgi[] Soylar = {');
for (const [id, v] of Object.entries(D.SOYLAR))
  satir.push(`            new SoyBilgi { Id = ${s(id)}, Ad = ${s(v.ad)}, Emoji = ${s(v.emoji)}, Esik = new[] { ${v.esik.join(', ')} }, Aciklama = new[] { ${v.aciklama.map(s).join(', ')} } },`);
satir.push('        };');
satir.push('');
satir.push('        public static readonly Kahraman[] Kahramanlar = {');
for (const h of D.KAHRAMANLAR)
  satir.push(`            new Kahraman { Id = ${s(h.id)}, Ad = ${s(h.ad)}, Emoji = ${s(h.emoji)}, Renk = ${s(h.renk)}, Kademe = ${h.kademe}, Soy = new[] { ${h.soy.map(s).join(', ')} }, Can = ${sayi(h.can)}, Atk = ${sayi(h.atk)}, As = ${sayi(h.as)}, Menzil = ${h.menzil}, Mana = ${sayi(h.mana)}, Yetenek = ${s(h.yetenek)}, Pasif = ${s(h.pasif)} },`);
satir.push('        };');
satir.push('');
for (const [ad, tablo] of [['Yetenekler', D.YETENEK], ['Pasifler', D.PASIF]]) {
  satir.push(`        public static readonly Dictionary<string, Metin> ${ad} = new Dictionary<string, Metin> {`);
  for (const [k, v] of Object.entries(tablo)) satir.push(`            { ${s(k)}, new Metin { Ad = ${s(v.ad)}, M = ${s(v.m)} } },`);
  satir.push('        };');
  satir.push('');
}
satir.push('        public static readonly Alamet[] Alametler = {');
for (const a of D.ALAMETLER) satir.push(`            new Alamet { Id = ${s(a.id)}, Ad = ${s(a.ad)}, Emoji = ${s(a.emoji)}, M = ${s(a.m)} },`);
satir.push('        };');
satir.push('');
const K = D.KURAL, H = K.hizli;
const dizi = (l) => l.map(sayi).join(', ');
satir.push('        // Ortak sabitler ve seviyeli maç (data.js KURAL)');
satir.push(`        public const int SatisIade = ${K.satisIade}, Dukkan = ${K.dukkan}, Yedek = ${K.yedek}, TahtaSutun = ${K.tahtaSutun}, TahtaSira = ${K.tahtaSira}, TakimTavan = ${K.takimTavan};`);
satir.push(`        public const int CanBaslangic = ${K.canBaslangic}, SeviyeBaslangic = ${K.seviyeBaslangic}, SeviyeTavan = ${K.seviyeTavan}, PasifXp = ${K.pasifXp}, XpBedel = ${K.xpBedel}, XpMiktar = ${K.xpMiktar};`);
satir.push(`        public const double SavasSuresi = ${sayi(K.savasSuresi)};`);
satir.push(`        public static readonly double[] YildizCarpan = { ${dizi(K.yildizCarpan)} };`);
satir.push(`        /// <summary>İndeks = mevcut seviye → sonraki seviyeye gereken deneyim.</summary>`);
satir.push(`        public static readonly int[] XpTablo = { ${K.xpTablo.join(', ')} };`);
satir.push(`        /// <summary>İndeks = yıldız → havuzdan tutulan kopya (★1 = 1, ★2 = 3, ★3 = 9).</summary>`);
satir.push(`        public static readonly int[] YildizKopya = { ${K.yildizKopya.join(', ')} };`);
const kademeler = Object.keys(K.havuzAdet).map(Number), kTavan = Math.max(...kademeler);
satir.push(`        /// <summary>İndeks = kademe → havuzdaki kopya sayısı.</summary>`);
satir.push(`        public static readonly int[] HavuzAdet = { 0, ${Array.from({ length: kTavan }, (_, i) => K.havuzAdet[i + 1] || 0).join(', ')} };`);
satir.push(`        public static int TakimBoyutu(int seviye) => seviye;`);
const svl = Array.from({ length: K.seviyeTavan + 1 }, (_, sv) => K.kademeOlasilik(sv));
satir.push(`        static readonly double[][] seviyeOlasilik = { ${svl.map(o => `new[] { ${dizi(o)} }`).join(', ')} };`);
satir.push(`        /// <summary>Seviyeye bağlı dükkân kademe olasılıkları [K1, K2, …].</summary>`);
satir.push(`        public static double[] KademeOlasilik(int seviye) => seviyeOlasilik[System.Math.Min(System.Math.Max(seviye, 2), seviyeOlasilik.Length - 1)];`);
satir.push('');
satir.push('        /// <summary>Hızlı Maç: prototipin kuralları (data.js KURAL.hizli).</summary>');
satir.push('        public static class Hizli');
satir.push('        {');
satir.push(`            public const int AltinTur = ${H.altinTur}, Yenile = ${H.yenile}, Kaynastir = ${H.kaynastir}, Yedek = ${H.yedek}, BaslangicCan = ${H.can}, ZaferHedef = ${H.zaferHedef};`);
// yuva ve kademeOlasilik işlevleri: 1..30 turu tabloya dök, sonrası son değer
const yuva = Array.from({ length: 30 }, (_, i) => H.yuva(i + 1));
satir.push(`            static readonly int[] yuvaTablo = { ${yuva.join(', ')} };`);
satir.push('            public static int Yuva(int tur) => yuvaTablo[System.Math.Min(System.Math.Max(tur, 1), yuvaTablo.Length) - 1];');
const ol = Array.from({ length: 30 }, (_, i) => H.kademeOlasilik(i + 1));
satir.push(`            static readonly double[][] olasilikTablo = { ${ol.map(o => `new[] { ${dizi(o)} }`).join(', ')} };`);
satir.push('            public static double[] KademeOlasilik(int tur) => olasilikTablo[System.Math.Min(System.Math.Max(tur, 1), olasilikTablo.Length) - 1];');
satir.push('        }');
satir.push('');
satir.push('        static Dictionary<string, Kahraman> _kahraman;');
satir.push('        public static Kahraman KahramanBul(string id)');
satir.push('        {');
satir.push('            if (_kahraman == null) { _kahraman = new Dictionary<string, Kahraman>(); foreach (var h in Kahramanlar) _kahraman[h.Id] = h; }');
satir.push('            return _kahraman[id];');
satir.push('        }');
satir.push('        public static int KahramanSira(string id) { for (int i = 0; i < Kahramanlar.Length; i++) if (Kahramanlar[i].Id == id) return i; return -1; }');
satir.push('        public static SoyBilgi SoyBul(string id) { foreach (var x in Soylar) if (x.Id == id) return x; return null; }');
satir.push('    }');
satir.push('}');
const out = path.join(__dirname, '..', 'unity', 'Kod', 'KutVeri.cs');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, satir.join('\n') + '\n');
console.log('yazıldı:', out);
