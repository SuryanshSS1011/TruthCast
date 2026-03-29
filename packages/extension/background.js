// packages/extension/background.js
// Background service worker for TruthCast - handles API calls and caching

// API endpoint
const API_BASE_URL = 'http://localhost:3000';

// Cache duration (30 days in milliseconds)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'truthcast-check-claim',
    title: 'Check Claim with TruthCast',
    contexts: ['selection']
  });

  console.log('TruthCast extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'truthcast-check-claim' && info.selectionText) {
    checkClaim(info.selectionText, tab.id);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_CLAIM') {
    checkClaim(request.claim, sender.tab.id);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

// Main function to check a claim
async function checkClaim(claim, tabId) {
  try {
    // Normalize claim for cache key
    const cacheKey = `verdict_${hashString(claim)}`;

    // Check cache first
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log('TruthCast: Using cached verdict');
      showVerdictPopup(cached, tabId);
      return;
    }

    // Call API
    console.log('TruthCast: Fetching verdict from API...');
    const response = await fetch(`${API_BASE_URL}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const { session_id } = await response.json();

    // Open SSE stream for progress
    const verdict = await streamProgress(session_id, tabId);

    // Cache the result
    await saveToCache(cacheKey, verdict);

    // Show verdict
    showVerdictPopup(verdict, tabId);

  } catch (error) {
    console.error('TruthCast: Error checking claim:', error);
    notifyTab(tabId, 'Failed to check claim. Please try again.', 'error');
  }
}

// Stream progress via SSE
function streamProgress(sessionId, tabId) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/check/stream?session=${sessionId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'progress' || data.event === 'stage_complete') {
        notifyTab(tabId, `${data.progress}% - ${data.message}`, 'info');
      }

      if (data.event === 'complete') {
        eventSource.close();
        resolve(data.data.verdict);
      }

      if (data.event === 'error') {
        eventSource.close();
        reject(new Error(data.message));
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error('Connection to server lost'));
    };

    // Timeout after 2 minutes
    setTimeout(() => {
      eventSource.close();
      reject(new Error('Request timed out'));
    }, 120000);
  });
}

// Notify content script in tab
function notifyTab(tabId, message, type) {
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_NOTIFICATION',
    message,
    notificationType: type
  }).catch(() => {
    // Ignore errors if tab is closed or not ready
  });
}

// Store verdict for popup to access
function showVerdictPopup(verdict, tabId) {
  // Store verdict in storage for popup to access
  chrome.storage.local.set({ latestVerdict: verdict });

  // Notify the tab that verdict is ready (shows notification)
  const verdictText = verdict.verdict.replace(/_/g, ' ');
  notifyTab(tabId, `Verdict: ${verdictText} (${verdict.confidence}%) - Click extension to view`, 'success');

  console.log('TruthCast: Verdict stored, user can click extension icon to view');
}

// Cache functions using chrome.storage.local
async function getFromCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      const cached = result[key];
      if (!cached) {
        resolve(null);
        return;
      }

      // Check if cache is still valid
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        chrome.storage.local.remove(key);
        resolve(null);
        return;
      }

      resolve(cached.data);
    });
  });
}

async function saveToCache(key, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [key]: {
        data,
        timestamp: Date.now()
      }
    }, () => {
      resolve();
    });
  });
}

// Simple hash function for cache keys
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
