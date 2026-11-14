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
        const parca = p.split('.'); const [h, s, f, x, y] = parca.slice(0, 5).map(Number);
        if (!KAHRAMANLAR[h] || !Number.isInteger(x) || !Number.isInteger(y)) throw new Error('bozuk');
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
  const Hayalet = {
    // her tur sonunda çağrılır: kendi fotoğrafını havuza bırakır (başkalarının rakibi olur)
    async birak(kayit) { // {tur, kupa, takim, ad, oyuncu, mod, seviye?}
      const l = yerel.oku(); l.push({ ...kayit, zaman: Date.now() }); yerel.yaz(l);
      if (g.KUT_UZAK) try { await g.KUT_UZAK.yaz(kayit); } catch (e) {}
    },
    // rakip: önce uzak havuz (aynı tur, ±150 kupa, kendin değil), sonra bot
    // sv: seviyeli maçta rakibin seviyesi (verilmezse Hızlı Maç); mod: 'arena' | 'hizli' (uzak havuz ayrı tutar)
    async bul({ tur, kupa, oyuncu, tohum, sv = 0, mod = 'hizli' }) {
      if (g.KUT_UZAK && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try { const r = await g.KUT_UZAK.bul({ tur, kupa, oyuncu, mod }); if (r && r.takim && r.takim.length) return { ...r, kaynak: 'cevrimici' }; } catch (e) {}
      }
      const guc = Math.max(0, Math.min(1, 0.35 + kupa / 2000));
      return { ad: botAd(tohum + tur), takim: botTakim(tur, tohum, guc, sv), kupa, kaynak: 'bot', ...(sv ? { seviye: sv } : {}) };
    },
  };
  const ADLAR = ['Kara Bulut', 'Ak Doğan', 'Demir Yay', 'Mavi Kıvılcım', 'Yalın Kılıç', 'Gece Rüzgârı', 'Taş Yürek', 'Ay Kaya', 'Sessiz Ok', 'Kor Göz', 'Bulut Avcısı', 'Buz Pençe'];
  const botAd = (n) => ADLAR[Math.abs(n) % ADLAR.length];

  const api = { botTakim, botSeviye, kademeZar, yerlestir, kodla, coz, Hayalet };
  g.KUT_ONLINE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
