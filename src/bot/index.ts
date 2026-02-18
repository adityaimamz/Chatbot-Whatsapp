type Message = any; // Use any to avoid whatsapp-web.js type issues
import { whatsappClient } from '../whatsapp/client.js';
import { responseGenerator } from './responseGenerator.js';
import { getDatabase } from '../knowledge/database.js';
import { memoryManager } from '../memory/memoryManager.js';

/**
 * Main Bot Logic
 */
export class Bot {
    private db = getDatabase();

    /**
     * Initialize the bot
     */
    async initialize(): Promise<void> {
        try {
            console.log('🤖 Initializing bot...');

            // Setup message handler
            whatsappClient.onMessage(async (message) => {
                await this.handleMessage(message);
            });

            // Initialize WhatsApp client
            await whatsappClient.initialize();

            console.log('✅ Bot initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing bot:');
            if (error instanceof Error) {
                console.error('Message:', error.message);
                console.error('Stack:', error.stack);
            } else {
                console.error(error);
            }
            throw error;
        }
    }
    private async handleMessage(message: Message): Promise<void> {
        try {
            const userMessage = message.body.trim();
            const chatId = message.from;

            console.log('\n📨 New message received:');
            console.log(`From: ${chatId}`);
            console.log(`Message: ${userMessage}`);

            // Show typing indicator
            const chat = await message.getChat();
            await chat.sendStateTyping();

            // 1. Get conversation history (before adding current message to avoid duplication)
            const history = memoryManager.getHistory(chatId);

            // Generate response
            const result = await responseGenerator.generateWithDelay({
                message: userMessage,
                useContext: true,
                conversationHistory: history, // properly excludes current message
            });

            // 2. Add conversation to memory
            memoryManager.addMessage(chatId, 'user', userMessage);

            if (!result.success) {
                console.error('❌ Failed to generate response:', result.error);

                // Send error message to user
                await whatsappClient.replyToMessage(
                    message,
                    'Maaf, ada masalah saat memproses pesanmu. Coba lagi nanti ya! 🙏'
                );
                return;
            }

            // 3. Add bot response to memory
            memoryManager.addMessage(chatId, 'assistant', result.response);

            // Send response
            console.log('💬 Sending response...');
            console.log(`Response: ${result.response}`);
            console.log(`Context used: ${result.contextUsed ? 'Yes' : 'No'}`);

            await whatsappClient.replyToMessage(message, result.response);

            console.log('✅ Response sent successfully\n');
        } catch (error) {
            console.error('❌ Error handling message:', error);

            try {
                await whatsappClient.replyToMessage(
                    message,
                    'Maaf, ada error yang tidak terduga. 😅'
                );
            } catch (replyError) {
                console.error('❌ Failed to send error message:', replyError);
            }
        }
    }

    /**
     * Get bot statistics
     */
    getStats(): {
        knowledgeCount: number;
        isReady: boolean;
    } {
        return {
            knowledgeCount: this.db.getCount(),
            isReady: whatsappClient.getIsReady(),
        };
    }

    /**
     * Shutdown the bot
     */
    async shutdown(): Promise<void> {
        console.log('🛑 Shutting down bot...');

        await whatsappClient.destroy();
        this.db.close();

        console.log('✅ Bot shutdown complete');
    }
}

export const bot = new Bot();
