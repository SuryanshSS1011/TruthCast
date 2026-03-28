# Run Pipeline

Run the TruthCast pipeline end-to-end with a test claim and report the output of each stage.

Use the `pipeline-runner` subagent to execute a full smoke test.

**Usage:** `/project:run-pipeline` — uses the default test claim
**With claim:** Append the claim text after the command

**Pre-selected test claims:**
1. "The Great Wall of China is visible from space with the naked eye." → expect FALSE
2. "Vaccines cause autism." → expect FALSE  
3. "NASA confirmed the existence of water ice on the Moon." → expect TRUE
4. "Social media companies do more harm than good for democracy." → expect UNVERIFIABLE
5. "5G towers were used to spread COVID-19 and were destroyed in protests across Europe." → expect MISLEADING

Run this command after completing each build phase to confirm end-to-end functionality before moving to the next phase.
