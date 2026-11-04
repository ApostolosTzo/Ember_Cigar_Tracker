/*
 * Ember service worker — offline-first app shell.
 * Bump VERSION to invalidate every cached asset on a new release.
 */
const VERSION = "ember-v2"

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
]

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(VERSION)
    cache.put("./index.html", response.clone())
    return response
  } catch {
    return (await caches.match("./index.html")) || (await caches.match("./"))
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok) {
    const cache = await caches.open(VERSION)
    cache.put(request, response.clone())
  }
  return response
}

/* Fonts are cross-origin and opaque; cache them in a separate runtime bucket. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(`${VERSION}-fonts`)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response) cache.put(request, response.clone())
      return response
    })
    .catch(() => undefined)
  return cached || (await network) || Response.error()
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    if (FONT_HOSTS.includes(url.hostname)) {
      event.respondWith(staleWhileRevalidate(request))
    }
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})
