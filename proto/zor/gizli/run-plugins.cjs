// Eklenti taslakları + yamalı çekirdek: oyunun KENDİ difficulty() puanı (H1/H3 kancalarıyla gizli bilgiyi görür), aynı tohum, kural kapalı/açık.
// Ayrıca: yapı gereği çözülebilirlik (sol çözüm mü), par/taps tutarlılığı, adillik reddi oranı.
const { K, stat } = require('./plugins.cjs');
const N = +process.argv[2] || 160;
const RULES = [['cover', 'M10 Kapak'], ['faint', 'M12 Silik kol'], ['closed', 'M14 Kapalı durak'], ['depot', 'M16 Gizli depo']];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
for (const [c, r] of [[7, 9], [6, 8]]) {
  const n = c * r, base = []; for (let s = 1; s <= N; s++) base.push(K.difficulty(K.generate(c, r, s * 7919 + 13)));
  console.log(`\n${c}×${r} N=${N} · kural kapalı ortalama ${mean(base).toFixed(2)}`);
  for (const [key, name] of RULES) {
    const mod = K.MODS.find(m => m.key === key);
    for (const intro of [false, true]) {
      const amt = mod.amount(n, intro, .9, false, c, r); stat.tries = 0; stat.rej = 0;
      const d = [], sc = []; let solv = 0, up = 0, hidden = 0;
      for (let s = 1; s <= N; s++) {
        let P, t = 0; do P = K.generate(c, r, s * 7919 + 13 + t++ * 104729, 0, 0, { [key]: amt }); while (P.reject && t < 24); const x = K.difficulty(P);   // pick gibi: reddedilen adayın yerine sıradaki
        sc.push(x); d.push(x - base[s - 1]); if (x > base[s - 1]) up++;
        if (K.lit({ ...P, cur: P.sol }).solved && !K.lit(P).solved) solv++;
        hidden += key === 'cover' ? P.cover.filter(Boolean).length : key === 'faint' ? P.faint.filter(Boolean).length : key === 'closed' ? P.closed - P.closedShown.reduce((a, b) => a + b, 0) : P.depot.filter(W => W.cells.length > 1).length;
      }
      console.log(`  ${name} (${intro ? 'tanıtım' : 'normal'}, miktar ${amt}): puan ${mean(sc).toFixed(2)} · Δ ort ${(mean(d) >= 0 ? '+' : '') + mean(d).toFixed(2)} medyan ${(med(d) >= 0 ? '+' : '') + med(d).toFixed(1)} · artan %${(100 * up / N).toFixed(0)} · çözülebilir ve çözülmüş gelmeyen ${solv}/${N} · bölüm başına gizli öğe ${(hidden / N).toFixed(2)} · adillik reddi %${(100 * stat.rej / Math.max(1, stat.tries)).toFixed(0)}`);
    }
  }
}
