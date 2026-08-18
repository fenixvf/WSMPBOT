---
name: Discord bot on Render
description: Deployment constraint for keeping the Discord gateway process online on Render.
---

Discord gateway bots should run as a Render Background Worker when continuous connectivity is required; a free Web Service can sleep without HTTP traffic, disconnecting the bot.

**Why:** A Discord gateway connection does not count as inbound web traffic, so hosting the bot only as a free HTTP service can leave it offline even when the deploy succeeds.

**How to apply:** Use the API server's production build and start commands for the worker, keep the Discord and database variables in the Render service, and allow the process to run without PORT.