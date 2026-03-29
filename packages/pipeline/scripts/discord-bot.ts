#!/usr/bin/env npx tsx
/**
 * Standalone TruthCast Discord Bot
 * Bypasses OpenClaw - runs pipeline directly
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const TRIGGERS = ['fact-check:', 'fact check:', 'is this true:', 'verify:', 'check:'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ TruthCast bot ready as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  // Ignore own messages
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Check if bot is mentioned or trigger phrase is used
  const isMentioned = message.mentions.has(client.user!);
  const hasTrigger = TRIGGERS.some(t => content.includes(t));

  if (!isMentioned && !hasTrigger) return;

  // Extract the claim
  let claim = message.content;

  // Remove bot mention
  claim = claim.replace(/<@!?\d+>/g, '').trim();

  // Remove trigger phrases
  for (const trigger of TRIGGERS) {
    const regex = new RegExp(trigger, 'gi');
    claim = claim.replace(regex, '').trim();
  }

  if (!claim || claim.length < 5) {
    await message.reply('Please provide a claim to fact-check. Example: `@TruthCast fact-check: The Earth is round`');
    return;
  }

  // Show typing indicator
  await message.channel.sendTyping();

  try {
    console.log(`[Bot] Fact-checking: "${claim}"`);

    // Run the pipeline
    const result = execSync(
      `/Users/suryanshss/TruthCast/truthcast.sh "${claim.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    // Parse JSON output
    const verdict = JSON.parse(result);

    // Format response
    let response = `**Verdict: ${verdict.verdict}** · ${verdict.confidence}% confidence\n\n`;
    response += `**Reasoning:** ${verdict.reasoning}\n\n`;
    response += `**Sources:**\n`;

    for (const source of verdict.sources.slice(0, 5)) {
      response += `• ${source.domain} · Tier ${source.domain_tier}\n`;
    }

    if (verdict.tx_hash) {
      response += `\n**On-chain proof:** https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`;
    }

    await message.reply(response);
    console.log(`[Bot] Responded with verdict: ${verdict.verdict}`);

  } catch (error: any) {
    console.error('[Bot] Error:', error.message);
    await message.reply('Fact-check failed. Please try again later.');
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'truthcast') return;

  const claim = interaction.options.getString('claim');
  if (!claim) {
    await interaction.reply('Please provide a claim to fact-check.');
    return;
  }

  await interaction.deferReply();

  try {
    console.log(`[Bot] Slash command fact-check: "${claim}"`);

    const result = execSync(
      `/Users/suryanshss/TruthCast/truthcast.sh "${claim.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    const verdict = JSON.parse(result);

    let response = `**Verdict: ${verdict.verdict}** · ${verdict.confidence}% confidence\n\n`;
    response += `**Reasoning:** ${verdict.reasoning}\n\n`;
    response += `**Sources:**\n`;

    for (const source of verdict.sources.slice(0, 5)) {
      response += `• ${source.domain} · Tier ${source.domain_tier}\n`;
    }

    if (verdict.tx_hash) {
      response += `\n**On-chain proof:** https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`;
    }

    await interaction.editReply(response);

  } catch (error: any) {
    console.error('[Bot] Error:', error.message);
    await interaction.editReply('Fact-check failed. Please try again later.');
  }
});

// Start the bot
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('Error: DISCORD_BOT_TOKEN not set in .env');
  process.exit(1);
}

client.login(token);
console.log('Starting TruthCast Discord bot...');
