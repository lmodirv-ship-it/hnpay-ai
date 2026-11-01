/**
 * HN-Pay embedded checkout SDK.
 *
 * Usage in any of your 149 sites:
 *
 *   <script src="https://YOUR-HN-PAY-HOST/hn-pay.js"></script>
 *   <script>
 *     HnPay.open({
 *       embed_url: "...",   // from POST /api/public/v1/checkout-sessions
 *       onSuccess: (evt) => { location.reload(); },
 *       onClose:   ()    => {},
 *       onFailed:  ()    => {},
 *     });
 *   </script>
 *
 * The site backend MUST call POST /api/public/v1/checkout-sessions with its
 * server-side API key to obtain the embed_url (containing a short-lived
 * client_token). Never expose sk_live_ keys to the browser.
 */
(function () {
  if (window.HnPay) return;
  var STYLE = [
    ".hnpay-backdrop{position:fixed;inset:0;background:rgba(3,6,10,.72);backdrop-filter:blur(6px);z-index:2147483000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .18s ease}",
    ".hnpay-backdrop.open{opacity:1}",
    ".hnpay-frame{width:100%;max-width:460px;height:min(720px,92vh);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;background:#0a0a0a;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(245,158,11,.15);transform:scale(.96);transition:transform .18s ease}",
    ".hnpay-backdrop.open .hnpay-frame{transform:scale(1)}",
    ".hnpay-close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.5);color:#fff;border:1px solid rgba(255,255,255,.1);width:32px;height:32px;border-radius:9999px;font-size:16px;cursor:pointer;z-index:2147483001}",
  ].join("");

  function ensureStyle() {
    if (document.getElementById("hnpay-style")) return;
    var s = document.createElement("style");
    s.id = "hnpay-style";
    s.innerHTML = STYLE;
    document.head.appendChild(s);
  }

  function open(opts) {
    if (!opts || !opts.embed_url) {
      console.error("[HnPay] embed_url is required");
      return { close: function () {} };
    }
    ensureStyle();

    var backdrop = document.createElement("div");
    backdrop.className = "hnpay-backdrop";

    var frame = document.createElement("iframe");
    frame.className = "hnpay-frame";
    frame.src = opts.embed_url;
    frame.allow = "payment";
    frame.setAttribute("title", "HN-Pay secure checkout");

    var closeBtn = document.createElement("button");
    closeBtn.className = "hnpay-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close checkout");

    backdrop.appendChild(frame);
    backdrop.appendChild(closeBtn);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () { backdrop.classList.add("open"); });

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      window.removeEventListener("message", onMessage);
      backdrop.classList.remove("open");
      setTimeout(function () { backdrop.remove(); }, 200);
      if (typeof opts.onClose === "function") opts.onClose();
    }

    function onMessage(evt) {
      var d = evt && evt.data;
      if (!d || d.source !== "hn-pay") return;
      if (d.type === "hnpay:status") {
        if (d.status === "succeeded") {
          if (typeof opts.onSuccess === "function") opts.onSuccess(d);
        } else if (d.status === "failed") {
          if (typeof opts.onFailed === "function") opts.onFailed(d);
        }
      } else if (d.type === "hnpay:close") {
        close();
      }
    }

    window.addEventListener("message", onMessage);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });

    return { close: close };
  }

  window.HnPay = { open: open };
})();

/**
 * HN-Pay Live SDK v2 — <script src="https://www.hnpay.live/sdk.js" data-site-id="..."></script>
 * Exposes HnPay.siteId and HnPay.checkoutUrl(sessionId) on top of HnPay.open().
 */
(function () {
  var cur = document.currentScript || document.querySelector('script[src*="sdk.js"][data-site-id]');
  var siteId = cur && cur.getAttribute("data-site-id");
  var origin = "https://www.hnpay.live";
  try { if (cur && cur.src) origin = new URL(cur.src).origin; } catch (e) {}
  if (!window.HnPay) window.HnPay = {};
  window.HnPay.siteId = siteId || null;
  window.HnPay.origin = origin;
  window.HnPay.checkoutUrl = function (sessionId) { return origin + "/checkout/" + encodeURIComponent(sessionId); };
  window.HnPay.version = "2.0.0";
})();
