/* App shell is versioned; photos and voices are cached on use (or by explicit download).
 * No activate-on-install: updates wait for the player's confirmation. */
const VERSION = "__VERSION__";
const SHELL = "mrs-shell-" + VERSION,
  MEDIA = "mrs-media-v1";
const FILES = __SHELL__;
const base = new URL("./", self.location.href);
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) =>
        c.addAll(["./", ...FILES].map((p) => new URL(p, base).href)),
      ),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys())
        if (k.startsWith("mrs-shell-") && k !== SHELL) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (e) => {
  const req = e.request,
    u = new URL(req.url);
  if (
    req.method !== "GET" ||
    u.origin !== base.origin ||
    !u.pathname.startsWith(base.pathname)
  )
    return;
  const media = /\/assets\/(photos|audio)\//.test(u.pathname);
  e.respondWith(
    (async () => {
      const cache = await caches.open(media ? MEDIA : SHELL),
        cached = await cache.match(req, {
          ignoreSearch: true,
          ignoreVary: true,
        });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200 && res.type === "basic") {
          if (media) {
            const copy = res.clone();
            e.waitUntil(
              (async () => {
                try {
                  await cache.put(req, copy);
                  const keys = await cache.keys();
                  for (const k of keys.slice(0, Math.max(0, keys.length - 140)))
                    await cache.delete(k);
                } catch {
                  /* A full media cache must not break gameplay. */
                }
              })(),
            );
          }
        }
        return res;
      } catch {
        if (req.mode === "navigate") {
          const index = await cache.match(new URL("index.html", base).href);
          if (index) return index;
        }
        return new Response("Offline: asset not downloaded", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })(),
  );
});
