// node kut/test/esya_denge.cjs [savaş sayısı] — eşya denge taraması (OYNANIS_DERINLIK.md 11: "her tam eşyanın taşıyıcı kazanma oranı ortalamanın ±%5'i")
// Yöntem: her vaka için iki seviyeli bot takımı kurulur (Sv 5–7, 3-x / 4-x turları). A takımının en güçlü birimi (kademe × yıldız) taşıyıcıdır.
// Taban: iki takım da eşyasız. Her eşya için aynı vakalarda yalnız taşıyıcıya o eşya verilir; B eşyasızdır. İki taraf da Kut'u yapay zekâyla kullanır.
// Sonuç kut/test/esya_denge_sonuc.md ve .json dosyalarına yazılır. Belirlenimci: aynı sayıyla hep aynı tablo.
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
const fs = require('fs'), path = require('path');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js');
const N = +(process.argv[2] || 400);
const vakalar = [];
for (let i = 0; i < N; i++) {
  const r = 10 + (i % 14), sv = O.botSeviye(r), tur = r + 1;
  const A = O.botTakim(tur, 61000 + i * 7, 0.5, sv), B = O.botTakim(tur, 83000 + i * 11, 0.5, sv);
  const guc = (b) => D.kahraman(b.h).kademe * b.s;
  const tas = A.map((b, k) => k).sort((p, q) => guc(A[q]) - guc(A[p]))[0];
  vakalar.push({ A, B, tas, opt: { tohum: 4000 + i * 3, alamet: 'yok', yz: [0, 1] } });
}
function oran(esya) {
  let k = 0, sure = 0;
  for (const v of vakalar) {
    const A = v.A.map((b, j) => (j === v.tas && esya ? { ...b, e: [esya] } : b));
    const s = S.Savas(A, v.B, v.opt).sonunaKadar();
    k += s.kazanan === 0 ? 1 : s.kazanan === -1 ? 0.5 : 0; sure += s.sure;
  }
  return { oran: k / vakalar.length, sure: sure / vakalar.length };
}
const t0 = Date.now();
const taban = oran(null);
const sonuc = [];
for (const b of D.BILESENLER) sonuc.push({ id: b.id, ad: b.ad, tip: 'bileşen', ...oran(b.id) });
for (const e of D.ESYALAR) sonuc.push({ id: e.id, ad: e.ad, tip: 'tam', tarif: e.tarif.map(t => D.esya(t).ad).join(' + '), ...oran(e.id) });
const tam = sonuc.filter(s => s.tip === 'tam'), ort = tam.reduce((t, s) => t + s.oran, 0) / tam.length;
for (const s of sonuc) { s.etki = s.oran - taban.oran; s.ortFark = s.oran - ort; s.durum = s.tip !== 'tam' ? '' : Math.abs(s.ortFark) <= 0.05 ? 'bantta' : s.ortFark > 0 ? 'güçlü' : 'zayıf'; }
const yuzde = (x, isaret) => (isaret && x >= 0 ? '+' : '') + (x * 100).toFixed(1).replace('.', ',');
const sirali = tam.slice().sort((a, b) => b.oran - a.oran);
const satir = [];
satir.push('# Eşya denge taraması');
satir.push('');
satir.push(`Üreten: \`node kut/test/esya_denge.cjs ${N}\` (belirlenimci; aynı sayıyla aynı tablo). Süre: ${((Date.now() - t0) / 1000).toFixed(0)} sn, ${(sonuc.length + 1) * N} savaş.`);
satir.push('');
satir.push(`Yöntem: ${N} vaka. Her vakada iki seviyeli bot takımı (3-x ve 4-x turları, Sv 5–7) dövüşür. A takımının en güçlü birimi (kademe × yıldız) taşıyıcıdır; eşya yalnız ona verilir, B eşyasızdır. İki taraf da Kut'u yapay zekâyla kullanır. Alamet yok. Beraberlik yarım galibiyet sayılır.`);
satir.push('');
satir.push(`- Taban (iki taraf eşyasız): A kazanma oranı **%${yuzde(taban.oran)}**, ortalama savaş ${taban.sure.toFixed(1).replace('.', ',')} sn.`);
satir.push(`- 36 tam eşyanın ortalaması: **%${yuzde(ort)}** (taban +${yuzde(ort - taban.oran)} puan).`);
satir.push(`- Hedef (bölüm 11): her tam eşya ortalamanın ±5 puanı içinde. Bantta: **${tam.filter(s => s.durum === 'bantta').length}/36**; güçlü: ${tam.filter(s => s.durum === 'güçlü').map(s => s.ad).join(', ') || 'yok'}; zayıf: ${tam.filter(s => s.durum === 'zayıf').map(s => s.ad).join(', ') || 'yok'}.`);
satir.push('');
satir.push('## Tam eşyalar (kazanma oranına göre)');
satir.push('');
satir.push('| # | Eşya | Tarif | Kazanma | Tabana göre | Ortalamaya göre | Durum |');
satir.push('|---|---|---|---|---|---|---|');
sirali.forEach((s, i) => satir.push(`| ${i + 1} | ${s.ad} | ${s.tarif} | %${yuzde(s.oran)} | ${yuzde(s.etki, 1)} | ${yuzde(s.ortFark, 1)} | ${s.durum} |`));
satir.push('');
satir.push('## Bileşenler (tek başına)');
satir.push('');
satir.push('| Bileşen | Kazanma | Tabana göre |');
satir.push('|---|---|---|');
for (const s of sonuc.filter(x => x.tip === 'bileşen').sort((a, b) => b.oran - a.oran)) satir.push(`| ${s.ad} | %${yuzde(s.oran)} | ${yuzde(s.etki, 1)} |`);
satir.push('');
satir.push('## Okuma notları');
satir.push('');
satir.push('- Tarama tek taşıyıcı ve tek eşyayla yapılır. Eşyanın doğal taşıyıcısı (ör. Kut Ocağı için yetenekçi, Diken Kabuk için ön sıradaki tank) her vakada seçilmez; taşıyıcı yalnız kademe × yıldıza göre seçilir. Takım etkili eşyalar (Işık Kalkanı, Ulu Kök, Av Coşkusu) ve Kut\'a bağlı eşyalar bu yüzden olduğundan zayıf ya da güçlü görünebilir.');
satir.push('- Bir tam eşya iki bileşenin istatistiğini de verir; "tabana göre" sütunu bu toplamın etkisidir. Eşyanın kendi etkisinin payı için iki bileşenin satırlarına bakılabilir.');
satir.push('- Sayılar belgedeki değerlerle (bölüm 5.2–5.3) ölçüldü; son denetimde iki eşya ayarlandı: Ruh Testisi dost ölünce 30 yerine 20 mana, Gölge Pelerini öldürünce ek %15 iyileşme. Ayrıntı: `test/DENGE_RAPORU.md`.');
const md = path.join(__dirname, 'esya_denge_sonuc.md'), js = path.join(__dirname, 'esya_denge_sonuc.json');
fs.writeFileSync(md, satir.join('\n') + '\n');
fs.writeFileSync(js, JSON.stringify({ N, taban, ortalama: ort, sonuc }, null, 1));
console.log(`taban %${yuzde(taban.oran)} · tam eşya ortalaması %${yuzde(ort)} · bantta ${tam.filter(s => s.durum === 'bantta').length}/36`);
console.log('en güçlü 5:', sirali.slice(0, 5).map(s => `${s.ad} %${yuzde(s.oran)}`).join(' · '));
console.log('en zayıf 5:', sirali.slice(-5).map(s => `${s.ad} %${yuzde(s.oran)}`).join(' · '));
console.log('→', md);
