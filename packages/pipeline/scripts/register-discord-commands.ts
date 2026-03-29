#!/usr/bin/env tsx
/**
 * Discord Slash Command Registration
 *
 * Registers the /factcheck command with Discord's API.
 * Must be run after creating the Discord bot and before using the command.
 *
 * Usage:
 *   tsx register-discord-commands.ts
 *
 * Required env vars:
 *   DISCORD_BOT_TOKEN - Bot token from Discord Developer Portal
 *   DISCORD_CLIENT_ID - Application ID from Discord Developer Portal
 *   DISCORD_GUILD_ID  - (Optional) Guild ID for instant registration (no 1-hour delay)
 */

import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

const commands = [
  {
    name: 'truthcast',
    description: 'Fact-check a claim. Usage: /truthcast The Earth is round',
    options: [
      {
        name: 'claim',
        description: 'The claim to fact-check (e.g., The Earth is round)',
        type: 3, // STRING
        required: true,
        max_length: 2000,
      }
    ]
  }
];

async function main() {
  const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

  if (!DISCORD_BOT_TOKEN) {
    console.error('Error: DISCORD_BOT_TOKEN not set in .env');
    process.exit(1);
  }

  if (!DISCORD_CLIENT_ID) {
    console.error('Error: DISCORD_CLIENT_ID not set in .env');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

  try {
    console.log('Registering Discord slash commands...');

    // Register to specific guild for instant propagation (no 1-hour delay)
    // Remove DISCORD_GUILD_ID from env to register globally instead
    if (DISCORD_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Slash commands registered to guild (instant): ${DISCORD_GUILD_ID}`);
    } else {
      await rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Slash commands registered globally (up to 1 hour to propagate)');
    }
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
    process.exit(1);
  }
}

main();
