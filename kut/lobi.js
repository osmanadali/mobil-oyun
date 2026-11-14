/* KUT ARENA — seviyeli maçın saf, belirlenimci kuralları (tarayıcı + node). C# karşılığı: unity/Kod/KutLobi.cs.
   Bu adımda: deneyim ve seviye, sınırlı kahraman havuzu, seviyeye bağlı dükkân çekimi (OYNANIS_DERINLIK.md 2.1–2.3).
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

  const api = { xpGerek, xpEkle, kopyaSay, havuzKalan, kademeZar, dukkanCek };
  g.KUT_LOBI = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
