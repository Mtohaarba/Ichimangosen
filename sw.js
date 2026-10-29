/* ============================================================
   BENKYOU — Service Worker
   STRATEGI: NETWORK-FIRST — file terbaru SELALU diambil dulu dari
   GitHub Pages; cache cuma dipakai kalau lagi offline / internet mati.
   Jadi setiap edit langsung di GitHub → tinggal refresh → langsung tampil.
   Kalau nanti update sw.js ini lagi, selalu NAIKKAN angka versinya.
   ============================================================ */
const VER = 'benkyou-v7';
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

  // File milik aplikasi ini → coba JARINGAN dulu (no-cache = selalu tanya
  // ke server ada versi lebih baru gak), gagal/offline → pakai salinan cache
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(VER).then((c) => c.put(req, cp));
        }
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) =>
          r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
    );
    return;
  }
  // Supabase / CDN / lainnya → selalu lewat jaringan (JANGAN di-cache)
});
