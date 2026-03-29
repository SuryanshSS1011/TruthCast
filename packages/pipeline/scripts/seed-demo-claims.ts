/**
 * Seed Demo Claims
 *
 * Adds interesting, complex claims to the database for demo purposes.
 * Includes viral misinformation, scientific claims, historical facts, and YouTube references.
 */

const API_BASE = "http://localhost:3000";

// Demo claims organized by category
const DEMO_CLAIMS = [
  // === VIRAL MISINFORMATION (FALSE) ===
  {
    claim: "The COVID-19 vaccine contains a microchip that allows the government to track your movements",
    category: "Viral Misinformation",
    expected: "FALSE"
  },
  {
    claim: "5G cell towers cause cancer and spread coronavirus",
    category: "Viral Misinformation",
    expected: "FALSE"
  },
  {
    claim: "NASA confirmed that the Earth will experience 15 days of complete darkness in November 2024",
    category: "Viral Misinformation",
    expected: "FALSE"
  },
  {
    claim: "Drinking bleach can cure COVID-19 according to scientific studies",
    category: "Viral Misinformation",
    expected: "FALSE"
  },

  // === SCIENTIFIC FACTS (TRUE) ===
  {
    claim: "CRISPR-Cas9 gene editing technology won the Nobel Prize in Chemistry in 2020, awarded to Jennifer Doudna and Emmanuelle Charpentier",
    category: "Scientific Facts",
    expected: "TRUE"
  },
  {
    claim: "The James Webb Space Telescope captured the deepest infrared image of the universe ever taken, revealing galaxies over 13 billion years old",
    category: "Scientific Facts",
    expected: "TRUE"
  },
  {
    claim: "Black holes can emit radiation through a quantum effect predicted by Stephen Hawking, now known as Hawking radiation",
    category: "Scientific Facts",
    expected: "TRUE"
  },
  {
    claim: "Human-caused climate change has increased global average temperatures by approximately 1.1°C since pre-industrial times according to the IPCC",
    category: "Scientific Facts",
    expected: "TRUE"
  },

  // === HISTORICAL CLAIMS ===
  {
    claim: "The Great Fire of London in 1666 destroyed over 13,000 houses and 87 churches but officially killed fewer than 10 people",
    category: "Historical",
    expected: "MOSTLY_TRUE"
  },
  {
    claim: "Napoleon Bonaparte was actually above average height for his time, standing at 5'7\" - the myth of his short stature came from British propaganda",
    category: "Historical",
    expected: "TRUE"
  },
  {
    claim: "The Berlin Wall fell on November 9, 1989, after an East German official accidentally announced that travel restrictions would be lifted immediately",
    category: "Historical",
    expected: "TRUE"
  },

  // === YOUTUBE/SOCIAL MEDIA CLAIMS ===
  {
    claim: "MrBeast's video 'I Spent 50 Hours Buried Alive' reached over 100 million views within its first month of upload",
    category: "YouTube/Social Media",
    expected: "TRUE"
  },
  {
    claim: "The most liked YouTube video of all time is 'Despacito' by Luis Fonsi featuring Daddy Yankee with over 50 million likes",
    category: "YouTube/Social Media",
    expected: "TRUE"
  },
  {
    claim: "PewDiePie was the first individual YouTuber to reach 100 million subscribers",
    category: "YouTube/Social Media",
    expected: "TRUE"
  },
  {
    claim: "YouTube Shorts was launched in response to TikTok's growing popularity and rolled out globally in July 2021",
    category: "YouTube/Social Media",
    expected: "TRUE"
  },

  // === COMPLEX MULTI-PART CLAIMS ===
  {
    claim: "OpenAI's GPT-4 was trained on over 1 trillion parameters, can pass the bar exam in the top 10%, and was released before Google's Gemini Ultra",
    category: "Complex Tech Claims",
    expected: "MISLEADING" // Parameter count is not confirmed, bar exam is true, timing is complex
  },
  {
    claim: "Tesla's Cybertruck was announced in 2019, originally promised for 2021, but actual deliveries didn't begin until late 2023",
    category: "Complex Tech Claims",
    expected: "TRUE"
  },
  {
    claim: "SpaceX's Starship is designed to be fully reusable, can carry over 100 tons to low Earth orbit, and completed its first successful orbital test flight in 2024",
    category: "Complex Tech Claims",
    expected: "MOSTLY_TRUE"
  },

  // === HEALTH & MEDICINE ===
  {
    claim: "Intermittent fasting has been shown in peer-reviewed studies to improve insulin sensitivity and promote cellular autophagy",
    category: "Health & Medicine",
    expected: "TRUE"
  },
  {
    claim: "The human brain uses 20% of the body's total energy despite being only 2% of body weight",
    category: "Health & Medicine",
    expected: "TRUE"
  },
  {
    claim: "Antibiotics are effective against viral infections like the common cold and flu",
    category: "Health & Medicine",
    expected: "FALSE"
  },

  // === ECONOMICS & BUSINESS ===
  {
    claim: "Bitcoin reached an all-time high above $69,000 in November 2021 before the crypto market crash",
    category: "Economics",
    expected: "TRUE"
  },
  {
    claim: "Apple became the first company to reach a $3 trillion market capitalization in January 2022",
    category: "Economics",
    expected: "TRUE"
  },

  // === CURRENT EVENTS (2024) ===
  {
    claim: "The 2024 Paris Olympics featured breaking (breakdancing) as an official Olympic sport for the first time",
    category: "Current Events",
    expected: "TRUE"
  },
  {
    claim: "Taylor Swift's Eras Tour became the highest-grossing concert tour of all time, surpassing $1 billion in revenue",
    category: "Current Events",
    expected: "TRUE"
  },

  // === DEBATABLE/CONFLICTING ===
  {
    claim: "Artificial general intelligence (AGI) will be achieved within the next 5 years according to leading AI researchers",
    category: "Debatable",
    expected: "CONFLICTING"
  },
];

async function seedClaim(claim: string, category: string): Promise<{success: boolean, verdict?: string, error?: string}> {
  try {
    // Start pipeline
    const checkRes = await fetch(`${API_BASE}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });

    if (!checkRes.ok) {
      const text = await checkRes.text();
      return { success: false, error: `API error ${checkRes.status}: ${text.slice(0, 100)}` };
    }

    const { session_id } = await checkRes.json();

    // Wait for completion via stream
    const verdict = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout (2 min)")), 120000);

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
                try {
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
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        })
        .catch(reject);
    });

    return { success: true, verdict: verdict.verdict };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    TRUTHCAST DEMO CLAIMS SEEDER                              ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝\n");

  console.log(`Seeding ${DEMO_CLAIMS.length} demo claims...\n`);

  let seeded = 0;
  let failed = 0;
  let currentCategory = "";

  for (let i = 0; i < DEMO_CLAIMS.length; i++) {
    const { claim, category, expected } = DEMO_CLAIMS[i];

    // Print category header
    if (category !== currentCategory) {
      currentCategory = category;
      console.log(`\n${"─".repeat(70)}`);
      console.log(`📁 ${category.toUpperCase()}`);
      console.log(`${"─".repeat(70)}`);
    }

    process.stdout.write(`[${i + 1}/${DEMO_CLAIMS.length}] "${claim.slice(0, 50)}..." `);

    const result = await seedClaim(claim, category);

    if (result.success) {
      seeded++;
      const match = result.verdict === expected ? "✓" : `≠${expected}`;
      console.log(`→ ${result.verdict} ${match}`);
    } else {
      failed++;
      console.log(`✗ ${result.error}`);
    }

    // Wait between requests to respect rate limit (5.5 seconds)
    if (i < DEMO_CLAIMS.length - 1) {
      await new Promise(r => setTimeout(r, 5500));
    }
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log(`✅ Seeded: ${seeded}/${DEMO_CLAIMS.length}`);
  console.log(`❌ Failed: ${failed}/${DEMO_CLAIMS.length}`);
  console.log(`${"═".repeat(70)}\n`);

  console.log("Demo claims are now available in the database!");
  console.log("View them at: http://localhost:3000/history");
}

main().catch(console.error);
