// Macht die App offline nutzbar: einmal geladen, laeuft sie ohne Internet weiter.
//
// Wichtig ist die Reihenfolge. Die Seite selbst wird ZUERST aus dem Netz geholt
// und nur als Rueckfallebene aus dem Speicher. Andersherum -- Speicher zuerst --
// bekommt ein installiertes Handy nie wieder ein Update zu sehen: die alte
// index.html liegt im Speicher, das Netz wird nie gefragt, und aufgeraeumt wird
// erst, wenn sich diese Datei hier aendert. Genau das ist einmal passiert.
var CACHE = "faellig-v4";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                           .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (ev) {
  if (ev.request.method !== "GET") return;

  var url;
  try { url = new URL(ev.request.url); } catch (e) { return; }
  // Fremde Adressen (z. B. die Schriften) gehen uns nichts an.
  if (url.origin !== self.location.origin) return;

  var istSeite = ev.request.mode === "navigate" ||
                 url.pathname === "/" ||
                 /\/index\.html$/.test(url.pathname);

  if (istSeite) {
    // Netz zuerst, Speicher nur als Rettung -- so kommen Aenderungen an.
    ev.respondWith(
      fetch(ev.request).then(function (res) {
        var kopie = res.clone();
        caches.open(CACHE).then(function (c) {
          c.put("./index.html", kopie);
        }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match("./index.html").then(function (hit) {
          return hit || caches.match("./");
        });
      })
    );
    return;
  }

  // Alles andere (Icons, Manifest) darf sofort aus dem Speicher kommen, wird
  // dabei aber im Hintergrund erneuert.
  ev.respondWith(
    caches.match(ev.request).then(function (hit) {
      var ausDemNetz = fetch(ev.request).then(function (res) {
        var kopie = res.clone();
        caches.open(CACHE).then(function (c) { c.put(ev.request, kopie); }).catch(function () {});
        return res;
      }).catch(function () { return hit; });
      return hit || ausDemNetz;
    })
  );
});
