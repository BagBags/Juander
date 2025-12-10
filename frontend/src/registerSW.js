// Service Worker Registration with Auto-Update
let reloadScheduled = false;
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        setInterval(() => {
          registration.update();
        }, 60000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
              showUpdateNotification();
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloadScheduled) return;
          reloadScheduled = true;
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        });
      })
      .catch(() => {});
  });
}

function showUpdateNotification() {
  if (reloadScheduled) return;
  if (document.visibilityState !== "visible") return;
  reloadScheduled = true;
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
