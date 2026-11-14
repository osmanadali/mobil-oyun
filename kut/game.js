/* KUT ARENA — arayüz ve maç akışı. Çizim yer tutucudur (emoji + renkli daire); sanat gelince `ciz*` işlevleri değişir. */
(() => {
  const D = KUT_DATA, S = KUT_SIM, O = KUT_ONLINE, K = Object.assign({}, D.KURAL, D.KURAL.hizli); // ilk prototip: Hızlı Maç kuralları
  const $ = (id) => document.getElementById(id);
  const kh = (id) => D.kahraman(id);

  // ── Profil (kalıcı) ──
  const PANAHTAR = 'kut.profil.v1';
  let P = (() => { try { return JSON.parse(localStorage.getItem(PANAHTAR)) || null; } catch (e) { return null; } })() ||
    { kupa: 0, usta: {}, oyuncu: Math.random().toString(36).slice(2, 10), ad: 'Oyuncu', sonTakim: null, mac: null, istat: { mac: 0, birinci: 0 } };
  const kaydet = () => { try { localStorage.setItem(PANAHTAR, JSON.stringify(P)); } catch (e) {} };

  // ── Yardımcılar ──
  let bildirimZ;
  function bildir(m) { const b = $('bildirim'); b.textContent = m; b.classList.add('acik'); clearTimeout(bildirimZ); bildirimZ = setTimeout(() => b.classList.remove('acik'), 1600); }
  function ekran(id) { document.querySelectorAll('.ekran').forEach(e => e.classList.toggle('aktif', e.id === id)); }
  function pencere(html) { $('pencere').innerHTML = html; $('perde').classList.add('acik'); }
  function kapat() { $('perde').classList.remove('acik'); }
  $('perde').addEventListener('click', e => { if (e.target.id === 'perde' || e.target.dataset.kapat !== undefined) kapat(); });
  const ustaSv = (id) => Math.floor((P.usta[id] || 0) / 5);
  const birimAd = (b) => b.f ? kh(b.h).ad.split(' ')[0] + '×' + kh(b.f).ad.split(' ')[0] : kh(b.h).ad;

  // ── Ana ekran ──
  function anaGoster() {
    $('aKupa').textContent = P.kupa;
    $('aUsta').textContent = Object.keys(P.usta).reduce((s, k) => s + ustaSv(k), 0);
    $('bOyna').innerHTML = P.mac ? `▶️ Devam Et <small>Tur ${P.mac.tur} · ${P.mac.zafer}/7 zafer · ${P.mac.can} can</small>` : '⚔️ Oyna <small>~7 dk · çevrimiçi hayaletler</small>';
    $('aDurum').textContent = window.KUT_UZAK ? '🟢 Çevrimiçi havuz bağlı' : '🟡 Çevrimiçi havuz bağlı değil — rakipler bot (KUT_UZAK takılınca gerçek oyuncular)';
    ekran('ana');
  }
  $('bOyna').onclick = () => { if (!P.mac) yeniMac(); else turBaslat(true); };
  $('bNasil').onclick = () => pencere(`<h3>Nasıl oynanır</h3><ul>
    <li><b>Her tur 10 🪙</b>: dükkândan kahraman al (fiyat = kademe). Altın biriktirilmez — geride kalan da her tur eşit güçte alışveriş yapar.</li>
    <li><b>3 aynı kahraman</b> otomatik birleşir → ★2 (×1,8). Üç ★2 → ★3 (×3).</li>
    <li><b>🔥 Kaynaştır (3🪙)</b>: iki farklı kahramanı tek kahramana dönüştür. İlki <i>yeteneği</i>, ikincisi <i>pasifi</i> verir; ikisinin <i>soyları birden</i> sayılır.</li>
    <li><b>Rakibini önceden gör</b>: dükkân başında sıradaki rakibin kadrosu görünür — ona göre karşı kur.</li>
    <li><b>Alamet</b>: her turun kendi kuralı vardır (Kan Ayı, Sis, Tipi…).</li>
    <li><b>✨ Kut</b>: savaş kendi kendine oynar ama sen <i>bir kez</i> bir kahramanına dokunup yeteneğini anında patlatabilirsin. Doğru an maçı çevirir.</li>
    <li><b>5 can · 7 zafer</b>. Kaybedince 1 can gider. Bir maç ~7 dakika.</li></ul><button class="btn" data-kapat>Tamam</button>`);
  $('bKodeks').onclick = () => {
    const sat = D.KAHRAMANLAR.map(h => `<div class="kodeksSatir"><div class="em" style="--renk:${h.renk}">${h.emoji}</div><div class="bilgi">
      <b>${h.ad}</b> · ${'🪙'.repeat(h.kademe)} · ${h.soy.map(s => D.SOYLAR[s].emoji + D.SOYLAR[s].ad).join(' ')}<br>
      ❤️${h.can} ⚔️${h.atk} ⏱${h.as}/sn 🎯${h.menzil}<br>
      <b style="font-size:12px">✨ ${D.YETENEK[h.yetenek].ad}</b>: ${D.YETENEK[h.yetenek].m}<br>
      <b style="font-size:12px">◆ ${D.PASIF[h.pasif].ad}</b>: ${D.PASIF[h.pasif].m}<br>
      Ustalık Sv.${ustaSv(h.id)} (${P.usta[h.id] || 0} zafer) — Sv.2 çerçeve · Sv.5 ikinci görünüm · Sv.10 efsane görünüm</div></div>`).join('');
    const soy = Object.entries(D.SOYLAR).map(([k, s]) => `<li>${s.emoji} <b>${s.ad}</b> (2/4): ${s.aciklama.join(' / ')}</li>`).join('');
    pencere(`<h3>Kahramanlar</h3><div class="kodeks">${sat}</div><h3>Soylar</h3><ul>${soy}</ul><button class="btn" data-kapat>Kapat</button>`);
  };

  // ── Düello kodu ──
  $('bDuello').onclick = () => {
    const kod = P.sonTakim ? O.kodla(P.sonTakim, P.ad) : null;
    pencere(`<h3>🤝 Düello Kodu</h3>
      <p>Son maçındaki takımın bir koda dönüşür. Arkadaşına at; o da kendi koduyla seninkini dövüştürsün. Sunucu gerekmez.</p>
      ${kod ? `<div class="kodKutu" id="dKod">${kod}</div><button class="btn kucuk" id="dKopya">📋 Kopyala / Paylaş</button>` : '<p><i>Önce bir maç oyna — son takımın kaydedilir.</i></p>'}
      <p>Arkadaşının kodu:</p><textarea id="dGir" placeholder="KUT2-..."></textarea>
      <button class="btn ana" id="dDovus">⚔️ Dövüştür</button><button class="btn" data-kapat>Kapat</button>`);
    if (kod) $('dKopya').onclick = async () => {
      try { if (navigator.share) await navigator.share({ text: 'Kut Arena takımım: ' + kod }); else { await navigator.clipboard.writeText(kod); bildir('Kopyalandı'); } } catch (e) {}
    };
    $('dDovus').onclick = () => {
      const r = O.coz($('dGir').value); if (!r) return bildir('Kod çözülemedi');
      if (!P.sonTakim) return bildir('Önce bir maç oyna');
      kapat();
      const alamet = D.ALAMETLER[Math.floor(Math.random() * D.ALAMETLER.length)].id;
      savasBaslat({ benim: P.sonTakim, rakip: { ad: r.ad || 'Arkadaş', takim: r.takim }, alamet, tohum: (Math.random() * 1e9) | 0, duello: true });
    };
  };

  // ── Maç durumu ──
  let M = null; // P.mac'a bağlı
  function yeniMac() {
    P.mac = { tur: 1, can: K.can, zafer: 0, altin: 0, tahta: Array(6).fill(null), yedek: Array(K.yedek).fill(null), dukkan: [], kilit: false,
      tohum: (Math.random() * 1e9) | 0, zar: 1, alamet: 'yok', rakip: null, gecmis: [] };
    turBaslat(false);
  }
  function zar() { M.zar = (M.zar * 1103515245 + 12345) & 0x7fffffff; return M.zar / 0x7fffffff; }

  async function turBaslat(devam) {
    M = P.mac; ekran('mac'); secili = null; kaynasMod = false;
    if (!devam) {
      M.alamet = M.tur === 1 ? 'yok' : D.ALAMETLER[Math.floor(zar() * D.ALAMETLER.length)].id;
      M.altin = K.altinTur + (M.alamet === 'pazar' ? 2 : 0);
      if (!M.kilit || !M.dukkan.length) dukkanDoldur(); M.kilit = false;
      M.rakip = null; ciz();
      M.rakip = await O.Hayalet.bul({ tur: M.tur, kupa: P.kupa, oyuncu: P.oyuncu, tohum: M.tohum + M.tur * 31 });
      kaydet();
    }
    ciz();
  }
  function dukkanDoldur() {
    const ol = K.kademeOlasilik(M.tur);
    M.dukkan = Array.from({ length: K.dukkan }, () => {
      const r = zar(); const k = r < ol[0] ? 1 : r < ol[0] + ol[1] ? 2 : 3;
      const l = D.KAHRAMANLAR.filter(h => h.kademe === k); return l[Math.floor(zar() * l.length)].id;
    });
  }
  const tahtaSay = () => M.tahta.filter(Boolean).length;
  const yuva = () => K.yuva(M.tur);

  // ── Seçim / taşıma ──
  let secili = null;  // {yer:'tahta'|'yedek', i}
  let kaynasMod = false;
  const al = (s) => M[s.yer][s.i];
  const koy = (s, v) => { M[s.yer][s.i] = v; };

  function yuvaDokun(yer, i) {
    const hedef = { yer, i }, b = M[yer][i];
    if (secili && kaynasMod) {
      const a = al(secili);
      if (!b || (secili.yer === yer && secili.i === i)) { kaynasMod = false; return ciz(); }
      if (a.f || b.f) { bildir('Kaynaşmış kahraman tekrar kaynaşmaz'); return; }
      if (a.h === b.h) { bildir('Aynı kahraman kaynaşmaz — 3 tanesi zaten ★ olur'); return; }
      if (M.altin < K.kaynastir) { bildir('3🪙 gerekli'); return; }
      M.altin -= K.kaynastir;
      koy(secili, { h: a.h, f: b.h, s: Math.min(a.s, b.s) }); koy(hedef, null);
      kaynasMod = false; bildir(`🔥 ${birimAd(al(secili))} doğdu!`); kaydet(); return ciz();
    }
    if (!secili) { if (b) secili = hedef; return ciz(); }
    if (secili.yer === yer && secili.i === i) { secili = null; return ciz(); }
    // taşı / yer değiştir
    const a = al(secili);
    if (yer === 'tahta' && secili.yer === 'yedek' && !b && tahtaSay() >= yuva()) { bildir(`Bu tur en fazla ${yuva()} kahraman`); return; }
    koy(secili, b); koy(hedef, a); secili = b ? null : null; kaydet(); ciz();
  }
  function sat() {
    const b = al(secili); if (!b) return;
    const deger = (h) => kh(h).kademe;
    M.altin += b.s === 1 ? deger(b.h) + (b.f ? deger(b.f) : 0) : deger(b.h) * (b.s === 2 ? 3 : 9) - 1;
    koy(secili, null); secili = null; kaynasMod = false; kaydet(); ciz();
  }
  function satinAl(i) {
    const id = M.dukkan[i]; if (!id) return;
    const f = kh(id).kademe; if (M.altin < f) return bildir('Altın yetmiyor');
    // birleşecekse yer gerekmez
    const ayni = [...M.tahta, ...M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length;
    let yer = null;
    if (ayni < 2) {
      const ti = M.tahta.findIndex(x => !x);
      if (tahtaSay() < yuva() && ti >= 0) yer = { yer: 'tahta', i: ti };
      else { const yi = M.yedek.findIndex(x => !x); if (yi >= 0) yer = { yer: 'yedek', i: yi }; }
      if (!yer) return bildir('Yer yok — sat ya da kaynaştır');
      koy(yer, { h: id, s: 1 });
    } else {
      const yi = M.yedek.findIndex(x => !x), ti = M.tahta.findIndex(x => !x);
      yer = yi >= 0 ? { yer: 'yedek', i: yi } : { yer: 'tahta', i: ti }; koy(yer, { h: id, s: 1 });
    }
    M.altin -= f; M.dukkan[i] = null;
    birlestir(id); kaydet(); ciz();
  }
  function birlestir(id) {
    for (const s of [1, 2]) {
      const yerler = [];
      for (const yer of ['tahta', 'yedek']) M[yer].forEach((b, i) => { if (b && !b.f && b.h === id && b.s === s) yerler.push({ yer, i }); });
      if (yerler.length >= 3) {
        const [ilk, ...kalan] = yerler.slice(0, 3); kalan.forEach(y => koy(y, null)); koy(ilk, { h: id, s: s + 1 });
        bildir(`⭐ ${kh(id).ad} ★${s + 1}!`);
      }
    }
  }
  $('bYenile').onclick = () => { if (M.altin < K.yenile) return bildir('Altın yetmiyor'); M.altin -= K.yenile; dukkanDoldur(); kaydet(); ciz(); };
  $('bKilit').onclick = () => { M.kilit = !M.kilit; kaydet(); ciz(); };
  $('bSavas').onclick = () => {
    const takim = takimAl(); if (!takim.length) return bildir('Tahtaya en az 1 kahraman koy');
    if (!M.rakip) return bildir('Rakip aranıyor…');
    savasBaslat({ benim: takim, rakip: M.rakip, alamet: M.alamet, tohum: M.tohum + M.tur });
  };
  const takimAl = () => M.tahta.map((b, i) => b && { h: b.h, s: b.s, ...(b.f ? { f: b.f } : {}), x: i % 3, y: Math.floor(i / 3) * 2 }).filter(Boolean); // 3×2 prototip tahtası: ön sıra → 0, arka sıra → 2 (4×3 motorda)

  // ── Maç ekranı çizimi ──
  function birimHTML(b) {
    const h = kh(b.h);
    return `<div class="birim${b.f ? ' kaynasik' : ''}" style="--renk:${h.renk}"><span class="yildiz">${'★'.repeat(b.s)}</span><span class="em">${h.emoji}</span>${b.f ? `<span class="ek">${kh(b.f).emoji}</span>` : ''}<span class="ad">${birimAd(b)}</span></div>`;
  }
  function ciz() {
    if (!M) return;
    $('mCan').textContent = M.can; $('mZafer').textContent = M.zafer; $('mTur').textContent = M.tur; $('mAltin').textContent = M.altin;
    $('mSay').textContent = tahtaSay(); $('mYuva').textContent = yuva();
    const al_ = D.ALAMETLER.find(a => a.id === M.alamet);
    $('mAlamet').innerHTML = `${al_.emoji} Alamet: <b>${al_.ad}</b> — ${al_.m}`;
    const r = M.rakip;
    $('mRakip').innerHTML = r ? `Sıradaki rakip: <b>${r.ad}</b> ${r.kaynak === 'bot' ? '🤖' : '👤'} · ${r.takim.map(b => `<span class="mini" title="${birimAd(b)}">${kh(b.h).emoji}${b.s > 1 ? '★' + b.s : ''}${b.f ? '+' + kh(b.f).emoji : ''}</span>`).join(' ')}
      · ${Object.entries(S.soySay(r.takim)).filter(([, v]) => v.seviye).map(([k, v]) => D.SOYLAR[k].emoji + v.n).join(' ')}` : 'Rakip aranıyor…';
    // soylar
    const sy = S.soySay(takimAl());
    $('mSoylar').innerHTML = Object.entries(sy).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => {
      const s = D.SOYLAR[k]; return `<span class="soy s${v.seviye}" title="${s.aciklama.join(' / ')}">${s.emoji} ${s.ad} ${v.n}/${v.n >= s.esik[0] ? s.esik[1] : s.esik[0]}</span>`;
    }).join('');
    // tahta + yedek
    for (const yer of ['tahta', 'yedek']) {
      const kap = $(yer === 'tahta' ? 'mTahta' : 'mYedek'); kap.innerHTML = '';
      M[yer].forEach((b, i) => {
        const d = document.createElement('div'); d.className = 'yuva' + (yer === 'tahta' && i >= 3 ? ' arka' : '');
        if (secili && !(secili.yer === yer && secili.i === i) && (kaynasMod ? b : true)) d.classList.add('hedefle');
        if (b) d.innerHTML = birimHTML(b);
        if (secili && secili.yer === yer && secili.i === i) d.firstChild && d.firstChild.classList.add('secili');
        d.onclick = () => yuvaDokun(yer, i); kap.appendChild(d);
      });
    }
    // seçim paneli
    const sp = $('mSecim');
    if (secili && al(secili)) {
      const b = al(secili), st = S.birimStat(b), h = kh(b.h);
      sp.className = 'secimPanel acik';
      sp.innerHTML = `<h4>${h.emoji} ${birimAd(b)} ${'★'.repeat(b.s)}</h4>
        <div class="satir">❤️ <b>${st.can}</b> ⚔️ <b>${st.atk}</b> ⏱ <b>${st.as.toFixed(2)}</b>/sn 🎯 <b>${st.menzil}</b> · ${st.soy.map(s => D.SOYLAR[s].emoji + D.SOYLAR[s].ad).join(' ')}</div>
        <div class="satir">✨ <b>${D.YETENEK[st.yetenek].ad}</b>: ${D.YETENEK[st.yetenek].m}</div>
        <div class="satir">◆ <b>${D.PASIF[st.pasif].ad}</b>: ${D.PASIF[st.pasif].m}</div>
        <div class="eylem"><button class="btn kucuk" id="eSat">💰 Sat</button>${b.f ? '' : `<button class="btn kucuk${kaynasMod ? ' kilitli' : ''}" id="eKay">🔥 Kaynaştır <small>3🪙</small></button>`}
        <span class="satir" style="align-self:center">${kaynasMod ? '→ yeteneği bu kahramandan, pasifi dokunacağından gelir' : 'Taşımak için boş yuvaya dokun'}</span></div>`;
      $('eSat').onclick = sat;
      if (!b.f) $('eKay').onclick = () => { kaynasMod = !kaynasMod; ciz(); };
    } else sp.className = 'secimPanel';
    // dükkân
    const dk = $('mDukkan'); dk.innerHTML = '';
    const sahip = new Set([...M.tahta, ...M.yedek].filter(b => b && !b.f && b.s === 1).map(b => b.h));
    M.dukkan.forEach((id, i) => {
      const d = document.createElement('div');
      if (!id) { d.className = 'kart bos'; dk.appendChild(d); return; }
      const h = kh(id);
      d.className = `kart k${h.kademe}${M.altin < h.kademe ? ' pahali' : ''}${sahip.has(id) ? ' ciftle' : ''}`; d.style.setProperty('--renk', h.renk);
      d.innerHTML = `<span class="fiyat">${h.kademe}🪙</span><span class="em">${h.emoji}</span><span class="ad">${h.ad}</span><span class="soyk">${h.soy.map(s => D.SOYLAR[s].emoji).join('')}</span>`;
      d.onclick = () => satinAl(i);
      let uzun; d.oncontextmenu = (e) => { e.preventDefault(); kartBilgi(id); };
      d.addEventListener('touchstart', () => { uzun = setTimeout(() => kartBilgi(id), 450); }, { passive: true });
      d.addEventListener('touchend', () => clearTimeout(uzun));
      dk.appendChild(d);
    });
    $('bKilit').textContent = M.kilit ? '🔒 Kilitli' : '🔓 Kilitle'; $('bKilit').classList.toggle('kilitli', M.kilit);
    $('bYenile').disabled = M.altin < K.yenile;
  }
  function kartBilgi(id) {
    const h = kh(id);
    pencere(`<h3>${h.emoji} ${h.ad}</h3><p>${h.soy.map(s => D.SOYLAR[s].emoji + ' ' + D.SOYLAR[s].ad).join(' · ')} · ${h.kademe}🪙</p>
      <p>✨ <b>${D.YETENEK[h.yetenek].ad}</b>: ${D.YETENEK[h.yetenek].m}</p><p>◆ <b>${D.PASIF[h.pasif].ad}</b>: ${D.PASIF[h.pasif].m}</p><button class="btn" data-kapat>Tamam</button>`);
  }

  // ── Savaş ──
  const tuval = $('tuval'), cx = tuval.getContext('2d');
  let sv = null, hiz = 1, birikim = 0, onceki = 0, yazilar = [], izler = [], bilgi = null;
  $('bHiz').onclick = () => { hiz = hiz === 1 ? 2 : hiz === 2 ? 3 : 1; $('bHiz').textContent = hiz + '×'; };

  function savasBaslat(b) {
    bilgi = b; ekran('savas');
    const kayit = [];
    sv = S.Savas(b.benim, b.rakip.takim, { tohum: b.tohum, alamet: b.alamet, yz: [1], kayit });
    sv.kayit = kayit;
    $('sRakipAd').textContent = (b.rakip.kaynak === 'bot' ? '🤖 ' : '👤 ') + b.rakip.ad;
    const a = D.ALAMETLER.find(x => x.id === b.alamet); $('sAlamet').textContent = a.emoji + ' ' + a.ad;
    $('sKut').className = 'kutBar'; $('sKut').innerHTML = '✨ <b>Kut hazır</b> — bir kahramanına dokun, yeteneğini anında patlat (savaş başına 1)';
    $('sSonuc').className = 'sonucKutu';
    yazilar = []; izler = []; birikim = 0; onceki = performance.now();
    boyutla(); requestAnimationFrame(dongu);
  }
  function boyutla() {
    const r = tuval.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    tuval.width = r.width * dpr; tuval.height = r.height * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { if (sv) boyutla(); });
  // arena (6×8) → ekran
  function olcek() { const r = tuval.getBoundingClientRect(); const c = Math.min(r.width / 6, r.height / 8); return { c, ox: (r.width - c * 6) / 2, oy: (r.height - c * 8) / 2 }; }
  tuval.addEventListener('pointerdown', (e) => {
    if (!sv || sv.bitti || !sv.kutVar(0)) return;
    const r = tuval.getBoundingClientRect(), { c, ox, oy } = olcek();
    const x = (e.clientX - r.left - ox) / c, y = (e.clientY - r.top - oy) / c;
    let en = null, m = 0.9;
    for (const u of sv.birimler) if (u.taraf === 0 && !u.olu) { const d = Math.hypot(u.x - x, u.y - y); if (d < m) { m = d; en = u; } }
    if (en && sv.kut(0, en.i)) { $('sKut').className = 'kutBar bitti'; $('sKut').innerHTML = `✨ Kut kullanıldı: <b>${en.ad}</b> → ${D.YETENEK[en.yetenek].ad}`; }
  });

  function dongu(simdi) {
    if (!sv) return;
    const dt = Math.min(0.1, (simdi - onceki) / 1000); onceki = simdi;
    if (!sv.bitti) {
      birikim += dt * hiz;
      while (birikim >= sv.DT && !sv.bitti) { birikim -= sv.DT; sv.adim(); fxIsle(); }
    }
    for (const y of yazilar) y.yas += dt; yazilar = yazilar.filter(y => y.yas < 0.9);
    for (const z of izler) z.yas += dt; izler = izler.filter(z => z.yas < 0.18);
    arenaCiz();
    if (sv.bitti && !sv.sonucGosterildi) { sv.sonucGosterildi = true; savasBitti(sv.sonuc); }
    if (!sv.bitti || yazilar.length || izler.length) requestAnimationFrame(dongu);
  }
  function fxIsle() {
    const bul = (uid) => sv.birimler.find(o => o.uid === uid);
    for (const f of sv.fx) {
      const u = bul(f.u); if (!u) continue;
      if (f.tip === 'hasar' || f.tip === 'iyi' || f.tip === 'kalkan' || f.tip === 'kac' || f.tip === 'dirilis' || f.tip === 'kut' || f.tip === 'yetenek') {
        const metin = { hasar: '-' + f.n, iyi: '+' + f.n, kalkan: '🛡' + f.n, kac: 'kaçtı', dirilis: '🔥 dirildi', kut: '✨ KUT', yetenek: D.YETENEK[f.ad] ? D.YETENEK[f.ad].ad : '' }[f.tip];
        const renk = { hasar: '#ffd0d0', iyi: '#9ff0b5', kalkan: '#e8f0ff', kac: '#ccc', dirilis: '#ffb070', kut: '#e2b8ff', yetenek: '#ffe08a' }[f.tip];
        if (f.tip === 'hasar' && f.n < 15) continue;
        yazilar.push({ x: u.x + (Math.random() - 0.5) * 0.4, y: u.y - 0.5, metin, renk, yas: 0, buyuk: f.tip === 'kut' || f.tip === 'yetenek' });
      }
      if ((f.tip === 'vurus' && f.menzilli) || f.tip === 'simsek') { const k = bul(f.k); if (k) izler.push({ x1: k.x, y1: k.y, x2: u.x, y2: u.y, yas: 0, renk: f.tip === 'simsek' ? '#ffe45a' : '#fff' }); }
    }
  }
  function arenaCiz() {
    const r = tuval.getBoundingClientRect(), { c, ox, oy } = olcek();
    cx.clearRect(0, 0, r.width, r.height);
    const X = (x) => ox + x * c, Y = (y) => oy + y * c;
    // zemin: orta çizgi
    cx.strokeStyle = 'rgba(255,255,255,.06)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(X(0), Y(4)); cx.lineTo(X(6), Y(4)); cx.stroke();
    for (const z of izler) { cx.strokeStyle = z.renk; cx.globalAlpha = 1 - z.yas / 0.18; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(X(z.x1), Y(z.y1)); cx.lineTo(X(z.x2), Y(z.y2)); cx.stroke(); }
    cx.globalAlpha = 1;
    const rr = c * 0.4;
    for (const u of sv.birimler) {
      if (u.olu) continue;
      const x = X(u.x), y = Y(u.y), h = kh(u.b.h);
      // gövde (yer tutucu)
      cx.fillStyle = h.renk; cx.beginPath(); cx.arc(x, y, rr, 0, 7); cx.fill();
      cx.lineWidth = 3; cx.strokeStyle = u.taraf === 0 ? '#6fd3ff' : '#ff6b6b'; cx.stroke();
      if (u.b.f) { cx.strokeStyle = '#c58bff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, rr + 4, 0, 7); cx.stroke(); }
      if (u.durum.sersem) { cx.fillStyle = 'rgba(255,240,120,.35)'; cx.beginPath(); cx.arc(x, y, rr, 0, 7); cx.fill(); }
      if (u.durum.yavas) { cx.fillStyle = 'rgba(140,200,255,.30)'; cx.beginPath(); cx.arc(x, y, rr, 0, 7); cx.fill(); }
      cx.font = `${Math.round(rr * 1.1)}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(h.emoji, x, y + 1);
      if (u.b.f) { cx.font = `${Math.round(rr * 0.55)}px system-ui`; cx.fillText(kh(u.b.f).emoji, x + rr * 0.75, y + rr * 0.7); }
      // çubuklar
      const w = rr * 2, bx = x - rr, by = y - rr - 12;
      cx.fillStyle = '#000a'; cx.fillRect(bx, by, w, 5);
      cx.fillStyle = u.taraf === 0 ? '#5ad17a' : '#e35b5b'; cx.fillRect(bx, by, w * Math.max(0, u.hp / u.mx), 5);
      if (u.kalkan > 0) { cx.fillStyle = '#e8f0ff'; cx.fillRect(bx, by - 2, Math.min(w, w * u.kalkan / u.mx), 2); }
      cx.fillStyle = '#000a'; cx.fillRect(bx, by + 6, w, 3); cx.fillStyle = '#6aa8ff'; cx.fillRect(bx, by + 6, w * u.mp / u.mana, 3);
      if (u.b.s > 1) { cx.font = 'bold 10px system-ui'; cx.fillStyle = '#f2b53a'; cx.fillText('★'.repeat(u.b.s), x, y + rr + 7); }
    }
    for (const y of yazilar) {
      cx.globalAlpha = 1 - y.yas / 0.9; cx.fillStyle = y.renk; cx.font = `bold ${y.buyuk ? 15 : 12}px system-ui`; cx.textAlign = 'center';
      cx.fillText(y.metin, X(y.x), Y(y.y) - y.yas * 30);
    }
    cx.globalAlpha = 1;
    // süre
    cx.fillStyle = 'rgba(255,255,255,.5)'; cx.font = '12px system-ui'; cx.textAlign = 'left'; cx.fillText(Math.max(0, K.savasSuresi - sv.t).toFixed(0) + ' sn', X(0) + 4, Y(4) - 6);
  }

  function savasBitti(s) {
    const k = s.kazanan;
    const sk = $('sSonuc');
    sk.className = 'sonucKutu acik ' + (k === 0 ? 'kazandi' : k === 1 ? 'kaybetti' : 'berabere');
    sk.textContent = k === 0 ? '🏅 Zafer!' : k === 1 ? '💔 Yenilgi' : '🤝 Berabere';
    setTimeout(() => {
      const b = bilgi; sv = null;
      if (b.duello) { anaGoster(); bildir(k === 0 ? 'Düelloyu kazandın!' : k === 1 ? 'Düelloyu kaybettin' : 'Berabere'); return; }
      // maç ilerlemesi
      O.Hayalet.birak({ tur: M.tur, kupa: P.kupa, takim: b.benim, ad: P.ad, oyuncu: P.oyuncu });
      if (k === 0) { M.zafer++; for (const t of b.benim) { P.usta[t.h] = (P.usta[t.h] || 0) + 1; if (t.f) P.usta[t.f] = (P.usta[t.f] || 0) + 1; } }
      else if (k === 1) M.can--;
      M.gecmis.push(k);
      P.sonTakim = b.benim;
      if (M.zafer >= K.zaferHedef || M.can <= 0) return macBitti();
      M.tur++; kaydet(); turBaslat(false);
    }, 1400);
  }
  function macBitti() {
    const kazandi = M.zafer >= K.zaferHedef;
    const fark = kazandi ? 40 : M.zafer * 8 - 30;
    P.kupa = Math.max(0, P.kupa + fark); P.istat.mac++; if (kazandi) P.istat.birinci++;
    const gec = M.gecmis.map(k => k === 0 ? '🟩' : k === 1 ? '🟥' : '⬜').join('');
    const kod = O.kodla(P.sonTakim, P.ad);
    P.mac = null; M = null; kaydet();
    $('sonKart').innerHTML = `<h2>${kazandi ? '👑 Arena senin!' : '⚰️ Maç bitti'}</h2>
      <p>${gec}</p><p>🏆 ${fark >= 0 ? '+' : ''}${fark} kupa → <b>${P.kupa}</b></p>
      <p>Son takımın düello kodu — arkadaşına at:</p><div class="kodKutu">${kod}</div>
      <button class="btn ana" id="sTekrar">⚔️ Yeniden</button><button class="btn" id="sAna">Ana ekran</button>`;
    $('sTekrar').onclick = yeniMac; $('sAna').onclick = anaGoster;
    ekran('son');
  }

  // ilk açılış
  anaGoster();
  window.KUT_OYUN = { P: () => P, M: () => M }; // test için
})();
