// Service Worker Registration with Auto-Update
let reloadScheduled = false;
function scheduleReload() {
  if (reloadScheduled) return;
  reloadScheduled = true;
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const delay = isIOS ? 3000 : 2000;
  if (document.visibilityState === "visible") {
    setTimeout(() => {
      window.location.reload();
    }, delay);
  } else {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      setTimeout(() => {
        window.location.reload();
      }, delay);
    };
    document.addEventListener("visibilitychange", onVisible);
  }
}
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
              scheduleReload();
            }
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          scheduleReload();
        });
      })
      .catch(() => {});
  });
}
