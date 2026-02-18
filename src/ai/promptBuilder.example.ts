import { ChatMessage } from './types.js';
import { SearchResult } from '../knowledge/database.js';

export interface BuildPromptOptions {
    userMessage: string;
    context?: string;
    conversationHistory?: ChatMessage[];
}

/**
 * Build effective prompts for the AI model
 * INI ADALAH FILE CONTOH (EXAMPLE). 
 * Silakan copy file ini menjadi 'src/ai/promptBuilder.ts' dan sesuaikan dengan karakter bot Anda.
 */
export class PromptBuilder {
    private systemPrompt: string;

    constructor() {
        this.systemPrompt = this.buildSystemPrompt();
    }

    /**
     * Build the system prompt that defines bot personality
     */
    private buildSystemPrompt(): string {
        // GANTI DI SINI DENGAN KARAKTER BOT ANDA SENDIRI
        return `Kamu adalah [NAMA BOT]. Kamu sedang chatting dengan user.

PROFIL PRIBADI BOT:
- **Nama**: [Nama Bot]
- **Umur**: [Umur]
- **Hobi**: [Hobi]
- **Sifat**: [Sifat, misal: Ramah, Galak, Lucu]

GAYA BAHASA:
1.  Gunakan bahasa yang santai/formal sesuai keinginan.
2.  Jangan gunakan emoji berlebihan (opsional).

CONTOH RESPONS:
-   *Q: Apa kabar?* -> A: "Baik kok, kamu gimana?"
-   *Q: Lagi apa?* -> A: "Lagi nunggu chat dari kamu nih."

PERINGATAN:
-   Jawab singkat, padat, dan jelas.
-   Jangan halusinasi fakta yang tidak ada di profil.`;
    }

    /**
     * Build complete prompt with context
     */
    buildPrompt(options: BuildPromptOptions): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Add system prompt
        messages.push({
            role: 'system',
            content: this.systemPrompt,
        });

        // Add context if available (RAG / Knowledge Base)
        if (options.context && options.context.trim()) {
            messages.push({
                role: 'system',
                content: `FAKTA PENTING DARI RIWAYAT CHAT SEBELUMNYA:\n${options.context}\n\nINSTRUKSI: Gunakan info di atas sebagai ingatanmu.`,
            });
        }

        // Add conversation history if available
        if (options.conversationHistory && options.conversationHistory.length > 0) {
            messages.push(...options.conversationHistory);
        }

        // Add user message
        messages.push({
            role: 'user',
            content: options.userMessage,
        });

        return messages;
    }

    /**
     * Build prompt for when no context is available
     */
    buildNoContextPrompt(userMessage: string): ChatMessage[] {
        return [
            {
                role: 'system',
                content: this.systemPrompt,
            },
            {
                role: 'user',
                content: userMessage,
            },
        ];
    }

    /**
     * Format context from search results
     */
    formatContext(results: SearchResult[]): string {
        if (results.length === 0) return '';

        return results
            .map((result, index) => `- ${result.content}`)
            .join('\n');
    }

    /**
     * Update system prompt (for customization)
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
    }
}

export const promptBuilder = new PromptBuilder();
