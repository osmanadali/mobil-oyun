// Reklam kabuğu (oyundan önce): ağ yok, kalıcı depolama yok. Oyunun kaydı yalnız bellekte (localStorage taklidi), başlangıç kaydı derlemede gömülür.
(function (w) {
  'use strict';
  function mem(init) { var m = init || {}; return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }, clear: function () { m = {}; }, key: function (i) { return Object.keys(m)[i] || null; }, get length() { return Object.keys(m).length; } }; }
  try { Object.defineProperty(w, 'localStorage', { value: mem({ ray: JSON.stringify(w.RAY_AD.save) }), configurable: true }); } catch (e) {}
  try { Object.defineProperty(w, 'sessionStorage', { value: mem(), configurable: true }); } catch (e) {}
  try { Object.defineProperty(w, 'caches', { value: undefined, configurable: true }); } catch (e) {}
  try { Object.defineProperty(navigator, 'serviceWorker', { value: { register: function () { return Promise.resolve(); }, getRegistrations: function () { return Promise.resolve([]); } }, configurable: true }); } catch (e) {}
  w.fetch = function () { return Promise.reject(new Error('offline')); };
  w.__noIntro = true; w.__ligFake = true; w.__noRec = true; w.__noFest = true;
  document.documentElement.classList.add('ad-boot');
})(window);
