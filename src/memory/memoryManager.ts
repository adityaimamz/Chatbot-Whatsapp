
import { ChatMessage } from '../ai/types.js';

export class MemoryManager {
    private history: Map<string, ChatMessage[]> = new Map();
    private readonly MAX_HISTORY = 20;

    /**
     * Add a message to the chat history
     */
    addMessage(chatId: string, role: 'user' | 'assistant', content: string): void {
        if (!this.history.has(chatId)) {
            this.history.set(chatId, []);
        }

        const chatHistory = this.history.get(chatId)!;

        chatHistory.push({ role, content });

        // specific rule: if history length exceeds limit, remove oldest messages
        // but keep the prompt/system message if we were storing it (we aren't here)
        if (chatHistory.length > this.MAX_HISTORY) {
            this.history.set(chatId, chatHistory.slice(-this.MAX_HISTORY));
        }
    }

    /**
     * Get conversation history for a chat
     */
    getHistory(chatId: string): ChatMessage[] {
        return this.history.get(chatId) || [];
    }

    /**
     * Clear history for a chat
     */
    clearHistory(chatId: string): void {
        this.history.delete(chatId);
    }
}

export const memoryManager = new MemoryManager();
