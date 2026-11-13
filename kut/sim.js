/* KUT ARENA — belirlenimci savaş motoru (tarayıcı + node).
   Aynı takımlar + aynı tohum + aynı Kut dokunuşları → hep aynı sonuç. Bu sayede:
   - eşzamansız çevrimiçi: rakibin takım fotoğrafı sunucudan gelir, savaş cihazda oynanır, sonuç doğrulanabilir;
   - tekrar izleme / paylaşım: (takımlar, tohum, dokunuşlar) üçlüsü bir savaşı baştan oynatır. */
(function (g) {
  const D = g.KUT_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const { SOYLAR, KURAL } = D;

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // Takım birimi: { h: kahramanId, s: yıldız 1..3, f?: kaynaşan kahramanId (pasif + soy ondan), x: 0..2, y: 0 ön | 1 arka }
  function birimStat(b) {
    const A = D.kahraman(b.h), B = b.f ? D.kahraman(b.f) : null;
    const c = KURAL.yildizCarpan[b.s || 1];
    let can = A.can, atk = A.atk, as = A.as;
    if (B) { can = (A.can + B.can) / 2 * 1.15; atk = (A.atk + B.atk) / 2 * 1.15; as = (A.as + B.as) / 2; }
    const soy = B ? [...new Set([...A.soy, ...B.soy])] : A.soy.slice();
    return { ad: B ? A.ad + ' × ' + B.ad : A.ad, can: Math.round(can * c), atk: Math.round(atk * c), as, menzil: A.menzil, mana: A.mana,
      yetenek: A.yetenek, pasif: B ? B.pasif : A.pasif, soy, kc: c };
  }

  function soySay(takim) {
    const say = {};
    for (const b of takim) {
      // aynı kahraman iki kez sayılmaz (TFT kuralı); kaynaşmış birim kendi kimliğiyle sayılır
      for (const s of birimStat(b).soy) { say[s] = say[s] || new Set(); say[s].add(b.h + (b.f ? '+' + b.f : '')); }
    }
    const out = {};
    for (const k in say) { const n = say[k].size, e = SOYLAR[k].esik; out[k] = { n, seviye: n >= e[1] ? 2 : n >= e[0] ? 1 : 0 }; }
    return out;
  }

  function Savas(takimA, takimB, opt = {}) {
    const R = rng(opt.tohum || 1);
    const alamet = opt.alamet || 'yok';
    const birimler = [];
    const fx = [];
    let t = 0, bitti = false, sonuc = null;
    const soylar = [soySay(takimA), soySay(takimB)];
    const sv = (taraf, soy) => (soylar[taraf][soy] || {}).seviye || 0;

    [takimA, takimB].forEach((takim, taraf) => {
      takim.forEach((b, i) => {
        const st = birimStat(b);
        // arena: genişlik 6, yükseklik 8. Taraf 0 altta (ön y=5, arka y=6.6), taraf 1 üstte (ön y=3, arka y=1.4).
        const x = b.x * 2 + 1, y = taraf === 0 ? (b.y ? 6.6 : 5) : (b.y ? 1.4 : 3);
        let can = st.can;
        const y1 = sv(taraf, 'yer'); can += [0, 150, 400][y1] * (st.kc > 1 ? 1 : 1);
        if (alamet === 'tutulma' && st.soy.includes('karanlik')) can *= 1.3;
        if (alamet === 'yaz' && st.soy.includes('kis')) can *= 0.85;
        can = Math.round(can);
        birimler.push({ uid: taraf * 10 + i, taraf, i, b, ...st, mx: can, hp: can, x, y, x0: x, y0: y,
          mp: 0, cd: 0.3 + R() * 0.3, durum: {}, kalkan: 0, olu: false, dirildi: false, vurus: 0, payYigin: 0, ofke: 0, hedef: null });
      });
    });

    // Savaş başı etkileri
    for (const u of birimler) {
      if (u.pasif === 'kisNefesi') u.mp = u.mana * 0.5;
      if (alamet === 'kutYagmur') u.mp = Math.max(u.mp, u.mana * 0.4);
      if (u.pasif === 'ana') for (const d of dostlar(u)) if (d !== u && mesafe(u, d) <= 2.6) kalkanVer(d, 90 * u.kc);
    }

    function dostlar(u) { return birimler.filter(o => o.taraf === u.taraf && !o.olu); }
    function dusmanlar(u) { return birimler.filter(o => o.taraf !== u.taraf && !o.olu); }
    function mesafe(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function enYakin(u) { let en = null, m = 1e9; for (const o of dusmanlar(u)) { const d = mesafe(u, o) + o.i * 1e-4; if (d < m) { m = d; en = o; } } return en; }
    function kalkanVer(u, n) { u.kalkan += n; fx.push({ t, tip: 'kalkan', u: u.uid, n: Math.round(n) }); }
    function iyiles(u, n) { if (u.olu) return; const v = Math.min(u.mx - u.hp, n); u.hp += v; if (v > 1) fx.push({ t, tip: 'iyi', u: u.uid, n: Math.round(v) }); }
    function durumVer(u, ad, sure, deger) { const d = u.durum[ad]; if (!d || d.sure < sure || (deger || 0) > (d.deger || 0)) u.durum[ad] = { sure, deger }; }
    function menzil(u) { let m = u.menzil; if (alamet === 'sis' && m > 1) m -= 1; return m; }
    function hizCarpan(u) {
      let k = 1 + [0, 0.15, 0.35][sv(u.taraf, 'gok') && u.soy.includes('gok') ? sv(u.taraf, 'gok') : 0];
      const atl = sv(u.taraf, 'atli'); if (atl && u.soy.includes('atli') && t < 4) k += [0, 0.4, 0.9][atl];
      if (u.pasif === 'ruzgar' && t < 5) k += 0.35;
      if (u.durum.uluma) k += 0.45;
      const kis = sv(1 - u.taraf, 'kis'); if (kis) k -= [0, 0.15, 0.3][kis];
      if (u.durum.yavas) k -= u.durum.yavas.deger;
      if (alamet === 'tipi' && !u.soy.includes('kis')) k -= 0.2;
      return Math.max(0.25, k);
    }

    function hasar(kaynak, hedef, miktar, tur) {
      if (hedef.olu) return 0;
      let m = miktar;
      if (kaynak) {
        const av = sv(kaynak.taraf, 'avci'); if (av && kaynak.soy.includes('avci')) m *= 1 + [0, 0.2, 0.45][av];
        const kr = sv(kaynak.taraf, 'karanlik'); if (kr && hedef.hp < hedef.mx * 0.5) m *= 1 + [0, 0.2, 0.5][kr];
        if (alamet === 'kanAyi') m *= 1.2;
        if (kaynak.durum.davul) m *= 1.3;
        if (kaynak.durum.lanet) m *= 0.55;
        if (kaynak.pasif === 'deliCesaret' && kaynak.hp < kaynak.mx * 0.5) m *= 1.5;
        if (kaynak.pasif === 'avKoku' && hedef.hp < hedef.mx * 0.3) m *= 2;
        if (kaynak.pasif === 'suru') m *= 1 + 0.06 * (dostlar(kaynak).length - 1);
        if (kaynak.payYigin) m *= 1 + 0.12 * kaynak.payYigin;
        if (tur === 'vurus' && kaynak.ofke > 0) { m *= 2; kaynak.ofke--; }
      }
      if (tur === 'vurus' && hedef.pasif === 'kacis' && R() < 0.25) { fx.push({ t, tip: 'kac', u: hedef.uid }); return 0; }
      const dv = sv(hedef.taraf, 'dev'); if (dv && hedef.soy.includes('dev')) m *= 1 - [0, 0.12, 0.28][dv];
      if (hedef.pasif === 'tasDeri') m *= 0.8;
      if (hedef.kalkan > 0) { const e = Math.min(hedef.kalkan, m); hedef.kalkan -= e; m -= e; }
      m = Math.max(0, m);
      hedef.hp -= m;
      if (tur !== 'dot') hedef.mp = Math.min(hedef.mana, hedef.mp + m * 0.05);
      if (m >= 1) fx.push({ t, tip: tur === 'dot' ? 'dot' : 'hasar', u: hedef.uid, n: Math.round(m), k: kaynak ? kaynak.uid : -1 });
      if (kaynak && kaynak.pasif === 'canEmici' && tur !== 'dot') iyiles(kaynak, m * 0.2);
      if (hedef.hp <= 0) olum(hedef, kaynak);
      return m;
    }

    function olum(u, katil) {
      if (u.pasif === 'yenidenDogus' && !u.dirildi) { u.dirildi = true; u.hp = u.mx * 0.4; u.durum = {}; fx.push({ t, tip: 'dirilis', u: u.uid }); return; }
      u.olu = true; u.hp = 0; fx.push({ t, tip: 'olum', u: u.uid });
      for (const d of birimler) {
        if (d.olu) continue;
        if (d.taraf === u.taraf && d.pasif === 'ruhBagi') d.mp = Math.min(d.mana, d.mp + 35);
        if (d.taraf !== u.taraf && d.pasif === 'karanlikPay') d.payYigin++;
      }
    }

    function vurusEtki(u, h) {
      const od = sv(u.taraf, 'ates');
      if (od && u.soy.includes('ates')) durumVer(h, 'yanik', [0, 2, 3][od], [0, 12, 28][od] * (alamet === 'yaz' ? 2 : 1));
      if (u.pasif === 'zehirDis') durumVer(h, 'zehir', 3, 18 * u.kc);
      if (u.pasif === 'soguk') durumVer(h, 'yavas', 2, 0.2);
      if (u.pasif === 'gokGurultu' && u.vurus % 4 === 0) {
        const yak = dusmanlar(u).filter(o => o !== h).sort((a, b) => mesafe(h, a) - mesafe(h, b)).slice(0, 2);
        for (const o of yak) { hasar(u, o, u.atk * 0.7, 'yetenek'); fx.push({ t, tip: 'simsek', k: h.uid, u: o.uid }); }
      }
    }

    function yetenek(u) {
      const c = u.kc, h = u.hedef && !u.hedef.olu ? u.hedef : enYakin(u);
      fx.push({ t, tip: 'yetenek', u: u.uid, ad: u.yetenek });
      const cevre = (merkez, r) => dusmanlar(u).filter(o => mesafe(o, merkez) <= r);
      switch (u.yetenek) {
        case 'tasFirlat': if (h) { hasar(u, h, 200 * c, 'yetenek'); durumVer(h, 'sersem', 1.5); } break;
        case 'uluma': for (const d of dostlar(u)) if (mesafe(d, u) <= 2.1) durumVer(d, 'uluma', 4); break;
        case 'davul': for (const d of dostlar(u)) durumVer(d, 'davul', 4); break;
        case 'ruhEmme': if (h) { const v = hasar(u, h, 170 * c, 'yetenek'); iyiles(u, v); } break;
        case 'kasirga': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 110 * c, 'yetenek'); o.y += (o.taraf === 0 ? 1.5 : -1.5); o.y = Math.max(0.4, Math.min(7.6, o.y)); } break;
        case 'deliOfke': u.ofke = 3; iyiles(u, u.mx * 0.2); break;
        case 'zehir': if (h) durumVer(h, 'zehir', 4, 55 * c); { const y = dostlar(u).sort((a, b) => a.hp / a.mx - b.hp / b.mx)[0]; if (y) iyiles(y, 160 * c); } break;
        case 'buzNefes': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 120 * c, 'yetenek'); durumVer(o, 'sersem', 1.2); } break;
        case 'ocak': for (const o of cevre(u, 2.2)) durumVer(o, 'yanik', 4, 40 * c); for (const d of dostlar(u)) if (mesafe(d, u) <= 2.2) iyiles(d, 110 * c); break;
        case 'dortnal': { const arka = dusmanlar(u).sort((a, b) => mesafe(u, b) - mesafe(u, a))[0]; if (arka) { u.x = arka.x; u.y = arka.y + (u.taraf === 0 ? 0.8 : -0.8); u.hedef = arka; hasar(u, arka, 190 * c, 'yetenek'); } } break;
        case 'kanat': for (const d of dostlar(u)) kalkanVer(d, 140 * c); break;
        case 'karaGolge': { const g2 = dusmanlar(u).sort((a, b) => b.atk - a.atk)[0]; if (g2) { hasar(u, g2, 140 * c, 'yetenek'); durumVer(g2, 'lanet', 5); } } break;
        case 'kulDogus': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 170 * c, 'yetenek'); durumVer(o, 'yanik', 3, 25 * c); } break;
        case 'ayaz': for (const o of dusmanlar(u)) { hasar(u, o, 70 * c, 'yetenek'); durumVer(o, 'yavas', 3, 0.4); } break;
        case 'golgeOk': { const z = dusmanlar(u).sort((a, b) => a.hp - b.hp)[0]; if (z) hasar(u, z, 320 * c, 'yetenek'); } break;
        case 'yildirim': { const ds = dusmanlar(u); for (let k = 0; k < 3 && ds.length; k++) { const o = ds.splice(Math.floor(R() * ds.length), 1)[0]; hasar(u, o, 150 * c, 'yetenek'); durumVer(o, 'sersem', 0.6); fx.push({ t, tip: 'simsek', k: u.uid, u: o.uid }); } } break;
      }
    }

    // Kut: savaş başına bir kez, kendi biriminin manasını anında doldurur (oyuncunun tek müdahalesi).
    const kutKullanildi = [false, false];
    const kutSira = (opt.kut || []).slice().sort((a, b) => a.t - b.t); // [{t, taraf, i}]
    function kut(taraf, i) {
      if (kutKullanildi[taraf] || bitti) return false;
      const u = birimler.find(o => o.taraf === taraf && o.i === i && !o.olu); if (!u) return false;
      kutKullanildi[taraf] = true; u.mp = u.mana; fx.push({ t, tip: 'kut', u: u.uid });
      if (opt.kayit) opt.kayit.push({ t: +t.toFixed(2), taraf, i });
      return true;
    }
    // Yapay zekâ Kut'u: 5. saniyede manası en uzak, yeteneği en güçlü birime
    function kutYZ(taraf) {
      const ad = birimler.filter(o => o.taraf === taraf && !o.olu).sort((a, b) => (b.mana - b.mp) * b.kc - (a.mana - a.mp) * a.kc)[0];
      if (ad) kut(taraf, ad.i);
    }

    const DT = 0.05;
    function adim() {
      if (bitti) return;
      fx.length = 0;
      while (kutSira.length && kutSira[0].t <= t + 1e-9) { const k = kutSira.shift(); kut(k.taraf, k.i); }
      for (const tr of (opt.yz || [])) if (!kutKullanildi[tr] && t >= (opt.yzZaman || 5)) kutYZ(tr);

      for (const u of birimler) {
        if (u.olu) continue;
        for (const k in u.durum) { u.durum[k].sure -= DT; if (u.durum[k].sure <= 0) delete u.durum[k]; }
        if (u.durum.yanik) hasar(null, u, u.durum.yanik.deger * DT, 'dot');
        if (u.durum.zehir && !u.olu) hasar(null, u, u.durum.zehir.deger * DT, 'dot');
        if (u.olu) continue;
        const su = sv(u.taraf, 'su'); if (su && u.soy.includes('su')) iyilesSessiz(u, u.mx * [0, 0.02, 0.05][su] * DT);
        if (u.pasif === 'sicakKalp') iyilesSessiz(u, u.mx * 0.03 * DT);
        if (u.durum.sersem) continue;

        if (u.mp >= u.mana) { u.mp = 0; yetenek(u); if (bittiMi()) return; continue; }
        if (!u.hedef || u.hedef.olu || t % 0.5 < DT) u.hedef = enYakin(u);
        const h = u.hedef; if (!h) continue;
        const d = mesafe(u, h);
        if (d > menzil(u) + 0.05) {
          const hiz = (u.soy.includes('atli') ? 2.4 : 1.7) * DT;
          u.x += (h.x - u.x) / d * Math.min(hiz, d - menzil(u));
          u.y += (h.y - u.y) / d * Math.min(hiz, d - menzil(u));
        } else {
          u.cd -= DT * hizCarpan(u);
          if (u.cd <= 0) {
            u.cd = 1 / u.as; u.vurus++;
            fx.push({ t, tip: 'vurus', k: u.uid, u: h.uid, menzilli: u.menzil > 1 });
            hasar(u, h, u.atk, 'vurus');
            if (!h.olu) vurusEtki(u, h);
            const bl = sv(u.taraf, 'bilge') && u.soy.includes('bilge') ? [0, 0.3, 0.7][sv(u.taraf, 'bilge')] : 0;
            u.mp = Math.min(u.mana, u.mp + 10 * (1 + bl));
          }
        }
        if (bittiMi()) return;
      }
      t += DT;
      if (t >= KURAL.savasSuresi) {
        const oran = [0, 1].map(tr => birimler.filter(o => o.taraf === tr).reduce((s, o) => s + Math.max(0, o.hp) / o.mx, 0));
        const fark = oran[0] - oran[1];
        bitir(Math.abs(fark) < 0.05 ? -1 : fark > 0 ? 0 : 1);
      }
    }
    function iyilesSessiz(u, n) { u.hp = Math.min(u.mx, u.hp + n); }
    function bittiMi() {
      const a = birimler.some(o => o.taraf === 0 && !o.olu), b = birimler.some(o => o.taraf === 1 && !o.olu);
      if (a && b) return false; bitir(a ? 0 : b ? 1 : -1); return true;
    }
    function bitir(k) {
      bitti = true;
      const kalan = birimler.filter(o => !o.olu && o.taraf === k).reduce((s, o) => s + o.kc * D.kahraman(o.b.h).kademe, 0);
      sonuc = { kazanan: k, sure: +t.toFixed(2), kalan };
    }
    function sonunaKadar() { let n = 0; while (!bitti && n++ < 100000) adim(); return sonuc; }

    return { birimler, fx, adim, sonunaKadar, kut, get t() { return t; }, get bitti() { return bitti; }, get sonuc() { return sonuc; },
      kutVar: (taraf) => !kutKullanildi[taraf], soylar, DT };
  }

  const api = { Savas, birimStat, soySay, rng };
  g.KUT_SIM = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
