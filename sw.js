/* ============================================================
   BENKYOU ICHIMANGOSEN — Service Worker
   Versi cache dinaikkan ke benkyou-v6 (perbaikan: cover lagu ikut ke-upload
   & tersinkron ke semua akun, sembuh otomatis cover lagu lama).
   Kalau nanti update aplikasi lagi, selalu NAIKKAN angka versi ini.
   ============================================================ */
const VER = 'benkyou-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VER).then(async (c) => {
      for (const a of ASSETS) { try { await c.add(a); } catch (err) {} }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  // File milik aplikasi ini → cache-first, fallback ke index.html (SPA offline)
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((r) =>
        r ||
        fetch(req).then((res) => {
          const cp = res.clone();
          caches.open(VER).then((c) => c.put(req, cp));
          return res;
        }).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }
  // Supabase / CDN / lainnya → selalu lewat jaringan (JANGAN di-cache)
});
