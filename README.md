# @helciofranco/toolkit

A Bun-based monorepo containing blockchain monitoring and notification services.

## Overview

This toolkit consists of three packages:

- **[@helciofranco/telegram](packages/telegram)** - Shared Telegram notification service
- **[@helciofranco/fuel](packages/fuel)** - Fuel network indexer health monitoring
- **[@helciofranco/webhooks](packages/webhooks)** - Webhook listeners for blockchain events

## Prerequisites

- [Bun](https://bun.sh/) 1.x or later
- A Telegram bot (see [Setup Guide](#telegram-setup))

## Quick Start

```bash
# Install dependencies
bun install

# Format code
bun run format

# Type check
bun run ts:check
```

## Setup Guide

### Telegram Setup

1. **Create a bot** using [@BotFather](https://t.me/BotFather):
   - Send `/newbot` to BotFather
   - Follow the wizard to create your bot
   - Save the bot token provided

2. **Get your chat ID**:
   - Send a message to your bot from your Telegram account
   - Run this command:
     ```bash
     curl -s https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
     ```
   - Find `result[0].message.chat.id` in the response

3. **Configure environment variables**:
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   TELEGRAM_ENABLED=true
   ```

## Project Structure

```
.
├── packages/
│   ├── fuel/          # Fuel indexer monitoring service
│   ├── telegram/      # Shared Telegram notification library
│   └── webhooks/      # Blockchain webhook listeners
├── package.json       # Workspace configuration
├── bunfig.toml       # Bun configuration
└── README.md         # This file
```
