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
const K = D.KURAL;
satir.push('        // Ekonomi ve maç sabitleri (data.js KURAL)');
satir.push(`        public const int AltinTur = ${K.altinTur}, Yenile = ${K.yenile}, Kaynastir = ${K.kaynastir}, SatisIade = ${K.satisIade}, Dukkan = ${K.dukkan}, Yedek = ${K.yedek}, BaslangicCan = ${K.can}, ZaferHedef = ${K.zaferHedef};`);
satir.push(`        public const double SavasSuresi = ${sayi(K.savasSuresi)};`);
satir.push(`        public static readonly double[] YildizCarpan = { ${K.yildizCarpan.map(sayi).join(', ')} };`);
// yuva ve kademeOlasilik işlevleri: 1..20 turu tabloya dök, sonrası son değer
const yuva = Array.from({ length: 30 }, (_, i) => K.yuva(i + 1));
satir.push(`        static readonly int[] yuvaTablo = { ${yuva.join(', ')} };`);
satir.push('        public static int Yuva(int tur) => yuvaTablo[System.Math.Min(System.Math.Max(tur, 1), yuvaTablo.Length) - 1];');
const ol = Array.from({ length: 30 }, (_, i) => K.kademeOlasilik(i + 1));
satir.push(`        static readonly double[][] olasilikTablo = { ${ol.map(o => `new[] { ${o.map(sayi).join(', ')} }`).join(', ')} };`);
satir.push('        public static double[] KademeOlasilik(int tur) => olasilikTablo[System.Math.Min(System.Math.Max(tur, 1), olasilikTablo.Length) - 1];');
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
