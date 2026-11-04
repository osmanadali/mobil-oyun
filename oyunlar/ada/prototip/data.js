// Ada prototipi — bölüm verisi, kayıt ve yardımcılar
export const LEVELS = [
  { n: 1, type: 'kopru', rows: 5, glow: 0.75, name: 'Kıyı Basamakları' },
  { n: 2, type: 'hedef', targets: 4, seq: 3, wind: 0, show: 0.95, name: 'İlk Atışlar' },
  { n: 3, type: 'kopru', rows: 5, glow: 0.6, name: 'Lagün Geçidi' },
  { n: 4, type: 'hedef', targets: 4, seq: 3, wind: 0.8, show: 0.85, name: 'Meltem' },
  { n: 5, type: 'kopru', rows: 6, glow: 0.55, name: 'Mercan Yolu' },
  { n: 6, type: 'hedef', targets: 5, seq: 4, wind: 1.2, show: 0.75, name: 'Hindistan Cevizi' },
  { n: 7, type: 'kopru', rows: 7, glow: 0.5, name: 'Kayalık Köprü' },
  { n: 8, type: 'hedef', targets: 5, seq: 4, wind: 1.7, show: 0.68, name: 'Rüzgârlı Burun' },
  { n: 9, type: 'kopru', rows: 8, glow: 0.45, name: 'Fırtına Basamakları' },
  { n: 10, type: 'hedef', targets: 5, seq: 5, wind: 2.1, show: 0.6, name: 'Kumsal Finali' },
].map(L => ({ ...L, id: String(L.n) }));

const r1 = v => Math.round(v * 2) / 2;
// [3 yıldız sınırı, 2 yıldız sınırı] (sn). Bitiren en az 1 yıldız alır.
export function starTimes(L) {
  return L.type === 'kopru' ? [r1(L.rows * 1.5 + 3), r1(L.rows * 2.6 + 7)] : [r1(L.seq * 2.8 + 2), r1(L.seq * 4.6 + 7)];
}
export function starsFor(L, t) { const [a, b] = starTimes(L); return t <= a ? 3 : t <= b ? 2 : 1; }

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function dailyLevel(d = new Date()) {
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const base = { n: 'G', id: 'G-' + key, daily: true, seed: key, name: 'Günün Adası' };
  return key % 2 === 0
    ? { ...base, type: 'kopru', rows: 6, glow: 0.55 }
    : { ...base, type: 'hedef', targets: 5, seq: 4, wind: 1.3, show: 0.72 };
}
export const dateLabel = (d = new Date()) => { try { return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); } catch (e) { return ''; } };

const KEY = 'ada_prototip_v1';
const DEF = () => ({ unlocked: 1, stars: {}, best: {}, settings: { sfx: true, music: true, vib: true }, char: 'kerem' });
function load() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) { const d = JSON.parse(s); const def = DEF(); return { ...def, ...d, settings: { ...def.settings, ...(d.settings || {}) } }; }
  } catch (e) { /* depolama kapalı */ }
  return DEF();
}
export const store = {
  data: load(),
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* yok say */ } },
  resetProgress() { const s = this.data.settings, c = this.data.char; this.data = { ...DEF(), settings: s, char: c }; this.save(); },
};

export const fmt = s => { const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + r.toFixed(1).padStart(4, '0').replace('.', ','); };
export const fmtSn = s => s.toFixed(1).replace('.', ',') + ' sn';
