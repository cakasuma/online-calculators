/*!
 * HelloKalku iframe auto-resize helper.
 *
 * Drop this script anywhere on a page that hosts a HelloKalku embed iframe
 * and the iframe will resize to its content height automatically.
 *
 *   <iframe
 *     src="https://hellokalku.com/embed/salary"
 *     data-hellokalku="salary"
 *     width="100%"
 *     style="border:0"
 *   ></iframe>
 *   <script async src="https://hellokalku.com/embed.js"></script>
 *
 * The script listens for postMessage payloads of shape:
 *   { source: "hellokalku-embed", type: "hellokalku-resize", height: 1234, path: "/embed/salary" }
 * and applies the height to any iframe whose src origin matches the message
 * origin and whose pathname matches the message path. This avoids cross-embed
 * confusion when a page hosts more than one HelloKalku iframe.
 *
 * Falls back silently in environments without postMessage / iframes.
 */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function findMatchingIframe(origin, path) {
    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      var f = iframes[i];
      var src = f.getAttribute("src");
      if (!src) continue;
      try {
        var u = new URL(src, window.location.href);
        if (u.origin === origin && u.pathname === path) return f;
      } catch (_) { /* ignore */ }
    }
    return null;
  }

  window.addEventListener("message", function (event) {
    var data = event && event.data;
    if (!data || typeof data !== "object") return;
    if (data.source !== "hellokalku-embed" || data.type !== "hellokalku-resize") return;
    if (typeof data.height !== "number" || data.height <= 0) return;
    if (typeof data.path !== "string") return;

    var iframe = findMatchingIframe(event.origin, data.path);
    if (!iframe) return;
    // Add a small buffer so scrollbars don't appear from sub-pixel rounding.
    iframe.style.height = (data.height + 8) + "px";
  });
})();
