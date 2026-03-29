/**
 * Quick stress test - runs a smaller set of claims to verify pipeline stability
 */

const API_BASE = "http://localhost:3000";

const TEST_CLAIMS = [
  { name: "True fact", claim: "The Earth orbits around the Sun" },
  { name: "False fact", claim: "The moon is made of cheese" },
  { name: "Opinion", claim: "Pizza is the best food ever" },
  { name: "Historical", claim: "The Berlin Wall fell in 1989" },
  { name: "Scientific", claim: "Water freezes at 0 degrees Celsius" },
];

interface TestResult {
  name: string;
  success: boolean;
  verdict?: string;
  confidence?: number;
  duration_ms: number;
  error?: string;
}

async function runTest(name: string, claim: string): Promise<TestResult> {
  const start = performance.now();
  const result: TestResult = { name, success: false, duration_ms: 0 };

  try {
    // Start pipeline
    const checkRes = await fetch(`${API_BASE}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });

    if (!checkRes.ok) {
      throw new Error(`API returned ${checkRes.status}`);
    }

    const { session_id } = await checkRes.json();

    // Wait for completion via stream
    const verdict = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), 120000);

      fetch(`${API_BASE}/api/check/stream?session=${session_id}`)
        .then(async (response) => {
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No body");

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
                const data = JSON.parse(line.slice(6));
                if (data.event === "complete") {
                  clearTimeout(timeout);
                  resolve(data.data.verdict);
                  return;
                }
                if (data.event === "error") {
                  clearTimeout(timeout);
                  reject(new Error(data.message));
                  return;
                }
              }
            }
          }
        })
        .catch(reject);
    });

    result.success = true;
    result.verdict = verdict.verdict;
    result.confidence = verdict.confidence;
  } catch (error: any) {
    result.error = error.message;
  }

  result.duration_ms = Math.round(performance.now() - start);
  return result;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         TRUTHCAST QUICK STRESS TEST                    ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const results: TestResult[] = [];

  for (const { name, claim } of TEST_CLAIMS) {
    process.stdout.write(`Testing: ${name}... `);
    const result = await runTest(name, claim);
    results.push(result);

    if (result.success) {
      console.log(`✓ ${result.verdict} (${result.confidence}%) - ${result.duration_ms}ms`);
    } else {
      console.log(`✗ FAILED: ${result.error}`);
    }

    // Respect rate limit (1 req per 5 seconds)
    await new Promise((r) => setTimeout(r, 5500));
  }

  // Summary
  const passed = results.filter((r) => r.success).length;
  const durations = results.filter((r) => r.success).map((r) => r.duration_ms);
  const avgTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed}/${results.length} passed`);
  console.log(`Average time: ${avgTime}ms`);
  console.log("=".repeat(60));
}

main();
