import { bot } from './bot/index.js';
import { config } from './config/index.js';
import { aiClient } from './ai/factory.js';

/**
 * Main entry point
 */
async function main() {
    console.log('──────────────────────────────────────────');
    console.log('  🤖 WhatsApp Chatbot with AI Knowledge');
    console.log('     powered by OpenRouter & Gemini');
    console.log('──────────────────────────────────────────\n');

    try {
        // Test AI connection
        console.log(`🔌 Testing AI connection (${config.aiProvider})...`);

        const apiWorking = await aiClient.testConnection();
        if (!apiWorking) {
            console.error('❌ AI API test failed!');
            console.error(`Please check your ${config.aiProvider.toUpperCase()}_API_KEY in .env file`);
            process.exit(1);
        }

        console.log(`✅ ${config.aiProvider.toUpperCase()} API key configured`);
        const modelName = config.aiProvider === 'gemini' ? config.gemini.model : config.openrouter.model;
        console.log(`📦 Using model: ${modelName}\n`);

        // Initialize bot
        await bot.initialize();

        // Show stats
        const stats = bot.getStats();
        console.log('\n📊 Bot Statistics:');
        console.log(`Knowledge entries: ${stats.knowledgeCount}`);
        console.log(`Status: ${stats.isReady ? '🟢 Ready' : '🟡 Initializing...'}`);
        console.log('\n✨ Bot is running! Waiting for messages...\n');

        // Handle graceful shutdown
        const shutdownHandler = async (signal: string) => {
            console.log(`\n\n⚠️  Received ${signal}. Shutting down gracefully...`);

            try {
                await bot.shutdown();
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdownHandler('SIGINT'));
        process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    } catch (error) {
        console.error('❌ Fatal error:');
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

// Run the bot
main();
