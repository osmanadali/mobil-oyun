/* KUT ARENA — belirlenimci savaş motoru (tarayıcı + node).
   Aynı takımlar + aynı tohum + aynı Kut dokunuşları → hep aynı sonuç. Bu sayede:
   - eşzamansız çevrimiçi: rakibin takım fotoğrafı sunucudan gelir, savaş cihazda oynanır, sonuç doğrulanabilir;
   - tekrar izleme / paylaşım: (takımlar, tohum, dokunuşlar) üçlüsü bir savaşı baştan oynatır. */
(function (g) {
  const D = g.KUT_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const { SOYLAR, KURAL, YETENEK } = D;

  const Y0 = [5, 6, 7], Y1 = [3, 2, 1]; // sıra (ön, orta, arka) → arena y
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // Takım birimi: { h: kahramanId, s: yıldız 1..3, f?: kaynaşan kahramanId (pasif + soy ondan), f2?: Üçlü Kaynaşma'nın üçüncü kahramanı
  //   (yalnız soy ve +%10 istatistik), x: 0..3 (sütun), y: 0 ön | 1 orta | 2 arka, e?: eşya kimlikleri (0–3; bileşen, tam eşya ya da özel) }
  const STAT0 = () => ({ atk: 0, as: 0, yg: 0, mana0: 0, azalt: 0, can: 0, cal: 0, kalkan0: 0 });
  const STAT_AD = ['atk', 'as', 'yg', 'mana0', 'azalt', 'can', 'cal', 'kalkan0'];
  // Eşya istatistikleri: yuva sırasıyla (0, 1, 2), her tam eşyada tarif sırasıyla toplanır. Bilinmeyen kimlik yok sayılır.
  function esyaTopla(e) {
    const st = STAT0(), esya = [], yanki = {}, yankiSira = [], muhur = []; let kutTasi = 0;
    // yankiSira: Kut Yankısı'nın sırası (yuva 0, 1, 2; tam eşyada tarif sırası), bileşen başına bir kez
    const bilesen = (id) => { const b = D.esya(id); for (const k of STAT_AD) if (b.stat[k]) st[k] += b.stat[k]; yanki[id] = (yanki[id] || 0) + 1; yankiSira.push(id); };
    for (const id of (e || []).slice(0, KURAL.esyaYuva)) {
      const x = D.esya(id); if (!x) continue;
      if (x.tip === 'bilesen') bilesen(id);
      else if (x.tip === 'tam') { bilesen(x.tarif[0]); bilesen(x.tarif[1]); if (!esya.includes(id)) esya.push(id); }
      else if (x.soy) { if (!muhur.includes(x.soy)) muhur.push(x.soy); }
      else if (id === 'kutTasi') kutTasi++;
    }
    st.azalt = Math.min(KURAL.esyaAzaltTavan, st.azalt);
    return { st, esya, yanki, yankiSira, muhur, kutTasi };
  }
  // kaynasCarpan: kaynaşmış birimin istatistik çarpanı (1,15; Kusursuz Melez 1,30). Üçlü Kaynaşma (f2): üçüncü kahramandan soylar ve ×1,10 can/saldırı.
  function birimStat(b, kaynasCarpan) {
    const A = D.kahraman(b.h), B = b.f ? D.kahraman(b.f) : null, C = B && b.f2 ? D.kahraman(b.f2) : null;
    const c = KURAL.yildizCarpan[b.s || 1], kk = kaynasCarpan || KURAL.armaganSayi.kaynasCarpan;
    let can = A.can, atk = A.atk, as = A.as;
    if (B) { can = (A.can + B.can) / 2 * kk; atk = (A.atk + B.atk) / 2 * kk; as = (A.as + B.as) / 2; }
    if (C) { can = can * (1 + KURAL.armaganSayi.ucluKaynas); atk = atk * (1 + KURAL.armaganSayi.ucluKaynas); }
    const soy = B ? [...new Set([...A.soy, ...B.soy, ...(C ? C.soy : [])])] : A.soy.slice();
    const E = esyaTopla(b.e);
    for (const s of E.muhur) if (!soy.includes(s)) soy.push(s); // Soy Mührü
    const st = E.st;
    return { ad: B ? A.ad + ' × ' + B.ad + (C ? ' × ' + C.ad : '') : A.ad, can: Math.round(can * c) + st.can, atk: Math.round(atk * c * (1 + st.atk)), as, menzil: A.menzil, mana: A.mana,
      yetenek: A.yetenek, pasif: B ? B.pasif : A.pasif, soy, kc: c, kademe: A.kademe,
      asEk: st.as, yg: st.yg, mana0: st.mana0, azalt: st.azalt, cal: st.cal, kalkan0: st.kalkan0, esya: E.esya, kutYanki: E.yanki, yankiSira: E.yankiSira, kutTasi: E.kutTasi };
  }

  function soySay(takim) {
    const say = {};
    for (const b of takim) {
      // aynı kahraman iki kez sayılmaz (TFT kuralı); kaynaşmış birim kendi kimliğiyle sayılır
      for (const s of birimStat(b).soy) { say[s] = say[s] || new Set(); say[s].add(b.h + (b.f ? '+' + b.f : '') + (b.f && b.f2 ? '+' + b.f2 : '')); }
    }
    const out = {};
    for (const k in say) { const n = say[k].size, e = SOYLAR[k].esik; out[k] = { n, seviye: n >= e[1] ? 2 : n >= e[0] ? 1 : 0 }; }
    return out;
  }

  function Savas(takimA, takimB, opt = {}) {
    const R = rng(opt.tohum || 1);
    const alamet = opt.alamet || 'yok';
    // Kut Armağanı (bölüm 6): opt.armagan = [[id…], [id…]]; yalnız savas: true olanlar burada çalışır (Son Direniş'in can koşulu çağıranda: lobi.savasArmagan)
    const AR = [0, 1].map(tr => { const o = {}; for (const id of ((opt.armagan || [])[tr] || [])) o[id] = true; return o; });
    const KU = KURAL.kut, KY = KURAL.kutYanki, AS = KURAL.armaganSayi, KS = KURAL.savas;
    // Kut Sessizliği: Kut yok (opt.kutYok da kapatır)
    const kutYok = alamet === 'kutSessiz' || !!opt.kutYok;
    const birimler = [];
    const fx = [];
    let t = 0, bitti = false, sonuc = null;
    const soylar = [soySay(takimA), soySay(takimB)];
    // Karşı Hamle: rakibin en kalabalık soyu (eşitlikte ilk görülen) bu savaşta bir eşik düşük sayılır
    for (const tr of [0, 1]) if (AR[tr].karsiHamle) {
      let en = null; for (const k in soylar[1 - tr]) if (!en || soylar[1 - tr][k].n > soylar[1 - tr][en].n) en = k;
      if (en) soylar[1 - tr][en] = { n: soylar[1 - tr][en].n, seviye: Math.max(0, soylar[1 - tr][en].seviye - 1) };
    }
    const sv = (taraf, soy) => (soylar[taraf][soy] || {}).seviye || 0;
    // Gün Batımı (bölüm 1.4): opt.gunBatimi saniyesinden sonra her tam saniye bütün hasar +%10. Verilmezse yok (Hızlı Maç, eski savaşlar).
    // t, 0,05'lik adımlarla biriktiği için floor'dan önce 1e-9 eklenir (20,000…01 ile 19,999…9 aynı saniye sayılır).
    // Uzun Gölge alameti: Gün Batımı 20. saniyede (yalnız Gün Batımı açık savaşlarda)
    const gbBas = opt.gunBatimi == null ? null : alamet === 'uzunGolge' ? Math.min(opt.gunBatimi, KU.uzunGolge) : opt.gunBatimi, gbArtis = KURAL.gunBatimi.artis;
    let gbBasladi = false;
    function gunBatimiCarpan() { if (gbBas === null) return 1; const gt = t - gbBas + 1e-9; return gt >= 0 ? 1 + gbArtis * Math.floor(gt) : 1; }

    [takimA, takimB].forEach((takim, taraf) => {
      takim.forEach((b, i) => {
        const st = birimStat(b, AR[taraf].kusursuzMelez ? AS.kusursuzMelez : AS.kaynasCarpan);
        // arena: genişlik 6, yükseklik 8. Tahta 4 sütun × 3 sıra: x = 0,75 / 2,25 / 3,75 / 5,25.
        // Taraf 0 altta (ön y=5, orta 6, arka 7), taraf 1 üstte (ön y=3, orta 2, arka 1).
        const x = 0.75 + b.x * 1.5, y = taraf === 0 ? Y0[b.y] : Y1[b.y];
        let can = st.can;
        const y1 = sv(taraf, 'yer'); can += [0, 150, 400][y1] * (st.kc > 1 ? 1 : 1);
        if (alamet === 'tutulma' && st.soy.includes('karanlik')) can *= 1.3;
        if (alamet === 'yaz' && st.soy.includes('kis')) can *= 0.85;
        if (AR[taraf].sonDirenis) can *= 1 + AS.sonDirenisOran; // Son Direniş (can koşulu çağıranda)
        can = Math.round(can);
        const ef = {}; for (const id of st.esya) ef[id] = true;
        // Dolunay Testisi: yetenek için gereken mana −%20
        const mana = ef.dolunayTestisi ? Math.floor(st.mana * 0.8 + 0.5) : st.mana;
        birimler.push({ uid: taraf * 10 + i, taraf, i, b, ...st, mana, ef, mx: can, hp: can, x, y, x0: x, y0: y,
          mp: 0, cd: 0.3 + R() * 0.3, durum: {}, kalkan: 0, olu: false, dirildi: false, vurus: 0, payYigin: 0, ofke: 0, hedef: null,
          vurusMana: ef.keskinGoz ? KS.keskinGozMana : KS.vurusMana, ilkVurusYapildi: false, sonHedefUid: -1, esikTetik: {}, kutCarpan: 1,
          bilesenSay: st.yankiSira.length, yankiDis: 0, yankiDisOran: 0, yankiCiy: 0, kutMiras: false,
          // yetenek kurulumu: kurulumSure (YETENEK[id].kurulum, yoksa KURAL.savas.kurulum); kurulum: kalan süre (0: kurulumda değil)
          kurulumSure: st.yetenek && YETENEK[st.yetenek] && YETENEK[st.yetenek].kurulum != null ? YETENEK[st.yetenek].kurulum : KS.kurulum, kurulum: 0 });
      });
    });

    // Savaş başı etkileri
    for (const u of birimler) {
      if (u.pasif === 'kisNefesi') u.mp = u.mana * 0.5;
      if (alamet === 'kutYagmur') u.mp = Math.max(u.mp, u.mana * 0.4);
      if (alamet === 'kutSessiz') u.mp = Math.max(u.mp, u.mana * KU.sessizMana);
      if (u.pasif === 'ana') for (const d of dostlar(u)) if (d !== u && mesafe(u, d) <= 2.6) kalkanVer(d, 90 * u.kc);
    }
    // Eşyaların savaş başı etkileri (birim sırasıyla; OYNANIS_DERINLIK.md 12.2). "2 hücre" = 2,1; "2,5 hücre" = 2,6 (Koruyucu Tüy ile aynı ölçü).
    for (const u of birimler) {
      if (u.mana0) u.mp = Math.min(u.mana - 1, u.mp + u.mana0);
      if (u.kalkan0) kalkanVer(u, u.kalkan0);
      if (u.ef.buzDagi) kalkanVer(u, u.mx * 0.2);
      if (u.ef.isikKalkani) for (const d of dostlar(u)) if (d !== u && mesafe(u, d) <= 2.1) kalkanVer(d, 120);
      if (u.ef.uluKok) for (const d of dostlar(u)) if (d !== u && mesafe(u, d) <= 2.1) { d.mx += 150; d.hp += 150; }
      if (u.ef.devKukremesi) for (const o of dusmanlar(u)) if (mesafe(u, o) <= 2.6) durumVer(o, 'zorla', 3, u.uid);
      if (u.ef.sisPelerini) durumVer(u, 'hedefAlinmaz', 2.5);
    }

    function dostlar(u) { return birimler.filter(o => o.taraf === u.taraf && !o.olu); }
    function dusmanlar(u) { return birimler.filter(o => o.taraf !== u.taraf && !o.olu); }
    function mesafe(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); } // hypot değil: C# ile bit bit aynı sonuç
    // yetenek kurulumundaki birim mana kazanmaz (Kut hariç: Kut manayı doğrudan doldurur)
    function manaEkle(u, n) { if (!(u.kurulum > 0)) u.mp = Math.min(u.mana, u.mp + n); }
    // Üst üste binme yok: u (yalnız u yer değiştirir) yaşayan öbür birimlerden en az KS.ayrim uzağa, birim sırasıyla tek geçişte itilir.
    // Tam çakışmada tarafının gerisine ve i'ye göre yana (0,6² + 0,8² = 1: uzaklık tam ayrim). Arena sınırı: x 0,4–5,6, y 0,4–7,6.
    // Sınır itmeyi geri alırsa (köşe) ya da ilk geçiş yetmediyse (iki birim arasına sıkıştı) yana, o'nun x'inden ayrim uzağa konur.
    // En çok 4 geçiş (bir itme başka çakışma doğurabilir).
    function ayris(u) {
      for (let gec = 0; gec < 4; gec++) {
        let itildi = false;
        for (const o of birimler) {
          if (o === u || o.olu) continue;
          const dx = u.x - o.x, dy = u.y - o.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d >= KS.ayrim) continue;
          itildi = true;
          if (d < 1e-6) { u.x = o.x + (u.i % 2 ? -0.6 : 0.6) * KS.ayrim; u.y = o.y + (u.taraf === 0 ? 0.8 : -0.8) * KS.ayrim; }
          else { const k = KS.ayrim / d; u.x = o.x + dx * k; u.y = o.y + dy * k; }
          u.x = Math.max(0.4, Math.min(5.6, u.x)); u.y = Math.max(0.4, Math.min(7.6, u.y));
          if (gec > 0 || mesafe(u, o) < KS.ayrim - 1e-9) { // ikinci geçişten sonra (iki birim arasına sıkıştı) ya da köşede: yana
            const sx = dx > 0 || (dx === 0 && u.i % 2 === 0) ? 1 : -1;
            let nx = o.x + sx * KS.ayrim; if (nx > 5.6 || nx < 0.4) nx = o.x - sx * KS.ayrim;
            u.x = nx;
          }
        }
        if (!itildi) break;
      }
    }
    // Yürüme yönü: doğrudan hedefe; o yol bir birimin ayrim çemberine giriyorsa (ve ona yaklaştırıyorsa) ±30°, ±60°, ±90° döndürülmüş
    // yönler sırayla denenir (önce i'ye göre bir yan; döndürme sabit sayılarla: trigonometri yok, C# ile bit bit aynı). Hepsi kapalıysa null.
    const DON = [[1, 0], [0.8660254037844386, 0.5], [0.8660254037844386, -0.5], [0.5, 0.8660254037844386], [0.5, -0.8660254037844386], [0, 1], [0, -1]];
    function yurumeYonu(u, ex, ey, adimU) {
      const yan = u.i % 2 ? -1 : 1;
      for (const [c, s0] of DON) {
        const s = s0 * yan, rx = ex * c - ey * s, ry = ex * s + ey * c, nx = u.x + rx * adimU, ny = u.y + ry * adimU;
        let acik = true;
        for (const o of birimler) {
          if (o === u || o.olu) continue;
          const ax = nx - o.x, ay = ny - o.y, yd = Math.sqrt(ax * ax + ay * ay);
          if (yd < KS.ayrim - 1e-9 && yd < mesafe(u, o)) { acik = false; break; }
        }
        if (acik) return [rx, ry];
      }
      return null;
    }
    // Hedef seçimi: Dev Kükremesi'nin zorladığı hedef (yaşıyorsa); sonra hedef alınabilenler arasından en yakın; hepsi hedef alınamazsa en yakın.
    function enYakin(u) {
      if (u.durum.zorla) { const z = birimler.find(o => o.uid === u.durum.zorla.deger && !o.olu); if (z) return z; }
      let en = null, m = 1e9;
      for (const o of dusmanlar(u)) { if (o.durum.hedefAlinmaz) continue; const d = mesafe(u, o) + o.i * 1e-4; if (d < m) { m = d; en = o; } }
      if (en) return en;
      for (const o of dusmanlar(u)) { const d = mesafe(u, o) + o.i * 1e-4; if (d < m) { m = d; en = o; } }
      return en;
    }
    function kalkanVer(u, n) { u.kalkan += n; fx.push({ t, tip: 'kalkan', u: u.uid, n: Math.round(n) }); }
    function iyiles(u, n) { if (u.olu) return; const v = Math.min(u.mx - u.hp, n); u.hp += v; if (v > 1) fx.push({ t, tip: 'iyi', u: u.uid, n: Math.round(v) }); }
    function durumVer(u, ad, sure, deger) { const d = u.durum[ad]; if (!d || d.sure < sure || (deger || 0) > (d.deger || 0)) u.durum[ad] = { sure, deger }; }
    function menzil(u) { let m = u.menzil; if (alamet === 'sis' && m > 1) m -= 1; return m; }
    function hizCarpan(u) {
      let k = 1 + [0, 0.15, 0.35][sv(u.taraf, 'gok') && u.soy.includes('gok') ? sv(u.taraf, 'gok') : 0];
      const atl = sv(u.taraf, 'atli'); if (atl && u.soy.includes('atli') && t < 6) k += [0, 0.3, 0.6][atl]; // tempo: ilk 4 sn +%40/+%90 → ilk 6 sn +%30/+%60
      if (u.pasif === 'ruzgar' && t < 7) k += 0.35;
      if (u.durum.uluma) k += 0.45;
      k += u.asEk;
      if (u.durum.cosku) k += 0.4;
      if (u.durum.canRuzgar) k += 0.4;
      if (u.durum.geceKanat) k += 0.6;
      if (u.durum.yankiTuy) k += u.durum.yankiTuy.deger; // Tüy yankısı
      if (u.durum.uyanis) k += u.durum.uyanis.deger;     // Uyanış armağanı
      const kis = sv(1 - u.taraf, 'kis'); if (kis) k -= [0, 0.15, 0.3][kis];
      if (u.durum.yavas) k -= u.durum.yavas.deger;
      if (alamet === 'tipi' && !u.soy.includes('kis')) k -= 0.2;
      return Math.max(0.25, k);
    }

    let yetenekSahip = null, vurulan = null; // yetenek() sırasında vurulan düşmanlar (Kızgın Diş, Ayaz Asası)
    function hasar(kaynak, hedef, miktar, tur) {
      if (hedef.olu) return 0;
      if (vurulan && kaynak === yetenekSahip && tur === 'yetenek' && !vurulan.includes(hedef)) vurulan.push(hedef);
      let m = miktar;
      if (kaynak && tur !== 'yansima') {
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
        if (kaynak.durum.ofkeT) m *= 1.35; // Öfke Tılsımı
        if (tur === 'vurus' && kaynak.yankiDis > 0) { m *= 1 + kaynak.yankiDisOran; kaynak.yankiDis--; } // Diş yankısı: sonraki 3 vuruş
        if (AR[kaynak.taraf].kizilGok && alamet !== 'yok') m *= 1 + AS.kizilGok;                       // Kızıl Gök Çocuğu
      }
      // Gün Batımı: bütün hasar türlerinde (zaman içi hasar dahil); yansıma zaten artmış vuruştan hesaplandığı için bir daha çarpılmaz
      if (gbBas !== null && tur !== 'yansima') { const gt = t - gbBas + 1e-9; if (gt >= 0) m *= 1 + gbArtis * Math.floor(gt); }
      if (tur === 'vurus' && hedef.pasif === 'kacis' && R() < 0.25) { fx.push({ t, tip: 'kac', u: hedef.uid }); return 0; }
      if (hedef.durum.dokunulmaz) return 0; // Ana Kaya
      const dv = sv(hedef.taraf, 'dev'); if (dv && hedef.soy.includes('dev')) m *= 1 - [0, 0.12, 0.28][dv];
      if (hedef.pasif === 'tasDeri') m *= 0.8;
      // eşyalardan alınan hasar azaltma (Kabuk, Öfke Tılsımı), toplamı en çok %40
      const az = Math.min(KURAL.esyaAzaltTavan, hedef.azalt + (hedef.durum.ofkeT ? 0.2 : 0)); if (az > 0) m *= 1 - az;
      if (hedef.durum.yankiKabuk) m *= 1 - hedef.durum.yankiKabuk.deger; // Kabuk yankısı (en çok %80)
      if (hedef.kalkan > 0) { const e = Math.min(hedef.kalkan, m); hedef.kalkan -= e; m -= e; }
      m = Math.max(0, m);
      hedef.hp -= m;
      // hasar alınca mana: alınan hasarın %5'i (Sabır Taşı %10), vuruş başına en çok hasarManaTavan; yetenek kurulumunda mana gelmez
      if (tur !== 'dot' && tur !== 'yansima' && !(hedef.kurulum > 0)) hedef.mp = Math.min(hedef.mana, hedef.mp + Math.min(KS.hasarManaTavan, m * (hedef.ef.sabirTasi ? KS.sabirMana : KS.hasarMana)));
      if (m >= 1) fx.push({ t, tip: tur === 'dot' ? 'dot' : 'hasar', u: hedef.uid, n: Math.round(m), k: kaynak ? kaynak.uid : -1 });
      if (kaynak && kaynak.pasif === 'canEmici' && tur !== 'dot' && tur !== 'yansima') iyiles(kaynak, m * 0.2);
      if (kaynak && tur !== 'dot' && tur !== 'yansima') { // can çalma: Pul (vuruşta), Gece Kanadı (vuruşta +%30), Gölge Mürekkebi (yetenekte %25), Pul yankısı (ikisinde)
        const yp = kaynak.durum.yankiPul ? kaynak.durum.yankiPul.deger : 0;
        const o = tur === 'vurus' ? kaynak.cal + (kaynak.durum.geceKanat ? 0.3 : 0) + yp : tur === 'yetenek' ? (kaynak.ef.golgeMurekkebi ? 0.25 : 0) + yp : 0;
        if (o > 0) iyiles(kaynak, m * o);
      }
      // Diken Kabuk (%25) ve Diken Kirpi'nin Diken Sırt'ı (%15): yakın vuruş hasarı saldırgana döner (geri dönen hasar yansımaz, mana vermez)
      if (tur === 'vurus' && kaynak && kaynak.menzil <= 1 && m > 0 && !kaynak.olu) {
        const yo = (hedef.ef.dikenKabuk ? 0.25 : 0) + (hedef.pasif === 'dikenKirpi' ? 0.15 : 0);
        if (yo > 0) hasar(hedef, kaynak, m * yo, 'yansima');
      }
      if (tur === 'vurus' && kaynak && hedef.ef.buzulZirh && !kaynak.olu) durumVer(kaynak, 'yavas', 2, 0.2); // Buzul Zırh
      if (hedef.hp > 0) esikKontrol(hedef);
      if (hedef.hp <= 0) olum(hedef, kaynak);
      return m;
    }
    // "Canı ilk kez %N'nin altına inince" etkileri: savaş başına bir kez
    function esikKontrol(u) {
      const ef = u.ef, e = u.esikTetik, oran = u.hp / u.mx;
      if (ef.ofkeTilsimi && !e.ofke && oran < 0.5) { e.ofke = true; durumVer(u, 'ofkeT', 5); fx.push({ t, tip: 'esya', u: u.uid, ad: 'ofkeTilsimi' }); }
      if (ef.geceKanadi && !e.geceKanat && oran < 0.3) { e.geceKanat = true; durumVer(u, 'geceKanat', 3); fx.push({ t, tip: 'esya', u: u.uid, ad: 'geceKanadi' }); }
      if (ef.anaKaya && !e.anaKaya && oran < 0.4) { e.anaKaya = true; durumVer(u, 'dokunulmaz', 2); fx.push({ t, tip: 'esya', u: u.uid, ad: 'anaKaya' }); }
      if (ef.karaBuz && !e.karaBuz && oran < 0.5) {
        e.karaBuz = true; fx.push({ t, tip: 'esya', u: u.uid, ad: 'karaBuz' });
        for (const o of dusmanlar(u)) if (mesafe(u, o) <= 2.1) durumVer(o, 'sersem', 1);
      }
    }

    function olum(u, katil) {
      if (u.pasif === 'yenidenDogus' && !u.dirildi) { u.dirildi = true; u.hp = u.mx * 0.4; u.durum = {}; fx.push({ t, tip: 'dirilis', u: u.uid }); return; }
      u.olu = true; u.hp = 0; fx.push({ t, tip: 'olum', u: u.uid });
      // Kut Mirası: Kut verilen birim ölünce Kut hakkı bir kez geri gelir
      if (u.kutMiras && AR[u.taraf].kutMirasi && !kutMirasK[u.taraf]) { kutMirasK[u.taraf] = true; kutKalan[u.taraf]++; fx.push({ t, tip: 'kutMiras', u: u.uid }); }
      if (u.ef.geceYuregi) for (const d of dostlar(u)) if (mesafe(u, d) <= 2.1) kalkanVer(d, u.mx * 0.25);
      for (const d of birimler) {
        if (d.olu) continue;
        if (d.taraf === u.taraf && d.pasif === 'ruhBagi') manaEkle(d, 25); // tempo: 35 → 25 (savaş uzadı, yetenek sıklığı)
        if (d.taraf !== u.taraf && d.pasif === 'karanlikPay') d.payYigin++;
        if (d.taraf === u.taraf && d.ef.ruhTestisi) { manaEkle(d, 20); iyiles(d, d.mx * 0.1); } // denge: 30 → 20 mana (DENGE_RAPORU.md)
        if (d.taraf !== u.taraf && d.ef.avCoskusu) durumVer(d, 'cosku', 3);
      }
      if (katil && !katil.olu && katil.taraf !== u.taraf) {
        if (katil.ef.geceAvcisi) iyiles(katil, u.mx * 0.2);
        if (katil.ef.golgePelerini) { durumVer(katil, 'hedefAlinmaz', 1.5); iyiles(katil, katil.mx * 0.15); } // denge: + %15 iyileşme (DENGE_RAPORU.md)
      }
    }

    let yeniHedef = false; // bu vuruş yeni bir hedefe mi (Buz Mızrağı)
    function vurusEtki(u, h) {
      const od = sv(u.taraf, 'ates');
      if (od && u.soy.includes('ates')) durumVer(h, 'yanik', [0, 2, 3][od], [0, 12, 28][od] * (alamet === 'yaz' ? 2 : 1));
      if (u.pasif === 'zehirDis') durumVer(h, 'zehir', 3, 18 * u.kc);
      if (u.pasif === 'soguk') durumVer(h, 'yavas', 2, 0.2);
      if (u.pasif === 'gokGurultu' && u.vurus % 4 === 0) {
        const yak = dusmanlar(u).filter(o => o !== h).sort((a, b) => mesafe(h, a) - mesafe(h, b)).slice(0, 2);
        for (const o of yak) { hasar(u, o, u.atk * 0.7, 'yetenek'); fx.push({ t, tip: 'simsek', k: h.uid, u: o.uid }); }
      }
      if (h.olu) return;
      const ef = u.ef;
      if (ef.buzMizragi && yeniHedef) durumVer(h, 'sersem', 0.8);
      if (ef.karTanesi) durumVer(h, 'yavas', 2, 0.15);
      if (ef.simsekTuyu && u.vurus % 5 === 0) {
        const yak = dusmanlar(u).filter(o => o !== h).sort((a, b) => mesafe(h, a) - mesafe(h, b)).slice(0, 2);
        for (const o of yak) { hasar(u, o, 70 * u.kc * (1 + u.yg), 'yetenek'); fx.push({ t, tip: 'simsek', k: h.uid, u: o.uid }); }
      }
      if (ef.yelKanadi && u.vurus % 5 === 0 && !h.olu) { fx.push({ t, tip: 'vurus', k: u.uid, u: h.uid, menzilli: u.menzil > 1 }); hasar(u, h, u.atk, 'vurus'); }
    }

    function yetenek(u) {
      const c = u.kc * (1 + u.yg) * u.kutCarpan, h = u.hedef && !u.hedef.olu ? u.hedef : enYakin(u);
      u.kutCarpan = 1;
      yetenekSahip = u; vurulan = [];
      yetenekCalis(u, c, h);
      const v = vurulan; vurulan = null; yetenekSahip = null;
      // yetenek sonrası eşya kancaları (sabit sıra)
      const ef = u.ef, ky = u.kc * (1 + u.yg);
      if (ef.kizginDis) for (const o of v) if (!o.olu) durumVer(o, 'yanik', 3, 30 * ky);
      if (ef.ayazAsasi) for (const o of v) if (!o.olu) durumVer(o, 'yavas', 2, 0.3);
      if (u.olu) return;
      if (ef.tasMuhur) kalkanVer(u, 120 * ky);
      if (ef.canAtesi) { const y = dostlar(u).sort((a, b) => a.hp / a.mx - b.hp / b.mx)[0]; if (y) iyiles(y, 100 * ky); }
      if (ef.buzPinari) for (const d of dostlar(u)) if (d !== u && mesafe(d, u) <= 2.1) kalkanVer(d, 80 * u.kc);
      if (ef.bilgeAsasi) u.mp = Math.min(u.mana, u.mp + 25);
      if (ef.ruzgarCani) durumVer(u, 'canRuzgar', 3);
      if (u.yankiCiy) { u.mp = Math.min(u.mana, u.mp + u.yankiCiy); u.yankiCiy = 0; } // Çiy yankısı: yetenekten hemen sonra
    }
    function yetenekCalis(u, c, h) {
      fx.push({ t, tip: 'yetenek', u: u.uid, ad: u.yetenek });
      const cevre = (merkez, r) => dusmanlar(u).filter(o => mesafe(o, merkez) <= r);
      switch (u.yetenek) {
        case 'tasFirlat': if (h) { hasar(u, h, 200 * c, 'yetenek'); durumVer(h, 'sersem', 1.5); } break;
        case 'uluma': for (const d of dostlar(u)) if (mesafe(d, u) <= 2.1) durumVer(d, 'uluma', 4); break;
        case 'davul': for (const d of dostlar(u)) durumVer(d, 'davul', 4); break;
        case 'ruhEmme': if (h) { const v = hasar(u, h, 170 * c, 'yetenek'); iyiles(u, v); } break;
        case 'kasirga': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 110 * c, 'yetenek'); o.y += (o.taraf === 0 ? 1.5 : -1.5); o.y = Math.max(0.4, Math.min(7.6, o.y)); if (!o.olu) { ayris(o); o.hedef = null; } } break;
        case 'deliOfke': u.ofke = 3; iyiles(u, u.mx * 0.2); break;
        case 'zehir': if (h) durumVer(h, 'zehir', 4, 55 * c); { const y = dostlar(u).sort((a, b) => a.hp / a.mx - b.hp / b.mx)[0]; if (y) iyiles(y, 160 * c); } break;
        case 'buzNefes': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 120 * c, 'yetenek'); durumVer(o, 'sersem', 1.2); } break;
        case 'ocak': for (const o of cevre(u, 2.2)) durumVer(o, 'yanik', 4, 40 * c); for (const d of dostlar(u)) if (mesafe(d, u) <= 2.2) iyiles(d, 110 * c); break;
        case 'dortnal': { const arka = dusmanlar(u).sort((a, b) => mesafe(u, b) - mesafe(u, a))[0]; if (arka) { u.x = arka.x; u.y = arka.y + (u.taraf === 0 ? 0.8 : -0.8); ayris(u); u.hedef = arka; hasar(u, arka, 190 * c, 'yetenek'); } } break;
        case 'kanat': for (const d of dostlar(u)) kalkanVer(d, 140 * c); break;
        case 'karaGolge': { const g2 = dusmanlar(u).sort((a, b) => b.atk - a.atk)[0]; if (g2) { hasar(u, g2, 140 * c, 'yetenek'); durumVer(g2, 'lanet', 5); } } break;
        case 'kulDogus': if (h) for (const o of cevre(h, 1.6)) { hasar(u, o, 170 * c, 'yetenek'); durumVer(o, 'yanik', 3, 25 * c); } break;
        case 'ayaz': for (const o of dusmanlar(u)) { hasar(u, o, 70 * c, 'yetenek'); durumVer(o, 'yavas', 3, 0.4); } break;
        case 'golgeOk': { const z = dusmanlar(u).sort((a, b) => a.hp - b.hp)[0]; if (z) hasar(u, z, 320 * c, 'yetenek'); } break;
        // canavar yetenekleri (bölüm 5.5)
        case 'akrepZehir': if (h) durumVer(h, 'zehir', 4, 60 * c); break;
        case 'balinaSarki': for (const o of dusmanlar(u)) hasar(u, o, 110 * c, 'yetenek'); break;
        case 'bekciDarbe': if (h) { hasar(u, h, 250 * c, 'yetenek'); durumVer(h, 'sersem', 1.5); } break;
        case 'yildizYutan': for (const o of dusmanlar(u).sort((a, b) => mesafe(u, a) - mesafe(u, b)).slice(0, 3)) hasar(u, o, 220 * c, 'yetenek'); break;
        case 'yildirim': { const ds = dusmanlar(u); for (let k = 0; k < 3 && ds.length; k++) { const o = ds.splice(Math.floor(R() * ds.length), 1)[0]; hasar(u, o, 150 * c, 'yetenek'); durumVer(o, 'sersem', 0.6); fx.push({ t, tip: 'simsek', k: u.uid, u: o.uid }); } } break;
      }
    }

    // Kut: kendi biriminin manasını anında doldurur (oyuncunun müdahalesi). Savaş başına KURAL.kut.hak (Çifte Kut +1, Son İki opt.kutHak);
    // ikinci hak ilkinden en az KURAL.kut.ara sn sonra. Kut Yankısı (7.1): Kut verilen birim taşıdığı her bileşen için ek etki alır.
    const kutKalan = [0, 1].map(tr => kutYok ? 0 : (opt.kutHak ? opt.kutHak[tr] : KU.hak) + (AR[tr].cifteKut ? 1 : 0));
    const kutSayac = [0, 0], sonKutT = [-1e9, -1e9], kutMirasK = [false, false];
    const kutSira = (opt.kut || []).slice().sort((a, b) => a.t - b.t); // [{t, taraf, i}]
    function kut(taraf, i) {
      if (kutYok || kutKalan[taraf] <= 0 || bitti) return false;
      if (t - sonKutT[taraf] + 1e-9 < KU.ara) return false;
      const u = birimler.find(o => o.taraf === taraf && o.i === i && !o.olu); if (!u) return false;
      kutKalan[taraf]--; kutSayac[taraf]++; sonKutT[taraf] = t;
      u.mp = u.mana; fx.push({ t, tip: 'kut', u: u.uid });
      kutYanki(u);
      if (AR[taraf].uyanis) durumVer(u, 'uyanis', 999, AS.uyanis);
      if (AR[taraf].kutMirasi) u.kutMiras = true;
      if (AR[taraf].isikSutunu) for (const d of dostlar(u)) if (d !== u && mesafe(u, d) <= AS.isikMenzil) manaEkle(d, d.mana * AS.isikSutunu);
      if (opt.kayit) opt.kayit.push({ t: +t.toFixed(2), taraf, i });
      return true;
    }
    // Yankılar: fx yuva ve tarif sırasıyla (bileşen başına bir olay); etkiler sabit sırayla Kor, Diş, Tüy, Kabuk, Yürek, Pul, Buz (Çiy yetenekten sonra)
    function kutYanki(u) {
      for (const id of u.yankiSira) fx.push({ t, tip: 'kutYanki', u: u.uid, bilesen: id });
      const kat = u.kutTasi > 0 ? KY.kutTasi : 1, n = (id) => (u.kutYanki[id] || 0) * kat;
      let kc = 1; for (let k = 0; k < n('kor'); k++) kc *= KY.kor;
      if (u.ef.kutOcagi) kc *= KY.ocak; // Kut Ocağı: ek ×1,5
      u.kutCarpan = kc;
      if (n('dis')) { u.yankiDis = KY.disVurus; u.yankiDisOran = KY.disOran * n('dis'); }
      if (n('tuy')) durumVer(u, 'yankiTuy', KY.tuySure, KY.tuyOran * n('tuy'));
      if (n('kabuk')) durumVer(u, 'yankiKabuk', KY.kabukSure, Math.min(KY.kabukTavan, KY.kabukOran * n('kabuk')));
      if (n('yurek')) iyiles(u, u.mx * KY.yurek * n('yurek'));
      if (n('pul')) durumVer(u, 'yankiPul', KY.pulSure, KY.pulOran * n('pul'));
      if (n('buz')) kalkanVer(u, KY.buz * u.kc * n('buz'));
      if (n('ciy')) u.yankiCiy = KY.ciy * n('ciy');
    }
    // Yapay zekâ Kut'u (7.4): puanı en yüksek birime; puan = (mana − mp) × kc + 20 × bileşen + (Kut Ocağı 60). Eşitlikte küçük i.
    function kutYZ(taraf) {
      let en = null, ep = -Infinity;
      for (const o of birimler) {
        if (o.taraf !== taraf || o.olu) continue;
        const p = (o.mana - o.mp) * o.kc + KU.yzBilesen * o.bilesenSay + (o.ef.kutOcagi ? KU.yzOcak : 0);
        if (p > ep) { ep = p; en = o; }
      }
      if (en) kut(taraf, en.i);
    }
    // Yapay zekâ tarafları: opt.yz bütün hakları kullanır; opt.yzYedek (kayıtlı dokunuşu olan hayalet) yalnız kayıttaki dokunuşlar bittikten
    // sonra kalan hakları (kayıttaki birim ölmüşse ya da ikinci hak). İlk hak yzZaman, sonrakiler yzZaman2 saniyesinde.
    const yzT = [...new Set([...(opt.yz || []), ...(opt.yzYedek || [])])], yzYedek = opt.yzYedek || [];
    const yz1 = opt.yzZaman || KU.yzZaman, yz2 = opt.yzZaman2 || KU.yzZaman2;

    const DT = 0.05;
    function adim() {
      if (bitti) return;
      fx.length = 0;
      while (kutSira.length && kutSira[0].t <= t + 1e-9) { const k = kutSira.shift(); kut(k.taraf, k.i); }
      for (const tr of yzT) if (kutKalan[tr] > 0 && t >= (kutSayac[tr] ? yz2 : yz1) && (!yzYedek.includes(tr) || !kutSira.some(k => k.taraf === tr))) kutYZ(tr);
      if (gbBas !== null && !gbBasladi && t - gbBas + 1e-9 >= 0) { gbBasladi = true; fx.push({ t, tip: 'gunBatimi' }); }

      for (const u of birimler) {
        if (u.olu) continue;
        for (const k in u.durum) { u.durum[k].sure -= DT; if (u.durum[k].sure <= 0) delete u.durum[k]; }
        if (u.durum.yanik) hasar(null, u, u.durum.yanik.deger * DT, 'dot');
        if (u.durum.zehir && !u.olu) hasar(null, u, u.durum.zehir.deger * DT, 'dot');
        if (u.olu) continue;
        const su = sv(u.taraf, 'su'); if (su && u.soy.includes('su')) iyilesSessiz(u, u.mx * [0, 0.02, 0.05][su] * DT);
        if (u.pasif === 'sicakKalp') iyilesSessiz(u, u.mx * 0.03 * DT);
        if (u.ef.sifaPinari) iyilesSessiz(u, u.mx * 0.02 * DT);
        // sersem: bekler (yetenek kurulumu iptal olmaz, süresi işlemez: sersemlik bitince kaldığı yerden sürer); hedef bırakılır
        if (u.durum.sersem) { u.hedef = null; continue; }

        // yetenek kurulumu: mana dolunca kurulumSure sn bekler (saldırmaz, yürümez, mana kazanmaz), sonra etki eder.
        // Kurulum başında 'kurulum' olayı (sure: sn): sunum yetenek pozunu ona hizalar.
        if (u.kurulum > 0) { u.kurulum -= DT; if (u.kurulum > 1e-9) continue; u.kurulum = 0; yetenek(u); if (bittiMi()) return; continue; }
        if (u.mp >= u.mana) {
          u.mp = 0;
          if (u.kurulumSure > 0) { u.kurulum = u.kurulumSure; fx.push({ t, tip: 'kurulum', u: u.uid, ad: u.yetenek, sure: u.kurulumSure }); continue; }
          yetenek(u); if (bittiMi()) return; continue;
        }
        // kalıcı hedef: hedef ölene, hedef alınamaz olana, menzilin hedefBirak ötesine geçene ya da Dev Kükremesi başka birimi zorlayana dek korunur
        { const hd = u.hedef, z = u.durum.zorla;
          if (!hd || hd.olu || hd.durum.hedefAlinmaz || (z && z.deger !== hd.uid) || mesafe(u, hd) > menzil(u) + KS.hedefBirak) u.hedef = enYakin(u); }
        const h = u.hedef; if (!h) continue;
        const d = mesafe(u, h);
        if (d > menzil(u) + 0.05) {
          // yürüme (hücre/sn): tempo için 1,7 → 1,2, Çevik 2,4 → 1,6 (kim kime yürüdü okunsun). Yol tıkalıysa yana döner;
          // tamamen tıkalıysa bekler ve en yakın düşmanı yeniden seçer (üst üste binme yok)
          const hiz = (u.soy.includes('atli') ? 1.6 : 1.2) * (u.ef.bulutNali ? 1.5 : 1) * DT, adimU = Math.min(hiz, d - menzil(u));
          const yon = yurumeYonu(u, (h.x - u.x) / d, (h.y - u.y) / d, adimU);
          if (yon) { u.x += yon[0] * adimU; u.y += yon[1] * adimU; } else u.hedef = enYakin(u);
        } else {
          u.cd -= DT * hizCarpan(u);
          if (u.cd <= 0) {
            u.cd = 1 / u.as; u.vurus++;
            fx.push({ t, tip: 'vurus', k: u.uid, u: h.uid, menzilli: u.menzil > 1 });
            let vm = u.atk;
            if (u.ef.yirticiPence && u.vurus % 3 === 0) vm += h.mx * 0.08;
            if (u.ef.devYumrugu) vm += u.mx * 0.02;
            if (u.ef.bulutNali && !u.ilkVurusYapildi) vm *= 2;
            u.ilkVurusYapildi = true; yeniHedef = h.uid !== u.sonHedefUid; u.sonHedefUid = h.uid;
            hasar(u, h, vm, 'vurus');
            if (!h.olu && !u.olu) vurusEtki(u, h);
            const bl = sv(u.taraf, 'bilge') && u.soy.includes('bilge') ? [0, 0.3, 0.7][sv(u.taraf, 'bilge')] : 0;
            if (!u.olu) manaEkle(u, u.vurusMana * (1 + bl));
          }
        }
        if (bittiMi()) return;
      }
      // son düşman zaman içi hasarla öldüyse ve kalanlar hedefsiz kaldıysa (kimse vurmadı) savaş bu adımda biter
      if (bittiMi()) return;
      t += DT;
      // süre doldu: iki taraf da kaybeder (kazanan −2). t 0,05 adımlarla birikir: 45 sn 44,999… olarak gelir (1e-9 payı; C# ile aynı)
      if (t + 1e-9 >= KURAL.savasSuresi) bitir(-2);
    }
    function iyilesSessiz(u, n) { u.hp = Math.min(u.mx, u.hp + n); }
    function bittiMi() {
      const a = birimler.some(o => o.taraf === 0 && !o.olu), b = birimler.some(o => o.taraf === 1 && !o.olu);
      if (a && b) return false; bitir(a ? 0 : b ? 1 : -1); return true;
    }
    // kazanan: 0 | 1 | −1 (ikisi de öldü) | −2 (süre doldu: iki taraf da kaybetti; sureDoldu: true).
    // −2'de kalan/kalanPuan/kalanSayi taraf 1'in sağ kalanları (taraf 0'ın yenilgi hasarına eklenir), kalanPuanB/kalanSayiB taraf 0'ınki.
    function bitir(k) {
      bitti = true;
      const sagT = (tr) => birimler.filter(o => !o.olu && o.taraf === tr), puan = (l) => l.reduce((s, o) => s + (o.b.s || 1), 0);
      const sag = sagT(k === -2 ? 1 : k);
      const kalan = sag.reduce((s, o) => s + o.kc * o.kademe, 0); // eski ölçü (uyumluluk); canavar kademe 0
      const kalanPuan = puan(sag);                                  // lobi hasarı: ★1 = 1, ★2 = 2, ★3 = 3
      sonuc = { kazanan: k, sure: +t.toFixed(2), kalan, kalanPuan, kalanSayi: sag.length, kut: kutSayac.slice() }; // kut: tarafların kullandığı Kut sayısı (Saklı Kut)
      if (k === -2) { const s0 = sagT(0); sonuc.sureDoldu = true; sonuc.kalanPuanB = puan(s0); sonuc.kalanSayiB = s0.length; }
    }
    function sonunaKadar() { let n = 0; while (!bitti && n++ < 100000) adim(); return sonuc; }

    return { birimler, fx, adim, sonunaKadar, kut, get t() { return t; }, get bitti() { return bitti; }, get sonuc() { return sonuc; },
      // kutVar: Kut hakkı kaldı mı; kutHazir: şu an kullanılabilir mi (ara süresi); kutKalanSay / kutHakSay: arayüzdeki "1/2" sayacı
      kutVar: (taraf) => !kutYok && kutKalan[taraf] > 0, kutHazir: (taraf) => !kutYok && kutKalan[taraf] > 0 && t - sonKutT[taraf] + 1e-9 >= KU.ara,
      kutKalanSay: (taraf) => kutKalan[taraf], kutHakSay: (taraf) => kutKalan[taraf] + kutSayac[taraf], kutYok, soylar, DT, gunBatimiCarpan, gunBatimiBasla: gbBas };
  }

  const api = { Savas, birimStat, soySay, rng };
  g.KUT_SIM = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
