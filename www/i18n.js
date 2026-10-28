// Dil seçimi: 'tr' ya da 'en'. Kayıtta save.lang varsa o, yoksa cihaz dili (tr… → Türkçe, öteki her dil → İngilizce).
// Metinler yüklemede bir kez seçilir: dil değişince sayfa yenilenir. Bütün betiklerden önce yüklenir.
// Kullanım: L('Türkçe', 'English') · durağan HTML: data-en="…" (yazı), data-en-label="…" (aria-label), data-en-title="…" (title).
(() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('ray') || '{}') || {}; } catch {}
  const dev = String((navigator.languages && navigator.languages[0]) || navigator.language || 'tr').toLowerCase();
  const lang = s.lang === 'tr' || s.lang === 'en' ? s.lang : dev.startsWith('tr') ? 'tr' : 'en';
  window.RAY_LANG = lang;
  window.L = (tr, en) => lang === 'en' ? en : tr;
  document.documentElement.lang = lang;
  if (lang !== 'en') return;
  const apply = () => {
    for (const el of document.querySelectorAll('[data-en]')) el.textContent = el.dataset.en;
    for (const el of document.querySelectorAll('[data-en-label]')) el.setAttribute('aria-label', el.dataset.enLabel);
    for (const el of document.querySelectorAll('[data-en-title]')) el.title = el.dataset.enTitle;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true }); else apply();
})();
