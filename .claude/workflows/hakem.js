export const meta = {
  name: 'hakem',
  description: 'Ray hakemi: test robotu + 4 kişilik yapay zekâ jürisi → puan, yayın kararı, geliştirme listesi (docs/HAKEM_RAPORU.md)',
  whenToUse: 'Oyunda büyük bir değişiklikten sonra veya yayın öncesi kalite kontrolü için.',
  phases: [
    { title: 'Robot', detail: 'node tools/hakem.cjs — otomatik oynanış, ölçüm, ekran görüntüsü' },
    { title: 'Jüri', detail: '4 bağımsız hakem: oyuncu, görsel tasarımcı, oyun/büyüme, teknik' },
    { title: 'Rapor', detail: 'Puanları birleştir, önceliklendir, docs/HAKEM_RAPORU.md yaz' },
  ],
}

const REPO = '/home/user/mobil-oyun'
const OUT = `${REPO}/hakem-out`
const BASE = `Oyun: "Ray — Metro Bulmaca". Tek elle, internetsiz oynanan sade bulmaca (karoya dokun → ray döner, merkezden tüm duraklara hattı bağla). Hedef kitle: 15+ yaş, toplu taşımada vakit geçiren herkes; 15-20 dk oturum; internet varken reklam (geçiş + ödüllü). Kod: ${REPO}/www (vanilla HTML/CSS/JS, Capacitor ile Android). Robot çıktıları: ${OUT}/ozet.md, ${OUT}/metrics.json, ekran görüntüleri ${OUT}/shots/*.png (Read aracıyla bakabilirsin). İstersen Playwright ile kendin oyna: require('playwright') çalışır, chromium.launch() seçeneksiz; oyunu sunmak için kendi geçici http sunucunu aç (ör. python3 -m http.server <port> -d ${REPO}/www) ve işin bitince kapat. Test kancası: window.__ray = {generate, lit, rot, G, geo}. ${REPO} altındaki HİÇBİR dosyayı değiştirme. Türkçe yaz.`

const CRITERIA = [
  ['eglence', 'Eğlence ve "bir tane daha" isteği', 20],
  ['gorsel', 'Görsel estetik ve göz konforu', 15],
  ['tekel', 'Tek el / dokunma rahatlığı', 15],
  ['anlasilir', 'İlk deneyim ve anlaşılırlık', 10],
  ['tutundurma', 'Tutundurma ve viral potansiyel', 15],
  ['reklam', 'Reklam / gelir dengesi', 10],
  ['teknik', 'Teknik kalite (performans, çevrimdışı, hatasızlık)', 15],
]
const SCORE = {
  type: 'object',
  properties: {
    scores: { type: 'object', properties: Object.fromEntries(CRITERIA.map(([k]) => [k, { type: 'integer', minimum: 0, maximum: 10 }])), required: CRITERIA.map(([k]) => k) },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' }, why: { type: 'string' }, how: { type: 'string' },
      where: { type: 'string', description: 'dosya:satır veya ekran adı' },
      impact: { type: 'string', enum: ['yüksek', 'orta', 'düşük'] }, effort: { type: 'string', enum: ['küçük', 'orta', 'büyük'] },
    }, required: ['title', 'why', 'how', 'impact', 'effort'] } },
    verdict: { type: 'string' },
  },
  required: ['scores', 'strengths', 'improvements', 'verdict'],
}
const JUDGES = [
  { key: 'oyuncu', who: 'Metroda ayakta, tek elle oynayan 22 yaşında bir oyuncusun. Block Blast, Royal Match, Wordle oynarsın; sıkılınca hemen silersin.', focus: 'Oyunu gerçekten oyna (Playwright ile en az 8 bölüm + Günün Hattı, 390x844 ve 360x640). İlk 30 saniye, akış, zorluk artışı, tatmin anları, başparmak erişimi, göz yorgunluğu. Seni uygulamayı silmeye iten her şeyi yaz.' },
  { key: 'tasarim', who: 'Mobil oyunlarda çalışmış kıdemli bir UI/görsel tasarımcısın.', focus: 'Koyu ve açık temadaki tüm ekran görüntülerini incele; gerekirse kendin çek. Görsel hiyerarşi, kontrast (WCAG), tipografi, renk, animasyon kalitesi, cila, "göz yormayan ama çekici" hedefi. Her öneride tam CSS/JS değerini ver.' },
  { key: 'buyume', who: 'Hiper/hibrit-casual oyunlarda oyun tasarımcısı ve büyüme (retention, monetization) uzmanısın.', focus: 'Zorluk eğrisi (metrics.json → generator ve playthrough), oturum döngüsü, D1/D7 tutundurma kancaları, paylaşım/viral döngü, reklam sıklığı ve yerleşimi; mağazadaki başarılı benzerlerle kıyasla. Somut, uygulanabilir özellik önerileri.' },
  { key: 'teknik', who: 'Mobil web / Android WebView uzmanı bir QA mühendisisin.', focus: 'ozet.md ve metrics.json\'daki başarısız kontrolleri ve sınıra yakın ölçümleri analiz et; www/ kodunu oku. Hata, kenar durum, performans, pil, çevrimdışı, reklam akışı, kayıt bozulması, Capacitor uyumu. Her bulguyu kanıtla.' },
]

phase('Robot')
const robot = await agent(`${BASE}\n\nGörev: ${REPO} dizininde \`node tools/hakem.cjs\` komutunu çalıştır (5 dk zaman aşımı ver). Bitince ${OUT}/ozet.md dosyasını oku. Geçen/başarısız kontrol sayısını, başarısız kontrolleri ayrıntılarıyla ve ${OUT}/shots altındaki dosya adlarını döndür. Komut çökerse hatayı aynen döndür; düzeltmeye çalışma.`, {
  label: 'robot', phase: 'Robot',
  schema: { type: 'object', properties: { passed: { type: 'integer' }, total: { type: 'integer' }, failed: { type: 'array', items: { type: 'string' } }, shots: { type: 'array', items: { type: 'string' } }, crash: { type: 'string' } }, required: ['passed', 'total', 'failed', 'shots'] },
})
if (!robot) return { error: 'Robot çalışmadı' }
log(`Robot: ${robot.passed}/${robot.total} kontrol geçti`)

phase('Jüri')
const crit = CRITERIA.map(([k, name, w]) => `- ${k}: ${name} (ağırlık %${w})`).join('\n')
const verdicts = await parallel(JUDGES.map(j => () => agent(
  `${BASE}\n\nSen: ${j.who}\nOdağın: ${j.focus}\n\nRobot sonucu: ${robot.passed}/${robot.total} geçti. Başarısız: ${robot.failed.join(' | ') || 'yok'}.\n\nHer kriteri 0-10 puanla (10 = mağazada ilk 10'a girecek kalite, 7 = iyi ama sıradan, 5 = vasat):\n${crit}\n\nSonra: güçlü yanlar (en fazla 4), geliştirme önerileri (en etkili 4-8 tane; her biri neden, nasıl, nerede, etki, efor) ve tek cümlelik karar. Cömert puan verme; puanı gerekçelendirecek kanıtı önerilerde göster.`,
  { label: `hakem:${j.key}`, phase: 'Jüri', schema: SCORE })))
const panel = verdicts.map((v, i) => v && { judge: JUDGES[i].key, ...v }).filter(Boolean)
if (!panel.length) return { error: 'Jüri sonuç vermedi', robot }

// ağırlıklı puan (0-100)
const avg = Object.fromEntries(CRITERIA.map(([k]) => [k, +(panel.reduce((a, p) => a + p.scores[k], 0) / panel.length).toFixed(1)]))
const total = Math.round(CRITERIA.reduce((a, [k, , w]) => a + avg[k] * w, 0) / 10)
log(`Jüri puanı: ${total}/100`)

phase('Rapor')
const report = await agent(`${BASE.replace('HİÇBİR dosyayı değiştirme', 'yalnızca docs/HAKEM_RAPORU.md dosyasını yaz')}

Görev: Aşağıdaki hakem verilerini birleştirip ${REPO}/docs/HAKEM_RAPORU.md dosyasını (Türkçe, sade, okunaklı) yaz/üzerine yaz.

Yapı:
1. Başlık + tarih + tek satır karar. Yayın eşiği: 80/100. Puan ${total}/100 → ${total >= 80 ? '"Yayına hazır"' : '"Yayın öncesi geliştirme gerekli"'}.
2. Puan tablosu: kriter | ağırlık | ortalama | hakem başına puanlar.
3. Robot özeti: ${robot.passed}/${robot.total}, başarısızlar.
4. Güçlü yanlar (tekrarsız, en fazla 6).
5. Geliştirme listesi: benzer önerileri BİRLEŞTİR, birden fazla hakemin söylediğini işaretle (×2, ×3). Öncelik: P0 (yayın engeli / hata), P1 (yüksek etki, küçük-orta efor), P2 (sonra). Her madde: başlık, neden, nasıl (somut değer/kod yeri), etki, efor, hangi hakemler. En fazla 20 madde.
6. Hakem görüşleri: her hakemin tek cümlelik kararı.

Ortalama puanlar: ${JSON.stringify(avg)}
Kriterler: ${JSON.stringify(CRITERIA)}
Robot: ${JSON.stringify(robot)}
Jüri: ${JSON.stringify(panel)}

Dosyayı yazdıktan sonra döndür: P0/P1/P2 madde sayıları ve en önemli 5 maddenin tek satırlık başlıkları.`, {
  label: 'rapor', phase: 'Rapor',
  schema: { type: 'object', properties: { p0: { type: 'integer' }, p1: { type: 'integer' }, p2: { type: 'integer' }, top5: { type: 'array', items: { type: 'string' } } }, required: ['p0', 'p1', 'p2', 'top5'] },
})
return { total, gate: total >= 80 ? 'Yayına hazır' : 'Geliştirme gerekli', avg, robot: `${robot.passed}/${robot.total}`, report }
