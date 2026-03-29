// packages/extension/popup/popup.js
// Popup script to display verdicts

// Verdict color mapping
const VERDICT_COLORS = {
  TRUE: '#10b981',
  MOSTLY_TRUE: '#34d399',
  MISLEADING: '#fbbf24',
  MOSTLY_FALSE: '#fb923c',
  FALSE: '#ef4444',
  CONFLICTING: '#8b5cf6',
  UNVERIFIABLE: '#6b7280'
};

// DOM elements
const loadingEl = document.getElementById('loading');
const noVerdictEl = document.getElementById('no-verdict');
const verdictCardEl = document.getElementById('verdict-card');
const verdictLabelEl = document.getElementById('verdict-label');
const confidenceEl = document.getElementById('confidence');
const reasoningEl = document.getElementById('reasoning');
const sourcesContainerEl = document.getElementById('sources-container');
const sourcesListEl = document.getElementById('sources-list');
const debateIndicatorEl = document.getElementById('debate-indicator');
const debateTextEl = document.getElementById('debate-text');
const checkedAtEl = document.getElementById('checked-at');
const ttlPolicyEl = document.getElementById('ttl-policy');
const viewFullBtn = document.getElementById('view-full');
const copyLinkBtn = document.getElementById('copy-link');

// Load and display verdict on popup open
loadVerdict();

function loadVerdict() {
  chrome.storage.local.get(['latestVerdict'], (result) => {
    loadingEl.style.display = 'none';

    if (!result.latestVerdict) {
      noVerdictEl.style.display = 'block';
      return;
    }

    displayVerdict(result.latestVerdict);
  });
}

function displayVerdict(verdict) {
  noVerdictEl.style.display = 'none';
  verdictCardEl.style.display = 'block';

  // Verdict label and color
  const verdictText = verdict.verdict.replace(/_/g, ' ');
  const color = VERDICT_COLORS[verdict.verdict] || '#6b7280';

  verdictLabelEl.textContent = verdictText;
  verdictLabelEl.style.backgroundColor = color;

  // Confidence
  confidenceEl.textContent = `${verdict.confidence}% confidence`;

  // Reasoning
  reasoningEl.textContent = verdict.reasoning;

  // Sources
  if (verdict.sources && verdict.sources.length > 0) {
    sourcesContainerEl.style.display = 'block';
    sourcesListEl.innerHTML = '';

    verdict.sources.slice(0, 5).forEach(source => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${source.url}" target="_blank" rel="noopener noreferrer">
          [${source.domain_tier}] ${source.domain}
        </a>
        <span style="color: #6b7280; font-size: 10px;">
          (${(source.credibility_score * 100).toFixed(0)}%)
        </span>
      `;
      sourcesListEl.appendChild(li);
    });
  }

  // Debate indicator
  if (verdict.debate_triggered) {
    debateIndicatorEl.style.display = 'block';
    debateTextEl.textContent = `Low agreement detected (${(verdict.agreement_score * 100).toFixed(0)}%). Debate agents argued both sides before reaching this verdict.`;
  }

  // Metadata
  const checkedDate = new Date(verdict.checked_at * 1000);
  checkedAtEl.textContent = checkedDate.toLocaleString();
  ttlPolicyEl.textContent = verdict.ttl_policy;

  // Set up buttons
  viewFullBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'http://localhost:3000' // Change to https://truthcast.tech in production
    });
  });

  copyLinkBtn.addEventListener('click', () => {
    const link = `http://localhost:3000?claim=${encodeURIComponent(verdict.claim_text || 'Unknown')}`;
    navigator.clipboard.writeText(link).then(() => {
      copyLinkBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyLinkBtn.textContent = 'Copy Link';
      }, 2000);
    });
  });
}
