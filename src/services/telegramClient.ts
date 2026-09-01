export interface TelegramVerificationResult {
  success: boolean;
  botName?: string;
  username?: string;
  botId?: number;
  message?: string;
  error?: string;
  helpTip?: string;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
  helpTip?: string;
}

/**
 * Normalizes Telegram channel / chat identifier
 * Supports:
 * - @channel_name
 * - channel_name -> @channel_name
 * - https://t.me/channel_name -> @channel_name
 * - t.me/channel_name -> @channel_name
 * - -1001234567890 (Supergroup / Channel ID)
 * - 123456789 (User ID)
 */
export function normalizeTelegramChatId(input: string): string {
  let cleaned = (input || '').trim();
  if (!cleaned) return '';

  // Remove t.me URLs
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, '');
  cleaned = cleaned.replace(/^t\.me\//i, '');

  // If it's a numeric ID (e.g. 123456789 or -1001234567890), keep as is
  if (/^-?\d+$/.test(cleaned)) {
    return cleaned;
  }

  // If it does not start with @ and is an alphanumeric username, prepend @
  if (!cleaned.startsWith('@')) {
    cleaned = `@${cleaned}`;
  }

  return cleaned;
}

/**
 * Extracts friendly troubleshooting tips from Telegram error responses
 */
function getHelpfulTelegramTip(errorDesc: string): string {
  const desc = (errorDesc || '').toLowerCase();
  if (desc.includes('chat not found')) {
    return 'Chat not found: (1) If sending to a Channel or Supergroup, add your Bot as an Administrator with post permissions. (2) If sending to a private user ID, open your bot in Telegram and press /start first.';
  }
  if (desc.includes('unauthorized') || desc.includes('not found')) {
    return 'Invalid Bot Token: Check that the token was copied completely from @BotFather without extra spaces.';
  }
  if (desc.includes('bot was blocked')) {
    return 'Bot was blocked: The recipient user has blocked the bot. Open the bot in Telegram and unblock/start it.';
  }
  if (desc.includes('not a member') || desc.includes('have no rights to send a message')) {
    return 'Permission Denied: Please add the bot to the channel/group and grant "Post Messages" admin permissions.';
  }
  if (desc.includes('wrong file identifier')) {
    return 'File upload error: Telegram could not process the media stream.';
  }
  return 'Ensure the bot is created via @BotFather and has administrative permissions in your target channel.';
}

export class TelegramClient {
  /**
   * Verify Bot Token with Telegram getMe API
   */
  static async verifyBotToken(botToken: string): Promise<TelegramVerificationResult> {
    const token = (botToken || '').trim();
    if (!token) {
      return {
        success: false,
        error: 'Please enter a Telegram Bot Token',
        helpTip: 'Get your bot token from @BotFather on Telegram (e.g., 7123456789:AAHqXXXXXXXXXXXXX)',
      };
    }

    // 1. First try server endpoint
    try {
      const serverRes = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token }),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && data.username && !data.isSimulated) {
          return {
            success: true,
            botName: data.botName,
            username: data.username,
            message: `Connected successfully to @${data.username} (${data.botName || 'Bot'})`,
          };
        }
      }
    } catch {
      // Continue to direct client fetch
    }

    // 2. Direct client fetch to Telegram Bot API (getMe)
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();

      if (data.ok && data.result) {
        return {
          success: true,
          botName: data.result.first_name,
          username: data.result.username,
          botId: data.result.id,
          message: `Connected successfully to @${data.result.username} (${data.result.first_name})!`,
        };
      } else {
        const errorDesc = data.description || 'Failed to authenticate with Telegram';
        return {
          success: false,
          error: `Telegram Error: ${errorDesc}`,
          helpTip: getHelpfulTelegramTip(errorDesc),
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Network Error: ${err?.message || 'Could not reach Telegram API servers'}`,
        helpTip: 'Check your internet connection or any VPN/firewall blocking api.telegram.org',
      };
    }
  }

  /**
   * Dispatch a real message to a Telegram Channel, Group, or User
   */
  static async sendMessage(
    botToken: string,
    chatId: string,
    message: string
  ): Promise<TelegramSendResult> {
    const token = (botToken || '').trim();
    const targetChat = normalizeTelegramChatId(chatId);

    if (!token) {
      return {
        success: false,
        error: 'Bot Token is required',
        helpTip: 'Please provide a valid Bot Token from @BotFather',
      };
    }

    if (!targetChat) {
      return {
        success: false,
        error: 'Target Chat/Channel ID is required',
        helpTip: 'Provide a channel username like @MyChannel or numerical chat ID like -1001234567890',
      };
    }

    // 1. Try server endpoint first
    try {
      const serverRes = await fetch('/api/telegram/send-test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: token,
          channelId: targetChat,
          message,
        }),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.success) {
          return { success: true };
        }
      }
    } catch {
      // Continue to direct client fetch
    }

    // 2. Direct browser fetch to Telegram Bot API (sendMessage)
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      });

      const data = await res.json();

      if (data.ok && data.result) {
        return {
          success: true,
          messageId: data.result.message_id,
        };
      } else {
        const errorDesc = data.description || 'Failed to dispatch message';
        return {
          success: false,
          error: `Telegram Error: ${errorDesc}`,
          helpTip: getHelpfulTelegramTip(errorDesc),
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Network Error: ${err?.message || 'Could not connect to api.telegram.org'}`,
        helpTip: 'Ensure browser network access is open to api.telegram.org',
      };
    }
  }

  /**
   * Generates a beautifully formatted test alert message
   */
  static generateTestAlertMessage(channelId: string, botName?: string): string {
    const time = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    return `💎 <b>FlexxiPics — Vault Security Test Ping</b>

✅ <b>Node Gateway:</b> Active & Synchronized
📡 <b>Destination:</b> <code>${channelId}</code>
🤖 <b>Bot Agent:</b> ${botName ? `@${botName}` : 'FlexxiPics Sovereign Cloud Node'}
⏱ <b>Timestamp:</b> ${time}

🔒 <i>Your private client gallery is now linked. You will receive real-time notifications whenever clients unlock passcode-protected vaults, like photos, or download original assets.</i>`;
  }
}
