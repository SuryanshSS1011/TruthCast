#!/usr/bin/env node
/**
 * Phase 1: Solana Memo Program Test Script (Manual Funding)
 *
 * This script assumes the wallet is already funded via web faucet.
 * Use this when the automated airdrop fails due to rate limits.
 *
 * Steps to run:
 * 1. Get your wallet address from .env (SOLANA_PRIVATE_KEY)
 * 2. Visit https://faucet.solana.com and request devnet SOL
 * 3. Run this script to write a test memo
 */

import { Connection, Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import bs58 from "bs58";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testSolanaWithFunding() {
  console.log("\n=== TruthCast Phase 1: Solana Integration Test (Manual Funding) ===\n");

  try {
    // Step 1: Create connection to devnet
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    console.log(`1. Connecting to Solana devnet: ${rpcUrl}`);
    const connection = new Connection(rpcUrl, "confirmed");

    // Load keypair from environment
    const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyString) {
      console.error("\n❌ ERROR: SOLANA_PRIVATE_KEY not found in .env file");
      console.log("\nPlease add your private key to .env:");
      console.log("SOLANA_PRIVATE_KEY=<your_base58_private_key>");
      process.exit(1);
    }

    console.log("2. Loading keypair from SOLANA_PRIVATE_KEY");
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyString));
    console.log(`   Wallet address: ${keypair.publicKey.toBase58()}`);

    // Check balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`\n3. Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance === 0) {
      console.log("\n⚠️  Wallet has 0 SOL. You need to fund it first:");
      console.log("\n📋 Instructions to fund your wallet:");
      console.log("   1. Copy your wallet address: " + keypair.publicKey.toBase58());
      console.log("   2. Visit: https://faucet.solana.com");
      console.log("   3. Paste your address and request 1-2 SOL on DEVNET");
      console.log("   4. Wait ~30 seconds for confirmation");
      console.log("   5. Run this script again\n");
      process.exit(0);
    }

    // Step 3: Write test message using Memo Program
    const testMessage = JSON.stringify({
      test: "TruthCast Phase 1",
      timestamp: Math.floor(Date.now() / 1000),
      message: "Solana Memo Program integration successful!",
      wallet: keypair.publicKey.toBase58()
    });

    console.log(`\n4. Writing test memo to Solana devnet...`);
    console.log(`   Memo content (${Buffer.byteLength(testMessage, 'utf8')} bytes):`);
    console.log(`   ${testMessage}`);

    const memoInstruction = createMemoInstruction(testMessage, [keypair.publicKey]);
    const transaction = new Transaction().add(memoInstruction);

    console.log("\n5. Sending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      { commitment: "confirmed" }
    );

    // Success!
    const newBalance = await connection.getBalance(keypair.publicKey);
    console.log("\n" + "=".repeat(70));
    console.log("✅ SUCCESS! Transaction confirmed on Solana devnet");
    console.log("=".repeat(70));
    console.log(`\n📝 Transaction Details:`);
    console.log(`   Signature: ${signature}`);
    console.log(`   Wallet: ${keypair.publicKey.toBase58()}`);
    console.log(`   Balance: ${newBalance / LAMPORTS_PER_SOL} SOL (${(balance - newBalance) / LAMPORTS_PER_SOL} SOL spent on tx fee)`);
    console.log(`\n🔗 View on Solana Explorer:`);
    console.log(`   https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`\n🔗 View wallet on Solana Explorer:`);
    console.log(`   https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet`);
    console.log("\n" + "=".repeat(70));
    console.log("🎉 Phase 1 Complete! Blockchain integration verified.");
    console.log("=".repeat(70) + "\n");

    return signature;

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Make sure your wallet has SOL (use https://faucet.solana.com)");
    console.error("2. Check that SOLANA_RPC_URL is set correctly in .env");
    console.error("3. Verify your SOLANA_PRIVATE_KEY is a valid Base58 encoded keypair");
    console.error("4. Ensure you have internet connection\n");
    process.exit(1);
  }
}

// Run the test
testSolanaWithFunding();
