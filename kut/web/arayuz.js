/* Kut Arena — oynanır tablet sürümü: son tasarımı (../tasarim/final) oyun mantığına (oyun.js) ve 3D sahneye (sahne3d.js) bağlar. */
import { Oyun } from './oyun.js';
import * as S3 from './sahne3d.js';
import * as Ses from './ses.js';
import { acilisYukle, acilisKapat, vitrinKur, yukIcerik, yukGosterge } from './karsilama.js';

const D = window.KUT_DATA, SIM = window.KUT_SIM, L = window.KUT_LOBI, K = D.KURAL;
const oyun = new Oyun();
const $ = (id) => document.getElementById(id);
const q = (sel, kok = document) => kok.querySelector(sel);
// Türkçe harfler (ğ ş İ …) Nunito latin-ext dosyalarında: açılışta yükle ki ilk görünüşte yedek yazı tipi titremesi olmasın
if (document.fonts && document.fonts.load) for (const w of [400, 700, 800, 900]) document.fonts.load(`${w} 16px Nunito`, "ğşİı").catch(() => {});
// canavarların portresi yok: 3D'deki gibi yerine gorunum kahramanının portresi (SAHNE_GEREKSINIM.md, Adım 4)
const P = (id) => `../arayuz/portre/${(D.canavar(id) || {}).gorunum || id}.png`, SY = (id) => `../arayuz/soy_${id}.png`;
const IK_RESIM = { coin: 'ik_altin', kalp: 'ik_kalp', kupa: 'ik_kupa', tac: 'ik_tac', yildiz: 'ik_yildiz_altin' };
const ik = (n, c = '') => IK_RESIM[n] ? `<img class="ik ${c}" alt="" src="../arayuz/ui/${IK_RESIM[n]}${n === 'kalp' && /\bbos\b/.test(c) ? '_bos' : ''}.png">` : `<svg class="ik ${c}"><use href="#i-${n}"/></svg>`;
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
  if (id === 'ana' && (once !== 'ana' || !anaGirdi)) anaGiris();
  if (ogr.adim >= 0) setTimeout(ogrTik, 0);
}
let vitrin = null, anaGirdi = false;
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
function pencere(html) { $('pencere').innerHTML = html; $('perde').classList.toggle('menuPanel', aktifEkran === 'ana'); $('perde').classList.add('acik'); $('pencere').scrollTop = 0; }   // görünür olduktan sonra: gizliyken scrollTop yazılamaz, önceki pencerenin kaydırması kalırdı   // karşılamada süslü menü paneli
function kapat() { $('perde').classList.remove('acik'); }
$('perde').addEventListener('click', (e) => { if (e.target.id === 'perde' || e.target.closest('[data-kapat]')) kapat(); });

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
  const b = q('.oyna', a);
  const kr = oyun.kural(), par = '<i class="parilti"></i>';
  b.innerHTML = par + (M
    ? (M.mod === 'hizli'
      ? `<span class="ana">${ik('oyna')}DEVAM ET</span><small>Hızlı Maç · Tur ${M.tur} · ${M.zafer}/${K.hizli.zaferHedef} zafer · ${M.can} can</small><span class="ilerleme">${Array.from({ length: K.hizli.zaferHedef }, (_, i) => `<i class="${i < M.zafer ? 'v' : ''}"></i>`).join('')}</span>`
      : `<span class="ana">${ik('oyna')}DEVAM ET</span><small>${M.mod === 'lobi' && M.lobi ? `Lobi · ${M.lobi.oyuncular.filter(o => !o.olu).length}/8 ayakta · ` : ''}Sv ${M.seviye} · Tur ${L.turAd(M.tur - 1)} · ${M.can} can · ${M.altin} altın</small>`)
    : `<span class="ana">${ik('oyna')}OYNA</span><small>Arena · ${kr.can} can · takımını 8 kahramana büyüt</small>`);
  q('.yeniMac', a).style.display = M ? '' : 'none';
  const alt = a.querySelectorAll('.altSerit span');
  if (alt[0]) alt[0].innerHTML = `<i class="nokta" style="background:#ffb84a"></i>Rakipler: hayalet botlar (çevrimiçi havuz yakında)`;
}
q('#ana .oyna').onclick = async () => { if (oyun.P.mac) { await oyun.turBaslat(true); } else { await oyun.yeniMac(); } goster('mac'); macCiz(); };
q('#ana .yeniMac').onclick = async () => { await oyun.yeniMac('arena'); goster('mac'); macCiz(); };
q('#ana .hizliMac').onclick = async () => { await oyun.yeniMac('hizli'); goster('mac'); macCiz(); };
q('#ana .lobiMac').onclick = async () => { await oyun.yeniMac('lobi'); goster('mac'); macCiz(); };
q('#ana .duelloBtn').onclick = duelloPencere; q('#ana .kahBtn').onclick = () => { kodeksCiz(); goster('kodeks'); }; q('#ana .nasilBtn').onclick = nasilPencere;
q('#ana .anaAyar').onclick = ayarPencere;
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
    <li><b>Kut:</b> savaş kendi kendine oynar, ama bir kez kendi kahramanına dokunup yeteneğini anında patlatabilirsin. Lobide son iki kişi kalınca 2 Kut hakkın olur (arada en az 6 sn).</li>
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
    <div class="eylemler"><button class="btn altin" data-kapat>Tamam</button></div>`);
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
    $('kalpler').innerHTML = `${ik('kalp')}<div class="yz" style="padding:0 6px"><small>Can</small>${M.can}</div>`;
    const sr = M.seri && M.seri.n ? `${M.seri.n} ${M.seri.tip === 'G' ? 'galibiyet' : 'yenilgi'}${L.seriBonus(M.seri.n) ? ` · +${L.seriBonus(M.seri.n)} ${ik('coin')}` : ''}` : 'yok';
    roz[1].innerHTML = `<div class="yz"><small>Seri</small><span style="font-size:15px">${sr}</span></div>${M.sonHasar ? `<div class="yz" style="padding-left:8px"><small>Son kayıp</small><span style="color:#ff8aa0">−${M.sonHasar}</span></div>` : ''}`;
  } else {
    $('kalpler').innerHTML = Array.from({ length: kr.can }, (_, i) => ik('kalp', i < M.can ? '' : 'bos')).join('');
    roz[1].innerHTML = `<div class="yz"><small>Zafer</small>${M.zafer}<span style="color:var(--soluk);font-size:14px">/${kr.zaferHedef}</span></div><div class="zaferler">${Array.from({ length: kr.zaferHedef }, (_, i) => `<i class="${i < M.zafer ? 'v' : ''}"></i>`).join('')}</div>`;
  }
  const tipAd = { pve: 'Canavar', kervan: 'Kervan', pvp: '' }[oyun.turTip()];
  roz[2].innerHTML = `<div class="yz"><small>${sev ? oyun.turUzun() + (tipAd ? ' · ' + tipAd : '') : 'Hızlı Maç · Tur'}</small>${oyun.turAd()}${sev ? ` <span style="color:var(--altinA)">· Sv ${M.seviye}</span>` : ''}</div>`;
  const al = D.ALAMETLER.find(a => a.id === M.alamet);
  // bu turun alameti; seviyeli maçta sıradaki (Alamet Bilgesi ile 3) tur alameti önceden görünür (bölüm 4.3, 8)
  const sonr = oyun.sonrakiAlametler(), sus = M.alametSusTur === M.tur;
  q('.alamet', m).innerHTML = `<div class="ay resim" style="${alametArka(M.alamet)}">${alametIc(M.alamet)}</div><div class="t"><small>Bu turun alameti${sus ? ' · senin savaşında susturuldu' : ''}</small><b>${al.ad}</b> <span>— ${al.m}</span>`
    + (sonr.length ? `<span class="sirada">Sıradaki: ${sonr.map(alametAd).join(' → ')}</span>` : '') + `</div>`;
  // seviyeli maçta bu turun geliri ve sonraki turun faizi (her K.faizAdim altına 1, en çok 5)
  const gl = sev && M.gelir, fz = oyun.faizSonraki();
  q('.altinRozet', m).innerHTML = `<div class="top">${ik('coin')}</div>${M.altin}` + (sev ? `<div class="yz" style="padding-left:6px;font-size:13px;line-height:1.2"><small>${gl ? `Gelir +${gl.toplam}` : 'Gelir'}</small><span style="color:var(--altinA)">Faiz +${fz}</span></div>` : '');
  q('.altinRozet', m).title = gl ? `Bu tur: taban ${gl.taban} · faiz ${gl.faiz} · seri ${gl.seri} · galibiyet ${gl.galibiyet}${gl.alamet ? ' · alamet ' + gl.alamet : ''}` : '';
  // rakip
  const r = M.rakip, rp = q('.rakip', m);
  rp.querySelector('.pn-bas .sag').textContent = `Tur ${oyun.turAd()}`;
  if (r) {
    const lider = r.takim.slice().sort((a, b) => kh(b.h).kademe * b.s - kh(a.h).kademe * a.s)[0];
    const lb = oyun.lobiDurum(), lbS = lb ? `<span style="display:block;font-size:12px;color:var(--yazi2)">Lobi: ${lb.filter(o => !o.olu).length}/8 ayakta · sıran ${lb[0].sira}${r.can != null ? ` · rakibin canı ${r.can}` : ''}</span>` : '';
    rp.querySelector('.rakipKim').innerHTML = `<div class="amb"><img src="${P(lider.h)}" alt=""></div><div style="min-width:0"><b>${r.ad} <span class="etiket">${r.kaynak === 'bot' ? 'Bot' : r.pve ? 'Canavar' : r.kaynak === 'yansima' ? 'Yansıma' : 'Gerçek'}</span></b><span>${r.pve ? `Canavar turu · ${r.takim.length} canavar · kaybetsen de ganimet` : `${ik('kupa')}${sayi(r.kupa || 0)} kupa · ${r.takim.length} kahraman`}</span>${lbS}</div>`;
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
      ${hv ? `<div class="havuzEt" title="Havuzda kalan kopya">Havuzda ${hv.kalan}/${hv.toplam}</div>` : ''}<div class="ad">${h.ad}</div></button>`;
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
  sb[0].innerHTML = `${ik('yenile')}Yenile<small>${yb ? `${ik('coin')}${yb}` : `bedava${M.bedavaYenile > 1 ? ' ×' + M.bedavaYenile : ''}`}</small>`;
  // deneyim satın alma (yalnız seviyeli maç)
  const xb = sb[2];
  xb.style.display = sev ? '' : 'none';
  if (sev) {
    const tavan = M.seviye >= K.seviyeTavan, gerek = oyun.xpGerek();
    xb.disabled = tavan || M.altin < oyun.xpBedel();
    xb.innerHTML = tavan ? `Sv ${M.seviye}<small>en yüksek</small>`
      : `Sv ${M.seviye} · ${M.xp}/${gerek}<span class="xpCubuk"><i style="width:${Math.round(100 * M.xp / gerek)}%"></i></span><small>Deneyim Al · ${ik('coin')}${oyun.xpBedel()}</small>`;
  }
  sb[1].innerHTML = `${ik(M.kilit ? 'kilit' : 'kilitAcik')}${M.kilit ? 'Kilitli' : 'Kilitle'}`; sb[1].classList.toggle('altin', M.kilit); sb[1].classList.toggle('mor', !M.kilit);
  q('.savasBtn', m).innerHTML = M.kervan ? `${ik('oyna')}KERVAN<small>Bir kahraman + eşya seç</small>` : `${ik('kilic')}SAVAŞA!<small>${r ? r.ad + (r.pve ? ' ile' : "'a karşı") : 'Rakip aranıyor…'}</small>`;
  secimDenetle();
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
    ic = a.secenek.map((id, i) => { const x = D.armagan(id); return `<button class="sc" data-s="${i}"><span class="kd">${D.ARMAGAN_KADEME[x.kademe]} · ${x.tur}</span><b>${x.ad}</b><small>${x.m}</small><em>Neden seç? ${x.neden}</em></button>`; }).join('')
      + (a.yenile > 0 ? `<button class="sc" data-yenile="1" style="justify-content:center"><b>${ik('yenile')} Yenile</b><small>Üç kartın hepsi değişir, kademe aynı kalır</small></button>` : '');
  } else if (tip === 'muhur') {
    baslik = 'Soy Mührü'; metin = 'Bir soy seç: o soyun Mührü rafına iner. Mührü taşıyan kahraman bu soyu da sayar.';
    ic = Object.entries(D.SOYLAR).map(([sy, v]) => `<button class="sc" data-soy="${sy}"><img class="pp" src="${SY(sy)}" alt="" style="width:40px;height:40px"><b>${v.ad}</b><small>${v.aciklama[0]}</small></button>`).join('');
  } else {
    baslik = 'Ganimet seçimi'; metin = 'Canavarlar bunları bıraktı. Birini seç, rafına iner.';
    ic = M.ganimetSecim.map((id, i) => `<button class="sc" data-s="${i}">${esyaIk(id)}<b>${(D.esya(id) || {}).ad || id}</b><small>${esyaMetin(id)}</small></button>`).join('');
  }
  pencere(`<h3>${baslik}</h3><p>${metin}</p><div class="secimler">${ic}</div>`);
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
  if (!raf) { raf = document.createElement('div'); raf.id = 'esyaRaf'; raf.className = 'esyaRaf'; $('yedek').after(raf); }
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
function kartBilgi(id) {
  if (!id) return; const h = kh(id);
  pencere(`<div style="display:flex;gap:16px;align-items:center"><img src="${P(id)}" style="width:120px;height:120px;object-fit:contain"><div><h3>${h.ad}</h3>
    <p>${h.soy.map(s => `<img src="${SY(s)}" style="width:22px;vertical-align:middle"> ${D.SOYLAR[s].ad}`).join(' · ')} · ${h.kademe} altın</p></div></div>
    <p><b>Yetenek: ${D.YETENEK[h.yetenek].ad}.</b> ${D.YETENEK[h.yetenek].m}</p><p><b>Pasif: ${D.PASIF[h.pasif].ad}.</b> ${D.PASIF[h.pasif].m}</p>
    <p>Can ${h.can} · Saldırı ${h.atk} · Hız ${h.as} · Menzil ${h.menzil} · Mana ${h.mana}</p>
    <div class="eylemler"><button class="btn altin" data-kapat>Tamam</button></div>`);
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
  bitisTemizle(); goster('savas'); $('sonucYer').innerHTML = ''; $('ayakta').style.display = ''; $('savas').classList.remove('bitti');
  const yg = savasYukAc();
  S3.yukleme.olay = (n, top) => { yg.yuzde(0.1 + 0.8 * n / Math.max(1, top), `Kahramanlar yükleniyor… ${n}/${top}`); };
  try {
    if (vitrin) await vitrin.bekle();   // karşılamadaki vitrin kurulumu sürüyorsa bitsin (iki kurulum üst üste binmesin)
    await sahneyiHazirla(); sonDurum = { t: 0 }; kutCiz(); hudCiz(); S3.boyutla();   // Kut alanı ve ayakta paneli kadrajdan önce çizilsin (tahta kadrajı yerlerini hesaba katar)
    yg.yuzde(0.92, 'Arena kuruluyor…');
    await S3.savasKur(sim);
  } catch (e) {
    console.error(e); sahneHazir = null;
    yg.dur();
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
function hizUygula() { S3.hiz(duraklat ? 0 : hizSecim); document.querySelectorAll('#savas .hizlar .btn').forEach((b, i) => { b.classList.toggle('secik', i + 1 === hizSecim); b.classList.toggle('altin', i + 1 === hizSecim); b.classList.toggle('mor', i + 1 !== hizSecim); }); q('#savas .duraklat .btn').innerHTML = ik(duraklat ? 'oyna' : 'durdur'); }
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
    ? `<div class="kutBant"><b>KUT HAZIR</b><span>Bir kahramanına dokun, yeteneği <em>hemen patlasın</em>. ${hak > 1 ? `Savaşta ${hak} kez (arada 4 sn).` : 'Savaşta 1 kez.'} Eşyalı kahramana verilen Kut <em>yankı</em> yapar.</span></div>
       <button class="kut ${kutSecim ? 'secim' : ''}" aria-label="Kut" id="kutDugme"><div class="isin"></div><div class="yz"><big>KUT</big><small>${kalan}/${hak}</small></div><div class="el">${ik('el')}</div></button>`
    : `<div class="kutBant bitti"><b>Kut kullanıldı</b><span class="satir"><em>${son ? oyun.birimAd(son.b) : ''}</em></span><span class="satir">Sonraki savaşta yenilenir</span></div>
       <div class="kut bitti"><div class="kullanan">${son ? `<img src="${P(son.b.h)}" alt="">` : ''}</div><span class="sayac">0/${hak}</span><div class="onay">${ik('onay')}</div></div>`;
  $('kutParlama').style.background = hazir ? '' : 'none';
  if ($('kutDugme')) $('kutDugme').onclick = () => { if (!sim.kutHazir(0)) return bildir('İkinci Kut için 4 sn bekle'); kutSecim = !kutSecim; kutCiz(); bildir('Kut için kendi kahramanına dokun'); };
}
// 3D tahta kadrajı: savaş arayüzünün kapladığı kenarlar (tuval px = ekran px; tuval ölçeklenmez). Tahta kalan alanda büyük ve ortada durur.
S3.guvenliAlan((w, h) => {
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
  const k = sonuc.kazanan; if (k === 0) S3.zafer(0); else if (k === 1) S3.zafer(1);
  Ses.muzikCal('hazirlik'); sonucAnimBaslat(k === 0 || k === 1 ? k : 2);   // zafer/yenilgi sesi animasyonun çarpışma anında
  const r = oyun.savasBitti(sonuc); savasBilgi.sonucIslem = r;
  if (r && r.hasar > 0 && k === 1 && S3.hasarKivilcim) S3.hasarKivilcim(1);   // rakibin sağ birimlerinden oyuncuya can hasarı ışıkları
  const M = oyun.M, zh = K.hizli.zaferHedef, arena = r && !r.duello && (r.bitti ? r.mod !== 'hizli' : oyun.seviyeli());
  // sonuç özeti: yalnız motorun döndürdüğü veriden chip'ler (tür: iyi / kotu / altin / notr)
  const ist = S3.istatistik ? S3.istatistik() : [], mvpO = mvpSec(ist), cl = [], cip = (tur, m, ikon) => cl.push(`<span class="cip ${tur}">${ikon ? ik(ikon) : ''}${m}</span>`);
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
  else if (k === 1) { cip('kotu', '−1 can'); cip('notr', `${r.bitti ? 0 : M.can} can kaldı`); }
  else cip('notr', 'Berabere: can gitmedi');
  if (mvpO) cip('mvp', `Yıldız: ${oyun.birimAd(mvpO.b)}`, 'tac');
  const bil = cl.join('');
  $('ayakta').style.display = 'none'; $('savas').classList.add('bitti');   // sonuçta Kut, hız ve duraklat gizlenir
  const kt = k === 0 ? 0 : k === 1 ? 1 : 2;
  $('sonucYer').innerHTML = `<div class="sonucPerde ${['zafer', 'yenilgi', 'berabere'][kt]}" aria-hidden="true"><div class="spIsin"></div><div class="spPatla"></div></div><div class="sonucBant ${['zafer', 'yenilgi', 'berabere'][kt]}">${sonucBaslikHTML(kt)}<div class="sAyrac" aria-hidden="true"><i></i><span></span><i></i></div><div class="bil">${bil}</div><div class="sDugmeler"><button class="btn mor" id="sOzet" aria-expanded="false">${ik('kilic')} Hasar özeti</button><button class="btn altin bekle" id="sDevam"><span>Devam</span>${ik('oyna')}</button></div></div><div class="pn hasarOzet" id="hasarOzet" hidden></div>`;
  bitisSonra(azHareket() ? 300 : 1100, () => { if ($('sDevam')) $('sDevam').classList.remove('bekle'); });   // başlık indikten sonra
  hasarOzetKur(ist);
  // Maçın yıldızı: bant animasyonu bitince (1,6 sn) + 0,6 sn; yenilgide sade kart (kamera yok)
  if (mvpO) bitisSonra(azHareket() ? 900 : 2200, () => mvpAc(mvpO, k));
  $('sDevam').onclick = async () => {
    bitisTemizle(); S3.temizle(); savasBilgi = null;
    if (r && r.duello) { anaCiz(); goster('ana'); return; }
    if (r && r.bitti) { sonCiz(r); goster('son'); return; }
    await oyun.turBaslat(false); goster('mac'); macCiz();
  };
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
// element rengi: kahramanın rengi, doygun ve parlak (koyu/soluk renk ışında kaybolmasın)
function parlakRenk(hex) {
  const n = parseInt((hex || '#ffd45c').slice(1), 16); let r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `hsl(${Math.round(h * 60)} ${Math.max(62, Math.round((d ? d / (1 - Math.abs(2 * l - 1)) : 0) * 100))}% ${Math.min(66, Math.max(56, Math.round(l * 100)))}%)`;
}
let mvpDurum = null;
const MVP_SURE = 4200;   // otomatik kapanma (ms); test KUT_TEST.mvpSure ile uzatabilir
function mvpAc(o, k) {
  const yer = $('sonucYer'); if (!savasBilgi || mvpDurum || !yer || !o) return;
  if (ogr.adim >= 0 || perdeAcik() || ($('hasarOzet') && !$('hasarOzet').hidden)) return;   // öğretici, pencere ya da açık hasar özeti varken araya girmez
  const h = kh(o.b.h) || {}, az = azHareket(), yenik = k === 1, renk = parlakRenk(h.renk);
  const yakin = !yenik && !!S3.mvpGoster && S3.mvpGoster(o.uid, h.renk || '#ffd45c', { anlik: az });
  const soylar = [...new Set([...(h.soy || []), ...(o.b.f ? kh(o.b.f).soy : []), ...(o.b.f2 ? kh(o.b.f2).soy : [])])].filter(s => D.SOYLAR[s]);
  const destek = o.iyi + o.kalkan, s = Math.max(1, Math.min(3, o.b.s || 1));
  yer.insertAdjacentHTML('beforeend', `<div class="yildizEkran ${yakin ? 'yakin' : 'orta'} ${yenik ? 'sade' : ''}" id="mvp" role="dialog" aria-label="Maçın yıldızı" style="--ec:${renk}">
    <div class="mvpKart"><div class="mvpSerit"><b>MAÇIN YILDIZI</b></div>
      <div class="mvpPor"><div class="mvpIsinlar"></div><div class="mvpHalka"></div><img src="${P(o.b.h)}" alt=""></div>
      <div class="mvpBilgi"><b class="mvpAd">${oyun.birimAd(o.b)}</b><div class="mvpSoy">${soylar.map(soyIk).join('')}</div>
        <div class="mvpSayi"><span id="mvpHasar">0</span><small>hasar</small></div>
        ${destek > 0 ? `<div class="mvpEk">+${sayi(Math.round(destek))} ${o.kalkan > o.iyi ? 'kalkan' : 'iyileştirme'}</div>` : ''}
        <div class="mvpYildiz">${Array.from({ length: s }, (_, i) => `<span style="--i:${i}">${ik('yildiz')}</span>`).join('')}</div></div></div>
    <div class="mvpIpucu">Kapatmak için dokun</div></div>`);
  const el = $('mvp'), bant = q('.sonucBant', yer); if (bant) bant.classList.add('gizli');
  mvpDurum = { el, raf: 0, z: [] };
  // hasar sayacı: 0,5–1,4 sn arası, çıkış yumuşak; DOM yalnız sayı değişince yazılır
  const hedef = Math.round(o.verilen), sayEl = $('mvpHasar'), bas = performance.now() + (az ? 0 : 500), sure = az ? 1 : 900; let son = -1;
  const say = (t) => { if (!mvpDurum || mvpDurum.el !== el) return; const e = Math.max(0, Math.min(1, (t - bas) / sure)), v = Math.round(hedef * (1 - (1 - e) ** 3));
    if (v !== son) { son = v; sayEl.textContent = sayi(v); } if (e < 1) mvpDurum.raf = requestAnimationFrame(say); };
  mvpDurum.raf = requestAnimationFrame(say);
  el.addEventListener('pointerdown', () => mvpKapat(false));
  mvpDurum.z.push(setTimeout(() => mvpKapat(false), (window.KUT_TEST && KUT_TEST.mvpSure) || MVP_SURE));
}
function mvpKapat(anlik) {
  const m = mvpDurum; if (!m) return; mvpDurum = null;
  cancelAnimationFrame(m.raf); m.z.forEach(clearTimeout);
  if (S3.mvpBitir) S3.mvpBitir(anlik || azHareket());
  const bant = q('#sonucYer .sonucBant'); if (bant) bant.classList.remove('gizli');
  if (anlik) { m.el.remove(); return; }
  m.el.classList.add('kapan'); setTimeout(() => m.el.remove(), 320);
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
  const g = r.gecmis.filter(x => x === 0).length, kb = r.gecmis.filter(x => x === 1).length;
  $('ozet').innerHTML = `<div><b style="color:#8dffb0">${g}</b><span>zafer</span></div><div><b style="color:#ff8aa0">${arena ? r.can : Math.max(0, K.hizli.can - kb)}</b><span>can kaldı</span></div><div><b>${r.gecmis.length}</b><span>tur</span></div>`;
  $('turSay').textContent = `${g} kazanıldı · ${kb} kaybedildi`;
  $('turlar').innerHTML = r.gecmis.map((t, i) => `<div class="tr ${t === 0 ? 'g' : t === 1 ? 'k' : ''}"><small>Tur</small>${i + 1}</div>`).join('');
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
      <div class="esk"><span><em>2</em>${v.aciklama[0]}</span></div><div class="esk"><span><em>4</em>${v.aciklama[1]}</span></div></div></div>`; }).join('');
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
  { id: 'yerlestir', ekran: 'mac', hedef: ['#mac .tahtaAlan'], parmak: true,
    hazir: () => ogrMac() && oyun.tahtaSay() + oyun.M.yedek.filter(Boolean).length > 0, bitti: () => ogr.olay.has('tasi'),
    metin: () => oyun.secili ? `Şimdi gitmesini istediğin <b>yuvaya</b> dokun.<small>Dolu yuvaya dokunursan ikisi yer değiştirir.</small>`
      : `Bir kahramanına dokun, sonra başka bir yuvaya: <b>yerini</b> değiştirir.<small>Önde dayananlar, arkada uzaktan vuranlar durur.</small>` },
  { id: 'soy', ekran: 'mac', hedef: ['#mac .soyPanel'], oku: true, hazir: ogrMac,
    metin: () => `Her kahramanın iki <b>soyu</b> var: kart köşesindeki simgeler.<small>Aynı soydan 2 kahraman koyarsan soy gücü açılır.</small>` },
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
    metin: () => kutSecim ? `Şimdi savaştaki <b>kendi kahramanlarından</b> birine dokun: yeteneği hemen patlar.`
      : `Savaş durdu. Bu senin <b>Kut</b> gücün: savaşta bir kez bir kahramanının yeteneğini hemen açar.<small>KUT'a, sonra kendi kahramanına dokun.</small>` },
  { id: 'sonuc', ekran: 'savas', hedef: ['#sOzet', '#sDevam'], altta: true,
    gecerli: () => aktifEkran === 'savas',
    hazir: () => aktifEkran === 'savas' && !!savasBilgi && savasBilgi.bitti && !!$('sDevam') && !$('sDevam').classList.contains('bekle') && $('hasarOzet').hidden,
    bitti: () => aktifEkran !== 'savas',
    metin: () => `Savaş bitti. <b>Hasar özeti</b> kimin ne yaptığını gösterir.<small>Hazır olunca Devam'a dokun.</small>` },
  { id: 'seviye', ekran: 'mac', hedef: ['#mac .dukkanSol .xpBtn', '#mac .tahtaPanel .pn-bas'], parmak: true,
    gecerli: () => oyun.seviyeli(),
    hazir: () => ogrMac() && oyun.M.tur >= 2 && !oyun.M.kervan, bitti: () => ogr.olay.has('xp'),
    oku: () => oyun.M.altin < oyun.xpBedel(),
    metin: () => `Bu senin <b>seviyen</b>: seviye kadar kahraman koyabilirsin. Savaştan sonra 2 deneyim gelir.`
      + (oyun.M.altin < oyun.xpBedel() ? `<small>Altının yetince Deneyim Al'a dokun: ${oyun.xpBedel()} altın = ${K.xpMiktar} deneyim.</small>` : `<small>Deneyim Al'a dokun: ${oyun.xpBedel()} altın = ${K.xpMiktar} deneyim.</small>`) },
  { id: 'esya', ekran: 'mac', hedef: () => oyun.seciliEsya !== null ? ['#esyaRaf', '#mac .tahtaAlan'] : ['#esyaRaf'], parmak: true,
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
    ...['karsilama_arka', 'dugme_oyna', 'dugme_oyna_basili', 'profil_cerceve', 'menu_panel'].map(n => `arayuz/menu/${n}.webp`)];
  let v = null;
  const r = await acilisYukle(S3, {
    gorseller,
    sahne: async () => { await sahneyiHazirla(); v = vitrinKur({ S3, SIM, D, tuval: $('tuval3d') }); await v.hazirla(); },
    derle: async () => { document.body.classList.add('menu3d'); await v.isit(); },
  });
  if (r && r.hata) { sahneHazir = null; document.body.classList.remove('menu3d'); } else vitrin = v;   // 3D yoksa karşılama portre yedeğiyle açılır
  acilisBitti = true; acilisKapat();
  if (aktifEkran === 'ana') { if (vitrin) vitrin.ac(); anaGiris(); }
  if (!/[?&]ogretici=0\b/.test(location.search)) ogrBaslat();
  window.KUT_TEST.acilis = true;
})();
// bitiş ekranı önizlemesi (test): oyun durumuna dokunmadan sonuç bandını k (0 zafer, 1 yenilgi, 2 berabere) ile kurar ve animasyonu başlatır
function _sonucOnizle(k) { bitisTemizle(); $('sonucYer').innerHTML = `<div class="sonucPerde ${['zafer', 'yenilgi', 'berabere'][kt]}" aria-hidden="true"><div class="spIsin"></div><div class="spPatla"></div></div><div class="sonucBant ${['zafer', 'yenilgi', 'berabere'][k]}">${sonucBaslikHTML(k)}<div class="bil"><em>Önizleme</em></div><div class="sDugmeler"><button class="btn mor">${ik('kilic')} Hasar özeti</button><button class="btn altin">Devam ${ik('oyna')}</button></div></div><div class="pn hasarOzet" id="hasarOzet" hidden></div>`; sonucAnimBaslat(k); }
window.KUT_TEST = { acilis: false, get vitrin() { return vitrin; }, oyun, S3, goster, macCiz, sonCiz, ogr, ogrBaslat, ogrKapat, OGR_ADIMLAR, bitis: { _sonucOnizle, mvpAc, mvpSec, mvpKapat, savasGirisGoster, torenGoster } };
