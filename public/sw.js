const VERSAO = "v6";
const PREFIXO = "berbel-connect-";
const CACHE_SHELL = `${PREFIXO}shell-${VERSAO}`;
const CACHE_PAGINAS = `${PREFIXO}paginas-${VERSAO}`;
const CACHE_ASSETS = `${PREFIXO}assets-${VERSAO}`;
const PRECACHE = ["/agenda", "/visitas", "/offline.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/logo-berbel.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))))
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const atuais = new Set([CACHE_SHELL, CACHE_PAGINAS, CACHE_ASSETS]);
  event.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave.startsWith(PREFIXO) && !atuais.has(chave)).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim())
  );
});

function requisicaoInternaValida(request, url) {
  if (request.method !== "GET" || url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc")) return false;
  if (request.headers.has("range") || request.headers.get("RSC") === "1") return false;
  return true;
}

async function navegar(request) {
  const cache = await caches.open(CACHE_PAGINAS);
  try {
    const resposta = await fetch(request);
    if (resposta.ok && resposta.type === "basic") {
      await cache.put(new Request(new URL(request.url).pathname), resposta.clone());
    }
    return resposta;
  } catch {
    return (await cache.match(new URL(request.url).pathname)) || (await caches.match("/offline.html"));
  }
}

async function cachePrimeiro(request) {
  const guardado = await caches.match(request);
  if (guardado) return guardado;
  const resposta = await fetch(request);
  if (resposta.ok) (await caches.open(CACHE_ASSETS)).put(request, resposta.clone()).catch(() => undefined);
  return resposta;
}

async function atualizarEmSegundoPlano(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const guardado = await cache.match(request);
  const rede = fetch(request).then((resposta) => {
    if (resposta.ok) cache.put(request, resposta.clone()).catch(() => undefined);
    return resposta;
  });
  return guardado || rede;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!requisicaoInternaValida(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(navegar(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cachePrimeiro(request));
    return;
  }
  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(atualizarEmSegundoPlano(request));
  }
});
