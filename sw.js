/* THE WAR WITHIN – Service Worker
   Bei Änderungen an index.html o. ä. die Versionsnummer erhöhen,
   damit installierte Apps das Update laden. */
const VERSION = 'ww-v87';
const APP_SHELL = [
  './',
  './index.html',
  './auth.js?v=ww-v87',
  './life-core.js?v=ww-v87',
  './wisdom-core.js?v=ww-v87',
  './future-self-core.js?v=ww-v87',
  './projection-core.js?v=ww-v87',
  './arena-core.js?v=ww-v87',
  './arena-api.js?v=ww-v87',
  './arena-ui.js?v=ww-v87',
  './supabase-config.js?v=ww-v87',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://unpkg.com/htm@3.1.1/dist/htm.umd.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(APP_SHELL);
    // CDN-Dateien einzeln, damit ein Ausfall die Installation nicht blockiert
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('ww-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin && url.hostname.endsWith('.supabase.co')) return;
  if (url.origin === self.location.origin && url.pathname.endsWith('/supabase-config.js')) {
    e.respondWith(fetch(req).catch(() => caches.match(req))); return;
  }

  // App-Seite: erst Netz (für Updates), offline aus dem Cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Eigene Skripte: wie die Seite erst Netz, damit index.html und life-core.js usw. nie
  // aus verschiedenen Versionen stammen (sonst fehlen neue Funktionen bis zum nächsten Start)
  if (url.origin === self.location.origin && url.pathname.endsWith('.js')) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req)));
    return;
  }

  // Alles andere (CDN-Skripte, Fonts, Icons): Cache zuerst, sonst Netz + merken
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy));
    }
    return r;
  })));
});

// Erinnerungen: Klick oder Aktion („Ja“/„Später“) an die geöffnete App weitergeben
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.askId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    if (id && e.action) cs.forEach(c => c.postMessage({ type: 'ask', id, action: e.action }));
    const c = cs[0];
    return c && c.focus ? c.focus() : self.clients.openWindow('./');
  }));
});
