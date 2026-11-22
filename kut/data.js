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
    atli:     { ad: 'Çevik',    emoji: '🐾', esik: [2, 4], aciklama: ['İlk 6 sn +%30 saldırı hızı', 'İlk 6 sn +%60 saldırı hızı'] },
  };

  // ── Kahramanlar: element yaratıkları ve büyülü hayvanlar. İnsan yok: cinsiyet, ırk, milliyet taşımazlar (evrensel). ──
  // kademe: 1–3 (fiyat = kademe). menzil hücre cinsinden. as = saniyede saldırı. mana: yetenek için gereken.
  // yetenek: aktif (mana dolunca). pasif: hep açık. Kaynaşmada biri yeteneği, öbürü pasifi verir.
  const KAHRAMANLAR = [
    { id: 'golem', ad: 'Kaya Golemi', emoji: '🪨', renk: '#a3775a', kademe: 1, soy: ['yer', 'dev'],        can: 980, atk: 38, as: 0.50, menzil: 1, mana: 80,  yetenek: 'tasFirlat',  pasif: 'tasDeri' },
    { id: 'kurt', ad: 'Kristal Kurt', emoji: '🐺', renk: '#8c97a8', kademe: 1, soy: ['atli', 'avci'],      can: 728, atk: 46, as: 0.85, menzil: 1, mana: 60,  yetenek: 'uluma',      pasif: 'suru' },
    { id: 'kurbaga', ad: 'Davulcu Kurbağa', emoji: '🐸', renk: '#c9a24a', kademe: 1, soy: ['bilge', 'gok'],      can: 930, atk: 49, as: 0.65, menzil: 3, mana: 70,  yetenek: 'davul',      pasif: 'ruhBagi' },
    { id: 'yarasa', ad: 'Sis Yarasası', emoji: '🦇', renk: '#b4435a', kademe: 1, soy: ['karanlik', 'su'],    can: 700, atk: 42, as: 0.80, menzil: 1, mana: 80,  yetenek: 'ruhEmme',    pasif: 'canEmici' },
    { id: 'ruzgar', ad: 'Rüzgâr Ruhu', emoji: '🌪️', renk: '#7fc8c0', kademe: 1, soy: ['gok', 'avci'],       can: 602, atk: 45, as: 0.70, menzil: 3, mana: 80,  yetenek: 'kasirga',    pasif: 'kacis' },
    { id: 'koc', ad: 'Dağ Koçu', emoji: '🐏', renk: '#d06a3c', kademe: 2, soy: ['yer', 'atli'],       can: 952, atk: 68, as: 0.60, menzil: 1, mana: 90,  yetenek: 'deliOfke',   pasif: 'deliCesaret' },
    { id: 'yilan', ad: 'Zümrüt Yılan', emoji: '🐍', renk: '#5aa86a', kademe: 2, soy: ['su', 'bilge'],       can: 854, atk: 41, as: 0.60, menzil: 3, mana: 80,  yetenek: 'zehir',      pasif: 'zehirDis' },
    { id: 'kaplumbaga', ad: 'Buz Kaplumbağası', emoji: '🐢', renk: '#7aa6d6', kademe: 2, soy: ['kis', 'dev'],        can: 1148, atk: 41, as: 0.45, menzil: 1, mana: 90,  yetenek: 'buzNefes',   pasif: 'soguk' },
    { id: 'semender', ad: 'Kor Semenderi', emoji: '🦎', renk: '#ef8a3a', kademe: 2, soy: ['ates', 'su'],        can: 840, atk: 42, as: 0.60, menzil: 2, mana: 90,  yetenek: 'ocak',       pasif: 'sicakKalp' },
    { id: 'bulutat', ad: 'Bulut Atı', emoji: '🦄', renk: '#e7d9b5', kademe: 2, soy: ['gok', 'atli'],       can: 800, atk: 58, as: 0.85, menzil: 1, mana: 70,  yetenek: 'dortnal',    pasif: 'ruzgar' },
    { id: 'kugu', ad: 'Işık Kuğusu', emoji: '🦢', renk: '#f1e7a6', kademe: 3, soy: ['gok', 'su'],         can: 980, atk: 39, as: 0.55, menzil: 3, mana: 90,  yetenek: 'kanat',      pasif: 'ana' },
    { id: 'ayi', ad: 'Gece Ayısı', emoji: '🐻', renk: '#5b3f7a', kademe: 3, soy: ['karanlik', 'dev'],   can: 1288, atk: 67, as: 0.50, menzil: 1, mana: 100, yetenek: 'karaGolge',  pasif: 'karanlikPay' },
    { id: 'anka', ad: 'Anka', emoji: '🐦‍🔥', renk: '#ff6a3d', kademe: 3, soy: ['ates', 'gok'],     can: 840, atk: 56, as: 0.60, menzil: 3, mana: 100, yetenek: 'kulDogus',   pasif: 'yenidenDogus' },
    { id: 'baykus', ad: 'Ayaz Baykuşu', emoji: '🦉', renk: '#bfe0ff', kademe: 3, soy: ['kis', 'bilge'],      can: 784, atk: 43, as: 0.55, menzil: 3, mana: 100, yetenek: 'ayaz',       pasif: 'kisNefesi' },
    { id: 'tilki', ad: 'Gölge Tilki', emoji: '🦊', renk: '#4a5578', kademe: 3, soy: ['karanlik', 'avci'],  can: 728, atk: 50, as: 0.75, menzil: 3, mana: 90,  yetenek: 'golgeOk',    pasif: 'avKoku' },
    { id: 'ejder', ad: 'Fırtına Ejderi', emoji: '🐉', renk: '#ffd84a', kademe: 3, soy: ['ates', 'bilge'],     can: 840, atk: 60, as: 0.55, menzil: 3, mana: 110, yetenek: 'yildirim',   pasif: 'gokGurultu' },
  ];

  // ── Yetenek / pasif metinleri (kart ve bilgi penceresi için). Sayılar ★1 değeri; ★2 ×1.8, ★3 ×3. ──
  const YETENEK = {
    tasFirlat: { ad: 'Kaya Fırlat',  m: 'Hedefe 200 hasar, 1,5 sn sersemletir.' },
    uluma:     { ad: 'Uluma',        m: 'Kendisi ve 2 hücredeki dostlar 4 sn +%45 saldırı hızı.', kurulum: 0.3 },
    davul:     { ad: 'Savaş Davulu', m: 'Bütün dostlar 4 sn +%30 hasar.', kurulum: 0.3 },
    ruhEmme:   { ad: 'Can Emme',     m: 'Hedefe 170 hasar, o kadar can kazanır.' },
    kasirga:   { ad: 'Kasırga',      m: 'Hedef çevresindekilere 110 hasar, onları 1,5 hücre iter.' },
    deliOfke:  { ad: 'Boynuz Öfkesi',    m: 'Sonraki 3 vuruşu 2 kat, canının %20’sini yeniler.', kurulum: 0.3 },
    zehir:     { ad: 'Zümrüt Zehri',          m: 'Hedefi 4 sn zehirler (55/sn), en yaralı dosta 160 can.' },
    buzNefes:  { ad: 'Buz Nefesi',   m: 'Hedef çevresine 120 hasar, 1,2 sn dondurur.' },
    ocak:      { ad: 'Kor Halkası',         m: '2 hücredeki düşmanları 4 sn yakar (40/sn), dostlara 110 can.' },
    dortnal:   { ad: 'Bulut Hücumu',      m: 'En arka düşmana atılır, 190 hasar.', kurulum: 0.3 },
    kanat:     { ad: 'Işık Kanadı', m: 'Bütün dostlara 140 kalkan.', kurulum: 0.3 },
    karaGolge: { ad: 'Kara Gölge',   m: 'En güçlü düşmana 140 hasar, 5 sn -%45 hasar.' },
    kulDogus:  { ad: 'Kül Yağmuru',  m: 'Hedef çevresine 170 hasar ve 3 sn yanık.' },
    ayaz:      { ad: 'Ayaz',         m: 'Bütün düşmanlara 70 hasar, 3 sn -%40 saldırı hızı.', kurulum: 0.5 },
    golgeOk:   { ad: 'Gölge Oku',    m: 'Canı en az düşmana 320 hasar.', kurulum: 0.5 },
    yildirim:  { ad: 'Yıldırım',     m: '3 rastgele düşmana 150 hasar, 0,6 sn sersemletir.', kurulum: 0.5 },
    // canavar yetenekleri (bölüm 5.5)
    akrepZehir:  { ad: 'Akrep Zehri',     m: 'Hedefi 4 sn zehirler (60/sn).' },
    balinaSarki: { ad: 'Balina Şarkısı',  m: 'Bütün düşmanlara 110 hasar.', kurulum: 0.5 },
    bekciDarbe:  { ad: 'Bekçi Darbesi',   m: 'Hedefe 250 hasar, 1,5 sn sersemletir.' },
    yildizYutan: { ad: 'Yıldız Yutan',    m: 'En yakın 3 düşmana 220 hasar.' },
  };
  const PASIF = {
    tasDeri:      { ad: 'Taş Deri',      m: 'Alınan hasar -%20.' },
    suru:         { ad: 'Sürü',          m: 'Yaşayan her dost için +%6 hasar.' },
    ruhBagi:      { ad: 'Ruh Bağı',      m: 'Bir dost ölünce 25 mana kazanır.' },
    canEmici:     { ad: 'Can Emici',     m: 'Verdiği hasarın %20’si kadar can kazanır.' },
    kacis:        { ad: 'Yel Gibi',      m: 'Vuruşların %25’inden kaçar.' },
    deliCesaret:  { ad: 'Gözü Kara',  m: 'Canı yarının altındayken +%50 hasar.' },
    zehirDis:     { ad: 'Zehirli Diş',   m: 'Vuruşları 3 sn zehirler (18/sn).' },
    soguk:        { ad: 'Soğuk Dokunuş', m: 'Vuruşları 2 sn -%20 saldırı hızı verir.' },
    sicakKalp:    { ad: 'Sıcak Kalp',    m: 'Saniyede %3 can yeniler.' },
    ruzgar:       { ad: 'Rüzgâr Ayak',   m: 'İlk 7 sn +%35 saldırı hızı.' },
    ana:          { ad: 'Koruyucu Tüy',   m: 'Savaş başında komşu dostlara 90 kalkan.' },
    karanlikPay:  { ad: 'Karanlık Pay',  m: 'Her düşman ölümünde +%12 hasar (birikir).' },
    yenidenDogus: { ad: 'Yeniden Doğuş', m: 'İlk ölümde %40 canla dirilir.' },
    kisNefesi:    { ad: 'Kış Nefesi',    m: 'Savaşa %50 mana ile başlar.' },
    avKoku:       { ad: 'Av Kokusu',     m: 'Canı %30’un altındaki düşmana 2 kat hasar.' },
    gokGurultu:   { ad: 'Gök Gürültüsü', m: 'Her 4. vuruş yakındaki 2 düşmana sıçrar.' },
    // canavar pasifi
    dikenKirpi:   { ad: 'Diken Sırt',    m: 'Aldığı yakın vuruş hasarının %15’ini saldırgana geri verir.' },
  };

  // ── Alametler: her tur başında görünen tur kuralı (taslağı her tur değiştirir). ──
  // w: lobide seçilme ağırlığı (bölüm 8: Durgun Gök 2, diğerleri 1). lobi: yalnız seviyeli maçta (Arena, Lobi) çıkar; Hızlı Maç ve
  // düello eski 8 alameti kullanır (sıra aynı kaldığı için Hızlı Maç'ın alamet zarı eskisiyle aynı sonucu verir).
  const ALAMETLER = [
    { id: 'yok',      ad: 'Durgun Gök',   emoji: '🌤️', w: 2, m: 'Bu tur özel bir şey yok.' },
    { id: 'kanAyi',   ad: 'Kan Ayı',      emoji: '🌕', w: 1, m: 'Herkes +%20 hasar verir.' },
    { id: 'sis',      ad: 'Sis',          emoji: '🌫️', w: 1, m: 'Menzilliler -1 menzil.' },
    { id: 'tipi',     ad: 'Tipi',         emoji: '🌨️', w: 1, m: 'Herkes -%20 saldırı hızı; Ayaz soyu etkilenmez.' },
    { id: 'kutYagmur',ad: 'Kut Yağmuru',  emoji: '✨', w: 1, m: 'Herkes savaşa %40 mana ile başlar.' },
    { id: 'pazar',    ad: 'Bereketli Pazar', emoji: '🪙', w: 1, m: 'Bu tur +2 altın.' },
    { id: 'tutulma',  ad: 'Tutulma',      emoji: '🌒', w: 1, m: 'Karanlık soyu +%30 can.' },
    { id: 'yaz',      ad: 'Yaz Sıcağı',   emoji: '☀️', w: 1, m: 'Od soyu 2 kat yakar; Ayaz soyu -%15 can.' },
    // bölüm 8: lobi alametleri
    { id: 'demirci',  ad: 'Demirci Ateşi', emoji: '⚒️', w: 1, lobi: true, m: 'Bu turun savaşını kazanan 1 rastgele bileşen alır.' },
    { id: 'gocMevsimi', ad: 'Göç Mevsimi', emoji: '🍂', w: 1, lobi: true, m: 'Bu hazırlıkta ilk 2 yenileme bedava.' },
    { id: 'kutSessiz', ad: 'Kut Sessizliği', emoji: '🌑', w: 1, lobi: true, m: 'Bu tur Kut yok; herkes savaşa %25 mana ile başlar.' },
    { id: 'uzunGolge', ad: 'Uzun Gölge',  emoji: '🌇', w: 1, lobi: true, m: 'Gün Batımı 30. yerine 20. saniyede başlar.' },
  ];
  // Hızlı Maç ve düello alametleri: eski 8 (lobi alametleri yok)
  const ALAMETLER_HIZLI = ALAMETLER.filter(a => !a.lobi);

  // ── Kut Armağanı (OYNANIS_DERINLIK.md bölüm 6): 2-1, 3-2, 4-3'te 3'ten 1 seçilir. kademe: kivilcim | alev | gunes.
  // savas: motorda opt.armagan ile çalışır (sim.js). tur: Kut, Kaynaştırma, Eşya, Önceden görme, Alamet, Ekonomi, Seviye, Geri dönüş.
  const ARMAGANLAR = [
    { id: 'cifteKut',      ad: 'Çifte Kut',        kademe: 'gunes',    tur: 'Kut', savas: true,  m: 'Savaş başına 2 Kut hakkı; ikincisi ilkinden en az 6 sn sonra kullanılabilir.', neden: 'Kut\'u iki kez patlatmak istiyorsan.' },
    { id: 'uyanis',        ad: 'Uyanış',           kademe: 'kivilcim', tur: 'Kut', savas: true,  m: 'Kut verilen birim savaş sonuna dek +%25 saldırı hızı kazanır.', neden: 'Kut\'u vuruşçu bir kahramana veriyorsan.' },
    { id: 'kutMirasi',     ad: 'Kut Mirası',       kademe: 'alev',     tur: 'Kut', savas: true,  m: 'Kut verilen birim ölürse Kut hakkı bir kez geri gelir.', neden: 'Kut\'u öndeki kahramana veriyorsan.' },
    { id: 'isikSutunu',    ad: 'Işık Sütunu',      kademe: 'alev',     tur: 'Kut', savas: true,  m: 'Kut, hedefin 2 hücre çevresindeki dostlara da azami manalarının %50\'si kadar mana verir.', neden: 'Kahramanların sık diziliyse.' },
    { id: 'sakliKut',      ad: 'Saklı Kut',        kademe: 'kivilcim', tur: 'Kut', savas: false, m: 'Bir savaşta Kut\'u kullanmazsan savaş sonunda 3 altın kazanırsın.', neden: 'Altın biriktiriyorsan.' },
    { id: 'ocakUstasi',    ad: 'Ocak Ustası',      kademe: 'kivilcim', tur: 'Kaynaştırma', savas: false, m: 'Kaynaştırma 1 altın. Hemen 1 bedava kaynaştırma hakkı.', neden: 'Çok kaynaştırmak istiyorsan.' },
    { id: 'kusursuzMelez', ad: 'Kusursuz Melez',   kademe: 'alev',     tur: 'Kaynaştırma', savas: true, m: 'Kaynaşmış birimlerin istatistik çarpanı ×1,15 yerine ×1,30.', neden: 'Takımında kaynaşmış kahramanlar varsa.' },
    { id: 'ucluKaynasma',  ad: 'Üçlü Kaynaşma',    kademe: 'gunes',    tur: 'Kaynaştırma', savas: false, m: 'Kaynaşmış bir birim bir kez daha kaynaşabilir. Üçüncü kahramandan yalnız soyları ve +%10 istatistik gelir.', neden: 'Soy eşiklerini doldurmak istiyorsan.' },
    { id: 'soyMuhru',      ad: 'Soy Mührü',        kademe: 'alev',     tur: 'Eşya', savas: false, m: 'Seçtiğin bir soyun Mührü\'nü (özel eşya) ve 1 bileşen al.', neden: 'Bir soy eşiğine bir kahraman eksikse.' },
    { id: 'gozcuBaykusu',  ad: 'Gözcü Baykuşu',    kademe: 'kivilcim', tur: 'Önceden görme', savas: false, m: 'Sonraki 2 turun rakibini de görürsün. Hemen 4 altın.', neden: 'Takımını rakibe göre kuruyorsan.' },
    { id: 'karsiHamle',    ad: 'Karşı Hamle',      kademe: 'alev',     tur: 'Önceden görme', savas: true, m: 'Rakibin en kalabalık soyu, senin takımına karşı savaşta bir eşik düşük sayılır.', neden: 'Rakiplerin tek soya yükleniyorsa.' },
    { id: 'alametBilgesi', ad: 'Alamet Bilgesi',   kademe: 'kivilcim', tur: 'Alamet', savas: false, m: 'Sonraki 3 turun alametini görürsün. Her bölümde bir kez kendi savaşının alametini Durgun Gök yapabilirsin.', neden: 'Alametler takımını bozuyorsa.' },
    { id: 'kizilGok',      ad: 'Kızıl Gök Çocuğu', kademe: 'alev',     tur: 'Alamet', savas: true,  m: 'Alametin Durgun Gök olmadığı turlarda takımın +%10 hasar verir.', neden: 'Alametler sık değişiyorsa.' },
    { id: 'bereketKupu',   ad: 'Bereket Küpü',     kademe: 'kivilcim', tur: 'Ekonomi', savas: false, m: 'Faiz tavanı 5\'ten 7\'ye çıkar (56 altında doyar).', neden: 'Altın biriktiriyorsan.' },
    { id: 'pazarDostu',    ad: 'Pazar Dostu',      kademe: 'kivilcim', tur: 'Ekonomi', savas: false, m: 'Her hazırlıkta ilk yenileme bedava.', neden: 'Aynı kahramanı arıyorsan.' },
    { id: 'altinYumurta',  ad: 'Altın Yumurta',    kademe: 'alev',     tur: 'Ekonomi', savas: false, m: '5 savaş turu sonra yumurta çatlar: 22 altın.', neden: 'Şimdi güçlüysen, sonrası için.' },
    { id: 'hizliBuyume',   ad: 'Hızlı Büyüme',     kademe: 'kivilcim', tur: 'Seviye', savas: false, m: 'Hemen +8 deneyim; deneyim alımı 4 yerine 3 altın.', neden: 'Erken seviye atlamak istiyorsan.' },
    { id: 'ganimetKesesi', ad: 'Ganimet Kesesi',   kademe: 'kivilcim', tur: 'Eşya', savas: false, m: 'Hemen 2 rastgele bileşen.', neden: 'Eşya taşıyıcın hazırsa.' },
    { id: 'ustaDemirci',   ad: 'Usta Demirci',     kademe: 'gunes',    tur: 'Eşya', savas: false, m: '3 tam eşyadan birini seç, ayrıca 1 Söküm Taşı.', neden: 'Eşyalarını yeniden dağıtmak istiyorsan.' },
    { id: 'sonDirenis',    ad: 'Son Direniş',      kademe: 'alev',     tur: 'Geri dönüş', savas: true, m: 'Canın 40\'ın altındaysa takımın +%20 can kazanır. Seçince hemen 1 bileşen.', neden: 'Canın azaldıysa.' },
  ];
  const ARMAGAN_KADEME = { kivilcim: 'Kıvılcım', alev: 'Alev', gunes: 'Güneş' };

  // ── Eşyalar (OYNANIS_DERINLIK.md bölüm 5). Bileşen istatistikleri tam eşyada toplanır: tam eşya = iki bileşen + kendi etkisi. ──
  // stat alanları: atk (saldırı çarpanı), as (saldırı hızı, hizCarpan'a eklenir), yg (yetenek gücü), mana0 (savaşa başlarken mana),
  // azalt (alınan hasar azaltma; eşyalardan en çok %40), can (azami can), cal (vuruşta can çalma), kalkan0 (savaş başı kalkan).
  const BILESENLER = [
    { id: 'dis',   ad: 'Diş',   simge: 'b_dis',   stat: { atk: 0.15 },   m: '+%15 saldırı' },
    { id: 'tuy',   ad: 'Tüy',   simge: 'b_tuy',   stat: { as: 0.15 },    m: '+%15 saldırı hızı' },
    { id: 'kor',   ad: 'Kor',   simge: 'b_kor',   stat: { yg: 0.2 },     m: '+%20 yetenek gücü' },
    { id: 'ciy',   ad: 'Çiy',   simge: 'b_ciy',   stat: { mana0: 15 },   m: 'Savaşa +15 mana ile başlar' },
    { id: 'kabuk', ad: 'Kabuk', simge: 'b_kabuk', stat: { azalt: 0.1 },  m: 'Alınan hasar −%10' },
    { id: 'yurek', ad: 'Yürek', simge: 'b_yurek', stat: { can: 180 },    m: '+180 can' },
    { id: 'pul',   ad: 'Pul',   simge: 'b_pul',   stat: { cal: 0.1 },    m: '%10 can çalma (vuruşta)' },
    { id: 'buz',   ad: 'Buz',   simge: 'b_buz',   stat: { kalkan0: 120 }, m: 'Savaş başında 120 kalkan' },
  ];
  // 36 tam eşya: tarif sırası önemsiz (Diş+Tüy = Tüy+Diş). Sıra tablo 5.3 ile aynı (simge e01…e36).
  const ESYALAR = [
    ['yirticiPence', 'Yırtıcı Pençe', 'dis', 'dis', 'Her 3. vuruş, hedefin azami canının %8\'i kadar ek hasar.'],
    ['avCoskusu', 'Av Coşkusu', 'dis', 'tuy', 'Takımından biri düşman öldürünce 3 sn +%40 saldırı hızı.'],
    ['kizginDis', 'Kızgın Diş', 'dis', 'kor', 'Yeteneğinin vurduğu her düşman 3 sn yanar: 30/sn ×★×YG.'],
    ['keskinGoz', 'Keskin Göz', 'dis', 'ciy', 'Vuruş başına mana 10 yerine 15.'],
    ['ofkeTilsimi', 'Öfke Tılsımı', 'dis', 'kabuk', 'Canı ilk kez yarının altına inince 5 sn +%35 saldırı ve −%20 alınan hasar.'],
    ['devYumrugu', 'Dev Yumruğu', 'dis', 'yurek', 'Vuruşlar, kendi azami canının %2\'si kadar ek hasar verir.'],
    ['geceAvcisi', 'Gece Avcısı', 'dis', 'pul', 'Bir düşmanı öldürünce onun azami canının %20\'si kadar iyileşir.'],
    ['buzMizragi', 'Buz Mızrağı', 'dis', 'buz', 'Her yeni hedefe ilk vuruşu 0,8 sn sersemletir.'],
    ['yelKanadi', 'Yel Kanadı', 'tuy', 'tuy', 'Her 5. vuruşun ardından anında bir vuruş daha yapar.'],
    ['simsekTuyu', 'Şimşek Tüyü', 'tuy', 'kor', 'Her 5. vuruşta hedefe en yakın 2 düşmana 70 ×★×YG yıldırım.'],
    ['ruzgarCani', 'Rüzgâr Çanı', 'tuy', 'ciy', 'Yetenek kullandıktan sonra 3 sn +%40 saldırı hızı.'],
    ['sisPelerini', 'Sis Pelerini', 'tuy', 'kabuk', 'Savaşın ilk 2,5 sn\'si hedef alınamaz.'],
    ['bulutNali', 'Bulut Nalı', 'tuy', 'yurek', 'Hareket hızı +%50; savaştaki ilk vuruşu 2 kat.'],
    ['geceKanadi', 'Gece Kanadı', 'tuy', 'pul', 'Canı ilk kez %30\'un altına inince 3 sn +%60 saldırı hızı ve %30 can çalma.'],
    ['karTanesi', 'Kar Tanesi', 'tuy', 'buz', 'Vuruşları hedefe 2 sn −%15 saldırı hızı verir.'],
    ['kutOcagi', 'Kut Ocağı', 'kor', 'kor', 'Kut ile patlayan yeteneği ×1,5.'],
    ['bilgeAsasi', 'Bilge Asası', 'kor', 'ciy', 'Yeteneğin ardından 25 mana geri kazanır.'],
    ['tasMuhur', 'Taş Mühür', 'kor', 'kabuk', 'Her yetenek kullanımında kendine 120 ×★×YG kalkan.'],
    ['canAtesi', 'Can Ateşi', 'kor', 'yurek', 'Her yetenek, en yaralı dosta 100 ×★×YG iyileştirme de verir.'],
    ['golgeMurekkebi', 'Gölge Mürekkebi', 'kor', 'pul', 'Can çalma yetenek hasarına da uygulanır, yeteneklerde %25 olur.'],
    ['ayazAsasi', 'Ayaz Asası', 'kor', 'buz', 'Yeteneğin vurduğu düşmanlar 2 sn −%30 saldırı hızı alır.'],
    ['dolunayTestisi', 'Dolunay Testisi', 'ciy', 'ciy', 'Yetenek için gereken mana −%20.'],
    ['sabirTasi', 'Sabır Taşı', 'ciy', 'kabuk', 'Hasar alınca kazanılan mana iki katı.'],
    ['sifaPinari', 'Şifa Pınarı', 'ciy', 'yurek', 'Saniyede azami canının %2\'si kadar iyileşir.'],
    ['ruhTestisi', 'Ruh Testisi', 'ciy', 'pul', 'Bir dost ölünce 20 mana kazanır ve azami canının %10\'u kadar iyileşir.'],
    ['buzPinari', 'Buz Pınarı', 'ciy', 'buz', 'Yetenek kullanınca 2 hücre içindeki dostlara 80 ×★ kalkan.'],
    ['anaKaya', 'Ana Kaya', 'kabuk', 'kabuk', 'Canı ilk kez %40\'ın altına inince 2 sn hiç hasar almaz.'],
    ['devKukremesi', 'Dev Kükremesi', 'kabuk', 'yurek', 'Savaş başında 2,5 hücre içindeki düşmanlar 3 sn yalnız onu hedef alır.'],
    ['dikenKabuk', 'Diken Kabuk', 'kabuk', 'pul', 'Aldığı yakın vuruş hasarının %25\'ini saldırgana geri verir.'],
    ['buzulZirh', 'Buzul Zırh', 'kabuk', 'buz', 'Ona vuran 2 sn −%20 saldırı hızı alır.'],
    ['uluKok', 'Ulu Kök', 'yurek', 'yurek', 'Savaş başında 2 hücre içindeki dostlara +150 azami can.'],
    ['geceYuregi', 'Gece Yüreği', 'yurek', 'pul', 'Ölünce 2 hücre içindeki dostlara kendi azami canının %25\'i kadar kalkan.'],
    ['buzDagi', 'Buz Dağı', 'yurek', 'buz', 'Savaş başında azami canının %20\'si kadar ek kalkan.'],
    ['golgePelerini', 'Gölge Pelerini', 'pul', 'pul', 'Bir düşmanı öldürünce 1,5 sn hedef alınamaz ve azami canının %15\'i kadar iyileşir.'],
    ['karaBuz', 'Kara Buz', 'pul', 'buz', 'Canı ilk kez yarının altına inince 2 hücre içindeki düşmanlar 1 sn sersemler.'],
    ['isikKalkani', 'Işık Kalkanı', 'buz', 'buz', 'Savaş başında 2 hücre içindeki dostlara 120 kalkan.'],
  ].map(([id, ad, a, b, m], i) => ({ id, ad, tarif: [a, b], m, simge: 'e' + String(i + 1).padStart(2, '0') }));
  // Özel eşyalar (tarifle yapılmaz). Soy Mührü kimliği 'muhur-<soy>' (ör. muhur-ates).
  const OZEL_ESYA = [
    { id: 'sokumTasi', ad: 'Söküm Taşı', simge: 'o_sokum', m: 'Bir kahramana bırakılınca bütün eşyalarını rafa geri indirir; taş harcanır.' },
    { id: 'kutTasi', ad: 'Kut Taşı', simge: 'o_kuttasi', m: 'Yuva kaplar. Taşıyana Kut verilince Kut Yankısı iki kat çalışır.' },
    { id: 'muhur', ad: 'Soy Mührü', simge: 'o_muhur', m: 'Yuva kaplar. Taşıyan bu soyu da taşır.' },
  ];

  // ── Canavarlar (OYNANIS_DERINLIK.md 5.5): soyları yok, kahraman havuzuna girmez, kademe 0. Yeteneksizlerin manası 9999.
  // gorunum: sahnede gösterilen 3D model ve portre adı (yalnız görsel; motor kullanmaz).
  const CANAVARLAR = [
    { id: 'cakil',      ad: 'Çakıl Kıpırı', emoji: '🪨', renk: '#9a8f80', gorunum: 'cakil',      can: 392,  atk: 18,  as: 0.70, menzil: 1, mana: 9999, yetenek: null,          pasif: null },
    { id: 'kirpi',      ad: 'Diken Kirpi',  emoji: '🦔', renk: '#a0764e', gorunum: 'kirpi', can: 588,  atk: 24,  as: 0.80, menzil: 1, mana: 9999, yetenek: null,          pasif: 'dikenKirpi' },
    { id: 'tasKabuk',   ad: 'Taş Kabuk',    emoji: '🐚', renk: '#8c8c8c', gorunum: 'tasKabuk', can: 1260,  atk: 22,  as: 0.50, menzil: 1, mana: 9999, yetenek: null,          pasif: null },
    { id: 'kumAkrebi',  ad: 'Kum Akrebi',   emoji: '🦂', renk: '#d4a95a', gorunum: 'kumAkrebi',   can: 980,  atk: 40,  as: 0.80, menzil: 1, mana: 9999, yetenek: null,          pasif: null },
    { id: 'anaAkrep',   ad: 'Ana Akrep',    emoji: '🦂', renk: '#b8742c', gorunum: 'anaAkrep',   can: 2100, atk: 56,  as: 0.70, menzil: 1, mana: 80,   yetenek: 'akrepZehir',  pasif: null },
    { id: 'gokBalinasi',ad: 'Gök Balinası', emoji: '🐋', renk: '#7fb8e6', gorunum: 'gokBalinasi',       can: 7280, atk: 68,  as: 0.50, menzil: 3, mana: 100,  yetenek: 'balinaSarki', pasif: null },
    { id: 'kadimBekci', ad: 'Kadim Bekçi',  emoji: '🗿', renk: '#8a9a7a', gorunum: 'kadimBekci',      can: 4480, atk: 88, as: 0.60, menzil: 1, mana: 90,   yetenek: 'bekciDarbe',  pasif: null },
    { id: 'yildizYiyen',ad: 'Yıldız Yiyen', emoji: '🌌', renk: '#5a3f9a', gorunum: 'yildizYiyen',      can: 12600, atk: 112, as: 0.60, menzil: 3, mana: 100,  yetenek: 'yildizYutan', pasif: null },
  ].map(c => ({ ...c, kademe: 0, soy: [] }));
  // Canavar dalgaları: 'bölüm-tur' → birimler (taraf 1'de; x sütun 0..3, y sıra 0 ön | 1 orta | 2 arka). 6. bölüm ve sonrası: PVE_DALGA_GEC.
  const PVE_DALGA = {
    '1-1': [['cakil', 1, 0], ['cakil', 2, 0]],
    '1-2': [['cakil', 1, 0], ['cakil', 2, 0], ['cakil', 0, 0]],
    '1-3': [['tasKabuk', 1, 0], ['kirpi', 2, 0], ['kirpi', 0, 1]],
    '2-7': [['kumAkrebi', 1, 0], ['kumAkrebi', 2, 0], ['kumAkrebi', 0, 0], ['anaAkrep', 2, 1]],
    '3-7': [['gokBalinasi', 1, 2]],
    '4-7': [['kadimBekci', 1, 0], ['kadimBekci', 2, 0]],
    '5-7': [['yildizYiyen', 1, 2]],
  };
  const PVE_DALGA_GEC = [['yildizYiyen', 1, 2], ['kadimBekci', 1, 0], ['kadimBekci', 2, 0]];

  // ── Ganimet planı (bölüm 5.4). Toplam değer herkes için aynı, yalnız türü değişir (kötü şans koruması).
  // Parçalar: bilesen (n rastgele bileşen), altin (n), kahraman (bir kademe-k kahraman, ★1), secim (n farklı eşyadan biri seçilir; tur 'bilesen'|'tam'),
  // zarf (ZARF tablosundan biri), esya (sabit kimlik). Kervan turlarının ganimeti KERVAN tablosunda. Anahtar 'bölüm-tur'.
  const GANIMET = {
    '1-1': [{ tip: 'bilesen', n: 1 }],
    '1-2': [{ tip: 'kahraman', kademe: 1 }, { tip: 'altin', n: 2 }],
    '1-3': [{ tip: 'secim', tur: 'bilesen', n: 2 }, { tip: 'altin', n: 2 }],
    '2-7': [{ tip: 'bilesen', n: 1 }, { tip: 'zarf' }],
    '3-7': [{ tip: 'bilesen', n: 2 }, { tip: 'altin', n: 3 }],
    '4-7': [{ tip: 'secim', tur: 'tam', n: 3 }],
    '5-7': [{ tip: 'esya', id: 'kutTasi' }, { tip: 'esya', id: 'sokumTasi' }],
  };
  // 6. bölüm ve sonrası: tur → ganimet (6-7 ve sonrası: 3 tam eşyadan biri)
  const GANIMET_GEC = { 7: [{ tip: 'secim', tur: 'tam', n: 3 }] };
  // 2-7 zarfı: ağırlık w (toplam 1)
  const ZARF = [{ tip: 'altin', n: 3, w: 0.4 }, { tip: 'bilesen', n: 1, w: 0.3 }, { tip: 'kahraman', kademe: 2, w: 0.3 }];
  // Kervan (x-4): her seçenek bir kahraman + üstünde bir eşya. secenek satırları seçenek sırasıyla döner (n % uzunluk);
  // kademe dizisinde birden çok değer varsa biri eşit olasılıkla seçilir. kaynasmis: ilk seçenek hazır kaynaşmış [kademe, kademe] birim.
  // Anahtar bölüm; KERVAN_GEC_BOLUM ve sonrası son satırı kullanır.
  const KERVAN = {
    2: { secenek: [{ kademe: [1, 2], s: 1 }], esya: 'bilesen' },
    3: { kaynasmis: [2, 1], secenek: [{ kademe: [2, 3], s: 1 }], esya: 'bilesen' },
    4: { secenek: [{ kademe: [3], s: 1 }, { kademe: [2], s: 2 }], esya: 'bilesen' },
    5: { secenek: [{ kademe: [3], s: 1 }], esya: 'tam' },
  };

  // ── Hızlı Maç: prototipin kuralları (her tur 10 altın, seviye yok, 5 can / 7 zafer, tura bağlı takım ve dükkân) ──
  const HIZLI = {
    gunBatimi: null,        // Hızlı Maç'ta Gün Batımı yok (eski savaşlar bit bit aynı kalır)
    altinTur: 10,           // her tur yeniden 10 altın (faiz yok → kartopu yok, geride kalan toparlar)
    yenile: 1, kaynastir: 3,
    yedek: 4,
    botErken: 4,            // ilk 4 turda Hızlı Maç botu ★2 ve kaynaşmış birim taşımaz (online.js botTakim; erken turda yeni oyuncu da kazanabilsin)
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

  // ── Bot izi eğrisi (OYNANIS_DERINLIK.md 4.8): tur sırası r → [r, seviye, ★2 oranı, ★3 oranı, tam eşya, kaynaşmış birim].
  // r 2 = 1-3, 5 = 2-3, 12 = 3-3, 19 = 4-3, 26 = 5-3; ilk satır (r 0) başlangıç. Arası doğrusal; son satırdan sonra son eğimle, tavana kadar.
  const BOT_IZ = {
    egri: [[0, 2, 0.1, 0, 0, 0], [2, 3, 0.2, 0, 0, 0], [5, 4, 0.35, 0, 1, 0], [12, 6, 0.55, 0, 3, 1], [19, 7, 0.75, 0.05, 5, 1], [26, 8, 0.85, 0.12, 7, 2]],
    tavan: [0, 8, 0.95, 0.3, 10, 3],  // sütun başına üst sınır (r sütunu kullanılmaz)
    gucTaban: 0.8, gucAdim: 0.4,       // ★2 ve eşya sayısı × (0,8 + 0,4 × güç): güç 0 → −%20, güç 1 → +%20
    gucTur: 4,                         // güç eğride öne/arkaya kaydırır: r + (güç − 0,5) × 4 (güç 1 → 2 tur önde, 0 → 2 tur geride)
    bilesen: 2,                        // tam eşyası olmayan bot, 1-2'den sonra en çok 2 bileşen taşır; tam eşyalıda 1 artan bileşen
  };

  // ── Asıl oyunun kuralları (OYNANIS_DERINLIK.md 12.1). Hızlı Maç kuralları KURAL.hizli altında. ──
  const KURAL = {
    // ortak
    satisIade: 1, dukkan: 5,
    yildizCarpan: [0, 1, 1.8, 3],
    savasSuresi: 45,        // sn; süre dolunca iki taraf da kaybeder (sonuc.kazanan −2, sureDoldu) (tempo: 30 → 45; savaş ortancası 24–32 sn hedefi, DENGE_RAPORU.md)
    // savaş motoru (sakin, okunur savaş): ayrim: iki birimin merkezleri arası en az uzaklık (hücre; üst üste binme yok);
    // hedefBirak: hedef menzilin bu kadar ötesine geçerse yeni hedef aranır (kalıcı hedef; 2 hücrede süre sınırına kalan savaş %5,8 oldu → 0,5); kurulum: yeteneğin varsayılan kurulum süresi (sn;
    // YETENEK[id].kurulum ile değişir); mana: vuruş başına (Keskin Göz ile), alınan hasarın oranı (Sabır Taşı ile; kurulumun yavaşlattığı tempoyu dengelemek için %5 → %7) ve vuruş başına tavanı
    savas: { ayrim: 0.8, hedefBirak: 0.5, kurulum: 0.4, vurusMana: 10, keskinGozMana: 15, hasarMana: 0.07, sabirMana: 0.14, hasarManaTavan: 30,
      // yol bulma (sim.js yolBul): yolYenile adımda bir yeniden planlar; yolTakil adım ilerleyemezse yolGevsekSure adım dostlara yolGevsek yaklaşabilir
      yolYenile: 6, yolTakil: 20, yolGevsekSure: 40, yolGevsek: 0.5 },
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
    // tur planı (bölüm 1.1): bölüm 1'de 3 tur (canavar), sonraki bölümlerde 7 tur; x-4 Kervan, x-7 canavar
    bolum1Tur: 3, bolumTur: 7, kervanTur: 4, canavarTur: 7,
    armaganTur: { 2: 1, 3: 2, 4: 3 }, // bölüm → Kut Armağanı'nın geldiği tur (2-1, 3-2, 4-3)
    // birikimli ekonomi (bölüm 3): gelir = taban + faiz + seri + galibiyet + alamet; hazırlık başında, Kervan'da yok
    tabanGelirBolum1: [3, 3, 4], tabanGelir: 5, // 1-1: 3 (başlangıç), 1-2: 3, 1-3: 4, 2-1 ve sonrası: 5
    faizAdim: 8, faizTavan: 5,                  // her 8 altına 1, en çok 5 (40'ta doyar); bölüm 1'de faiz yok. Belgede 10'du (50'de doyar);
                                                // denge benzetimiyle (test/denge_benzetim.mjs, DENGE_RAPORU.md) biriktiren ile harcayan arasındaki sıra farkı 0,8'in altına insin diye 8
    seriTablo: [0, 0, 1, 2, 2, 3],              // indeks = seri uzunluğu (5 ve üstü son değer): 2 → 1, 3–4 → 2, 5+ → 3
    galibiyetBonus: 1, pazarBonus: 2,           // önceki PvP savaşı kazanıldıysa +1; Bereketli Pazar +2
    yenile: 2,                                  // yenileme 2 altın (Hızlı Maç'ta 1)
    kaynastirTaban: 2,                          // kaynaştırma = 2 + en yüksek kademe (3–5); lobi.kaynastirBedel
    // savaş içi Gün Batımı (bölüm 1.4): basla. saniyeden sonra her tam saniye bütün hasar +%10 (carpan = 1 + artis × floor(t − basla))
    gunBatimi: { basla: 30, artis: 0.10 },
    // bölüm 1: 1-1'den önce bedava seçilen kademe-1 kahraman sayısı
    baslangicSecenek: 3,
    // ganimet (bölüm 5.4): GANIMET, GANIMET_GEC (ganimetGecBolum ve sonrası), ZARF; sabit altın kısmı lobi.ganimetAltin ile turSonu'nda eklenir
    ganimet: GANIMET, ganimetGec: GANIMET_GEC, ganimetGecBolum: 6, zarf: ZARF,
    // Kervan (5.4): seçenekler; sıralamaya göre seçenek sayısı (indeks = sıra 1..8): 1–2. 3, 3–4. 4, 5–8. 5
    kervan: KERVAN, kervanGecBolum: 5, kervanAdet: [0, 3, 3, 4, 4, 5, 5, 5, 5],
    // canavar dalgaları (5.5)
    pveDalga: PVE_DALGA, pveDalgaGec: PVE_DALGA_GEC, pveDalgaGecBolum: 6,
    // kaybedince alınan hasar (bölüm 4.4): bölüm tabanı + kazanan taraftaki sağ birimlerin yıldızları
    bolumTabani: [0, 0, 4, 9, 13, 17, 21, 25],  // indeks = bölüm (7 ve sonrası son değer); bölüm 1 canavar, hasar yok. İlk değer 2/5/8/12/15/18; lobi benzetimiyle (test/lobi.test.cjs) maç 5-3'te bitsin diye artırıldı (tempo ayarında 4/8/12/16/20/24 → 4/9/13/17/21/25)
    sonUcEk: 3, sonIkiEk: 5,                    // lobide 3 kişi kalınca taban +3, 2 kişi kalınca +5
    // eşyalar (bölüm 5): birim başına 3 yuva, raf en çok 10, eşyalardan alınan hasar azaltma en çok %40
    esyaYuva: 3, esyaRaf: 10, esyaAzaltTavan: 0.4,
    // 8 kişilik hayalet lobi (bölüm 4): eşleşme yasağı son 3 tur (yaşayan − 2 ile sınırlı), 50 karıştırma denemesi, sonra yasak gevşer
    lobiBoyut: 8, yasakTur: 3, eslesmeDeneme: 50, lobiTurTavan: 80,
    // sıralama ödülü (4.5): indeks = sıra (1..8) → kupa; 0–400 kupada kayıplar yarıya iner, kupa 0'ın altına düşmez
    kupaTablo: [0, 40, 30, 20, 10, -10, -20, -30, -40], kupaKoruma: 400,
    ustalikKursu: 2, ustalikBirinci: 4, // ilk 3'teki takımda her kahramana +2 ustalık, birinciye +4
    lobiEsles: 150,                      // lobi kurarken iz seçimi: kupa ±150
    botIz: BOT_IZ,
    // Kut (bölüm 7): savaş başına hak; ikinci hak ilkinden en az `ara` sn sonra. Yapay zekâ (7.4): ilk hak yzZaman, sonrakiler yzZaman2 sn'de;
    // puan = (mana − mp) × kc + yzBilesen × bileşen sayısı + (Kut Ocağı varsa yzOcak). Kut Sessizliği'nde herkes savaşa sessizMana ile başlar.
    kut: { hak: 1, ara: 6, yzZaman: 8, yzZaman2: 18, yzBilesen: 20, yzOcak: 60, sessizMana: 0.25, uzunGolge: 20, sonIkiHak: 2 },
    // Kut Yankısı (7.1): bileşen başına; tam eşya iki bileşen sayılır, Kut Taşı sayıları ikiye katlar (birden çok taş da ×2), Kut Ocağı ek ×1,5.
    // kabukTavan: Kabuk yankılarının toplam azaltması en çok (belgede yok; 2 Kabuk + Kut Taşı %160 olmasın diye).
    kutYanki: { disVurus: 3, disOran: 0.5, tuySure: 3, tuyOran: 0.5, kor: 1.25, ciy: 30, kabukSure: 3, kabukOran: 0.4, kabukTavan: 0.8,
      yurek: 0.15, pulSure: 3, pulOran: 0.4, buz: 150, kutTasi: 2, ocak: 1.5 },
    // Kut Armağanı (bölüm 6): bölüm → kademe olasılıkları [Kıvılcım, Alev, Güneş]; aşama başına 1 yenileme; aynı armağan bir maçta iki kez çıkmaz.
    armagan: { kademeler: ['kivilcim', 'alev', 'gunes'], olasilik: { 2: [0.5, 0.4, 0.1], 3: [0.3, 0.5, 0.2], 4: [0.2, 0.45, 0.35] }, secenek: 3, yenileme: 1, sure: 15 },
    // armağan sayıları (6.2)
    armaganSayi: { uyanis: 0.25, isikSutunu: 0.5, isikMenzil: 2.1, sakliKut: 3, ocakUstasi: 1, kaynasCarpan: 1.15, kusursuzMelez: 1.3, ucluKaynas: 0.1,
      gozcuAltin: 4, gozcuTur: 2, alametBilge: 3, kizilGok: 0.1, bereketFaiz: 7, yumurtaTur: 5, yumurtaAltin: 22, hizliXp: 8, hizliBedel: 3,
      ganimetKesesi: 2, sonDirenisCan: 40, sonDirenisOran: 0.2, gocYenile: 2, pazarDostu: 1 },
    hizli: HIZLI,
  };

  // Eşya arama: bileşen → {tip: 'bilesen'}, tam eşya → {tip: 'tam'}, özel → {tip: 'ozel'}; 'muhur-<soy>' → Soy Mührü (soy alanıyla). Bilinmeyen → null.
  const _esya = {};
  for (const b of BILESENLER) _esya[b.id] = { ...b, tip: 'bilesen' };
  for (const e of ESYALAR) _esya[e.id] = { ...e, tip: 'tam' };
  for (const o of OZEL_ESYA) if (o.id !== 'muhur') _esya[o.id] = { ...o, tip: 'ozel' };
  function esya(id) {
    if (typeof id !== 'string') return null;
    if (Object.prototype.hasOwnProperty.call(_esya, id)) return _esya[id];
    if (id.startsWith('muhur-') && Object.prototype.hasOwnProperty.call(SOYLAR, id.slice(6))) { const m = OZEL_ESYA[2], s = id.slice(6); return { ...m, id, tip: 'ozel', soy: s, ad: m.ad + ' (' + SOYLAR[s].ad + ')' }; }
    return null;
  }
  // İki bileşenin tam eşyası (sıra önemsiz); yoksa null.
  function tarif(a, b) { for (const e of ESYALAR) if ((e.tarif[0] === a && e.tarif[1] === b) || (e.tarif[0] === b && e.tarif[1] === a)) return e.id; return null; }

  // kahraman(id): bulamazsa CANAVARLAR'a bakar (canavarın kademe 0, soy []). canavar(id): yalnız canavarlar.
  const canavar = (id) => CANAVARLAR.find(c => c.id === id);
  const armagan = (id) => ARMAGANLAR.find(a => a.id === id) || null;
  const api = { SOYLAR, KAHRAMANLAR, YETENEK, PASIF, ALAMETLER, ALAMETLER_HIZLI, ARMAGANLAR, ARMAGAN_KADEME, armagan, KURAL, KADEME_OLASILIK, BILESENLER, ESYALAR, OZEL_ESYA, CANAVARLAR, esya, tarif, canavar,
    kahraman: (id) => KAHRAMANLAR.find(k => k.id === id) || canavar(id) };
  g.KUT_DATA = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
