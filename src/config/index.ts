import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const provider = process.env.AI_PROVIDER || 'openrouter';
if (provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY environment variable');
}
if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
}

export const config = {
    // AI Provider
    aiProvider: (process.env.AI_PROVIDER || 'openrouter') as 'openrouter' | 'gemini',

    // OpenRouter Configuration
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
        baseURL: 'https://openrouter.ai/api/v1',
    },

    // Google Gemini Configuration
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },

    // Bot Configuration
    bot: {
        name: process.env.BOT_NAME || 'Personal Assistant',
        enabled: process.env.BOT_ENABLED !== 'false',
        replyDelayMin: parseInt(process.env.REPLY_DELAY_MIN || '1000', 10),
        replyDelayMax: parseInt(process.env.REPLY_DELAY_MAX || '3000', 10),
    },

    // Database Configuration
    database: {
        path: process.env.DB_PATH || path.join(process.cwd(), 'data', 'knowledge.db'),
    },

    // WhatsApp Settings
    whatsapp: {
        allowedNumbers: process.env.ALLOWED_NUMBERS
            ? process.env.ALLOWED_NUMBERS.split(',').map(n => n.trim())
            : [],
    },

    // Paths
    paths: {
        root: process.cwd(),
        data: path.join(process.cwd(), 'data'),
        logs: path.join(process.cwd(), 'logs'),
    },
} as const;

export default config;
