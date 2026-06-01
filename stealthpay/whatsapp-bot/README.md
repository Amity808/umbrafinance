# WhatsApp Bot

This is a WhatsApp bot project built with Node.js.

## Prerequisites

- Node.js installed on your machine
- Dependencies installed (`npm install`)
- A configured `.env` file with necessary environment variables

## How to Run

1. **Start the Bot**
   To start the bot, run the following command in your terminal from the project directory:
   ```bash
   npm start
   ```
   Alternatively, you can run it directly using node:
   ```bash
   node server.js
   ```

2. **Expose to the Internet with ngrok**
   WhatsApp requires a public URL for webhooks. Since the bot runs locally on port 3002 (by default), you need to start `ngrok` in a separate terminal window:
   ```bash
   ngrok http 3002
   ```
   After running this, copy the `https` Forwarding URL provided by ngrok and use it to configure your WhatsApp webhook settings in the Meta Developer Portal.

