/* Kut Arena — açılış yükleme ekranı ve karşılama (ana menü) arka planındaki canlı 3D vitrin.
   Yükleme: yazı tipleri, arayüz görselleri, sesler (önbelleğe ön alım), 3D modeller (sahne3d.yukleme.olay) ve gölgelendirici derlemesi
   gerçek yüzdeyle izlenir; vitrin ilk karesini çizene dek ekran kalır, sonra yumuşakça kaybolur.
   Vitrin: sahne3d'nin dışa açık işlevleriyle kurulur (savasKur + kare + yakinKamera). Motor yerine hiç ilerlemeyen bir "vitrin motoru"
   verilir: kahramanlar tahtaya iner ve boşta animasyonlarını oynar, kamera önlerinde yavaşça salınır. */

export const SURUM = 'v0.9 · Sezon 1 prototip';

// oyun verisine dayalı ipuçları (data.js KURAL ve soy/eşya kuralları)
const IPUCLARI = [
  '3 aynı kahraman birleşip ★2 olur; üç ★2 de ★3.',
  'Gün Batımı: savaşın 30. saniyesinden sonra her saniye bütün hasar +%10 artar. Uzun savaş riskli.',
  'Her 8 altına 1 faiz gelir (en çok 5). Biriktirmek kazandırır.',
  'Aynı soydan 2 ve 4 kahraman, soyun gücünü açar.',
  'Savaşta bir kahramanına dokunup Kut ver: manası dolar, yeteneği hemen açılır.',
  'Her turun alameti savaşı değiştirir: Sis\'te menzilliler 1 kare kısa vurur.',
  '4 altınla 4 deneyim al. Seviye arttıkça tahtaya daha çok kahraman koyarsın.',
  'Art arda kazanmak da kaybetmek de seri altını getirir.',
  'İki bileşen birleşip tam eşya olur; her kahraman 3 eşya taşır.',
  'Dayanıklıları ön sıraya, menzillileri arkaya koy: ön sıra darbeyi karşılar.',
  'Savaş 45 saniye sürer; süre dolunca iki taraf da kaybeder.',
];
// ses.js'in açılışta (ilk dokunuşta) çektiği dosyalar: burada önbelleğe ön alınır, ilk dokunuşta bekleme olmaz
const SESLER = ['vurus_yumruk', 'vurus_pence', 'vurus_isirma', 'atis_buyu', 'atis_ok', 'isabet_buyu', 'kaya_firlat', 'uluma', 'davul', 'can_emme',
  'kasirga', 'boynuz', 'zehir', 'buz', 'ates_halkasi', 'dortnal', 'isik_kanat', 'kara_golge', 'kul_yagmuru', 'ayaz', 'golge_ok', 'yildirim',
  'kut', 'olum', 'dirilis', 'kalkan_kir', 'zafer', 'yenilgi', 'savas_basla', 'satin_al', 'yenile', 'birlesme', 'kaynasma', 'dugme'];
const MUZIKLER = ['hazirlik', 'savas'];

const $ = (id) => document.getElementById(id);

/** Yükleme ekranı iç düzeni (savaş öncesi .yukleniyor da aynı görünümü kullanır). */
export function yukIcerik(baslik = 'Arena hazırlanıyor…') {
  let p = ''; for (let i = 0; i < 12; i++) p += `<i style="--x:${(4 + i * 8.1 + (i % 3) * 2.3).toFixed(1)}%;--g:${(8 + (i * 7) % 6).toFixed(1)}s;--d:-${((i * 5.3) % 11).toFixed(1)}s"></i>`;
  return `<div class="yukArka" aria-hidden="true"></div><div class="huzme"></div><div class="huzme iki"></div><div class="parca" aria-hidden="true">${p}</div>
    <div class="orta"><div class="logoK"><img src="../arayuz/logo.png" alt="Kut Arena"></div>
    <div class="cubuk"><i></i><b>%0</b></div><div class="durum">${baslik}</div>
    <div class="ipucu"><svg class="ik"><use href="#i-isik"/></svg><div><small>İpucu</small><span>${ipucuSec()}</span></div></div></div>`;
}
let ipucuSira = Math.floor(Math.random() * IPUCLARI.length);
function ipucuSec() { ipucuSira = (ipucuSira + 1) % IPUCLARI.length; return IPUCLARI[ipucuSira]; }

/** Bir yükleme ekranı kökünü (#acilis ya da .yukleniyor) yönetir: yüzde, durum yazısı, dönen ipuçları. */
export function yukGosterge(kok) {
  const cubuk = kok.querySelector('.cubuk'), dolu = cubuk.querySelector('i'), yaz = cubuk.querySelector('b'), durum = kok.querySelector('.durum'), ip = kok.querySelector('.ipucu span');
  let son = 0, z = 0;
  const dondur = () => { ip.classList.add('gecis'); setTimeout(() => { ip.textContent = ipucuSec(); ip.classList.remove('gecis'); }, 350); };
  return {
    yuzde(p, metin) {   // geri gitmez (toplam iş yüklendikçe büyüyebilir)
      p = Math.max(son, Math.min(1, p || 0)); son = p;
      dolu.style.setProperty('--p', p.toFixed(4)); yaz.textContent = '%' + Math.floor(p * 100);
      if (metin != null && durum.textContent !== metin) durum.textContent = metin;
    },
    basla() { son = 0; this.yuzde(0); clearInterval(z); z = setInterval(dondur, 4200); },
    dur() { clearInterval(z); },
  };
}

/** Açılış yüklemesi. adimlar: { gorseller: [url], sahne: async (olay) => {} (3D kur; olay(n, top) model ilerlemesi), derle: async () => {} }.
    Ağırlıklar: görseller 12, sesler 12, yazı 4, modeller 58, derleme + ilk kare 14. */
export async function acilisYukle(S3, adimlar) {
  const kok = $('acilis'); if (!kok) return;
  $('acSurum').textContent = SURUM;
  const g = yukGosterge(kok); g.basla();
  const say = { gor: 0, gorT: Math.max(1, adimlar.gorseller.length), ses: 0, sesT: SESLER.length + MUZIKLER.length, yazi: 0, mod: 0, modT: 1, derle: 0 };
  let metin = 'Görseller yükleniyor…';
  const guncelle = () => g.yuzde(0.12 * say.gor / say.gorT + 0.12 * say.ses / say.sesT + 0.04 * say.yazi + 0.58 * Math.min(1, say.mod / say.modT) + 0.14 * say.derle, metin);
  guncelle();
  // görseller: decode() bitince sayılır (hata da sayılır: eksik görsel yüklemeyi kilitlemesin)
  const gorP = Promise.all(adimlar.gorseller.map(u => { const im = new Image(); im.src = u; return (im.decode ? im.decode() : new Promise((ok, red) => { im.onload = ok; im.onerror = red; })).catch(() => {}).then(() => { say.gor++; guncelle(); }); }));
  // sesler: aynı adresi ses.js de ister; tarayıcı önbelleği ikinci isteği karşılar
  const sesP = Promise.all([...SESLER.map(a => 'ses/' + a + '.mp3'), ...MUZIKLER.map(a => 'muzik/' + a + '.mp3')]
    .map(u => fetch(u).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null).then(() => { say.ses++; guncelle(); })));
  const yaziP = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).catch(() => {}).then(() => { say.yazi = 1; guncelle(); });
  // 3D: modeller sahne kurulurken gelir; toplam iş sayısı istekler başladıkça büyür
  const eskiOlay = S3.yukleme.olay;
  S3.yukleme.olay = (n, top) => { say.mod = n; say.modT = Math.max(top, say.modT); metin = `Kahramanlar ve arena yükleniyor… ${n}/${top}`; guncelle(); };
  let sahneHata = null;
  const sahneP = (async () => {
    try {
      await adimlar.sahne();
      say.mod = say.modT; metin = 'Gölgelendiriciler derleniyor…'; guncelle();
      await bekleKare(); await adimlar.derle(); say.derle = 1; guncelle();
    } catch (e) { sahneHata = e; console.error(e); say.mod = say.modT; say.derle = 1; guncelle(); }
  })();
  await Promise.all([gorP, yaziP, sahneP, Promise.race([sesP, uyku(12000)])]);   // ses ön alımı yavaş ağda en çok 12 sn bekletir
  S3.yukleme.olay = eskiOlay;
  metin = 'Hazır!'; g.yuzde(1, metin);
  await uyku(250);
  g.dur();
  return { hata: sahneHata };
}
export function acilisKapat() {
  const kok = $('acilis'); if (!kok) return;
  kok.classList.add('bitti');
  setTimeout(() => { kok.style.display = 'none'; kok.innerHTML = ''; }, 800);   // döngüdeki CSS animasyonları da durur
}
const uyku = (ms) => new Promise(ok => setTimeout(ok, ms));
const bekleKare = () => new Promise(ok => requestAnimationFrame(() => ok()));

// ── Vitrin (ana menü arkasındaki 3D sahne) ──
// Yerleşim: motor koordinatı (x sütun 0..3, kesirli olabilir; y sıra 0 ön). Merkezdeki kahraman en önde, kanatlar geride (ok ucu).
const DIZILIS = [{ x: 1.5, y: 0 }, { x: 0.3, y: 1 }, { x: 2.7, y: 1 }, { x: -0.3, y: 2 }, { x: 3.3, y: 2 }];   // sıra (y) tamsayı olmalı (sahne sıra → z tablosu)
// ms: bu sürede bir yeni kahramanlar iner (bellek de sıfırlanır); arada karşılama çizimi (karsilama_arka) ARKA_SURE kadar görünür
const VITRIN_SURE = 42000, ARKA_SURE = 6500;
// kamera [uzaklık, yükseklik, bakış yüksekliği] ekran oranına göre; salınım (rad)
const KAM = { orta: [5.5, 2.6, 1.15], dar: [6.2, 2.9, 1.2], genis: [5.5, 2.4, 1.0], salinim: 0.3 };

/** Hiç ilerlemeyen motor: sahne birimleri bekleme pozunda tutar (savaş yok, olay yok, bitmez). */
function vitrinMotoru(SIM, takim) {
  const ger = SIM.Savas(takim, [], { tohum: 7 });
  for (const u of ger.birimler) u.kalkan = 0;   // soy/eşya başlangıç kalkanları vitrinde baloncuk gibi görünmesin
  let t = 0; const fx = [];
  return { birimler: ger.birimler, fx, bitti: false, sonuc: null, get t() { return t; }, adim() { t += 0.05; }, kutVar: () => false, kut: () => false };
}

export function vitrinKur({ S3, SIM, D, tuval }) {
  let acik = false, dongu = false, kurulum = null, kuruldu = 0, merkez = -1, kimler = [], gecis = false, sonSecim = [], sure = VITRIN_SURE;
  const ad = (id) => (D.kahraman(id) || { ad: id }).ad;
  function sec() {
    const tum = D.KAHRAMANLAR.map(h => h.id).filter(id => !sonSecim.includes(id));
    for (let i = tum.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tum[i], tum[j]] = [tum[j], tum[i]]; }
    // merkeze bir 3. kademe; yanlara karışık
    const k3 = D.KAHRAMANLAR.filter(h => h.kademe === 3 && !sonSecim.includes(h.id)).map(h => h.id);
    const m = k3[Math.floor(Math.random() * k3.length)] || tum[0];
    const digr = tum.filter(id => id !== m).slice(0, DIZILIS.length - 1);
    sonSecim = [m, ...digr];
    return sonSecim;
  }
  async function kur() {
    const ids = sec();
    const takim = ids.map((h, i) => ({ h, s: i === 0 ? 3 : (i < 3 ? 2 : 1), x: DIZILIS[i].x, y: DIZILIS[i].y }));
    const motor = vitrinMotoru(SIM, takim);
    S3.boyutla();
    await S3.savasKur(motor);
    merkez = motor.birimler[0].uid; kimler = ids; kuruldu = performance.now();
    const ya = document.querySelector('#ana .sahneAd');
    if (ya) ya.innerHTML = `<span><b>${ad(ids[0])}</b> · ${ids.slice(1).map(ad).join(' · ')}</span>`;
  }
  let ortulu = false;
  function gecisBitir() { gecis = false; ortulu = false; tuval.parentElement.classList.remove('vitrinGecis'); document.body.classList.remove('vitrinArka'); }
  function yenidenKur() { kurulum = kur().catch(e => { console.error(e); }).finally(() => { kurulum = null; }); return kurulum; }
  // kamera: merkez kahramanın önünde (rakip tarafı, -z), yavaş salınım. kameraYerlestir yalnız geniş açıyı (50°) kurar, konumu yakinKamera verir.
  // Uzaklık/yükseklik ekran oranına göre: kahramanlar logo ile alt düğmeler arasındaki bantta kalsın.
  const kamera = (sn) => {
    if (merkez < 0) return;
    const w = tuval.clientWidth || 1, h = tuval.clientHeight || 1, oran = w / h;
    const k = oran > 2.1 ? KAM.genis : oran < 1.45 ? KAM.dar : KAM.orta;
    S3.kameraYerlestir(5, -7);
    S3.yakinKamera(merkez, k[0], Math.PI + Math.sin(sn * 0.12) * KAM.salinim, k[1] + Math.sin(sn * 0.07) * 0.15, k[2]);
  };
  function kare() {
    if (!acik) { dongu = false; return; }
    const simdi = performance.now();
    if (!kurulum && !gecis && kuruldu && simdi - kuruldu > sure && !document.hidden) {
      // yeni kahramanlar: karşılama çizimi yavaşça örter ve Ken Burns ile bir süre kalır (bu arada 3D çizilmez);
      // yeni kahramanlar kurulunca çizim çekilir, kahramanlar iner
      gecis = true; document.body.classList.add('vitrinArka');
      setTimeout(() => {
        if (!acik) return gecisBitir();
        ortulu = true; tuval.parentElement.classList.add('vitrinGecis');
        setTimeout(() => { if (!acik) return gecisBitir(); yenidenKur().then(gecisBitir); }, ARKA_SURE);
      }, 950);
    }
    if (!kurulum && !ortulu) { kamera(simdi / 1000); S3.kare(); }
    requestAnimationFrame(kare);
  }
  return {
    /** İlk kurulum (yükleme ekranında): modeller ve ilk karenin gölgelendiricileri. */
    async hazirla() { await yenidenKur(); kamera(performance.now() / 1000); },
    /** Yükleme ekranı kalkmadan önce birkaç kare çiz (derleme + giriş inişinin ilk anı). */
    async isit() { for (let i = 0; i < 3; i++) { kamera(performance.now() / 1000); S3.kare(); await new Promise(ok => requestAnimationFrame(ok)); } },
    ac() {
      if (acik) return; acik = true; document.body.classList.add('menu3d');
      if (merkez < 0 || !kuruldu) { if (!kurulum) yenidenKur(); } else { S3.boyutla(); kuruldu = performance.now(); }   // vitrin süresi menü açıldığında yeniden başlar
      if (!dongu) { dongu = true; requestAnimationFrame(kare); }
    },
    kapat() { acik = false; document.body.classList.remove('menu3d', 'vitrinArka'); },
    /** Savaş kurulmadan önce: süren vitrin kurulumu bitsin (iki savasKur üst üste binmesin), sonra vitrin temizlenir. */
    async bekle() { if (kurulum) await kurulum; kuruldu = 0; merkez = -1; },
    get acik() { return acik; },
    get kimler() { return kimler.slice(); },
    set sure(ms) { sure = ms; },   // test: değişimi ertele
  };
}
