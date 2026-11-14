/* Kut Arena — oynanır tablet sürümü: son tasarımı (../tasarim/final) oyun mantığına (oyun.js) ve 3D sahneye (sahne3d.js) bağlar. */
import { Oyun } from './oyun.js';
import * as S3 from './sahne3d.js';

const D = window.KUT_DATA, SIM = window.KUT_SIM, K = D.KURAL;
const oyun = new Oyun();
const $ = (id) => document.getElementById(id);
const q = (sel, kok = document) => kok.querySelector(sel);
const P = (id) => `./arayuz/portre/${id}.png`, SY = (id) => `./arayuz/soy_${id}.png`;
const ik = (n, c = '') => `<svg class="ik ${c}"><use href="#i-${n}"/></svg>`;
const yildiz = (s) => `<div class="yildizlar y${s}">${ik('yildiz').repeat(s)}</div>`;
const soyIk = (s) => `<img class="soyIk" src="${SY(s)}" alt="${D.SOYLAR[s].ad}">`;
const mad = (id) => `<div class="madalyon"><img src="${P(id)}" alt=""></div>`;
const kh = (id) => D.kahraman(id);
const sayi = (n) => n.toLocaleString('tr-TR');
const ALAMET_RENK = { yok: '#ffe08a', kanAyi: '#ff3d5a', sis: '#c9b8e6', tipi: '#bfe6ff', kutYagmur: '#ffd45c', pazar: '#ffcc4a', tutulma: '#7a4cc0', yaz: '#ff9a2e' };
const IPUCU = {
  karanlik: 'Karanlık yaralıları bitirir: ön sırayı sağlam tut.', avci: 'Avcılar uzaktan çok vurur: Çevik ya da Bulut Atı ile arkalarına dal.',
  dev: 'Devler zor yıkılır: Karanlık ve Avcı hasarı işe yarar.', ates: 'Od yakar: Su soyu iyileşmesiyle dayan.', su: 'Su iyileşir: tek hedefe yüklen, çabuk bitir.',
  kis: 'Ayaz seni yavaşlatır: Gök hızıyla karşıla.', gok: 'Gök hızlı vurur: Dev soyu ile hasarı emer.', bilge: 'Bilgeler yeteneği erken açar: Kut\'u erken kullanmayı düşün.',
  atli: 'Çevikler ilk saniyelerde patlar: önü sağlam kur.', yer: 'Yer soyu canlıdır: uzun savaşa hazırlan, Od yakması işe yarar.',
};

// ── genel ──
let aktifEkran = 'ana';
function goster(id) { aktifEkran = id; document.querySelectorAll('.ekran').forEach(e => e.classList.toggle('aktif', e.id === id)); }
let bildirimZ;
function bildir(m, tur = 'bilgi') { const b = $('bildirim'); b.textContent = m; b.className = 'bildirim acik ' + tur; clearTimeout(bildirimZ); bildirimZ = setTimeout(() => b.classList.remove('acik'), 1800); }
oyun.on('bildirim', ({ m, tur }) => bildir(m, tur));
function pencere(html) { $('pencere').innerHTML = html; $('perde').classList.add('acik'); }
function kapat() { $('perde').classList.remove('acik'); }
$('perde').addEventListener('click', (e) => { if (e.target.id === 'perde' || e.target.closest('[data-kapat]')) kapat(); });

async function paylas(metin) {
  try { if (navigator.share) { await navigator.share({ text: metin }); return; } } catch (e) {}
  try { await navigator.clipboard.writeText(metin); bildir('Kopyalandı', 'iyi'); } catch (e) { bildir('Kopyalanamadı: kodu seçip kopyala', 'hata'); }
}

// ── ANA EKRAN ──
function anaCiz() {
  const a = $('ana'), P_ = oyun.P, M = P_.mac;
  const roz = a.querySelectorAll('.ustSerit .rozet');
  roz[0].querySelector('.yz').innerHTML = `<b>${P_.ad}</b><span>${P_.istat.mac} maç · ${P_.istat.birinci} birincilik</span>`;
  roz[1].querySelector('.yz').innerHTML = `<small>Kupa</small>${sayi(P_.kupa)}`;
  roz[2].querySelector('.yz').innerHTML = `<small>Ustalık</small>Sv. ${oyun.ustaToplam()}`;
  const b = q('.oyna', a);
  b.innerHTML = M
    ? `<span class="ana">${ik('oyna')}DEVAM ET</span><small>Tur ${M.tur} · ${M.zafer}/7 zafer · ${M.can} can</small><span class="ilerleme">${Array.from({ length: 7 }, (_, i) => `<i class="${i < M.zafer ? 'v' : ''}"></i>`).join('')}</span>`
    : `<span class="ana">${ik('oyna')}OYNA</span><small>~7 dk · 5 can · 7 zafer</small>`;
  q('.yeniMac', a).style.display = M ? '' : 'none';
  const alt = a.querySelectorAll('.altSerit span');
  if (alt[0]) alt[0].innerHTML = `<i class="nokta" style="background:#ffb84a"></i>Rakipler: hayalet botlar (çevrimiçi havuz yakında)`;
}
q('#ana .oyna').onclick = async () => { if (oyun.P.mac) { await oyun.turBaslat(true); } else { await oyun.yeniMac(); } goster('mac'); macCiz(); };
q('#ana .yeniMac').onclick = async () => { await oyun.yeniMac(); goster('mac'); macCiz(); };
const anaUclu = document.querySelectorAll('#ana .uclu .btn');
anaUclu[0].onclick = duelloPencere; anaUclu[1].onclick = () => { kodeksCiz(); goster('kodeks'); }; anaUclu[2].onclick = nasilPencere;
q('#ana .ayarBtn').onclick = ayarPencere;

function nasilPencere() {
  pencere(`<h3>Nasıl oynanır</h3><ul>
    <li><b>Her tur 10 altın.</b> Dükkândan kahraman al (fiyat = kademe). Altın biriktirilmez; geride kalan da eşit alışveriş yapar.</li>
    <li><b>3 aynı kahraman</b> kendiliğinden birleşir: ★2, sonra ★3.</li>
    <li><b>Kaynaştır (3 altın):</b> bir kahramanı seç, Kaynaştır'a bas, ikinci kahramana dokun. Yetenek birinciden, pasif ikinciden gelir; soyların hepsi sayılır.</li>
    <li><b>Rakibini önceden gör:</b> sol üstte sıradaki rakibin kadrosu ve soyları var. Ona göre kur.</li>
    <li><b>Alamet:</b> her turun kendi kuralı vardır (Kan Ayı, Sis, Tipi…).</li>
    <li><b>Kut:</b> savaş kendi kendine oynar, ama bir kez kendi kahramanına dokunup yeteneğini anında patlatabilirsin.</li>
    <li><b>5 can · 7 zafer.</b> Kaybedince 1 can gider.</li></ul>
    <div class="eylemler"><button class="btn altin" data-kapat>Anladım</button></div>`);
}
function duelloPencere() {
  const kod = oyun.duelloKodu();
  pencere(`<h3>Düello kodu</h3>
    <p>Son maçtaki takımın bir koda dönüşür. Arkadaşına at; o kendi takımıyla seninkini dövüştürsün. Sunucu gerekmez.</p>
    ${kod ? `<textarea readonly id="dKod">${kod}</textarea>` : '<p><i>Önce bir maç oyna: son takımın kaydedilir.</i></p>'}
    <p>Arkadaşının kodu:</p><textarea id="dGir" placeholder="KUT1-..."></textarea>
    <div class="eylemler">${kod ? `<button class="btn mor" id="dKopya">${ik('kopya')}Kopyala</button>` : ''}<button class="btn mor" data-kapat>Kapat</button><button class="btn altin" id="dDovus">${ik('kilic')}Dövüştür</button></div>`);
  if (kod) $('dKopya').onclick = () => paylas('Kut Arena takımım: ' + kod);
  $('dDovus').onclick = () => { const s = oyun.duelloHazirla($('dGir').value); if (s) { kapat(); savasBaslat(s, { ad: 'Arkadaş', duello: true }); } };
}
function ayarPencere() {
  const hafif = ayarOku('kut.hafif') === '1';
  pencere(`<h3>Ayarlar</h3>
    <p><b>Grafik:</b> ${hafif ? 'Hafif (gölge yok, düşük çözünürlük)' : 'Yüksek'}. Değişiklik sayfa yenilenince uygulanır.</p>
    <div class="eylemler" style="justify-content:flex-start"><button class="btn mor" id="aGrafik">${hafif ? 'Yüksek grafiğe geç' : 'Hafif grafiğe geç'}</button>
    ${oyun.P.mac ? `<button class="btn sat" id="aCik">Maçtan çık (ana ekran)</button>` : ''}</div>
    <div class="eylemler"><button class="btn altin" data-kapat>Tamam</button></div>`);
  $('aGrafik').onclick = () => { try { localStorage.setItem('kut.hafif', hafif ? '0' : '1'); } catch (e) {} location.reload(); };
  if ($('aCik')) $('aCik').onclick = () => { kapat(); anaCiz(); goster('ana'); };
}

// ── MAÇ EKRANI ──
function yuvaHTML(b, yer, i) {
  const M = oyun.M, sec = oyun.secili && oyun.secili.yer === yer && oyun.secili.i === i;
  const hedefle = oyun.secili && !sec && !oyun.kaynasMod;
  const kaynasHedef = oyun.kaynasMod && b && !sec && !b.f && oyun.al(oyun.secili) && b.h !== oyun.al(oyun.secili).h;
  const ek = `data-yer="${yer}" data-i="${i}"`;
  if (!b) {
    const dolu = yer === 'tahta' && oyun.tahtaSay() >= oyun.yuva();
    return `<div class="yuva bos ${hedefle ? 'hedefle' : ''}" ${ek}>${hedefle && oyun.secili.yer === 'yedek' && dolu ? '<span style="opacity:.7">Takım dolu</span>' : ''}</div>`;
  }
  const h = kh(b.h);
  if (b.f) {
    const f = kh(b.f); const soylar = [...new Set([...h.soy, ...f.soy])];
    return `<div class="yuva kaynas ${sec ? 'secili' : ''} ${hedefle ? 'hedefle' : ''}" ${ek}><div class="taban" style="--kc:${f.renk}"></div>
      <img class="port" src="${P(b.h)}" alt="">${mad(b.f)}${yildiz(b.s)}<div class="kaynasEt">${ik('kaynas')}KAYNAŞIK</div>
      <div class="soylar">${soylar.map(soyIk).join('')}</div><div class="plaka">${h.ad.split(' ')[0]} × ${f.ad.split(' ')[0]}</div></div>`;
  }
  return `<div class="yuva k${h.kademe} ${b.s > 1 ? 'yz2' : ''} ${sec ? 'secili' : ''} ${hedefle ? 'hedefle' : ''} ${kaynasHedef ? 'kaynasHedef' : ''}" ${ek}><div class="taban"></div>
    <img class="port" src="${P(b.h)}" alt="">${yildiz(b.s)}${sec ? '<div class="seciliEt">Seçili</div>' : ''}
    <div class="soylar">${h.soy.map(soyIk).join('')}</div><div class="plaka">${h.ad}</div></div>`;
}
function macCiz() {
  const M = oyun.M; if (!M) return;
  const m = $('mac');
  // üst şerit
  $('kalpler').innerHTML = Array.from({ length: K.can }, (_, i) => ik('kalp', i < M.can ? '' : 'bos')).join('');
  const roz = m.querySelectorAll('.macUst > .rozet');
  roz[1].innerHTML = `<div class="yz"><small>Zafer</small>${M.zafer}<span style="color:var(--soluk);font-size:14px">/7</span></div><div class="zaferler">${Array.from({ length: 7 }, (_, i) => `<i class="${i < M.zafer ? 'v' : ''}"></i>`).join('')}</div>`;
  roz[2].innerHTML = `<div class="yz"><small>Tur</small>${M.tur}</div>`;
  const al = D.ALAMETLER.find(a => a.id === M.alamet);
  q('.alamet', m).innerHTML = `<div class="ay" style="background:radial-gradient(circle at 35% 35%,#fff,${ALAMET_RENK[M.alamet]} 55%,#3a0820)"></div><div class="t"><small>Bu turun alameti</small><b>${al.ad}</b> <span>— ${al.m}</span></div>`;
  q('.altinRozet', m).innerHTML = `<div class="top">${ik('coin')}</div>${M.altin}`;
  // rakip
  const r = M.rakip, rp = q('.rakip', m);
  rp.querySelector('.pn-bas .sag').textContent = `Tur ${M.tur}`;
  if (r) {
    const lider = r.takim.slice().sort((a, b) => kh(b.h).kademe * b.s - kh(a.h).kademe * a.s)[0];
    rp.querySelector('.rakipKim').innerHTML = `<div class="amb"><img src="${P(lider.h)}" alt=""></div><div style="min-width:0"><b>${r.ad} <span class="etiket">${r.kaynak === 'bot' ? 'Bot' : 'Gerçek'}</span></b><span>${ik('kupa')}${sayi(r.kupa || 0)} kupa · ${r.takim.length} kahraman</span></div>`;
    const yer = {}; r.takim.forEach(b => { yer[b.y * 3 + b.x] = b; });
    $('rakipTahta').innerHTML = [0, 1].map(sira => `<div class="sAd ${sira ? 'arka' : ''}">${sira ? 'Arka' : 'Ön'}</div>` + [0, 1, 2].map(x => {
      const b = yer[sira * 3 + x]; return b ? `<div class="m k${kh(b.h).kademe}"><img src="${P(b.h)}" alt="">${yildiz(b.s)}${b.f ? mad(b.f) : ''}</div>` : `<div class="m bos"></div>`;
    }).join('')).join('');
    const rs = oyun.soylar(r.takim); const aktif = Object.entries(rs).filter(([, v]) => v.seviye).sort((a, b) => b[1].n - a[1].n);
    $('rakipSoy').innerHTML = aktif.length ? aktif.map(([s, v]) => `<span class="cip aktif"><img src="${SY(s)}" alt="">${D.SOYLAR[s].ad} ${v.n}</span>`).join('') : '<span class="cip">Aktif soy yok</span>';
    q('.ipucuSatir span', rp).textContent = aktif.length ? IPUCU[aktif[0][0]] : 'Rakip dağınık: en güçlü soyunu kur, birleştirmeye odaklan.';
  } else { rp.querySelector('.rakipKim').innerHTML = '<div style="padding:8px">Rakip aranıyor…</div>'; $('rakipTahta').innerHTML = ''; $('rakipSoy').innerHTML = ''; }
  // soylar
  const sy = oyun.soylar(); const liste = Object.entries(sy).sort((a, b) => b[1].seviye - a[1].seviye || b[1].n - a[1].n);
  const aktifler = liste.filter(([, v]) => v.n >= 2), eksik = liste.filter(([, v]) => v.n < 2);
  $('soyListe').innerHTML = aktifler.length ? aktifler.map(([s, v]) => { const e = D.SOYLAR[s].esik;
    return `<div class="soyS"><img src="${SY(s)}" alt=""><div style="min-width:0"><div class="ust"><span class="ad">${D.SOYLAR[s].ad}</span>
      <span class="esik"><b>${v.n}</b><span class="${v.n >= e[0] ? 'on' : ''}">${e[0]}</span><span class="${v.n >= e[1] ? 'on' : ''}">${e[1]}</span></span></div><span class="bonus">${D.SOYLAR[s].aciklama[Math.max(0, v.seviye - 1)]}</span></div></div>`; }).join('')
    : `<div style="padding:10px 8px;font-size:15px;line-height:1.4;color:var(--yazi2)">Aynı soydan <b style="color:#fff">2 kahraman</b> koy, soy gücü açılsın. Simgeler kartların sol üstünde.</div>`;
  $('soyPasif').innerHTML = eksik.length ? `<span class="not">Eksik</span>` + eksik.slice(0, 5).map(([s]) => `<img class="ikc" src="${SY(s)}" alt="${D.SOYLAR[s].ad}" title="${D.SOYLAR[s].ad} 1/2">`).join('') : '';
  // tahta
  const tp = q('.tahtaPanel', m);
  tp.querySelector('.pn-bas .sag').textContent = `${oyun.tahtaSay()}/${oyun.yuva()} yuva` + (oyun.yuva() < 6 ? ` · Tur ${M.tur + (M.tur % 2 ? 1 : 2)}'de ${Math.min(6, oyun.yuva() + 1)}` : '');
  $('onSira').innerHTML = [0, 1, 2].map(i => yuvaHTML(M.tahta[i], 'tahta', i)).join('');
  $('arkaSira').innerHTML = [3, 4, 5].map(i => yuvaHTML(M.tahta[i], 'tahta', i)).join('');
  $('yedek').innerHTML = M.yedek.map((b, i) => yuvaHTML(b, 'yedek', i)).join('');
  q('.yedekBas', tp).innerHTML = `Yedek ${M.yedek.filter(Boolean).length}/${K.yedek}<em>${oyun.kaynasMod ? 'Kaynaşacak ikinci kahramana dokun' : oyun.secili ? 'Taşımak için bir yuvaya dokun' : 'Bir kahramana dokun: bilgi, sat, kaynaştır'}</em><i></i>`;
  m.querySelectorAll('.yuva[data-yer]').forEach(y => y.onclick = () => oyun.yuvaDokun(y.dataset.yer, +y.dataset.i));
  // seçili panel
  secCiz();
  // dükkân
  const kartlar = M.dukkan.map((id, i) => {
    if (!id) return `<div class="kart bos" style="opacity:.25;border-style:dashed"></div>`;
    const h = kh(id), sahipN = [...M.tahta, ...M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length;
    const yuk = sahipN >= 2, pahali = M.altin < h.kademe;
    return `<button class="kart k${h.kademe} ${yuk ? 'yuksel' : ''} ${pahali ? 'pahali' : ''}" data-i="${i}">
      <div class="resim"><img src="${P(id)}" alt=""><div class="solUst"><span class="kTag">K${h.kademe}</span>${h.soy.map(soyIk).join('')}</div>
      <div class="fiyat">${ik('coin')}${h.kademe}</div>${yuk ? `<div class="yukselEt">${ik('ok')}★2 olur · ${sahipN}/3</div>` : ''}${!yuk && sahipN ? `<div class="sahipEt">Elinde ${sahipN}/3</div>` : ''}</div>
      <div class="ad">${h.ad}</div></button>`;
  });
  $('kartlar').innerHTML = kartlar.join('');
  $('kartlar').querySelectorAll('.kart[data-i]').forEach(k => {
    let uzun = null, uzunOldu = false;
    k.addEventListener('pointerdown', () => { uzunOldu = false; uzun = setTimeout(() => { uzunOldu = true; kartBilgi(M.dukkan[+k.dataset.i]); }, 480); });
    k.addEventListener('pointerup', () => clearTimeout(uzun)); k.addEventListener('pointerleave', () => clearTimeout(uzun));
    k.onclick = () => { if (!uzunOldu) oyun.satinAl(+k.dataset.i); };
  });
  const ol = K.kademeOlasilik(M.tur);
  q('.dukkan .pn-bas .sag', m).textContent = `Şans: K1 %${Math.round(ol[0] * 100)} · K2 %${Math.round(ol[1] * 100)} · K3 %${Math.round(ol[2] * 100)}`;
  const sb = m.querySelectorAll('.dukkanSol .btn');
  sb[0].disabled = M.altin < K.yenile;
  sb[1].innerHTML = `${ik(M.kilit ? 'kilit' : 'kilitAcik')}${M.kilit ? 'Kilitli' : 'Kilitle'}`; sb[1].classList.toggle('altin', M.kilit); sb[1].classList.toggle('mor', !M.kilit);
  q('.savasBtn', m).innerHTML = `${ik('kilic')}SAVAŞA!<small>${r ? r.ad + "'a karşı" : 'Rakip aranıyor…'}</small>`;
}
function secCiz() {
  const sp = $('secPanel'), b = oyun.al(oyun.secili);
  if (!b) {
    sp.className = 'pn gem secPanel';
    sp.innerHTML = `<div class="pn-bas"><span class="elmas"></span>Seçili kahraman</div>
      <div style="padding:18px 10px;display:flex;flex-direction:column;gap:12px;font-size:16px;line-height:1.45;color:var(--yazi2)">
        <div>${ik('el')} Tahtadaki ya da yedekteki bir kahramana dokun: özelliklerini gör, <b style="color:#fff">sat</b> ya da <b style="color:#fff">kaynaştır</b>.</div>
        <div>Dükkândaki karta <b style="color:#fff">basılı tut</b>: kahraman bilgisi.</div>
        <div style="color:#ffe48a">3 aynı kahraman → ★2 · Kaynaştır: iki farklı kahraman tek kahraman olur.</div></div>`;
    return;
  }
  const h = kh(b.h), st = SIM.birimStat(b), soylar = st.soy;
  sp.className = `pn gem secPanel k${h.kademe}`;
  const kaynasabilir = !b.f && oyun.M.altin >= K.kaynastir;
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
      <div class="stat">${ik('kalkan')}<div class="yz"><small>Yer</small>${oyun.secili.yer === 'yedek' ? 'Yedek' : oyun.secili.i < 3 ? 'Ön' : 'Arka'}</div></div>
    </div>
    <div class="yetenek"><b><em>Yetenek</em>${D.YETENEK[st.yetenek].ad}</b>${D.YETENEK[st.yetenek].m}</div>
    <div class="yetenek pasif"><b><em>Pasif</em>${D.PASIF[st.pasif].ad}</b>${D.PASIF[st.pasif].m}</div>
    <div class="secEylem">${b.f ? `<div style="padding:10px;color:var(--yazi2);font-size:15px">Kaynaşmış kahraman tekrar kaynaşmaz.</div>` : `
      <button class="btn gb kaynastir" id="eKay" ${kaynasabilir ? '' : 'disabled'}><span class="ust">${ik('kaynas')}${oyun.kaynasMod ? 'İKİNCİYE DOKUN' : 'KAYNAŞTIR'}</span><small>${K.kaynastir} ${ik('coin')} · ${oyun.kaynasMod ? 'iptal için tekrar bas' : 'sonra 2. kahramana dokun'}</small></button>
      <div class="kaynasSema"><div class="kk"><img src="${P(b.h)}" alt=""></div><span class="arti">+</span><div class="kk soru">?</div>
        <p><b>Yetenek ${h.ad.split(' ')[0]}'dan,</b><br>pasif ikinciden gelir.</p></div>`}</div>`;
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
{ const sb = document.querySelectorAll('#mac .dukkanSol .btn'); sb[0].onclick = () => oyun.yenile(); sb[1].onclick = () => oyun.kilit(); }
q('#mac .savasBtn').onclick = () => { const s = oyun.savasHazirla(); if (s) savasBaslat(s, oyun.M.rakip); };
q('#mac .ayarBtn').onclick = ayarPencere;

// ── SAVAŞ ──
let sahneHazir = null, savasDongu = false, savasBilgi = null, sonHud = 0, hizSecim = 2, duraklat = false, kutSecim = false;
const ayarOku = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const hafif = ayarOku('kut.hafif') === '1';
async function sahneyiHazirla() {
  if (!sahneHazir) sahneHazir = S3.hazirla($('tuval3d'), $('kaplama'), '', { hafif });
  return sahneHazir;
}
async function savasBaslat(sim, rakip) {
  savasBilgi = { sim, rakip, alamet: D.ALAMETLER.find(a => a.id === (oyun.M ? oyun.M.alamet : 'yok')), bitti: false };
  goster('savas'); $('sonucYer').innerHTML = ''; $('ayakta').style.display = '';
  $('yukleniyor').classList.add('acik');
  await sahneyiHazirla(); S3.boyutla();
  await S3.savasKur(sim);
  $('yukleniyor').classList.remove('acik');
  kutCiz(); hizUygula(); kutSecim = false;
  const s = $('savas');
  q('.rakipK', s).innerHTML = `<div class="amb"><img src="${P((rakip.takim || [])[0] ? rakip.takim[0].h : 'tilki')}" alt=""></div><div style="min-width:0"><small>${rakip.duello ? 'Düello' : 'Rakip · Tur ' + oyun.M.tur}</small><b>${rakip.ad}</b><span>${rakip.kaynak === 'bot' ? 'Bot' : 'Kupa ' + sayi(rakip.kupa || 0)}</span></div>`;
  const a = savasBilgi.alamet; q('.alametK', s).innerHTML = `<span class="ay" style="background:radial-gradient(circle at 35% 35%,#fff,${ALAMET_RENK[a.id]} 55%,#3a0820)"></span><div><b>${a.ad}</b><span>${a.m}</span></div>`;
  if (!savasDongu) { savasDongu = true; requestAnimationFrame(savasKare); }
}
function hizUygula() { S3.hiz(duraklat ? 0 : hizSecim); document.querySelectorAll('#savas .hizlar .btn').forEach((b, i) => { b.classList.toggle('secik', i + 1 === hizSecim); b.classList.toggle('altin', i + 1 === hizSecim); b.classList.toggle('mor', i + 1 !== hizSecim); }); q('#savas .duraklat .btn').innerHTML = ik(duraklat ? 'oyna' : 'durdur'); }
document.querySelectorAll('#savas .hizlar .btn').forEach((b, i) => b.onclick = () => { hizSecim = i + 1; duraklat = false; hizUygula(); });
q('#savas .duraklat .btn').onclick = () => { duraklat = !duraklat; hizUygula(); };
function kutCiz(kullanan) {
  const sim = savasBilgi && savasBilgi.sim, hazir = sim && sim.kutVar(0) && !kullanan;
  $('kutAlan').innerHTML = hazir
    ? `<div class="kutBant"><b>KUT HAZIR</b><span>Bir kahramanına dokun, yeteneği <em>hemen patlasın</em>. Savaşta 1 kez.</span></div>
       <button class="kut ${kutSecim ? 'secim' : ''}" aria-label="Kut" id="kutDugme"><div class="isin"></div><div class="yz"><big>KUT</big><small>1/1</small></div><div class="el">${ik('el')}</div></button>`
    : `<div class="kutBant bitti"><b>Kut kullanıldı</b><span class="satir"><em>${kullanan ? oyun.birimAd(kullanan.b) : ''}</em></span><span class="satir">Sonraki savaşta yenilenir</span></div>
       <div class="kut bitti"><div class="kullanan">${kullanan ? `<img src="${P(kullanan.b.h)}" alt="">` : ''}</div><span class="sayac">0/1</span><div class="onay">${ik('onay')}</div></div>`;
  $('kutParlama').style.background = hazir ? '' : 'none';
  if ($('kutDugme')) $('kutDugme').onclick = () => { kutSecim = !kutSecim; kutCiz(); bildir('Kut için kendi kahramanına dokun'); };
}
$('tuval3d').addEventListener('pointerdown', (e) => {
  if (!savasBilgi || savasBilgi.bitti) return;
  const r = $('tuval3d').getBoundingClientRect(); const u = S3.dokun(e.clientX - r.left, e.clientY - r.top);
  if (u) { kutSecim = false; savasBilgi.kutCizildi = true; kutCiz(u); }
});
function hudCiz() {
  const sim = savasBilgi.sim, t = Math.max(0, K.savasSuresi - sonDurum.t);
  // Kut motorda kullanıldıysa (dokunuş ya da başka yol) düğmeyi kullanıldı durumuna getir
  if (!sim.kutVar(0) && !savasBilgi.kutCizildi) { savasBilgi.kutCizildi = true; const kay = (oyun._savas && oyun._savas.kayit || []).filter(k => k.taraf === 0).pop(); const u = kay ? sim.birimler.find(o => o.taraf === 0 && o.i === kay.i) : null; kutSecim = false; kutCiz(u || { b: { h: 'golem' } }); }
  const oran = (tr) => { const l = sim.birimler.filter(o => o.taraf === tr); return Math.round(100 * l.reduce((s, o) => s + Math.max(0, o.hp), 0) / Math.max(1, l.reduce((s, o) => s + o.mx, 0))); };
  const a = oran(0), b = oran(1), s = $('savas');
  q('.skor', s).innerHTML = `<div class="taraf"><div class="ust"><span>Sen</span><b>%${a}</b></div><div class="takimCan"><i style="width:${a}%"></i></div></div>
    <div class="saat"><b>0:${String(Math.ceil(t)).padStart(2, '0')}</b><small>kalan</small></div>
    <div class="taraf sag"><div class="ust"><span>Rakip</span><b>%${b}</b></div><div class="takimCan"><i style="width:${b}%"></i></div></div>`;
  const ayk = (ad, cls, tr) => { const l = sim.birimler.filter(o => o.taraf === tr); return `<div class="s ${cls}"><span>${ad}</span>${l.map(o => `<div class="bas ${o.olu ? 'olu' : ''}"><img src="${P(o.b.h)}" alt=""></div>`).join('')}<em>${l.filter(o => !o.olu).length}/${l.length}</em></div>`; };
  $('ayakta').innerHTML = ayk('Sen', 'biz', 0) + ayk('Rakip', 'dus', 1);
}
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
  const r = oyun.savasBitti(sonuc); savasBilgi.sonucIslem = r;
  const M = oyun.M;
  const bil = r && r.duello ? `<span>Düello</span>` : k === 0 ? `<em>+1 zafer · ${r.bitti ? 7 : M.zafer}/7</em>` : k === 1 ? `<span>−1 can · ${r.bitti ? 0 : M.can} can kaldı</span>` : `<span>Berabere: can gitmedi</span>`;
  $('ayakta').style.display = 'none';
  $('sonucYer').innerHTML = `<div class="sonucBant ${k === 1 ? 'yenilgi' : ''}"><b>${k === 0 ? 'ZAFER' : k === 1 ? 'YENİLGİ' : 'BERABERE'}</b><div class="bil">${bil}</div><button class="btn altin" id="sDevam" style="visibility:hidden">Devam ${ik('oyna')}</button></div>`;
  setTimeout(() => { if ($('sDevam')) $('sDevam').style.visibility = ''; }, 400);
  $('sDevam').onclick = async () => {
    S3.temizle(); savasBilgi = null;
    if (r && r.duello) { anaCiz(); goster('ana'); return; }
    if (r && r.bitti) { sonCiz(r); goster('son'); return; }
    await oyun.turBaslat(false); goster('mac'); macCiz();
  };
}

// ── MAÇ SONU ──
function sonCiz(r) {
  const kayip = !r.kazandi, sr = $('sonSerit');
  sr.classList.toggle('kayip', kayip);
  sr.innerHTML = kayip ? `<b>MAÇ BİTTİ</b><span>${r.zafer} zafer · ${r.gecmis.length} tur · iyi dövüştün</span>`
    : `<span class="mad l">${ik('yildiz')}</span><b>ZAFER!</b><span>Arena senin · 7 zafer</span><span class="mad r">${ik('yildiz')}</span>`;
  q('#son .isinlar').style.display = kayip ? 'none' : '';
  const g = r.gecmis.filter(x => x === 0).length, kb = r.gecmis.filter(x => x === 1).length;
  $('ozet').innerHTML = `<div><b style="color:#8dffb0">${g}</b><span>zafer</span></div><div><b style="color:#ff8aa0">${Math.max(0, K.can - kb)}</b><span>can kaldı</span></div><div><b>${r.gecmis.length}</b><span>tur</span></div>`;
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
  q('#son .siradaK').innerHTML = `Eşleşme aralığı: <b>${sayi(Math.max(0, r.kupa - 150))} – ${sayi(r.kupa + 150)}</b> kupa<br>Toplam: <b>${oyun.P.istat.mac}</b> maç, <b>${oyun.P.istat.birinci}</b> birincilik`;
  const se = document.querySelectorAll('#son .sonEylem .btn');
  se[0].onclick = () => { anaCiz(); goster('ana'); };
  se[1].onclick = async () => { await oyun.yeniMac(); goster('mac'); macCiz(); };
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

// ── başlangıç ──
document.title = 'Kut Arena';
anaCiz(); goster('ana');
// arka planda 3D sahneyi ısıt (ilk savaşta bekleme olmasın)
setTimeout(() => { sahneyiHazirla().catch(e => console.error(e)); }, 600);
window.KUT_TEST = { oyun, S3, goster, macCiz };
