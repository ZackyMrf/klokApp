import "dotenv/config";
import chalk from "chalk"; // Tambahkan import chalk
import { EnhancedKlokappBot } from "./bot.js";
import CONFIG from "./config.js";

// Create enhanced bot with configuration
const botConfig = {
  baseUrl: CONFIG.baseUrl,
  scheduleMode: CONFIG.scheduleMode,
  persistentThreads: CONFIG.persistentThreads,
  minChatInterval: CONFIG.minChatInterval,
  maxChatDelay: CONFIG.maxChatDelay,
};

const bot = new EnhancedKlokappBot(botConfig);

// Start the bot
bot.start().catch((error) => {
  console.error(chalk.red("❌ Fatal error:"), error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log(chalk.blue("\n👋 Bot is shutting down..."));
  bot.running = false;
  
  // Display final stats before exit
  bot.displayStats();
  
  setTimeout(() => process.exit(0), 1000);
});