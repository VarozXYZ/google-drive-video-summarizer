const STORAGE_KEYS = [
  "model",
  "format",
  "includeTimestamps",
  "openInTab",
  "downloadFile"
];

const SESSION_KEYS = ["apiKey"];

const els = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  statusHint: document.getElementById("statusHint"),
  apiKey: document.getElementById("apiKey"),
  saveKey: document.getElementById("saveKey"),
  clearKey: document.getElementById("clearKey"),
  model: document.getElementById("model"),
  format: document.getElementById("format"),
  includeTimestamps: document.getElementById("includeTimestamps"),
  openInTab: document.getElementById("openInTab"),
  downloadFile: document.getElementById("downloadFile"),
  extraFiles: document.getElementById("extraFiles"),
  summarize: document.getElementById("summarize"),
  progress: document.getElementById("progress"),
  output: document.getElementById("output"),
  refreshDebug: document.getElementById("refreshDebug"),
  clearDebug: document.getElementById("clearDebug"),
  debugLog: document.getElementById("debugLog")
};

let activeTabId = null;
let lastState = null;

function formatTime(ts) {
  if (!ts) return "--:--:--";
  return new Date(ts).toLocaleTimeString();
}

function formatDebug(entries, state) {
  const lines = [];

  if (state) {
    lines.push(`State: captionsUrl=${state.captionsUrl ? "yes" : "no"}, urls=${state.captionsUrls ? state.captionsUrls.length : 0}`);
  }

  if (state && Array.isArray(state.captionsUrls) && state.captionsUrls.length) {
    lines.push("Captured URLs:");
    for (const item of state.captionsUrls) {
      const seen = item.lastSeen ? formatTime(item.lastSeen) : "unknown";
      lines.push(`- [${seen}] (${item.source || "unknown"}) ${item.url}`);
    }
  }

  if (!entries || !entries.length) {
    lines.push("No debug entries.");
    return lines.join("\n");
  }

  lines.push("Events:");
  for (const entry of entries) {
    const time = formatTime(entry.ts);
    const detail = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    lines.push(`[${time}] ${entry.level || "info"}: ${entry.message}${detail}`);
  }

  return lines.join("\n");
}

function setStatus(state) {
  els.statusDot.classList.remove("ready", "warn", "error");

  if (state.level === "ready") {
    els.statusDot.classList.add("ready");
  } else if (state.level === "warn") {
    els.statusDot.classList.add("warn");
  } else if (state.level === "error") {
    els.statusDot.classList.add("error");
  }

  els.statusText.textContent = state.text;
  els.statusHint.textContent = state.hint || "";
}

function setOutput(text, isError) {
  els.output.textContent = text || "";
  els.output.classList.toggle("error", Boolean(isError));
}

async function loadSettings() {
  const data = await chrome.storage.local.get(STORAGE_KEYS);
  const session = await chrome.storage.session.get(SESSION_KEYS);
  if (session.apiKey) els.apiKey.value = session.apiKey;
  if (data.model) els.model.value = data.model;
  if (data.format) els.format.value = data.format;
  if (typeof data.includeTimestamps === "boolean") {
    els.includeTimestamps.checked = data.includeTimestamps;
  }
  if (typeof data.openInTab === "boolean") {
    els.openInTab.checked = data.openInTab;
  }
  if (typeof data.downloadFile === "boolean") {
    els.downloadFile.checked = data.downloadFile;
  }
}

async function saveSettings() {
  await chrome.storage.local.set({
    model: els.model.value,
    format: els.format.value,
    includeTimestamps: els.includeTimestamps.checked,
    openInTab: els.openInTab.checked,
    downloadFile: els.downloadFile.checked
  });
  await chrome.storage.session.set({
    apiKey: els.apiKey.value.trim()
  });
}

async function refreshStatus() {
  if (!activeTabId) return;

  const response = await chrome.runtime.sendMessage({
    type: "get_state",
    tabId: activeTabId
  });
  lastState = response && response.state ? response.state : null;

  let probe = null;
  try {
    probe = await chrome.tabs.sendMessage(activeTabId, { type: "probe_status" });
  } catch (err) {
    probe = null;
  }

  if (probe && !probe.isDrive) {
    setStatus({
      level: "error",
      text: "Not on Google Drive",
      hint: "Open a Drive video in a new tab to begin."
    });
    return;
  }

  if (probe && !probe.isVideo) {
    setStatus({
      level: "warn",
      text: "No video detected",
      hint: "Open a Drive video file and press play."
    });
    return;
  }

  if (lastState && lastState.captionsUrl) {
    setStatus({
      level: "ready",
      text: "Captions detected",
      hint: "Ready to summarize."
    });
    return;
  }

  setStatus({
    level: "warn",
    text: "Captions not detected",
    hint: "Enable CC, play for a few seconds, then reopen this popup."
  });
}

async function refreshDebug() {
  if (!activeTabId) return;
  const response = await chrome.runtime.sendMessage({
    type: "get_debug",
    tabId: activeTabId
  });
  const globalResponse = await chrome.runtime.sendMessage({
    type: "get_debug",
    tabId: "global"
  });

  if (response && response.ok) {
    let output = formatDebug(response.entries, response.state);
    if (globalResponse && globalResponse.ok && globalResponse.entries.length) {
      output += "\n\nGlobal events:";
      output += "\n" + formatDebug(globalResponse.entries, null);
    }
    els.debugLog.textContent = output;
  }
}

async function getExtraContext() {
  const files = Array.from(els.extraFiles.files || []);
  if (!files.length) return "";

  const sections = [];
  for (const file of files) {
    const text = await file.text();
    sections.push(`--- ${file.name} ---\n${text}`);
  }
  return sections.join("\n\n");
}

async function onSummarize() {
  setOutput("");
  els.progress.textContent = "Preparing summary...";
  els.summarize.disabled = true;

  try {
    if (!activeTabId) {
      throw new Error("No active tab found.");
    }

    if (!els.apiKey.value.trim()) {
      throw new Error("Add your OpenAI API key first.");
    }

    const extraContext = await getExtraContext();
    await saveSettings();

    const result = await chrome.runtime.sendMessage({
      type: "summarize",
      tabId: activeTabId,
      apiKey: els.apiKey.value.trim(),
      model: els.model.value,
      outputFormat: els.format.value,
      includeTimestamps: els.includeTimestamps.checked,
      openInTab: els.openInTab.checked,
      downloadFile: els.downloadFile.checked,
      extraContext
    });

    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : "Unknown error.");
    }

    els.progress.textContent = "Summary generated.";
    if (result.summary) {
      const suffix = result.truncated ? "\n... (preview truncated)" : "";
      setOutput(result.summary + suffix, false);
    }
  } catch (err) {
    els.progress.textContent = "";
    setOutput(err.message || String(err), true);
  } finally {
    els.summarize.disabled = false;
    refreshDebug();
  }
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
  }

  await loadSettings();
  await refreshStatus();
  await refreshDebug();
}

els.saveKey.addEventListener("click", async () => {
  await saveSettings();
  els.progress.textContent = "API key saved.";
  setTimeout(() => {
    els.progress.textContent = "";
  }, 1500);
});

els.clearKey.addEventListener("click", async () => {
  els.apiKey.value = "";
  await chrome.storage.session.set({ apiKey: "" });
  els.progress.textContent = "API key cleared.";
  setTimeout(() => {
    els.progress.textContent = "";
  }, 1500);
});

els.summarize.addEventListener("click", onSummarize);
els.refreshDebug.addEventListener("click", refreshDebug);
els.clearDebug.addEventListener("click", async () => {
  if (!activeTabId) return;
  await chrome.runtime.sendMessage({ type: "clear_debug", tabId: activeTabId });
  els.debugLog.textContent = "No debug entries.";
});

init();
