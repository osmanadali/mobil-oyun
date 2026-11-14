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
    atli:     { ad: 'Çevik',    emoji: '🐾', esik: [2, 4], aciklama: ['İlk 4 sn +%40 saldırı hızı', 'İlk 4 sn +%90 saldırı hızı'] },
  };

  // ── Kahramanlar: element yaratıkları ve büyülü hayvanlar. İnsan yok: cinsiyet, ırk, milliyet taşımazlar (evrensel). ──
  // kademe: 1–3 (fiyat = kademe). menzil hücre cinsinden. as = saniyede saldırı. mana: yetenek için gereken.
  // yetenek: aktif (mana dolunca). pasif: hep açık. Kaynaşmada biri yeteneği, öbürü pasifi verir.
  const KAHRAMANLAR = [
    { id: 'golem', ad: 'Kaya Golemi', emoji: '🪨', renk: '#a3775a', kademe: 1, soy: ['yer', 'dev'],        can: 820, atk: 48, as: 0.65, menzil: 1, mana: 80,  yetenek: 'tasFirlat',  pasif: 'tasDeri' },
    { id: 'kurt', ad: 'Kristal Kurt', emoji: '🐺', renk: '#8c97a8', kademe: 1, soy: ['atli', 'avci'],      can: 520, atk: 52, as: 0.95, menzil: 1, mana: 60,  yetenek: 'uluma',      pasif: 'suru' },
    { id: 'kurbaga', ad: 'Davulcu Kurbağa', emoji: '🐸', renk: '#c9a24a', kademe: 1, soy: ['bilge', 'gok'],      can: 500, atk: 38, as: 0.70, menzil: 3, mana: 60,  yetenek: 'davul',      pasif: 'ruhBagi' },
    { id: 'yarasa', ad: 'Sis Yarasası', emoji: '🦇', renk: '#b4435a', kademe: 1, soy: ['karanlik', 'su'],    can: 500, atk: 50, as: 0.85, menzil: 1, mana: 70,  yetenek: 'ruhEmme',    pasif: 'canEmici' },
    { id: 'ruzgar', ad: 'Rüzgâr Ruhu', emoji: '🌪️', renk: '#7fc8c0', kademe: 1, soy: ['gok', 'avci'],       can: 430, atk: 44, as: 0.90, menzil: 3, mana: 80,  yetenek: 'kasirga',    pasif: 'kacis' },
    { id: 'koc', ad: 'Dağ Koçu', emoji: '🐏', renk: '#d06a3c', kademe: 2, soy: ['yer', 'atli'],       can: 680, atk: 62, as: 0.85, menzil: 1, mana: 90,  yetenek: 'deliOfke',   pasif: 'deliCesaret' },
    { id: 'yilan', ad: 'Zümrüt Yılan', emoji: '🐍', renk: '#5aa86a', kademe: 2, soy: ['su', 'bilge'],       can: 560, atk: 40, as: 0.75, menzil: 3, mana: 80,  yetenek: 'zehir',      pasif: 'zehirDis' },
    { id: 'kaplumbaga', ad: 'Buz Kaplumbağası', emoji: '🐢', renk: '#7aa6d6', kademe: 2, soy: ['kis', 'dev'],        can: 860, atk: 46, as: 0.60, menzil: 1, mana: 90,  yetenek: 'buzNefes',   pasif: 'soguk' },
    { id: 'semender', ad: 'Kor Semenderi', emoji: '🦎', renk: '#ef8a3a', kademe: 2, soy: ['ates', 'su'],        can: 600, atk: 42, as: 0.75, menzil: 2, mana: 90,  yetenek: 'ocak',       pasif: 'sicakKalp' },
    { id: 'bulutat', ad: 'Bulut Atı', emoji: '🦄', renk: '#e7d9b5', kademe: 2, soy: ['gok', 'atli'],       can: 540, atk: 58, as: 1.00, menzil: 1, mana: 70,  yetenek: 'dortnal',    pasif: 'ruzgar' },
    { id: 'kugu', ad: 'Işık Kuğusu', emoji: '🦢', renk: '#f1e7a6', kademe: 3, soy: ['gok', 'su'],         can: 640, atk: 38, as: 0.70, menzil: 3, mana: 90,  yetenek: 'kanat',      pasif: 'ana' },
    { id: 'ayi', ad: 'Gece Ayısı', emoji: '🐻', renk: '#5b3f7a', kademe: 3, soy: ['karanlik', 'dev'],   can: 920, atk: 60, as: 0.70, menzil: 1, mana: 100, yetenek: 'karaGolge',  pasif: 'karanlikPay' },
    { id: 'anka', ad: 'Anka', emoji: '🐦‍🔥', renk: '#ff6a3d', kademe: 3, soy: ['ates', 'gok'],     can: 600, atk: 56, as: 0.80, menzil: 3, mana: 100, yetenek: 'kulDogus',   pasif: 'yenidenDogus' },
    { id: 'baykus', ad: 'Ayaz Baykuşu', emoji: '🦉', renk: '#bfe0ff', kademe: 3, soy: ['kis', 'bilge'],      can: 560, atk: 42, as: 0.70, menzil: 3, mana: 100, yetenek: 'ayaz',       pasif: 'kisNefesi' },
    { id: 'tilki', ad: 'Gölge Tilki', emoji: '🦊', renk: '#4a5578', kademe: 3, soy: ['karanlik', 'avci'],  can: 520, atk: 70, as: 0.85, menzil: 3, mana: 80,  yetenek: 'golgeOk',    pasif: 'avKoku' },
    { id: 'ejder', ad: 'Fırtına Ejderi', emoji: '🐉', renk: '#ffd84a', kademe: 3, soy: ['ates', 'bilge'],     can: 560, atk: 46, as: 0.75, menzil: 3, mana: 110, yetenek: 'yildirim',   pasif: 'gokGurultu' },
  ];

  // ── Yetenek / pasif metinleri (kart ve bilgi penceresi için). Sayılar ★1 değeri; ★2 ×1.8, ★3 ×3. ──
  const YETENEK = {
    tasFirlat: { ad: 'Kaya Fırlat',  m: 'Hedefe 200 hasar, 1,5 sn sersemletir.' },
    uluma:     { ad: 'Uluma',        m: 'Kendisi ve 2 hücredeki dostlar 4 sn +%45 saldırı hızı.' },
    davul:     { ad: 'Savaş Davulu', m: 'Bütün dostlar 4 sn +%30 hasar.' },
    ruhEmme:   { ad: 'Can Emme',     m: 'Hedefe 170 hasar, o kadar can kazanır.' },
    kasirga:   { ad: 'Kasırga',      m: 'Hedef çevresindekilere 110 hasar, onları 1,5 hücre iter.' },
    deliOfke:  { ad: 'Boynuz Öfkesi',    m: 'Sonraki 3 vuruşu 2 kat, canının %20’sini yeniler.' },
    zehir:     { ad: 'Zümrüt Zehri',          m: 'Hedefi 4 sn zehirler (55/sn), en yaralı dosta 160 can.' },
    buzNefes:  { ad: 'Buz Nefesi',   m: 'Hedef çevresine 120 hasar, 1,2 sn dondurur.' },
    ocak:      { ad: 'Kor Halkası',         m: '2 hücredeki düşmanları 4 sn yakar (40/sn), dostlara 110 can.' },
    dortnal:   { ad: 'Bulut Hücumu',      m: 'En arka düşmana atılır, 190 hasar.' },
    kanat:     { ad: 'Işık Kanadı', m: 'Bütün dostlara 140 kalkan.' },
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
    deliCesaret:  { ad: 'Gözü Kara',  m: 'Canı yarının altındayken +%50 hasar.' },
    zehirDis:     { ad: 'Zehirli Diş',   m: 'Vuruşları 3 sn zehirler (18/sn).' },
    soguk:        { ad: 'Soğuk Dokunuş', m: 'Vuruşları 2 sn -%20 saldırı hızı verir.' },
    sicakKalp:    { ad: 'Sıcak Kalp',    m: 'Saniyede %3 can yeniler.' },
    ruzgar:       { ad: 'Rüzgâr Ayak',   m: 'İlk 5 sn +%35 saldırı hızı.' },
    ana:          { ad: 'Koruyucu Tüy',   m: 'Savaş başında komşu dostlara 90 kalkan.' },
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

  // ── Hızlı Maç: prototipin kuralları (her tur 10 altın, seviye yok, 5 can / 7 zafer, tura bağlı takım ve dükkân) ──
  const HIZLI = {
    altinTur: 10,           // her tur yeniden 10 altın (faiz yok → kartopu yok, geride kalan toparlar)
    yenile: 1, kaynastir: 3,
    yedek: 4,
    can: 5, zaferHedef: 7,  // 5 can, 7 zafer: bir maç en fazla 11 tur (~6–8 dk)
    yuva: (tur) => Math.min(6, 2 + Math.ceil(tur / 2)), // takım sınırı: 3,3,4,4,5,5,6…
    kademeOlasilik(tur) {   // dükkân kademe olasılıkları [k1,k2,k3]
      if (tur <= 2) return [1, 0, 0];
      if (tur <= 4) return [0.65, 0.35, 0];
      if (tur <= 6) return [0.45, 0.4, 0.15];
      if (tur <= 8) return [0.3, 0.4, 0.3];
      return [0.2, 0.35, 0.45];
    },
  };

  // ── Seviyeye bağlı dükkân olasılıkları (OYNANIS_DERINLIK.md 2.2). Satır = seviye, sütun = kademe (K1, K2, K3). ──
  // Kademe sayısı tablodan okunur (sabit 3 yazılmaz); 5 kademe gelince sütunlar uzar.
  const KADEME_OLASILIK = {
    2: [1, 0, 0],
    3: [0.75, 0.25, 0],
    4: [0.55, 0.4, 0.05],
    5: [0.4, 0.45, 0.15],
    6: [0.3, 0.45, 0.25],
    7: [0.2, 0.4, 0.4],
    8: [0.15, 0.35, 0.5],
  };

  // ── Asıl oyunun kuralları (OYNANIS_DERINLIK.md 12.1). Hızlı Maç kuralları KURAL.hizli altında. ──
  const KURAL = {
    // ortak
    satisIade: 1, dukkan: 5,
    yildizCarpan: [0, 1, 1.8, 3],
    savasSuresi: 30,        // sn; sonunda kalan can yüzdesi karar verir
    // tahta: 4 sütun × 3 sıra (ön, orta, arka); en çok 8 kahraman
    tahtaSutun: 4, tahtaSira: 3, takimTavan: 8,
    yedek: 7,
    // seviye ve deneyim (bölüm 2.1)
    canBaslangic: 100,
    seviyeBaslangic: 2, seviyeTavan: 8,
    xpTablo: [0, 0, 2, 6, 10, 20, 32, 48], // indeks = mevcut seviye → sonraki seviyeye gereken deneyim
    pasifXp: 2,             // her savaş turu sonunda (ilk tur hariç)
    xpBedel: 4, xpMiktar: 4, // 4 altın = 4 deneyim
    takimBoyutu: (sv) => sv,
    kademeOlasilik(sv) { return KADEME_OLASILIK[Math.max(2, Math.min(8, sv))]; },
    // sınırlı kahraman havuzu (bölüm 2.3): kademe → kopya sayısı
    havuzAdet: { 1: 22, 2: 18, 3: 14 },
    yildizKopya: [0, 1, 3, 9], // ★1 = 1, ★2 = 3, ★3 = 9 kopya
    hizli: HIZLI,
  };

  const api = { SOYLAR, KAHRAMANLAR, YETENEK, PASIF, ALAMETLER, KURAL, KADEME_OLASILIK,
    kahraman: (id) => KAHRAMANLAR.find(k => k.id === id) };
  g.KUT_DATA = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
