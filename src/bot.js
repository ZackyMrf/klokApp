import { ethers } from "ethers";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import Table from "cli-table3";
import gradient from "gradient-string";
import boxen from "boxen";
import cron from "node-cron";

import CONFIG from "./config.js";
import { getRandomQuestion } from "./utils/questions.js";
import { delay, generateThreadId } from "./utils/helpers.js";
import { formatTime, formatAddress, formatResponse, formatWalletStatus } from "./utils/formatting.js";
import { connectWallet } from "./api/connect.js";
import { sendMessage } from "./api/messaging.js";
import { getUserLimits } from "./api/limits.js";

export class EnhancedKlokappBot {
  constructor(config = {}) {
    // Core configuration
    this.baseUrl = config.baseUrl || CONFIG.baseUrl;
    this.wallets = [];
    this.currentWalletIndex = 0;
    this.sessionTokens = {};
    this.running = true;
    this.threads = {}; // Store thread IDs by wallet address
    this.stats = {
      totalChats: 0,
      totalResponses: 0,
      startTime: Date.now(),
      chatsByWallet: {},
      errors: 0,
    };
    
    // Chat scheduling
    this.scheduleMode = config.scheduleMode || CONFIG.scheduleMode;
    this.minChatInterval = config.minChatInterval || CONFIG.minChatInterval;
    this.maxChatDelay = config.maxChatDelay || CONFIG.maxChatDelay;
    
    // Session management
    this.persistentThreads = config.persistentThreads || CONFIG.persistentThreads;
    this.maxThreadAge = config.maxThreadAge || CONFIG.maxThreadAge;
    
    // Initialize wallets from private keys (comma-separated)
    if (process.env.PRIVATE_KEYS) {
      const privateKeys = process.env.PRIVATE_KEYS.split(',').map(key => key.trim());
      privateKeys.forEach(key => {
        try {
          const wallet = new ethers.Wallet(key);
          this.wallets.push(wallet);
          this.stats.chatsByWallet[wallet.address] = 0;
        } catch (error) {
          console.error(`Invalid private key: ${key.substring(0, 6)}...`);
        }
      });
    } else if (process.env.PRIVATE_KEY) {
      try {
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        this.wallets.push(wallet);
        this.stats.chatsByWallet[wallet.address] = 0;
      } catch (error) {
        console.error(`Invalid private key: ${process.env.PRIVATE_KEY.substring(0, 6)}...`);
      }
    }
  }

  // Display fancy startup banner
  displayBanner() {
    console.clear();
    
    // Create a more vibrant title with gradient
    const title = figlet.textSync('KlokApp Bot', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });
    
    console.log(gradient.pastel(title));
    
    // ASCII art decoration
    const logo = `
      ⚡️ ${'K'.padEnd(4)}  ${'L'.padEnd(4)}  ${'O'.padEnd(4)}  ${'K'.padEnd(4)} ⚡️ 
      ${' '.padEnd(4)}  ${' '.padEnd(4)}  ${' '.padEnd(4)}  ${' '.padEnd(4)}
      🤖 ${'B'.padEnd(4)}  ${'O'.padEnd(4)}  ${'T'.padEnd(4)}  ${' '.padEnd(4)} 🤖
    `;
    
    console.log(gradient.cristal(logo));
    
    // Get current date/time
    const now = new Date();
    const dateTimeStr = now.toLocaleString();
    
    // Create info box with more details
    console.log(boxen(
      `${chalk.bold(gradient.morning(' KlokApp Chat Bot v2.0.0'))}\n\n` +
      `${chalk.blue('•')} ${chalk.bold('Started:')} ${dateTimeStr}\n` +
      `${chalk.blue('•')} ${chalk.bold('Wallets:')} ${this.wallets.length}\n` +
      `${chalk.blue('•')} ${chalk.bold('Mode:')} ${this.scheduleMode}\n` +
      `${chalk.blue('•')} ${chalk.bold('Persistent Threads:')} ${this.persistentThreads ? 'Enabled' : 'Disabled'}\n` +
      `${chalk.blue('•')} ${chalk.bold('Min Chat Interval:')} ${this.minChatInterval / 1000}s\n` +
      `${chalk.blue('•')} ${chalk.bold('Max Chat Delay:')} ${this.maxChatDelay / 60000}min\n` +
      `${chalk.yellow('•')} ${chalk.bold('v2.0.0:')} mrf\n\n` +
      `${chalk.italic('Automated chat interaction for KlokApp - Use responsibly')}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#222',
        float: 'center',
        align: 'center',
        title: '🚀 KlokApp Bot 🚀',
        titleAlignment: 'center',
      }
    ));
    
    // Add separator line
    console.log('\n' + chalk.cyan('─'.repeat(process.stdout.columns || 80)) + '\n');
  }

  // Get next wallet using round-robin approach
  getNextWallet() {
    if (this.wallets.length === 0) {
      throw new Error("No wallets available");
    }
    
    const wallet = this.wallets[this.currentWalletIndex];
    this.currentWalletIndex = (this.currentWalletIndex + 1) % this.wallets.length;
    return wallet;
  }

  // Display bot stats in a nice table
  displayStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    console.log(chalk.bold("\n📊 Bot Statistics"));
    
    const table = new Table({
      head: [
        chalk.cyan('Metric'),
        chalk.cyan('Value')
      ],
      style: {
        head: [],
        border: []
      }
    });
    
    table.push(
      ['Runtime', formatTime(runtime)],
      ['Total Chats', this.stats.totalChats],
      ['Success Rate', `${Math.round((this.stats.totalResponses / (this.stats.totalChats || 1)) * 100)}%`],
      ['Errors', this.stats.errors]
    );
    
    console.log(table.toString());
    
    // Wallet stats table
    if (this.wallets.length > 1) {
      const walletTable = new Table({
        head: [
          chalk.cyan('Wallet'),
          chalk.cyan('Chats'),
          chalk.cyan('Status')
        ],
        style: {
          head: [],
          border: []
        }
      });
      
      this.wallets.forEach(wallet => {
        const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
        const chats = this.stats.chatsByWallet[wallet.address] || 0;
        const status = this.sessionTokens[wallet.address] ? chalk.green('Connected') : chalk.yellow('Disconnected');
        
        walletTable.push([shortAddress, chats, status]);
      });
      
      console.log(chalk.bold("\n🔑 Wallet Statistics"));
      console.log(walletTable.toString());
    }
  }

  // Main entry point
  async start() {
    try {
      this.displayBanner();
      
      if (this.wallets.length === 0) {
        console.log(chalk.red('❌ No valid wallets found. Please check your PRIVATE_KEY(S) in .env file.'));
        return;
      }
      
      console.log(chalk.green(`✅ Initialized ${this.wallets.length} wallet(s)`));
      
      for (const wallet of this.wallets) {
        const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
        console.log(chalk.blue(`🔑 Wallet ready: ${shortAddress}`));
      }
      
      // Setup cron job for regular status updates
      cron.schedule('*/15 * * * *', () => {
        this.displayStats();
      });
      
      // Run main processing loop
      await this.processWallets();
      
    } catch (error) {
      console.error(chalk.red(`❌ Critical error: ${error.message}`));
      console.error(error);
      this.stats.errors++;
    }
  }

  // Process all wallets in sequence
  async processWallets() {
    while (this.running) {
      for (const wallet of this.wallets) {
        try {
          await this.processWalletChats(wallet);
        } catch (error) {
          console.error(chalk.red(`❌ Error processing wallet ${wallet.address.substring(0, 6)}...: ${error.message}`));
          this.stats.errors++;
          
          // Clear session token to force reconnect next time
          delete this.sessionTokens[wallet.address];
        }
        
        // Add small delay between wallets to avoid rate limiting
        await delay(5000);
      }
      
      // After processing all wallets, wait before next round
      console.log(chalk.yellow(`😴 All wallets processed. Sleeping for 5 minutes...`));
      await delay(5 * 60 * 1000);
    }
  }

  // Process chats for a specific wallet
  async processWalletChats(wallet) {
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
    
    // Connect wallet if not connected
    if (!this.sessionTokens[wallet.address]) {
      const spinner = ora(`Connecting wallet ${shortAddress}...`).start();
      try {
        this.sessionTokens[wallet.address] = await connectWallet(wallet, this.baseUrl);
        spinner.succeed(`Connected wallet ${shortAddress}`);
      } catch (error) {
        spinner.fail(`Failed to connect wallet ${shortAddress}`);
        throw error;
      }
    }
    
    // Get user limits
    const spinner = ora(`Checking limits for ${shortAddress}...`).start();
    let userLimits;
    try {
      userLimits = await getUserLimits(this.baseUrl, this.sessionTokens[wallet.address]);
      
      if (userLimits.isPremium) {
        spinner.succeed(`${shortAddress} - Premium account: ${userLimits.remainingMessages}/${userLimits.totalMessages} messages`);
      } else {
        spinner.succeed(`${shortAddress} - Free account: ${userLimits.remainingMessages}/${userLimits.totalMessages} messages`);
      }
    } catch (error) {
      spinner.fail(`Failed to get limits for ${shortAddress}`);
      throw error;
    }
    
    // Skip if no messages remaining
    if (userLimits.remainingMessages <= 0) {
      console.log(chalk.yellow(`⏳ No messages remaining for ${shortAddress}. Will try again later.`));
      if (userLimits.resetTime) {
        const resetDate = new Date(userLimits.resetTime);
        console.log(chalk.blue(`📅 Next reset: ${resetDate.toLocaleString()}`));
      }
      return;
    }
    
    // Determine optimal number of chats based on strategy
    let chatCount;
    switch (this.scheduleMode) {
      case 'aggressive':
        chatCount = userLimits.remainingMessages;
        break;
      case 'conservative':
        chatCount = Math.min(3, userLimits.remainingMessages);
        break;
      case 'adaptive':
      default:
        // If premium or high count, use half of remaining
        if (userLimits.isPremium || userLimits.remainingMessages > 20) {
          chatCount = Math.ceil(userLimits.remainingMessages / 2);
        } else {
          chatCount = Math.min(5, userLimits.remainingMessages);
        }
        break;
    }
    
    // Perform chats
    console.log(chalk.cyan(`🚀 Starting ${chatCount} chats for ${shortAddress}`));
    
    for (let i = 0; i < chatCount; i++) {
      // Create or reuse thread ID
      let threadId;
      if (this.persistentThreads && this.threads[wallet.address]) {
        threadId = this.threads[wallet.address];
        console.log(chalk.blue(`🧵 Reusing thread: ${threadId.substring(0, 8)}...`));
      } else {
        threadId = generateThreadId();
        this.threads[wallet.address] = threadId;
        console.log(chalk.blue(`🧵 Created new thread: ${threadId.substring(0, 8)}...`));
      }
      
      // Select and send question
      const { category, question } = getRandomQuestion();
      
      console.log(chalk.yellow(`\n💬 [${i+1}/${chatCount}] Category: ${category}`));
      console.log(chalk.white(`❓ Question: ${question}`));
      
      const chatSpinner = ora('Sending message...').start();
      
      try {
        const response = await sendMessage(this.baseUrl, this.sessionTokens[wallet.address], threadId, question);
        
        this.stats.totalChats++;
        this.stats.totalResponses++;
        this.stats.chatsByWallet[wallet.address] = (this.stats.chatsByWallet[wallet.address] || 0) + 1;
        
        const snippedResponse = response.content.length > 100 
          ? `${response.content.substring(0, 100)}...` 
          : response.content;
          
        chatSpinner.succeed('Response received');
        console.log(chalk.green(`✅ Response: ${snippedResponse}`));
      } catch (error) {
        chatSpinner.fail('Failed to send message');
        console.error(chalk.red(`❌ Error: ${error.message}`));
        this.stats.errors++;
        
        // If it's a thread error, create a new thread next time
        if (error.message.includes('thread') || error.message.includes('not found')) {
          delete this.threads[wallet.address];
        }
        
        // If it's an authentication error, force reconnect
        if (error.message.includes('authentication') || error.message.includes('session')) {
          delete this.sessionTokens[wallet.address];
          break; // Stop processing this wallet
        }
      }
      
      // Add delay between messages
      if (i < chatCount - 1) {
        const waitTime = Math.floor(Math.random() * 5000) + 5000; // 5-10 seconds
        await delay(waitTime);
      }
    }
  }
}