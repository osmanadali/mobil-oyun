/* Kut Arena — oyun mantığı (arayüzden bağımsız). Kurallar ../TASARIM.md ve ../OYNANIS_DERINLIK.md.
   İki biçim: 'arena' (seviye ve deneyim, seviyeye bağlı dükkân, sınırlı kahraman havuzu, 4×3 tahta, 7 yedek)
   ve 'hizli' (Hızlı Maç: prototipin kuralları, KURAL.hizli). İkisi de 4×3 tahtayı kullanır.
   Arayüz yalnız durumu okur (oyun.P, oyun.M) ve eylemleri çağırır; her değişiklikten sonra 'degisti' olayı gelir. */
const D = window.KUT_DATA, S = window.KUT_SIM, O = window.KUT_ONLINE, L = window.KUT_LOBI, K = D.KURAL, H = K.hizli;
const PANAHTAR = 'kut.profil.v2';
const SUTUN = K.tahtaSutun, HUCRE = K.tahtaSutun * K.tahtaSira;

export class Oyun {
  constructor() {
    this.P = this._oku() || { kupa: 0, usta: {}, oyuncu: Math.random().toString(36).slice(2, 10), ad: 'Oyuncu', sonTakim: null, mac: null, istat: { mac: 0, birinci: 0 } };
    // eski biçimde (3×2 tahta) kaydedilmiş yarım maç yeni tahtaya taşınmaz: kapatılır
    if (this.P.mac && (!this.P.mac.mod || this.P.mac.tahta.length !== HUCRE)) this.P.mac = null;
    this.M = this.P.mac; this.secili = null; this.kaynasMod = false; this._dinle = {};
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
  /** Ekonomi ve maç sonu kuralları. Birikimli ekonomi (adım 2) ve 8 kişilik lobi (adım 5) gelene kadar
      seviyeli maç da Hızlı Maç'ın altın, yenileme, kaynaştırma, can ve zafer sayılarını kullanır. */
  kural() { return { altinTur: H.altinTur, yenile: H.yenile, kaynastir: H.kaynastir, can: H.can, zaferHedef: H.zaferHedef }; }
  yuva() { return this.seviyeli() ? K.takimBoyutu(this.M.seviye) : H.yuva(this.M.tur); }
  yedekSayi() { return this.seviyeli() ? K.yedek : H.yedek; }
  olasilik() { return this.seviyeli() ? K.kademeOlasilik(this.M.seviye) : H.kademeOlasilik(this.M.tur); }
  /** Bir sonraki seviyeye gereken deneyim (tavanda 0). */
  xpGerek() { return this.seviyeli() ? L.xpGerek(this.M.seviye) : 0; }

  // ── maç ──
  /** mod: 'arena' (varsayılan, seviyeli) ya da 'hizli' (Hızlı Maç). */
  yeniMac(mod = 'arena') {
    const sev = mod === 'arena';
    this.P.mac = { mod: sev ? 'arena' : 'hizli', tur: 1, can: H.can, zafer: 0, altin: 0,
      seviye: sev ? K.seviyeBaslangic : 0, xp: 0,
      tahta: Array(HUCRE).fill(null), yedek: Array(sev ? K.yedek : H.yedek).fill(null), dukkan: [], kilit: false,
      tohum: (Math.random() * 1e9) | 0, zar: 1, yenileN: 0, alamet: 'yok', rakip: null, gecmis: [] };
    this.M = this.P.mac; return this.turBaslat(false);
  }
  _zar() { const M = this.M; M.zar = (M.zar * 1103515245 + 12345) & 0x7fffffff; return M.zar / 0x7fffffff; }
  async turBaslat(devam) {
    const M = this.M = this.P.mac; this.secili = null; this.kaynasMod = false;
    if (!devam) {
      M.alamet = M.tur === 1 ? 'yok' : D.ALAMETLER[Math.floor(this._zar() * D.ALAMETLER.length)].id;
      M.altin = this.kural().altinTur + (M.alamet === 'pazar' ? 2 : 0);
      const istek = { tur: M.tur, kupa: this.P.kupa, oyuncu: this.P.oyuncu, tohum: M.tohum + M.tur * 31, mod: M.mod };
      if (this.seviyeli()) {
        // rakip önce gelir: havuz onun kadrosundaki kopyaları da düşer
        M.rakip = null; this._degisti();
        M.rakip = await O.Hayalet.bul({ ...istek, sv: O.botSeviye(M.tur - 1) });
        if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
      } else {
        if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
        M.rakip = null; this._degisti();
        M.rakip = await O.Hayalet.bul(istek);
      }
    }
    this._degisti();
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
    this._birlestir(id); this._degisti();
  }
  _birlestir(id) {
    const M = this.M;
    for (const s of [1, 2]) {
      const yerler = []; for (const yer of ['tahta', 'yedek']) M[yer].forEach((b, i) => { if (b && !b.f && b.h === id && b.s === s) yerler.push({ yer, i }); });
      if (yerler.length >= 3) { const [ilk, ...kalan] = yerler.slice(0, 3); kalan.forEach(y => this._koy(y, null)); this._koy(ilk, { h: id, s: s + 1 }); this._yay('birlesti', { id, s: s + 1, yer: ilk }); this.bildir(`⭐ ${D.kahraman(id).ad} ★${s + 1}!`, 'iyi'); }
    }
  }
  /** Yuvaya dokunma: seçme, taşıma/yer değiştirme ya da kaynaştırma (kaynasMod açıksa). */
  yuvaDokun(yer, i) {
    const M = this.M, hedef = { yer, i }, b = M[yer][i], bedel = this.kural().kaynastir;
    if (this.secili && this.kaynasMod) {
      const a = this.al(this.secili);
      if (!b || (this.secili.yer === yer && this.secili.i === i)) { this.kaynasMod = false; return this._degisti(); }
      if (a.f || b.f) return this.bildir('Kaynaşmış kahraman tekrar kaynaşmaz', 'hata');
      if (a.h === b.h) return this.bildir('Aynı kahraman kaynaşmaz: üç tanesi zaten ★ olur', 'hata');
      if (M.altin < bedel) return this.bildir(`${bedel} altın gerekli`, 'hata');
      M.altin -= bedel;
      const yeni = { h: a.h, f: b.h, s: Math.min(a.s, b.s) };
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
  satisDegeri(b) { const d = (h) => D.kahraman(h).kademe; return b.s === 1 ? d(b.h) + (b.f ? d(b.f) : 0) : d(b.h) * (b.s === 2 ? 3 : 9) - 1; }
  sat() { const b = this.al(this.secili); if (!b) return; this.M.altin += this.satisDegeri(b); this._koy(this.secili, null); this.secili = null; this.kaynasMod = false; this._yay('ses', 'sat'); this._degisti(); }
  birimAd(b) { return b.f ? D.kahraman(b.h).ad.split(' ')[0] + ' × ' + D.kahraman(b.f).ad.split(' ')[0] : D.kahraman(b.h).ad; }
  /** Tahta hücresi i → motor konumu: x = sütun (0..3), y = sıra (0 ön, 1 orta, 2 arka). */
  takim() { return this.M.tahta.map((b, i) => b && { h: b.h, s: b.s, ...(b.f ? { f: b.f } : {}), x: i % SUTUN, y: Math.floor(i / SUTUN) }).filter(Boolean); }
  soylar(takim) { return S.soySay(takim || this.takim()); }

  /** Savaşı hazırla: motor nesnesini döndürür (sahne onu oynatır). */
  savasHazirla() {
    const M = this.M, takim = this.takim();
    if (!takim.length) { this.bildir('Tahtaya en az 1 kahraman koy', 'hata'); return null; }
    if (!M.rakip) { this.bildir('Rakip aranıyor…'); return null; }
    this._savas = { benim: takim, rakip: M.rakip, alamet: M.alamet, tohum: M.tohum + M.tur, kayit: [] };
    return S.Savas(takim, M.rakip.takim, { tohum: this._savas.tohum, alamet: M.alamet, yz: [1], kayit: this._savas.kayit });
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
    O.Hayalet.birak({ tur: M.tur, kupa: this.P.kupa, takim: b.benim, ad: this.P.ad, oyuncu: this.P.oyuncu, mod: M.mod, ...(this.seviyeli() ? { seviye: M.seviye } : {}) });
    if (k === 0) { M.zafer++; for (const t of b.benim) { this.P.usta[t.h] = (this.P.usta[t.h] || 0) + 1; if (t.f) this.P.usta[t.f] = (this.P.usta[t.f] || 0) + 1; } }
    else if (k === 1) M.can--;
    M.gecmis.push(k); this.P.sonTakim = b.benim; this._savas = null;
    // savaş turu sonu deneyimi: ilk tur sonunda gelmez (bölüm 2.1)
    if (this.seviyeli() && M.tur >= 2) this._xpEkle(K.pasifXp);
    if (M.zafer >= kr.zaferHedef || M.can <= 0) return this._macBitti();
    M.tur++; this.kaydet(); return { devam: true, kazanan: k };
  }
  _macBitti() {
    const M = this.M, kazandi = M.zafer >= this.kural().zaferHedef, fark = kazandi ? 40 : M.zafer * 8 - 30;
    this.P.kupa = Math.max(0, this.P.kupa + fark); this.P.istat.mac++; if (kazandi) this.P.istat.birinci++;
    const ozet = { bitti: true, kazandi, fark, kupa: this.P.kupa, gecmis: M.gecmis.slice(), kod: O.kodla(this.P.sonTakim, this.P.ad), takim: this.P.sonTakim, zafer: M.zafer, tur: M.tur, mod: M.mod, seviye: M.seviye };
    this.P.mac = null; this.M = null; this.kaydet(); return ozet;
  }
  duelloKodu() { return this.P.sonTakim ? O.kodla(this.P.sonTakim, this.P.ad) : null; }
}
