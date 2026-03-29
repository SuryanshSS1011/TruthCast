/**
 * TruthCast Pipeline Stress Test
 *
 * Tests various claim types, edge cases, concurrency, and error handling
 * to identify critical issues and measure performance.
 */

import { performance } from "perf_hooks";

const API_BASE = "http://localhost:3000";

interface TestCase {
  name: string;
  claim: string;
  expectedVerdict?: string;
  category: "factual" | "opinion" | "edge_case" | "adversarial" | "performance";
}

interface TestResult {
  name: string;
  claim: string;
  success: boolean;
  verdict?: string;
  confidence?: number;
  duration_ms: number;
  error?: string;
  stages_completed?: string[];
  agreement_score?: number;
  debate_triggered?: boolean;
  sources_count?: number;
}

// Comprehensive test dataset
const TEST_CASES: TestCase[] = [
  // === FACTUAL CLAIMS (should return TRUE/FALSE) ===
  { name: "Simple true fact", claim: "Water boils at 100 degrees Celsius at sea level", expectedVerdict: "TRUE", category: "factual" },
  { name: "Simple false fact", claim: "The Earth is flat", expectedVerdict: "FALSE", category: "factual" },
  { name: "Historical fact", claim: "World War II ended in 1945", expectedVerdict: "TRUE", category: "factual" },
  { name: "False historical claim", claim: "The moon landing happened in 1959", expectedVerdict: "FALSE", category: "factual" },
  { name: "Scientific fact", claim: "DNA has a double helix structure", expectedVerdict: "TRUE", category: "factual" },
  { name: "False science claim", claim: "Humans only use 10% of their brain", expectedVerdict: "FALSE", category: "factual" },
  { name: "Current event fact", claim: "Joe Biden is the President of the United States", expectedVerdict: "TRUE", category: "factual" },
  { name: "Geographic fact", claim: "Mount Everest is the tallest mountain on Earth", expectedVerdict: "TRUE", category: "factual" },
  { name: "Math fact", claim: "Pi is approximately 3.14159", expectedVerdict: "TRUE", category: "factual" },
  { name: "False math claim", claim: "2 plus 2 equals 5", expectedVerdict: "FALSE", category: "factual" },

  // === MISLEADING/MOSTLY TRUE/FALSE ===
  { name: "Misleading statistic", claim: "Vaccines cause autism according to one study", expectedVerdict: "MISLEADING", category: "factual" },
  { name: "Partial truth", claim: "Einstein failed math in school", expectedVerdict: "FALSE", category: "factual" },
  { name: "Out of context", claim: "The Great Wall of China is visible from space", expectedVerdict: "MOSTLY_FALSE", category: "factual" },

  // === OPINIONS (should return UNVERIFIABLE) ===
  { name: "Pure opinion", claim: "Pizza is the best food in the world", expectedVerdict: "UNVERIFIABLE", category: "opinion" },
  { name: "Subjective claim", claim: "The Beatles are better than The Rolling Stones", expectedVerdict: "UNVERIFIABLE", category: "opinion" },
  { name: "Value judgment", claim: "Democracy is the best form of government", expectedVerdict: "UNVERIFIABLE", category: "opinion" },
  { name: "Prediction", claim: "Bitcoin will reach $1 million by 2030", expectedVerdict: "UNVERIFIABLE", category: "opinion" },
  { name: "Future claim", claim: "AI will take over all jobs in 10 years", expectedVerdict: "UNVERIFIABLE", category: "opinion" },

  // === EDGE CASES ===
  { name: "Very short claim", claim: "Fire is hot", category: "edge_case" },
  { name: "Claim with numbers", claim: "There are 206 bones in the adult human body", category: "edge_case" },
  { name: "Claim with special chars", claim: "The symbol for gold is Au (from Latin 'aurum')", category: "edge_case" },
  { name: "Claim with quotes", claim: 'Abraham Lincoln said "Four score and seven years ago"', category: "edge_case" },
  { name: "Multi-part claim", claim: "The sun is a star, the moon is a satellite, and Earth is a planet", category: "edge_case" },
  { name: "Negation claim", claim: "Dinosaurs did not go extinct 65 million years ago", category: "edge_case" },
  { name: "Compound false claim", claim: "The Earth is flat and the sun revolves around it", expectedVerdict: "FALSE", category: "edge_case" },
  { name: "Mixed truth claim", claim: "Paris is the capital of France and Tokyo is the capital of China", category: "edge_case" },
  { name: "Claim with URL mention", claim: "According to NASA.gov, Mars has two moons", category: "edge_case" },
  { name: "Non-English words", claim: "Sushi originated in Japan and means 'sour rice'", category: "edge_case" },

  // === ADVERSARIAL CASES ===
  { name: "Conspiracy theory", claim: "The moon landing was faked by NASA in a Hollywood studio", expectedVerdict: "FALSE", category: "adversarial" },
  { name: "Misinformation pattern", claim: "5G towers spread coronavirus", expectedVerdict: "FALSE", category: "adversarial" },
  { name: "Deepfake reference", claim: "Joe Biden announced he is an alien in a recent press conference", expectedVerdict: "FALSE", category: "adversarial" },
  { name: "Satire as fact", claim: "The Onion reported that Congress passed a law requiring cats", category: "adversarial" },
  { name: "Outdated fact", claim: "Pluto is the ninth planet in our solar system", expectedVerdict: "FALSE", category: "adversarial" },

  // === PERFORMANCE TESTS ===
  { name: "Long claim", claim: "The human body is composed of approximately 60% water, and this water is distributed throughout various tissues and organs including the brain which is about 73% water, the lungs which are about 83% water, muscles and kidneys which are about 79% water, the skin which is about 64% water, and even bones which are about 31% water, making hydration essential for proper bodily function", category: "performance" },
  { name: "Technical claim", claim: "The TCP/IP protocol uses a three-way handshake consisting of SYN, SYN-ACK, and ACK packets", category: "performance" },
  { name: "Medical claim", claim: "Aspirin (acetylsalicylic acid) works by inhibiting cyclooxygenase enzymes COX-1 and COX-2", category: "performance" },
];

// Track results
const results: TestResult[] = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runSingleTest(testCase: TestCase): Promise<TestResult> {
  const startTime = performance.now();
  const result: TestResult = {
    name: testCase.name,
    claim: testCase.claim,
    success: false,
    duration_ms: 0,
  };

  try {
    // Start pipeline
    const checkResponse = await fetch(`${API_BASE}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: testCase.claim }),
    });

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      throw new Error(`API returned ${checkResponse.status}: ${errorText}`);
    }

    const { session_id } = await checkResponse.json();

    // Connect to SSE stream and wait for completion
    const verdict = await waitForVerdict(session_id, 120000); // 2 min timeout

    result.success = true;
    result.verdict = verdict.verdict;
    result.confidence = verdict.confidence;
    result.agreement_score = verdict.agreement_score;
    result.debate_triggered = verdict.debate_triggered;
    result.sources_count = verdict.sources?.length || 0;

  } catch (error: any) {
    result.success = false;
    result.error = error.message;
  }

  result.duration_ms = Math.round(performance.now() - startTime);
  return result;
}

async function waitForVerdict(sessionId: string, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Timeout waiting for verdict"));
    }, timeout);

    fetch(`${API_BASE}/api/check/stream?session=${sessionId}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "complete") {
                  clearTimeout(timeoutId);
                  resolve(data.data.verdict);
                  return;
                }
                if (data.event === "error") {
                  clearTimeout(timeoutId);
                  reject(new Error(data.message));
                  return;
                }
              } catch (e) {
                // Ignore parse errors for partial data
              }
            }
          }
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          reject(new Error("Timeout waiting for verdict"));
        } else {
          reject(error);
        }
      });
  });
}

async function runSequentialTests(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("SEQUENTIAL STRESS TEST");
  console.log("=".repeat(80));

  for (const testCase of TEST_CASES) {
    process.stdout.write(`\nTesting: ${testCase.name}... `);

    const result = await runSingleTest(testCase);
    results.push(result);
    totalTests++;

    if (result.success) {
      passedTests++;
      console.log(`✓ ${result.verdict} (${result.confidence}%) - ${result.duration_ms}ms`);

      // Check if verdict matches expected
      if (testCase.expectedVerdict && result.verdict !== testCase.expectedVerdict) {
        console.log(`  ⚠ Expected: ${testCase.expectedVerdict}, Got: ${result.verdict}`);
      }
    } else {
      failedTests++;
      console.log(`✗ FAILED: ${result.error}`);
    }

    // Small delay between tests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function runConcurrentTests(concurrency: number): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log(`CONCURRENT LOAD TEST (${concurrency} parallel requests)`);
  console.log("=".repeat(80));

  const concurrentClaims = [
    "The speed of light is approximately 299,792 km/s",
    "Oxygen makes up about 21% of Earth's atmosphere",
    "The human heart beats about 100,000 times per day",
    "Gold is the most conductive metal",
    "The Amazon is the longest river in the world",
  ].slice(0, concurrency);

  const startTime = performance.now();

  const promises = concurrentClaims.map((claim, i) =>
    runSingleTest({ name: `Concurrent-${i+1}`, claim, category: "performance" })
  );

  const concurrentResults = await Promise.all(promises);
  const totalTime = Math.round(performance.now() - startTime);

  console.log(`\nCompleted ${concurrency} concurrent requests in ${totalTime}ms`);
  console.log(`Average time per request: ${Math.round(totalTime / concurrency)}ms`);

  for (const result of concurrentResults) {
    results.push(result);
    totalTests++;
    if (result.success) {
      passedTests++;
      console.log(`  ✓ ${result.name}: ${result.verdict} (${result.duration_ms}ms)`);
    } else {
      failedTests++;
      console.log(`  ✗ ${result.name}: ${result.error}`);
    }
  }
}

async function runEdgeCaseTests(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("EDGE CASE TESTS");
  console.log("=".repeat(80));

  const edgeCases = [
    { name: "Empty-ish claim", claim: "          " },
    { name: "Too short", claim: "Hi" },
    { name: "Exactly 10 chars", claim: "1234567890" },
    { name: "Unicode claim", claim: "日本の首都は東京です (Tokyo is the capital of Japan)" },
    { name: "Emoji claim", claim: "🌍 The Earth is round 🌍" },
    { name: "HTML injection", claim: "<script>alert('xss')</script> The sky is blue" },
    { name: "SQL injection", claim: "'; DROP TABLE verdicts; -- The sky is blue" },
    { name: "Null bytes", claim: "The sky is blue\0 and water is wet" },
    { name: "Extremely long", claim: "A".repeat(2500) },
  ];

  for (const testCase of edgeCases) {
    process.stdout.write(`\nTesting: ${testCase.name}... `);

    try {
      const response = await fetch(`${API_BASE}/api/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: testCase.claim }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✓ Accepted (session: ${data.session_id?.slice(0, 8)}...)`);
      } else {
        console.log(`✓ Rejected correctly: ${data.error}`);
      }
    } catch (error: any) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
}

function printSummary(): void {
  console.log("\n" + "=".repeat(80));
  console.log("STRESS TEST SUMMARY");
  console.log("=".repeat(80));

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);

  // Performance stats
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const durations = successfulResults.map(r => r.duration_ms);
    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

    console.log("\nPerformance Metrics:");
    console.log(`  Average: ${avgDuration}ms`);
    console.log(`  Min: ${minDuration}ms`);
    console.log(`  Max: ${maxDuration}ms`);
    console.log(`  P95: ${p95Duration}ms`);
  }

  // Verdict distribution
  const verdictCounts: Record<string, number> = {};
  for (const result of successfulResults) {
    if (result.verdict) {
      verdictCounts[result.verdict] = (verdictCounts[result.verdict] || 0) + 1;
    }
  }
  console.log("\nVerdict Distribution:");
  for (const [verdict, count] of Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${verdict}: ${count}`);
  }

  // Debate statistics
  const debateTriggered = successfulResults.filter(r => r.debate_triggered).length;
  console.log(`\nDebate Triggered: ${debateTriggered}/${successfulResults.length} claims`);

  // Average confidence
  const confidences = successfulResults.filter(r => r.confidence !== undefined).map(r => r.confidence!);
  if (confidences.length > 0) {
    const avgConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
    console.log(`Average Confidence: ${avgConfidence}%`);
  }

  // Failed tests details
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("FAILED TESTS DETAILS");
    console.log("=".repeat(80));
    for (const result of failedResults) {
      console.log(`\n❌ ${result.name}`);
      console.log(`   Claim: ${result.claim.slice(0, 80)}...`);
      console.log(`   Error: ${result.error}`);
    }
  }

  // Accuracy check for claims with expected verdicts
  const expectedResults = results.filter(r => r.success && TEST_CASES.find(t => t.claim === r.claim)?.expectedVerdict);
  let correctPredictions = 0;
  let incorrectPredictions: TestResult[] = [];

  for (const result of expectedResults) {
    const testCase = TEST_CASES.find(t => t.claim === result.claim);
    if (testCase?.expectedVerdict === result.verdict) {
      correctPredictions++;
    } else {
      incorrectPredictions.push(result);
    }
  }

  if (expectedResults.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("ACCURACY ANALYSIS");
    console.log("=".repeat(80));
    console.log(`Correct Verdicts: ${correctPredictions}/${expectedResults.length} (${Math.round(correctPredictions/expectedResults.length*100)}%)`);

    if (incorrectPredictions.length > 0) {
      console.log("\nIncorrect Predictions:");
      for (const result of incorrectPredictions) {
        const expected = TEST_CASES.find(t => t.claim === result.claim)?.expectedVerdict;
        console.log(`  • "${result.claim.slice(0, 50)}..."`);
        console.log(`    Expected: ${expected}, Got: ${result.verdict}`);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    TRUTHCAST PIPELINE STRESS TEST                            ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  console.log(`\nStarting at: ${new Date().toISOString()}`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`Total test cases: ${TEST_CASES.length}`);

  try {
    // Check if server is running
    const healthCheck = await fetch(`${API_BASE}/api/stats`).catch(() => null);
    if (!healthCheck?.ok) {
      console.error("\n❌ Server not responding. Make sure 'npm run dev' is running.");
      process.exit(1);
    }
    console.log("✓ Server is running");

    // Run tests
    await runSequentialTests();
    await runConcurrentTests(3);
    await runEdgeCaseTests();

    // Print summary
    printSummary();

  } catch (error: any) {
    console.error("\n❌ Stress test failed:", error.message);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(80));
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log("=".repeat(80));
}

main();
