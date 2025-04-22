# KlokApp Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)

---

## 📋 Overview

KlokApp Bot is an automated tool for interacting with the KlokApp AI platform. The bot enables you to manage multiple Ethereum wallets, send automated messages, collect points through chat activities, and leverage the referral system for bonuses.

---

## 🚀 Key Features

- **Multi-Wallet Support**: Manage multiple Ethereum wallets simultaneously.
- **Auto Chat**: Send automated, randomized messages with varied topics.
- **Proxy Support**: Avoid IP restrictions with proxy rotation.
- **Referral System**: Create new wallets and register them with referral codes.
- **Adaptive Mode**: Dynamically adjust chat frequency based on user limits.
- **Detailed Statistics**: Monitor bot performance with real-time stats.

---

## 🛠️ Installation

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js v16+](https://nodejs.org/)
- NPM or Yarn
- Ethereum wallet private keys
- (Optional) Proxy list for rotating connections

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zackymrf/klokApp.git
   cd klokApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment configuration**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file with your settings:
     ```
     PRIVATE_KEYS=privatekey1,privatekey2,privatekey3
     SCHEDULE_MODE=adaptive
     PERSISTENT_THREADS=true
     MIN_CHAT_INTERVAL=15000
     MAX_CHAT_DELAY=1800000
     REFERRAL_CODE=YOURREFERRALCODE
     ```

4. **(Optional) Add proxies**:
   - Create a `proxy.txt` file in the project root:
     ```
     http://username:password@host:port
     socks://username:password@host:port
     ```

---

## ⚙️ Configuration

### Environment Variables

| Parameter            | Description                                      | Default Value     |
|----------------------|--------------------------------------------------|-------------------|
| `PRIVATE_KEYS`       | Ethereum wallet private keys separated by commas | -                 |
| `SCHEDULE_MODE`      | Chat scheduling mode (`aggressive`, `adaptive`)  | `adaptive`        |
| `PERSISTENT_THREADS` | Use the same conversation thread (`true`/`false`) | `true`            |
| `MIN_CHAT_INTERVAL`  | Minimum interval between messages (in ms)        | `15000`           |
| `MAX_CHAT_DELAY`     | Maximum delay between messages (in ms)           | `1800000`         |
| `REFERRAL_CODE`      | Referral code to earn bonuses                    | -                 |

---

## 🤖 Usage

### Start the Bot
Run the main bot:
```bash
npm start
```

### Referral System
To create new wallets and register them with your referral code:
```bash
node reff.js YOURREFERRALCODE [number_of_accounts]
```
Example:
```bash
node reff.js RN98FCFW 5
```

---

## 📊 Statistics

The bot provides real-time performance statistics every 15 minutes, including:
- Total runtime
- Number of chats sent
- Success rate
- Number of errors
- Status of each wallet

---

## 🔧 Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify private keys and proxy configurations.
   - Check KlokApp service availability.

2. **Verification Failed**:
   - The API may have changed its authentication method.
   - Switch to alternative mode using:
     ```bash
     npm run alt
     ```

3. **Rate Limiting**:
   - Use more proxies and reduce chat frequency.
   - Set `SCHEDULE_MODE=conservative`.

### Debug Mode
For detailed logs, run:
```bash
DEBUG=true npm start
```

---

## 🔍 Project Structure

```
klokapp-bot/
├── src/
│   ├── index.js           # Main entry point
│   ├── config.js          # Configuration file
│   ├── utils/
│   │   ├── questions.js   # Question categories
│   │   ├── formatting.js  # Formatting utilities
│   │   └── helpers.js     # General utility functions
│   ├── api/
│   │   ├── connect.js     # Wallet connection
│   │   ├── limits.js      # Get user limits
│   │   └── messaging.js   # Send messages
│   └── bot.js             # Main bot class
├── reff.js                # Referral system script
├── .env                   # Environment configuration
├── .env.example           # Example configuration
├── proxy.txt              # Proxy list
└── accounts.txt           # Generated accounts for referral
```

---

## ⚠️ Notes

- Ensure you comply with KlokApp's terms of service.
- This bot is for educational purposes and task automation.
- Use proxies to avoid IP restrictions.
- Keep your private keys secure and never share them.

---


## 📜 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
