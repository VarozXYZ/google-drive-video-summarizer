(() => {
  const SOURCE = "gdrv-summarizer";

  function injectNetworkHook() {
    const script = document.createElement("script");
    script.textContent = `(() => {
      const SOURCE = "${SOURCE}";
      const seen = new Set();

      function report(url) {
        if (!url || typeof url !== "string") return;
        if (!url.includes("timedtext")) return;
        if (seen.has(url)) return;
        seen.add(url);
        window.postMessage({ source: SOURCE, type: "timedtext", url }, "*");
      }

      const originalFetch = window.fetch;
      if (originalFetch) {
        window.fetch = function(...args) {
          try {
            const input = args[0];
            const url = typeof input === "string" ? input : (input && input.url);
            report(url);
          } catch (err) {
            // Ignore
          }
          return originalFetch.apply(this, args);
        };
      }

      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        try { report(url); } catch (err) { /* Ignore */ }
        return originalOpen.apply(this, arguments);
      };
    })();`;

    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }

  function isVideoPage() {
    return Boolean(document.querySelector("video"));
  }

  function sendStatus() {
    chrome.runtime.sendMessage({
      type: "page_status",
      isDrive: location.host === "drive.google.com",
      isVideo: isVideoPage()
    });
  }

  injectNetworkHook();

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== SOURCE || data.type !== "timedtext") return;
    chrome.runtime.sendMessage({
      type: "timedtext_url",
      url: data.url,
      title: document.title
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendStatus, { once: true });
  } else {
    sendStatus();
  }

  const observer = new MutationObserver(() => {
    if (isVideoPage()) {
      sendStatus();
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "probe_status") {
      sendResponse({
        isDrive: location.host === "drive.google.com",
        isVideo: isVideoPage()
      });
    }
  });
})();
