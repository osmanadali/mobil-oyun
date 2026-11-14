// node kut/test/denge_benzetim.mjs [ölçek] — OYNANIS_DERINLIK.md bölüm 11 denge hedeflerinin benzetimle sınanması.
// Dört bölüm:
//   A) Bot lobisi: 8 bot izinden oluşan lobiler baştan sona (canlı oyuncu da bot). Maç süresi, elenme, savaş süresi, süre sınırı,
//      bölüm 1 canavar kaybı, botların savaş armağanları ve kaynaşmış birim taşıyan takımların ilk-4 oranı.
//   B) Ajan lobisi: web/oyun.js görüntüsüz oynatılır; canlı oyuncu kurallı bir ajandır (dükkân, deneyim, yenileme, yerleştirme, eşya,
//      kaynaştırma, armağan, Kervan, ganimet), rakipleri 7 bot izi. Ekonomi yolu (dengeli / faiz / harca), kaynaştırma (evet / hayır) ve
//      armağan seçimi (rastgele kart) maç başına tohumdan atanır. Ölçülenler: sıra, ilk-4, altın eğrisi (3.4), armağan ilk-4 oranları.
//   C) Kut hedefi: aynı savaşlarda taraf 0 Kut'u en iyi hedefe (yapay zekâ puanı, 7.4) ya da rastgele bir sağ birime verir.
//   D) Eşya taraması: test/esya_denge.cjs'in sonucu (ayrı çalıştırılır; burada okunur).
// Belirlenimci: Math.random ajan tohumuyla değiştirilir. Çıktı: test/denge_sonuc.json (rapor: test/DENGE_RAPORU.md elle yazılır).
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url), BURA = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis; globalThis.btoa = s => Buffer.from(s, 'binary').toString('base64'); globalThis.atob = s => Buffer.from(s, 'base64').toString('binary');
let depo = {}; globalThis.localStorage = { getItem: k => depo[k] ?? null, setItem: (k, v) => { depo[k] = v; } };
let rs = 1; const rastgele = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = rastgele;
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js'), L = require('../lobi.js');
const K = D.KURAL;
const { Oyun } = await import('../web/oyun.js');
const OLCEK = +(process.argv[2] || 1);
const NA = Math.round(1500 * OLCEK), NB = Math.round(1200 * OLCEK), NC = Math.round(3000 * OLCEK);
const medyan = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };
const dilim = (a, q) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))]; };
const ort = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
const out = { olcek: OLCEK };
const t0 = Date.now();

// ───────────────────────── A) bot lobisi ─────────────────────────
{
  const botLobi = (tohum, kupa) => { const iz = O.lobiIzler(kupa, tohum, [], null, null, 8); return L.lobiYeni({ ad: iz[0].ad, kupa, iz: { bot: iz[0].bot } }, iz.slice(1), tohum); };
  const bitis = [], ilkEl = [], el = [], sure = [], b1 = [0, 0]; let sinir = 0, pvp = 0;
  const arm = {}, kayn = { var: [0, 0], yok: [0, 0] };
  for (let n = 0; n < NA; n++) {
    const tohum = 500000 + n * 7717, kupa = (n * 37) % 800, lb = botLobi(tohum, kupa);
    // kaynaşmış birim: 3-3 (r 12) kadrosunda en az bir kaynaşmış birim var mı
    const kv = lb.oyuncular.map(o => L.lobiKadro(lb, o.i, 12).takim.some(b => b.f));
    while (!L.lobiBitti(lb) && lb.r < K.lobiTurTavan) {
      const rp = L.lobiTurOyna(lb, lb.r);
      for (const s of rp.sonuclar) {
        if (s.tip === 'pve') { if (L.turPlan(rp.r).bolum === 1) { b1[1]++; if (s.kazanan !== 0) b1[0]++; } continue; }
        pvp++; sure.push(s.sure); if (s.sure >= K.savasSuresi) sinir++;
      }
    }
    L.lobiSonaKadar(lb);
    const e = lb.oyuncular.filter(o => o.sira > 1).map(o => o.elenmeR).sort((a, b) => a - b);
    bitis.push(lb.r - 1); ilkEl.push(e[0]); el.push(...e);
    for (const o of lb.oyuncular) {
      const ilk4 = o.sira <= 4 ? 1 : 0;
      for (const a of L.lobiKadro(lb, o.i, 22).armagan || []) { arm[a] = arm[a] || [0, 0]; arm[a][0] += ilk4; arm[a][1]++; }
      const k = kv[o.i] ? kayn.var : kayn.yok; k[0] += ilk4; k[1]++;
    }
  }
  out.A = { N: NA, bitisMedyan: L.turAd(medyan(bitis)), bitisR: medyan(bitis), ilkElenme: L.turAd(medyan(ilkEl)), ilkElenmeR: medyan(ilkEl), elenmeMedyan: L.turAd(medyan(el)),
    savasMedyan: medyan(sure), savas90: dilim(sure, 0.9), sinirOran: sinir / pvp, b1Kayip: b1[0] / Math.max(1, b1[1]), pvp,
    armagan: Object.fromEntries(Object.entries(arm).map(([k, v]) => [k, { ilk4: v[0] / v[1], n: v[1] }])),
    kaynas: { var: kayn.var[0] / kayn.var[1], varN: kayn.var[1], yok: kayn.yok[0] / kayn.yok[1] } };
  console.log(`A) ${NA} bot lobisi, ${pvp} PvP savaşı (${((Date.now() - t0) / 1000).toFixed(0)} sn)`);
}

// ───────────────────────── B) ajan lobisi ─────────────────────────
const asilSavas = S.Savas; let ajanKut = null; // 'iyi' | 'rastgele' | null: ajanın savaşında taraf 0'ın Kut'u
S.Savas = (a, b, opt) => (ajanKut === 'iyi' ? asilSavas(a, b, { ...opt, yz: [...new Set([...(opt.yz || []), 0])] }) : asilSavas(a, b, opt));
const deger = (b) => { if (!b) return -1; const k = (h) => (D.kahraman(h) || { kademe: 1 }).kademe; const yil = [0, 1, 3, 9][b.s] || 1;
  return (k(b.h) + (b.f ? k(b.f) : 0) + (b.f2 ? k(b.f2) * 0.5 : 0)) * yil * (b.f ? 1.15 : 1) + (b.e ? b.e.length * 0.6 : 0); };
function hazirlik(o, st, R) {
  const M = o.M, r = M.tur - 1, p = L.turPlan(r), canDusuk = M.can < 35;
  // ekonomi yolu: elde tutulacak altın (yedek) ve hedef seviye (bot izi eğrisi)
  const hedefSv = Math.floor(O.izEgri(r)[0]);
  // bölüm 1: dengeli 8, biriktiren hepsini tutar (3.4: 2-1 başında 10–14 / 14)
  let yedekAltin = st.eko === 'harca' ? 0 : st.eko === 'faiz' ? (p.bolum >= 2 ? 50 : 14) : p.bolum <= 1 ? 8 : p.bolum === 2 ? 20 : p.bolum <= 4 ? 30 : 10;
  if (canDusuk) yedekAltin = st.eko === 'faiz' ? 20 : 0;
  const ayni = (h) => [...M.tahta, ...M.yedek].filter(b => b && !b.f && b.h === h && b.s === 1).length;
  const doluYedek = () => M.yedek.every(Boolean);
  const satZayif = () => { // yedeğin en zayıfı (çifti olmayan) satılır
    let en = -1, ev = Infinity; M.yedek.forEach((b, i) => { if (b && !(b.s === 1 && !b.f && ayni(b.h) >= 2)) { const v = deger(b); if (v < ev) { ev = v; en = i; } } });
    if (en < 0) return false; o.secili = { yer: 'yedek', i: en }; o.sat(); return true; };
  const al = (zorunlu) => {
    for (let i = 0; i < M.dukkan.length; i++) {
      const id = M.dukkan[i]; if (!id) continue; const kd = D.kahraman(id).kademe, cift = ayni(id) >= 1;
      const ust = !cift && kd >= Math.max(1, Math.min(3, hedefSv - 3)) && (o.tahtaSay() < o.yuva() || !doluYedek());
      if (!(cift || ust)) continue;
      if (M.altin - kd < (cift || zorunlu ? Math.min(yedekAltin, 10) : yedekAltin)) continue;
      if (doluYedek() && o.tahtaSay() >= o.yuva() && ayni(id) < 2 && !satZayif()) continue;
      o.satinAl(i);
    }
  };
  al(false);
  // deneyim: hedef seviyeye kadar (faiz yolunda yalnız 50'nin üstündeki altınla; harca yolunda hedefin 1 üstü)
  const svHedef = st.eko === 'harca' ? Math.min(8, hedefSv + 1) : hedefSv;
  while (M.seviye < svHedef && M.seviye < K.seviyeTavan && M.altin - o.xpBedel() >= yedekAltin && p.bolum >= 2) o.xpAl();
  if (st.eko === 'faiz' && !canDusuk) while (M.seviye < K.seviyeTavan && M.altin - o.xpBedel() >= 50 && M.seviye < hedefSv + 1) o.xpAl();
  // yenileme
  let n = 0;
  const yenileEsik = st.eko === 'harca' ? 2 : yedekAltin + 6;
  while (p.bolum >= 2 && M.altin - o.yenileBedel() >= (st.eko === 'harca' ? 0 : yedekAltin) && M.altin >= yenileEsik && n++ < 12) { o.yenile(); al(true); }
  // kaynaştırma: yedekte çifti olmayan ★1 ile tahtadaki aynı yıldızlı, farklı kahraman (turda en çok 1)
  if (st.kaynas && p.bolum >= 2) {
    const bi = M.yedek.findIndex(b => b && !b.f && b.s === 1 && ayni(b.h) === 1);
    if (bi >= 0) {
      const B = M.yedek[bi]; let ai = -1, av = Infinity;
      M.tahta.forEach((b, i) => { if (b && !b.f && b.s === B.s && b.h !== B.h) { const v = deger(b); if (v < av) { av = v; ai = i; } } });
      if (ai >= 0 && M.altin - o.kaynastirBedel(M.tahta[ai].h, B.h) >= Math.min(yedekAltin, 10)) { o.secili = { yer: 'tahta', i: ai }; o.kaynasMod = true; o.yuvaDokun('yedek', bi); o.secili = null; o.kaynasMod = false; }
    }
  }
  // yerleştirme: en değerli birimler tahtaya, menzile göre (online.js yerlestir); kalanlar yedeğe
  const hepsi = [...M.tahta, ...M.yedek].filter(Boolean).sort((a, b) => deger(b) - deger(a));
  const tahta = hepsi.slice(0, o.yuva()), kalan = hepsi.slice(o.yuva());
  while (kalan.length > K.yedek) { const b = kalan.pop(); M.altin += o.satisDegeri(b); o._rafEkle(b.e || []); }
  const yer = O.yerlestir(tahta.map((b, i) => ({ h: b.h, s: b.s, _i: i })));
  M.tahta = Array(12).fill(null); for (const y of yer) M.tahta[y.y * K.tahtaSutun + y.x] = tahta[y._i];
  M.yedek = Array(K.yedek).fill(null); kalan.forEach((b, i) => { M.yedek[i] = b; });
  // eşyalar: raftaki her şey en değerli tahta birimine (yarım bileşeni tamamlayan önce), sonra sıradakine
  const sirali = M.tahta.map((b, i) => [b, i]).filter(x => x[0]).sort((a, b) => deger(b[0]) - deger(a[0])).map(x => x[1]);
  for (let g = 0; g < 20 && M.esyaRaf.length; g++) {
    const ri = M.esyaRaf.findIndex(id => id !== 'sokumTasi'); if (ri < 0) break;
    const id = M.esyaRaf[ri]; let takildi = false;
    for (const ti of sirali) { const t = L.esyaTak(M.tahta[ti], id); if (t) { o.esyaTak(ri, 'tahta', ti); takildi = true; break; } }
    if (!takildi) break;
  }
}
function secimler(o, R, st, kayit) {
  const M = o.M;
  if (M.ilkSecim) o.ilkSec(0);
  if (M.armaganSecim) { const k = Math.floor(R() * M.armaganSecim.secenek.length); kayit.armagan.push(M.armaganSecim.secenek[k]); o.armaganSec(k); }
  if (M.muhurSecim) o.muhurSec(o._enSoy());
  if (M.ganimetSecim) o.ganimetSec(0);
}
async function ajanMac(tohum, st) {
  depo = {}; rs = tohum | 0; const R = S.rng(tohum * 3 + 1);
  const o = new Oyun(); o.bildir = () => {}; o.P.kupa = (tohum * 37) % 800;
  await o.yeniMac('lobi');
  const kayit = { armagan: [], altin: {}, seviye: {}, ilk50: null, kaynasti: false, sira: 0 };
  for (let g = 0; g < 60; g++) {
    secimler(o, R, st, kayit);
    if (o.M.kervan) { await o.kervanSec(0); continue; }
    const M = o.M, r = M.tur - 1, ad = L.turAd(r);
    if (['2-1', '3-1', '4-1'].includes(ad)) { kayit.altin[ad] = { once: M.altin - (M.gelir ? M.gelir.toplam : 0), sonra: M.altin }; }
    if (kayit.ilk50 === null && M.altin >= 50) kayit.ilk50 = r;
    hazirlik(o, st, R); secimler(o, R, st, kayit);
    if (['2-1', '3-1', '4-1'].includes(ad)) kayit.seviye[ad] = M.seviye;
    if (M.tahta.some(b => b && b.f)) kayit.kaynasti = true;
    ajanKut = st.kut; const sim = o.savasHazirla(); ajanKut = null;
    if (!sim) { kayit.hata = 'savaş kurulamadı ' + ad; break; }
    const s = sim.sonunaKadar();
    const sn = o.savasBitti(s);
    if (sn.bitti) { kayit.sira = sn.sira; kayit.tur = sn.turAd; break; }
    await o.turBaslat(false);
  }
  return kayit;
}
{
  const t1 = Date.now(), sonuc = [];
  const EKO = ['dengeli', 'faiz', 'harca'];
  for (let n = 0; n < NB; n++) {
    const st = { eko: EKO[n % 3], kaynas: Math.floor(n / 3) % 2 === 0, kut: 'iyi' };
    const k = await ajanMac(900001 + n * 104729, st); sonuc.push({ st, ...k });
  }
  const grup = (f) => { const g = sonuc.filter(f); return { n: g.length, sira: ort(g.map(x => x.sira)), ilk4: ort(g.map(x => x.sira <= 4 ? 1 : 0)), birinci: ort(g.map(x => x.sira === 1 ? 1 : 0)) }; };
  const eko = Object.fromEntries(EKO.map(e => [e, grup(x => x.st.eko === e)]));
  const altinEgri = Object.fromEntries(EKO.map(e => [e, Object.fromEntries(['2-1', '3-1', '4-1'].map(a => {
    const g = sonuc.filter(x => x.st.eko === e && x.altin[a]); return [a, { once: medyan(g.map(x => x.altin[a].once)), sonra: medyan(g.map(x => x.altin[a].sonra)), seviye: medyan(g.map(x => x.seviye[a])), n: g.length }]; }))]));
  const ilk50 = Object.fromEntries(EKO.map(e => { const g = sonuc.filter(x => x.st.eko === e && x.ilk50 !== null).map(x => x.ilk50); return [e, g.length ? { medyan: L.turAd(medyan(g)), enErken: L.turAd(Math.min(...g)), oran: g.length / sonuc.filter(x => x.st.eko === e).length } : null]; }));
  const arm = {}; for (const x of sonuc) for (const a of x.armagan) { arm[a] = arm[a] || [0, 0]; arm[a][0] += x.sira <= 4 ? 1 : 0; arm[a][1]++; }
  out.B = { N: NB, sure: (Date.now() - t1) / 1000, genel: grup(() => true), eko, altinEgri, ilk50,
    kaynas: { strateji: grup(x => x.st.kaynas), yok: grup(x => !x.st.kaynas), kaynasan: grup(x => x.kaynasti), kaynasmayan: grup(x => !x.kaynasti) },
    armagan: Object.fromEntries(Object.entries(arm).sort().map(([k, v]) => [k, { ilk4: v[0] / v[1], n: v[1] }])), hata: sonuc.filter(x => x.hata).length };
  console.log(`B) ${NB} ajan maçı (${out.B.sure.toFixed(0)} sn): sıra ort ${out.B.genel.sira.toFixed(2)} · ` + EKO.map(e => `${e} ${eko[e].sira.toFixed(2)}`).join(' · '));
}

// ───────────────────────── C) Kut hedefi ─────────────────────────
{
  const v = { iyi: 0, rastgele: 0, yok: 0 };
  for (let n = 0; n < NC; n++) {
    const r = 8 + (n % 18), g1 = (n % 5) / 4, g2 = ((n * 3) % 5) / 4;
    const A = O.botIzTur(70000 + n * 13, g1, r), B = O.botIzTur(91000 + n * 17, g2, r), tohum = 3000 + n * 7;
    const base = { tohum, alamet: 'yok', gunBatimi: K.gunBatimi.basla, armagan: [L.savasArmagan(A.armagan, 100), L.savasArmagan(B.armagan, 100)] };
    const p = (s) => (s.kazanan === 0 ? 1 : s.kazanan === -1 ? 0.5 : 0);
    v.iyi += p(asilSavas(A.takim, B.takim, { ...base, yz: [0, 1] }).sonunaKadar());
    v.yok += p(asilSavas(A.takim, B.takim, { ...base, yz: [1] }).sonunaKadar());
    // rastgele: 5. sn'de (yapay zekânın ilk hakkıyla aynı an) sağ birimlerden rastgele biri; ikinci hak 12. sn'de yine rastgele
    const R = S.rng(tohum * 11 + 5), sim = asilSavas(A.takim, B.takim, { ...base, yz: [1] }); let n2 = 0;
    while (!sim.bitti && n2++ < 100000) {
      if (sim.kutVar(0) && sim.kutHazir(0) && sim.t >= (sim.kutHakSay(0) - sim.kutKalanSay(0) ? K.kut.yzZaman2 : K.kut.yzZaman) - 1e-9) {
        const sag = sim.birimler.filter(u => u.taraf === 0 && !u.olu); if (sag.length) sim.kut(0, sag[Math.floor(R() * sag.length)].i);
      }
      sim.adim();
    }
    v.rastgele += p(sim.sonuc);
  }
  out.C = { N: NC, iyi: v.iyi / NC, rastgele: v.rastgele / NC, yok: v.yok / NC, fark: (v.iyi - v.rastgele) / NC };
  console.log(`C) Kut: en iyi hedef %${(100 * out.C.iyi).toFixed(1)} · rastgele %${(100 * out.C.rastgele).toFixed(1)} · Kut yok %${(100 * out.C.yok).toFixed(1)} · fark ${(100 * out.C.fark).toFixed(1)} puan`);
}

// ───────────────────────── D) eşya taraması (esya_denge.cjs) ─────────────────────────
try { const e = JSON.parse(fs.readFileSync(path.join(BURA, 'esya_denge_sonuc.json'), 'utf8')); const tam = e.sonuc.filter(s => s.tip === 'tam');
  out.D = { N: e.N, taban: e.taban.oran, ortalama: e.ortalama, bantta: tam.filter(s => Math.abs(s.ortFark) <= 0.05).length, enGuclu: tam.slice().sort((a, b) => b.oran - a.oran).slice(0, 3).map(s => [s.ad, s.oran]), enZayif: tam.slice().sort((a, b) => a.oran - b.oran).slice(0, 3).map(s => [s.ad, s.oran]) }; } catch (e) { out.D = null; }

out.sure = (Date.now() - t0) / 1000;
fs.writeFileSync(path.join(BURA, 'denge_sonuc.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
