// Ray — robot testleri için küçük Firestore + anonim giriş benzetimi (Node içinde). www/lig.js'in GERÇEK Firebase kodu
// (window.__ligFake olmadan) Playwright'ın ağ yakalamasıyla buna bağlanır: iki sayfa aynı "sunucuyu" paylaşır, sunucu saati Node'un saati.
// Kapsam: lig.js'in kullandığı kadarı — commit (update + updateMask, increment / REQUEST_TIME dönüşümü, currentDocument koşulu),
// GET / DELETE (koşullu), runQuery (EQUAL, GREATER_THAN, IN, AND; limit), signUp / token / accounts:delete.
// Kurallardan kapışmayı ilgilendirenler: q/{uid} başkası yalnız wait → taken yapar; matches: a yalnız pa'yı, b yalnız pb'yi yazar.
'use strict';
module.exports = function fakeFirebase({ delay = [25, 70] } = {}) {
  const docs = new Map();   // yol → { fields, updateTime, createTime }
  const users = new Set();
  let last = 0, nUid = 0;
  const stamp = () => { let t = Date.now() * 1000; if (t <= last) t = last + 1; last = t; return t; };   // mikro saniye, tekdüze artan
  const iso = us => new Date(Math.floor(us / 1000)).toISOString().replace('Z', String(us % 1000).padStart(3, '0') + 'Z');
  const isoMs = ms => new Date(ms).toISOString();
  const val = v => !v ? null : 'integerValue' in v ? +v.integerValue : 'doubleValue' in v ? v.doubleValue : 'stringValue' in v ? v.stringValue : 'booleanValue' in v ? v.booleanValue
    : 'timestampValue' in v ? Date.parse(v.timestampValue) : 'nullValue' in v ? null : 'mapValue' in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : 'arrayValue' in v ? (v.arrayValue.values || []).map(val) : null;
  const kind = v => !v ? 'null' : 'timestampValue' in v ? 't' : ('integerValue' in v || 'doubleValue' in v) ? 'n' : 'stringValue' in v ? 's' : 'booleanValue' in v ? 'b' : 'o';
  const getF = (fields, p) => { let cur = { mapValue: { fields } }; for (const k of p.split('.')) { cur = cur?.mapValue?.fields?.[k]; if (!cur) return undefined; } return cur; };
  const setF = (fields, p, v) => { const ks = p.split('.'); let f = fields; for (const k of ks.slice(0, -1)) { if (!f[k]?.mapValue) f[k] = { mapValue: { fields: {} } }; f[k].mapValue.fields = f[k].mapValue.fields || {}; f = f[k].mapValue.fields; } if (v === undefined) delete f[ks.at(-1)]; else f[ks.at(-1)] = v; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const pathOf = name => name.split('/documents/')[1];
  const out = (path, d) => ({ name: `projects/ray-metro/databases/(default)/documents/${path}`, fields: d.fields, createTime: iso(d.createTime), updateTime: iso(d.updateTime) });
  const uidOf = req => (req.headers().authorization || '').replace('Bearer tok-', '');
  // kapışma kuralları (firestore.rules'un ilgili kısmı)
  function allowed(uid, path, before, after) {
    const [coll, id] = path.split('/');
    if (coll === 'q' && before && id !== uid) {
      const changed = new Set([...Object.keys(before.fields), ...Object.keys(after)].filter(k => JSON.stringify(before.fields[k]) !== JSON.stringify(after[k])));
      return val(before.fields.state) === 'wait' && val(after.state) === 'taken' && [...changed].every(k => k === 'state' || k === 'mid');
    }
    if (coll === 'matches') {
      if (!before) return val(after.b) === uid;
      const a = val(before.fields.a), b = val(before.fields.b);
      const changed = [...new Set([...Object.keys(before.fields), ...Object.keys(after)])].filter(k => JSON.stringify(before.fields[k]) !== JSON.stringify(after[k]));
      return (uid === a && changed.every(k => k === 'pa')) || (uid === b && changed.every(k => k === 'pb'));
    }
    return true;
  }
  function commit(uid, writes) {
    const us = stamp(), next = new Map(), res = [];
    for (const wr of writes) {
      const path = pathOf(wr.update.name), before = next.get(path) ?? docs.get(path);
      const cd = wr.currentDocument;
      if (cd?.exists === false && before) throw [409, 'ALREADY_EXISTS'];
      if (cd?.exists === true && !before) throw [404, 'NOT_FOUND'];
      if (cd?.updateTime && (!before || cd.updateTime !== iso(before.updateTime))) throw [400, 'FAILED_PRECONDITION'];
      const fields = clone(before?.fields || {});
      const mask = wr.updateMask?.fieldPaths;
      if (mask) for (const p of mask) setF(fields, p, getF(wr.update.fields || {}, p) && clone(getF(wr.update.fields || {}, p)));
      else Object.assign(fields, clone(wr.update.fields || {}));
      const tr = [];
      for (const t of wr.updateTransforms || []) {
        if (t.increment) { const cur = val(getF(fields, t.fieldPath)) || 0, v = cur + val(t.increment); setF(fields, t.fieldPath, { integerValue: String(v) }); tr.push({ integerValue: String(v) }); }
        else if (t.setToServerValue === 'REQUEST_TIME') { const v = { timestampValue: iso(us) }; setF(fields, t.fieldPath, v); tr.push(v); }
      }
      if (!allowed(uid, path, before, fields)) throw [403, 'PERMISSION_DENIED'];
      next.set(path, { fields, createTime: before?.createTime || us, updateTime: us });
      res.push({ updateTime: iso(us), ...(tr.length ? { transformResults: tr } : {}) });
    }
    for (const [p, d] of next) docs.set(p, d);
    return { commitTime: iso(us), writeResults: res };
  }
  const cmp = (a, op, b) => {
    if (op === 'IN') return (b.arrayValue?.values || []).some(x => kind(x) === kind(a) && val(x) === val(a));
    if (kind(a) !== kind(b)) return false;
    const x = val(a), y = val(b);
    return op === 'EQUAL' ? x === y : op === 'GREATER_THAN' ? x > y : op === 'LESS_THAN' ? x < y : false;
  };
  function runQuery(parent, q) {
    const coll = q.from[0].collectionId, pre = (parent ? parent + '/' : '') + coll + '/';
    const fs = q.where?.compositeFilter ? q.where.compositeFilter.filters : q.where ? [q.where] : [];
    let rows = [...docs.entries()].filter(([p]) => p.startsWith(pre) && !p.slice(pre.length).includes('/'))
      .filter(([, d]) => fs.every(f => { const v = getF(d.fields, f.fieldFilter.field.fieldPath); return v !== undefined && cmp(v, f.fieldFilter.op, f.fieldFilter.value); }));
    const ineq = fs.find(f => f.fieldFilter.op === 'GREATER_THAN');
    if (ineq) rows.sort((a, b) => val(getF(a[1].fields, ineq.fieldFilter.field.fieldPath)) - val(getF(b[1].fields, ineq.fieldFilter.field.fieldPath)));
    rows = rows.slice(0, q.limit || 1e9);
    return rows.length ? rows.map(([p, d]) => ({ document: out(p, d), readTime: iso(stamp()) })) : [{ readTime: iso(stamp()) }];
  }
  const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  const wait = () => new Promise(r => setTimeout(r, delay[0] + Math.random() * (delay[1] - delay[0])));
  async function handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    await wait();
    const body = req.postData() ? (() => { try { return JSON.parse(req.postData()); } catch { return Object.fromEntries(new URLSearchParams(req.postData())); } })() : {};
    if (url.host === 'identitytoolkit.googleapis.com') {
      if (url.pathname.endsWith('accounts:signUp')) { const uid = 'U' + String(++nUid).padStart(3, '0') + Math.random().toString(36).slice(2, 8); users.add(uid); return json(route, 200, { idToken: 'tok-' + uid, refreshToken: 'rt-' + uid, localId: uid, expiresIn: '3600' }); }
      if (url.pathname.endsWith('accounts:delete')) { users.delete(String(body.idToken || '').replace('tok-', '')); return json(route, 200, {}); }
    }
    if (url.host === 'securetoken.googleapis.com') { const uid = String(body.refresh_token || '').replace('rt-', ''); return json(route, 200, { id_token: 'tok-' + uid, refresh_token: 'rt-' + uid, user_id: uid, expires_in: '3600' }); }
    if (url.host === 'firestore.googleapis.com') {
      const uid = uidOf(req), rest = decodeURIComponent(url.pathname).split('/documents')[1] || '';
      try {
        if (m === 'POST' && rest.endsWith(':commit')) return json(route, 200, commit(uid, body.writes || []));
        if (m === 'POST' && rest.endsWith(':runQuery')) return json(route, 200, runQuery(rest.replace(/^\//, '').replace(/:runQuery$/, ''), body.structuredQuery));
        const path = rest.replace(/^\//, '');
        if (m === 'GET') { const d = docs.get(path); return d ? json(route, 200, out(path, d)) : json(route, 404, { error: { status: 'NOT_FOUND' } }); }
        if (m === 'DELETE') {
          const d = docs.get(path), ut = url.searchParams.get('currentDocument.updateTime');
          if (ut && (!d || iso(d.updateTime) !== ut)) return json(route, 400, { error: { status: 'FAILED_PRECONDITION' } });
          docs.delete(path); return json(route, 200, {});
        }
      } catch (e) { if (Array.isArray(e)) return json(route, e[0], { error: { status: e[1] } }); throw e; }
    }
    return route.fulfill({ status: 404, body: '' });
  }
  return {
    docs, users, val,
    async attach(ctx) { for (const h of ['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com']) await ctx.route(`https://${h}/**`, handle); },
    get: path => { const d = docs.get(path); return d ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, val(v)])) : null; },
    list: pre => [...docs.keys()].filter(p => p.startsWith(pre)),
  };
};
