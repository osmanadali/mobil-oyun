// Tanıtım videosu için telifsiz arka plan müziği: saf Node ile sentez (Re majör, 104 BPM, arpej + yumuşak bas + pad).
// Kullanım: node tools/tanitim-muzik.cjs <çıktı.wav> [süre_sn=32] [çan_sn=26]   · çan_sn: "hat açıldı" çan ezgisinin zamanı
'use strict';
const fs = require('fs');
function synth(dur = 32, bellAt = 26, endAt = dur - 4, fx = []) {
  const SR = 44100, N = Math.round(dur * SR), L = new Float32Array(N), R = new Float32Array(N), BPM = 104, beat = 60 / BPM, e8 = beat / 2;
  const add = (buf, t, d, fn, g, pan = 0) => {   // buf'a t'den d sn fn(τ) ürünü ekle
    const s0 = Math.floor(t * SR), n = Math.floor(d * SR), gl = g * (1 - Math.max(0, pan)), gr = g * (1 + Math.min(0, pan));
    for (let i = 0; i < n && s0 + i < N; i++) { if (s0 + i < 0) continue; const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
  };
  const T = 2 * Math.PI;
  const pluck = (f) => tau => (Math.sin(T * f * tau) + .28 * Math.sin(T * 2 * f * tau) * Math.exp(-tau * 9) + .1 * Math.sin(T * 3 * f * tau)) * Math.min(1, tau / .004) * Math.exp(-tau * 6.5);
  const bell = (f) => tau => (Math.sin(T * f * tau) + .5 * Math.sin(T * f * 2.76 * tau) * Math.exp(-tau * 3) + .25 * Math.sin(T * f * 5.4 * tau) * Math.exp(-tau * 6)) * Math.min(1, tau / .003) * Math.exp(-tau * 1.7);
  const pad = (f, d) => tau => (Math.sin(T * f * tau) + .5 * Math.sin(T * f * 1.003 * tau)) * Math.min(1, tau / 1.2) * Math.min(1, (d - tau) / 1.2);
  const bassN = (f, d) => tau => (Math.sin(T * f * tau) + .2 * Math.sin(T * 2 * f * tau)) * Math.min(1, tau / .05) * Math.min(1, (d - tau) / .25);
  // I – V – vi – IV
  const CH = [
    { r: 73.42, t: [293.66, 369.99, 440, 587.33, 739.99] },
    { r: 55, t: [220, 277.18, 329.63, 440, 554.37] },
    { r: 61.74, t: [246.94, 293.66, 369.99, 493.88, 587.33] },
    { r: 49, t: [196, 246.94, 293.66, 392, 493.88] },
  ], PAT = [0, 1, 2, 3, 2, 1, 2, 4], bar = 4 * beat;
  for (let b = 0; b * bar < dur; b++) {
    const c = CH[b % 4], t0 = b * bar, last = t0 + bar > endAt;
    // bas ve pad: iki kanala eşit
    add(L, t0, bar, bassN(c.r, bar), .20, 0);
    c.t.slice(0, 3).forEach((f, k) => add(L, t0, bar + .5, pad(f / 2, bar + .5), .035, k - 1 > 0 ? .3 : -.3));
    // arpej (başta yalnız bas+pad: ilk bar sade, ikinci bardan arpej girer)
    if (b >= 1) PAT.forEach((p, k) => add(L, t0 + k * e8, 1.4, pluck(c.t[p]), .17 + (k % 4 === 0 ? .04 : 0), (k % 2 ? .35 : -.35)));
    // üst ezgi: 3 barda bir, yumuşak çan
    if (b >= 4 && b % 2 === 0 && !last) [c.t[3], c.t[4]].forEach((f, k) => add(L, t0 + (k ? 2.5 : 1) * beat, 1.8, bell(f), .07, k ? .4 : -.4));
  }
  // "hat açıldı" çan ezgisi: yükselen Re majör
  [587.33, 739.99, 880, 1174.66].forEach((f, k) => add(L, bellAt + k * .16, 2.4, bell(f), .2, (k - 1.5) * .3));
  // kapanış: Re majör çan akoru
  [293.66, 440, 587.33, 739.99, 880].forEach((f, k) => add(L, endAt + k * .09, 3.2, bell(f), .1, (k - 2) * .25));
  // gecikme (yankı): 3/8 vuruş, geri besleme .35
  const dl = Math.round(e8 * 1.5 * SR);
  for (let i = dl; i < N; i++) { L[i] += L[i - dl] * .30; R[i] += R[i - dl] * .30; }

  // ---- ses efektleri (müzikten ayrı yolda; sonra karışıma girer) ----
  const XL = new Float32Array(N), XR = new Float32Array(N); let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 * 2 - 1;
  const addX = (t, d, fn, g, pan = 0) => { const s0 = Math.floor(t * SR), n = Math.floor(d * SR), gl = g * (1 - Math.max(0, pan)), gr = g * (1 + Math.min(0, pan)); for (let i = 0; i < n && s0 + i < N; i++) { if (s0 + i < 0) continue; const v = fn(i / SR); XL[s0 + i] += v * gl; XR[s0 + i] += v * gr; } };
  const whoosh = (d, up) => { let lo = 0, bd = 0; return tau => { const x = tau / d, fc = up ? 250 + 3500 * x * x : 3800 - 3400 * x, f = 2 * Math.sin(Math.PI * fc / SR), q = .35, n = rnd(), hi = n - lo - q * bd; bd += f * hi; lo += f * bd; return bd * Math.sin(Math.PI * x) ** 2 * 1.4; }; };
  const tick = f => tau => (rnd() * Math.exp(-tau * 900) * .5 + Math.sin(T * f * tau) * Math.exp(-tau * 75) * .55);
  const clack = tau => (rnd() * Math.exp(-tau * 500) * .55 + Math.sin(T * 180 * tau) * Math.exp(-tau * 60) * .5);
  const boom = tau => Math.sin(T * (46 + 70 * Math.exp(-tau * 9)) * tau) * Math.exp(-tau * 3.2);
  for (const e of fx) {
    if (e.type === 'whoosh') addX(e.t, e.d || .7, whoosh(e.d || .7, e.up !== false), .22 * (e.g || 1), e.pan || 0);
    else if (e.type === 'tick') addX(e.t, .09, tick(e.f || 1100), .24 * (e.g || 1), e.pan || 0);
    else if (e.type === 'clack') addX(e.t, .1, clack, .26 * (e.g || 1), e.pan || 0);
    else if (e.type === 'ding') addX(e.t, 1.5, bell(e.f || 1174.66), .16 * (e.g || 1), e.pan || 0);
    else if (e.type === 'boom') addX(e.t, 1.2, boom, .5 * (e.g || 1));
  }
  for (let i = 0; i < N; i++) { L[i] = L[i] * .6 + XL[i]; R[i] = R[i] * .6 + XR[i]; }
  // R kanalı: L ile aynı çalındı (add her ikisine yazar); son: kenar yumuşatma + normalize
  let pk = 0; for (let i = 0; i < N; i++) { const t = i / SR, fi = Math.min(1, t / .5), fo = Math.min(1, Math.max(0, (dur - t) / 1.6)), g = fi * fo * fo; L[i] *= g; R[i] *= g; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
  const out = Buffer.alloc(44 + N * 4), k = .8 / pk;
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(L[i] * k * 32767), 44 + i * 4); out.writeInt16LE(Math.round(R[i] * k * 32767), 46 + i * 4); }
  return out;
}
module.exports = { synth };
if (require.main === module) {
  const [f, d, b, e] = process.argv.slice(2); if (!f) { console.error('kullanım: node tools/tanitim-muzik.cjs çıktı.wav [süre] [çan] [kapanış]'); process.exit(1); }
  fs.writeFileSync(f, synth(+d || 32, +b || 26, e ? +e : undefined)); console.log('yazıldı', f);
}
