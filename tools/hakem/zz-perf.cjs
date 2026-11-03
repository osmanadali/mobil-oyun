module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo } = T;
  const SEEN = Object.fromEntries(Array.from({ length: 60 }, (_, k) => [k, 1]));
  const { ctx, page } = await open(browser, URL, { vp: [412, 915], save: { played: 60, level: 120, stars: starsUpTo(120), seen: SEEN, remindAsked: true, hints: 5 } });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => { window.__lt = []; window.__ph = 'home'; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([window.__ph, Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: false });
    window.__fr = {}; let last = performance.now(); const f = t => { const d = t - last; last = t; const k = window.__ph; (window.__fr[k] ||= []).push(d); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const ph = k => page.evaluate(k => { window.__ph = k; }, k);
  await page.waitForTimeout(2500);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  const prof = async (name, fn) => { await cdp.send('Profiler.start'); await fn(); const { profile } = await cdp.send('Profiler.stop');
    const self = {}, byId = new Map(profile.nodes.map(n => [n.id, n])); const dt = profile.timeDeltas; let tot = 0;
    profile.samples.forEach((id, i) => { const n = byId.get(id), f = n.callFrame, k = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; self[k] = (self[k] || 0) + (dt[i] || 0) / 1000; tot += (dt[i] || 0) / 1000; });
    require('fs').writeFileSync('/tmp/claude-0/-home-user-mobil-oyun/797c6cbe-7f19-5e40-a734-1dbbb45c480e/scratchpad/prof-' + name + '.txt', Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => v.toFixed(1).padStart(8) + ' ms  ' + k).join('\n') + '\n total ' + tot.toFixed(0)); };
  await ph('play-start');
  { const ev = [], done = new Promise(r => cdp.on('Tracing.tracingComplete', r)); const h = d => ev.push(...d.value); cdp.on('Tracing.dataCollected', h);
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
    await page.click('#bPlay'); await page.waitForTimeout(1500);
    await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', h);
    // ana iş parçacığındaki uzun görevlerin içi: her RunTask > 40 ms için alt olayların toplamı
    const main = ev.filter(e => e.ph === 'X' && e.dur), tasks = main.filter(e => e.name === 'RunTask' && e.dur > 40000), out = [];
    for (const t of tasks) { const sub = {}; for (const e of main) if (e.tid === t.tid && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e !== t && e.name !== 'RunTask') { const k = e.name + (e.name === 'UpdateLayoutTree' ? `(${e.args?.elementCount})` : e.name === 'FunctionCall' ? `(${(e.args?.data?.functionName || '') + ':' + (e.args?.data?.lineNumber || '')})` : e.name === 'EventDispatch' ? `(${e.args?.data?.type})` : e.name === 'TimerFire' ? '' : ''); sub[k] = (sub[k] || 0) + e.dur / 1000; }
      out.push(Math.round(t.dur / 1000) + 'ms: ' + Object.entries(sub).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => k + ' ' + v.toFixed(0)).join(' | ')); }
    require('fs').writeFileSync('/tmp/claude-0/-home-user-mobil-oyun/797c6cbe-7f19-5e40-a734-1dbbb45c480e/scratchpad/trace-start.txt', out.join('\n')); }
  await ph('play');
  const ev = [], done = new Promise(r => cdp.on('Tracing.tracingComplete', r)); cdp.on('Tracing.dataCollected', d => ev.push(...d.value));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
  await solve(page, 25);
  await cdp.send('Tracing.end'); await done;
  const agg = {}; for (const e of ev) if (e.ph === 'X' && e.dur) { agg[e.name] = (agg[e.name] || 0) + e.dur / 1000; }
  const lay = {}; for (const e of ev) if (e.name === 'UpdateLayoutTree' && e.args?.elementCount) { lay.n = (lay.n || 0) + 1; lay.el = (lay.el || 0) + e.args.elementCount; }
  const paints = {}; for (const e of ev) if (e.name === 'Paint' && e.args?.data) { const k = e.args.data.nodeId + ':' + (e.args.data.clip ? e.args.data.clip.slice(0, 4).map(Math.round).join(',') : ''); paints[k] = (paints[k] || 0) + 1; }
  require('fs').writeFileSync('/tmp/claude-0/-home-user-mobil-oyun/797c6cbe-7f19-5e40-a734-1dbbb45c480e/scratchpad/trace-play.txt', Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => v.toFixed(1).padStart(9) + ' ms  ' + k).join('\n') + '\nstyle ' + JSON.stringify(lay) + '\npaints ' + JSON.stringify(Object.entries(paints).sort((a, b) => b[1] - a[1]).slice(0, 12)));
  await ph('win'); await prof('win', () => page.waitForTimeout(4000));
  await ph('next'); await page.click('#mNext').catch(() => {}); await page.waitForTimeout(1500);
  await ph('home'); await page.evaluate(() => { document.getElementById('bBack').click(); document.getElementById('pHome')?.click(); }); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const out = {}; for (const [k, a] of Object.entries(window.__fr)) { const s = a.slice(1).sort((x, y) => x - y); out[k] = { n: s.length, p50: Math.round(s[s.length >> 1]), p95: Math.round(s[Math.floor(s.length * .95)]), max: Math.round(s.at(-1)), jank: s.filter(x => x > 50).length }; }
    const lt = {}; for (const [k, d] of window.__lt) (lt[k] ||= []).push(d);
    const R = window.__ray, gen = []; for (const l of [121, 200, 300, 450, 600]) { const t = performance.now(); R.puzzleFor(l); gen.push([l, Math.round(performance.now() - t)]); }
    return { out, lt, gen };
  });
  check('zz.perf', 'perf', true, JSON.stringify(r));
  await ctx.close();
};
