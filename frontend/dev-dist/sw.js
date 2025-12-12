/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-6977a181'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "3ca0b8505b4bec776b69afdba2768812"
  }, {
    "url": "/index.html",
    "revision": "0.lgr1q6t1c4o"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    allowlist: [/^\/$/],
    denylist: [/^\/api/]
  }));
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(admin|auth|users|userItineraries|visited-sites|itinerary-progress|logs)\/.*/i, new workbox.NetworkOnly(), 'GET');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews$/i, new workbox.NetworkOnly(), 'POST');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews\/.*/i, new workbox.NetworkOnly(), 'PUT');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews\/.*/i, new workbox.NetworkOnly(), 'DELETE');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/emergency.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "emergency-contacts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/pins(\/.*)?$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "tour-pins-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 150,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/itineraries\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "tour-itineraries-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews(\/[^\/]+)?(\?.*)?$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "tour-reviews-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 259200
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/(facades|arModels|emergency)\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "tour-static-assets",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 250,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/itineraries\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "tour-itinerary-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/(profile|reviews|userItineraries|media)\/.*/i, new workbox.NetworkFirst({
    "cacheName": "s3-user-content",
    "networkTimeoutSeconds": 5,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 172800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(bot|openai|gemini).*/i, new workbox.NetworkFirst({
    "cacheName": "chatbot-cache",
    "networkTimeoutSeconds": 30,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 86400
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "local-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\.(?:mp4|webm|ogg|mov)$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "videos-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 7776000
    }), new workbox.RangeRequestsPlugin()]
  }), 'GET');
  workbox.registerRoute(/index\.html/, new workbox.NetworkFirst(), 'GET');
  workbox.registerRoute(/\.(?:glb|gltf)$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "3d-models-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 7776000
    })]
  }), 'GET');
  workbox.registerRoute(/\.(?:woff|woff2|ttf|eot)$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/api\.mapbox\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "mapbox-tiles-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 2000,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|unpkg\.com|www\.gstatic)\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "external-cdn-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
