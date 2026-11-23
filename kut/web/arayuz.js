/* Kut Arena — oynanır tablet sürümü: son tasarımı (../tasarim/final) oyun mantığına (oyun.js) ve 3D sahneye (sahne3d.js) bağlar. */
import { Oyun } from './oyun.js';
import * as S3 from './sahne3d.js';
import * as Ses from './ses.js';
import { acilisYukle, acilisKapat, vitrinKur, yukIcerik, yukGosterge } from './karsilama.js';

const D = window.KUT_DATA, SIM = window.KUT_SIM, L = window.KUT_LOBI, K = D.KURAL;
const oyun = new Oyun();
const $ = (id) => document.getElementById(id);
const q = (sel, kok = document) => kok.querySelector(sel);
// Türkçe harfler (ğ ş İ …) Cinzel ve Alegreya Sans latin-ext dosyalarında: açılışta yükle ki ilk görünüşte yedek yazı tipi titremesi olmasın
if (document.fonts && document.fonts.load) for (const f of ["400 16px \"Alegreya Sans\"", "700 16px \"Alegreya Sans\"", "800 16px \"Alegreya Sans\"", "900 16px \"Alegreya Sans\"", "700 16px Cinzel", "900 16px Cinzel", "900 16px \"Cinzel Decorative\""]) document.fonts.load(f, "ğşİıÇÖÜ").catch(() => {});
// canavarların portresi yok: 3D'deki gibi yerine gorunum kahramanının portresi (SAHNE_GEREKSINIM.md, Adım 4)
const P = (id) => `../arayuz/portre/${(D.canavar(id) || {}).gorunum || id}.png`, SY = (id) => `../arayuz/soy_${id}.png`;
const IK_RESIM = { coin: 'ik_altin', kalp: 'ik_kalp', kupa: 'ik_kupa', tac: 'ik_tac', yildiz: 'ik_yildiz_altin' };
const ik = (n, c = '') => IK_RESIM[n] ? `<img class="ik ${c}" alt="" src="../arayuz/ui/${IK_RESIM[n]}${n === 'kalp' && /\bbos\b/.test(c) ? '_bos' : ''}.png">` : `<svg class="ik ${c}"><use href="#i-${n}"/></svg>`;
// robot düğme ikonları (arayuz/menu/ikon_*.webp; kaynak kut/gelen_gorsel)
// HUD ikonları (arayuz/menu/ikon_can|seri|tur|altin.webp): hazırlık üst şeridinde eski kalp/altın simgelerinin yerine
const hik = (n, c = '') => `<img class="ik hik ${c}" alt="" draggable="false" src="arayuz/menu/ikon_${n}.webp">`;
const mik = (n, c = '') => `<img class="mik ${c}" alt="" draggable="false" src="arayuz/menu/ikon_${n}.webp">`;
// yeni lobi alametlerinin (bölüm 8) resmi henüz yok: yerine emojisi
const AL_RESIM = new Set(['yok', 'kanAyi', 'sis', 'tipi', 'kutYagmur', 'pazar', 'tutulma', 'yaz']);
const alametArka = (id) => AL_RESIM.has(id) ? `background:url(../arayuz/ui/al_${id}.png) center/cover` : 'background:rgba(10,6,24,.6);display:grid;place-items:center;font-size:22px';
const alametIc = (id) => AL_RESIM.has(id) ? '' : ((D.ALAMETLER.find(a => a.id === id) || {}).emoji || '');
const alametAd = (id) => (D.ALAMETLER.find(a => a.id === id) || { ad: id }).ad;
const yildiz = (s) => `<div class="yildizlar y${s}">${ik('yildiz').repeat(s)}</div>`;
const soyIk = (s) => `<img class="soyIk" src="${SY(s)}" alt="${D.SOYLAR[s].ad}">`;
const mad = (id) => `<div class="madalyon"><img src="${P(id)}" alt=""></div>`;
const kh = (id) => D.kahraman(id);
const SUTUN = K.tahtaSutun, SIRA_AD = ['Ön', 'Orta', 'Arka'];
const sayi = (n) => n.toLocaleString('tr-TR');
// ── eşyalar (basit hâl; büyük arayüz tasarımı ayrı yapılacak) ──
const ES = (id) => { const x = D.esya(id); return `../arayuz/ui/esya/${x ? x.simge : 'o_sokum'}.png`; };
const esyaIk = (id, c = '') => `<img class="esyaIk ${c}" src="${ES(id)}" alt="${(D.esya(id) || { ad: id }).ad}" title="${(D.esya(id) || { ad: id }).ad}">`;
const STAT_METIN = { atk: (v) => `+%${Math.round(v * 100)} saldırı`, as: (v) => `+%${Math.round(v * 100)} hız`, yg: (v) => `+%${Math.round(v * 100)} YG`, mana0: (v) => `+${v} mana`,
  azalt: (v) => `−%${Math.round(v * 100)} hasar`, can: (v) => `+${v} can`, cal: (v) => `%${Math.round(v * 100)} çalma`, kalkan0: (v) => `${v} kalkan` };
const esyaMetin = (id) => { const x = D.esya(id); if (!x) return id; if (x.tip !== 'tam') return x.m;
  const st = {}; for (const t of x.tarif) for (const [k, v] of Object.entries(D.esya(t).stat)) st[k] = (st[k] || 0) + v;
  return Object.entries(st).map(([k, v]) => STAT_METIN[k](v)).join(', ') + '. ' + x.m; };
{ const st = document.createElement('style'); st.textContent = `
  .yuva .esyalar{position:absolute;left:3px;bottom:25px;display:flex;gap:2px;z-index:3;pointer-events:none}
  .yedek .yuva .esyalar{bottom:20px}
  .yuva .esyalar .esyaIk{width:22px;height:22px;border-radius:6px;background:rgba(10,6,24,.72);box-shadow:0 0 0 1px rgba(255,228,138,.55)}
  .yedek .yuva .esyalar .esyaIk{width:16px;height:16px}
  .esyaRaf{display:flex;align-items:center;gap:5px;padding:4px 10px 0 44px;min-height:50px}
  .esyaRaf .rafAd{font-size:13px;font-weight:900;color:var(--altinA);white-space:nowrap;margin-right:4px}
  .esyaRaf .re{flex:none;width:46px;height:46px;border-radius:9px;border:2px solid rgba(242,191,74,.45);background:rgba(10,6,24,.6);padding:2px;cursor:pointer;display:grid;place-items:center}
  .esyaRaf .re img{width:100%;height:100%;object-fit:contain}
  .esyaRaf .re.secik{border-color:#ffe48a;box-shadow:0 0 10px #ffd45c}
  .esyaRaf .re.bos{opacity:.25;cursor:default;flex:0 1 34px;width:34px;height:34px}
  .esyaRaf .tasan{font-size:12px;color:#ff9ab0;white-space:nowrap;margin-left:4px}
  .esyaRaf em{font-style:normal;font-size:12px;color:#fff3b0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:6px;min-width:0}
  .secEsya{display:flex;flex-direction:column;gap:3px;padding:2px 10px;font-size:12px;line-height:1.25;color:var(--yazi2)}
  .secEsya div{display:flex;gap:6px;align-items:flex-start}.secEsya .esyaIk{width:20px;height:20px;flex:none}.secEsya b{color:#fff}
  .secimler{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0}
  .secimler .sc{display:flex;flex-direction:column;align-items:center;gap:4px;width:132px;padding:8px;border-radius:12px;border:2px solid rgba(242,191,74,.55);background:rgba(10,6,24,.6);color:#fff;cursor:pointer;font:inherit;font-size:13px;line-height:1.25;text-align:center}
  .secimler .sc:hover{border-color:#ffe48a;box-shadow:0 0 10px #ffd45c}
  .secimler .sc img.pp{width:64px;height:64px;object-fit:contain}.secimler .sc .esyaIk{width:34px;height:34px}
  .secimler .sc small{color:var(--yazi2);font-size:12px}
  .armaganSerit{display:flex;align-items:center;gap:6px;padding:2px 10px 0 44px;min-height:26px;font-size:13px;flex-wrap:wrap}
  .armaganSerit b{color:var(--altinA);font-weight:900}
  .armaganSerit .ar{padding:2px 8px;border-radius:9px;border:1px solid rgba(242,191,74,.55);background:rgba(10,6,24,.6);color:#fff;cursor:help;white-space:nowrap}
  .armaganSerit .ar.gunes{border-color:#ffd45c}.armaganSerit .ar.alev{border-color:#ff8a4c}.armaganSerit .ar.kivilcim{border-color:#bfe0ff}
  .armaganSerit button{font:inherit;font-size:13px;font-weight:900;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid #c9b8e6;background:rgba(60,30,100,.6);color:#fff;cursor:pointer}
  .secimler .sc .kd{font-size:12px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;color:#ffe48a}
  .secimler .sc em{font-style:normal;font-size:12px;color:#c9f0ff}
  html.alcak .armaganSerit button{min-height:30px;padding:0 10px;font-size:12px}
  .alamet .sirada{display:block;font-size:12px;color:var(--yazi2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .gunBatimi{color:#ff9a5a;font-size:12px;font-weight:900;display:block;white-space:nowrap;line-height:1.1;letter-spacing:-.2px}`; document.head.appendChild(st); }
const ALAMET_RENK = { yok: '#ffe08a', kanAyi: '#ff3d5a', sis: '#c9b8e6', tipi: '#bfe6ff', kutYagmur: '#ffd45c', pazar: '#ffcc4a', tutulma: '#7a4cc0', yaz: '#ff9a2e' };
const IPUCU = {
  karanlik: 'Karanlık yaralıları bitirir: ön sırayı sağlam tut.', avci: 'Avcılar uzaktan çok vurur: Çevik ya da Bulut Atı ile arkalarına dal.',
  dev: 'Devler zor yıkılır: Karanlık ve Avcı hasarı işe yarar.', ates: 'Od yakar: Su soyu iyileşmesiyle dayan.', su: 'Su iyileşir: tek hedefe yüklen, çabuk bitir.',
  kis: 'Ayaz seni yavaşlatır: Gök hızıyla karşıla.', gok: 'Gök hızlı vurur: Dev soyu ile hasarı emer.', bilge: 'Bilgeler yeteneği erken açar: Kut\'u erken kullanmayı düşün.',
  atli: 'Çevikler ilk saniyelerde patlar: önü sağlam kur.', yer: 'Yer soyu canlıdır: uzun savaşa hazırlan, Od yakması işe yarar.',
};

// ── genel ──
// tek ölçek (index.html <head>): arayüz #kok içinde transform:scale(--o) ile çizilir. getBoundingClientRect ekran px verir;
// kökün içine konumlanan öğeler (öğretici çerçevesi, balon) için mantıksal px'e çevrilir. 3D tuval ölçeklenmez (ekran px).
const olcek = () => (window.kutOlcek ? window.kutOlcek() : 1) || 1;
function kokKutu(e) { const r = e.getBoundingClientRect(), o = olcek(); return { left: r.left / o, top: r.top / o, right: r.right / o, bottom: r.bottom / o, width: r.width / o, height: r.height / o }; }
// telefonda bir kez: oyun tablet için tasarlandı notu (kapatılınca kut.tabletNot)
if (window.KUT_TELEFON) { let gordu = null; try { gordu = localStorage.getItem('kut.tabletNot'); } catch (e) {}
  if (!gordu) { $('tabletNot').hidden = false; $('tabletNotKapat').onclick = () => { $('tabletNot').hidden = true; try { localStorage.setItem('kut.tabletNot', '1'); } catch (e) {} }; } }
let aktifEkran = 'ana';
function goster(id) {
  const once = aktifEkran; aktifEkran = id; document.querySelectorAll('.ekran').forEach(e => e.classList.toggle('aktif', e.id === id)); document.body.classList.toggle('savasta', id === 'savas');
  // karşılama: arkada 3D vitrin; ana ekrana her girişte logo ve düğmeler yeniden belirir
  if (vitrin) { if (id === 'ana') vitrin.ac(); else vitrin.kapat(); }
  document.body.classList.toggle('hz3', uc3 && id === 'mac');
  if (uc3) { if (id === 'mac') hz3Ac(); else if (once === 'mac' && id !== 'savas') hz3Kapat(); }
  if (id === 'ana' && (once !== 'ana' || !anaGirdi)) anaGiris();
  if (ogr.adim >= 0) setTimeout(ogrTik, 0);
}
let vitrin = null, anaGirdi = false, uc3 = false;   // uc3: hazırlık 3D arenada (3D sahne kurulduysa; yoksa 2D ızgara yedeği)
function anaGiris() { if (!acilisBitti) return; anaGirdi = true; const a = $('ana'); a.classList.remove('giris'); void a.offsetWidth; a.classList.add('giris'); }
let bildirimZ;
function bildir(m, tur = 'bilgi') { const b = $('bildirim'); b.textContent = m; b.className = 'bildirim acik ' + tur; clearTimeout(bildirimZ); bildirimZ = setTimeout(() => b.classList.remove('acik'), 1800); }
oyun.on('bildirim', ({ m, tur }) => bildir(m, tur));
// ── SES ── (ElevenLabs ile üretilmiş efektler; ilk dokunuştan sonra açılır)
Ses.kur(''); Ses.muzikCal('hazirlik');
S3.dinle('ses', (f, k, h) => { if (aktifEkran === 'savas') Ses.olay(f, k, h); });   // menüdeki vitrin (iniş tozu vb.) ses çıkarmaz
oyun.on('satinAlindi', () => Ses.cal('satin_al'));
oyun.on('birlesti', () => Ses.cal('birlesme', { aralik: 0.3 }));
oyun.on('kaynasti', () => Ses.cal('kaynasma'));
oyun.on('ses', (ad) => { if (ad === 'yenile') Ses.cal('yenile'); else if (ad === 'sat') Ses.cal('satin_al', { hiz: 0.8 }); });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button, .btn'); if (b && !b.disabled) Ses.cal('dugme', { aralik: 0.05 }); }, true);
function pencere(html, b = false, tur = '') { yetVideoDurdur(); $('pencere').innerHTML = html; $('perde').classList.toggle('armagan', tur === 'armagan'); $('perde').dataset.tur = tur; $('perde').classList.toggle('menuPanel', aktifEkran === 'ana'); $('perde').classList.toggle('panelB', !!b); $('perde').classList.add('acik'); $('pencere').scrollTop = 0; }   // görünür olduktan sonra: gizliyken scrollTop yazılamaz, önceki pencerenin kaydırması kalırdı   // karşılamada süslü menü paneli
function kapat() { yetVideoDurdur(); $('perde').classList.remove('acik'); }
$('perde').addEventListener('click', (e) => { if (e.target.id === 'perde' || e.target.closest('[data-kapat]')) kapat(); });
// iOS: pencere dışındaki karartma sürüklenince sayfa esnemesin; pencere kendi içinde yalnız dikey kayar, uçlarda zincirleme yok (CSS overscroll-behavior)
$('perde').addEventListener('touchmove', (e) => { if (!e.target.closest || e.target.closest('input,textarea')) return; const p = e.target.closest('.pencere'); if (!p || p.scrollHeight <= p.clientHeight + 1) e.preventDefault(); }, { passive: false });

async function paylas(metin) {
  try { if (navigator.share) { await navigator.share({ text: metin }); return; } } catch (e) {}
  try { await navigator.clipboard.writeText(metin); bildir('Kopyalandı', 'iyi'); } catch (e) { bildir('Kopyalanamadı: kodu seçip kopyala', 'hata'); }
}

// ── ANA EKRAN ──
function anaCiz() {
  const a = $('ana'), P_ = oyun.P, M = P_.mac;
  q('.pAd', a).textContent = P_.ad;
  q('.pAlt', a).textContent = `${P_.istat.mac} maç · ${P_.istat.birinci} birincilik`;
  q('.pKupa em', a).textContent = sayi(P_.kupa);
  q('.pUsta em', a).textContent = `Sv. ${oyun.ustaToplam()}`;
  const b = q('.oyna', a), par = '<i class="parilti"></i>';
  // Devam Et: tek kısa satır (mod · tur); ayrıntı yok. Kayıtlı maç yoksa OYNA → mod seçim penceresi
  const modAd = (m) => ({ hizli: 'Hızlı Maç', lobi: 'Lobi Maçı' })[m] || 'Arena';
  b.classList.toggle('devam', !!M);
  b.innerHTML = par + (M
    ? `<span class="ana">${ik('oyna')}DEVAM ET</span><small>${modAd(M.mod)} · Tur ${M.mod === 'hizli' ? M.tur : L.turAd(M.tur - 1)}</small>`
    : `<span class="ana">${ik('oyna')}OYNA</span>`);
  q('.yeniMac', a).hidden = !M;
}
// maç modları (OYNA → mod seçim penceresi; kayıtlı maç varken "Yeni maç" ikincil düğmesi aynı pencereyi açar)
const MODLAR = [
  { id: 'arena', ad: 'Arena', alt: '100 can · seviye ve faiz', m: 'Takımını 8 kahramana büyüt; bölüm bölüm canavarlar, Kervan ve rakipler.', ik: 'kilic' },
  { id: 'lobi', ad: 'Lobi Maçı', alt: '8 kişi · son kalan kazanır', m: 'Sen ve 7 hayalet oyuncu. Her tur biriyle eşleşirsin; canı biten elenir.', ik: 'tac' },
  { id: 'hizli', ad: 'Hızlı Maç', alt: '~7 dk · seviye yok', m: 'Her tur 10 altın, 5 can, 7 zafer. Kısa ve hızlı.', ik: 'oyna' },
];
function modPencere() {
  const M = oyun.P.mac;
  pencere(`<h3 class="modBas">Mod seç</h3>${M ? '<p class="modUyari">Yeni maç başlarsa kayıtlı maçın biter.</p>' : ''}
    <div class="modSec">${MODLAR.map((o, i) => `<button class="modK m-${o.id}" data-mod="${o.id}" style="--sira:${i}"><span class="modIk">${ik(o.ik)}</span><b>${o.ad}</b><em>${o.alt}</em><small>${o.m}</small><span class="modGir">Başla</span></button>`).join('')}</div>
    <div class="eylemler"><button class="btn mor" data-kapat>Vazgeç</button></div>`, false, 'mod');
  document.querySelectorAll('#pencere .modK').forEach(k => k.onclick = () => { kapat(); macaGir(() => oyun.yeniMac(k.dataset.mod)); });
}
// Maça giriş: kısa yükleme ekranı (yukleme_arka, logo, ilerleme). 3D hazırlık sahnesi ve takım modelleri gerçekten yüklenene dek kalır;
// model ilerlemesi gerçek (S3.yukleme.olay), arada yumuşak sahte ilerleme. 3D yoksa kısa bir an görünür.
let macYukSurer = false;
async function macaGir(baslat) {
  if (macYukSurer) return; macYukSurer = true;
  const y = $('macYuk'); y.innerHTML = yukIcerik('Arena hazırlanıyor…'); const g = yukGosterge(y); g.basla();
  y.classList.remove('bitti'); y.classList.add('acik');
  let sahte = 0.03, gercek = 0; g.yuzde(sahte);
  const z = setInterval(() => { sahte += (0.88 - sahte) * 0.05; g.yuzde(Math.max(sahte, gercek)); }, 100);
  const eskiOlay = S3.yukleme.olay;
  S3.yukleme.olay = (n, top) => { gercek = Math.max(gercek, 0.2 + 0.7 * n / Math.max(1, top)); g.yuzde(gercek, `Kahramanlar yükleniyor… ${n}/${top}`); };
  try {
    await new Promise(ok => requestAnimationFrame(() => setTimeout(ok, 30)));   // yükleme ekranı önce boyansın
    await baslat();
    goster('mac'); macCiz();
    if (uc3) {
      for (let i = 0; i < 2 && (hz3.kur || !hz3.acik); i++) { if (hz3.kur) await hz3.kur; if (!hz3.acik && aktifEkran === 'mac') hz3Ac(); }
      if (hz3.kur) await hz3.kur;
      await hz3Esitle();   // hazırlıktaki bütün modeller (yeni olanlar burada iner)
      for (let i = 0; i < 3; i++) await new Promise(ok => requestAnimationFrame(ok));   // ilk karelerin gölgelendiricileri derlensin
    } else await new Promise(ok => setTimeout(ok, 250));
  } catch (e) { console.error(e); }
  finally {
    clearInterval(z); S3.yukleme.olay = eskiOlay; g.yuzde(1, 'Hazır!'); g.dur();
    setTimeout(() => { y.classList.add('bitti'); setTimeout(() => { y.classList.remove('acik', 'bitti'); y.innerHTML = ''; }, 420); }, 180);
    macYukSurer = false;
  }
}
q('#ana .oyna').onclick = () => { if (oyun.P.mac) macaGir(() => oyun.turBaslat(true)); else if (ogr.adim >= 0) macaGir(() => oyun.yeniMac()); else modPencere(); };   // öğreticide doğrudan Arena
q('#ana .yeniMac').onclick = modPencere;
q('#ana .duelloBtn').onclick = duelloPencere; q('#ana .kahBtn').onclick = () => { kodeksCiz(); goster('kodeks'); }; q('#ana .nasilBtn').onclick = nasilPencere;
q('#ana .anaAyar').onclick = ayarPencere;
// oyuncu adı: profile dokun → ad penceresi (2–16 karakter). oyun.P.ad (lobi, hayalet, düello kodu) buradan; ayrıca kut.oyuncuAd'da saklanır
const AD_ANAHTAR = 'kut.oyuncuAd';
{ let ad = null; try { ad = localStorage.getItem(AD_ANAHTAR); } catch (e) {}
  if (ad && ad.trim().length >= 2 && oyun.P.ad !== ad) { oyun.P.ad = ad; oyun.kaydet(); } }
function adPencere() {
  pencere(`<h3 class="adBas">Oyuncu adı</h3><p class="adNot">Lobide ve düello kodunda bu ad görünür.</p>
    <form class="adForm" id="adForm" autocomplete="off"><input id="adGir" type="text" maxlength="16" minlength="2" spellcheck="false" autocapitalize="words" enterkeyhint="done" value="${oyun.P.ad.replace(/"/g, '&quot;')}" aria-label="Oyuncu adı">
    <span class="adSay" id="adSay"></span></form><p class="adHata" id="adHata"></p>
    <div class="eylemler"><button class="btn mor" data-kapat>İptal</button><button class="btn altin" id="adKaydet">Kaydet</button></div>`, false, 'ad');
  const gir = $('adGir'), say = () => { const n = [...gir.value.trim()].length; $('adSay').textContent = `${n}/16`; $('adKaydet').disabled = n < 2 || n > 16; $('adHata').textContent = n && n < 2 ? 'En az 2 karakter' : ''; };
  const kaydet = () => { const ad = gir.value.replace(/\s+/g, ' ').trim(); const n = [...ad].length; if (n < 2 || n > 16) { say(); return; }
    oyun.P.ad = ad; oyun.kaydet(); try { localStorage.setItem(AD_ANAHTAR, ad); } catch (e) {} kapat(); anaCiz(); bildir('Adın kaydedildi', 'iyi'); };
  gir.addEventListener('input', say); say();
  $('adForm').onsubmit = (e) => { e.preventDefault(); kaydet(); }; $('adKaydet').onclick = kaydet;
  setTimeout(() => { try { gir.focus({ preventScroll: true }); gir.select(); } catch (e) {} }, 60);
}
q('#ana .profil').onclick = adPencere;
// karşılama arka planında hafif parallax (fare / sürükleme; kare başına tek stil yazımı)
{ const ark = q('#ana .anaArka'); let px = 0, py = 0, bekle = false;
  q('#ana').addEventListener('pointermove', (e) => { px = e.clientX / innerWidth * 2 - 1; py = e.clientY / innerHeight * 2 - 1;
    if (!bekle) { bekle = true; requestAnimationFrame(() => { bekle = false; ark.style.setProperty('--px', px.toFixed(3)); ark.style.setProperty('--py', py.toFixed(3)); }); } }, { passive: true }); }
// öğreticiyi baştan başlat (kut.ogretici sıfırlanır); Ayarlar'daki düğmeyle aynı
function ogretici() { kapat(); if (ogr.adim >= 0) ogrKapat(false); anaCiz(); goster('ana'); ogrBaslat(true); }

function nasilPencere() {
  pencere(`<h3>Nasıl oynanır</h3>
    <div class="eylemler" style="justify-content:flex-start;margin:4px 0 8px"><button class="btn altin" id="nOgr">${ik('oyna')}Öğreticiyi baştan oyna</button><span style="font-size:13px;color:var(--soluk);align-self:center">Temelleri ilk maçında adım adım gösterir.</span></div><ul>
    <li><b>Altın birikir.</b> Her tur başında gelir gelir: 5 altın (ilk turlarda 3–4), elindeki her 8 altına +1 faiz (en çok +5, 40 altında doyar), üst üste kazanma ya da kaybetme serisine +1/+2/+3, son savaşı kazandıysan +1. Kahraman fiyatı kademesi kadar, yenileme 2 altın.</li>
    <li><b>Seviye:</b> takımına seviyen kadar kahraman koyabilirsin (Sv 2 ile başlarsın, en çok 8). Her savaştan sonra 2 deneyim gelir; <b>4 altınla 4 deneyim</b> da alabilirsin. Seviye yükseldikçe dükkâna pahalı kahramanlar daha sık gelir.</li>
    <li><b>Havuz:</b> her kahramandan sınırlı sayıda var (K1 22, K2 18, K3 14). Senin ve rakibinin elindekiler havuzdan düşer.</li>
    <li><b>Tahta:</b> 4 sütun, 3 sıra (ön, orta, arka). Yedekte 7 yer var.</li>
    <li><b>Lobi Maçı:</b> sen ve 7 hayalet (başka oyuncuların kayıtlı maçları ya da botlar), herkes 100 canla. Her tur biriyle eşleşirsin; aynı rakiple üst üste karşılaşmazsın. Kaybeden can kaybeder, canı biten elenir, son kalan birinci olur. Tek sayıda kalınca biri <b>Yansıma</b> ile (başka bir oyuncunun kopyası) dövüşür. 3 kişi kalınca hasar +3, 2 kişi kalınca +5. Sıraya göre kupa: 1. +40 … 8. −40.</li>
    <li><b>Hızlı Maç:</b> eski kurallar: her tur 10 altın (birikmez), yenileme 1, seviye yok; takım sınırı tura göre büyür (en çok 6), yedek 4; 5 can, 7 zafer.</li>
    <li><b>3 aynı kahraman</b> kendiliğinden birleşir: ★2, sonra ★3.</li>
    <li><b>Bölüm ve tur:</b> maç bölümlere ayrılır ("3-2" = Bölüm 3, Tur 2). Bölüm 1'in üç turu ve her bölümün 7. turu <b>canavar turudur</b>; kaybetsen de ganimet (bileşen, altın, kahraman) alırsın. Her bölümün 4. turu <b>Kervan</b>dır: savaş yok, kahraman + eşya çiftlerinden birini seçersin (canı az olan daha çok seçenek görür). Maçın başında 3 kahramandan biri bedava.</li>
    <li><b>Gün Batımı:</b> savaşın 30. saniyesinden sonra her saniye bütün hasar %10 artar (35. sn ×1,5, 40. sn ×2).</li>
    <li><b>Eşyalar:</b> canavar turlarında ve Kervan'da rafına bileşen düşer. Rafta bir eşyaya, sonra kahramana dokun: takılır. Kahramanda yarım bir bileşen varsa ikisi kendiliğinden tam eşyaya dönüşür; rafta iki bileşene arka arkaya dokunarak da birleştirebilirsin. Kahraman başına en çok 3 eşya; takılan eşya çıkmaz (Söküm Taşı hariç). Kahramanı satınca eşyaları rafa döner; birleşme ve kaynaştırmada eşyalar yeni birime geçer.</li>
    <li><b>Kaynaştır (2 + en yüksek kademe altın; Hızlı Maç'ta 3):</b> bir kahramanı seç, Kaynaştır'a bas, ikinci kahramana dokun. Yetenek birinciden, pasif ikinciden gelir; soyların hepsi sayılır.</li>
    <li><b>Rakibini önceden gör:</b> sol üstte sıradaki rakibin kadrosu ve soyları var. Ona göre kur.</li>
    <li><b>Alamet:</b> her turun kendi kuralı vardır (Kan Ayı, Sis, Tipi…).</li>
    <li><b>Kut:</b> savaş kendi kendine oynar, ama bir kez kendi kahramanına dokunup manasını doldurabilir, yeteneğini hemen açtırabilirsin (yetenek hazırlanıyorsa hazırlık anında biter). Lobide son iki kişi kalınca 2 Kut hakkın olur (arada en az 6 sn).</li>
    <li><b>Kut Yankısı:</b> eşyalı kahramana verilen Kut, taşıdığı her bileşen için ek etki yapar (tam eşya iki bileşen sayılır, Kut Taşı ikiye katlar): Diş sonraki 3 vuruşa +%50 hasar, Tüy 3 sn +%50 hız, Kor yeteneği ×1,25, Çiy yetenekten sonra 30 mana, Kabuk 3 sn −%40 hasar, Yürek canının %15'i, Pul 3 sn %40 can çalma, Buz 150 kalkan.</li>
    <li><b>Kut Armağanı:</b> 2-1, 3-2 ve 4-3'te üç karttan birini seçersin (Kıvılcım, Alev ya da Güneş). Armağan maç boyunca seninle kalır; her aşamada kartları bir kez yenileyebilirsin.</li>
    <li><b>Sıradaki alamet</b> önceden görünür. Yeni alametler: Demirci Ateşi (kazanana bileşen), Göç Mevsimi (2 bedava yenileme), Kut Sessizliği (Kut yok, herkes %25 mana ile başlar), Uzun Gölge (Gün Batımı 20. sn'de).</li>
    <li><b>100 can.</b> Kaybedince bölüm tabanı (bölüm 2'de 4, 3'te 9, 4'te 13, 5'te 17…) ve rakibin ayakta kalan kahramanlarının yıldızları kadar can gider; canavar turunda taban ve ayakta kalan canavar sayısı kadar. İlk üç turda can gitmez. Canın bitmeden 5-3'ü tamamlarsan arena senin.</li></ul>
    <div class="eylemler"><button class="btn altin" data-kapat>Anladım</button></div>`);
  $('nOgr').onclick = ogretici;
}
function duelloPencere() {
  const kod = oyun.duelloKodu();
  pencere(`<h3>Düello kodu</h3>
    <p>Son maçtaki takımın bir koda dönüşür. Arkadaşına at; o kendi takımıyla seninkini dövüştürsün. Sunucu gerekmez.</p>
    ${kod ? `<textarea readonly id="dKod">${kod}</textarea>` : '<p><i>Önce bir maç oyna: son takımın kaydedilir.</i></p>'}
    <p>Arkadaşının kodu:</p><textarea id="dGir" placeholder="KUT2-..."></textarea>
    <div class="eylemler">${kod ? `<button class="btn mor" id="dKopya">${ik('kopya')}Kopyala</button>` : ''}<button class="btn mor" data-kapat>Kapat</button><button class="btn altin" id="dDovus">${ik('kilic')}Dövüştür</button></div>`);
  if (kod) $('dKopya').onclick = () => paylas('Kut Arena takımım: ' + kod);
  $('dDovus').onclick = () => { const s = oyun.duelloHazirla($('dGir').value); if (s) { kapat(); savasBaslat(s, { ad: 'Arkadaş', duello: true }); } };
}
function ayarPencere() {
  const hafif = ayarOku('kut.hafif') === '1', kb = S3.kaliteBilgi();
  pencere(`<h3>Ayarlar</h3>
    <p><b>Ses:</b> ${Ses.sesAcik() ? 'Açık' : 'Kapalı'}</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aSes">${Ses.sesAcik() ? 'Sesi kapat' : 'Sesi aç'}</button><button class="btn mor" id="aMuzik">${Ses.muzikAcikMi() ? 'Müziği kapat' : 'Müziği aç'}</button></div>
    <p><b>Grafik:</b> ${hafif ? 'Hafif (gölge yok, düşük çözünürlük)' : 'Yüksek'}. Değişiklik sayfa yenilenince uygulanır.</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aGrafik">${hafif ? 'Yüksek grafiğe geç' : 'Hafif grafiğe geç'}</button>
    ${oyun.P.mac && aktifEkran !== 'ana' ? `<button class="btn sat" id="aCik">Ana menüye dön (maç kaldığı yerden sürer)</button>` : ''}</div>
    <p><b>Uyarlanır kalite:</b> ${kb.uyarlanir ? 'Açık' : 'Kapalı'}${kb.uyarlanir && kb.kademe ? ` (şu an: ${kb.ad})` : ''}. Cihaz yetişemezse savaşta çözünürlük ve efektler kendiliğinden azalır.</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aUyarla">${kb.uyarlanir ? 'Kapat (hep tam kalite)' : 'Aç'}</button>
    <button class="btn mor" id="aFps">${kb.olcer ? 'Kare hızı göstergesini gizle' : 'Kare hızı göstergesi'}</button></div>
    <p><b>Kare hızı:</b> ${kb.fpsHedef === 'oto' ? 'Otomatik' : kb.fpsHedef}${kb.ekranHz > 60 ? ` (ekran ${kb.ekranHz} Hz)` : ''}. 60 pili korur; Otomatik ekranın hızını hedefler.</p>
    <div class="eylemler" style="justify-content:flex-start" id="aHedef">${[['60', '60'], ['120', '120'], ['oto', 'Otomatik']].map(([v, ad]) => `<button class="btn ${kb.fpsHedef === v ? 'altin secik' : 'mor'}" data-v="${v}" aria-pressed="${kb.fpsHedef === v}">${ad}</button>`).join('')}</div>
    <p><b>Animasyonları azalt:</b> ${azHareket() ? 'Açık' : 'Kapalı'}${ayarOku('kut.azHareket') === null && azMedya && azMedya.matches ? ' (cihaz ayarı)' : ''}. Açıkken bitiş ekranlarında uçan kılıçlar, sarsıntı ve kamera yakın planı yerine sade geçiş gösterilir.</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aAz" aria-pressed="${azHareket()}">${azHareket() ? 'Animasyonları aç' : 'Animasyonları azalt'}</button></div>
    <p><b>Öğretici:</b> ${ogr.adim >= 0 ? `açık (adım ${ogr.adim + 1}/${OGR_ADIMLAR.length})` : 'kapalı'}. Temelleri adım adım yeniden gösterir.</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aOgr">Öğreticiyi yeniden başlat</button></div>
    <div class="eylemler"><button class="btn altin" data-kapat>Tamam</button></div>`, true);   // Ayarlar: menu_panel_b
  $('aAz').onclick = () => { ayarYaz('kut.azHareket', azHareket() ? '0' : '1'); azUygula(); kapat(); ayarPencere(); };
  $('aOgr').onclick = ogretici;
  document.querySelectorAll('#aHedef .btn').forEach(b => b.onclick = () => { S3.fpsHedef(b.dataset.v); kapat(); ayarPencere(); });
  $('aGrafik').onclick = () => { try { localStorage.setItem('kut.hafif', hafif ? '0' : '1'); } catch (e) {} location.reload(); };
  $('aSes').onclick = () => { Ses.sesAc(!Ses.sesAcik()); kapat(); ayarPencere(); };
  $('aMuzik').onclick = () => { Ses.muzikAc(!Ses.muzikAcikMi()); kapat(); ayarPencere(); };
  $('aUyarla').onclick = () => { S3.uyarlanir(!kb.uyarlanir); kapat(); ayarPencere(); };
  $('aFps').onclick = () => { S3.olcer(!kb.olcer); kapat(); ayarPencere(); };
  if ($('aCik')) $('aCik').onclick = () => { kapat(); anaCiz(); goster('ana'); };
}

// ── MAÇ EKRANI ──
function yuvaHTML(b, yer, i) {
  const M = oyun.M, sec = oyun.secili && oyun.secili.yer === yer && oyun.secili.i === i;
  const hedefle = (oyun.secili && !sec && !oyun.kaynasMod) || (oyun.seciliEsya !== null && b);
  const kaynasHedef = oyun.kaynasMod && b && !sec && !b.f && oyun.al(oyun.secili) && b.h !== oyun.al(oyun.secili).h;
  const ek = `data-yer="${yer}" data-i="${i}"`;
  if (!b) {
    const dolu = yer === 'tahta' && oyun.tahtaSay() >= oyun.yuva();
    return `<div class="yuva bos ${hedefle ? 'hedefle' : ''}" ${ek}>${hedefle && oyun.secili.yer === 'yedek' && dolu ? '<span style="opacity:.7">Takım dolu</span>' : ''}</div>`;
  }
  const h = kh(b.h), esy = b.e && b.e.length ? `<div class="esyalar">${b.e.map(id => esyaIk(id)).join('')}</div>` : '';
  if (b.f) {
    const f = kh(b.f); const soylar = [...new Set([...h.soy, ...f.soy, ...(b.f2 ? kh(b.f2).soy : [])])];
    return `<div class="yuva kaynas ${sec ? 'secili' : ''} ${hedefle ? 'hedefle' : ''}" ${ek}><div class="taban" style="--kc:${f.renk}"></div>
      <img class="port" src="${P(b.h)}" alt="">${mad(b.f)}${yildiz(b.s)}<div class="kaynasEt">${ik('kaynas')}KAYNAŞIK</div>
      <div class="soylar">${soylar.map(soyIk).join('')}</div>${esy}<div class="plaka">${oyun.birimAd(b)}</div></div>`;
  }
  return `<div class="yuva k${h.kademe} ${b.s > 1 ? 'yz2' : ''} ${sec ? 'secili' : ''} ${hedefle ? 'hedefle' : ''} ${kaynasHedef ? 'kaynasHedef' : ''}" ${ek}><div class="taban"></div>
    <img class="port" src="${P(b.h)}" alt="">${yildiz(b.s)}${sec ? '<div class="seciliEt">Seçili</div>' : ''}
    <div class="soylar">${h.soy.map(soyIk).join('')}</div>${esy}<div class="plaka">${h.ad}</div></div>`;
}
function macCiz() {
  const M = oyun.M; if (!M) return;
  const m = $('mac'), kr = oyun.kural(), sev = oyun.seviyeli();
  // üst şerit
  const roz = m.querySelectorAll('.macUst > .rozet');
  if (sev) {
    // 100 can: tek kalp ve sayı; ikinci rozette seri ve son hasar
    $('kalpler').innerHTML = `${hik('can')}<div class="yz" style="padding:0 6px"><small>Can</small>${M.can}</div>`;
    const sr = M.seri && M.seri.n ? `${M.seri.n} ${M.seri.tip === 'G' ? 'galibiyet' : 'yenilgi'}${L.seriBonus(M.seri.n) ? ` · +${L.seriBonus(M.seri.n)} ${hik('altin')}` : ''}` : 'yok';
    roz[1].innerHTML = `${hik('seri')}<div class="yz"><small>Seri</small><span style="font-size:15px">${sr}</span></div>${M.sonHasar ? `<div class="yz" style="padding-left:8px"><small>Son kayıp</small><span style="color:#ff8aa0">−${M.sonHasar}</span></div>` : ''}`;
  } else {
    $('kalpler').innerHTML = Array.from({ length: kr.can }, (_, i) => hik('can', i < M.can ? '' : 'bos')).join('');
    roz[1].innerHTML = `<div class="yz"><small>Zafer</small>${M.zafer}<span style="color:var(--soluk);font-size:14px">/${kr.zaferHedef}</span></div><div class="zaferler">${Array.from({ length: kr.zaferHedef }, (_, i) => `<i class="${i < M.zafer ? 'v' : ''}"></i>`).join('')}</div>`;
  }
  const tipAd = { pve: 'Canavar', kervan: 'Kervan', pvp: '' }[oyun.turTip()];
  roz[2].innerHTML = `${hik('tur')}<div class="yz"><small>${sev ? oyun.turUzun() + (tipAd ? ' · ' + tipAd : '') : 'Hızlı Maç · Tur'}</small>${oyun.turAd()}${sev ? ` <span style="color:var(--altinA)">· Sv ${M.seviye}</span>` : ''}</div>`;
  const al = D.ALAMETLER.find(a => a.id === M.alamet);
  // bu turun alameti; seviyeli maçta sıradaki (Alamet Bilgesi ile 3) tur alameti önceden görünür (bölüm 4.3, 8)
  const sonr = oyun.sonrakiAlametler(), sus = M.alametSusTur === M.tur;
  q('.alamet', m).innerHTML = `<div class="ay resim" style="${alametArka(M.alamet)}">${alametIc(M.alamet)}</div><div class="t"><small>Bu turun alameti${sus ? ' · senin savaşında susturuldu' : ''}</small><b>${al.ad}</b> <span>— ${al.m}</span>`
    + (sonr.length ? `<span class="sirada">Sıradaki: ${sonr.map(alametAd).join(' → ')}</span>` : '') + `</div>`;
  // seviyeli maçta bu turun geliri ve sonraki turun faizi (her K.faizAdim altına 1, en çok 5)
  const gl = sev && M.gelir, fz = oyun.faizSonraki();
  q('.altinRozet', m).innerHTML = `<div class="top">${hik('altin')}</div>${M.altin}` + (sev ? `<div class="yz" style="padding-left:6px;font-size:13px;line-height:1.2"><small>${gl ? `Gelir +${gl.toplam}` : 'Gelir'}</small><span style="color:var(--altinA)">Faiz +${fz}</span></div>` : '');
  q('.altinRozet', m).title = gl ? `Bu tur: taban ${gl.taban} · faiz ${gl.faiz} · seri ${gl.seri} · galibiyet ${gl.galibiyet}${gl.alamet ? ' · alamet ' + gl.alamet : ''}` : '';
  // rakip
  const r = M.rakip, rp = q('.rakip', m);
  rp.querySelector('.pn-bas .sag').textContent = `Tur ${oyun.turAd()}`;
  if (r) {
    const lider = r.takim.slice().sort((a, b) => kh(b.h).kademe * b.s - kh(a.h).kademe * a.s)[0];
    const lb = oyun.lobiDurum(), lbS = lb ? `<span class="lbS">Lobi: ${lb.filter(o => !o.olu).length}/8 ayakta · sıran ${lb[0].sira}${r.can != null ? ` · rakibin canı ${r.can}` : ''}</span>` : '';
    rp.querySelector('.rakipKim').innerHTML = `<div class="amb"><img src="${P(lider.h)}" alt=""></div><div style="min-width:0"><b>${r.ad} <span class="etiket">${r.kaynak === 'bot' ? 'Bot' : r.pve ? 'Canavar' : r.kaynak === 'yansima' ? 'Yansıma' : 'Gerçek'}</span></b><span>${r.pve ? `Canavar turu · ${r.takim.length} canavar · kaybetsen de ganimet` : `${ik('kupa')}${sayi(r.kupa || 0)} kupa · ${r.takim.length} kahraman`}</span>${lbS}</div>${lb && r.can != null ? `<em class="rkCan" title="Rakibin canı">${ik('kalp')}${r.can}</em>` : ''}`;
    const yer = {}; r.takim.forEach(b => { yer[b.y * SUTUN + b.x] = b; });
    $('rakipTahta').innerHTML = [0, 1, 2].map(sira => `<div class="sAd ${sira ? 'arka' : ''}">${SIRA_AD[sira]}</div>` + [0, 1, 2, 3].map(x => {
      const b = yer[sira * SUTUN + x]; return b ? `<div class="m k${kh(b.h).kademe}"><img src="${P(b.h)}" alt="">${yildiz(b.s)}${b.f ? mad(b.f) : ''}</div>` : `<div class="m bos"></div>`;
    }).join('')).join('');
    const rs = oyun.soylar(r.takim); const aktif = Object.entries(rs).filter(([, v]) => v.seviye).sort((a, b) => b[1].n - a[1].n);
    $('rakipSoy').innerHTML = aktif.length ? aktif.map(([s, v]) => `<span class="cip aktif"><img src="${SY(s)}" alt="">${D.SOYLAR[s].ad} ${v.n}</span>`).join('') : '<span class="cip">Aktif soy yok</span>';
    const gz = oyun.gozcu();
    if (gz && gz.length) q('.rakipKim', rp).insertAdjacentHTML('beforeend', `<span style="display:block;font-size:12px;color:#c9f0ff">Gözcü: ${gz.map(x => `${x.tur} ${x.ad}`).join(' · ')}</span>`);
    q('.ipucuSatir span', rp).textContent = r.pve ? 'Canavarların soyu yok: güçlü vuranları öne koy, uzun savaşta Gün Batımı hasarı artırır.' : aktif.length ? IPUCU[aktif[0][0]] : 'Rakip dağınık: en güçlü soyunu kur, birleştirmeye odaklan.';
  } else { rp.querySelector('.rakipKim').innerHTML = `<div style="padding:8px">${M.kervan ? 'Kervan turu: savaş yok. Bir kahraman + eşya seç.' : 'Rakip aranıyor…'}</div>`; $('rakipTahta').innerHTML = ''; $('rakipSoy').innerHTML = ''; }
  // soylar
  const sy = oyun.soylar(); const liste = Object.entries(sy).sort((a, b) => b[1].seviye - a[1].seviye || b[1].n - a[1].n);
  const aktifler = liste.filter(([, v]) => v.n >= 2), eksik = liste.filter(([, v]) => v.n < 2);
  $('soyListe').innerHTML = aktifler.length ? aktifler.map(([s, v]) => { const e = D.SOYLAR[s].esik;
    return `<div class="soyS" title="${D.SOYLAR[s].aciklama[Math.max(0, v.seviye - 1)]}" onclick="this.classList.toggle('acik')"><img src="${SY(s)}" alt=""><div style="min-width:0"><div class="ust"><span class="ad">${D.SOYLAR[s].ad}</span>
      <span class="esik"><b>${v.n}</b><span class="${v.n >= e[0] ? 'on' : ''}">${e[0]}</span><span class="${v.n >= e[1] ? 'on' : ''}">${e[1]}</span></span></div><span class="bonus">${D.SOYLAR[s].aciklama[Math.max(0, v.seviye - 1)]}</span></div></div>`; }).join('')
    : `<div class="soyBos">Aktif soy yok (2 aynı soy gerekir)</div>`;
  $('soyPasif').innerHTML = eksik.length ? `<span class="not">Eksik</span>` + eksik.slice(0, 5).map(([s]) => `<img class="ikc" src="${SY(s)}" alt="${D.SOYLAR[s].ad}" title="${D.SOYLAR[s].ad} 1/2">`).join('') : '';
  // tahta
  const tp = q('.tahtaPanel', m);
  tp.querySelector('.pn-bas .sag').textContent = `${oyun.tahtaSay()}/${oyun.yuva()} kahraman` + (sev ? ` · Sv ${M.seviye}` : (() => { // Hızlı Maç: takım sınırının büyüyeceği ilk tur (KURAL.hizli.yuva)
    const H = K.hizli, y = H.yuva(M.tur); let t = M.tur + 1; while (t < M.tur + 20 && H.yuva(t) <= y) t++;
    return H.yuva(t) > y ? ` · Tur ${t} başında ${H.yuva(t)}` : ''; })());
  ['onSira', 'ortaSira', 'arkaSira'].forEach((id, sira) => { $(id).innerHTML = [0, 1, 2, 3].map(x => yuvaHTML(M.tahta[sira * SUTUN + x], 'tahta', sira * SUTUN + x)).join(''); });
  $('yedek').innerHTML = M.yedek.map((b, i) => yuvaHTML(b, 'yedek', i)).join('');
  $('yedek').style.gridTemplateColumns = `repeat(${M.yedek.length},1fr)`;
  q('.yedekBas', tp).innerHTML = `Yedek ${M.yedek.filter(Boolean).length}/${oyun.yedekSayi()}<em>${oyun.kaynasMod ? 'Kaynaşacak ikinci kahramana dokun' : oyun.secili ? 'Taşımak için bir yuvaya dokun' : 'Bir kahramana dokun: bilgi, sat, kaynaştır'}</em><i></i>`;
  rafCiz(); armaganCiz();
  m.querySelectorAll('.yuva[data-yer]').forEach(y => y.onclick = () => oyun.yuvaDokun(y.dataset.yer, +y.dataset.i));
  // seçili panel
  secCiz();
  // dükkân
  const kartlar = M.dukkan.map((id, i) => {
    if (!id) return `<div class="kart bos" style="opacity:.25;border-style:dashed"></div>`;
    const h = kh(id), sahipN = [...M.tahta, ...M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length;
    const yuk = sahipN >= 2, pahali = M.altin < h.kademe, hv = oyun.havuzBilgi(id);
    return `<button class="kart k${h.kademe} ${yuk ? 'yuksel' : ''} ${pahali ? 'pahali' : ''}" data-i="${i}">
      <div class="resim"><img src="${P(id)}" alt=""><div class="solUst"><span class="kTag">K${h.kademe}</span>${h.soy.map(soyIk).join('')}</div>
      <div class="fiyat">${ik('coin')}${h.kademe}</div>${yuk ? `<div class="yukselEt">${ik('ok')}★2 olur · ${sahipN}/3</div>` : ''}${!yuk && sahipN ? `<div class="sahipEt">Elinde ${sahipN}/3</div>` : ''}</div>
      ${hv && !uc3 ? `<div class="havuzEt" title="Havuzda kalan kopya">Havuzda ${hv.kalan}/${hv.toplam}</div>` : ''}<div class="ad">${h.ad}</div></button>`;
  });
  $('kartlar').innerHTML = kartlar.join('');
  $('kartlar').querySelectorAll('.kart[data-i]').forEach(k => {
    let uzun = null, uzunOldu = false;
    k.addEventListener('pointerdown', () => { uzunOldu = false; uzun = setTimeout(() => { uzunOldu = true; kartBilgi(M.dukkan[+k.dataset.i]); }, 480); });
    k.addEventListener('pointerup', () => clearTimeout(uzun)); k.addEventListener('pointerleave', () => clearTimeout(uzun));
    k.onclick = () => { if (!uzunOldu) oyun.satinAl(+k.dataset.i); };
  });
  const ol = oyun.olasilik();
  q('.dukkan .pn-bas .sag', m).textContent = (sev ? `Sv ${M.seviye} şansı: ` : 'Şans: ') + ol.map((o, k) => `K${k + 1} %${Math.round(o * 100)}`).join(' · ');
  const sb = m.querySelectorAll('.dukkanSol .btn');
  const yb = oyun.yenileBedel();
  sb[0].disabled = M.altin < yb;
  sb[0].innerHTML = `${mik('yenile')}Yenile<small>${yb ? `${ik('coin')}${yb}` : `bedava${M.bedavaYenile > 1 ? ' ×' + M.bedavaYenile : ''}`}</small>`;
  // deneyim satın alma (yalnız seviyeli maç)
  const xb = sb[2];
  xb.style.display = sev ? '' : 'none';
  if (sev) {
    const tavan = M.seviye >= K.seviyeTavan, gerek = oyun.xpGerek();
    xb.disabled = tavan || M.altin < oyun.xpBedel();
    xb.innerHTML = tavan ? `${mik('deneyim')}Sv ${M.seviye}<small>en yüksek</small>`
      : `${mik('deneyim')}Sv ${M.seviye} · ${M.xp}/${gerek}<span class="xpCubuk"><i style="width:${Math.round(100 * M.xp / gerek)}%"></i></span><small>Deneyim Al · ${ik('coin')}${oyun.xpBedel()}</small>`;
  }
  sb[1].innerHTML = `${mik(M.kilit ? 'kilit' : 'kilit_acik')}${M.kilit ? 'Kilitli' : 'Kilitle'}`; sb[1].classList.toggle('altin', M.kilit); sb[1].classList.toggle('mor', !M.kilit);
  q('.savasBtn', m).innerHTML = M.kervan ? `${ik('oyna')}KERVAN<small>Bir kahraman + eşya seç</small>` : `${ik('kilic')}SAVAŞA!${r ? '' : '<small>Rakip aranıyor…</small>'}`;
  secimDenetle();
  if (uc3) hz3Ciz();
}
// Kut Armağanı kart görseli: kademe çerçevesi (arayuz/ui/esya/arm_*.png; güneş → arm_yildiz) + türe göre simge.
// Robot görseli gelince kut/web/arayuz/armagan/<id>.webp; liste.json (web_paket.cjs günceller) hangilerinin var olduğunu söyler → 404 yok.
const ARM_CERCEVE = { kivilcim: 'arm_kivilcim', alev: 'arm_alev', gunes: 'arm_yildiz' };
const ARM_SIMGE = { 'Kut': 'simsek', 'Kaynaştırma': 'kaynas', 'Eşya': 'kalkan', 'Önceden görme': 'goz', 'Alamet': 'isik', 'Ekonomi': 'coin', 'Seviye': 'ok', 'Geri dönüş': 'yenile' };
let armGorseller = new Set();
fetch('arayuz/armagan/liste.json').then(r => r.ok ? r.json() : []).then(l => { if (Array.isArray(l)) armGorseller = new Set(l); }).catch(() => {});
// Yetenek önizleme videoları (tools/yetenek_video.cjs ile önceden üretilmiş; web/arayuz/yetenek/<id>.mp4): liste.json var olanları sayar, yoksa eski görünüm
let yetVideolar = new Set();
fetch('arayuz/yetenek/liste.json').then(r => r.ok ? r.json() : []).then(l => { if (Array.isArray(l)) yetVideolar = new Set(l); }).catch(() => {});
// video kimliği: yeteneğin asıl sahibi (kaynaşmada yetenek birinciden gelir)
const yetVideoId = (yid) => { const k = D.KAHRAMANLAR.find(x => x.yetenek === yid); return k && yetVideolar.has(k.id) ? k.id : null; };
// otomatik oynatma kapalı: Animasyonları azalt, Hafif grafik ya da uyarlanır kalite düşük kademede (pil) → dokununca oynar
const yetVideoOto = () => { try { return !azHareket() && ayarOku('kut.hafif') !== '1' && !(S3.kaliteBilgi().kademe >= 5); } catch (e) { return false; } };
function yetVideoBagla() {
  const v = document.querySelector('#pencere .kdVid video'); if (!v) return;
  const kap = v.parentElement; v.muted = true; v.defaultMuted = true;
  v.addEventListener('playing', () => kap.classList.add('oynuyor')); v.addEventListener('pause', () => kap.classList.remove('oynuyor'));
  const kaynak = v.querySelectorAll('source'); if (kaynak.length) kaynak[kaynak.length - 1].addEventListener('error', () => kap.classList.add('yok'));   // hiçbiri oynamazsa portre (poster) kalır
  kap.addEventListener('click', (e) => { e.stopPropagation(); if (v.paused) v.play().catch(() => {}); else v.pause(); });
  if (yetVideoOto()) v.play().catch(() => {});
}
function yetVideoDurdur() { for (const v of document.querySelectorAll('#pencere video')) { try { v.pause(); for (const k of v.querySelectorAll('source')) k.remove(); v.removeAttribute('src'); v.load(); } catch (e) {} } }   // pencere kapanınca: çözücü ve pil serbest
function armaganGorsel(x) {
  const ozel = armGorseller.has(x.id) ? `<img class="armResim" alt="" draggable="false" src="arayuz/armagan/${x.id}.webp">` : '';
  const simge = ARM_SIMGE[x.tur] || 'yildiz';
  const sim = simge === 'coin' ? `<img class="armSimge" alt="" draggable="false" src="arayuz/menu/ikon_altin.webp">` : `<svg class="armSimge"><use href="#i-${simge}"/></svg>`;
  return `<span class="armGorsel" aria-hidden="true"><span class="armIc">${ozel || sim}</span><img class="armCer" alt="" draggable="false" src="../arayuz/ui/esya/${ARM_CERCEVE[x.kademe] || 'arm_kivilcim'}.png"></span>`;
}
// Bekleyen seçimler (bedava kahraman, Kervan, ganimet eşyası): basit pencere. Kapatılırsa düğmelerle yeniden açılır; savaşta seçilmeyen ilk seçenek olur.
let sonSecim = null;
function secimDenetle(zorla = false) {
  const M = oyun.M, tip = oyun.bekleyenSecim();
  const anahtar = tip ? tip + ':' + M.tur + ':' + JSON.stringify(tip === 'ilk' ? M.ilkSecim : tip === 'kervan' ? M.kervan.secenek : tip === 'armagan' ? M.armaganSecim : tip === 'muhur' ? 1 : M.ganimetSecim) : null;
  if (!tip) { sonSecim = null; return; }
  if (!zorla && anahtar === sonSecim) return;
  sonSecim = anahtar;
  const kart = (h, ust, alt, ek = '') => `<img class="pp" src="${P(h)}" alt="">${ek}<b>${ust}</b><small>${alt}</small>`;
  let baslik, metin, ic;
  if (tip === 'ilk') {
    baslik = 'Başlangıç kahramanı'; metin = 'Bölüm 1 başlıyor. Bu üç kahramandan biri bedava.';
    ic = M.ilkSecim.map((id, i) => `<button class="sc" data-s="${i}">${kart(id, kh(id).ad, kh(id).soy.map(x => D.SOYLAR[x].ad).join(' · '))}</button>`).join('');
  } else if (tip === 'kervan') {
    baslik = `Kervan · ${oyun.turAd()}`; metin = 'Savaş yok. Bir kahraman + eşya seç: kahraman yedeğe, eşya rafa iner (yedek doluysa kahraman altına çevrilir).';
    ic = M.kervan.secenek.map((o, i) => `<button class="sc" data-s="${i}">${kart(o.birim.h, oyun.birimAd(o.birim) + (o.birim.s > 1 ? ' ★' + o.birim.s : ''), (D.esya(o.esya) || {}).ad || o.esya, esyaIk(o.esya))}</button>`).join('');
  } else if (tip === 'armagan') {
    const a = M.armaganSecim;
    baslik = `Kut Armağanı · ${D.ARMAGAN_KADEME[a.kademe]}`; metin = 'Üç karttan birini seç: maç boyunca seninle kalır.' + (a.yenile > 0 ? ' Kartları bir kez yenileyebilirsin.' : '') + ' <b id="arSaat"></b>';
    arSaatKur(a.r);
    ic = a.secenek.map((id, i) => { const x = D.armagan(id); return `<button class="sc arm k-${x.kademe}" data-s="${i}" style="--sira:${i}">${armaganGorsel(x)}<span class="kd">${D.ARMAGAN_KADEME[x.kademe]} · ${x.tur}</span><b>${x.ad}</b><small>${x.m}</small><em>Neden seç? ${x.neden}</em></button>`; }).join('')
      + (a.yenile > 0 ? `<button class="sc" data-yenile="1" style="justify-content:center"><b>${ik('yenile')} Yenile</b><small>Üç kartın hepsi değişir, kademe aynı kalır</small></button>` : '');
  } else if (tip === 'muhur') {
    baslik = 'Soy Mührü'; metin = 'Bir soy seç: o soyun Mührü rafına iner. Mührü taşıyan kahraman bu soyu da sayar.';
    ic = Object.entries(D.SOYLAR).map(([sy, v]) => `<button class="sc" data-soy="${sy}"><img class="pp" src="${SY(sy)}" alt="" style="width:40px;height:40px"><b>${v.ad}</b><small>${v.aciklama[0]}</small></button>`).join('');
  } else {
    baslik = 'Ganimet seçimi'; metin = 'Canavarlar bunları bıraktı. Birini seç, rafına iner.';
    ic = M.ganimetSecim.map((id, i) => `<button class="sc" data-s="${i}">${esyaIk(id)}<b>${(D.esya(id) || {}).ad || id}</b><small>${esyaMetin(id)}</small></button>`).join('');
  }
  pencere(`<h3>${baslik}</h3><p>${metin}</p><div class="secimler">${ic}</div>`, false, tip === 'armagan' ? 'armagan' : '');
  document.querySelectorAll('#pencere .sc[data-s]').forEach(b => b.onclick = async () => {
    const k = +b.dataset.s; kapat(); sonSecim = null;
    if (tip === 'ilk') oyun.ilkSec(k); else if (tip === 'kervan') await oyun.kervanSec(k); else if (tip === 'armagan') oyun.armaganSec(k); else oyun.ganimetSec(k);
  });
  document.querySelectorAll('#pencere .sc[data-yenile]').forEach(b => b.onclick = () => { kapat(); sonSecim = null; oyun.armaganYenile(); });
  document.querySelectorAll('#pencere .sc[data-soy]').forEach(b => b.onclick = () => { kapat(); sonSecim = null; oyun.muhurSec(b.dataset.soy); });
}
// Armağan seçim süresi (bölüm 6.1): aşama başına K.armagan.sure sn (yenileme süreyi uzatmaz); süre dolunca ilk kart seçilir.
let arSure = null;
function arSaatKur(r) {
  if (arSure && arSure.r === r) return arSaat();
  if (arSure) clearInterval(arSure.z);
  arSure = { r, bitis: Date.now() + K.armagan.sure * 1000 }; arSure.z = setInterval(arSaat, 250); arSaat();
}
function arSaat() {
  const M = oyun.M, a = M && M.armaganSecim;
  if (!arSure || !a || a.r !== arSure.r) { if (arSure) clearInterval(arSure.z); arSure = null; return; }
  const k = Math.max(0, Math.ceil((arSure.bitis - Date.now()) / 1000)), el = $('arSaat');
  if (el) el.textContent = `${k} sn`;
  if (k <= 0) { clearInterval(arSure.z); arSure = null; if (el) kapat(); sonSecim = null; oyun.armaganSec(0); }
}
// Eşya rafı (yalnız Arena): yedeğin altında 10 yuva. Dokun → seç; kahramana dokun → tak; ikinci bileşene dokun → rafta birleştir.
function rafCiz() {
  const M = oyun.M; let raf = $('esyaRaf');
  if (!raf) { raf = document.createElement('div'); raf.id = 'esyaRaf'; raf.className = 'esyaRaf'; if (uc3) q('#mac .solKolon').append(raf); else $('yedek').after(raf); }
  raf.style.display = oyun.seviyeli() ? '' : 'none';
  if (!oyun.seviyeli()) return;
  const l = M.esyaRaf || [], se = oyun.seciliEsya, sx = se !== null ? D.esya(l[se]) : null;
  const ipucu = sx ? (sx.id === 'sokumTasi' ? 'Eşyalarını sökmek için bir kahramana dokun' : sx.tip === 'bilesen' ? `${sx.ad}: kahramana dokun ya da başka bir bileşenle birleştir` : `${sx.ad}: takmak için bir kahramana dokun`)
    : l.length ? 'Eşyaya dokun, sonra kahramana' : 'Eşyalar canavar turlarından ve Kervan\'dan gelir';
  raf.innerHTML = `<span class="rafAd">Eşya ${l.length}/${K.esyaRaf}</span>` + Array.from({ length: K.esyaRaf }, (_, i) => l[i]
    ? `<button class="re ${se === i ? 'secik' : ''}" data-r="${i}" title="${D.esya(l[i]) ? D.esya(l[i]).ad + ': ' + esyaMetin(l[i]) : l[i]}"><img src="${ES(l[i])}" alt=""></button>` : `<span class="re bos"></span>`).join('')
    + ((M.esyaTasan || []).length ? `<span class="tasan">+${M.esyaTasan.length} taşan</span>` : '') + `<em>${ipucu}</em>`;
  raf.querySelectorAll('.re[data-r]').forEach(e => e.onclick = () => oyun.esyaSec(+e.dataset.r));
}
// Alınan Kut Armağanları (yalnız seviyeli maç): rafın altında küçük rozetler; Alamet Bilgesi'nin susturma düğmesi ve bekleyen seçim.
function armaganCiz() {
  const M = oyun.M; let el = $('armaganSerit');
  if (!el) { el = document.createElement('div'); el.id = 'armaganSerit'; el.className = 'armaganSerit'; $('esyaRaf').after(el); }
  el.style.display = oyun.seviyeli() ? '' : 'none';
  if (!oyun.seviyeli()) return;
  const l = M.armagan || [];
  el.innerHTML = `<b>Armağan</b>` + (l.length ? l.map(id => { const x = D.armagan(id); return `<span class="ar ${x.kademe}" title="${x.ad}: ${x.m}">${x.ad}</span>`; }).join('') : '<span style="color:var(--yazi2)">2-1, 3-2 ve 4-3\'te Kut Armağanı seçersin</span>')
    + (M.yumurta ? `<span style="color:#ffe48a">Yumurta: ${M.yumurta.kalan} savaş</span>` : '') + (M.bedavaKaynas ? `<span style="color:#ffe48a">Bedava kaynaştırma</span>` : '')
    + (oyun.alametSusturabilir() ? `<button id="alSus">Alameti sustur</button>` : '')
    + (M.armaganSecim ? `<button id="arAc">Armağan seç</button>` : M.muhurSecim ? `<button id="arAc">Soy seç</button>` : '');
  if ($('alSus')) $('alSus').onclick = () => oyun.alametSustur();
  if ($('arAc')) $('arAc').onclick = () => secimDenetle(true);
}
function secCiz() {
  const sp = $('secPanel'), b = oyun.al(oyun.secili);
  if (!b) {
    sp.className = 'pn gem secPanel bos';
    sp.innerHTML = `<div class="pn-bas"><span class="elmas"></span>Seçili kahraman</div>
      <div class="secIpucu">${ik('el')} Bir kahramana dokun</div>`;
    return;
  }
  const h = kh(b.h), st = SIM.birimStat(b), soylar = st.soy;
  sp.className = `pn gem secPanel k${h.kademe}`;
  // Üçlü Kaynaşma armağanıyla kaynaşmış birim (üçüncüsü yoksa) bir kez daha kaynaşabilir
  const uclu = b.f && !b.f2 && oyun.armaganVar('ucluKaynasma');
  const kBedel = oyun.kaynastirBedel(b.h), kaynasabilir = (!b.f || uclu) && oyun.M.altin >= kBedel;
  sp.innerHTML = `<div class="pn-bas"><span class="elmas"></span>Seçili kahraman</div>
    <div class="secUst"><div class="secPort"><img src="${P(b.h)}" alt="">${b.f ? mad(b.f) : ''}</div>
      <div class="secAd"><h3>${oyun.birimAd(b)}</h3><div class="alt">${yildiz(b.s)}<span class="kTag">K${h.kademe}</span>
        <button class="btn sat" id="eSat">Sat <span style="display:flex;align-items:center;gap:2px">+${oyun.satisDegeri(b)} ${ik('coin')}</span></button></div></div>
      <div class="soyC">${soylar.map(s => `<span class="cip aktif"><img src="${SY(s)}" alt="">${D.SOYLAR[s].ad}</span>`).join('')}<span class="not">Ustalık Sv.${oyun.ustaSv(b.h)}</span></div></div>
    <div class="statlar">
      <div class="stat">${ik('kalp')}<div class="yz"><small>Can</small>${st.can}</div></div>
      <div class="stat">${ik('kilic1')}<div class="yz"><small>Saldırı</small>${st.atk}</div></div>
      <div class="stat">${ik('simsek')}<div class="yz"><small>Hız</small>${st.as.toFixed(2).replace('.', ',')}</div></div>
      <div class="stat">${ik('hedef')}<div class="yz"><small>Menzil</small>${st.menzil}</div></div>
      <div class="stat">${ik('damla')}<div class="yz"><small>Mana</small>${st.mana}</div></div>
      <div class="stat">${ik('kalkan')}<div class="yz"><small>Yer</small>${oyun.secili.yer === 'yedek' ? 'Yedek' : SIRA_AD[Math.floor(oyun.secili.i / SUTUN)]}</div></div>
    </div>
    <div class="yetenek"><b><em>Yetenek</em>${D.YETENEK[st.yetenek].ad}</b>${D.YETENEK[st.yetenek].m}</div>
    <div class="yetenek pasif"><b><em>Pasif</em>${D.PASIF[st.pasif].ad}</b>${D.PASIF[st.pasif].m}</div>
    ${b.e && b.e.length ? `<div class="secEsya">${b.e.map(id => `<div>${esyaIk(id)}<span><b>${(D.esya(id) || { ad: id }).ad}.</b> ${esyaMetin(id)}</span></div>`).join('')}</div>` : ''}
    <div class="secEylem">${b.f && !uclu ? `<div style="padding:10px;color:var(--yazi2);font-size:15px">${b.f2 ? 'Üçlü kaynaşmış kahraman.' : 'Kaynaşmış kahraman tekrar kaynaşmaz.'}</div>` : `
      <button class="btn gb kaynastir" id="eKay" ${kaynasabilir ? '' : 'disabled'}><span class="ust">${ik('kaynas')}${oyun.kaynasMod ? 'İKİNCİYE DOKUN' : 'KAYNAŞTIR'}</span><small>${oyun.seviyeli() && kh(b.h).kademe < 3 && kBedel > 1 ? kBedel + '–5' : kBedel || 'bedava'} ${kBedel ? ik('coin') : ''} · ${oyun.kaynasMod ? 'iptal için tekrar bas' : 'sonra 2. kahramana dokun'}</small></button>
      <div class="kaynasSema"><div class="kk"><img src="${P(b.h)}" alt=""></div><span class="arti">+</span><div class="kk soru">?</div>
        <p>${uclu ? '<b>Üçüncü kahramandan</b><br>soylar ve +%10 güç gelir.' : `<b>Yetenek ${h.ad.split(' ')[0]}'dan,</b><br>pasif ikinciden gelir.`}</p></div>`}</div>`;
  sp.querySelectorAll('.stat .ik').forEach((e, i) => e.style.color = ['#ff6a86', '#ffd45c', '#7fdcff', '#ffb36a', '#6aa8ff', '#d9c7ef'][i]);
  $('eSat').onclick = () => oyun.sat();
  if ($('eKay')) $('eKay').onclick = () => oyun.kaynasModDegistir();
}
// Kahraman ayrıntı kartı (Kahramanlar sayfası, dükkânda uzun bas, hazırlıkta (i)): solda kademe çerçeveli portre,
// sağda ad, kademe/soy çipleri, istatistik ızgarası, Yetenek ve Pasif ayrı kutular; ek satırlar (havuz, eşya) altta.
function kahDetayHTML({ id, ad, s = 0, st, ek = '', esyalar = [] }) {
  const h = kh(id), yet = D.YETENEK[st.yetenek], pas = D.PASIF[st.pasif], vid = yetVideoId(st.yetenek);
  const hiz = (+st.as).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  const stat = [['kalp', 'Can', st.can], ['kilic', 'Saldırı', st.atk], ['simsek', 'Saldırı hızı', hiz], ['hedef', 'Menzil', st.menzil], ['damla', 'Mana', st.mana]];
  return `<div class="kDetay k${h.kademe}">
    <div class="kdPortre"><div class="kdCer"><img src="${P(id)}" alt=""></div><span class="kdKad">K${h.kademe}</span>${s ? yildiz(s) : ''}</div>
    <div class="kdSag">
      <h3 class="kdAd">${ad}</h3>
      <div class="kdCipler"><span class="kdCip kad">Kademe ${h.kademe}</span><span class="kdCip fiyat">${ik('coin')}${h.kademe} altın</span>${st.soy.map(x => `<span class="kdCip soy"><img src="${SY(x)}" alt="">${D.SOYLAR[x].ad}</span>`).join('')}</div>
      <div class="kdStat">${stat.map(([n, a, v]) => `<div><small>${ik(n)}${a}</small><b>${v}</b></div>`).join('')}</div>
      <div class="kdYP${vid ? ' vid' : ''}">
        ${vid ? `<div class="kdKutu yet vid"><div class="kdVid"><video muted playsinline loop preload="${yetVideoOto() ? 'auto' : 'none'}" poster="${P(vid)}" disablepictureinpicture disableremoteplayback aria-label="Yetenek önizlemesi: ${yet.ad}"><source src="arayuz/yetenek/${vid}.mp4" type="video/mp4"><source src="arayuz/yetenek/${vid}.webm" type="video/webm"></video><span class="kdVidEt">${ik('simsek')}Yetenek: ${yet.ad}</span><i class="kdVidOyna" aria-hidden="true"></i></div><div class="kdYetMetin"><h4>${ik('simsek')}Yetenek</h4><b>${yet.ad}</b><p>${yet.m}</p></div></div>`
          : `<div class="kdKutu yet"><h4>${ik('simsek')}Yetenek</h4><b>${yet.ad}</b><p>${yet.m}</p></div>`}
        <div class="kdKutu pas"><h4>${ik('kalkan')}Pasif</h4><b>${pas.ad}</b><p>${pas.m}</p></div>
      </div>
      ${esyalar.length ? `<div class="kdEsya">${esyalar.map(e => `<div>${esyaIk(e)}<span><b>${(D.esya(e) || { ad: e }).ad}</b> ${esyaMetin(e)}</span></div>`).join('')}</div>` : ''}
      ${ek ? `<div class="kdEk">${ek}</div>` : ''}
    </div></div>
    <div class="eylemler"><button class="btn altin" data-kapat>Tamam</button></div>`;
}
function kartBilgi(id) {
  if (!id) return; const h = kh(id); const hv = oyun.havuzBilgi(id);
  pencere(kahDetayHTML({ id, ad: h.ad, st: { ...h, soy: h.soy }, ek: hv ? `Havuzda ${hv.kalan}/${hv.toplam} kopya` : '' }), false, 'kahraman'); yetVideoBagla();
}
oyun.on('degisti', () => { if (aktifEkran === 'mac') macCiz(); });
{ const sb = document.querySelectorAll('#mac .dukkanSol .btn'); sb[0].onclick = () => oyun.yenile(); sb[1].onclick = () => oyun.kilit(); sb[2].onclick = () => oyun.xpAl(); }
q('#mac .savasBtn').onclick = () => { if (oyun.M && oyun.M.kervan) return secimDenetle(true); const s = oyun.savasHazirla(); if (s) savasBaslat(s, oyun.M.rakip); };
q('#mac .ayarBtn').onclick = ayarPencere;
// sürükle-bırak (tablet, fare): dolu yuvayı basılı tutup başka yuvaya sürükle → taşı/yer değiştir; dükkâna bırak → sat.
// Kısa dokunuş eskisi gibi (seç, sonra hedefe dokun). Hayalet kökün dışında (ekran px), olaylar window'da: macCiz yuvaları yeniden kursa da sürer.
(() => {
  const mac = $('mac'); let sur = null, surBitti = 0;
  const temizle = () => { if (!sur) return; if (sur.hayalet) sur.hayalet.remove(); mac.querySelectorAll('.yuva.surHedef').forEach(y => y.classList.remove('surHedef')); mac.classList.remove('surukleniyor'); sur = null; };
  const altindaki = (x, y) => { const e = document.elementFromPoint(x, y); return e ? (e.closest('#mac .yuva[data-yer]') || (e.closest('#mac .dukkan') ? 'sat' : null)) : null; };
  mac.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !e.isPrimary) return; const y = e.target.closest('.yuva[data-yer]');
    if (!y || y.classList.contains('bos') || y.classList.contains('kilit') || oyun.kaynasMod || oyun.seciliEsya !== null) return;
    if (!oyun.al({ yer: y.dataset.yer, i: +y.dataset.i })) return;
    temizle(); sur = { yer: y.dataset.yer, i: +y.dataset.i, id: e.pointerId, x: e.clientX, y: e.clientY, aktif: false, hayalet: null, el: y };
  });
  window.addEventListener('pointermove', (e) => {
    if (!sur || e.pointerId !== sur.id) return;
    if (!sur.aktif) {
      if ((e.clientX - sur.x) ** 2 + (e.clientY - sur.y) ** 2 < 144) return;   // 12 px eşik: titrek dokunuş sürükleme sayılmaz
      sur.aktif = true; const r = sur.el.getBoundingClientRect(), img = sur.el.querySelector('.port');
      const h = document.createElement('div'); h.className = 'surHayalet'; h.style.width = r.width + 'px'; h.style.height = r.height + 'px';
      if (img) h.appendChild(img.cloneNode()); document.body.appendChild(h); sur.hayalet = h; sur.dx = r.width / 2; sur.dy = r.height * 0.6;
      mac.classList.add('surukleniyor'); if (oyun.secili) { oyun.secili = null; macCiz(); }
    }
    sur.hayalet.style.transform = `translate(${e.clientX - sur.dx}px,${e.clientY - sur.dy}px)`;
    const t = altindaki(e.clientX, e.clientY);
    mac.querySelectorAll('.yuva.surHedef').forEach(y => { if (y !== t) y.classList.remove('surHedef'); });
    if (t && t !== 'sat' && !(t.dataset.yer === sur.yer && +t.dataset.i === sur.i)) t.classList.add('surHedef');
    mac.classList.toggle('surSat', t === 'sat');
  });
  const birak = (e) => {
    if (!sur || e.pointerId !== sur.id) return;
    const s = sur; if (!s.aktif) { sur = null; return; }
    const t = altindaki(e.clientX, e.clientY); temizle(); mac.classList.remove('surSat');
    surBitti = performance.now();
    if (t === 'sat') { oyun.secili = { yer: s.yer, i: s.i }; oyun.kaynasMod = false; oyun.sat(); return; }
    if (!t || (t.dataset.yer === s.yer && +t.dataset.i === s.i)) return;
    oyun.secili = null; oyun.kaynasMod = false; oyun.yuvaDokun(s.yer, s.i); oyun.yuvaDokun(t.dataset.yer, +t.dataset.i);
  };
  window.addEventListener('pointerup', birak);
  window.addEventListener('pointercancel', (e) => { if (sur && e.pointerId === sur.id) { temizle(); mac.classList.remove('surSat'); } });
  // sürükleme bitince tarayıcının ardından yolladığı tıklama seçimi değiştirmesin
  mac.addEventListener('click', (e) => { if (performance.now() - surBitti < 250) { e.stopPropagation(); e.preventDefault(); } }, true);
})();

// ── 3D HAZIRLIK ──
// Takım savaşın yapıldığı 3D arenada durur (sahne3d hazirlik*): dokun = seç (yanında bilgi kartı), sürükle = hücreye/yedeğe taşı, dükkâna bırak = sat.
// Kurallar oyun.js'te: burası yalnız yuvaDokun / sat / kaynasModDegistir / esyaSec çağırır.
const hz3 = { acik: false, dongu: false, kur: null, ilk: false, refYer: new Map(), sur: null, esya: null, alanZ: 0, surBitti: 0 };
// bir kez: 3D düzen için öğeleri yerleştir (rakip üst şeride, sayaç, bilgi kartı, tahta alanı, şans düğmesi)
function hz3Duzen() {
  const m = $('mac'), ust = q('.macUst', m);
  if (!$('tahta3d')) m.insertAdjacentHTML('beforeend', '<div id="tahta3d" aria-hidden="true"></div><div id="bilgiKart" class="bilgiKart" hidden></div>');
  if (!q('.tahtaSayac', ust)) q('.altinRozet', ust).insertAdjacentHTML('afterend', `<div class="rozet tahtaSayac" title="Tahtadaki kahraman / sınır">${ik('kilic')}<span></span></div>`);
  const rk = q('.rakip', m); if (rk && rk.parentElement !== ust) { ust.insertBefore(rk, q('.ayarBtn', ust)); rk.addEventListener('click', () => rk.classList.toggle('acik')); }
  const al = q('.alamet', ust); al.addEventListener('click', () => al.classList.toggle('acik'));
  const dk = q('.dukkan', m); if (!q('.sansBtn', dk)) { dk.insertAdjacentHTML('beforeend', '<button class="sansBtn" aria-label="Dükkân şansları"><img class="mik" alt="" draggable="false" src="arayuz/menu/ikon_bilgi.webp"></button><div class="sansKutu" hidden></div>'); q('.sansBtn', dk).onclick = (e) => { e.stopPropagation(); const k = q('.sansKutu', dk); k.hidden = !k.hidden; }; }
  const raf = $('esyaRaf'); if (raf) q('.solKolon', m).append(raf);
  const ar = $('armaganSerit'); if (ar) q('.solKolon', m).append(ar);
  q('.solKolon', m).addEventListener('click', (e) => { const b = e.target.closest('#armaganSerit>b'); if (b) b.parentElement.classList.toggle('acik'); });
  $('soyListe').addEventListener('click', (e) => { const r = e.target.closest('.soy3'); if (!r) return; const ac = !r.classList.contains('acik'); $('soyListe').querySelectorAll('.soy3.acik').forEach(x => x.classList.remove('acik')); r.classList.toggle('acik', ac); });
}
function hz3Ac() {
  if (hz3.kur || hz3.acik) { if (hz3.acik && !hz3.dongu) { hz3.dongu = true; requestAnimationFrame(hz3Kare); } return; }
  hz3.kur = (async () => {
    if (vitrin) await vitrin.bekle();   // karşılama vitrini kuruluyorsa bitsin
    await sahneyiHazirla();
    if (aktifEkran !== 'mac') return;
    S3.hazirlikAc({ yedekN: oyun.M ? oyun.yedekSayi() : 7 }); hz3.acik = true; hz3.ilk = true;
    if (oyun.M) hz3Esitle();
    if (!hz3.dongu) { hz3.dongu = true; requestAnimationFrame(hz3Kare); }
  })().catch(e => console.error(e)).finally(() => { hz3.kur = null; });
}
function hz3Kapat(gecis = false) {
  hz3.acik = false; hz3.sur = null; S3.hazirlikKapat({ gecis }); $('bilgiKart').hidden = true;
}
function hz3Kare() {
  if (aktifEkran !== 'mac' || !hz3.acik) { hz3.dongu = false; return; }
  if (hz3.ilk) { hz3.ilk = false; S3.boyutla(); }
  S3.kare(); bilgiKartYer();
  const t = performance.now(); if (t - hz3.alanZ > 300) { hz3.alanZ = t; hz3AlanYaz(); }
  requestAnimationFrame(hz3Kare);
}
// öğretici çerçevesi için tahta + yedek sırasının kutusu (kök px)
function hz3AlanYaz() {
  const a = S3.hazirlikAlan(), el = $('tahta3d'); if (!a || !el) return; const o = olcek();
  el.style.left = (a.left / o) + 'px'; el.style.top = (a.top / o) + 'px'; el.style.width = ((a.right - a.left) / o) + 'px'; el.style.height = ((a.bottom - a.top) / o) + 'px';
}
function hz3Guvenli(w, h) {
  const m = $('mac'), r = (s) => { const e = q(s, m); if (!e) return null; const k = e.getBoundingClientRect(); return k.width && k.height ? k : null; };
  const ust = r('.macUst'), alt = r('.dukkanSerit'), sol = r('.solKolon');
  const yan = sol ? sol.right + 4 : 0;
  return { ust: ust ? ust.bottom + 2 : 0, alt: alt ? h - alt.top + 2 : 0, sol: yan, sag: yan };
}
// oyun durumu → sahne (kahraman nesnesi kimliği: taşınınca aynı model kayar)
function hz3Esitle() {
  const M = oyun.M; if (!M) return; const liste = []; hz3.refYer = new Map();
  for (const yer of ['tahta', 'yedek']) M[yer].forEach((b, i) => { if (b) { liste.push({ ref: b, b, yer, i }); hz3.refYer.set(b, { yer, i }); } });
  const yuk = S3.hazirlikEsitle(liste);
  const sec = oyun.al(oyun.secili);
  let kaynas = null;
  if (sec && oyun.kaynasMod) { const uclu = sec.f && !sec.f2 && oyun.armaganVar('ucluKaynasma');
    kaynas = liste.map(o => o.b).filter(b => b !== sec && !b.f && b.h !== sec.h && (!uclu || b.h !== sec.f)); }
  S3.hazirlikVurgu({ secili: sec || null, kaynas, acik: !!sec || oyun.seciliEsya !== null || !!hz3.sur });
  return yuk;
}
function hz3Ciz() {
  const M = oyun.M, m = $('mac'), sev = oyun.seviyeli();
  hz3Esitle();
  // sayaç: tahtadaki / sınır
  const ts = q('.tahtaSayac span', m); if (ts) ts.textContent = `${oyun.tahtaSay()}/${oyun.yuva()}`;
  // soylar: dikey simge + sayı/eşik; açıklama dokununca
  const sy = oyun.soylar(), tum = Object.entries(sy).filter(([, v]) => v.n > 0).sort((a, b) => b[1].seviye - a[1].seviye || b[1].n - a[1].n);
  const acikS = (q('#soyListe .soy3.acik') || {}).dataset;
  $('soyListe').innerHTML = tum.length ? tum.map(([s, v]) => { const S = D.SOYLAR[s], e = S.esik, son = e.find(x => x > v.n) || e[e.length - 1];
    return `<div class="soy3 ${v.seviye ? 'on' : ''} ${acikS && acikS.s === s ? 'acik' : ''}" data-s="${s}"><img src="${SY(s)}" alt="${S.ad}"><span class="sy"><b>${v.n}</b>/${son}</span>
      <div class="soyAc"><b>${S.ad}</b>${e.map((x, k) => `<span class="${v.n >= x ? 'on' : ''}"><em>${x}</em>${S.aciklama[k] || ''}</span>`).join('')}</div></div>`; }).join('')
    : `<div class="soyBos">${ik('el')}</div>`;
  // dükkân şansı (i)
  const sk = q('.sansKutu', m); if (sk) sk.textContent = (sev ? `Sv ${M.seviye} şansı: ` : 'Şans: ') + oyun.olasilik().map((o, k) => `K${k + 1} %${Math.round(o * 100)}`).join(' · ');
  // alamet: yalnız simge; açıklama dokununca (.acik)
  bilgiKartCiz();
}
// ── seçili kahramanın yanında küçük bilgi kartı ──
function bilgiKartCiz() {
  const el = $('bilgiKart'); if (!el) return; const b = oyun.al(oyun.secili);
  if (!b || !hz3.acik) { el.hidden = true; el._ref = null; return; }
  const h = kh(b.h), st = SIM.birimStat(b);
  const uclu = b.f && !b.f2 && oyun.armaganVar('ucluKaynasma'), kB = oyun.kaynastirBedel(b.h), kaynasabilir = (!b.f || uclu) && oyun.M.altin >= kB;
  const kBY = oyun.seviyeli() && h.kademe < 3 && kB > 1 ? kB + '–5' : kB;
  el.className = `bilgiKart k${h.kademe}`; el.hidden = false; el._ref = b;
  el.innerHTML = `<div class="bkBas"><div class="bkPor"><img src="${P(b.h)}" alt=""></div><div class="bkBilgi"><div class="bkUst"><b>${oyun.birimAd(b)}</b>${yildiz(b.s)}</div>
    <div class="bkSoy"><span class="kTag">K${h.kademe}</span>${st.soy.map(s => `<span class="bs"><img src="${SY(s)}" alt="">${D.SOYLAR[s].ad}</span>`).join('')}</div></div></div>
    ${b.e && b.e.length ? `<div class="bkEsya">${b.e.map(id => esyaIk(id)).join('')}</div>` : ''}
    <div class="bkEylem"><button class="btn sat" id="bkSat">${mik('sat')}Sat<small>+${oyun.satisDegeri(b)}${ik('coin')}</small></button>
      ${!b.f || uclu ? `<button class="btn ${oyun.kaynasMod ? 'altin' : 'mor'}" id="bkKay" ${kaynasabilir || oyun.kaynasMod ? '' : 'disabled'}>${mik('kaynastir')}${oyun.kaynasMod ? 'İkinciye dokun' : `Kaynaştır${kB ? `<small>${kBY}${ik('coin')}</small>` : ''}`}</button>` : ''}
      <button class="btn bkBil" id="bkBil" aria-label="Ayrıntı">${mik('bilgi')}</button></div>`;
  $('bkSat').onclick = (e) => { e.stopPropagation(); oyun.kaynasMod = false; oyun.sat(); };
  if ($('bkKay')) $('bkKay').onclick = (e) => { e.stopPropagation(); oyun.kaynasModDegistir(); };
  $('bkBil').onclick = (e) => { e.stopPropagation(); birimDetay(b); };
  el._w = 0; bilgiKartYer();
}
function bilgiKartYer() {
  const el = $('bilgiKart'); if (!el || el.hidden || !el._ref) return;
  const e = S3.hazirlikEkran(el._ref); if (!e) return; const o = olcek();
  if (!el._w) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
  const W = innerWidth / o, ust = (q('#mac .macUst').getBoundingClientRect().bottom) / o + 4, alt = (q('#mac .dukkanSerit').getBoundingClientRect().top) / o - 4;
  let x = (e.x + e.yari) / o + 10, y = e.ustY / o - 8;
  if (x + el._w > W - 8) x = (e.x - e.yari) / o - 10 - el._w;
  // telefonda (html.alcak) tahta küçük: kart birimin yanında ama üst kenarda dursun (yedek sırasını örtmesin)
  if (document.documentElement.classList.contains('alcak')) y = ust;
  x = Math.max(8, Math.min(W - 8 - el._w, x)); y = Math.max(ust, Math.min(alt - el._h, y));
  const t = `translate(${Math.round(x)}px,${Math.round(y)}px)`; if (el._t !== t) { el._t = t; el.style.transform = t; }
}
function birimDetay(b) {
  const st = SIM.birimStat(b);
  pencere(kahDetayHTML({ id: b.h, ad: oyun.birimAd(b), s: b.s, st, esyalar: b.e || [], ek: `Ustalık Sv. ${oyun.ustaSv(b.h)}` }), false, 'kahraman'); yetVideoBagla();
}
// ── 3D tahtada dokunma ve sürükleme ──
(() => {
  const tv = $('tuval3d'), mac = $('mac');
  let bas = null;
  const aktif = () => uc3 && hz3.acik && aktifEkran === 'mac' && !perdeAcik();
  const dukkanUstu = (x, y) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('#mac .dukkanSerit')); };
  const gecerli = (kay, h) => { if (!h) return false; if (h.yer === kay.yer && h.i === kay.i) return true;
    const M = oyun.M; return !(h.yer === 'tahta' && kay.yer === 'yedek' && !M.tahta[h.i] && oyun.tahtaSay() >= oyun.yuva()); };
  const bitir = () => { if (!bas) return; S3.hazirlikSurukle(null); S3.hazirlikVurgu({ hedef: null }); mac.classList.remove('surSat'); hz3.sur = null; bas = null; hz3Esitle(); };
  tv.addEventListener('pointerdown', (e) => {
    if (!aktif()) return;
    if (!e.isPrimary || e.button > 0) { if (bas && bas.aktif) bitir(); bas = null; return; }   // ikinci parmak: yakınlaştırma
    const ref = S3.hazirlikSec(e.clientX, e.clientY);
    bas = { id: e.pointerId, x: e.clientX, y: e.clientY, ref, kay: ref ? hz3.refYer.get(ref) : null, hucre: ref ? null : S3.hazirlikHucre(e.clientX, e.clientY), aktif: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!bas || e.pointerId !== bas.id || !aktif()) return;
    if (!bas.aktif) {
      if (!bas.ref || !bas.kay || oyun.kaynasMod || oyun.seciliEsya !== null) return;
      if ((e.clientX - bas.x) ** 2 + (e.clientY - bas.y) ** 2 < 100) return;   // 10 px eşik
      bas.aktif = true; hz3.sur = bas.ref; if (oyun.secili) { oyun.secili = null; macCiz(); }
      S3.hazirlikVurgu({ acik: true });
    }
    S3.hazirlikSurukle(bas.ref, e.clientX, e.clientY);
    const sat = dukkanUstu(e.clientX, e.clientY), h = sat ? null : S3.hazirlikHucre(e.clientX, e.clientY);
    S3.hazirlikVurgu({ hedef: h, gecerli: gecerli(bas.kay, h) }); mac.classList.toggle('surSat', sat);
  });
  const birak = (e) => {
    if (!bas || e.pointerId !== bas.id) return;
    const b = bas;
    if (!aktif()) { bitir(); return; }
    if (b.aktif) {
      const sat = dukkanUstu(e.clientX, e.clientY), h = sat ? null : S3.hazirlikHucre(e.clientX, e.clientY); bitir(); hz3.surBitti = performance.now();
      if (sat) { oyun.secili = { ...b.kay }; oyun.kaynasMod = false; oyun.sat(); return; }
      if (!h || (h.yer === b.kay.yer && h.i === b.kay.i)) return;
      oyun.secili = null; oyun.kaynasMod = false; oyun.seciliEsya = null; oyun.yuvaDokun(b.kay.yer, b.kay.i); oyun.yuvaDokun(h.yer, h.i); return;
    }
    bas = null;
    // dokunuş: kahraman → seç / taşı / kaynaştır / eşya tak (yuvaDokun); boş hücre → seçili kahramanı oraya taşı; boşluk → seçimi bırak
    if (b.ref && b.kay) return oyun.yuvaDokun(b.kay.yer, b.kay.i);
    if (b.hucre && (oyun.secili || oyun.seciliEsya !== null)) return oyun.yuvaDokun(b.hucre.yer, b.hucre.i);
    if (oyun.secili || oyun.kaynasMod || oyun.seciliEsya !== null) { oyun.secili = null; oyun.kaynasMod = false; oyun.seciliEsya = null; macCiz(); }
  };
  window.addEventListener('pointerup', birak);
  window.addEventListener('pointercancel', (e) => { if (bas && e.pointerId === bas.id) bitir(); });
  // eşya rafından kahramana sürükle (dokun-dokun da çalışır: esyaSec → kahramana dokun)
  let es = null;
  mac.addEventListener('pointerdown', (e) => {
    if (!aktif() || !e.isPrimary || e.button > 0) return; const r = e.target.closest('#esyaRaf .re[data-r]'); if (!r) return;
    es = { id: e.pointerId, r: +r.dataset.r, x: e.clientX, y: e.clientY, aktif: false, el: null, img: r.querySelector('img') };
  });
  window.addEventListener('pointermove', (e) => {
    if (!es || e.pointerId !== es.id) return;
    if (!es.aktif) { if ((e.clientX - es.x) ** 2 + (e.clientY - es.y) ** 2 < 100) return; es.aktif = true;
      const g = document.createElement('div'); g.className = 'surHayalet esyaHayalet'; if (es.img) g.appendChild(es.img.cloneNode()); document.body.appendChild(g); es.el = g; }
    es.el.style.transform = `translate(${e.clientX - 24}px,${e.clientY - 40}px)`;
    const ref = S3.hazirlikSec(e.clientX, e.clientY); S3.hazirlikVurgu({ kaynas: ref ? [ref] : null, acik: true });
  });
  const esBirak = (e) => {
    if (!es || e.pointerId !== es.id) return; const s = es; es = null; if (!s.aktif) return;
    s.el.remove(); hz3.surBitti = performance.now();
    const ref = S3.hazirlikSec(e.clientX, e.clientY), yer = ref && hz3.refYer.get(ref);
    if (yer && oyun.M.esyaRaf[s.r]) { oyun.secili = null; oyun.kaynasMod = false; oyun.seciliEsya = null; oyun.esyaSec(s.r); oyun.yuvaDokun(yer.yer, yer.i); }
    else { const d = document.elementFromPoint(e.clientX, e.clientY), r2 = d && d.closest('#esyaRaf .re[data-r]');
      if (r2 && +r2.dataset.r !== s.r) { oyun.seciliEsya = null; oyun.esyaSec(s.r); oyun.esyaSec(+r2.dataset.r); } else hz3Esitle(); }
  };
  window.addEventListener('pointerup', esBirak);
  window.addEventListener('pointercancel', (e) => { if (es && e.pointerId === es.id) { if (es.el) es.el.remove(); es = null; hz3Esitle(); } });
  // sürükleme sonrası tarayıcının yolladığı tıklama (raf düğmesi) seçimi değiştirmesin
  mac.addEventListener('click', (e) => { if (performance.now() - hz3.surBitti < 250 && e.target.closest('#esyaRaf')) { e.stopPropagation(); e.preventDefault(); } }, true);
})();

// ── SAVAŞ ──
let sahneHazir = null, savasDongu = false, savasBilgi = null, sonHud = 0, hizSecim = 1, duraklat = false, kutSecim = false;
const ayarOku = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const hafif = ayarOku('kut.hafif') === '1';
async function sahneyiHazirla() {
  if (!sahneHazir) sahneHazir = S3.hazirla($('tuval3d'), $('kaplama'), '', { hafif });
  return sahneHazir;
}
// savaş öncesi yükleme: açılış ekranıyla aynı görünüm (logo, gerçek model ilerlemesi, ipuçları)
function savasYukAc() { const y = $('yukleniyor'); y.innerHTML = yukIcerik(); const g = yukGosterge(y); g.basla(); y.classList.add('acik'); return g; }
async function savasBaslat(sim, rakip) {
  savasBilgi = { sim, rakip, alamet: D.ALAMETLER.find(a => a.id === (oyun._savas ? oyun._savas.alamet : oyun.M ? oyun.M.alamet : 'yok')) || D.ALAMETLER[0], bitti: false };
  const h3 = uc3 && aktifEkran === 'mac' && hz3.acik;   // 3D hazırlıktan: yükleme ekranı yok, aynı sahnede rakip iner
  if (h3) hz3Kapat(true);
  bitisTemizle(); goster('savas'); $('sonucYer').innerHTML = ''; $('ayakta').style.display = ''; $('savas').classList.remove('bitti');
  const yg = h3 ? { yuzde() {}, dur() {} } : savasYukAc();
  S3.yukleme.olay = (n, top) => { yg.yuzde(0.1 + 0.8 * n / Math.max(1, top), `Kahramanlar yükleniyor… ${n}/${top}`); };
  try {
    if (vitrin) await vitrin.bekle();   // karşılamadaki vitrin kurulumu sürüyorsa bitsin (iki kurulum üst üste binmesin)
    await sahneyiHazirla(); sonDurum = { t: 0 }; kutCiz(); hudCiz(); S3.boyutla();   // Kut alanı ve ayakta paneli kadrajdan önce çizilsin (tahta kadrajı yerlerini hesaba katar)
    yg.yuzde(0.92, 'Arena kuruluyor…');
    await S3.savasKur(sim, '', { yerinde: h3 });
  } catch (e) {
    console.error(e); sahneHazir = null;
    yg.dur(); if (h3) savasYukAc().dur();
    q('#yukleniyor .orta').innerHTML = `<div class="durum" style="font-size:22px;color:#ffe48a">Arena yüklenemedi</div><div class="hataYaz">${String(e && e.message || e).replace(/</g, '&lt;')}</div><button class="btn altin" id="yGeri" style="min-height:52px;padding:0 24px;margin-top:10px">Dükkâna dön</button>`;
    $('yGeri').onclick = () => { $('yukleniyor').classList.remove('acik'); goster('mac'); macCiz(); };
    return;
  }
  yg.yuzde(1, 'Hazır!'); yg.dur();
  $('yukleniyor').classList.remove('acik');
  kutCiz(); hizUygula(); kutSecim = false;
  Ses.muzikCal('savas'); savasGirisGoster();   // savas_basla sesi SAVAŞ! bandındaki kılıç çarpışmasında çalar
  const s = $('savas');
  q('.rakipK', s).innerHTML = `<div class="amb"><img src="${P((rakip.takim || [])[0] ? rakip.takim[0].h : 'tilki')}" alt=""></div><div style="min-width:0"><small>${rakip.duello ? 'Düello' : 'Rakip · Tur ' + oyun.turAd()}</small><b>${rakip.ad}</b><span>${rakip.kaynak === 'bot' ? 'Bot' : 'Kupa ' + sayi(rakip.kupa || 0)}</span></div>`;
  const a = savasBilgi.alamet; q('.alametK', s).innerHTML = `<span class="ay resim" style="${alametArka(a.id)}">${alametIc(a.id)}</span><div><b>${a.ad}</b><span>${a.m}</span></div>`;
  const alK = q('.alametK', s); alK.classList.remove('acik'); alK.title = a.ad + ': ' + a.m; alK.onclick = () => alK.classList.toggle('acik');   // açıklama dokununca
  if (!savasDongu) { savasDongu = true; requestAnimationFrame(savasKare); }
}
function hizUygula() { S3.hiz(duraklat ? 0 : hizSecim); document.querySelectorAll('#savas .hizlar .btn').forEach((b, i) => { b.classList.toggle('secik', i + 1 === hizSecim); b.classList.toggle('altin', i + 1 === hizSecim); b.classList.toggle('mor', i + 1 !== hizSecim); }); q('#savas .duraklat .btn').innerHTML = mik(duraklat ? 'oynat' : 'duraklat'); }
document.querySelectorAll('#savas .hizlar .btn').forEach((b, i) => b.onclick = () => { hizSecim = i + 1; duraklat = false; hizUygula(); });
q('#savas .duraklat .btn').onclick = () => { duraklat = !duraklat; hizUygula(); };
// Sonuca geç: motor savaşı bitirir, görüntü sona sarılır; sonuç bandı bir sonraki karede her zamanki yoldan açılır
q('#savas .sonaGec').onclick = () => { if (!savasBilgi || savasBilgi.bitti) return; kutSecim = false; if (S3.sonaSar()) { duraklat = false; hizUygula(); } };
// Kut düğmesi: kalan hak sayacı (Çifte Kut ve Son İki'de 2; Kut Mirası bir hak geri verir), Kut Sessizliği'nde kapalı
function kutCiz(kullanan) {
  const sim = savasBilgi && savasBilgi.sim; if (!sim) return;
  const kalan = sim.kutKalanSay(0), hak = Math.max(1, sim.kutHakSay(0)), hazir = sim.kutVar(0);
  if (kullanan) savasBilgi.kutKullanan = kullanan;
  savasBilgi.kutCizilen = kalan;
  const son = savasBilgi.kutKullanan;
  $('kutAlan').innerHTML = sim.kutYok
    ? `<div class="kutBant bitti"><b>Kut Sessizliği</b><span class="satir">Bu tur Kut yok</span><span class="satir">Herkes savaşa %25 mana ile başladı</span></div>
       <div class="kut bitti"><span class="sayac">0/0</span></div>`
    : hazir
    ? `<div class="kutBant"><b>KUT HAZIR</b><span>Bir kahramanına dokun: manası dolsun, yeteneği <em>hemen açılsın</em>. ${hak > 1 ? `Savaşta ${hak} kez (arada 6 sn).` : 'Savaşta 1 kez.'} Eşyalı kahramana verilen Kut <em>yankı</em> yapar.</span></div>
       <button class="kut ${kutSecim ? 'secim' : ''}" aria-label="Kut" id="kutDugme"><div class="isin"></div><div class="yz"><big>KUT</big><small>${kalan}/${hak}</small></div><div class="el">${ik('el')}</div></button>`
    : `<div class="kutBant bitti"><b>Kut kullanıldı</b><span class="satir"><em>${son ? oyun.birimAd(son.b) : ''}</em></span><span class="satir">Sonraki savaşta yenilenir</span></div>
       <div class="kut bitti"><div class="kullanan">${son ? `<img src="${P(son.b.h)}" alt="">` : ''}</div><span class="sayac">0/${hak}</span><div class="onay">${ik('onay')}</div></div>`;
  $('kutParlama').style.background = hazir ? '' : 'none';
  if ($('kutDugme')) $('kutDugme').onclick = () => { if (!sim.kutHazir(0)) return bildir('İkinci Kut için 4 sn bekle'); kutSecim = !kutSecim; kutCiz(); bildir('Kut için kendi kahramanına dokun'); };
}
// 3D tahta kadrajı: savaş arayüzünün kapladığı kenarlar (tuval px = ekran px; tuval ölçeklenmez). Tahta kalan alanda büyük ve ortada durur.
S3.guvenliAlan((w, h) => {
  if (uc3 && $('mac').classList.contains('aktif')) return hz3Guvenli(w, h);
  const s = $('savas'); if (!s.classList.contains('aktif')) return null;
  const kr = (sel) => { const e = q(sel, s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? r : null; };
  const skor = kr('.savasUst .skor'), dur = kr('.duraklat'), hiz = kr('.hizlar');
  const p = { ust: skor ? skor.bottom + 6 : 0, alt: 6, sol: dur ? dur.right + 8 : 0, sag: 0 };
  if (hiz && hiz.height > hiz.width) p.sag = w - hiz.left + 8;   // dikey hız sütunu (tablet); telefonda yatay sıra sağ üstte, tahtanın dışında
  p.sag = Math.max(p.sag, p.sol); p.sol = p.sag;   // tahta yatayda ortada kalsın
  // köşe engelleri: Kut düğmesi (daire), Kut bandı ve sol alttaki ayakta paneli; tahta kenarı bunlara binmesin (sahne3d gerekirse tahtayı küçültür)
  const m = 4, kutE = kr('.kutAlan .kut'), bant = kr('.kutAlan .kutBant'), ay = kr('.ayakta');
  p.engel = [];
  if (kutE) p.engel.push({ cx: (kutE.left + kutE.right) / 2, cy: (kutE.top + kutE.bottom) / 2, r: Math.min(kutE.width, kutE.height) / 2 + m });
  for (const r of [bant, ay]) if (r) p.engel.push({ x0: r.left - m, y0: r.top - m, x1: r.right + m, y1: r.bottom + m });
  return p;
});
$('tuval3d').addEventListener('pointerdown', (e) => {
  if (!savasBilgi || savasBilgi.bitti) return;
  const r = $('tuval3d').getBoundingClientRect(); const u = S3.dokun(e.clientX - r.left, e.clientY - r.top);
  if (u) { kutSecim = false; kutCiz(u); }
});
// birimin kademesi (çerçeve rengi .k1–.k5); canavar ya da bilinmeyen birimde 0 (nötr)
function kademeAl(o) { try { return o && (kh(o.b.h) || {}).kademe || 0; } catch (e) { return 0; } }
function hudCiz() {
  const sim = savasBilgi.sim, t = Math.max(0, K.savasSuresi - sonDurum.t);
  // Kut motorda kullanıldıysa (dokunuş ya da başka yol) düğmeyi kullanıldı durumuna getir
  // Kut motorda kullanıldıysa ya da hak geri geldiyse (Kut Mirası) düğmeyi yeniden çiz
  if (sim.kutKalanSay(0) !== savasBilgi.kutCizilen) { const kay = (oyun._savas && oyun._savas.kayit || []).filter(k => k.taraf === 0).pop(); const u = kay ? sim.birimler.find(o => o.taraf === 0 && o.i === kay.i) : null; kutSecim = false; kutCiz(u || savasBilgi.kutKullanan || { b: { h: 'golem' } }); }
  const oran = (tr) => { const l = sim.birimler.filter(o => o.taraf === tr); return Math.round(100 * l.reduce((s, o) => s + Math.max(0, o.hp), 0) / Math.max(1, l.reduce((s, o) => s + o.mx, 0))); };
  const a = oran(0), b = oran(1), s = $('savas');
  // Gün Batımı (yalnız Arena): görünen saniyeye göre çarpan
  const gbT = sonDurum.t - (sim.gunBatimiBasla != null ? sim.gunBatimiBasla : K.gunBatimi.basla) + 1e-9, gbH = oyun.seviyeli() && !savasBilgi.rakip.duello && gbT >= 0 ? `<span class="gunBatimi">Gün Batımı ×${(1 + K.gunBatimi.artis * Math.floor(gbT)).toFixed(1).replace('.', ',')}</span>` : '';
  // skor şeridi bir kez kurulur, sonra yalnız genişlik/metin güncellenir (gecikmeli hasar izi CSS geçişiyle akar)
  const sk = q('.skor', s), son10 = Math.ceil(t) <= 10 && !savasBilgi.bitti;
  if (sk._sim !== sim) {
    sk._sim = sim; sk._html = null;
    const lider = (tr) => sim.birimler.filter(o => o.taraf === tr).sort((x, y) => (y.b.s || 1) - (x.b.s || 1))[0];
    const tar = (tr, ad) => { const o = lider(tr); return `<div class="taraf ${tr ? 'sag dus' : 'biz'}"><div class="tpor k${kademeAl(o)}">${o ? `<img src="${P(o.b.h)}" alt="">` : ''}</div>
      <div class="tic"><div class="ust"><span>${ad}</span><em class="say"></em><b></b></div><div class="takimCan"><s class="iz"></s><i></i><u></u></div></div></div>`; };
    sk.innerHTML = tar(0, 'Sen') + `<div class="saat"><b></b><small>kalan</small><span class="gunBatimi" hidden></span></div>` + tar(1, 'Rakip');
  }
  const tY = (tr, y) => { const e = sk.querySelectorAll('.taraf')[tr], l = sim.birimler.filter(o => o.taraf === tr);
    q('.ust b', e).textContent = '%' + y; q('.say', e).textContent = `${l.filter(o => !o.olu).length}/${l.length}`;
    const w = y + '%'; if (q('.takimCan i', e).style.width !== w) { q('.takimCan i', e).style.width = w; q('.takimCan .iz', e).style.width = w; e.classList.remove('vur'); void e.offsetWidth; e.classList.add('vur'); } };
  tY(0, a); tY(1, b);
  const sa = q('.saat', sk); sa.classList.toggle('son10', son10); q('b', sa).textContent = '0:' + String(Math.ceil(t)).padStart(2, '0');
  const gb = q('.gunBatimi', sa), gbY = gbH ? gbH.replace(/<[^>]+>/g, '').replace('Gün Batımı ', '') : '';
  gb.hidden = !gbY; if (gb.textContent !== gbY) { gb.textContent = gbY; gb.title = gbY ? 'Gün Batımı: hasar çarpanı ' + gbY : ''; }
  const ayk = (ad, cls, tr) => { const l = sim.birimler.filter(o => o.taraf === tr); return `<div class="s ${cls}"><span>${ad}</span>${l.map(o => `<div class="bas k${kademeAl(o)} ${o.olu ? 'olu' : ''}"><img src="${P(o.b.h)}" alt=""></div>`).join('')}<em>${l.filter(o => !o.olu).length}/${l.length}</em></div>`; };
  hudYaz($('ayakta'), ayk('Sen', 'biz', 0) + ayk('Rakip', 'dus', 1));
}
// HUD yalnız içerik değişince yeniden kurulur (aynı innerHTML her 120 ms'de portreleri ve yerleşimi baştan kurduruyordu)
function hudYaz(el, html) { if (el && el._html !== html) { el._html = html; el.innerHTML = html; } }
let sonDurum = { t: 0 };
function savasKare() {
  if (aktifEkran !== 'savas' || !savasBilgi) { savasDongu = false; return; }
  sonDurum = S3.kare();
  const simdi = performance.now(); if (simdi - sonHud > 120) { sonHud = simdi; hudCiz(); }
  if (sonDurum.bitti && !savasBilgi.bitti) { savasBilgi.bitti = true; sonucGoster(sonDurum.sonuc); }
  requestAnimationFrame(savasKare);
}
function sonucGoster(sonuc) {
  const k = sonuc.kazanan, sd = k === -2;   // sd: süre doldu, iki taraf da kaybetti (yenilgi tonu)
  Ses.muzikCal('hazirlik');
  const r = oyun.savasBitti(sonuc); savasBilgi.sonucIslem = r;
  if (r && r.hasar > 0 && (k === 1 || sd) && S3.hasarKivilcim) S3.hasarKivilcim(1);   // rakibin sağ birimlerinden oyuncuya can hasarı ışıkları
  const M = oyun.M, zh = K.hizli.zaferHedef, arena = r && !r.duello && (r.bitti ? r.mod !== 'hizli' : oyun.seviyeli());
  // sonuç özeti: yalnız motorun döndürdüğü veriden chip'ler (tür: iyi / kotu / altin / notr)
  const ist = S3.istatistik ? S3.istatistik() : [], mvpO = mvpSec(ist), cl = [], cip = (tur, m, ikon) => cl.push(`<span class="cip ${tur}">${ikon ? ik(ikon) : ''}${m}</span>`);
  if (sd) cip('kotu', 'Süre doldu — iki taraf da kaybetti');
  if (r && r.duello) cip('notr', 'Düello', 'zincir');
  else if (arena) {
    if (r.hasar) { cip('kotu', `−${r.hasar} can`); cip('notr', `${r.can} can kaldı`); }
    else cip(k === 0 ? 'iyi' : 'notr', k === 0 ? `Kazandın · ${r.can} can` : `Can gitmedi · ${r.can} can`);
    if (r.ganimet) cip('altin', `+${r.ganimet} altın`);
    if (r.esya && r.esya.length) cip('iyi', r.esya.map(id => D.esya(id).ad).join(', '));
    if (r.kahraman && r.kahraman.length) cip('iyi', r.kahraman.map(b => oyun.birimAd(b)).join(', '));
    if (r.secim) cip('altin', 'Ganimet seçimi bekliyor');
    if (r.lobi) { cip('notr', `Lobi ${r.lobi.yasayan}/8 ayakta · sıran ${r.bitti ? r.sira : r.lobi.sira}`); if (r.lobi.elenen.length) cip('kotu', 'Elenen: ' + r.lobi.elenen.join(', ')); }
  } else if (k === 0) cip('iyi', `+1 zafer · ${r.bitti ? r.zafer : M.zafer}/${zh}`);
  else if (k === 1 || sd) { cip('kotu', '−1 can'); cip('notr', `${r.bitti ? 0 : M.can} can kaldı`); }
  else cip('notr', 'Berabere: can gitmedi');
  if (mvpO) cip('mvp', `Yıldız: ${oyun.birimAd(mvpO.b)}`, 'tac');
  const bil = cl.join('');
  $('ayakta').style.display = 'none'; $('savas').classList.add('bitti');   // sonuçta Kut, hız ve duraklat gizlenir
  const kt = k === 0 ? 0 : k === 1 || sd ? 1 : 2;
  // sonuç bandı: Maçın Yıldızı sinematiği oynarsa o kapanınca (kamera kadraja dönerken), yoksa hemen
  const bantAc = () => {
  const yer = $('sonucYer'), mv = $('mvp');
  sonucAnimBaslat(kt);   // zafer/yenilgi sesi animasyonun çarpışma anında
  yer.innerHTML = `<div class="sonucPerde ${['zafer', 'yenilgi', 'berabere'][kt]}" aria-hidden="true"><div class="spIsin"></div><div class="spPatla"></div></div><div class="sonucBant ${['zafer', 'yenilgi', 'berabere'][kt]}">${sonucBaslikHTML(kt)}<div class="sAyrac" aria-hidden="true"><i></i><span></span><i></i></div><div class="bil">${bil}</div><div class="sDugmeler"><button class="btn mor" id="sOzet" aria-expanded="false">${ik('kilic')} Hasar özeti</button><button class="btn altin bekle" id="sDevam"><span>Devam</span>${ik('oyna')}</button></div></div><div class="pn hasarOzet" id="hasarOzet" hidden></div>`;
  bitisSonra(azHareket() ? 300 : 1100, () => { if ($('sDevam')) $('sDevam').classList.remove('bekle'); });   // başlık indikten sonra
  if (mv) yer.appendChild(mv);   // kapanmakta olan yıldız katmanı solarak bitsin
  hasarOzetKur(ist);
  $('sDevam').onclick = async () => {
    bitisTemizle(); S3.temizle(); savasBilgi = null;
    if (r && r.duello) { anaCiz(); goster('ana'); return; }
    if (r && r.bitti) { sonCiz(r); goster('son'); return; }
    await oyun.turBaslat(false); goster('mac'); macCiz();
  };
  };
  // Maçın Yıldızı "Selam": yalnız zaferde, son öldürmenin ağır çekiminden hemen sonra (yenilgide ve "Animasyonları azalt"ta yok; yıldız bantta çip olarak yazar)
  const sinema = k === 0 && mvpAc(mvpO, bantAc);
  if (k === 0) S3.zafer(0, sinema ? { haric: mvpO.uid, sade: true } : undefined); else if (k === 1) S3.zafer(1);
  if (!sinema) bantAc();
}

// Savaş sonu hasar özeti: sonuç bandının yanında açılır panel (Takımın / Rakip sekmeleri)
function hasarOzetKur(liste) {
  const pan = $('hasarOzet'), dug = $('sOzet'); if (!pan || !dug) return;
  if (!liste.length) { dug.style.display = 'none'; return; }
  let sekme = 0;
  const ol = Math.max(1, ...liste.map(o => Math.max(o.verilen, o.alinan, o.iyi + o.kalkan)));   // iki takım için ortak ölçek
  const cubuk = (cls, n, ad) => `<div class="c ${cls}"><i style="width:${n > 0 ? Math.max(2, 100 * n / ol).toFixed(1) : 0}%"></i><span>${sayi(Math.round(n))}</span><em>${ad}</em></div>`;
  const ciz = () => {
    const l = liste.filter(o => o.taraf === sekme), enCok = l.reduce((m, o) => (!m || o.verilen > m.verilen ? o : m), null);
    const top = (a) => sayi(Math.round(l.reduce((s, o) => s + a(o), 0)));
    pan.innerHTML = `<div class="ust"><b>Hasar özeti</b><button class="btn mor kapat" aria-label="Kapat">✕</button></div>
      <div class="sekmeler" role="tablist">${['Takımın', 'Rakip'].map((ad, i) => `<button role="tab" class="${i === sekme ? 'on' : ''}" aria-selected="${i === sekme}">${ad}</button>`).join('')}</div>
      <div class="lejant"><span class="v">Verilen</span><span class="a">Alınan</span><span class="i">İyileştirme</span></div>
      <div class="satirlar">${l.map(o => `<div class="sr ${o.olu ? 'olu' : ''} ${o === enCok && o.verilen > 0 ? 'mvp' : ''}">
        <div class="por ${sekme ? 'dus' : 'biz'}"><img src="${P(o.b.h)}" alt="">${o === enCok && o.verilen > 0 ? `<span class="tac">${ik('tac')}</span>` : ''}</div>
        <div class="vb"><div class="ad"><b>${oyun.birimAd(o.b)}</b><small>${'★'.repeat(o.b.s || 1)}</small></div>
          ${cubuk('v', o.verilen, 'verilen')}${cubuk('a', o.alinan, 'alınan')}${cubuk('i', o.iyi + o.kalkan, o.kalkan > 0 ? `iyileştirme · ${sayi(Math.round(o.kalkan))} kalkan` : 'iyileştirme')}</div></div>`).join('')}</div>
      <div class="toplam">Toplam: <b>${top(o => o.verilen)}</b> verilen · <b>${top(o => o.alinan)}</b> alınan · <b>${top(o => o.iyi + o.kalkan)}</b> iyileştirme</div>`;
    pan.querySelectorAll('.sekmeler button').forEach((b, i) => b.onclick = () => { sekme = i; ciz(); });
    q('.kapat', pan).onclick = () => ac(false);
  };
  const ac = (v) => { pan.hidden = !v; dug.setAttribute('aria-expanded', String(v)); dug.classList.toggle('secik', v); if (v) ciz(); };
  dug.onclick = () => ac(pan.hidden);
}

// ── BİTİŞ ANİMASYONLARI (zamanlamalar: ANIMASYON_PLANI.md "Bitiş ekranları") ──
// Hepsi DOM/CSS (yalnız transform ve opaklık); her an için öğeler bir kez kurulur, kare başına nesne üretilmez.
// Animasyonları azalt: Ayarlar (kut.azHareket '1' açık / '0' kapalı) ya da yoksa işletim sisteminin "hareketi azalt" tercihi → <html class="azHareket">
const azMedya = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
function azHareket() { const v = ayarOku('kut.azHareket'); return v === '1' || (v !== '0' && !!(azMedya && azMedya.matches)); }
function azUygula() { document.documentElement.classList.toggle('azHareket', azHareket()); }
azUygula(); if (azMedya && azMedya.addEventListener) azMedya.addEventListener('change', azUygula);
// bitiş ekranının bekleyen zamanlayıcıları (Devam, yeni savaş ya da ekran değişince hepsi iptal)
let bitisZaman = [];
const bitisSonra = (ms, fn) => { const z = setTimeout(fn, ms); bitisZaman.push(z); return z; };
function bitisTemizle() { bitisZaman.forEach(clearTimeout); bitisZaman = []; mvpKapat(true); }
const kilicSvg = (c) => `<svg class="kilic ${c}" aria-hidden="true"><use href="#s-kilic"/></svg>`;
// kıvılcım patlaması: n çizgi, açıları ve uzaklıkları sabit dağılımlı (rastgele yok, her seferinde aynı)
function kivilcimHTML(n, renk) { let h = ''; for (let i = 0; i < n; i++) h += `<i style="--a:${Math.round(i * 360 / n + (i % 2 ? 9 : -7))}deg;--d:${58 + (i * 37 % 5) * 13}px;--g:${(i % 3) * 30}ms"></i>`; return `<div class="kivilcim" style="--kc:${renk}">${h}</div>`; }
function dumanHTML(n) { let h = ''; for (let i = 0; i < n; i++) h += `<i style="--x:${Math.round((i - (n - 1) / 2) * 34)}px;--y:${(i % 2) * 14 - 6}px;--g:${380 + i * 60}ms;--s:${1.4 + (i % 3) * 0.35}"></i>`; return `<div class="duman">${h}</div>`; }
// sonuç bandı başlığı + amblem. k: 0 zafer, 1 yenilgi, 2 berabere
function sonucBaslikHTML(k) {
  if (k === 0) return `<div class="sBas"><div class="sAmblem"><div class="isik"></div><div class="halka"></div>${kilicSvg('sol')}${kilicSvg('sag')}${kivilcimHTML(14, '#ffe48a')}<div class="flas"></div></div>
    <div class="sYazi"><b>ZAFER</b><span class="sParKap"><i class="sParilti"></i></span></div></div>`;
  if (k === 1) return `<div class="sBas"><div class="sAmblem"><div class="dusen">${kilicSvg('ust')}${kilicSvg('alt')}</div>${dumanHTML(6)}${kivilcimHTML(9, '#ffc0a8')}<div class="flas"></div></div>
    <div class="sYazi"><b data-y="YENİLGİ"><span>YENİLGİ</span><svg class="catlakCizgi" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,62 18,48 30,60 46,38 58,55 72,36 86,52 100,40"/></svg></b></div></div>`;
  return `<div class="sBas"><div class="sAmblem"><div class="halka"></div><svg class="kalkan sol" aria-hidden="true"><use href="#s-kalkan"/></svg><svg class="kalkan sag" aria-hidden="true"><use href="#s-kalkan"/></svg>${kivilcimHTML(12, '#a8e0ff')}<div class="flas"></div></div>
    <div class="sYazi"><b>BERABERE</b><span class="sParKap"><i class="sParilti"></i></span></div></div>`;
}
// çarpışma anı (sn): ses ve sarsıntı buraya hizalı; CSS gecikmeleri aynı sayılarla yazılı
const CARPISMA = { 0: 0.45, 1: 0.35, 2: 0.4 };
function sonucAnimBaslat(k) {
  const az = azHareket(), t = az ? 0 : CARPISMA[k] * 1000;
  bitisSonra(t, () => {
    Ses.cal(k === 1 ? 'yenilgi' : 'zafer', { hiz: k === 2 ? 0.9 : 1 });
    if (!az && S3.sarsinti) S3.sarsinti(k === 1 ? 0.18 : 0.26, 0.3);
  });
}
// SAVAŞ! geçişi: hazırlıktan savaşa 0,8 sn; küçük kılıç çarpışması 0,3 sn'de (savas_basla sesi o an)
function savasGirisGoster() {
  const s = $('savas'), eski = $('savasGiris'); if (eski) eski.remove();
  const az = azHareket();
  s.insertAdjacentHTML('beforeend', `<div class="savasGiris" id="savasGiris" aria-hidden="true"><div class="sgBant"></div><div class="sgAmblem"><div class="halka"></div>${kilicSvg('sol')}${kilicSvg('sag')}${kivilcimHTML(10, '#fff0b0')}</div><b>SAVAŞ!</b></div>`);
  bitisSonra(az ? 0 : 300, () => Ses.cal('savas_basla'));
  bitisSonra(az ? 700 : 900, () => { const e = $('savasGiris'); if (e) e.remove(); });
}
// ── MAÇIN YILDIZI ──
// Kendi takımında en çok hasar veren; eşitse en çok iyileştirme + kalkan (emme). Hiç katkı yoksa gösterilmez.
function mvpSec(liste) {
  let en = null;
  for (const o of liste) if (o.taraf === 0 && (!en || o.verilen > en.verilen || (o.verilen === en.verilen && o.iyi + o.kalkan > en.iyi + en.kalkan))) en = o;
  return en && (en.verilen > 0 || en.iyi + en.kalkan > 0) ? en : null;
}
let mvpDurum = null;
const MVP_SURE = 3900;   // otomatik geçiş (ms; dokununca hemen); test KUT_TEST.mvpSure ile uzatabilir
// Dönen: sinematik başladıysa true. sonra: kapanınca (dokunuş ya da süre) çağrılır (sonuç bandı)
function mvpAc(o, sonra = null) {
  const yer = $('sonucYer'); if (!savasBilgi || mvpDurum || !yer || !o) return false;
  if (ogr.adim >= 0 || perdeAcik() || azHareket()) return false;   // öğretici / pencere varken ya da hareket azaltılmışsa yok
  if (!S3.mvpGoster || !S3.mvpGoster(o.uid)) return false;
  // istatistikler: yalnız hasar özetinin verisinden (sahne3d istatistik); takım payı aynı verinin oranı
  const liste = S3.istatistik ? S3.istatistik() : [], takim = liste.filter(x => x.taraf === 0).reduce((t, x) => t + x.verilen, 0);
  const pay = takim > 0 ? Math.round(100 * o.verilen / takim) : 0, destek = o.iyi + o.kalkan;
  const ist = [`<div><b id="mvpHasar">0</b><span>hasar</span></div>`];
  if (pay > 0) ist.push(`<div><b>%${pay}</b><span>takım hasarı</span></div>`);
  if (destek > 0) ist.push(`<div><b>${sayi(Math.round(destek))}</b><span>${o.kalkan > o.iyi ? 'kalkan' : 'iyileştirme'}</span></div>`);
  else if (o.alinan > 0) ist.push(`<div><b>${sayi(Math.round(o.alinan))}</b><span>alınan hasar</span></div>`);
  yer.insertAdjacentHTML('beforeend', `<div class="yildizEkran" id="mvp" role="dialog" aria-label="Maçın yıldızı: ${oyun.birimAd(o.b)}">
    <i class="mvpSerit ust" aria-hidden="true"></i><i class="mvpSerit alt" aria-hidden="true"></i>
    <div class="mvpYazi"><small class="mvpEtiket">MAÇIN YILDIZI</small><b class="mvpAd">${oyun.birimAd(o.b)}</b><i class="mvpCizgi" aria-hidden="true"></i>
      <div class="mvpIst">${ist.join('')}</div></div>
    <div class="mvpIpucu">Geçmek için dokun</div></div>`);
  const el = $('mvp'); $('savas').classList.add('mvpAcik');
  mvpDurum = { el, raf: 0, z: [], sonra };
  // hasar sayacı: 2,3 sn'de başlar, 0,6 sn ease-out-kuartik; DOM yalnız sayı değişince yazılır
  const hedef = Math.round(o.verilen), sayEl = $('mvpHasar'), bas = performance.now() + 2300, sure = 600; let son = -1;
  const say = (t) => { if (!mvpDurum || mvpDurum.el !== el) return; const e = Math.max(0, Math.min(1, (t - bas) / sure)), v = Math.round(hedef * (1 - (1 - e) ** 4));
    if (v !== son) { son = v; sayEl.textContent = sayi(v); } if (e < 1) mvpDurum.raf = requestAnimationFrame(say); };
  mvpDurum.raf = requestAnimationFrame(say);
  el.addEventListener('pointerdown', () => mvpKapat(false));
  mvpDurum.z.push(setTimeout(() => mvpKapat(false), (window.KUT_TEST && KUT_TEST.mvpSure) || MVP_SURE));
  return true;
}
// anlik: ekran değişiyor (bant açılmaz); değilse kamera kadraja döner, yazı ve şeritler solar, sonuç bandı gelir
function mvpKapat(anlik) {
  const m = mvpDurum; if (!m) return; mvpDurum = null;
  cancelAnimationFrame(m.raf); m.z.forEach(clearTimeout); $('savas').classList.remove('mvpAcik');
  if (S3.mvpBitir) S3.mvpBitir(anlik || azHareket());
  if (anlik) { m.el.remove(); return; }
  m.el.classList.add('kapan'); setTimeout(() => m.el.remove(), 460);
  if (m.sonra) m.sonra();
}
// ── MAÇ SONU töreni: sıraya göre taç (1.), gümüş/bronz kupa (2.–3.), kalkan (4.+ ya da elenme) ──
function torenAmblem(sira) {
  return sira === 1 ? { svg: '<use href="#s-tac"/>', cls: 'tac', ad: 'BİRİNCİ' }
    : sira === 2 ? { svg: '<use href="#s-kupa"/>', cls: 'kupa gumus', ad: 'İKİNCİ' }
    : sira === 3 ? { svg: '<use href="#s-kupa"/>', cls: 'kupa bronz', ad: 'ÜÇÜNCÜ' }
    : { svg: '<use href="#s-kalkan"/>', cls: 'kalkan', ad: sira ? 'SIRA' : 'MAÇ BİTTİ' };
}
function torenGoster(sira) {
  const son = $('son'), eski = $('sonToren'); if (eski) eski.remove();
  const a = torenAmblem(sira), az = azHareket();
  son.classList.remove('torenBitti'); son.classList.add('toren');
  son.insertAdjacentHTML('beforeend', `<div class="sonToren s${Math.min(sira || 9, 4)}" id="sonToren" aria-hidden="true"><div class="trIsin"></div><div class="halka"></div>
    <svg class="trAmb ${a.cls}"><use href="${a.svg.match(/#[^"]+/)[0]}"/></svg>${sira && sira <= 3 ? kivilcimHTML(14, sira === 1 ? '#ffe48a' : sira === 2 ? '#e8f0ff' : '#ffc89a') : ''}
    <div class="trYazi">${sira ? `<b>${sira}.</b>` : ''}<span>${a.ad}</span></div></div>`);
  const bitir = () => { const e = $('sonToren'); son.classList.add('torenBitti'); son.classList.remove('toren'); if (e) { e.classList.add('kapan'); setTimeout(() => e.remove(), 400); } };
  bitisSonra(az ? 600 : 1900, bitir);
  $('sonToren').addEventListener('pointerdown', bitir);
  // şerit madalyonları: sol = sıra amblemi
  if (!q('#sonSerit .mad.l')) $('sonSerit').insertAdjacentHTML('afterbegin', '<span class="mad l"></span>');
  const l = q('#sonSerit .mad.l'); if (l) l.innerHTML = `<svg class="ik trMini ${a.cls}"><use href="${a.svg.match(/#[^"]+/)[0]}"/></svg>`;
}

// ── MAÇ SONU ──
function sonCiz(r) {
  bitisTemizle();
  const kayip = !r.kazandi, sr = $('sonSerit');
  sr.classList.toggle('kayip', kayip);
  const arena = r.mod !== 'hizli';
  sr.innerHTML = r.siralama && kayip ? `<b>${r.sira}. SIRA</b><span>${r.turAd} turunda elendin · ${r.zafer} zafer · ${r.gecmis.length} tur${r.sira <= 3 ? ' · kürsüdesin' : ' · iyi dövüştün'}</span>`
    : kayip ? `<b>MAÇ BİTTİ</b><span>${arena ? `${r.turAd} turunda elendin · ` : ''}${r.zafer} zafer · ${r.gecmis.length} tur · iyi dövüştün</span>`
    : `<span class="mad l">${ik('yildiz')}</span><b>ZAFER!</b><span>Arena senin · ${arena ? `${r.can} can kaldı` : `${r.zafer} zafer`}</span><span class="mad r">${ik('yildiz')}</span>`;
  q('#son .isinlar').style.display = kayip ? 'none' : '';
  const g = r.gecmis.filter(x => x === 0).length, kb = r.gecmis.filter(x => x === 1 || x === -2).length;
  $('ozet').innerHTML = `<div><b style="color:#8dffb0">${g}</b><span>zafer</span></div><div><b style="color:#ff8aa0">${arena ? r.can : Math.max(0, K.hizli.can - kb)}</b><span>can kaldı</span></div><div><b>${r.gecmis.length}</b><span>tur</span></div>`;
  $('turSay').textContent = `${g} kazanıldı · ${kb} kaybedildi`;
  $('turlar').innerHTML = r.gecmis.map((t, i) => `<div class="tr ${t === 0 ? 'g' : t === 1 || t === -2 ? 'k' : ''}"><small>Tur</small>${i + 1}</div>`).join('');
  const once = r.kupa - r.fark;
  $('kupaSayi').innerHTML = `<s>${sayi(once)} →</s>${sayi(r.kupa)}`; $('kupaArt').textContent = (r.fark >= 0 ? '+' : '') + r.fark;
  const lig = 200 - (r.kupa % 200); q('#son .lig').innerHTML = `Sonraki lige ${lig} kupa kaldı<div class="takimCan"><i style="width:${100 - lig / 2}%;background:linear-gradient(180deg,#ffe48a,#d98e14)"></i></div>`;
  const yildizB = r.takim.slice().sort((a, b) => kh(b.h).kademe * b.s - kh(a.h).kademe * a.s)[0];
  q('#son .ustaD').innerHTML = `<img src="${P(yildizB.h)}" alt=""><span><b>${kh(yildizB.h).ad} Sv.${oyun.ustaSv(yildizB.h)}</b> · ustalık ilerliyor</span>`;
  $('sonTakim').innerHTML = r.takim.map(b => `<div class="m k${kh(b.h).kademe} ${b.f ? 'kaynas' : ''}"><img src="${P(b.h)}" alt="">${b.f ? mad(b.f) : ''}${yildiz(b.s)}</div>`).join('');
  q('#son .yildizMac').innerHTML = `${ik('yildiz')}<div><small>Takımın yıldızı</small><b>${oyun.birimAd(yildizB)}</b><span>${D.YETENEK[kh(yildizB.h).yetenek].ad} · ★${yildizB.s}</span></div>`;
  q('#son .kodKutu').textContent = r.kod;
  const kb2 = document.querySelectorAll('#son .kodSatir .btn');
  kb2[0].onclick = async () => { try { await navigator.clipboard.writeText(r.kod); bildir('Kopyalandı', 'iyi'); } catch (e) { bildir('Kopyalanamadı', 'hata'); } };
  kb2[1].onclick = () => paylas('Kut Arena takımım: ' + r.kod);
  q('#son .siradaK').innerHTML = (r.siralama ? `<b>Lobi sıralaması</b><br>${r.siralama.map(o => `${o.sira}. ${o.sen ? '<b>' + o.ad + '</b>' : o.ad}${o.elenme ? ` <small>(${o.elenme})</small>` : ''}`).join('<br>')}<br>` : '') + `Eşleşme aralığı: <b>${sayi(Math.max(0, r.kupa - 150))} – ${sayi(r.kupa + 150)}</b> kupa<br>Toplam: <b>${oyun.P.istat.mac}</b> maç, <b>${oyun.P.istat.birinci}</b> birincilik`;
  const se = document.querySelectorAll('#son .sonEylem .btn');
  se[0].onclick = () => { anaCiz(); goster('ana'); };
  se[1].onclick = async () => { await oyun.yeniMac(r.mod || 'arena'); goster('mac'); macCiz(); };
  torenGoster(r.siralama ? r.sira : kayip ? 0 : 1);
  const konfeti = $('konfeti'); konfeti.innerHTML = '';
  if (!kayip) { const renk = ['#ffd45c', '#ff6f9a', '#c47bff', '#3fd68f', '#ff8a4c', '#7fdcff']; let h = ''; for (let i = 0; i < 46; i++) { const x = Math.random() * 100, y = Math.random() ** 2 * 70; if (x > 16 && x < 84 && y > 6 && y < 92) continue; h += `<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;background:${renk[i % 6]};transform:rotate(${(Math.random() * 360) | 0}deg)"></i>`; } konfeti.innerHTML = h; }
}

// ── KODEKS ──
let kodeksFiltre = 0;
function kodeksCiz() {
  const izg = $('kahIzgara');
  izg.innerHTML = D.KAHRAMANLAR.filter(h => !kodeksFiltre || h.kademe === kodeksFiltre).map(h => `
    <div class="kk k${h.kademe}" data-id="${h.id}"><div class="resim"><img src="${P(h.id)}" alt=""><span class="kTag">K${h.kademe}</span>
      <div class="soylar">${h.soy.map(soyIk).join('')}</div></div>
      <div class="alt"><b>${h.ad}</b><span><i></i>${D.YETENEK[h.yetenek].ad}</span><span class="p"><i></i>${D.PASIF[h.pasif].ad}</span></div></div>`).join('');
  izg.querySelectorAll('.kk').forEach(k => k.onclick = () => kartBilgi(k.dataset.id));
  $('soyKodListe').innerHTML = Object.entries(D.SOYLAR).map(([s, v]) => {
    const tas = D.KAHRAMANLAR.filter(h => h.soy.includes(s)).map(h => h.id);
    return `<div class="sk"><img src="${SY(s)}" alt=""><div style="min-width:0"><div class="ust"><b>${v.ad}</b><span class="tasiyan">${tas.map(id => `<img src="${P(id)}" alt="">`).join('')}</span></div>
      <div class="esk"><em>2</em><span>${v.aciklama[0]}</span></div><div class="esk"><em>4</em><span>${v.aciklama[1]}</span></div></div></div>`; }).join('');
  q('#kodeks .kodUst .rozet .yz').innerHTML = `<small>Ustalık</small>Sv. ${oyun.ustaToplam()}`;
  document.querySelectorAll('#kodeks .filtre .btn').forEach((b, i) => { b.classList.toggle('on', i === kodeksFiltre); b.onclick = () => { kodeksFiltre = i; kodeksCiz(); }; });
}
q('#kodeks .kodUst .btn').onclick = () => { anaCiz(); goster('ana'); };

// ── ÖĞRETİCİ (OGRETICI.md bölüm 1–2'nin prototip sürümü) ──
// İlk açılışta (localStorage kut.ogretici yoksa) adım adım ipucu: parlayan çerçeve + rehber balonu + Anladım / Öğreticiyi atla.
// Adımlar oyuncunun gerçek eylemiyle geçer; okuma adımları Anladım ile. İlerleme kut.ogreticiAdim'da, bitince kut.ogretici = 'bitti'.
// Döngü yalnız öğretici açıkken 250 ms'de bir çalışır (savaş karesine bağlı değil).
const OGR_ANAHTAR = 'kut.ogretici', OGR_ADIM = 'kut.ogreticiAdim';
const ayarYaz = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
const ogr = { adim: -1, olay: new Set(), z: null, html: '', durdurdu: false, gosterildi: -1, salla: 0 };
const perdeAcik = () => $('perde').classList.contains('acik');
const ogrMac = () => aktifEkran === 'mac' && !!oyun.M && !perdeAcik();
const OGR_ADIMLAR = [
  { id: 'hosgeldin', ekran: 'ana', hedef: ['#ana .oyna'], parmak: true,
    hazir: () => aktifEkran === 'ana' && !perdeAcik(), bitti: () => aktifEkran !== 'ana',
    metin: () => `Arena'ya hoş geldin! Takımını kur, savaşı izle, doğru anda <b>Kut</b> ile araya gir.<small>Başlamak için ${oyun.P.mac ? "DEVAM ET'e" : "OYNA'ya"} dokun.</small>` },
  { id: 'sec', ekran: 'mac', hedef: ['#pencere .secimler'], parmak: true,
    gecerli: () => !!(oyun.M && oyun.M.ilkSecim),
    hazir: () => aktifEkran === 'mac' && perdeAcik() && !!q('#pencere .sc[data-s]'), bitti: () => !oyun.M || !oyun.M.ilkSecim,
    metin: () => `Önce bir <b>başlangıç kahramanı</b> seç. Bu ilk kahraman bedava.` },
  { id: 'satin', ekran: 'mac', hedef: ['#kartlar', '#mac .altinRozet'], parmak: true,
    hazir: () => ogrMac() && !!oyun.M.dukkan.some(Boolean), bitti: () => ogr.olay.has('satin'),
    metin: () => `Bu senin altının. Dükkândan bir karta dokun: <b>kahraman</b> tahtaya iner.<small>Fiyat kartın üstünde yazar.</small>` },
  { id: 'yerlestir', ekran: 'mac', hedef: ['#tahta3d', '#mac .tahtaAlan'], parmak: true,
    hazir: () => ogrMac() && oyun.tahtaSay() + oyun.M.yedek.filter(Boolean).length > 0, bitti: () => ogr.olay.has('tasi'),
    metin: () => oyun.secili ? `Şimdi gitmesini istediğin <b>yuvaya</b> dokun.<small>Dolu yuvaya dokunursan ikisi yer değiştirir.</small>`
      : uc3 ? `Bir kahramanını <b>sürükleyip</b> başka bir hücreye bırak: yerini değiştirir.<small>Önde dayananlar, arkada uzaktan vuranlar durur.</small>`
      : `Bir kahramanına dokun, sonra başka bir yuvaya: <b>yerini</b> değiştirir.<small>Önde dayananlar, arkada uzaktan vuranlar durur.</small>` },
  { id: 'soy', ekran: 'mac', hedef: ['#mac .soyPanel'], oku: true, hazir: ogrMac,
    metin: () => `Her kahramanın iki <b>soyu</b> var: kart köşesindeki simgeler. Soldaki liste kaç tane olduğunu gösterir.<small>Aynı soydan 2 kahraman koyarsan soy gücü açılır.</small>` },
  { id: 'savas', ekran: 'mac', hedef: ['#mac .savasBtn'], parmak: true,
    hazir: () => ogrMac() && !!oyun.M.rakip && !oyun.M.kervan, bitti: () => aktifEkran === 'savas',
    metin: () => `Hazırsın. <b>SAVAŞA!</b>'ya dokun: savaş kendi kendine oynar.` },
  { id: 'kut', ekran: 'savas', hedef: ['#kutAlan'], hafif: true, parmak: true,
    gecerli: () => aktifEkran === 'savas' && !!savasBilgi && !savasBilgi.sim.kutYok,
    hazir: () => aktifEkran === 'savas' && !!savasBilgi && !savasBilgi.bitti && !!$('kutDugme') && !$('yukleniyor').classList.contains('acik') && sonDurum.t >= 1.5,
    bitti: () => aktifEkran !== 'savas' || !savasBilgi || savasBilgi.bitti || !!savasBilgi.kutKullanan,
    // savaş bu adımda durur: Kut dokunuşu motorun o anki zamanına yazılır (S3.dokun), sonra savaş sürer
    goster: () => { if (!duraklat) { duraklat = true; ogr.durdurdu = true; hizUygula(); } },
    son: () => { if (ogr.durdurdu) { ogr.durdurdu = false; duraklat = false; hizUygula(); } if (savasBilgi && savasBilgi.kutKullanan) bildir('Kut, mana dolmasını beklemeden yeteneği açtı', 'iyi'); },
    metin: () => kutSecim ? `Şimdi savaştaki <b>kendi kahramanlarından</b> birine dokun: manası dolar, yeteneği hemen açılır.`
      : `Savaş durdu. Bu senin <b>Kut</b> gücün: savaşta bir kez bir kahramanının manasını doldurur, yeteneğini hemen açar.<small>KUT'a, sonra kendi kahramanına dokun.</small>` },
  { id: 'sonuc', ekran: 'savas', hedef: ['#sOzet', '#sDevam'], altta: true,
    gecerli: () => aktifEkran === 'savas',
    hazir: () => aktifEkran === 'savas' && !!savasBilgi && savasBilgi.bitti && !!$('sDevam') && !$('sDevam').classList.contains('bekle') && $('hasarOzet').hidden,
    bitti: () => aktifEkran !== 'savas',
    metin: () => `Savaş bitti. <b>Hasar özeti</b> kimin ne yaptığını gösterir.<small>Hazır olunca Devam'a dokun.</small>` },
  { id: 'seviye', ekran: 'mac', hedef: ['#mac .dukkanSol .xpBtn', '#mac .tahtaSayac', '#mac .tahtaPanel .pn-bas'], parmak: true,
    gecerli: () => oyun.seviyeli(),
    hazir: () => ogrMac() && oyun.M.tur >= 2 && !oyun.M.kervan, bitti: () => ogr.olay.has('xp'),
    oku: () => oyun.M.altin < oyun.xpBedel(),
    metin: () => `Bu senin <b>seviyen</b>: seviye kadar kahraman koyabilirsin. Savaştan sonra 2 deneyim gelir.`
      + (oyun.M.altin < oyun.xpBedel() ? `<small>Altının yetince Deneyim Al'a dokun: ${oyun.xpBedel()} altın = ${K.xpMiktar} deneyim.</small>` : `<small>Deneyim Al'a dokun: ${oyun.xpBedel()} altın = ${K.xpMiktar} deneyim.</small>`) },
  { id: 'esya', ekran: 'mac', hedef: () => oyun.seciliEsya !== null ? ['#esyaRaf', '#tahta3d', '#mac .tahtaAlan'] : ['#esyaRaf'], parmak: true,
    // eşya öğreticiden önce takıldıysa ve rafta eşya kalmadıysa adım atlanır
    gecerli: () => oyun.seviyeli() && !(!(oyun.M.esyaRaf || []).length && [...oyun.M.tahta, ...oyun.M.yedek].some(b => b && b.e && b.e.length)),
    hazir: () => ogrMac() && (oyun.M.esyaRaf || []).some(id => id !== 'sokumTasi'),
    bitti: () => ogr.olay.has('esya'),
    metin: () => oyun.seciliEsya !== null ? `Şimdi eşyayı takacağın <b>kahramana</b> dokun.<small>İki bileşen aynı kahramanda birleşip tam eşya olur.</small>`
      : `Canavarlar <b>eşya</b> bıraktı. Raftaki eşyaya dokun, sonra bir kahramanına.<small>Her kahraman en çok ${K.esyaYuva} eşya taşır.</small>` },
  { id: 'faiz', ekran: 'mac', hedef: ['#mac .altinRozet'], oku: true,
    gecerli: () => oyun.seviyeli(),
    hazir: () => ogrMac() && L.turPlan(oyun.M.tur - 1).bolum >= 2 && !oyun.M.kervan,
    metin: () => `Harcamadığın her ${K.faizAdim} altın sonraki tura +1 <b>faiz</b> getirir, en çok +${K.faizTavan}.<small>Altın biriktir: rozette "Faiz +${oyun.faizSonraki()}" yazıyor.</small>` },
  { id: 'bitis', ekran: 'mac', hedef: [], oku: true, sonAdim: true, hazir: ogrMac,
    metin: () => `Temeller bu kadar! <b>Kaynaştır</b> ile iki farklı kahramanı tek kahraman yapabilirsin.<small>Gerisi Nasıl Oynanır'da. İyi savaşlar!</small>` },
];
function ogrBaslat(bastan) {
  if (bastan) { ayarYaz(OGR_ANAHTAR, null); ayarYaz(OGR_ADIM, '0'); }
  if (ayarOku(OGR_ANAHTAR) === 'bitti') return;
  ogr.adim = Math.max(0, Math.min(OGR_ADIMLAR.length - 1, +(ayarOku(OGR_ADIM) || 0) || 0)); ogr.olay.clear(); ogr.gosterildi = -1; ogr.html = '';
  $('ogr').hidden = false;
  if (!ogr.z) ogr.z = setInterval(ogrTik, 250);
  ogrTik();
}
function ogrKapat(bitir) {
  const a = OGR_ADIMLAR[ogr.adim]; if (a && a.son && ogr.gosterildi === ogr.adim) a.son();
  if (bitir) { ayarYaz(OGR_ANAHTAR, 'bitti'); ayarYaz(OGR_ADIM, null); }
  ogr.adim = -1; clearInterval(ogr.z); ogr.z = null; $('ogr').hidden = true;
}
function ogrIlerle() {
  const a = OGR_ADIMLAR[ogr.adim]; if (a && a.son && ogr.gosterildi === ogr.adim) a.son();
  ogr.adim++; ogr.olay.clear(); ogr.html = '';
  if (ogr.adim >= OGR_ADIMLAR.length) return ogrKapat(true);
  ayarYaz(OGR_ADIM, String(ogr.adim)); ogrTik();
}
const ogrOku = (a) => typeof a.oku === 'function' ? a.oku() : !!a.oku;
function ogrTik() {
  if (ogr.adim < 0) return;
  const a = OGR_ADIMLAR[ogr.adim];
  // eylemi yapılan adım geçer (balon henüz görünmeden yapılmış olsa da); bu maçta olmayan adım gösterilmeden atlanır
  if (a.bitti && a.bitti()) return ogrIlerle();
  if (ogr.gosterildi !== ogr.adim && a.gecerli && !a.hazir() && !a.gecerli()) return ogrIlerle();
  // maç sürerken ana ekrana dönüldüyse: devam çağrısı
  let hedef, metin, oku, parmak, hafif = false;
  if (aktifEkran === 'ana' && a.ekran !== 'ana' && !perdeAcik() && oyun.P.mac) {
    hedef = ['#ana .oyna']; metin = `Öğretici seni bekliyor. Maça dönmek için <b>DEVAM ET</b>'e dokun.`; oku = false; parmak = true;
  } else if (a.hazir() && (ogr.gosterildi === ogr.adim || !$('bildirim').classList.contains('acik'))) {   // yeni balon, açık bildirimin üstüne binmez
    if (ogr.gosterildi !== ogr.adim) { ogr.gosterildi = ogr.adim; if (a.goster) a.goster(); }
    hedef = typeof a.hedef === 'function' ? a.hedef() : a.hedef; metin = a.metin(); oku = ogrOku(a); parmak = a.parmak && !oku; hafif = !!a.hafif;
  } else { $('ogr').hidden = true; return; }
  const kok = $('ogr'), bal = $('ogrBalon'); kok.hidden = false;
  const html = metin + '|' + oku + '|' + ogr.adim;
  if (html !== ogr.html) {
    ogr.html = html; $('ogrMetin').innerHTML = metin;
    $('ogrTamam').textContent = a.sonAdim ? 'Bitir' : oku ? 'Anladım' : 'Geç';
    $('ogrTamam').className = 'btn ' + (oku ? 'altin' : 'mor');
    $('ogrAtla').style.display = a.sonAdim ? 'none' : '';
    $('ogrSay').textContent = `${ogr.adim + 1}/${OGR_ADIMLAR.length}`;
    bal.style.animation = 'none'; void bal.offsetWidth; bal.style.animation = '';
    const el = $('ogrEl'); el.classList.remove('oyna'); void el.offsetWidth; el.classList.toggle('oyna', !!parmak);
  }
  // çerçeveler: görünen hedefler (en çok iki); ilki ekranı karartır
  const kutular = [];
  for (const s of hedef) { const e = q(s); if (!e || !e.offsetParent && getComputedStyle(e).position !== 'fixed') continue; const r = kokKutu(e); if (r.width > 0 && r.height > 0) kutular.push(r); if (kutular.length === 2) break; }
  kok.classList.toggle('karart', !kutular.length);
  [$('ogrC1'), $('ogrC2')].forEach((c, i) => {
    const r = kutular[i]; c.style.display = r ? 'block' : 'none'; if (!r) return;
    const p = 6; c.style.left = (r.left - p) + 'px'; c.style.top = (r.top - p) + 'px'; c.style.width = (r.width + 2 * p) + 'px'; c.style.height = (r.height + 2 * p) + 'px';
    if (i === 0) c.classList.toggle('hafif', hafif);
  });
  if (kutular[0]) { const r = kutular[0], el = $('ogrEl'); el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = (r.top + r.height / 2) + 'px'; }
  ogrYerlestir(bal, kutular, aktifEkran !== 'ana' && a.altta && a.hazir());
}
// Balon hedefi örtmez: üst, sol, sağ, alt sırayla denenir; hiçbiri sığmazsa hedeflerle en az örtüşen yer seçilir. Kenara 12 px'ten yakın olmaz.
function ogrYerlestir(bal, kutular, altta) {
  const o = olcek(), W = innerWidth / o, H = innerHeight / o, bw = bal.offsetWidth, bh = bal.offsetHeight, m = 12, g = 16;   // kök (mantıksal) px
  const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
  let x = (W - bw) / 2, y = (H - bh) / 2;
  if (kutular.length) {
    const r = kutular[0], cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const aday = [[cx - bw / 2, r.top - g - bh], [r.left - g - bw, cy - bh / 2], [r.right + g, cy - bh / 2], [cx - bw / 2, r.bottom + g]];
    if (altta) aday.unshift(aday.pop());   // sonuç bandının başlığı (ZAFER) örtülmesin
    let en = null, enO = Infinity;
    for (const [ax, ay] of aday) {
      const px = sinir(ax, m, W - m - bw), py = sinir(ay, m, H - m - bh);
      let o = 0; for (const k of kutular) o += Math.max(0, Math.min(px + bw, k.right) - Math.max(px, k.left)) * Math.max(0, Math.min(py + bh, k.bottom) - Math.max(py, k.top));
      if (o < enO - 1) { enO = o; en = [px, py]; } if (o === 0) break;
    }
    [x, y] = en;
  }
  bal.style.left = Math.round(x) + 'px'; bal.style.top = Math.round(y) + 'px';
}
$('ogrTamam').onclick = () => ogrIlerle();
$('ogrAtla').onclick = () => { ogrKapat(true); bildir('Öğretici kapandı. Ayarlar\'dan yeniden başlatabilirsin.'); };
// gerçek eylemler: satın alma, taşıma, deneyim, eşya takma
oyun.on('satinAlindi', () => ogr.olay.add('satin'));
oyun.on('esyaTakildi', () => ogr.olay.add('esya'));
oyun.on('degisti', () => { if (ogr.adim >= 0) ogrTik(); });
{ const yd = oyun.yuvaDokun.bind(oyun);
  oyun.yuvaDokun = (yer, i) => { const s = oyun.secili, tasi = !!s && !oyun.kaynasMod && oyun.seciliEsya === null && !(s.yer === yer && s.i === i);
    const r = yd(yer, i); if (tasi && !oyun.secili) ogr.olay.add('tasi'); if (ogr.adim >= 0) ogrTik(); return r; }; }
{ const xa = oyun.xpAl.bind(oyun);
  oyun.xpAl = () => { const M = oyun.M, once = M ? M.seviye * 1000 + M.xp : 0; const r = xa(); if (M && M.seviye * 1000 + M.xp !== once) ogr.olay.add('xp'); if (ogr.adim >= 0) ogrTik(); return r; }; }

// ── başlangıç ──
document.title = 'Kut Arena';
let acilisBitti = false;
anaCiz(); goster('ana');
// açılış: yükleme ekranı → (görseller, sesler, 3D sahne + karşılama vitrini, gölgelendirici derlemesi) → karşılama
(async () => {
  const gorseller = ['../arayuz/logo.png', ...D.KAHRAMANLAR.map(h => P(h.id)), ...Object.keys(D.SOYLAR).map(SY), ...Object.values(IK_RESIM).map(n => `../arayuz/ui/${n}.png`), '../gorsel/gokyuzu.webp',
    ...[document.documentElement.classList.contains('arkaB') ? 'karsilama_arka_b' : 'karsilama_arka', 'dugme_oyna', 'dugme_oyna_basili', 'profil_cerceve', 'profil_cerceve_b', 'menu_panel', 'dugme_ikincil', 'dugme_ikincil_basili', 'dugme_savas', 'dugme_yuvarlak', 'ikon_ayarlar', 'ikon_yenile', 'ikon_kilit_acik'].map(n => `arayuz/menu/${n}.webp`)];
  // karşılamada 3D vitrin yok (statik karsilama_arka + Ken Burns + zerreler, CSS): açılışta yalnız 3D sahne (renderer, arena) kurulur;
  // kahraman modelleri maça girerken kısa yükleme ekranıyla gelir (macYukle). ?vitrin=1 eski canlı vitrini açar (karsilama.js vitrinKur).
  const vitrinAcik = /[?&]vitrin=1\b/.test(location.search);
  let v = null;
  const r = await acilisYukle(S3, {
    gorseller,
    sahne: async () => { await sahneyiHazirla(); if (vitrinAcik) { v = vitrinKur({ S3, SIM, D, tuval: $('tuval3d') }); await v.hazirla(); } },
    derle: async () => { if (v) { document.body.classList.add('menu3d'); await v.isit(); } },
  });
  if (r && r.hata) { sahneHazir = null; document.body.classList.remove('menu3d'); } else { vitrin = v; uc3 = !/[?&]hazirlik3d=0\b/.test(location.search); if (uc3) hz3Duzen(); }   // 3D yoksa hazırlık 2D ızgarayla açılır
  acilisBitti = true; acilisKapat();
  if (aktifEkran === 'ana') { if (vitrin) vitrin.ac(); anaGiris(); }
  if (!/[?&]ogretici=0\b/.test(location.search)) ogrBaslat();
  window.KUT_TEST.acilis = true;
})();
// bitiş ekranı önizlemesi (test): oyun durumuna dokunmadan sonuç bandını k (0 zafer, 1 yenilgi, 2 berabere) ile kurar ve animasyonu başlatır
function _sonucOnizle(k) { bitisTemizle(); $('sonucYer').innerHTML = `<div class="sonucPerde ${['zafer', 'yenilgi', 'berabere'][k]}" aria-hidden="true"><div class="spIsin"></div><div class="spPatla"></div></div><div class="sonucBant ${['zafer', 'yenilgi', 'berabere'][k]}">${sonucBaslikHTML(k)}<div class="bil"><em>Önizleme</em></div><div class="sDugmeler"><button class="btn mor">${ik('kilic')} Hasar özeti</button><button class="btn altin">Devam ${ik('oyna')}</button></div></div><div class="pn hasarOzet" id="hasarOzet" hidden></div>`; sonucAnimBaslat(k); }
window.KUT_TEST = { acilis: false, anaCiz, macaGir, modPencere, adPencere, get vitrin() { return vitrin; }, oyun, S3, goster, macCiz, sonCiz, ogr, ogrBaslat, ogrKapat, OGR_ADIMLAR, bitis: { _sonucOnizle, mvpAc, mvpSec, mvpKapat, savasGirisGoster, torenGoster } };
