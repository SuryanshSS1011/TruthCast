// packages/extension/content.js
// Content script for TruthCast - handles text selection and floating button

let debounceTimer = null;
let floatingButton = null;

// Minimum selection length (characters)
const MIN_SELECTION_LENGTH = 10;

// Debounce delay (ms)
const DEBOUNCE_DELAY = 500;

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('selectionchange', handleSelectionChange);

function handleTextSelection(event) {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText.length >= MIN_SELECTION_LENGTH) {
      showFloatingButton(event.clientX, event.clientY, selectedText);
    } else {
      hideFloatingButton();
    }
  }, DEBOUNCE_DELAY);
}

function handleSelectionChange() {
  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length < MIN_SELECTION_LENGTH && floatingButton) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(hideFloatingButton, DEBOUNCE_DELAY);
  }
}

function showFloatingButton(x, y, text) {
  // Remove existing button if present
  hideFloatingButton();

  // Create floating button
  floatingButton = document.createElement('div');
  floatingButton.id = 'truthcast-floating-button';
  floatingButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Check Claim</span>
  `;

  // Position button near cursor
  floatingButton.style.position = 'fixed';
  floatingButton.style.left = `${x + 10}px`;
  floatingButton.style.top = `${y + 10}px`;
  floatingButton.style.zIndex = '2147483647';

  // Add click handler
  floatingButton.addEventListener('click', () => {
    checkClaim(text);
    hideFloatingButton();
  });

  document.body.appendChild(floatingButton);
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

function checkClaim(claim) {
  // Send message to background script
  chrome.runtime.sendMessage({
    type: 'CHECK_CLAIM',
    claim: claim
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('TruthCast: Error sending message:', chrome.runtime.lastError);
      return;
    }

    if (response && response.success) {
      showNotification('Checking claim...', 'info');
    } else {
      showNotification('Failed to check claim', 'error');
    }
  });
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `truthcast-notification truthcast-notification-${type}`;
  notification.textContent = message;

  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '2147483647';

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTION') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
    return true;
  }

  if (request.type === 'SHOW_NOTIFICATION') {
    showNotification(request.message, request.notificationType);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  hideFloatingButton();
  clearTimeout(debounceTimer);
});
