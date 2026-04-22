import "leaflet/dist/leaflet.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* =====================================
PRODUCTION OFFLINE PWA FIX
===================================== */

if (
  "serviceWorker" in navigator &&
  process.env.NODE_ENV ===
    "production"
) {
  window.addEventListener(
    "load",
    async () => {
      try {
        const reg =
          await navigator.serviceWorker.register(
            "/service-worker.js"
          );
        navigator.serviceWorker.ready.then(() => {
  console.log("SW ready");
});
        console.log(
          "SW registered",
          reg
        );

        /* force update check */
        reg.update();

      } catch (err) {
        console.log(
          "SW error",
          err
        );
      }
    }
  );
}