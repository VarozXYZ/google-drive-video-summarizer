const STORAGE = chrome.storage.session || chrome.storage.local;
const TAB_KEY_PREFIX = "tab:";
const OPENAI_CONFIG = {
  endpoint: "https://api.openai.com/v1/responses",
  defaultModel: "gpt-5-mini"
};
const TIMEDTEXT_URL_FILTERS = [
  "*://*.google.com/*",
  "*://*.googlevideo.com/*",
  "*://*.googleusercontent.com/*",
  "*://*.youtube.com/*"
];
const DEBUG_KEY_PREFIX = "debug:";
const DEBUG_LIMIT = 50;

function tabKey(tabId) {
  return `${TAB_KEY_PREFIX}${tabId}`;
}

function debugKey(tabId) {
  return `${DEBUG_KEY_PREFIX}${tabId}`;
}

async function setTabState(tabId, state) {
  const key = tabKey(tabId);
  await STORAGE.set({ [key]: state });
}

async function getTabState(tabId) {
  const key = tabKey(tabId);
  const data = await STORAGE.get(key);
  return data[key] || null;
}

async function clearTabState(tabId) {
  const key = tabKey(tabId);
  await STORAGE.remove(key);
}

async function addDebugEntry(tabId, level, message, data) {
  const key = debugKey(tabId ?? "global");
  const existing = (await STORAGE.get(key))[key] || [];
  const entry = {
    ts: Date.now(),
    level,
    message,
    data: data || null
  };
  existing.push(entry);
  if (existing.length > DEBUG_LIMIT) {
    existing.splice(0, existing.length - DEBUG_LIMIT);
  }
  await STORAGE.set({ [key]: existing });
  try {
    // Console output helps during DevTools debugging.
    console.log(`[DriveSummarizer][${level}] ${message}`, data || "");
  } catch (err) {
    // Ignore
  }
}

async function clearDebug(tabId) {
  const key = debugKey(tabId ?? "global");
  await STORAGE.remove(key);
}

function normalizeTimedtextUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.get("fmt")) {
      url.searchParams.set("fmt", "json3");
    }
    return url.toString();
  } catch (err) {
    return rawUrl;
  }
}

function isTimedtextUrl(url) {
  return typeof url === "string" && url.includes("timedtext");
}

async function recordCaptionsUrl(tabId, url, source, title) {
  const normalized = normalizeTimedtextUrl(url);
  const existing = (await getTabState(tabId)) || {};
  const list = Array.isArray(existing.captionsUrls) ? existing.captionsUrls.slice() : [];
  const now = Date.now();
  const idx = list.findIndex((item) => item.url === normalized);
  if (idx >= 0) {
    const item = list.splice(idx, 1)[0];
    list.unshift({
      url: normalized,
      lastSeen: now,
      hits: (item.hits || 0) + 1,
      source: source || item.source || "unknown"
    });
  } else {
    list.unshift({
      url: normalized,
      lastSeen: now,
      hits: 1,
      source: source || "unknown"
    });
  }
  if (list.length > 12) {
    list.length = 12;
  }

  const nextState = Object.assign({}, existing, {
    captionsUrl: normalized,
    captionsUrls: list,
    title: title || existing.title || null,
    updatedAt: now
  });

  await setTabState(tabId, nextState);
  await addDebugEntry(tabId, "info", "Captured timedtext URL", {
    url: normalized,
    source: source || "unknown"
  });
}

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function fixMojibake(text) {
  if (!text) return text;
  if (!/[\u00C2\u00C3]/.test(text)) return text;
  try {
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch (err) {
    return text;
  }
}

function normalizeText(text) {
  if (!text) return "";
  let out = text;
  out = out.replace(/\[\s*__\s*\]/g, "");
  out = out.replace(/\s+/g, " ").trim();
  out = out.replace(/\s+([,.;:!?])/g, "$1");
  out = out.replace(/\s+([)\]])/g, "$1");
  out = out.replace(/([(\[])\s+/g, "$1");
  return out;
}

function extractTranscript(captionsJson) {
  const events = Array.isArray(captionsJson.events) ? captionsJson.events : [];
  let durationMs = 0;
  const lines = [];

  let currentText = "";
  let currentStart = null;

  for (const event of events) {
    const start = typeof event.tStartMs === "number" ? event.tStartMs : null;
    const duration = typeof event.dDurationMs === "number" ? event.dDurationMs : 0;
    if (start !== null) {
      durationMs = Math.max(durationMs, start + duration);
    }

    if (!event.segs || !Array.isArray(event.segs)) continue;
    let text = event.segs.map((seg) => seg.utf8 || "").join("");
    if (!text) continue;
    text = fixMojibake(text);

    if (text === "\n") {
      if (currentText.trim()) {
        lines.push({ startMs: currentStart, text: currentText });
      }
      currentText = "";
      currentStart = null;
      continue;
    }

    if (currentStart === null && start !== null) {
      currentStart = start;
    }
    currentText += text;
  }

  if (currentText.trim()) {
    lines.push({ startMs: currentStart, text: currentText });
  }

  const timedLines = lines
    .map((line) => {
      const clean = normalizeText(line.text);
      if (!clean) return "";
      if (typeof line.startMs === "number") {
        return `[${formatMs(line.startMs)}] ${clean}`;
      }
      return clean;
    })
    .filter(Boolean);

  const plainTranscript = timedLines
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""))
    .join(" ");

  return {
    timedTranscript: timedLines.join("\n"),
    plainTranscript,
    lineCount: timedLines.length,
    durationMs
  };
}

function buildPrompt({
  title,
  durationMs,
  transcriptText,
  extraContext,
  outputFormat
}) {
  const durationText = durationMs ? formatMs(durationMs) : "unknown";
  const formatHint = outputFormat === "html"
    ? "Output valid HTML only. Use a single <article> element with <h2> section headings."
    : "Output in Markdown.";

  const extraBlock = extraContext
    ? `\n\nAdditional context (files or notes):\n${extraContext}`
    : "";

  return [
    "You are turning a class recording transcript into student-ready lesson notes.",
    "The student is a beginner and does NOT know the concepts yet.",
    "Use the same language as the transcript.",
    "Use the Additional context files as authoritative when they clarify terms, code, or project setup.",
    "Correct obvious ASR errors when the intended term is unambiguous from context",
    "(e.g., 'Bit' -> 'Vite', library names, commands). If unsure, keep the original.",
    "Avoid filler and repetition. Do not invent details.",
    formatHint,
    "\nOutput format (no timeline):",
    "1) Class goal (1-2 sentences): what the class aimed to build or achieve.",
    "2) What was built/changed (step-by-step, 6-10 bullets):",
    "- Each bullet is ONE short step (<= 18 words).",
    "- If timestamps are present in the transcript, you may prefix a step with [mm:ss] where it starts.",
    "- Do NOT use time ranges.",
    "3) Concepts explained (6-10 bullets):",
    "- Simple, beginner-friendly definitions of new terms used in class.",
    "- Use the project/context files to improve clarity.",
    "4) Commands & code patterns (5-10 bullets):",
    "- Only commands/snippets explicitly mentioned or shown.",
    "- Keep them short and accurate.",
    "5) Key takeaways (3-6 bullets):",
    "- What a student should remember after this class.",
    "6) Summary (3-5 sentences):",
    "- A clear recap in plain language.",
    "\nVideo metadata:",
    `Title: ${title || "(unknown)"}`,
    `Approx duration: ${durationText}`,
    "\nTranscript:",
    transcriptText,
    extraBlock
  ].join("\n");
}

function extractOutputText(responseJson) {
  if (responseJson && typeof responseJson.output_text === "string") {
    return responseJson.output_text;
  }

  const output = responseJson && Array.isArray(responseJson.output)
    ? responseJson.output
    : [];
  const parts = [];

  for (const item of output) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n");
}

function sanitizeFilename(name) {
  const base = (name || "drive-video-summary")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return base || "drive-video-summary";
}

async function tryFetchCaptionsJson(tabId, captionsUrl) {
  try {
    await addDebugEntry(tabId, "info", "Fetching captions", { url: captionsUrl });
    const response = await fetch(captionsUrl, {
      method: "GET",
      credentials: "include"
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error("Non-JSON response");
    }

    if (!json || !Array.isArray(json.events) || json.events.length === 0) {
      throw new Error("JSON has no events");
    }

    return { ok: true, json };
  } catch (err) {
    await addDebugEntry(tabId, "warn", "Captions fetch failed", {
      url: captionsUrl,
      error: err.message || String(err)
    });
    return { ok: false, error: err.message || String(err) };
  }
}

async function callOpenAI({ apiKey, model, prompt }) {
  const response = await fetch(OPENAI_CONFIG.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: OPENAI_CONFIG.temperature,
      max_output_tokens: OPENAI_CONFIG.maxOutputTokens
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return outputText;
}

function toDataUrl(text, mime) {
  const utf8 = encodeURIComponent(text);
  const binary = utf8.replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  const base64 = btoa(binary);
  return `data:${mime};base64,${base64}`;
}

function downloadSummary({ text, format, filenameBase }) {
  const ext = format === "html" ? ".html" : ".md";
  const type = format === "html" ? "text/html" : "text/markdown";
  const url = toDataUrl(text, `${type};charset=utf-8`);

  chrome.downloads.download({
    url,
    filename: `${filenameBase}${ext}`,
    saveAs: true
  });
}

function openSummaryInTab({ text, format }) {
  const mime = format === "html" ? "text/html" : "text/plain";
  const url = toDataUrl(text, `${mime};charset=utf-8`);
  chrome.tabs.create({ url });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === "timedtext_url") {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId) return;
    recordCaptionsUrl(tabId, message.url, "content_script", message.title)
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "page_status") {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId) return;
    getTabState(tabId).then((state) => {
      const nextState = Object.assign({}, state || {}, {
        isDrive: message.isDrive,
        isVideo: message.isVideo
      });
      addDebugEntry(tabId, "info", "Page status", {
        isDrive: message.isDrive,
        isVideo: message.isVideo
      });
      return setTabState(tabId, nextState);
    }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "get_state") {
    getTabState(message.tabId).then((state) => {
      sendResponse({ ok: true, state: state || null });
    });
    return true;
  }

  if (message.type === "get_debug") {
    const key = debugKey(message.tabId ?? "global");
    Promise.all([STORAGE.get(key), getTabState(message.tabId)])
      .then(([debugData, state]) => {
        sendResponse({
          ok: true,
          entries: debugData[key] || [],
          state: state || null
        });
      });
    return true;
  }

  if (message.type === "clear_debug") {
    clearDebug(message.tabId).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "summarize") {
    (async () => {
      const tabId = message.tabId;
      const apiKey = message.apiKey;
      const model = message.model || OPENAI_CONFIG.defaultModel;
      const outputFormat = message.outputFormat || "md";
      const includeTimestamps = message.includeTimestamps !== false;
      const extraContext = message.extraContext || "";

      if (!apiKey) {
        await addDebugEntry(tabId, "error", "Missing API key");
        return { ok: false, error: "Missing OpenAI API key." };
      }

      const state = await getTabState(tabId);
      await addDebugEntry(tabId, "info", "Summarize requested", {
        hasState: Boolean(state),
        hasCaptionsUrl: Boolean(state && state.captionsUrl),
        urlCount: state && state.captionsUrls ? state.captionsUrls.length : 0
      });

      if (!state || (!state.captionsUrl && !state.captionsUrls)) {
        return { ok: false, error: "No captions URL captured. Enable captions and play the video." };
      }

      const candidates = [];
      if (state.captionsUrls && Array.isArray(state.captionsUrls)) {
        const sorted = state.captionsUrls
          .slice()
          .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
        for (const item of sorted) {
          if (item && item.url) candidates.push(item.url);
        }
      }
      if (state.captionsUrl && !candidates.includes(state.captionsUrl)) {
        candidates.unshift(state.captionsUrl);
      }

      let captionsJson = null;
      for (const url of candidates) {
        const attempt = await tryFetchCaptionsJson(tabId, url);
        if (attempt.ok) {
          captionsJson = attempt.json;
          break;
        }
      }

      if (!captionsJson) {
        return { ok: false, error: "Could not fetch a valid captions JSON. Try playing the video with CC on, then retry." };
      }

      const transcript = extractTranscript(captionsJson);

      const transcriptText = includeTimestamps
        ? transcript.timedTranscript
        : transcript.plainTranscript;

      if (!transcriptText || transcriptText.length < 10) {
        await addDebugEntry(tabId, "error", "Transcript empty after cleaning");
        return { ok: false, error: "Transcript is empty after cleaning." };
      }

      const prompt = buildPrompt({
        title: state.title,
        durationMs: transcript.durationMs,
        transcriptText,
        extraContext,
        outputFormat
      });

      const summaryText = await callOpenAI({ apiKey, model, prompt });
      const filenameBase = sanitizeFilename(state.title || "drive-video-summary");

      if (message.downloadFile) {
        downloadSummary({
          text: summaryText,
          format: outputFormat,
          filenameBase
        });
      }

      if (message.openInTab) {
        openSummaryInTab({ text: summaryText, format: outputFormat });
      }

      return {
        ok: true,
        summary: summaryText.slice(0, 4000),
        truncated: summaryText.length > 4000,
        meta: {
          lineCount: transcript.lineCount,
          durationMs: transcript.durationMs
        }
      };
    })()
      .then((result) => sendResponse(result))
      .catch((err) => {
        addDebugEntry(message.tabId, "error", "Summarize failed", {
          error: err.message || String(err)
        });
        sendResponse({ ok: false, error: err.message || String(err) });
      });

    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabState(tabId);
  clearDebug(tabId);
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isTimedtextUrl(details.url)) return;
    if (typeof details.tabId !== "number" || details.tabId < 0) {
      addDebugEntry("global", "warn", "Timedtext request without tabId", {
        url: details.url,
        tabId: details.tabId
      });
      return;
    }

    (async () => {
      let title = null;
      try {
        const tab = await chrome.tabs.get(details.tabId);
        title = tab && tab.title;
      } catch (err) {
        // Ignore
      }
      await recordCaptionsUrl(details.tabId, details.url, "webRequest", title);
    })();
  },
  { urls: TIMEDTEXT_URL_FILTERS }
);
