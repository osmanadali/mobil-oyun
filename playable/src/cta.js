// Ray playable: CTA katmanı (mağaza açma + reklam ağı kabuğu). Oyun mantığından ayrıdır.
// Derleme betiği bu dosyanın başına RAY_BUILD = { target, ios, android } ekler (Google sürümünde bağlantı yoktur: ExitApi tıklama adresini Google Ads'ten alır).
(function (g) {
'use strict';
var B = g.RAY_BUILD || {};
var ua = (navigator.userAgent || '');

// 'ios' | 'android' | 'other' (masaüstü: iki rozet de gösterilir)
function platform() {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}
function storeFor(which) {
  var p = which || platform();
  if (p === 'other') p = /Mac/i.test(ua) ? 'ios' : 'android';
  return p;
}

// Sırayla: Google ExitApi → MRAID (AppLovin/Unity/ironSource) → Meta FbPlayableAd → window.open
function openStore(which) {
  var url = storeFor(which) === 'ios' ? B.ios : B.android;
  try {
    if (g.ExitApi && typeof g.ExitApi.exit === 'function') { g.ExitApi.exit(); return 'exitapi'; }
    if (g.mraid && typeof g.mraid.open === 'function') { g.mraid.open(url); return 'mraid'; }
    if (g.FbPlayableAd && typeof g.FbPlayableAd.onCTAClick === 'function') { g.FbPlayableAd.onCTAClick(); return 'fb'; }
    if (url) { g.open(url, '_blank'); return 'open'; }
  } catch (e) {}
  return 'none';
}

// MRAID standart başlatma: mraid varsa 'ready' olayını, sonra görünür olmayı bekler; yoksa hemen başlar.
function whenReady(cb) {
  var done = false, once = function () { if (!done) { done = true; cb(); } }, m = g.mraid;
  if (!m || typeof m.addEventListener !== 'function') { once(); return; }
  var viewable = function () {
    if (typeof m.isViewable === 'function' && !m.isViewable()) {
      var f = function (v) { if (v) { try { m.removeEventListener('viewableChange', f); } catch (e) {} once(); } };
      m.addEventListener('viewableChange', f);
    } else once();
  };
  if (typeof m.getState === 'function' && m.getState() === 'loading') m.addEventListener('ready', viewable); else viewable();
}

g.RayCTA = { platform: platform, openStore: openStore, whenReady: whenReady, target: B.target || 'web' };
})(window);
