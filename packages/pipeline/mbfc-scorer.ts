/**
 * MBFC Domain Credibility Scoring
 *
 * Scores source domains using the Media Bias/Fact Check dataset.
 * Expert-rated domains with credibility scores from 0.0 to 1.0.
 */

import { mbfcData } from "@truthcast/shared/mbfc-data";

/**
 * Extract the base domain from a URL
 * Examples:
 *   https://www.bbc.com/news/article → bbc.com
 *   https://reuters.com/world → reuters.com
 *   https://subdomain.nytimes.com/article → nytimes.com
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Remove www. prefix
    const withoutWww = hostname.replace(/^www\./, "");

    // Extract base domain (handle subdomains)
    // For most cases, we want the last two parts (domain.tld)
    const parts = withoutWww.split(".");
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }

    return withoutWww;
  } catch (err) {
    // If URL parsing fails, return empty string
    return "";
  }
}

/**
 * Score a domain using MBFC dataset
 *
 * @param url - Full URL or just domain string
 * @returns Credibility score from 0.0 to 1.0
 *   - 0.95-1.0: Tier A (most reliable: reuters, who.int, nasa.gov)
 *   - 0.85-0.94: Tier B (highly reliable: bbc, nytimes)
 *   - 0.70-0.84: Tier C (moderately reliable: forbes, cnn)
 *   - 0.50-0.69: Tier D (questionable: foxnews)
 *   - 0.0-0.49: Tier F (unreliable: breitbart, infowars)
 *   - null: Unknown domain (not in MBFC dataset)
 */
export function scoreMBFCDomain(url: string): number | null {
  const domain = extractDomain(url);

  if (!domain) {
    return null;
  }

  // Direct lookup in MBFC dataset
  if (domain in mbfcData) {
    return mbfcData[domain];
  }

  // Try without subdomain (in case URL had one we didn't catch)
  const parts = domain.split(".");
  if (parts.length > 2) {
    const baseDomain = parts.slice(-2).join(".");
    if (baseDomain in mbfcData) {
      return mbfcData[baseDomain];
    }
  }

  // Not found in MBFC dataset
  return null;
}

/**
 * Calculate the tier letter from a credibility score
 */
export function getTier(score: number): string {
  if (score >= 0.95) return "A";
  if (score >= 0.85) return "B";
  if (score >= 0.70) return "C";
  if (score >= 0.50) return "D";
  return "F";
}

/**
 * Calculate average credibility score across multiple sources
 * Ignores unknown domains (null scores)
 */
export function calculateAverageScore(urls: string[]): number {
  const scores = urls.map(scoreMBFCDomain).filter((s): s is number => s !== null);

  if (scores.length === 0) {
    return 0.5; // Default to neutral if no known domains
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
