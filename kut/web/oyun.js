/* Kut Arena — oyun mantığı (arayüzden bağımsız). Kurallar ../TASARIM.md; prototip ../game.js ile aynı.
   Arayüz yalnız durumu okur (oyun.P, oyun.M) ve eylemleri çağırır; her değişiklikten sonra 'degisti' olayı gelir. */
const D = window.KUT_DATA, S = window.KUT_SIM, O = window.KUT_ONLINE, K = D.KURAL;
const PANAHTAR = 'kut.profil.v2';

export class Oyun {
  constructor() {
    this.P = this._oku() || { kupa: 0, usta: {}, oyuncu: Math.random().toString(36).slice(2, 10), ad: 'Oyuncu', sonTakim: null, mac: null, istat: { mac: 0, birinci: 0 } };
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

  // ── maç ──
  yeniMac() {
    this.P.mac = { tur: 1, can: K.can, zafer: 0, altin: 0, tahta: Array(6).fill(null), yedek: Array(K.yedek).fill(null), dukkan: [], kilit: false,
      tohum: (Math.random() * 1e9) | 0, zar: 1, alamet: 'yok', rakip: null, gecmis: [] };
    this.M = this.P.mac; return this.turBaslat(false);
  }
  _zar() { const M = this.M; M.zar = (M.zar * 1103515245 + 12345) & 0x7fffffff; return M.zar / 0x7fffffff; }
  async turBaslat(devam) {
    const M = this.M = this.P.mac; this.secili = null; this.kaynasMod = false;
    if (!devam) {
      M.alamet = M.tur === 1 ? 'yok' : D.ALAMETLER[Math.floor(this._zar() * D.ALAMETLER.length)].id;
      M.altin = K.altinTur + (M.alamet === 'pazar' ? 2 : 0);
      if (!M.kilit || !M.dukkan.length) this._dukkanDoldur(); M.kilit = false;
      M.rakip = null; this._degisti();
      M.rakip = await O.Hayalet.bul({ tur: M.tur, kupa: this.P.kupa, oyuncu: this.P.oyuncu, tohum: M.tohum + M.tur * 31 });
    }
    this._degisti();
  }
  _dukkanDoldur() {
    const M = this.M, ol = K.kademeOlasilik(M.tur);
    M.dukkan = Array.from({ length: K.dukkan }, () => { const r = this._zar(); const k = r < ol[0] ? 1 : r < ol[0] + ol[1] ? 2 : 3; const l = D.KAHRAMANLAR.filter(h => h.kademe === k); return l[Math.floor(this._zar() * l.length)].id; });
  }
  tahtaSay() { return this.M.tahta.filter(Boolean).length; }
  yuva() { return K.yuva(this.M.tur); }
  al(s) { return s ? this.M[s.yer][s.i] : null; }
  _koy(s, v) { this.M[s.yer][s.i] = v; }
  sahipMi(id) { return [...this.M.tahta, ...this.M.yedek].some(b => b && !b.f && b.h === id && b.s === 1); }
  birlesirMi(id) { return [...this.M.tahta, ...this.M.yedek].filter(b => b && !b.f && b.h === id && b.s === 1).length >= 2; }

  yenile() { const M = this.M; if (M.altin < K.yenile) return this.bildir('Altın yetmiyor', 'hata'); M.altin -= K.yenile; this._dukkanDoldur(); this._yay('ses', 'yenile'); this._degisti(); }
  kilit() { this.M.kilit = !this.M.kilit; this._degisti(); }

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
    const M = this.M, hedef = { yer, i }, b = M[yer][i];
    if (this.secili && this.kaynasMod) {
      const a = this.al(this.secili);
      if (!b || (this.secili.yer === yer && this.secili.i === i)) { this.kaynasMod = false; return this._degisti(); }
      if (a.f || b.f) return this.bildir('Kaynaşmış kahraman tekrar kaynaşmaz', 'hata');
      if (a.h === b.h) return this.bildir('Aynı kahraman kaynaşmaz: üç tanesi zaten ★ olur', 'hata');
      if (M.altin < K.kaynastir) return this.bildir(`${K.kaynastir} altın gerekli`, 'hata');
      M.altin -= K.kaynastir;
      const yeni = { h: a.h, f: b.h, s: Math.min(a.s, b.s) };
      this._koy(this.secili, yeni); this._koy(hedef, null);
      this._yay('kaynasti', { a: a.h, b: b.h, yer: this.secili });
      this.kaynasMod = false; this.bildir(`🔥 ${this.birimAd(yeni)} doğdu!`, 'iyi'); return this._degisti();
    }
    if (!this.secili) { if (b) this.secili = hedef; return this._degisti(); }
    if (this.secili.yer === yer && this.secili.i === i) { this.secili = null; return this._degisti(); }
    const a = this.al(this.secili);
    if (yer === 'tahta' && this.secili.yer === 'yedek' && !b && this.tahtaSay() >= this.yuva()) return this.bildir(`Bu tur en fazla ${this.yuva()} kahraman`, 'hata');
    this._koy(this.secili, b); this._koy(hedef, a); this.secili = null; this._degisti();
  }
  kaynasModDegistir() { this.kaynasMod = !this.kaynasMod; this._degisti(); }
  satisDegeri(b) { const d = (h) => D.kahraman(h).kademe; return b.s === 1 ? d(b.h) + (b.f ? d(b.f) : 0) : d(b.h) * (b.s === 2 ? 3 : 9) - 1; }
  sat() { const b = this.al(this.secili); if (!b) return; this.M.altin += this.satisDegeri(b); this._koy(this.secili, null); this.secili = null; this.kaynasMod = false; this._yay('ses', 'sat'); this._degisti(); }
  birimAd(b) { return b.f ? D.kahraman(b.h).ad.split(' ')[0] + ' × ' + D.kahraman(b.f).ad.split(' ')[0] : D.kahraman(b.h).ad; }
  takim() { return this.M.tahta.map((b, i) => b && { h: b.h, s: b.s, ...(b.f ? { f: b.f } : {}), x: i % 3, y: Math.floor(i / 3) }).filter(Boolean); }
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
    const M = this.M;
    O.Hayalet.birak({ tur: M.tur, kupa: this.P.kupa, takim: b.benim, ad: this.P.ad, oyuncu: this.P.oyuncu });
    if (k === 0) { M.zafer++; for (const t of b.benim) { this.P.usta[t.h] = (this.P.usta[t.h] || 0) + 1; if (t.f) this.P.usta[t.f] = (this.P.usta[t.f] || 0) + 1; } }
    else if (k === 1) M.can--;
    M.gecmis.push(k); this.P.sonTakim = b.benim; this._savas = null;
    if (M.zafer >= K.zaferHedef || M.can <= 0) return this._macBitti();
    M.tur++; this.kaydet(); return { devam: true, kazanan: k };
  }
  _macBitti() {
    const M = this.M, kazandi = M.zafer >= K.zaferHedef, fark = kazandi ? 40 : M.zafer * 8 - 30;
    this.P.kupa = Math.max(0, this.P.kupa + fark); this.P.istat.mac++; if (kazandi) this.P.istat.birinci++;
    const ozet = { bitti: true, kazandi, fark, kupa: this.P.kupa, gecmis: M.gecmis.slice(), kod: O.kodla(this.P.sonTakim, this.P.ad), takim: this.P.sonTakim, zafer: M.zafer, tur: M.tur };
    this.P.mac = null; this.M = null; this.kaydet(); return ozet;
  }
  duelloKodu() { return this.P.sonTakim ? O.kodla(this.P.sonTakim, this.P.ad) : null; }
}
