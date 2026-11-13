/* KUT ARENA — oyun verisi (kahramanlar, soylar, alametler).
   Görseller yer tutucudur: her kahramanın `emoji` + `renk` alanı, çizim gelince `gorsel` alanıyla değiştirilecek. */
(function (g) {
  // ── Soylar (sinerji). Her kahraman 2 soy taşır; Kaynaşmış kahraman 4'e kadar taşır. ──
  const SOYLAR = {
    gok:      { ad: 'Gök',      emoji: '☁️', esik: [2, 4], aciklama: ['+%15 saldırı hızı', '+%35 saldırı hızı'] },
    yer:      { ad: 'Yer',      emoji: '⛰️', esik: [2, 4], aciklama: ['+150 can', '+400 can'] },
    ates:     { ad: 'Od',       emoji: '🔥', esik: [2, 4], aciklama: ['Vuruşlar 2 sn yakar (12/sn)', 'Vuruşlar 3 sn yakar (28/sn)'] },
    su:       { ad: 'Su',       emoji: '💧', esik: [2, 4], aciklama: ['Saniyede %2 can yeniler', 'Saniyede %5 can yeniler'] },
    kis:      { ad: 'Ayaz',     emoji: '❄️', esik: [2, 4], aciklama: ['Düşman saldırı hızı -%15', 'Düşman saldırı hızı -%30'] },
    karanlik: { ad: 'Karanlık', emoji: '🌑', esik: [2, 4], aciklama: ['Canı yarının altındakine +%20 hasar', '+%50 hasar'] },
    dev:      { ad: 'Dev',      emoji: '🗿', esik: [2, 4], aciklama: ['Alınan hasar -%12', 'Alınan hasar -%28'] },
    avci:     { ad: 'Avcı',     emoji: '🏹', esik: [2, 4], aciklama: ['+%20 hasar', '+%45 hasar'] },
    bilge:    { ad: 'Bilge',    emoji: '📜', esik: [2, 4], aciklama: ['+%30 mana kazanımı', '+%70 mana kazanımı'] },
    atli:     { ad: 'Atlı',     emoji: '🐎', esik: [2, 4], aciklama: ['İlk 4 sn +%40 saldırı hızı', 'İlk 4 sn +%90 saldırı hızı'] },
  };

  // ── Kahramanlar: Türk-Altay ve Anadolu halk anlatılarından özgün yorumlar. ──
  // kademe: 1–3 (fiyat = kademe). menzil hücre cinsinden. as = saniyede saldırı. mana: yetenek için gereken.
  // yetenek: aktif (mana dolunca). pasif: hep açık. Kaynaşmada biri yeteneği, öbürü pasifi verir.
  const KAHRAMANLAR = [
    { id: 'tepegoz',  ad: 'Tepegöz',      emoji: '👁️', renk: '#a3775a', kademe: 1, soy: ['yer', 'dev'],        can: 820, atk: 48, as: 0.65, menzil: 1, mana: 80,  yetenek: 'tasFirlat',  pasif: 'tasDeri' },
    { id: 'bozkurt',  ad: 'Bozkurt',      emoji: '🐺', renk: '#8c97a8', kademe: 1, soy: ['atli', 'avci'],      can: 520, atk: 52, as: 0.95, menzil: 1, mana: 60,  yetenek: 'uluma',      pasif: 'suru' },
    { id: 'kam',      ad: 'Kam',          emoji: '🥁', renk: '#c9a24a', kademe: 1, soy: ['bilge', 'gok'],      can: 500, atk: 38, as: 0.70, menzil: 3, mana: 60,  yetenek: 'davul',      pasif: 'ruhBagi' },
    { id: 'alkarisi', ad: 'Alkarısı',     emoji: '🩸', renk: '#b4435a', kademe: 1, soy: ['karanlik', 'su'],    can: 500, atk: 50, as: 0.85, menzil: 1, mana: 70,  yetenek: 'ruhEmme',    pasif: 'canEmici' },
    { id: 'yelana',   ad: 'Yel Ana',      emoji: '🌪️', renk: '#7fc8c0', kademe: 1, soy: ['gok', 'avci'],       can: 430, atk: 44, as: 0.90, menzil: 3, mana: 80,  yetenek: 'kasirga',    pasif: 'kacis' },
    { id: 'dumrul',   ad: 'Deli Dumrul',  emoji: '⚔️', renk: '#d06a3c', kademe: 2, soy: ['yer', 'atli'],       can: 680, atk: 62, as: 0.85, menzil: 1, mana: 90,  yetenek: 'deliOfke',   pasif: 'deliCesaret' },
    { id: 'sahmeran', ad: 'Şahmeran',     emoji: '🐍', renk: '#5aa86a', kademe: 2, soy: ['su', 'bilge'],       can: 560, atk: 40, as: 0.75, menzil: 3, mana: 80,  yetenek: 'zehir',      pasif: 'zehirDis' },
    { id: 'karakon',  ad: 'Karakoncolos', emoji: '🧊', renk: '#7aa6d6', kademe: 2, soy: ['kis', 'dev'],        can: 860, atk: 46, as: 0.60, menzil: 1, mana: 90,  yetenek: 'buzNefes',   pasif: 'soguk' },
    { id: 'odana',    ad: 'Od Ana',       emoji: '🕯️', renk: '#ef8a3a', kademe: 2, soy: ['ates', 'su'],        can: 600, atk: 42, as: 0.75, menzil: 2, mana: 90,  yetenek: 'ocak',       pasif: 'sicakKalp' },
    { id: 'tulpar',   ad: 'Tulpar',       emoji: '🦄', renk: '#e7d9b5', kademe: 2, soy: ['gok', 'atli'],       can: 540, atk: 58, as: 1.00, menzil: 1, mana: 70,  yetenek: 'dortnal',    pasif: 'ruzgar' },
    { id: 'umay',     ad: 'Umay Ana',     emoji: '🕊️', renk: '#f1e7a6', kademe: 3, soy: ['gok', 'su'],         can: 640, atk: 38, as: 0.70, menzil: 3, mana: 90,  yetenek: 'kanat',      pasif: 'ana' },
    { id: 'erlik',    ad: 'Erlik Han',    emoji: '👑', renk: '#5b3f7a', kademe: 3, soy: ['karanlik', 'dev'],   can: 920, atk: 60, as: 0.70, menzil: 1, mana: 100, yetenek: 'karaGolge',  pasif: 'karanlikPay' },
    { id: 'anka',     ad: 'Zümrüd-ü Anka', emoji: '🐦‍🔥', renk: '#ff6a3d', kademe: 3, soy: ['ates', 'gok'],     can: 600, atk: 56, as: 0.80, menzil: 3, mana: 100, yetenek: 'kulDogus',   pasif: 'yenidenDogus' },
    { id: 'ayazata',  ad: 'Ayaz Ata',     emoji: '🧙', renk: '#bfe0ff', kademe: 3, soy: ['kis', 'bilge'],      can: 560, atk: 42, as: 0.70, menzil: 3, mana: 100, yetenek: 'ayaz',       pasif: 'kisNefesi' },
    { id: 'albasti',  ad: 'Albastı',      emoji: '🌘', renk: '#4a5578', kademe: 3, soy: ['karanlik', 'avci'],  can: 520, atk: 70, as: 0.85, menzil: 3, mana: 80,  yetenek: 'golgeOk',    pasif: 'avKoku' },
    { id: 'kayra',    ad: 'Kayra Han',    emoji: '⚡', renk: '#ffd84a', kademe: 3, soy: ['ates', 'bilge'],     can: 560, atk: 46, as: 0.75, menzil: 3, mana: 110, yetenek: 'yildirim',   pasif: 'gokGurultu' },
  ];

  // ── Yetenek / pasif metinleri (kart ve bilgi penceresi için). Sayılar ★1 değeri; ★2 ×1.8, ★3 ×3. ──
  const YETENEK = {
    tasFirlat: { ad: 'Kaya Fırlat',  m: 'Hedefe 200 hasar, 1,5 sn sersemletir.' },
    uluma:     { ad: 'Uluma',        m: 'Kendisi ve 2 hücredeki dostlar 4 sn +%45 saldırı hızı.' },
    davul:     { ad: 'Şaman Davulu', m: 'Bütün dostlar 4 sn +%30 hasar.' },
    ruhEmme:   { ad: 'Ruh Emme',     m: 'Hedefe 170 hasar, o kadar can kazanır.' },
    kasirga:   { ad: 'Kasırga',      m: 'Hedef çevresindekilere 110 hasar, onları 1,5 hücre iter.' },
    deliOfke:  { ad: 'Deli Öfke',    m: 'Sonraki 3 vuruşu 2 kat, canının %20’sini yeniler.' },
    zehir:     { ad: 'Ağı',          m: 'Hedefi 4 sn zehirler (55/sn), en yaralı dosta 160 can.' },
    buzNefes:  { ad: 'Buz Nefesi',   m: 'Hedef çevresine 120 hasar, 1,2 sn dondurur.' },
    ocak:      { ad: 'Ocak',         m: '2 hücredeki düşmanları 4 sn yakar (40/sn), dostlara 110 can.' },
    dortnal:   { ad: 'Dörtnal',      m: 'En arka düşmana atılır, 190 hasar.' },
    kanat:     { ad: 'Umay’ın Kanadı', m: 'Bütün dostlara 140 kalkan.' },
    karaGolge: { ad: 'Kara Gölge',   m: 'En güçlü düşmana 140 hasar, 5 sn -%45 hasar.' },
    kulDogus:  { ad: 'Kül Yağmuru',  m: 'Hedef çevresine 170 hasar ve 3 sn yanık.' },
    ayaz:      { ad: 'Ayaz',         m: 'Bütün düşmanlara 70 hasar, 3 sn -%40 saldırı hızı.' },
    golgeOk:   { ad: 'Gölge Oku',    m: 'Canı en az düşmana 320 hasar.' },
    yildirim:  { ad: 'Yıldırım',     m: '3 rastgele düşmana 150 hasar, 0,6 sn sersemletir.' },
  };
  const PASIF = {
    tasDeri:      { ad: 'Taş Deri',      m: 'Alınan hasar -%20.' },
    suru:         { ad: 'Sürü',          m: 'Yaşayan her dost için +%6 hasar.' },
    ruhBagi:      { ad: 'Ruh Bağı',      m: 'Bir dost ölünce 35 mana kazanır.' },
    canEmici:     { ad: 'Can Emici',     m: 'Verdiği hasarın %20’si kadar can kazanır.' },
    kacis:        { ad: 'Yel Gibi',      m: 'Vuruşların %25’inden kaçar.' },
    deliCesaret:  { ad: 'Deli Cesaret',  m: 'Canı yarının altındayken +%50 hasar.' },
    zehirDis:     { ad: 'Zehirli Diş',   m: 'Vuruşları 3 sn zehirler (18/sn).' },
    soguk:        { ad: 'Soğuk Dokunuş', m: 'Vuruşları 2 sn -%20 saldırı hızı verir.' },
    sicakKalp:    { ad: 'Sıcak Kalp',    m: 'Saniyede %3 can yeniler.' },
    ruzgar:       { ad: 'Rüzgâr Ayak',   m: 'İlk 5 sn +%35 saldırı hızı.' },
    ana:          { ad: 'Ana Şefkati',   m: 'Savaş başında komşu dostlara 90 kalkan.' },
    karanlikPay:  { ad: 'Karanlık Pay',  m: 'Her düşman ölümünde +%12 hasar (birikir).' },
    yenidenDogus: { ad: 'Yeniden Doğuş', m: 'İlk ölümde %40 canla dirilir.' },
    kisNefesi:    { ad: 'Kış Nefesi',    m: 'Savaşa %50 mana ile başlar.' },
    avKoku:       { ad: 'Av Kokusu',     m: 'Canı %30’un altındaki düşmana 2 kat hasar.' },
    gokGurultu:   { ad: 'Gök Gürültüsü', m: 'Her 4. vuruş yakındaki 2 düşmana sıçrar.' },
  };

  // ── Alametler: her tur başında görünen tur kuralı (taslağı her tur değiştirir). ──
  const ALAMETLER = [
    { id: 'yok',      ad: 'Durgun Gök',   emoji: '🌤️', m: 'Bu tur özel bir şey yok.' },
    { id: 'kanAyi',   ad: 'Kan Ayı',      emoji: '🌕', m: 'Herkes +%20 hasar verir.' },
    { id: 'sis',      ad: 'Sis',          emoji: '🌫️', m: 'Menzilliler -1 menzil.' },
    { id: 'tipi',     ad: 'Tipi',         emoji: '🌨️', m: 'Herkes -%20 saldırı hızı; Ayaz soyu etkilenmez.' },
    { id: 'kutYagmur',ad: 'Kut Yağmuru',  emoji: '✨', m: 'Herkes savaşa %40 mana ile başlar.' },
    { id: 'pazar',    ad: 'Bereketli Pazar', emoji: '🪙', m: 'Bu tur +2 altın.' },
    { id: 'tutulma',  ad: 'Tutulma',      emoji: '🌒', m: 'Karanlık soyu +%30 can.' },
    { id: 'yaz',      ad: 'Yaz Sıcağı',   emoji: '☀️', m: 'Od soyu 2 kat yakar; Ayaz soyu -%15 can.' },
  ];

  // ── Dengeli sabitler ──
  const KURAL = {
    altinTur: 10,           // her tur yeniden 10 altın (faiz yok → kartopu yok, geride kalan toparlar)
    yenile: 1, kaynastir: 3, satisIade: 1,
    dukkan: 5, yedek: 4,
    can: 5, zaferHedef: 7,  // 5 can, 7 zafer: bir maç en fazla 11 tur (~6–8 dk)
    yuva: (tur) => Math.min(6, 2 + Math.ceil(tur / 2)), // takım sınırı: 3,3,4,4,5,5,6…
    kademeOlasilik(tur) {   // dükkân kademe olasılıkları [k1,k2,k3]
      if (tur <= 2) return [1, 0, 0];
      if (tur <= 4) return [0.65, 0.35, 0];
      if (tur <= 6) return [0.45, 0.4, 0.15];
      if (tur <= 8) return [0.3, 0.4, 0.3];
      return [0.2, 0.35, 0.45];
    },
    yildizCarpan: [0, 1, 1.8, 3],
    savasSuresi: 30,        // sn; sonunda kalan can yüzdesi karar verir
  };

  const api = { SOYLAR, KAHRAMANLAR, YETENEK, PASIF, ALAMETLER, KURAL,
    kahraman: (id) => KAHRAMANLAR.find(k => k.id === id) };
  g.KUT_DATA = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
