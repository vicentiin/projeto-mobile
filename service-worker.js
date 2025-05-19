self.addEventListener("install", () => {
  console.log("Service Worker instalado");
});

self.addEventListener("fetch", (event) => {
  // Deixe ele passar as requisições normalmente
});