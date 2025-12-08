// Service Worker Registration with Auto-Update
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
          window.location.reload();
        });
      })
      .catch(() => {});
  });
}

function showUpdateNotification() {
  // Optional: Show a toast/notification to user
  // Auto-reload after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}
