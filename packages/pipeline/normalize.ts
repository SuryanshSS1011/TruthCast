// packages/pipeline/normalize.ts
import { createHash } from "crypto";

// Common stop words to remove
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "of", "in", "on", "at", "to",
  "for", "with", "from", "by", "about", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "under", "again", "further",
  "then", "once"
]);

// Common contractions to expand
const CONTRACTIONS: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "won't": "will not",
  "wouldn't": "would not",
  "can't": "cannot",
  "couldn't": "could not",
  "shouldn't": "should not",
  "mightn't": "might not",
  "mustn't": "must not",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "here's": "here is",
  "what's": "what is",
  "who's": "who is",
  "where's": "where is",
  "when's": "when is",
  "why's": "why is",
  "how's": "how is",
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will"
};

/**
 * Normalizes and hashes a claim text for cache deduplication.
 *
 * 6-step normalization pipeline:
 * 1. Lowercase all text
 * 2. Strip punctuation, question marks, trailing whitespace
 * 3. Expand common contractions
 * 4. Remove stop words
 * 5. Sort remaining tokens alphabetically
 * 6. SHA-256 hash the resulting string
 */
export function normalizeAndHash(text: string): string {
  // Step 1: Lowercase
  let normalized = text.toLowerCase();

  // Step 2: Strip punctuation
  normalized = normalized.replace(/[^\w\s]/g, " ");
  normalized = normalized.trim();

  // Step 3: Expand contractions
  for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
    const regex = new RegExp(`\\b${contraction}\\b`, "g");
    normalized = normalized.replace(regex, expansion);
  }

  // Step 4: Remove stop words
  const tokens = normalized.split(/\s+/);
  const filteredTokens = tokens.filter((token) => !STOP_WORDS.has(token));

  // Step 5: Sort tokens alphabetically
  filteredTokens.sort();

  // Step 6: SHA-256 hash
  const sortedText = filteredTokens.join(" ");
  const hash = createHash("sha256").update(sortedText).digest("hex");

  return hash;
}
