/* KUT ARENA — seviyeli maçın saf, belirlenimci kuralları (tarayıcı + node). C# karşılığı: unity/Kod/KutLobi.cs.
   Şimdilik: deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3),
   tur planı (1.1), birikimli ekonomi (3: gelir, faiz, seri, galibiyet, ganimet altını), kaybedince alınan hasar (4.4),
   eşya kuralları (5.1), canavar dalgaları (5.5), ganimet ve Kervan seçenekleri (5.4), bölüm 1'in bedava kahraman seçimi (1.1).
   8 kişilik hayalet lobi (bölüm 4, 12.4): lobi kurma, eşleşme sırası ve Yansıma, hayalet × hayalet savaşları, lobi hasarı, elenme,
   sıralama ve kupa, lobi alameti, lobide havuz (C# karşılığı: unity/Kod/KutLobiOda.cs). Bot izi ve kayıtlı iz online.js'te.
   Kurallar: Math.random / Date yok; rastgelelik yalnız dışarıdan verilen mulberry32 (sim.rng) ile; döngüler hep KAHRAMANLAR sırasıyla. */
(function (g) {
  const D = g.KUT_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const K = D.KURAL;

  // ── Deneyim ──
  // Sonraki seviyeye gereken deneyim (tavanda 0).
  function xpGerek(seviye) { return seviye >= K.seviyeTavan ? 0 : K.xpTablo[seviye]; }
  // Deneyim ekler; artan deneyim sonraki seviyeye taşınır. Tavanda deneyim 0 kalır.
  function xpEkle(seviye, xp, miktar) {
    let sv = seviye, x = xp + miktar;
    while (sv < K.seviyeTavan && x >= K.xpTablo[sv]) { x -= K.xpTablo[sv]; sv++; }
    if (sv >= K.seviyeTavan) { sv = K.seviyeTavan; x = 0; }
    return { seviye: sv, xp: x };
  }

  // ── Kahraman havuzu ──
  // Bir birim listesinin havuzdan tuttuğu kopyalar: ★1 = 1, ★2 = 3, ★3 = 9; kaynaşmış birimin ikinci kahramanı 1 kopya.
  function kopyaSay(birimler, say = {}) {
    for (const b of birimler) {
      if (!b) continue;
      say[b.h] = (say[b.h] || 0) + K.yildizKopya[b.s || 1];
      if (b.f) say[b.f] = (say[b.f] || 0) + 1;
      if (b.f && b.f2) say[b.f2] = (say[b.f2] || 0) + 1; // Üçlü Kaynaşma'nın üçüncü kahramanı da 1 kopya
    }
    return say;
  }
  // Kalan kopya: havuzAdet(kademe) − bütün grupların (oyuncu, hayaletler) tuttuğu kopyalar. 0'ın altına inmez.
  function havuzKalan(gruplar) {
    const say = {};
    for (const l of gruplar) kopyaSay(l, say);
    const out = {};
    for (const h of D.KAHRAMANLAR) out[h.id] = Math.max(0, K.havuzAdet[h.kademe] - (say[h.id] || 0));
    return out;
  }

  // ── Dükkân ──
  function kademeZar(ol, r) { let k = 1, top = ol[0]; while (k < ol.length && r >= top) { top += ol[k]; k++; } return k; }
  // Seviyeye göre kademe zarı, sonra o kademede kalan kopyayla ağırlıklı seçim. Kademede kopya kalmadıysa bir alt kademe.
  // Dükkâna çıkan kart, o çekim boyunca havuzdan düşülür (aynı kahramanın kalandan fazla kartı çıkmaz). Hiç kopya yoksa yuva boş (null).
  // R: sim.rng(tohum). Her yuva için 1 zar (kademe) + kopya varsa 1 zar (seçim).
  function dukkanCek(seviye, kalan, R, adet = K.dukkan) {
    const k = {}; for (const h of D.KAHRAMANLAR) k[h.id] = kalan[h.id] || 0;
    const ol = K.kademeOlasilik(seviye), out = [];
    for (let n = 0; n < adet; n++) {
      let kd = kademeZar(ol, R()), aday = [], top = 0;
      for (; kd >= 1; kd--) {
        aday = D.KAHRAMANLAR.filter(h => h.kademe === kd && k[h.id] > 0);
        top = aday.reduce((s, h) => s + k[h.id], 0);
        if (top > 0) break;
      }
      if (top <= 0) { out.push(null); continue; }
      let x = R() * top, sec = aday[aday.length - 1];
      for (const h of aday) { x -= k[h.id]; if (x < 0) { sec = h; break; } }
      k[sec.id]--; out.push(sec.id);
    }
    return out;
  }

  // ── Tur planı (bölüm 1.1). r 0'dan başlar: 0–2 → 1-1…1-3 (canavar); sonra her bölüm 7 tur, x-4 Kervan, x-7 canavar. ──
  function turPlan(r) {
    if (r < K.bolum1Tur) return { r, bolum: 1, tur: r + 1, tip: 'pve', armagan: false };
    const q = r - K.bolum1Tur, bolum = 2 + Math.floor(q / K.bolumTur), tur = (q % K.bolumTur) + 1;
    const tip = tur === K.kervanTur ? 'kervan' : tur === K.canavarTur ? 'pve' : 'pvp';
    return { r, bolum, tur, tip, armagan: K.armaganTur[bolum] === tur };
  }
  function turAd(r) { const p = turPlan(r); return p.bolum + '-' + p.tur; }

  // ── Ekonomi (bölüm 3) ──
  function tabanGelir(r) { const p = turPlan(r); return p.bolum === 1 ? K.tabanGelirBolum1[p.tur - 1] : K.tabanGelir; }
  // Faiz gelir eklenmeden önceki altına göre: her 10 altına 1, en çok 5. Bölüm 1'de faiz yok.
  // tavan: faiz tavanı (Bereket Küpü armağanıyla 7; verilmezse 5).
  function faiz(altin, r, tavan) { return turPlan(r).bolum === 1 ? 0 : Math.min(tavan || K.faizTavan, Math.floor(Math.max(0, altin) / K.faizAdim)); }
  // Seri bonusu: n = 0–1 → 0, 2 → 1, 3–4 → 2, 5+ → 3 (kazanma da kaybetme serisi de).
  function seriBonus(n) { return K.seriTablo[Math.max(0, Math.min(n, K.seriTablo.length - 1))]; }
  /** Hazırlık başı geliri. seri: {tip: 'G'|'M'|null, n}; galibiyet: önceki PvP savaşı kazanıldı mı; alamet: bu turun alameti.
      Kervan turunda gelir yoktur. */
  function gelirHesapla(r, altin, seri, galibiyet, alamet, faizTavan) {
    const g = { taban: 0, faiz: 0, seri: 0, galibiyet: 0, alamet: 0, toplam: 0 };
    if (turPlan(r).tip === 'kervan') return g;
    g.taban = tabanGelir(r); g.faiz = faiz(altin, r, faizTavan); g.seri = seriBonus(seri ? seri.n : 0);
    g.galibiyet = galibiyet ? K.galibiyetBonus : 0; g.alamet = alamet === 'pazar' ? K.pazarBonus : 0;
    g.toplam = g.taban + g.faiz + g.seri + g.galibiyet + g.alamet;
    return g;
  }
  // Seri yalnız PvP sonuçlarıyla sayılır; beraberlik ve canavar turu seriyi bozmaz, uzatmaz. kazanan: 0 bu taraf, 1 rakip, -1 berabere.
  function seriGuncelle(seri, kazanan, tip) {
    const s = { tip: seri ? seri.tip : null, n: seri ? seri.n : 0 };
    if (tip !== 'pvp' || (kazanan !== 0 && kazanan !== 1)) return s;
    const t = kazanan === 0 ? 'G' : 'M';
    return s.tip === t ? { tip: t, n: s.n + 1 } : { tip: t, n: 1 };
  }
  // Kaynaştırma bedeli: 2 + iki kahramanın en yüksek kademesi (3–5).
  function kaynastirBedel(ka, kb) { return K.kaynastirTaban + Math.max(ka, kb || 0); }
  // Turun ganimet planı (bölüm 5.4): GANIMET['bölüm-tur'], 6. bölüm ve sonrası GANIMET_GEC[tur]. Kervan turunda boş (seçenekler kervanSecenek'te).
  function ganimetPlan(r) {
    const p = turPlan(r);
    return (p.bolum >= K.ganimetGecBolum ? K.ganimetGec[p.tur] : K.ganimet[p.bolum + '-' + p.tur]) || [];
  }
  // Ganimetin sabit altın kısmı (bölüm 5.4): turSonu ekler. Zarftan çıkan altın ganimet().ekAltin'dedir.
  function ganimetAltin(r) { return ganimetPlan(r).reduce((s, x) => s + (x.tip === 'altin' ? x.n : 0), 0); }

  // ── Kaybedince alınan hasar (bölüm 4.4) ──
  function bolumTaban(bolum, yasayan) {
    const t = K.bolumTabani[Math.min(bolum, K.bolumTabani.length - 1)];
    return t + (yasayan === 2 ? K.sonIkiEk : yasayan === 3 ? K.sonUcEk : 0);
  }
  /** [taraf 0'ın hasarı, taraf 1'in hasarı]. PvP: kaybeden taban + kalanPuan, beraberlikte ikisi de taban.
      Canavar turu: yalnız taraf 0 (oyuncu) can kaybeder: taban + kalan canavar sayısı; bölüm 1'de hasar yok. Kervan: 0.
      yasayan: lobide kalan oyuncu (3 → Son Üç, 2 → Son İki); verilmezse ek yok. */
  function kayipHasar(r, kazanan, kalanPuan, kalanSayi, yasayan) {
    const p = turPlan(r);
    if (p.tip === 'kervan' || (p.tip === 'pve' && p.bolum === 1)) return [0, 0];
    const t = bolumTaban(p.bolum, yasayan || 0);
    if (p.tip === 'pve') return [kazanan === 0 ? 0 : kazanan === 1 ? t + kalanSayi : t, 0];
    if (kazanan === 0) return [0, t + kalanPuan];
    if (kazanan === 1) return [t + kalanPuan, 0];
    return [t, t];
  }

  // ── Tur başı ve tur sonu: oyuncu durumu d = {altin, can, seri, galibiyet, seviye, xp} yerinde değişir ──
  // (oyun.js'te maç nesnesi M, lobide her oyuncu bu alanları taşır.)
  // d.armagan (varsa): Bereket Küpü faiz tavanını 7 yapar.
  function faizTavan(armagan) { return armagan && armagan.includes('bereketKupu') ? K.armaganSayi.bereketFaiz : K.faizTavan; }
  function turBasi(d, r, alamet) { const g = gelirHesapla(r, d.altin, d.seri, d.galibiyet, alamet, faizTavan(d.armagan)); d.altin += g.toplam; return g; }
  /** Savaş sonucu (sim sonucu: kazanan, kalanPuan, kalanSayi) işlenir: hasar, seri, galibiyet, ganimet altını, savaş deneyimi.
      Galibiyet bonusu son PvP savaşına bakar; canavar turu onu değiştirmez. Deneyim 1-1 sonunda ve Kervan'da gelmez. */
  function turSonu(d, r, sonuc, yasayan) {
    const p = turPlan(r), o = { hasar: 0, altin: 0, xp: 0 };
    if (p.tip === 'kervan') return o;
    o.hasar = kayipHasar(r, sonuc.kazanan, sonuc.kalanPuan, sonuc.kalanSayi, yasayan)[0];
    d.can = Math.max(0, d.can - o.hasar);
    d.seri = seriGuncelle(d.seri, sonuc.kazanan, p.tip);
    if (p.tip === 'pvp') d.galibiyet = sonuc.kazanan === 0;
    o.altin = ganimetAltin(r); d.altin += o.altin;
    if (r >= 1 && d.seviye < K.seviyeTavan) { const x = xpEkle(d.seviye, d.xp, K.pasifXp); d.seviye = x.seviye; d.xp = x.xp; o.xp = K.pasifXp; }
    return o;
  }

  // ── Eşyalar (bölüm 5.1) ──
  // Birimin taşıdığı soylar: kahraman + kaynaşan kahraman + Soy Mühürleri (sim.birimStat ile aynı sıra).
  function birimSoy(b) {
    const soy = D.kahraman(b.h).soy.slice();
    if (b.f) for (const s of D.kahraman(b.f).soy) if (!soy.includes(s)) soy.push(s);
    for (const id of (b.e || []).slice(0, K.esyaYuva)) { const x = D.esya(id); if (x && x.soy && !soy.includes(x.soy)) soy.push(x.soy); }
    return soy;
  }
  /** Birime eşya takma kuralı (saf). Bileşen, birimdeki ilk tamamlanmamış bileşenle kendiliğinden tam eşyaya dönüşür (dolu birimde de);
      yoksa boş yuvaya takılır (en çok 3). Söküm Taşı takılmaz. Soy Mührü, birimin zaten taşıdığı soyu veremez.
      Dönen: { e: yeni eşya listesi, birlesen: oluşan tam eşya ya da null }; takılamıyorsa null. */
  function esyaTak(b, id) {
    const x = D.esya(id); if (!x || id === 'sokumTasi') return null;
    const e = (b.e || []).slice(0, K.esyaYuva);
    if (x.tip === 'bilesen') {
      for (let j = 0; j < e.length; j++) { const y = D.esya(e[j]); if (y && y.tip === 'bilesen') { const t = D.tarif(e[j], id); e[j] = t; return { e, birlesen: t }; } }
    }
    if (e.length >= K.esyaYuva) return null;
    if (x.soy && birimSoy(b).includes(x.soy)) return null;
    e.push(id); return { e, birlesen: null };
  }
  /** ★ birleşmesinde ve kaynaştırmada eşyaların toplanması: listeler sırayla (önce birinci birim) yeni birime takılır;
      takılamayanlar (3'ü aşan, tekrar mühür) rafa döner. b: oluşan birim (soy denetimi için; e alanı yok sayılır). */
  function esyaToplaBirim(b, listeler) {
    let u = { ...b, e: [] }; const tasan = [];
    for (const l of listeler) for (const id of (l || [])) { const t = esyaTak(u, id); if (t) u = { ...u, e: t.e }; else tasan.push(id); }
    return { e: u.e, tasan };
  }
  /** Rafta iki bileşeni birleştir: tam eşya küçük indekse yazılır, öbürü çıkar. İkisi de bileşen değilse null. */
  function rafBirlestir(raf, i, j) {
    if (i === j || !raf[i] || !raf[j]) return null;
    const a = D.esya(raf[i]), b = D.esya(raf[j]);
    if (!a || !b || a.tip !== 'bilesen' || b.tip !== 'bilesen') return null;
    const t = D.tarif(raf[i], raf[j]), k = Math.min(i, j), z = Math.max(i, j), out = raf.slice();
    out[k] = t; out.splice(z, 1); return out;
  }
  // ── Canavar turu, ganimet ve Kervan (bölüm 5.4, 5.5) ──
  // Canavar dalgası: 'bölüm-tur' → birimler (★1), 6. bölüm ve sonrası PVE_DALGA_GEC. Canavar turu değilse boş.
  function pveDalga(r) {
    const p = turPlan(r); if (p.tip !== 'pve') return [];
    const l = p.bolum >= K.pveDalgaGecBolum ? K.pveDalgaGec : (K.pveDalga[p.bolum + '-' + p.tur] || []);
    return l.map(([h, x, y]) => ({ h, s: 1, x, y }));
  }
  // Havuz kopyası: kalan verilmezse tam havuz. Sıra hep KAHRAMANLAR sırası.
  function havuzKopya(kalan) { const k = {}; for (const h of D.KAHRAMANLAR) k[h.id] = kalan ? (kalan[h.id] || 0) : K.havuzAdet[h.kademe]; return k; }
  /** Kademe-kd kahraman: en az `kopya` kopyası kalanlar arasından kalan sayısıyla ağırlıklı; seçilenin kopyası k'dan düşer.
      O kademede yeterli kopya kalmadıysa kademedeki kahramanlardan eşit olasılıkla (havuz düşülmez). Her çağrı tam 1 zar atar. */
  function kahramanCek(kd, k, R, kopya = 1) {
    const aday = D.KAHRAMANLAR.filter(h => h.kademe === kd && k[h.id] >= kopya), top = aday.reduce((s, h) => s + k[h.id], 0);
    if (top <= 0) { const hep = D.KAHRAMANLAR.filter(h => h.kademe === kd); return hep[Math.floor(R() * hep.length)].id; }
    let x = R() * top, sec = aday[aday.length - 1];
    for (const h of aday) { x -= k[h.id]; if (x < 0) { sec = h; break; } }
    k[sec.id] -= kopya; return sec.id;
  }
  const rastBilesen = (R) => D.BILESENLER[Math.floor(R() * D.BILESENLER.length)].id;
  const rastTam = (R) => D.ESYALAR[Math.floor(R() * D.ESYALAR.length)].id;
  // n farklı eşya (bileşen ya da tam), çekiliş sırasıyla.
  function farkliEsya(tur, n, R) {
    const l = (tur === 'tam' ? D.ESYALAR : D.BILESENLER).map(x => x.id), out = [];
    for (let i = 0; i < n && l.length; i++) out.push(l.splice(Math.floor(R() * l.length), 1)[0]);
    return out;
  }
  /** Canavar turunun ganimeti (bölüm 5.4; kaybedilse de verilir). R: oyuncuya özel sim.rng; kalan: havuzda kalan kopyalar (kahraman ganimeti için).
      Dönen: { altin (toplam), ekAltin (zarftan; sabit kısım ganimetAltin ile turSonu'nda), esya [kimlik], kahraman [{h, s}],
      secim: null | [kimlik] (biri seçilir), zarf: null | 'altin' | 'bilesen' | 'kahraman' }. Parçalar plan sırasıyla zar atar. */
  function ganimet(r, R, kalan) {
    const out = { altin: 0, ekAltin: 0, esya: [], kahraman: [], secim: null, zarf: null }, k = havuzKopya(kalan);
    for (const x of ganimetPlan(r)) {
      if (x.tip === 'bilesen') for (let i = 0; i < x.n; i++) out.esya.push(rastBilesen(R));
      else if (x.tip === 'altin') out.altin += x.n;
      else if (x.tip === 'kahraman') out.kahraman.push({ h: kahramanCek(x.kademe, k, R), s: 1 });
      else if (x.tip === 'secim') out.secim = farkliEsya(x.tur, x.n, R);
      else if (x.tip === 'esya') out.esya.push(x.id);
      else if (x.tip === 'zarf') {
        const z = R(); let top = 0, sec = K.zarf[K.zarf.length - 1];
        for (const y of K.zarf) { top += y.w; if (z < top) { sec = y; break; } }
        out.zarf = sec.tip;
        if (sec.tip === 'altin') { out.altin += sec.n; out.ekAltin += sec.n; }
        else if (sec.tip === 'bilesen') for (let i = 0; i < sec.n; i++) out.esya.push(rastBilesen(R));
        else if (sec.tip === 'kahraman') out.kahraman.push({ h: kahramanCek(sec.kademe, k, R), s: 1 });
      }
    }
    return out;
  }
  // Kervan seçenek sayısı: sıralamada geride olan çok görür (1–2. 3, 3–4. 4, 5–8. 5).
  function kervanAdet(sira) { return K.kervanAdet[Math.max(1, Math.min(K.kervanAdet.length - 1, sira | 0))]; }
  /** Kervan seçenekleri (bölüm 5.4): [{ birim: {h, s, f?, sh?, sf?}, esya }], adet kadar. Kervan turu değilse boş.
      Seçenekler sırasıyla: (kaynaşmış ilk seçenek: iki kahraman zarı) ya da (kademe zarı, birden çok kademe varsa + kahraman zarı), sonra eşya zarı.
      ★2 seçenek havuzdan 3 kopya tutar. kalan verilmezse tam havuz (botlar). */
  function kervanSecenek(r, R, adet, kalan) {
    const p = turPlan(r); if (p.tip !== 'kervan') return [];
    const plan = K.kervan[Math.min(p.bolum, K.kervanGecBolum)], k = havuzKopya(kalan), out = [];
    for (let n = 0; n < adet; n++) {
      let birim;
      if (plan.kaynasmis && n === 0) {
        const h = kahramanCek(plan.kaynasmis[0], k, R), f = kahramanCek(plan.kaynasmis[1], k, R);
        birim = { h, f, s: 1, sh: 1, sf: 1 };
      } else {
        const sp = plan.secenek[n % plan.secenek.length];
        const kd = sp.kademe.length > 1 ? sp.kademe[Math.floor(R() * sp.kademe.length)] : sp.kademe[0];
        birim = { h: kahramanCek(kd, k, R, K.yildizKopya[sp.s]), s: sp.s };
      }
      out.push({ birim, esya: plan.esya === 'tam' ? rastTam(R) : rastBilesen(R) });
    }
    return out;
  }
  /** Bot ve hayaletler için turun eşya ganimeti: seçimlerde ilk seçenek, Kervan'da ilk seçeneğin eşyası (kahramanlar alınmaz). */
  function ganimetEsya(r, R) {
    if (turPlan(r).tip === 'kervan') { const l = kervanSecenek(r, R, kervanAdet(1), null); return l.length ? [l[0].esya] : []; }
    const g = ganimet(r, R, null);
    return g.secim ? [...g.esya, g.secim[0]] : g.esya;
  }
  /** Bölüm 1: 1-1'den önce bedava seçilecek farklı kademe-1 kahramanlar (havuzda kalanla ağırlıklı). */
  function baslangicSecenek(R, kalan, adet = K.baslangicSecenek) {
    const k = havuzKopya(kalan), out = [];
    for (let n = 0; n < adet; n++) {
      const aday = D.KAHRAMANLAR.filter(h => h.kademe === 1 && k[h.id] > 0 && !out.includes(h.id)), top = aday.reduce((s, h) => s + k[h.id], 0);
      if (top <= 0) break;
      let x = R() * top, sec = aday[aday.length - 1];
      for (const h of aday) { x -= k[h.id]; if (x < 0) { sec = h; break; } }
      out.push(sec.id);
    }
    return out;
  }

  // ── 8 kişilik hayalet lobi (bölüm 4) ──
  // Lobi durumu (JSON'a yazılabilir): { tohum, r, oyuncular[8]: { i, ad, kupa, canli, iz, can, olu, elenmeR, turBasiCan, sira,
  //   gecmisRakip[] (her PvP turunda rakibin indeksi; Yansıma -1), sonYansima, seri }, son }. Oyuncu 0 canlı oyuncudur (iz yok)
  // ya da benzetimde o da bir izdir. iz: { bot: {tohum, guc} } (bot izi) ya da { turlar: [...] } (kayıtlı maç izi).
  const SIM = () => g.KUT_SIM || require('./sim.js');
  const ONL = () => g.KUT_ONLINE || require('./online.js');
  /** Lobi kur. canli: { ad, kupa, iz? } (iz verilirse oyuncu 0 da hayalet gibi oynar); izler: 7 iz (online.lobiIzler). */
  function lobiYeni(canli, izler, tohum) {
    const oy = [canli, ...izler].slice(0, K.lobiBoyut).map((o, i) => ({
      i, ad: o.ad, kupa: o.kupa || 0, canli: i === 0 && !o.iz, iz: i === 0 ? (o.iz || null) : { ...(o.bot ? { bot: o.bot } : { turlar: o.turlar }) },
      can: K.canBaslangic, olu: false, elenmeR: -1, turBasiCan: K.canBaslangic, sira: 0, gecmisRakip: [], sonYansima: false, seri: { tip: null, n: 0 } }));
    return { tohum: tohum >>> 0, r: 0, oyuncular: oy, son: null };
  }
  const yasayanlar = (lobi) => lobi.oyuncular.filter(o => !o.olu).map(o => o.i);
  function yasayanSay(lobi) { return yasayanlar(lobi).length; }
  /** i. oyuncunun r. turdaki kadrosu: { seviye, takim, yedek, kut }. Canlı oyuncu için canliTakim (verilmediyse boş). */
  function lobiKadro(lobi, i, r, canliTakim) {
    const o = lobi.oyuncular[i];
    if (o.canli) return { r, seviye: 0, takim: canliTakim || [], yedek: [], armagan: [], kut: null };
    return o.iz.bot ? ONL().botIzTur(o.iz.bot.tohum, o.iz.bot.guc, r) : (ONL().izTur(o.iz, r) || { r, seviye: 0, takim: [], yedek: [], armagan: [], kut: null });
  }
  /** Lobinin r. turunun alameti (bölüm 8): lobinin tamamına aynı; bölüm 1'de ve Kervan'da Durgun Gök; aynı alamet art arda gelmez. */
  // Ağırlıklı seçim (bölüm 8: Durgun Gök 2, diğerleri 1); önceki tur çıkan alamet havuzdan çıkarılır (art arda gelmez).
  function lobiAlamet(tohum, r) {
    let once = null, al = 'yok';
    for (let q = 0; q <= r; q++) {
      const p = turPlan(q);
      if (p.bolum === 1 || p.tip === 'kervan') { al = 'yok'; continue; }
      const l = D.ALAMETLER.filter(a => a.id !== once), R = SIM().rng(tohum + q * 7919 + 3);
      let top = 0; for (const a of l) top += a.w;
      let x = R() * top; al = l[l.length - 1].id;
      for (const a of l) { x -= a.w; if (x < 0) { al = a.id; break; } }
      once = al;
    }
    return al;
  }
  /** r'den başlayarak n turun alameti (bölüm 4.3: sıradaki alamet önceden görünür; Alamet Bilgesi 3 tur). */
  function alametSirasi(tohum, r, n) { return Array.from({ length: n }, (_, k) => lobiAlamet(tohum, r + k)); }

  // ── Kut Armağanı (bölüm 6) ──
  /** Aşamanın kademesi (bölüm → olasılık) ve 3 seçenek. alinan: bu maçta alınmış armağanlar (bir daha çıkmaz). R: oyuncuya özel sim.rng.
      Önce 1 kademe zarı, sonra her seçenek için 1 zar. Dönen: { kademe, secenek: [id…] }. */
  function armaganSecenek(bolum, R, alinan) {
    const A = K.armagan, ol = A.olasilik[bolum] || A.olasilik[Math.max(...Object.keys(A.olasilik).map(Number))];
    const kd = A.kademeler[kademeZar(ol, R()) - 1];
    return { kademe: kd, secenek: armaganCek(kd, R, alinan, []) };
  }
  /** Kademe kd'den 3 farklı armağan (ARMAGANLAR sırasından çekiliş). alinan ve haric (yenilemede şu anki kartlar) dışarıda; kademede yetmezse
      önce alt kademeler (yakından uzağa), sonra üst kademeler; yine yetmezse haric olanlar geri gelir. */
  function armaganCek(kd, R, alinan, haric) {
    const A = K.armagan, ki = A.kademeler.indexOf(kd), sira = [ki];
    for (let k = ki - 1; k >= 0; k--) sira.push(k);
    for (let k = ki + 1; k < A.kademeler.length; k++) sira.push(k);
    const out = [], al = alinan || [], hr = haric || [];
    for (const izin of [false, true]) for (const k of sira) {
      const l = D.ARMAGANLAR.filter(a => a.kademe === A.kademeler[k] && !al.includes(a.id) && !out.includes(a.id) && (izin || !hr.includes(a.id))).map(a => a.id);
      while (out.length < A.secenek && l.length) out.push(l.splice(Math.floor(R() * l.length), 1)[0]);
    }
    return out;
  }
  /** Savaşta motorun kullanacağı armağanlar (savas: true). Son Direniş yalnız can 40'ın altındayken. */
  function savasArmagan(liste, can) {
    return (liste || []).filter(id => { const a = D.armagan(id); return a && a.savas && (id !== 'sonDirenis' || (can != null && can < K.armaganSayi.sonDirenisCan)); });
  }
  /** Bot ve hayalet armağanları (bölüm 4.8): r'ye kadarki her aşamada (2-1, 3-2, 4-3) botun tohumuyla ilk kart. */
  function botArmagan(tohum, r) {
    const out = [];
    for (let q = 0; q <= r; q++) { const p = turPlan(q); if (!p.armagan) continue; const s = armaganSecenek(p.bolum, SIM().rng(tohum * 7919 + q * 104729 + 29), out); if (s.secenek.length) out.push(s.secenek[0]); }
    return out;
  }
  function karistir(l, R) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function yasakli(lobi, a, b, k) {
    if (k <= 0) return false;
    const ga = lobi.oyuncular[a].gecmisRakip, gb = lobi.oyuncular[b].gecmisRakip;
    return ga.slice(Math.max(0, ga.length - k)).includes(b) || gb.slice(Math.max(0, gb.length - k)).includes(a);
  }
  function acgozlu(lobi, s, k) {
    const kul = s.map(() => false), out = [];
    for (let x = 0; x < s.length; x++) {
      if (kul[x]) continue;
      let y = x + 1; while (y < s.length && (kul[y] || yasakli(lobi, s[x], s[y], k))) y++;
      if (y >= s.length) return null;
      kul[x] = kul[y] = true; out.push([s[x], s[y]]);
    }
    return out;
  }
  /** Eşleşme sırası (bölüm 4.2): lobi tohumu + r × 7919 ile. Tek sayıda yaşayan varsa biri (geçen tur Yansıma'yla dövüşmemiş olan)
      Yansıma ile dövüşür: başka bir yaşayanın bu turki kadrosu. Kalanlar karıştırılıp açgözlü eşleşir; son K = min(3, yaşayan − 2) turun
      rakipleri yasak. 50 denemede bulunamazsa yasak bir tur kısalır (önce en eski tur). Dönen: { r, ciftler: [[a, b]…], yansima: null | {a, kopya} }. */
  function eslesmeKur(lobi, r) {
    const R = SIM().rng(lobi.tohum + r * 7919), yas = yasayanlar(lobi), out = { r, ciftler: [], yansima: null };
    if (yas.length < 2) return out;
    let liste = yas;
    if (yas.length % 2 === 1) {
      const aday = yas.filter(i => !lobi.oyuncular[i].sonYansima), hv = aday.length ? aday : yas;
      const a = hv[Math.floor(R() * hv.length)], diger = yas.filter(i => i !== a);
      out.yansima = { a, kopya: diger[Math.floor(R() * diger.length)] };
      liste = diger;
    }
    for (let k = Math.min(K.yasakTur, yas.length - 2); k >= 0; k--) {
      for (let d = 0; d < K.eslesmeDeneme; d++) { const c = acgozlu(lobi, karistir(liste, R), k); if (c) { out.ciftler = c; return out; } }
    }
    return out;
  }
  /** i. oyuncunun bu turki rakibi: { j, yansima } ya da null (eşleşmede yoksa). Yansıma'da j kopyalanan oyuncu. */
  function lobiRakip(es, i) {
    if (es.yansima && es.yansima.a === i) return { j: es.yansima.kopya, yansima: true };
    for (const [a, b] of es.ciftler) { if (a === i) return { j: b, yansima: false }; if (b === i) return { j: a, yansima: false }; }
    return null;
  }
  // Hayalet savaşı: Kut kayıttaki dokunuşla ({i, t}); kayıt yoksa yapay zekâ (bölüm 4.6, 7.4). Gün Batımı açık.
  // Kayıttaki dokunuşu olan tarafta yapay zekâ yalnız yedek: kayıttaki birim ölmüşse ya da ikinci hak (Çifte Kut, Son İki) için (7.4).
  // Armağanlar (6.1) iki taraf için de motora verilir; Son İki'de iki tarafın 2 Kut hakkı olur (4.4). canA/canB: Son Direniş için.
  function golgeSavas(ka, kb, alamet, tohum, pve, yasayan, canA, canB) {
    const kut = [], yz = [], yzYedek = [];
    if (ka.kut) { kut.push({ t: ka.kut.t, taraf: 0, i: ka.kut.i }); yzYedek.push(0); } else yz.push(0);
    if (!pve) { if (kb.kut) { kut.push({ t: kb.kut.t, taraf: 1, i: kb.kut.i }); yzYedek.push(1); } else yz.push(1); }
    const hak = yasayan === 2 ? K.kut.sonIkiHak : K.kut.hak;
    return SIM().Savas(ka.takim, kb.takim, { tohum, alamet, kut, yz, yzYedek, gunBatimi: K.gunBatimi.basla, kutHak: [hak, pve ? 0 : hak],
      armagan: [savasArmagan(ka.armagan, canA), pve ? [] : savasArmagan(kb.armagan, canB)] }).sonunaKadar();
  }
  /** Hayalet × hayalet savaşları (bölüm 4.6): canlı oyuncunun dahil olmadığı bütün eşleşmeler motorda sonuna kadar oynanır.
      Canavar turunda her hayalet kendi dalgasıyla. ops.canliTakim: Yansıma canlı oyuncuyu kopyalarsa kullanılır.
      Dönen: [{ a, b (Yansıma'da kopya, canavarda -1), tip: 'pvp'|'yansima'|'pve', kazanan (a'ya göre), kalanPuan, kalanSayi, sure }]. */
  function golgeSavaslari(lobi, r, alamet, es, ops = {}) {
    const p = turPlan(r), out = [], canli = (i) => lobi.oyuncular[i].canli, yas = yasayanSay(lobi), can = (i) => lobi.oyuncular[i].can;
    const bir = (a, b, tip, s) => ({ a, b, tip, kazanan: s.kazanan, kalanPuan: s.kalanPuan, kalanSayi: s.kalanSayi, sure: s.sure });
    if (p.tip === 'pve') {
      const dalga = { takim: pveDalga(r), kut: null };
      for (const i of yasayanlar(lobi)) if (!canli(i)) out.push(bir(i, -1, 'pve', golgeSavas(lobiKadro(lobi, i, r), dalga, alamet, lobi.tohum + r * 104729 + i * 7907 + 50021, true, yas, can(i), 0)));
      return out;
    }
    if (p.tip !== 'pvp') return out;
    es.ciftler.forEach(([a, b], k) => {
      if (canli(a) || canli(b)) return;
      out.push(bir(a, b, 'pvp', golgeSavas(lobiKadro(lobi, a, r), lobiKadro(lobi, b, r), alamet, lobi.tohum + r * 104729 + k * 7907 + 1, false, yas, can(a), can(b))));
    });
    if (es.yansima && !canli(es.yansima.a)) {
      const y = es.yansima;
      out.push(bir(y.a, y.kopya, 'yansima', golgeSavas(lobiKadro(lobi, y.a, r), lobiKadro(lobi, y.kopya, r, ops.canliTakim), alamet, lobi.tohum + r * 104729 + 97, false, yas, can(y.a), can(y.kopya))));
    }
    return out;
  }
  /** Bir turu lobide oynat (bölüm 4.2–4.6): eşleşme (ops.eslesme verilmezse kurulur), hayalet savaşları, canlı oyuncunun sonucu
      (ops.canliSonuc: canlı oyuncu taraf 0), hasar (Son Üç / Son İki ekleri dahil), seri, elenme ve sıralama. lobi yerinde değişir.
      Dönen tur raporu: { r, tip, alamet, yasayan, sonuclar: [{a, b, tip, kazanan, kalanPuan, kalanSayi, sure, hasar: [a'nın, b'nin]}], hasar[8], elenen[] }. */
  function lobiTurOyna(lobi, r, ops = {}) {
    const p = turPlan(r), alamet = lobiAlamet(lobi.tohum, r), yas = yasayanlar(lobi);
    const rapor = { r, tip: p.tip, alamet, yasayan: yas.length, sonuclar: [], hasar: lobi.oyuncular.map(() => 0), elenen: [] };
    if (p.tip === 'kervan' || yas.length < 2) { lobi.r = r + 1; lobi.son = rapor; return rapor; }
    for (const i of yas) lobi.oyuncular[i].turBasiCan = lobi.oyuncular[i].can;
    const es = p.tip === 'pvp' ? (ops.eslesme || eslesmeKur(lobi, r)) : { ciftler: [], yansima: null };
    const sonuclar = golgeSavaslari(lobi, r, alamet, es, ops);
    const cs = ops.canliSonuc, ci = lobi.oyuncular.findIndex(o => o.canli && !o.olu);
    if (ci >= 0 && cs) {
      const ters = (k) => (k === 0 ? 1 : k === 1 ? 0 : k);
      const bir = (a, b, tip, k) => ({ a, b, tip, kazanan: k, kalanPuan: cs.kalanPuan, kalanSayi: cs.kalanSayi, sure: cs.sure });
      if (p.tip === 'pve') sonuclar.push(bir(ci, -1, 'pve', cs.kazanan));
      else { const rk = lobiRakip(es, ci); if (rk) { if (rk.yansima) sonuclar.push(bir(ci, rk.j, 'yansima', cs.kazanan)); else { const k = es.ciftler.findIndex(c => c.includes(ci)), [a, b] = es.ciftler[k]; sonuclar.push(a === ci ? bir(a, b, 'pvp', cs.kazanan) : bir(a, b, 'pvp', ters(cs.kazanan))); } } }
    }
    // hasar ve seri (sonuç sırasıyla; hasar herkese aynı anda uygulanır)
    for (const s of sonuclar) {
      const h = kayipHasar(r, s.kazanan, s.kalanPuan, s.kalanSayi, yas.length);
      s.hasar = s.tip === 'pvp' ? h : [h[0], 0];
      rapor.hasar[s.a] += s.hasar[0]; if (s.tip === 'pvp') rapor.hasar[s.b] += s.hasar[1];
      if (s.tip !== 'pve') {
        const oa = lobi.oyuncular[s.a]; oa.seri = seriGuncelle(oa.seri, s.kazanan, 'pvp');
        if (s.tip === 'pvp') { const ob = lobi.oyuncular[s.b]; ob.seri = seriGuncelle(ob.seri, s.kazanan === 0 ? 1 : s.kazanan === 1 ? 0 : -1, 'pvp'); }
      }
    }
    for (const i of yas) { const o = lobi.oyuncular[i]; o.can = Math.max(0, o.can - rapor.hasar[i]); }
    if (p.tip === 'pvp') {
      for (const i of yas) { const rk = lobiRakip(es, i), o = lobi.oyuncular[i]; o.gecmisRakip.push(rk ? (rk.yansima ? -1 : rk.j) : -1); o.sonYansima = !!(rk && rk.yansima); }
    }
    rapor.sonuclar = sonuclar;
    rapor.elenen = siralamaGuncelle(lobi, r);
    lobi.r = r + 1; lobi.son = rapor;
    return rapor;
  }
  /** Canı biten oyuncular elenir (bölüm 4.5): aynı turda elenenlerde tur başında canı fazla olan önde (eşitlikte küçük indeks).
      Tek kişi kalınca o birinci. Dönen: bu tur elenenlerin indeksleri (sıra düzeninde). */
  function siralamaGuncelle(lobi, r) {
    const yeni = lobi.oyuncular.filter(o => !o.olu && o.can <= 0).sort((a, b) => b.turBasiCan - a.turBasiCan || a.i - b.i);
    for (const o of yeni) { o.olu = true; o.elenmeR = r; }
    const kalan = yasayanSay(lobi);
    yeni.forEach((o, k) => { o.sira = kalan + 1 + k; });
    if (kalan === 1) lobi.oyuncular.find(o => !o.olu).sira = 1;
    return yeni.map(o => o.i);
  }
  function lobiBitti(lobi) { return yasayanSay(lobi) <= 1; }
  /** Gözcü Baykuşu (6.2): i. oyuncunun sonraki n PvP turundaki rakibinin tahmini. Lobi kopyası üzerinde yalnız eşleşmeler ilerletilir
      (bu turun eşleşmesi es verilirse o yazılır); elenmeler bilinmediği için tahmindir. Dönen: [{ r, j, yansima }]. */
  function gelecekRakip(lobi, i, r, n, es) {
    const lb = JSON.parse(JSON.stringify(lobi)), out = [];
    const yaz = (e) => { for (const k of yasayanlar(lb)) { const rk = lobiRakip(e, k), o = lb.oyuncular[k]; o.gecmisRakip.push(rk ? (rk.yansima ? -1 : rk.j) : -1); o.sonYansima = !!(rk && rk.yansima); } };
    let q = r;
    if (es && turPlan(r).tip === 'pvp') { yaz(es); q = r + 1; }
    for (; out.length < n && q < r + 30; q++) {
      if (turPlan(q).tip !== 'pvp') continue;
      const e = eslesmeKur(lb, q), rk = lobiRakip(e, i); yaz(e);
      if (rk) out.push({ r: q, j: rk.j, yansima: rk.yansima });
    }
    return out;
  }
  /** Lobiyi sona kadar oynat (canlı oyuncu elendikten sonra kalan turlar anında, bölüm 4.6). Tur tavanında kalanlar cana göre sıralanır.
      ops'tan yalnız canliTakim kullanılır: eşleşme her tur yeniden kurulur, canlı oyuncunun tek turluk sonucu tekrar uygulanmaz (C# LobiSonaKadar ile aynı). */
  function lobiSonaKadar(lobi, ops = {}) {
    const o2 = ops.canliTakim ? { canliTakim: ops.canliTakim } : {};
    while (!lobiBitti(lobi) && lobi.r < K.lobiTurTavan) lobiTurOyna(lobi, lobi.r, o2);
    if (!lobiBitti(lobi)) {
      const l = lobi.oyuncular.filter(o => !o.olu).sort((a, b) => b.can - a.can || a.i - b.i);
      l.forEach((o, k) => { o.sira = k + 1; o.olu = k > 0; if (k > 0) o.elenmeR = lobi.r - 1; });
    }
    return lobi;
  }
  /** Anlık sıra: elendiyse kesin sırası; yaşıyorsa 1 + canı daha fazla olan yaşayanlar (eşitlikte küçük indeks önde). Kervan seçenek sayısı için. */
  function lobiSira(lobi, i) {
    const o = lobi.oyuncular[i]; if (o.olu) return o.sira;
    return 1 + lobi.oyuncular.filter(x => !x.olu && x.i !== i && (x.can > o.can || (x.can === o.can && x.i < i))).length;
  }
  /** Sıralama kupası (bölüm 4.5): +40 … −40; 0–400 kupada kayıp yarıya iner; kupa 0'ın altına düşmez. Dönen: gerçek değişim. */
  function kupaDegisim(sira, kupa) {
    let d = K.kupaTablo[Math.max(1, Math.min(K.kupaTablo.length - 1, sira))];
    if (d < 0 && kupa <= K.kupaKoruma) d = Math.trunc(d / 2);
    return Math.max(0, kupa + d) - kupa;
  }
  /** Lobide havuzda kalan kopyalar (bölüm 2.3): oyuncunun birimleri + yaşayan hayaletlerin r. turdaki kadrosu ve yedeği düşülür. */
  function havuzLobi(lobi, r, oyuncuBirimler) {
    const gr = [oyuncuBirimler || []];
    for (const o of lobi.oyuncular) if (!o.olu && !o.canli) { const k = lobiKadro(lobi, o.i, r); gr.push(k.takim, k.yedek || []); }
    return havuzKalan(gr);
  }

  const api = { lobiYeni, yasayanSay, alametSirasi, armaganSecenek, armaganCek, savasArmagan, botArmagan, faizTavan, farkliEsya, gelecekRakip, lobiKadro, lobiAlamet, eslesmeKur, lobiRakip, golgeSavaslari, lobiTurOyna, siralamaGuncelle, lobiBitti, lobiSonaKadar, lobiSira, kupaDegisim, havuzLobi,
    xpGerek, xpEkle, kopyaSay, havuzKalan, kademeZar, dukkanCek,
    turPlan, turAd, tabanGelir, faiz, seriBonus, gelirHesapla, seriGuncelle, kaynastirBedel, ganimetPlan, ganimetAltin, bolumTaban, kayipHasar, turBasi, turSonu,
    birimSoy, esyaTak, esyaToplaBirim, rafBirlestir, pveDalga, kahramanCek, ganimet, kervanAdet, kervanSecenek, ganimetEsya, baslangicSecenek };
  g.KUT_LOBI = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
