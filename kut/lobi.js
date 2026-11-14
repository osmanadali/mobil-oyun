/* KUT ARENA — seviyeli maçın saf, belirlenimci kuralları (tarayıcı + node). C# karşılığı: unity/Kod/KutLobi.cs.
   Şimdilik: deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3),
   tur planı (1.1), birikimli ekonomi (3: gelir, faiz, seri, galibiyet, ganimet altını) ve kaybedince alınan hasar (4.4).
   Sonraki adımlarda eşleşme, hasar, sıralama ve Kervan da buraya gelir (bölüm 12.4).
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
  function faiz(altin, r) { return turPlan(r).bolum === 1 ? 0 : Math.min(K.faizTavan, Math.floor(Math.max(0, altin) / K.faizAdim)); }
  // Seri bonusu: n = 0–1 → 0, 2 → 1, 3–4 → 2, 5+ → 3 (kazanma da kaybetme serisi de).
  function seriBonus(n) { return K.seriTablo[Math.max(0, Math.min(n, K.seriTablo.length - 1))]; }
  /** Hazırlık başı geliri. seri: {tip: 'G'|'M'|null, n}; galibiyet: önceki PvP savaşı kazanıldı mı; alamet: bu turun alameti.
      Kervan turunda gelir yoktur. */
  function gelirHesapla(r, altin, seri, galibiyet, alamet) {
    const g = { taban: 0, faiz: 0, seri: 0, galibiyet: 0, alamet: 0, toplam: 0 };
    if (turPlan(r).tip === 'kervan') return g;
    g.taban = tabanGelir(r); g.faiz = faiz(altin, r); g.seri = seriBonus(seri ? seri.n : 0);
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
  // Ganimetin altın kısmı (bölüm 5.4).
  function ganimetAltin(r) { return K.ganimetAltin[turAd(r)] || 0; }

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
  function turBasi(d, r, alamet) { const g = gelirHesapla(r, d.altin, d.seri, d.galibiyet, alamet); d.altin += g.toplam; return g; }
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

  const api = { xpGerek, xpEkle, kopyaSay, havuzKalan, kademeZar, dukkanCek,
    turPlan, turAd, tabanGelir, faiz, seriBonus, gelirHesapla, seriGuncelle, kaynastirBedel, ganimetAltin, bolumTaban, kayipHasar, turBasi, turSonu };
  g.KUT_LOBI = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
