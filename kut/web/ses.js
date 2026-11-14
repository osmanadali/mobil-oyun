// Kut Arena ses katmanı (Web Audio). Sesler ElevenLabs ile üretildi: kut/web/ses/*.mp3 (SESLER.md).
// Tarayıcı kuralı: ses ancak kullanıcı ilk kez dokunduktan sonra başlar; o ana kadar gelen çağrılar sessizce atlanır.
const DOSYALAR = ['vurus_yumruk', 'vurus_pence', 'vurus_isirma', 'atis_buyu', 'atis_ok', 'isabet_buyu',
  'kaya_firlat', 'uluma', 'davul', 'can_emme', 'kasirga', 'boynuz', 'zehir', 'buz', 'ates_halkasi', 'dortnal',
  'isik_kanat', 'kara_golge', 'kul_yagmuru', 'ayaz', 'golge_ok', 'yildirim',
  'kut', 'olum', 'dirilis', 'kalkan_kir', 'zafer', 'yenilgi', 'savas_basla',
  'satin_al', 'yenile', 'birlesme', 'kaynasma', 'dugme'];

// Yetenek kimliği (data.js) → ses
export const YETENEK_SES = { tasFirlat: 'kaya_firlat', uluma: 'uluma', davul: 'davul', ruhEmme: 'can_emme', kasirga: 'kasirga',
  deliOfke: 'boynuz', zehir: 'zehir', buzNefes: 'buz', ocak: 'ates_halkasi', dortnal: 'dortnal', kanat: 'isik_kanat',
  karaGolge: 'kara_golge', kulDogus: 'kul_yagmuru', ayaz: 'ayaz', golgeOk: 'golge_ok', yildirim: 'yildirim' };
// Yakın dövüşçünün vuruş sesi (yoksa pençe)
const YAKIN_SES = { golem: 'vurus_yumruk', ayi: 'vurus_yumruk', koc: 'vurus_yumruk', kaplumbaga: 'vurus_yumruk',
  yilan: 'vurus_isirma', kurt: 'vurus_isirma', semender: 'vurus_isirma' };
// Ses düzeyleri (0..1): sık çalanlar kısık, büyük anlar yüksek
const DUZEY = { vurus_yumruk: 0.45, vurus_pence: 0.4, vurus_isirma: 0.4, atis_buyu: 0.3, atis_ok: 0.35, isabet_buyu: 0.3,
  dugme: 0.35, satin_al: 0.6, yenile: 0.55, kut: 1, zafer: 0.9, yenilgi: 0.8, savas_basla: 0.8, olum: 0.6 };

let ctx = null, ana = null, kok = '', acik = true, duzey = 0.8;
const tampon = {}, yukleniyor = {}, sonCalma = {};
let calan = 0;
const ENFAZLA = 10; // aynı anda en çok bu kadar ses

try { const k = localStorage.getItem('kut.ses'); if (k === '0') acik = false; } catch (e) { /* depolama kapalı */ }

export function kur(kokYolu = '') {
  kok = kokYolu;
  const ac = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); ana = ctx.createGain(); ana.gain.value = acik ? duzey : 0; ana.connect(ctx.destination);
    for (const d of DOSYALAR) yukle(d);
  };
  for (const o of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(o, ac, { capture: true, passive: true });
}

function yukle(ad) {
  if (tampon[ad] || yukleniyor[ad] || !ctx) return;
  yukleniyor[ad] = fetch(kok + 'ses/' + ad + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
    .then(b => new Promise((ok, red) => ctx.decodeAudioData(b, ok, red))).then(t => { tampon[ad] = t; })
    .catch(() => { /* ses dosyası yoksa oyun sessiz devam eder */ });
}

// ad: dosya adı. secenek: { duzey, hiz, sapma (rastgele perde ±), aralik (aynı sesin en kısa tekrar süresi sn) }
export function cal(ad, s = {}) {
  if (!ctx || !acik || !ad) return;
  const t = tampon[ad]; if (!t) { yukle(ad); return; }
  const simdi = ctx.currentTime, aralik = s.aralik ?? 0.06;
  if (sonCalma[ad] && simdi - sonCalma[ad] < aralik) return;
  if (calan >= ENFAZLA && !(DUZEY[ad] >= 0.8)) return;
  sonCalma[ad] = simdi;
  const k = ctx.createBufferSource(); k.buffer = t;
  const sapma = s.sapma ?? 0; k.playbackRate.value = (s.hiz || 1) * (1 + (Math.random() * 2 - 1) * sapma);
  const g = ctx.createGain(); g.gain.value = (s.duzey ?? 1) * (DUZEY[ad] ?? 0.7);
  k.connect(g); g.connect(ana); calan++; k.onended = () => { calan--; g.disconnect(); };
  k.start();
}

// Savaş olayı (sim.fx biçiminde) → ses. birim: sim birimi ({ b: { h } })
export function olay(f, kaynakBirim, hedefBirim) {
  if (!ctx || !acik) return;
  switch (f.tip) {
    case 'atis': cal(kaynakBirim && kaynakBirim.b.h === 'tilki' ? 'atis_ok' : 'atis_buyu', { sapma: 0.06 }); break;
    case 'vurus':
      if (f.menzilli) cal('isabet_buyu', { sapma: 0.08 });
      else cal(YAKIN_SES[kaynakBirim && kaynakBirim.b.h] || 'vurus_pence', { sapma: 0.08, aralik: 0.04 });
      break;
    case 'yetenek': cal(YETENEK_SES[f.ad], { aralik: 0.2 }); break;
    case 'olum': cal('olum', { sapma: 0.05 }); break;
    case 'dirilis': cal('dirilis'); break;
    case 'kut': cal('kut', { aralik: 0.5 }); break;
    case 'kalkanKir': cal('kalkan_kir', { sapma: 0.05 }); break;
  }
}

export function sesAcik() { return acik; }
export function sesAc(a) {
  acik = !!a; try { localStorage.setItem('kut.ses', acik ? '1' : '0'); } catch (e) { /* depolama kapalı */ }
  if (ana) ana.gain.value = acik ? duzey : 0;
}
