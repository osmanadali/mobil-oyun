/* Kut Arena — oyun mantığı (arayüzden bağımsız). Kurallar ../TASARIM.md ve ../OYNANIS_DERINLIK.md.
   İki biçim: 'arena' (seviye ve deneyim, seviyeye bağlı dükkân, sınırlı kahraman havuzu, 4×3 tahta, 7 yedek)
   ve 'hizli' (Hızlı Maç: prototipin kuralları, KURAL.hizli). İkisi de 4×3 tahtayı kullanır.
   Arayüz yalnız durumu okur (oyun.P, oyun.M) ve eylemleri çağırır; her değişiklikten sonra 'degisti' olayı gelir. */
const D = window.KUT_DATA, S = window.KUT_SIM, O = window.KUT_ONLINE, L = window.KUT_LOBI, K = D.KURAL, H = K.hizli;
const PANAHTAR = 'kut.profil.v2';
const SUTUN = K.tahtaSutun, HUCRE = K.tahtaSutun * K.tahtaSira;
/** Geçici maç sonu: 8 kişilik lobi (adım 5) gelene kadar seviyeli maç, can bitmeden bu turu (r, 0'dan) bitirince kazanılır.
    r 26 = 5-3: belgedeki beklenen maç sonu 5-2 ile 5-5 arası. */
const GECICI_SON_R = 26;

export class Oyun {
  constructor() {
    this.P = this._oku() || { kupa: 0, usta: {}, oyuncu: Math.random().toString(36).slice(2, 10), ad: 'Oyuncu', sonTakim: null, mac: null, istat: { mac: 0, birinci: 0 } };
    // eski biçimde (3×2 tahta) kaydedilmiş yarım maç yeni tahtaya taşınmaz: kapatılır
    if (this.P.mac && (!this.P.mac.mod || this.P.mac.tahta.length !== HUCRE)) this.P.mac = null;
    // birikimli ekonomiden önce (5 can, seri yok) kaydedilmiş seviyeli yarım maç da kapatılır
    if (this.P.mac && this.P.mac.mod === 'arena' && !this.P.mac.seri) this.P.mac = null;
    // eşyalardan önce kaydedilmiş yarım maça boş raf eklenir
    if (this.P.mac && !this.P.mac.esyaRaf) { this.P.mac.esyaRaf = []; this.P.mac.esyaTasan = []; }
    // canavar turlarından önce kaydedilmiş Arena yarım maçında rakip bot olabilir: canavar turuysa dalga kurulur
    if (this.P.mac && this.P.mac.mod === 'arena' && this.P.mac.rakip && L.turPlan(this.P.mac.tur - 1).tip === 'pve' && !this.P.mac.rakip.pve) this.P.mac.rakip = this._dalgaRakip(this.P.mac.tur - 1);
    this.M = this.P.mac; this.secili = null; this.seciliEsya = null; this.kaynasMod = false; this._dinle = {};
  }
  on(olay, fn) { (this._dinle[olay] = this._dinle[olay] || []).push(fn); }
  _yay(olay, veri) { (this._dinle[olay] || []).forEach(f => f(veri)); }
  _oku() { try { return JSON.parse(localStorage.getItem(PANAHTAR)); } catch (e) { return null; } }
  kaydet() { try { localStorage.setItem(PANAHTAR, JSON.stringify(this.P)); } catch (e) {} }
  _degisti() { this.kaydet(); this._yay('degisti'); }
  bildir(m, tur = 'bilgi') { this._yay('bildirim', { m, tur }); }

  // ── profil ──
  ustaSv(id) { return Math.floor((this.P.usta[id] || 0) / 5); }
  ustaToplam() { return Object.keys(this.P.usta).reduce((s, k) => s + this.ustaSv(k), 0); }

  // ── biçim kuralları ──
  seviyeli() { return !!this.M && this.M.mod === 'arena'; }
  /** Ekonomi ve maç sonu kuralları. Seviyeli maçta altın birikir (gelir lobi.turBasi ile), yenileme 2, 100 can, zafer hedefi yok
      (kaynastir burada en düşük bedeldir; gerçek bedel kaynastirBedel(a, b)). Hızlı Maç: her tur 10 altın, 5 can, 7 zafer. */
  kural() {
    if (this.M ? this.seviyeli() : true) return { altinTur: 0, yenile: K.yenile, kaynastir: K.kaynastirTaban + 1, can: K.canBaslangic, zaferHedef: 0 };
    return { altinTur: H.altinTur, yenile: H.yenile, kaynastir: H.kaynastir, can: H.can, zaferHedef: H.zaferHedef };
  }
  /** Kaynaştırma bedeli: seviyeli maçta 2 + en yüksek kademe (b verilmezse yalnız a'ya göre, yani en az bedel); Hızlı Maç'ta 3. */
  kaynastirBedel(a, b) { return this.seviyeli() ? L.kaynastirBedel(D.kahraman(a).kademe, b ? D.kahraman(b).kademe : 0) : H.kaynastir; }
  /** Ekranda tur adı: seviyeli maçta "2-3" (bölüm-tur), Hızlı Maç'ta tur sayısı. */
  turAd() { return this.seviyeli() ? L.turAd(this.M.tur - 1) : String(this.M.tur); }
  /** Turun tipi (seviyeli maçta 'pvp' | 'pve' | 'kervan'; Hızlı Maç'ta hep 'pvp'). */
  turTip() { return this.seviyeli() ? L.turPlan(this.M.tur - 1).tip : 'pvp'; }
  /** Uzun tur adı: "Bölüm 3 · Tur 2" (bölüm 1.1). */
  turUzun() { if (!this.seviyeli()) return 'Tur ' + this.M.tur; const p = L.turPlan(this.M.tur - 1); return `Bölüm ${p.bolum} · Tur ${p.tur}`; }
  /** Geçici sıralama tahmini (lobi adımı gelene kadar): cana göre 1–8. Kervan seçenek sayısını belirler. */
  siraTahmin() { return Math.max(1, Math.min(8, 1 + Math.floor((K.canBaslangic - this.M.can) / 12))); }
  /** Seviyeli maçta şu anki altının sonraki tur getireceği faiz (bölüm 1'de 0). */
  faizSonraki() { return this.seviyeli() ? L.faiz(this.M.altin, this.M.tur) : 0; }
  yuva() { return this.seviyeli() ? K.takimBoyutu(this.M.seviye) : H.yuva(this.M.tur); }
  yedekSayi() { return this.seviyeli() ? K.yedek : H.yedek; }
  olasilik() { return this.seviyeli() ? K.kademeOlasilik(this.M.seviye) : H.kademeOlasilik(this.M.tur); }
  /** Bir sonraki seviyeye gereken deneyim (tavanda 0). */
  xpGerek() { return this.seviyeli() ? L.xpGerek(this.M.seviye) : 0; }

  // ── maç ──
  /** mod: 'arena' (varsayılan, seviyeli) ya da 'hizli' (Hızlı Maç). */
  yeniMac(mod = 'arena') {
    const sev = mod === 'arena';
    this.P.mac = { mod: sev ? 'arena' : 'hizli', tur: 1, can: sev ? K.canBaslangic : H.can, zafer: 0, altin: 0,
      seviye: sev ? K.seviyeBaslangic : 0, xp: 0,
      seri: { tip: null, n: 0 }, galibiyet: false, gelir: null, sonHasar: 0,
      tahta: Array(HUCRE).fill(null), yedek: Array(sev ? K.yedek : H.yedek).fill(null), dukkan: [], kilit: false,
      esyaRaf: [], esyaTasan: [], // eşya rafı (en çok 10) ve raf doluyken bekleyen ganimet
      ilkSecim: null, kervan: null, ganimetSecim: null, // bekleyen seçimler: 1-1 öncesi bedava kahraman, Kervan, ganimet eşyası
      tohum: (Math.random() * 1e9) | 0, zar: 1, yenileN: 0, alamet: 'yok', rakip: null, gecmis: [] };
    this.M = this.P.mac;
    // bölüm 1: 1-1'den önce 3 kademe-1 kahramandan biri bedava (bölüm 1.1)
    if (sev) this.M.ilkSecim = L.baslangicSecenek(S.rng(this.M.tohum * 31 + 7), this.havuz());
    return this.turBaslat(false);
  }
  _zar() { const M = this.M; M.zar = (M.zar * 1103515245 + 12345) & 0x7fffffff; return M.zar / 0x7fffffff; }
  async turBaslat(devam) {
    const M = this.M = this.P.mac; this.secili = null; this.seciliEsya = null; this.kaynasMod = false;
    if (!devam) {
      const tip = this.turTip(), r = M.tur - 1;
      // Kervan turu (x-4): savaş, gelir ve deneyim yok; kahraman + eşya çiftlerinden biri seçilir (bölüm 5.4). Dükkân aynen kalır.
      if (tip === 'kervan') {
        M.alamet = 'yok'; M.gelir = L.turBasi(M, r, M.alamet); M.rakip = null;
        M.kervan = { r, secenek: L.kervanSecenek(r, S.rng(M.tohum * 131 + r * 7919 + 17), L.kervanAdet(this.siraTahmin()), this.havuz()) };
        this._yay('kervan', M.kervan); return this._degisti();
      }
      M.alamet = M.tur === 1 ? 'yok' : D.ALAMETLER[Math.floor(this._zar() * D.ALAMETLER.length)].id;
      if (this.seviyeli()) M.gelir = L.turBasi(M, r, M.alamet); // birikimli: taban + faiz + seri + galibiyet + alamet
      else M.altin = H.altinTur + (M.alamet === 'pazar' ? 2 : 0);
      const istek = { tur: M.tur, kupa: this.P.kupa, oyuncu: this.P.oyuncu, tohum: M.tohum + M.tur * 31, mod: M.mod };
      if (tip === 'pve') {
        // canavar turu (1-1…1-3, x-7): rakip canavar dalgası (bölüm 5.5)
        M.rakip = this._dalgaRakip(r);
        if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
      } else if (this.seviyeli()) {
        // rakip önce gelir: havuz onun kadrosundaki kopyaları da düşer
        M.rakip = null; this._degisti();
        M.rakip = await O.Hayalet.bul({ ...istek, sv: O.botSeviye(M.tur - 1), r: M.tur - 1 });
        if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
      } else {
        if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
        M.rakip = null; this._degisti();
        M.rakip = await O.Hayalet.bul(istek);
      }
    }
    this._degisti();
  }
  /** Canavar turunun rakibi: dalga (taraf 1), adı canavar sayılarıyla. */
  _dalgaRakip(r) {
    const takim = L.pveDalga(r), say = {};
    for (const b of takim) say[b.h] = (say[b.h] || 0) + 1;
    return { ad: Object.entries(say).map(([h, n]) => (n > 1 ? n + ' ' : '') + D.kahraman(h).ad).join(' + '), takim, kupa: 0, kaynak: 'canavar', pve: true };
  }
  /** Bekleyen seçim: 'ilk' (bedava kahraman), 'kervan', 'ganimet' ya da null. */
  bekleyenSecim() { const M = this.M; if (!M) return null; return M.ilkSecim ? 'ilk' : M.kervan ? 'kervan' : M.ganimetSecim ? 'ganimet' : null; }
  /** Kahramanı ele ver (ganimet, Kervan, bedava seçim): önce tahtaya (takım sınırı içinde, tahta=true ise), sonra yedeğe;
      yer yoksa satış değeri altın olur (bölüm 5.4). Birleşme kontrolü yapılır. Dönen: yer ya da {altin}. */
  _kahramanVer(b, tahta = false) {
    const M = this.M; let yer = null;
    if (tahta && this.tahtaSay() < this.yuva()) { const ti = M.tahta.findIndex(x => !x); if (ti >= 0) yer = { yer: 'tahta', i: ti }; }
    if (!yer) { const yi = M.yedek.findIndex(x => !x); if (yi >= 0) yer = { yer: 'yedek', i: yi }; }
    if (!yer) { const a = this.satisDegeri(b); M.altin += a; this.bildir(`Yedek dolu: ${this.birimAd(b)} ${a} altına çevrildi`); return { altin: a }; }
    this._koy(yer, { ...b }); if (!b.f) this._birlestir(b.h, yer);
    return yer;
  }
  /** 1-1'den önceki bedava kahraman seçimi (k: seçenek sırası). */
  ilkSec(k) {
    const M = this.M; if (!M || !M.ilkSecim) return;
    const id = M.ilkSecim[Math.max(0, Math.min(M.ilkSecim.length - 1, k | 0))]; M.ilkSecim = null;
    this._kahramanVer({ h: id, s: 1 }, true); this.bildir(`${D.kahraman(id).ad} takımına katıldı`, 'iyi'); this._degisti();
  }
  /** Kervan seçimi: kahraman yedeğe (yedek doluysa satış değeri altın), eşyası rafa; sonra sıradaki tur başlar. */
  async kervanSec(k) {
    const M = this.M; if (!M || !M.kervan) return;
    const s = M.kervan.secenek[Math.max(0, Math.min(M.kervan.secenek.length - 1, k | 0))]; M.kervan = null;
    this._kahramanVer(s.birim); this._rafEkle([s.esya]);
    this._yay('ganimet', { esya: [s.esya], kahraman: [s.birim] });
    this.bildir(`Kervan: ${this.birimAd(s.birim)}${s.birim.s > 1 ? ' ★' + s.birim.s : ''} + ${D.esya(s.esya).ad}`, 'iyi');
    M.tur++; return this.turBaslat(false);
  }
  /** Ganimet seçimi (1-3, 4-7, 6-7…): seçilen eşya rafa. */
  ganimetSec(k) {
    const M = this.M; if (!M || !M.ganimetSecim) return;
    const id = M.ganimetSecim[Math.max(0, Math.min(M.ganimetSecim.length - 1, k | 0))]; M.ganimetSecim = null;
    this._rafEkle([id]); this._yay('ganimet', { esya: [id] }); this.bildir('Ganimet: ' + D.esya(id).ad, 'iyi'); this._degisti();
  }
  /** Havuzdaki kalan kopyalar: oyuncunun tahta+yedeği ve rakibin kadrosu düşülür (bölüm 2.3). Hızlı Maç'ta havuz yok. */
  havuz() {
    const M = this.M; if (!this.seviyeli()) return null;
    return L.havuzKalan([[...M.tahta, ...M.yedek], M.rakip ? M.rakip.takim : []]);
  }
  havuzBilgi(id) { const h = this.havuz(); return h ? { kalan: h[id], toplam: K.havuzAdet[D.kahraman(id).kademe] } : null; }
  _dukkanDoldur() {
    const M = this.M;
    if (this.seviyeli()) {
      M.yenileN = (M.yenileN || 0) + 1;
      const R = S.rng(M.tohum * 31 + M.tur * 7919 + M.yenileN * 104729);
      M.dukkan = L.dukkanCek(M.seviye, this.havuz(), R, K.dukkan);
      return;
    }
    const ol = H.kademeOlasilik(M.tur);
    M.dukkan = Array.from({ length: K.dukkan }, () => { const k = O.kademeZar(ol, this._zar()); const l = D.KAHRAMANLAR.filter(h => h.kademe === k); return l[Math.floor(this._zar() * l.length)].id; });
  }
  tahtaSay() { return this.M.tahta.filter(Boolean).length; }
  al(s) { return s ? this.M[s.yer][s.i] : null; }
  _koy(s, v) { this.M[s.yer][s.i] = v; }
  sahipMi(id) { return [...this.M.tahta, ...this.M.yedek].some(b => b && !b.f && b.h === id && b.s === 1); }
  birlesirMi(id) { return [...this.M.tahta, ...this.M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length >= 2; }

  yenile() { const M = this.M, b = this.kural().yenile; if (M.altin < b) return this.bildir('Altın yetmiyor', 'hata'); M.altin -= b; this._dukkanDoldur(); this._yay('ses', 'yenile'); this._degisti(); }
  kilit() { this.M.kilit = !this.M.kilit; this._degisti(); }

  /** Deneyim satın al: 4 altın = 4 deneyim (yalnız seviyeli maçta). */
  xpAl() {
    const M = this.M; if (!this.seviyeli()) return;
    if (M.seviye >= K.seviyeTavan) return this.bildir('En yüksek seviyedesin', 'hata');
    if (M.altin < K.xpBedel) return this.bildir('Altın yetmiyor', 'hata');
    M.altin -= K.xpBedel; this._xpEkle(K.xpMiktar); this._yay('ses', 'yenile'); this._degisti();
  }
  _xpEkle(n) {
    const M = this.M, once = M.seviye, r = L.xpEkle(M.seviye, M.xp, n);
    M.seviye = r.seviye; M.xp = r.xp;
    if (M.seviye > once) { this._yay('seviye', { seviye: M.seviye }); this.bildir(`Seviye ${M.seviye}: takımına ${K.takimBoyutu(M.seviye)} kahraman koyabilirsin`, 'iyi'); }
  }

  satinAl(i) {
    const M = this.M, id = M.dukkan[i]; if (!id) return;
    const f = D.kahraman(id).kademe; if (M.altin < f) return this.bildir('Altın yetmiyor', 'hata');
    const ayni = [...M.tahta, ...M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length;
    let yer = null;
    if (ayni < 2) {
      const ti = M.tahta.findIndex(x => !x);
      if (this.tahtaSay() < this.yuva() && ti >= 0) yer = { yer: 'tahta', i: ti };
      else { const yi = M.yedek.findIndex(x => !x); if (yi >= 0) yer = { yer: 'yedek', i: yi }; }
      if (!yer) return this.bildir('Yer yok: sat ya da kaynaştır', 'hata');
    } else { const yi = M.yedek.findIndex(x => !x), ti = M.tahta.findIndex(x => !x); yer = yi >= 0 ? { yer: 'yedek', i: yi } : { yer: 'tahta', i: ti }; }
    this._koy(yer, { h: id, s: 1 }); M.altin -= f; M.dukkan[i] = null;
    this._yay('satinAlindi', { id, yer });
    this._birlestir(id, yer); this._degisti();
  }
  /** 3 aynı kahraman → bir üst yıldız. Yeni alınan kopya son sıraya konur: birleşen birim eldeki kopyanın yerinde oluşur
      (yedek doluyken tahtaya geçici konan kopya takım sınırını aşmasın). */
  _birlestir(id, yeni) {
    const M = this.M;
    for (const s of [1, 2]) {
      const yerler = []; for (const yer of ['tahta', 'yedek']) M[yer].forEach((b, i) => { if (b && !b.f && b.h === id && b.s === s) yerler.push({ yer, i }); });
      if (yeni) yerler.sort((p, q) => (p.yer === yeni.yer && p.i === yeni.i ? 1 : 0) - (q.yer === yeni.yer && q.i === yeni.i ? 1 : 0));
      if (yerler.length >= 3) {
        const [ilk, ...kalan] = yerler.slice(0, 3), yeniB = { h: id, s: s + 1 };
        // üç kopyanın eşyaları yeni birime toplanır (önce yerinde oluştuğu kopyanınkiler); 3'ü aşan rafa döner
        const top = L.esyaToplaBirim(yeniB, [ilk, ...kalan].map(y => (this.al(y).e || [])));
        if (top.e.length) yeniB.e = top.e; this._rafEkle(top.tasan);
        kalan.forEach(y => this._koy(y, null)); this._koy(ilk, yeniB); this._yay('birlesti', { id, s: s + 1, yer: ilk }); this.bildir(`⭐ ${D.kahraman(id).ad} ★${s + 1}!`, 'iyi'); }
    }
  }
  /** Yuvaya dokunma: seçme, taşıma/yer değiştirme ya da kaynaştırma (kaynasMod açıksa). */
  yuvaDokun(yer, i) {
    const M = this.M, hedef = { yer, i }, b = M[yer][i];
    if (this.seciliEsya !== null) { const r = this.seciliEsya; this.seciliEsya = null; if (b) return this.esyaTak(r, yer, i); return this._degisti(); }
    if (this.secili && this.kaynasMod) {
      const a = this.al(this.secili);
      if (!b || (this.secili.yer === yer && this.secili.i === i)) { this.kaynasMod = false; return this._degisti(); }
      if (a.f || b.f) return this.bildir('Kaynaşmış kahraman tekrar kaynaşmaz', 'hata');
      if (a.h === b.h) return this.bildir('Aynı kahraman kaynaşmaz: üç tanesi zaten ★ olur', 'hata');
      const bedel = this.kaynastirBedel(a.h, b.h);
      if (M.altin < bedel) return this.bildir(`${bedel} altın gerekli`, 'hata');
      M.altin -= bedel;
      const yeni = { h: a.h, f: b.h, s: Math.min(a.s, b.s), sh: a.s, sf: b.s }; // sh/sf: parçaların eski yıldızı (satış değeri için)
      { const top = L.esyaToplaBirim(yeni, [a.e, b.e]); if (top.e.length) yeni.e = top.e; this._rafEkle(top.tasan); } // eşyalar: önce birinci kahramanınkiler
      this._koy(this.secili, yeni); this._koy(hedef, null);
      this._yay('kaynasti', { a: a.h, b: b.h, yer: this.secili });
      this.kaynasMod = false; this.bildir(`🔥 ${this.birimAd(yeni)} doğdu!`, 'iyi'); return this._degisti();
    }
    if (!this.secili) { if (b) this.secili = hedef; return this._degisti(); }
    if (this.secili.yer === yer && this.secili.i === i) { this.secili = null; return this._degisti(); }
    const a = this.al(this.secili);
    if (yer === 'tahta' && this.secili.yer === 'yedek' && !b && this.tahtaSay() >= this.yuva()) return this.bildir(`Şu an en fazla ${this.yuva()} kahraman`, 'hata');
    this._koy(this.secili, b); this._koy(hedef, a); this.secili = null; this._degisti();
  }
  kaynasModDegistir() { this.kaynasMod = !this.kaynasMod; this._degisti(); }

  // ── eşyalar (bölüm 5.1): raf en çok 10; doluysa ganimet bekler (esyaTasan) ve raf boşalınca iner ──
  _rafEkle(ids) {
    const M = this.M; if (!M.esyaRaf) { M.esyaRaf = []; M.esyaTasan = []; }
    for (const id of ids || []) (M.esyaRaf.length < K.esyaRaf ? M.esyaRaf : M.esyaTasan).push(id);
  }
  _rafIndir() { const M = this.M; while (M.esyaTasan.length && M.esyaRaf.length < K.esyaRaf) M.esyaRaf.push(M.esyaTasan.shift()); }
  /** Canavar turunun ganimeti (bölüm 5.4; kaybedilse de verilir). Oyuncuya özel tohum. Eşyalar rafa, kahramanlar yedeğe,
      zarf altını kasaya (sabit altın turSonu'nda eklendi); seçim varsa bekler (ganimetSec). Hızlı Maç'ta ganimet yok. */
  _ganimet(r) {
    const M = this.M; if (!this.seviyeli()) return null;
    const g = L.ganimet(r, S.rng(M.tohum * 977 + r * 7919 + 13), this.havuz());
    M.altin += g.ekAltin; this._rafEkle(g.esya);
    for (const b of g.kahraman) this._kahramanVer(b);
    if (g.secim) M.ganimetSecim = g.secim;
    if (g.esya.length || g.kahraman.length) this._yay('ganimet', { esya: g.esya, kahraman: g.kahraman });
    return g;
  }
  /** Raftaki eşyaya dokunma: seçer; başka bir bileşen seçiliyken ikinci bileşene dokunulursa ikisi rafta birleşir. */
  esyaSec(i) {
    const M = this.M; if (!M.esyaRaf[i]) return;
    this.secili = null; this.kaynasMod = false;
    if (this.seciliEsya === i) { this.seciliEsya = null; return this._degisti(); }
    if (this.seciliEsya !== null) {
      const yeni = L.rafBirlestir(M.esyaRaf, this.seciliEsya, i);
      if (yeni) { const t = yeni[Math.min(i, this.seciliEsya)]; M.esyaRaf = yeni; this.seciliEsya = null; this._rafIndir(); this._yay('esyaBirlesti', {}); this.bildir('Rafta yeni eşya: ' + D.esya(t).ad, 'iyi'); return this._degisti(); }
    }
    this.seciliEsya = i; this._degisti();
  }
  /** Raftaki eşyayı (rafI) bir kahramana tak. Söküm Taşı: kahramanın bütün eşyaları rafa iner, taş harcanır. */
  esyaTak(rafI, yer, i) {
    const M = this.M, id = M.esyaRaf[rafI], b = M[yer][i]; this.seciliEsya = null;
    if (!id || !b) return this._degisti();
    if (id === 'sokumTasi') {
      if (!b.e || !b.e.length) { this.bildir('Bu kahramanda eşya yok', 'hata'); return this._degisti(); }
      M.esyaRaf.splice(rafI, 1); const iade = b.e; delete b.e; this._rafEkle(iade); this._rafIndir();
      this.bildir(`Söküm Taşı: ${iade.length} eşya rafa döndü`, 'iyi'); return this._degisti();
    }
    const t = L.esyaTak(b, id);
    if (!t) { const x = D.esya(id); this.bildir(x && x.soy ? 'Bu kahraman o soyu zaten taşıyor' : `Kahraman başına en çok ${K.esyaYuva} eşya`, 'hata'); return this._degisti(); }
    b.e = t.e; M.esyaRaf.splice(rafI, 1); this._rafIndir();
    this._yay('esyaTakildi', { id, yer: { yer, i }, birlesen: t.birlesen });
    if (t.birlesen) this.bildir(`✨ ${D.esya(t.birlesen).ad}!`, 'iyi');
    this._degisti();
  }
  sokumTasi(yer, i) { const r = this.M.esyaRaf.indexOf('sokumTasi'); if (r < 0) return this.bildir('Rafta Söküm Taşı yok', 'hata'); this.esyaTak(r, yer, i); }
  /** Raftaki iki bileşeni (a, b indeksleri) birleştir. */
  esyaBirlestirRaf(a, b) { const yeni = L.rafBirlestir(this.M.esyaRaf, a, b); if (!yeni) return this.bildir('İki bileşen seç', 'hata'); this.M.esyaRaf = yeni; this._rafIndir(); this._degisti(); }
  /** Satış: ★1 tam iade, ★2 3×kademe−1, ★3 9×kademe−1. Kaynaşmış birim iki parçasının satış değerinin toplamını getirir (bölüm 3.3). */
  satisDegeri(b) {
    const tek = (h, s) => { const k = D.kahraman(h).kademe; return s === 1 ? k : k * (s === 2 ? 3 : 9) - 1; };
    return tek(b.h, b.sh || b.s) + (b.f ? tek(b.f, b.sf || b.s) : 0);
  }
  sat() { const b = this.al(this.secili); if (!b) return; this.M.altin += this.satisDegeri(b); this._rafEkle(b.e || []); this._koy(this.secili, null); this.secili = null; this.kaynasMod = false; this._yay('ses', 'sat'); this._degisti(); }
  birimAd(b) { if (b.canavar) return D.kahraman(b.canavar).ad; return b.f ? D.kahraman(b.h).ad.split(' ')[0] + ' × ' + D.kahraman(b.f).ad.split(' ')[0] : D.kahraman(b.h).ad; }
  /** Tahta hücresi i → motor konumu: x = sütun (0..3), y = sıra (0 ön, 1 orta, 2 arka). */
  takim() { return this.M.tahta.map((b, i) => b && { h: b.h, s: b.s, ...(b.f ? { f: b.f } : {}), x: i % SUTUN, y: Math.floor(i / SUTUN), ...(b.e && b.e.length ? { e: b.e.slice() } : {}) }).filter(Boolean); }
  soylar(takim) { return S.soySay(takim || this.takim()); }

  /** Savaşı hazırla: motor nesnesini döndürür (sahne onu oynatır). */
  savasHazirla() {
    const M = this.M;
    if (M.kervan) { this.bildir('Kervan: önce bir kahraman seç', 'hata'); return null; }
    // bekleyen seçimler savaştan önce kapanır (seçilmediyse ilk seçenek)
    if (M.ilkSecim) this.ilkSec(0);
    if (M.ganimetSecim) this.ganimetSec(0);
    const takim = this.takim();
    if (!takim.length) { this.bildir('Tahtaya en az 1 kahraman koy', 'hata'); return null; }
    if (!M.rakip) { this.bildir('Rakip aranıyor…'); return null; }
    const pve = !!M.rakip.pve;
    this._savas = { benim: takim, rakip: M.rakip, alamet: M.alamet, tohum: M.tohum + M.tur, kayit: [], pve };
    // Arena: Gün Batımı (bölüm 1.4); canavarlar Kut kullanmaz
    const sim = S.Savas(takim, M.rakip.takim, { tohum: this._savas.tohum, alamet: M.alamet, yz: pve ? [] : [1], kayit: this._savas.kayit,
      ...(this.seviyeli() ? { gunBatimi: K.gunBatimi.basla } : {}) });
    // 3D sahne canavar modellerini bilmiyor (SAHNE_GEREKSINIM.md, Adım 4): savaş kurulduktan sonra canavarın görsel birimi yerine
    // gorunum kahramanı konur (motor u.b'yi kurulumdan sonra okumaz). Gerçek kimlik u.b.canavar'da.
    if (pve) for (const u of sim.birimler) { const c = u.taraf === 1 && D.canavar(u.b.h); if (c) u.b = { ...u.b, h: c.gorunum, canavar: c.id }; }
    return sim;
  }
  duelloHazirla(kod) {
    const r = O.coz(kod); if (!r) { this.bildir('Kod çözülemedi', 'hata'); return null; }
    if (!this.P.sonTakim) { this.bildir('Önce bir maç oyna', 'hata'); return null; }
    const alamet = D.ALAMETLER[Math.floor(Math.random() * D.ALAMETLER.length)].id, tohum = (Math.random() * 1e9) | 0;
    this._savas = { benim: this.P.sonTakim, rakip: { ad: r.ad || 'Arkadaş', takim: r.takim, kaynak: 'duello' }, alamet, tohum, duello: true, kayit: [] };
    return S.Savas(this.P.sonTakim, r.takim, { tohum, alamet, yz: [1], kayit: this._savas.kayit });
  }
  /** Savaş bitti: sonucu işle; maç bittiyse özet döner. */
  savasBitti(sonuc) {
    const b = this._savas, k = sonuc.kazanan; if (!b) return null;
    if (b.duello) { this._savas = null; return { duello: true, kazanan: k }; }
    const M = this.M, kr = this.kural();
    if (!b.pve) O.Hayalet.birak({ tur: M.tur, kupa: this.P.kupa, takim: b.benim, ad: this.P.ad, oyuncu: this.P.oyuncu, mod: M.mod, ...(this.seviyeli() ? { seviye: M.seviye } : {}) });
    if (k === 0) { M.zafer++; for (const t of b.benim) { this.P.usta[t.h] = (this.P.usta[t.h] || 0) + 1; if (t.f) this.P.usta[t.f] = (this.P.usta[t.f] || 0) + 1; } }
    M.gecmis.push(k); this.P.sonTakim = b.benim; this._savas = null;
    let ts = { hasar: 0, altin: 0, xp: 0 };
    if (this.seviyeli()) {
      // hasar (PvP: bölüm tabanı + rakibin sağ kalan yıldızları; canavar: taban + kalan canavar, bölüm 1'de yok), seri, galibiyet,
      // ganimetin sabit altını, savaş deneyimi (1-1 sonunda yok); canavar turunda ganimet (kaybedilse de)
      const once = M.seviye; ts = L.turSonu(M, M.tur - 1, sonuc); M.sonHasar = ts.hasar;
      if (M.seviye > once) { this._yay('seviye', { seviye: M.seviye }); this.bildir(`Seviye ${M.seviye}: takımına ${K.takimBoyutu(M.seviye)} kahraman koyabilirsin`, 'iyi'); }
      const g = b.pve ? this._ganimet(M.tur - 1) : null;
      ts.esya = g ? g.esya : []; ts.kahraman = g ? g.kahraman : []; ts.secim = g ? g.secim : null; ts.zarf = g ? g.zarf : null;
      if (g) ts.altin += g.ekAltin;
      if (ts.altin) this.bildir(`Ganimet: +${ts.altin} altın`, 'iyi');
      if (M.can <= 0 || M.tur - 1 >= GECICI_SON_R) return this._macBitti(ts);
    } else {
      if (k === 1) M.can--;
      if (M.zafer >= kr.zaferHedef || M.can <= 0) return this._macBitti(ts);
    }
    M.tur++; this.kaydet();
    return { devam: true, kazanan: k, hasar: ts.hasar, ganimet: ts.altin, esya: ts.esya || [], kahraman: ts.kahraman || [], secim: ts.secim || null, zarf: ts.zarf || null, pve: !!b.pve, can: M.can };
  }
  _macBitti(ts = { hasar: 0, altin: 0 }) {
    const M = this.M, sev = this.seviyeli();
    // Seviyeli maç (geçici, lobi gelene kadar): can bitmeden son tura ulaşan kazanır; kupa ulaşılan bölüme göre.
    const bolum = sev ? L.turPlan(M.tur - 1).bolum : 0;
    const kazandi = sev ? M.can > 0 : M.zafer >= this.kural().zaferHedef;
    const fark = kazandi ? 40 : sev ? [-30, -30, -30, -20, -10, 10][Math.min(bolum, 5)] : M.zafer * 8 - 30;
    this.P.kupa = Math.max(0, this.P.kupa + fark); this.P.istat.mac++; if (kazandi) this.P.istat.birinci++;
    const ozet = { bitti: true, kazandi, fark, kupa: this.P.kupa, gecmis: M.gecmis.slice(), kod: O.kodla(this.P.sonTakim, this.P.ad), takim: this.P.sonTakim, zafer: M.zafer, tur: M.tur, mod: M.mod, seviye: M.seviye,
      can: M.can, turAd: this.turAd(), hasar: ts.hasar, kazanan: M.gecmis[M.gecmis.length - 1] };
    this.P.mac = null; this.M = null; this.kaydet(); return ozet;
  }
  duelloKodu() { return this.P.sonTakim ? O.kodla(this.P.sonTakim, this.P.ad) : null; }
}
