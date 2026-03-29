// TruthCast Extension Popup - Vanilla JS
// Keep bundle under 80KB

const API_BASE = "http://localhost:3000";

// Debug logging
function log(...args) {
  console.log("[TruthCast Popup]", ...args);
}

// Verdict color configuration
const VERDICT_COLORS = {
  TRUE: { solid: "#22C55E", dim: "rgba(34, 197, 94, 0.10)" },
  MOSTLY_TRUE: { solid: "#14B8A6", dim: "rgba(20, 184, 166, 0.10)" },
  MISLEADING: { solid: "#F59E0B", dim: "rgba(245, 158, 11, 0.10)" },
  MOSTLY_FALSE: { solid: "#F97316", dim: "rgba(249, 115, 22, 0.10)" },
  FALSE: { solid: "#EF4444", dim: "rgba(239, 68, 68, 0.10)" },
  CONFLICTING: { solid: "#A78BFA", dim: "rgba(167, 139, 250, 0.10)" },
  UNVERIFIABLE: { solid: "#6B7280", dim: "rgba(107, 114, 128, 0.10)" },
};

// DOM elements
const elements = {
  body: document.body,
  selectedText: document.getElementById("selected-text"),
  checkBtn: document.getElementById("check-btn"),
  runningClaim: document.getElementById("running-claim"),
  progressFill: document.getElementById("progress-fill"),
  stageName: document.getElementById("stage-name"),
  verdictBand: document.getElementById("verdict-band"),
  verdictLabel: document.getElementById("verdict-label"),
  confidenceValue: document.getElementById("confidence-value"),
  confidenceFill: document.getElementById("confidence-fill"),
  verdictReasoning: document.getElementById("verdict-reasoning"),
  viewFull: document.getElementById("view-full"),
  newCheckBtn: document.getElementById("new-check-btn"),
  recentList: document.getElementById("recent-list"),
  statusText: document.querySelector(".status-text"),
};

// State
let currentClaim = "";
let eventSource = null;

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  log("Popup initialized");
  loadRecentChecks();

  // Check for stored verdict from background.js (floating button flow)
  await checkForStoredVerdict();

  // Check for selected text from content script
  await checkForSelectedText();

  setupEventListeners();
}

// Check if background.js stored a verdict for us
async function checkForStoredVerdict() {
  try {
    const { latestVerdict } = await chrome.storage.local.get("latestVerdict");
    if (latestVerdict) {
      log("Found stored verdict:", latestVerdict);
      // Clear it so we don't show it again
      await chrome.storage.local.remove("latestVerdict");
      showVerdict(latestVerdict);
    }
  } catch (e) {
    log("Error checking stored verdict:", e);
  }
}

function setupEventListeners() {
  if (elements.checkBtn) {
    elements.checkBtn.addEventListener("click", handleCheck);
  }
  if (elements.newCheckBtn) {
    elements.newCheckBtn.addEventListener("click", resetToIdle);
  }
}

// Check for selected text from content script
async function checkForSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    log("Active tab:", tab?.id, tab?.url?.substring(0, 50));

    if (!tab?.id) {
      log("No active tab found");
      return;
    }

    // Skip chrome:// and extension pages
    if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) {
      log("Skipping chrome/extension page");
      return;
    }

    const result = await chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" });
    log("Selection result:", result);

    if (result?.text && result.text.length >= 10) {
      log("Showing selected text:", result.text.substring(0, 50));
      showSelected(result.text);
    } else {
      log("No valid selection found (need 10+ chars)");
    }
  } catch (e) {
    // Content script may not be loaded
    log("Could not get selection:", e.message);
  }
}

// State transitions
function setState(state) {
  if (elements.body) {
    elements.body.dataset.state = state;
  }

  const statusMap = {
    idle: "Ready",
    selected: "Ready",
    running: "Checking...",
    verdict: "Complete",
  };

  if (elements.statusText) {
    elements.statusText.textContent = statusMap[state] || "Ready";
  }
}

function showSelected(text) {
  currentClaim = text.trim();
  if (elements.selectedText) {
    elements.selectedText.textContent = truncate(currentClaim, 200);
  }
  setState("selected");
}

function resetToIdle() {
  currentClaim = "";
  setState("idle");
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

// Handle fact-check
async function handleCheck() {
  if (!currentClaim) {
    log("No claim to check");
    return;
  }

  log("Starting check for claim:", currentClaim.substring(0, 50) + "...");
  setState("running");

  if (elements.runningClaim) {
    elements.runningClaim.textContent = truncate(currentClaim, 150);
  }
  if (elements.progressFill) {
    elements.progressFill.style.width = "0%";
  }
  if (elements.stageName) {
    elements.stageName.textContent = "Initializing...";
  }

  try {
    // Start pipeline
    log("Calling API:", `${API_BASE}/api/check`);
    const response = await fetch(`${API_BASE}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: currentClaim }),
    });

    log("API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      log("API error:", errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const responseData = await response.json();
    const session_id = responseData.session_id;
    log("Got session_id:", session_id);

    // Connect to SSE stream
    const streamUrl = `${API_BASE}/api/check/stream?session=${session_id}`;
    log("Connecting to SSE stream:", streamUrl);
    eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      log("SSE stream connected");
    };

    eventSource.onmessage = (event) => {
      log("SSE message received:", event.data.substring(0, 100));
      try {
        const data = JSON.parse(event.data);

        if (data.event === "progress" || data.event === "stage_complete") {
          log("Progress:", data.progress, "%", data.message);
          if (elements.progressFill) {
            elements.progressFill.style.width = `${data.progress}%`;
          }
          if (elements.stageName) {
            elements.stageName.textContent = data.message || "Processing...";
          }
        }

        if (data.event === "complete") {
          log("Pipeline complete:", data.data?.verdict?.verdict);
          eventSource.close();
          eventSource = null;
          if (data.data && data.data.verdict) {
            showVerdict(data.data.verdict);
            saveToRecent(data.data.verdict);
          } else {
            showError("Invalid verdict response");
          }
        }

        if (data.event === "error") {
          log("Pipeline error:", data.message);
          eventSource.close();
          eventSource = null;
          showError(data.message || "Unknown error");
        }
      } catch (parseError) {
        log("Error parsing SSE data:", parseError);
      }
    };

    eventSource.onerror = (error) => {
      log("SSE error:", error);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      showError("Connection lost. Check if dev server is running.");
    };
  } catch (error) {
    log("Check failed:", error);
    showError(error.message || "Failed to check claim");
  }
}

// Display verdict
function showVerdict(verdict) {
  const colors = VERDICT_COLORS[verdict.verdict] || VERDICT_COLORS.UNVERIFIABLE;

  // Set CSS variables
  document.documentElement.style.setProperty("--verdict-color", colors.solid);
  document.documentElement.style.setProperty("--verdict-dim", colors.dim);

  // Update UI
  if (elements.verdictLabel) {
    elements.verdictLabel.textContent = verdict.verdict.replace(/_/g, " ");
  }
  if (elements.confidenceValue) {
    elements.confidenceValue.textContent = `${verdict.confidence}%`;
  }
  if (elements.confidenceFill) {
    elements.confidenceFill.style.width = `${verdict.confidence}%`;
  }
  if (elements.verdictReasoning) {
    elements.verdictReasoning.textContent = truncate(verdict.reasoning, 200);
  }
  if (elements.viewFull) {
    elements.viewFull.href = `${API_BASE}/verdict/${verdict.claim_hash}`;
    elements.viewFull.style.display = "inline";
  }

  setState("verdict");
}

function showError(message) {
  // Show error in verdict state with error styling
  document.documentElement.style.setProperty("--verdict-color", "#EF4444");
  document.documentElement.style.setProperty("--verdict-dim", "rgba(239, 68, 68, 0.10)");

  if (elements.verdictLabel) {
    elements.verdictLabel.textContent = "ERROR";
  }
  if (elements.confidenceValue) {
    elements.confidenceValue.textContent = "";
  }
  if (elements.confidenceFill) {
    elements.confidenceFill.style.width = "0%";
  }
  if (elements.verdictReasoning) {
    elements.verdictReasoning.textContent = message;
  }
  if (elements.viewFull) {
    elements.viewFull.style.display = "none";
  }

  setState("verdict");
}

// Recent checks
async function loadRecentChecks() {
  try {
    const { recentChecks = [] } = await chrome.storage.local.get("recentChecks");

    if (recentChecks.length === 0 || !elements.recentList) {
      return;
    }

    elements.recentList.innerHTML = recentChecks
      .slice(0, 3)
      .map((check) => {
        const colors = VERDICT_COLORS[check.verdict] || VERDICT_COLORS.UNVERIFIABLE;
        return `
          <div class="recent-item" data-claim="${encodeURIComponent(check.claim)}">
            <span class="recent-badge" style="background: ${colors.solid}">${check.verdict.charAt(0)}</span>
            <span class="recent-text">${truncate(check.claim, 40)}</span>
          </div>
        `;
      })
      .join("");

    // Add click handlers
    elements.recentList.querySelectorAll(".recent-item").forEach((item) => {
      item.addEventListener("click", () => {
        const claim = decodeURIComponent(item.dataset.claim);
        showSelected(claim);
      });
    });
  } catch (e) {
    console.error("Failed to load recent checks:", e);
  }
}

async function saveToRecent(verdict) {
  try {
    const { recentChecks = [] } = await chrome.storage.local.get("recentChecks");

    const newCheck = {
      claim: currentClaim,
      verdict: verdict.verdict,
      hash: verdict.claim_hash,
      timestamp: Date.now(),
    };

    // Add to front, limit to 10
    const updated = [newCheck, ...recentChecks.filter((c) => c.hash !== verdict.claim_hash)].slice(0, 10);

    await chrome.storage.local.set({ recentChecks: updated });
  } catch (e) {
    console.error("Failed to save to recent:", e);
  }
}

// Utility
function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
