// Ada prototipi — tüm sesler Web Audio ile sentezlenir (dosya yok)
let ctx = null, master, sfxBus, musBus, noiseBuf, musTimer = null, nextT = 0, step = 0;
const S = { sfx: true, music: true };
// C majör pentatonik
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];

function tone(f, t, dur, o = {}) {
  const osc = ctx.createOscillator(), g = ctx.createGain(), vol = o.vol ?? 0.3;
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + (o.att || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(o.dest || sfxBus);
  osc.start(t); osc.stop(t + dur + 0.03);
}
function noise(t, dur, o = {}) {
  const s = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true;
  bf.type = o.type || 'lowpass'; bf.frequency.setValueAtTime(o.f || 1000, t);
  if (o.f2) bf.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
  bf.Q.value = o.q ?? 1;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t + (o.att || 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bf).connect(g).connect(o.dest || sfxBus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
}
// marimba benzeri ses: temel + hızlı sönen üst kısmi
function mar(f, t, vol = 0.25, dest = sfxBus, len = 0.9) {
  tone(f, t, len, { vol, dest });
  tone(f * 4, t, 0.08, { vol: vol * 0.28, dest });
  tone(f * 2.01, t, 0.22, { vol: vol * 0.14, dest });
}

// --- arka plan döngüsü: hafif tropik marimba ---
const BARS = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
const BASS = [65.41, 55.0, 43.65, 49.0];
const ARP = [0, 1, 2, 1, 2, 0, 1, 2];
const MEL = [7, -1, -1, 5, -1, 4, -1, -1, 4, -1, 2, -1, -1, -1, -1, -1, 5, -1, -1, 4, -1, 2, -1, 1, 2, -1, -1, -1, -1, -1, -1, -1];
const E8 = 60 / 104 / 2;
function schedule() {
  if (!ctx) return;
  while (nextT < ctx.currentTime + 0.3) {
    const bar = Math.floor(step / 8) % 4, s = step % 8, ch = BARS[bar];
    mar(ch[ARP[s]] * 2, nextT, s % 2 ? 0.045 : 0.07, musBus, 0.5);
    if (s === 0 || s === 5) tone(BASS[bar] * 2, nextT, 0.45, { vol: 0.16, dest: musBus, att: 0.01 });
    if (s % 2 === 1) noise(nextT, 0.05, { type: 'highpass', f: 6500, vol: 0.022, dest: musBus });
    const m = MEL[step % 32];
    if (m >= 0 && Math.floor(step / 32) % 2 === 1) mar(PENTA[m], nextT, 0.06, musBus, 0.7);
    nextT += E8; step++;
  }
}
function startMusic() {
  if (!ctx || musTimer || !S.music) return;
  nextT = ctx.currentTime + 0.1; musTimer = setInterval(schedule, 80);
}
function stopMusic() { clearInterval(musTimer); musTimer = null; }

export const audio = {
  unlock() {
    if (ctx) { if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = S.sfx ? 1 : 0; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.55; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startMusic();
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
    });
  },
  set(key, on) {
    S[key] = !!on;
    if (!ctx) return;
    if (key === 'sfx') sfxBus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.02);
    if (key === 'music') { if (on) startMusic(); else stopMusic(); }
  },
  note(i, vol = 0.32) { if (!ctx || !S.sfx) return; mar(PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length], ctx.currentTime, vol); },
  sfx(name, arg = 0) {
    if (!ctx || !S.sfx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'click': tone(880, t, 0.06, { type: 'triangle', vol: 0.12, f2: 620 }); break;
      case 'tick': tone(1320, t, 0.07, { vol: 0.08 }); break;
      case 'go': mar(1046.5, t, 0.3); mar(1567.98, t + 0.09, 0.3); break;
      case 'jump': tone(240, t, 0.16, { type: 'triangle', vol: 0.12, f2: 560 }); break;
      case 'land': tone(200, t, 0.13, { vol: 0.42, f2: 105 }); noise(t, 0.05, { type: 'bandpass', f: 2400, q: 2, vol: 0.12 }); break;
      case 'crack':
        noise(t, 0.3, { type: 'bandpass', f: 1900, f2: 500, q: 3, vol: 0.45 });
        for (let k = 0; k < 5; k++) noise(t + k * 0.045 + Math.random() * 0.02, 0.03, { type: 'highpass', f: 2800, vol: 0.25 });
        tone(90, t + 0.05, 0.3, { vol: 0.25, f2: 50 }); break;
      case 'splash':
        noise(t, 0.75 * (arg || 1), { type: 'lowpass', f: 3200, f2: 240, vol: 0.5 * (arg || 1), att: 0.01 });
        noise(t + 0.05, 0.4, { type: 'bandpass', f: 900, f2: 300, q: 1.2, vol: 0.2 * (arg || 1) });
        tone(130, t, 0.22, { vol: 0.2, f2: 55 }); break;
      case 'whoosh': noise(t, 0.32, { type: 'bandpass', f: 420, f2: 2300, q: 1.6, vol: 0.32, att: 0.05 }); break;
      case 'thunk':
        tone(150, t, 0.2, { vol: 0.55, f2: 75 }); noise(t, 0.06, { type: 'bandpass', f: 950, q: 1.4, vol: 0.35 });
        mar(PENTA[Math.min(8, 2 + arg)], t + 0.03, 0.26); break;
      case 'ding':
        noise(t, 0.04, { type: 'highpass', f: 3500, vol: 0.3 }); tone(160, t, 0.16, { vol: 0.45, f2: 85 });
        mar(PENTA[Math.min(8, 4 + arg)], t + 0.01, 0.3); tone(PENTA[Math.min(8, 4 + arg)] * 2, t + 0.01, 0.25, { vol: 0.08 }); break;
      case 'buzz': tone(150, t, 0.3, { type: 'sawtooth', vol: 0.08, f2: 100 }); tone(155, t, 0.3, { type: 'square', vol: 0.04, f2: 98 }); break;
      case 'pop': tone(520 + arg * 220, t, 0.14, { vol: 0.28, f2: 1100 + arg * 320 }); tone(2400 + arg * 300, t + 0.05, 0.18, { vol: 0.05 }); break;
      case 'win': [0, 2, 4, 5, 7].forEach((k, i) => mar(PENTA[k], t + i * 0.085, 0.28)); break;
      case 'lantern': [5, 7, 8, 7].forEach((k, i) => tone(PENTA[k] * 1.5, t + i * 0.05, 0.4, { vol: 0.05 })); break;
      case 'record': [4, 5, 7, 8].forEach((k, i) => mar(PENTA[k], t + i * 0.07, 0.2)); break;
    }
  },
};
