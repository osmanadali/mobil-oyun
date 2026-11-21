// 📡 Kapışma bağlantısı (1.2.1, "online oynanmıyor" 21 Kasım): bozuk kayıtlı oturum ve geçici yetki reddi kendiliğinden onarılır;
// ağ yoksa "rakip yok" yerine "Sunucuya ulaşılamadı" + adım yazar, Yeniden dene çalışır. Tek başına: node tools/hakem.cjs --only=baglanti
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5), sound: false, music: false };
  const FB = fakeFirebase();
  const errs = [];

  // a) kayıtlı oturum geçersiz (token yenileme 400) + ilk Firestore yazması bir kez 401: davet kodu yine alınır, tabloya yeniden kaydolur
  {
    let deny = 1;
    const o = await open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: async ctx => {
      await FB.attach(ctx);
      await ctx.route('https://securetoken.googleapis.com/**', r => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'USER_NOT_FOUND' } }) }));
      await ctx.route('https://firestore.googleapis.com/**', r => { if (deny > 0 && r.request().method() === 'POST' && r.request().url().endsWith(':commit')) { deny--; return r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":{"status":"UNAUTHENTICATED"}}' }); } return r.fallback(); });
    } });
    const p = o.page;
    await p.evaluate(() => window.Lig.join('Hızlı Martı'));
    const uid0 = await p.evaluate(() => window.Lig.me().uid);
    // oturumu "eski hesap"a çevir: kayıtlı yenileme anahtarı artık geçersiz (sahte sunucu 400 döner), elde anahtar yok (uygulama yeniden açıldı)
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray.lig')); s.rt = 'rt-silinmis'; localStorage.setItem('ray.lig', JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(800);
    const r = await p.evaluate(async () => { const o = {}; try { const h = await window.Lig.duel.host({ levels: [20] }); o.code = h.code; window.Lig.duel.leave(); } catch (e) { o.err = String(e); }
      try { o.add = !!(await window.Lig.add(5)); o.board = (await window.Lig.board()).rows.map(x => x.nick + '=' + x.pts); } catch (e) { o.addErr = String(e); }
      o.uid = window.Lig.me().uid; return o; });
    const mem = FB.list('weeks/').filter(k => k.endsWith('/members/' + r.uid));
    check('baglanti.onar', 'Kayıtlı oturum geçersiz ve ilk yazma 401: oturum kendiliğinden yenilenir, davet kodu alınır, yeni kimlik bu haftanın tablosuna kaydolup puan yazılır; eski kimliğin satırı tabloda görünmez',
      /^[A-Z2-9]{5}$/.test(r.code || '') && r.add && r.uid !== uid0 && mem.length === 1 && FB.get(mem[0]).pts === 5 && r.board?.length === 1, JSON.stringify({ r, uid0, mem }), 'high');
    errs.push(...o.errors); await o.ctx.close();
  }

  // b) ağ tamamen yok: Kapış › rakip ara ve davet et → "Sunucuya ulaşılamadı" (rakip yok değil) + adım; ağ gelince Yeniden dene eşleşmeye gider
  {
    let down = true;
    const o = await open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: async ctx => {
      await FB.attach(ctx);
      for (const h of ['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com']) await ctx.route(`https://${h}/**`, r => down ? r.abort('internetdisconnected') : r.fallback());
    } });
    const p = o.page;
    down = false; await p.evaluate(() => window.Lig.join('Mavi Tren')); await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray.lig')); localStorage.setItem('ray.lig', JSON.stringify(s)); }); await p.reload(); await p.waitForTimeout(800); down = true;
    await p.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); });
    await p.waitForFunction(() => document.querySelector('#mCard .bell')?.textContent === '📡' || /rakip yok/i.test(document.querySelector('#mCard h2')?.textContent || ''), null, { timeout: 30000 }).catch(() => {});
    const f = await p.evaluate(() => ({ h: document.querySelector('#mCard h2')?.textContent || '', tip: document.querySelector('#mCard .tip')?.textContent || '' }));
    await shot(p, 'baglanti-yok');
    await p.evaluate(() => document.getElementById('mClose')?.click()); await p.waitForTimeout(400);
    await p.evaluate(() => window.__ray.lig.host());
    await p.waitForFunction(() => document.querySelector('#mCard .bell')?.textContent === '📡', null, { timeout: 20000 }).catch(() => {});
    const h = await p.evaluate(() => document.querySelector('#mCard h2')?.textContent || '');
    down = false;
    await p.evaluate(() => document.getElementById('vR')?.click());
    await p.waitForFunction(() => document.getElementById('vCode'), null, { timeout: 20000 }).catch(() => {});
    const code = await p.evaluate(() => document.getElementById('vCode')?.textContent || '');
    check('baglanti.yok', 'Ağ yokken Kapış: “Sunucuya ulaşılamadı” ve hangi adım (rakip yok diye gizlenmez); davet et de aynı pencere; ağ gelince Yeniden dene davet kodunu verir',
      /Sunucuya ulaşılamadı/.test(f.h) && /·/.test(f.tip) && /Sunucuya ulaşılamadı/.test(h) && /^[A-Z2-9]{5}$/.test(code), JSON.stringify({ f, h, code }), 'high');
    await p.evaluate(() => window.Lig.duel.leave());
    errs.push(...o.errors); await o.ctx.close();
  }
  // c) "verilerimi sil" gerektiren bozuk oturum: cihazda kayıt var (katılmış, bu hafta, grup) ama sunucu bu kimliği tanımıyor ve tablo
  //    kaydı yok (ör. eski test sürümünden kalan); sunucu her yazmayı reddediyor (400 INVALID_ARGUMENT, eski kimlik) → uygulama kendisi
  //    onarır: takma ad ve arkadaşlar korunur, yeni kimlik tabloya kaydolur, puan yazılır, davet kodu ve rakip arama çalışır
  {
    const o = await open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: async ctx => {
      await FB.attach(ctx);
      await ctx.route('https://firestore.googleapis.com/**', r => /tok-ESKI/.test(r.request().headers().authorization || '') ? r.fulfill({ status: 400, contentType: 'application/json', body: '{"error":{"status":"INVALID_ARGUMENT"}}' }) : r.fallback());
      await ctx.route('https://securetoken.googleapis.com/**', r => /rt-ESKI/.test(r.request().postData() || '') ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id_token: 'tok-ESKI', refresh_token: 'rt-ESKI', user_id: 'ESKI', expires_in: '3600' }) }) : r.fallback());
    } });
    const p = o.page;
    await p.evaluate(() => { const wk = window.Lig.weekId(); localStorage.setItem('ray.lig', JSON.stringify({ joined: true, uid: 'ESKI', rt: 'rt-ESKI', nick: 'Yaşlı Kartal', tier: 1, wk, grp: 't1g0', pts: 30, fr: { Uarkadas: { n: 'Anne 61', at: 1 } } })); });
    await p.reload(); await p.waitForTimeout(800);
    const r = await p.evaluate(async () => { const o = {};
      try { const h = await window.Lig.duel.host({ levels: [20] }); o.code = h.code; window.Lig.duel.leave(); } catch (e) { o.hostErr = String(e); }
      try { o.add = !!(await window.Lig.add(10)); } catch (e) { o.addErr = String(e); }
      try { o.find = (await window.Lig.duel.find({ levels: [20], wait: 500 })) ? 'eşleşti' : 'kimse yok'; } catch (e) { o.findErr = String(e); }
      const s = JSON.parse(localStorage.getItem('ray.lig')); o.uid = s.uid; o.nick = s.nick; o.tier = s.tier; o.fr = Object.keys(s.fr || {}); o.err = window.Lig.err; return o; });
    const mem = FB.list('weeks/').filter(k => k.endsWith('/members/' + r.uid)).map(k => FB.get(k));
    check('baglanti.bozuk-oturum', 'Bozuk lig oturumu (sunucu eski kimliği reddediyor): “verilerimi sil” gerekmeden kendiliğinden onarılır; takma ad, kademe ve arkadaşlar korunur, davet kodu ve puan yazma çalışır',
      /^[A-Z2-9]{5}$/.test(r.code || '') && r.add && !r.findErr && r.uid !== 'ESKI' && r.nick === 'Yaşlı Kartal' && r.tier === 1 && r.fr.includes('Uarkadas') && mem.length === 1 && mem[0].pts === 10 && mem[0].nick === 'Yaşlı Kartal',
      JSON.stringify({ r, mem }), 'high');
    errs.push(...o.errors); await o.ctx.close();
  }
  const bad = errs.filter(e => !/net::|Failed to load resource/.test(e));
  check('baglanti.konsol', 'Bağlantı testlerinde konsolda hata yok', !bad.length, JSON.stringify(bad.slice(0, 5)));
};
