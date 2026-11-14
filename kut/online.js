/* KUT ARENA — rakip bulma: eşzamansız "hayalet" çevrimiçi + düello kodu + yedek bot.
   Gerçek zamanlı sunucu gerekmez: her oyuncunun her turdaki takım fotoğrafı havuza yazılır;
   rakip, aynı tur ve benzer kupadaki gerçek bir oyuncunun fotoğrafıdır. Havuz boşsa bot kurar.
   Uzak havuz için `KUT_UZAK` bağdaştırıcısı (Firebase Firestore / Supabase) takılır; yoksa yerel havuz + bot. */
(function (g) {
  const D = g.KUT_DATA || require('./data.js');
  const S = g.KUT_SIM || require('./sim.js');
  const { KAHRAMANLAR, KURAL } = D;

  // Kademe zarı: olasılık dizisinin uzunluğu kadar kademe (sabit 3 yazılmaz). r < ol[0] → 1, r < ol[0]+ol[1] → 2 …
  function kademeZar(ol, r) { let k = 1, top = ol[0]; while (k < ol.length && r >= top) { top += ol[k]; k++; } return k; }

  // ── Bot takımı: oyuncunun oynadığı aynı ekonomi kurallarına yakın, tur ve güçle ölçekli ──
  // sv verilmezse Hızlı Maç kuralı (takım boyu ve dükkân olasılığı tura bağlı); verilirse takım boyu = seviye, olasılık seviyeye bağlı.
  function botTakim(tur, tohum, guc = 0.5, sv = 0) {
    const R = S.rng(tohum * 7919 + tur * 104729);
    const yuva = sv ? KURAL.takimBoyutu(sv) : KURAL.hizli.yuva(tur);
    const soyAd = Object.keys(D.SOYLAR);
    const sevilen = [soyAd[Math.floor(R() * soyAd.length)], soyAd[Math.floor(R() * soyAd.length)]];
    const ol = sv ? KURAL.kademeOlasilik(sv) : KURAL.hizli.kademeOlasilik(tur);
    const sec = () => {
      const k = kademeZar(ol, R());
      const aday = KAHRAMANLAR.filter(h => h.kademe <= k);
      const agir = aday.map(h => (h.kademe === k ? 2 : 1) + (h.soy.some(s => sevilen.includes(s)) ? 3 : 0));
      let top = agir.reduce((a, b) => a + b, 0), x = R() * top;
      for (let i = 0; i < aday.length; i++) { x -= agir[i]; if (x <= 0) return aday[i]; }
      return aday[aday.length - 1];
    };
    const takim = []; const kullan = new Set();
    let deneme = 0;
    while (takim.length < yuva && deneme++ < 60) {
      const h = sec(); if (kullan.has(h.id)) continue; kullan.add(h.id);
      let s = 1; const p2 = Math.max(0, Math.min(0.8, (tur - 2) * 0.09 + (guc - 0.5) * 0.3));
      if (R() < p2) s = 2; if (tur >= 9 && R() < 0.12 + (guc - 0.5) * 0.2) s = 3;
      const b = { h: h.id, s };
      if (tur >= 4 && s === 1 && R() < 0.25) { const f = KAHRAMANLAR[Math.floor(R() * KAHRAMANLAR.length)]; if (f.id !== h.id && f.kademe <= Math.max(1, Math.ceil(tur / 3))) b.f = f.id; }
      takim.push(b);
    }
    return yerlestir(takim);
  }
  // ── Bot eşyaları: oyuncunun alacağı ganimetin aynısı (lobi.ganimetEsya, r'den önceki turlar), botun kendi tohumuyla.
  // Bileşenler ikişer birleşir; tam eşyalar, Kut Taşı ve artan bileşen en yüksek kademeli (kademe × yıldız) birime yığılır, 3'e dolunca sonrakine (bölüm 4.8).
  const lobiAl = () => g.KUT_LOBI || require('./lobi.js');
  function botEsya(takim, r, tohum) {
    const L = lobiAl(), bil = [], diger = [];
    for (let rr = 0; rr < r; rr++) for (const id of L.ganimetEsya(rr, S.rng(tohum * 977 + rr * 7919))) (D.esya(id).tip === 'bilesen' ? bil : diger).push(id);
    const liste = [];
    for (let i = 0; i + 1 < bil.length; i += 2) liste.push(D.tarif(bil[i], bil[i + 1]));
    for (const id of diger) if (id !== 'sokumTasi') liste.push(id);
    if (bil.length % 2) liste.push(bil[bil.length - 1]);
    const guc = (b) => D.kahraman(b.h).kademe * (b.s || 1);
    const sira = takim.map((b, i) => i).sort((a, b) => guc(takim[b]) - guc(takim[a]));
    const out = takim.map(b => ({ ...b }));
    for (const id of liste) for (const i of sira) { const t = L.esyaTak(out[i], id); if (t) { out[i].e = t.e; break; } }
    return out;
  }
  // ── Bot izi (bölüm 4.8): bütün maç boyunca tur tur kadro. Her tur saf bir işlev: botIzTur(tohum, guc, r). ──
  // Eğri (KURAL.botIz.egri) parça parça doğrusal; son satırdan sonra son eğimle, tavana kadar. Dönen: [seviye, ★2 oranı, ★3 oranı, tam eşya, kaynaşmış].
  function izEgri(r) {
    const E = KURAL.botIz.egri, T = KURAL.botIz.tavan, out = [];
    let a = 0; while (a < E.length - 2 && r >= E[a + 1][0]) a++;
    for (let c = 1; c < E[0].length; c++) {
      let v = r <= E[0][0] ? E[0][c] : E[a][c] + (E[a + 1][c] - E[a][c]) * (r - E[a][0]) / (E[a + 1][0] - E[a][0]);
      if (v > T[c]) v = T[c]; if (v < 0) v = 0;
      out.push(v);
    }
    return out;
  }
  // Eşya yığma: en güçlü (kademe × yıldız) birime, 3'e dolunca sonrakine (bölüm 4.8; botEsya ile aynı kural). out yerinde değişir.
  function esyaYig(out, liste) {
    const L = lobiAl(), guc = (b) => D.kahraman(b.h).kademe * (b.s || 1);
    const sira = out.map((b, i) => i).sort((a, b) => guc(out[b]) - guc(out[a]));
    for (const id of liste) for (const i of sira) { const t = L.esyaTak(out[i], id); if (t) { out[i].e = t.e; break; } }
    return out;
  }
  /** Bot izinin r. turu: { r, seviye, takim (x, y, e dahil), yedek: [], armagan: [], kut: null }. guc 0–1: ★2 ve eşya sayısı × (0,8 + 0,4 × guc).
      Sevilen iki soy maç boyu aynı (tohumdan); kadro her tur o turun tohumuyla kurulur. ★ önce düşük kademelilere, kaynaşma yüksek kademelilere. */
  function botIzTur(tohum, guc, r) {
    const B = KURAL.botIz, eg = izEgri(Math.max(0, r + (guc - 0.5) * B.gucTur)), f = B.gucTaban + B.gucAdim * guc;
    const sv = Math.max(KURAL.seviyeBaslangic, Math.min(KURAL.seviyeTavan, Math.floor(eg[0])));
    const Rs = S.rng(tohum * 7919 + 3), soyAd = Object.keys(D.SOYLAR);
    const sevilen = [soyAd[Math.floor(Rs() * soyAd.length)], soyAd[Math.floor(Rs() * soyAd.length)]];
    const R = S.rng(tohum * 7919 + r * 104729 + 17), ol = KURAL.kademeOlasilik(sv);
    const sec = () => {
      const k = kademeZar(ol, R());
      const aday = KAHRAMANLAR.filter(h => h.kademe <= k);
      const agir = aday.map(h => (h.kademe === k ? 2 : 1) + (h.soy.some(s => sevilen.includes(s)) ? 3 : 0));
      let top = agir.reduce((a, b) => a + b, 0), x = R() * top;
      for (let i = 0; i < aday.length; i++) { x -= agir[i]; if (x <= 0) return aday[i]; }
      return aday[aday.length - 1];
    };
    const takim = [], kullan = new Set(); let deneme = 0;
    while (takim.length < KURAL.takimBoyutu(sv) && deneme++ < 60) { const h = sec(); if (kullan.has(h.id)) continue; kullan.add(h.id); takim.push({ h: h.id, s: 1 }); }
    const n = takim.length, kd = (i) => D.kahraman(takim[i].h).kademe;
    const n2 = Math.min(n, Math.floor(n * eg[1] * f + 0.5)), n3 = Math.min(n2, Math.floor(n * eg[2] + 0.5));
    const sira = takim.map((b, i) => i).sort((a, b) => kd(a) - kd(b));
    for (let k = 0; k < n2; k++) takim[sira[k]].s = k < n3 ? 3 : 2;
    const kay = Math.floor(eg[4] + 0.5), fKul = [];
    for (let k = 0; k < kay && k < n; k++) {
      const j = sira[n - 1 - k], aday = KAHRAMANLAR.filter(h => !kullan.has(h.id) && !fKul.includes(h.id) && h.kademe <= kd(j));
      if (!aday.length) continue;
      const fh = aday[Math.floor(R() * aday.length)]; takim[j].f = fh.id; fKul.push(fh.id);
    }
    const tam = Math.floor(eg[3] * f + 0.5), bil = r < 1 ? 0 : tam === 0 ? Math.min(B.bilesen, r) : 1, liste = [];
    for (let k = 0; k < tam; k++) liste.push(D.ESYALAR[Math.floor(R() * D.ESYALAR.length)].id);
    for (let k = 0; k < bil; k++) liste.push(D.BILESENLER[Math.floor(R() * D.BILESENLER.length)].id);
    return { r, seviye: sv, takim: yerlestir(esyaYig(takim, liste)), yedek: [], armagan: [], kut: null };
  }
  function botIz(tohum, guc, n = 40) { return Array.from({ length: n }, (_, r) => botIzTur(tohum, guc, r)); }
  /** Kayıtlı izin r. turu (bölüm 4.7): r'ye kadarki en son tur (yoksa ilk tur). İz tükendiyse (r, izdeki son turdan büyük) her ek tur
      ★'ı en düşük birim (eşitlikte en soldaki, sonra dizi sırası) bir ★ yükselir, en çok ★2'ye; her bölüm değişiminde 1 tam eşya kazanır. */
  function izTur(iz, r) {
    const l = (iz && iz.turlar) || []; if (!l.length) return null;
    let son = null, ilk = l[0], enSon = l[0];
    for (const t of l) { if (t.r <= r && (!son || t.r > son.r)) son = t; if (t.r < ilk.r) ilk = t; if (t.r > enSon.r) enSon = t; }
    if (!son) son = ilk;
    const takim = son.takim.map(b => ({ ...b, ...(b.e ? { e: b.e.slice() } : {}) }));
    if (r > enSon.r) {
      for (let k = 0; k < r - son.r; k++) {
        let j = -1;
        for (let i = 0; i < takim.length; i++) { const s = takim[i].s || 1; if (s >= 2) continue; if (j < 0 || s < (takim[j].s || 1) || (s === (takim[j].s || 1) && takim[i].x < takim[j].x)) j = i; }
        if (j < 0) break; takim[j].s = (takim[j].s || 1) + 1;
      }
      const L = lobiAl(), bf = L.turPlan(r).bolum - L.turPlan(son.r).bolum, liste = [];
      for (let k = 0; k < bf; k++) liste.push(D.ESYALAR[Math.floor(S.rng(son.r * 7919 + k * 104729 + 5)() * D.ESYALAR.length)].id);
      esyaYig(takim, liste);
    }
    return { r, seviye: son.seviye || 0, takim, yedek: son.yedek || [], armagan: son.armagan || [], kut: son.kut || null };
  }
  /** Lobi için 7 iz (bölüm 4.7): önce verilen kayıtlar (kendi izi değil, kupa ±150, aynı sürüm; oyuncu başına en çok 1; ilk 4'e girmiş izler önde),
      eksik kalan bot izi { ad, kupa, bot: {tohum, guc} }. Bot adları birbirinden farklı; güç kupadan (0,35 + kupa/2000), ±0,15 oynar. Saf, belirlenimci. */
  function lobiIzler(kupa, tohum, kayitlar, oyuncu, surum, adet) {
    if (adet == null) adet = KURAL.lobiBoyut - 1;
    const R = S.rng(tohum * 13 + 7), out = [], gorulen = [];
    const uygun = (kayitlar || []).filter(z => z && z.turlar && z.turlar.length && (oyuncu == null || z.oyuncu !== oyuncu)
      && Math.abs((z.kupa || 0) - kupa) <= KURAL.lobiEsles && (surum == null || z.surum === surum));
    const ilk4 = (z) => !!(z.sira && z.sira <= 4);
    for (const z of [...uygun.filter(ilk4), ...uygun.filter(z => !ilk4(z))]) {
      if (out.length >= adet) break;
      if (z.oyuncu) { if (gorulen.includes(z.oyuncu)) continue; gorulen.push(z.oyuncu); }
      out.push({ ad: z.ad || 'Hayalet', kupa: z.kupa || 0, oyuncu: z.oyuncu || null, turlar: z.turlar });
    }
    const adlar = ADLAR.slice();
    for (let i = adlar.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = adlar[i]; adlar[i] = adlar[j]; adlar[j] = t; }
    const taban = Math.max(0, Math.min(1, 0.35 + kupa / 2000));
    for (let k = 0; out.length < adet; k++) {
      const guc = Math.max(0, Math.min(1, taban + (R() - 0.5) * 0.5)), bt = Math.floor(R() * 1e9);
      out.push({ ad: adlar[k % adlar.length], kupa, bot: { tohum: bt, guc } });
    }
    return out;
  }

  // Seviyeli maçta botun seviyesi (r = 0'dan başlayan tur sırası). OYNANIS_DERINLIK.md 4.8 eğrisinin kaba hâli; bot izi gelince onun yerini alır.
  function botSeviye(r) { return r < 1 ? 2 : r < 5 ? 3 : r < 9 ? 4 : r < 12 ? 5 : r < 19 ? 6 : r < 26 ? 7 : 8; }

  // Tahta 4 sütun × 3 sıra. Yakın dövüşçüler ön sıraya, menzil 2 ortaya, menzil 3 arkaya; sıra dolunca bir sonrakine.
  // Sütun doldurma sırası 1, 2, 0, 3 (ortadan kenara). Dönen dizi: önce yakın dövüşçüler, sonra menzil 2, sonra menzil 3.
  const SUTUN = [1, 2, 0, 3];
  const SIRA_TERCIH = { 1: [0, 1, 2], 2: [1, 2, 0], 3: [2, 1, 0] };
  function yerlestir(takim) {
    const mz = (b) => Math.min(3, D.kahraman(b.h).menzil);
    const sira = [...takim.filter(b => mz(b) === 1), ...takim.filter(b => mz(b) === 2), ...takim.filter(b => mz(b) === 3)];
    const dolu = [0, 0, 0], yer = [];
    for (const b of sira) {
      for (const y of SIRA_TERCIH[mz(b)]) if (dolu[y] < KURAL.tahtaSutun) { yer.push({ ...b, x: SUTUN[dolu[y]++], y }); break; }
    }
    return yer;
  }

  // ── Düello kodu: takımı kısa bir metne sığdır (arkadaşına at, o senin takımınla dövüşsün) ──
  // KUT2-: base64(ad|h.s.f.x.y.e1,e2,e3_…) — 4×3 tahta ve eşyalar. KUT1- (eski 3×2 tahta) kodları da çözülür.
  const idx = (id) => KAHRAMANLAR.findIndex(h => h.id === id);
  function kodla(takim, ad = '') {
    const ham = takim.map(b => [idx(b.h), b.s, b.f ? idx(b.f) : -1, b.x, b.y, (b.e || []).join(',')].join('.')).join('_');
    return 'KUT2-' + btoa(unescape(encodeURIComponent((ad || '').slice(0, 14) + '|' + ham))).replace(/=+$/, '');
  }
  function coz(kod) {
    try {
      const k = kod.trim(), v2 = k.startsWith('KUT2-');
      const ic = decodeURIComponent(escape(atob(k.replace(/^KUT[12]-/, ''))));
      const [ad, ham] = ic.split('|');
      const takim = ham.split('_').map(p => {
        const parca = p.split('.');
        // ilk beş alan tam sayı olmalı (C# KutHayalet.Coz ile aynı kural: isteğe bağlı eksi, 1–6 rakam); konum eksi olamaz
        if (parca.length < 5 || !parca.slice(0, 5).every(z => /^-?[0-9]{1,6}$/.test(z))) throw new Error('bozuk');
        const [h, s, f, x, y] = parca.slice(0, 5).map(Number);
        if (!KAHRAMANLAR[h] || x < 0 || y < 0) throw new Error('bozuk');
        const b = v2 ? { h: KAHRAMANLAR[h].id, s: Math.max(1, Math.min(3, s)), x: x % KURAL.tahtaSutun, y: y % KURAL.tahtaSira }
                     : { h: KAHRAMANLAR[h].id, s: Math.max(1, Math.min(3, s)), x: x % 3, y: (y % 2) * 2 }; // KUT1: ön → ön, arka → arka
        if (f >= 0) { if (!KAHRAMANLAR[f]) throw new Error('bozuk'); b.f = KAHRAMANLAR[f].id; }
        const e = v2 && parca[5] ? parca[5].split(',').filter(Boolean) : [];
        if (e.length) b.e = e.slice(0, 3);
        return b;
      });
      return { ad, takim: takim.slice(0, v2 ? KURAL.takimTavan : 6) };
    } catch (e) { return null; }
  }

  // ── Hayalet havuzu ──
  const ANAHTAR = 'kut.havuz.v1';
  const yerel = {
    oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR) || '[]'); } catch (e) { return []; } },
    yaz(l) { try { localStorage.setItem(ANAHTAR, JSON.stringify(l.slice(-300))); } catch (e) {} },
  };
  // Maç izleri (bölüm 4.7): yerel anahtar kut.iz.v2, en çok 60 iz
  const IZ_ANAHTAR = 'kut.iz.v2', IZ_TAVAN = 60;
  const yerelIz = {
    oku() { try { return JSON.parse(localStorage.getItem(IZ_ANAHTAR) || '[]'); } catch (e) { return []; } },
    yaz(l) { try { localStorage.setItem(IZ_ANAHTAR, JSON.stringify(l.slice(-IZ_TAVAN))); } catch (e) {} },
  };
  const Hayalet = {
    /** Maç izini havuza yaz: {macId, oyuncu, ad, kupa, surum, sira?, turlar: [{r, seviye, takim, yedek, armagan, kut}]}.
        Tur sonunda kısmi, maç sonunda tam yazılır (aynı macId'nin üstüne). Uzak havuz KUT_UZAK.izYaz ile. */
    async izBirak(iz) {
      const l = yerelIz.oku().filter(z => z.macId !== iz.macId); l.push(iz); yerelIz.yaz(l);
      if (g.KUT_UZAK && g.KUT_UZAK.izYaz) try { await g.KUT_UZAK.izYaz(iz); } catch (e) {}
    },
    /** 8 kişilik lobi için 7 iz: uzak havuz (KUT_UZAK.lobiBul), sonra yerel izler, eksik kalan bot izi (lobiIzler). */
    async lobiKur({ kupa, oyuncu, tohum, surum = null }) {
      let kayit = [];
      if (g.KUT_UZAK && g.KUT_UZAK.lobiBul && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try { kayit = (await g.KUT_UZAK.lobiBul({ kupa, oyuncu, adet: KURAL.lobiBoyut - 1, surum })) || []; } catch (e) { kayit = []; }
      }
      return lobiIzler(kupa, tohum, [...kayit, ...yerelIz.oku()], oyuncu, surum);
    },
    // her tur sonunda çağrılır: kendi fotoğrafını havuza bırakır (başkalarının rakibi olur)
    async birak(kayit) { // {tur, kupa, takim, ad, oyuncu, mod, seviye?}
      const l = yerel.oku(); l.push({ ...kayit, zaman: Date.now() }); yerel.yaz(l);
      if (g.KUT_UZAK) try { await g.KUT_UZAK.yaz(kayit); } catch (e) {}
    },
    // rakip: önce uzak havuz (aynı tur, ±150 kupa, kendin değil), sonra bot
    // sv: seviyeli maçta rakibin seviyesi (verilmezse Hızlı Maç); mod: 'arena' | 'hizli' (uzak havuz ayrı tutar)
    // r: verilirse (seviyeli maç) bot, o tura kadarki eşya ganimetini taşır (botEsya)
    async bul({ tur, kupa, oyuncu, tohum, sv = 0, mod = 'hizli', r = null }) {
      if (g.KUT_UZAK && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try { const r = await g.KUT_UZAK.bul({ tur, kupa, oyuncu, mod }); if (r && r.takim && r.takim.length) return { ...r, kaynak: 'cevrimici' }; } catch (e) {}
      }
      const guc = Math.max(0, Math.min(1, 0.35 + kupa / 2000));
      const takim = botTakim(tur, tohum, guc, sv);
      return { ad: botAd(tohum + tur), takim: r !== null && r > 0 ? botEsya(takim, r, tohum) : takim, kupa, kaynak: 'bot', ...(sv ? { seviye: sv } : {}) };
    },
  };
  const ADLAR = ['Kara Bulut', 'Ak Doğan', 'Demir Yay', 'Mavi Kıvılcım', 'Yalın Kılıç', 'Gece Rüzgârı', 'Taş Yürek', 'Ay Kaya', 'Sessiz Ok', 'Kor Göz', 'Bulut Avcısı', 'Buz Pençe'];
  const botAd = (n) => ADLAR[Math.abs(n) % ADLAR.length];

  const api = { botTakim, botEsya, botSeviye, kademeZar, yerlestir, kodla, coz, Hayalet, izEgri, botIzTur, botIz, izTur, lobiIzler };
  g.KUT_ONLINE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
