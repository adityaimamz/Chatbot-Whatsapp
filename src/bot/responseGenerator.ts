import { Message } from 'whatsapp-web.js';
import { knowledgeRetriever } from '../knowledge/retriever.js';
import { promptBuilder } from '../ai/promptBuilder.js';
import { aiClient } from '../ai/factory.js';
import { config } from '../config/index.js';

export interface GenerateResponseOptions {
    message: string;
    useContext?: boolean;
    conversationHistory?: any[]; // ChatMessage[]
}

export interface ResponseResult {
    success: boolean;
    response: string;
    error?: string;
    contextUsed: boolean;
}

/**
 * Response Generator
 * Orchestrates the entire process of generating a response
 */
export class ResponseGenerator {
    /**
     * Generate response for a message
     */
    async generate(options: GenerateResponseOptions): Promise<ResponseResult> {
        try {
            const { message, useContext = true } = options;

            // Step 1: Retrieve relevant context
            let contextString = '';
            let contextUsed = false;

            if (useContext) {
                const retrieval = knowledgeRetriever.retrieve(message, 5);

                if (retrieval.success && retrieval.sources.length > 0) {
                    contextString = retrieval.context;
                    contextUsed = true;
                    console.log(`📚 Found ${retrieval.sources.length} relevant context(s)`);
                }
            }

            // Step 2: Build prompt
            const messages = promptBuilder.buildPrompt({
                userMessage: message,
                context: contextString,
                conversationHistory: options.conversationHistory,
            });

            // Step 3: Generate AI response
            console.log('🤖 Generating AI response...');
            const aiResponse = await aiClient.generate({
                messages,
                temperature: 0.7, // Lower temperature slightly for reasoning models
                maxTokens: 1000,  // Reasoning models need more tokens for Chain of Thought
            });

            if (!aiResponse.success) {
                return {
                    success: false,
                    response: '',
                    error: aiResponse.error,
                    contextUsed,
                };
            }

            // Cleanup response (remove citations like [1], [2], etc.)
            let cleanResponse = aiResponse.response
                .replace(/\[\d+\]/g, '')  // Remove [1], [2]
                .replace(/\s+([,.!?])/g, '$1') // Fix spacing before punctuation
                .trim();

            return {
                success: true,
                response: cleanResponse,
                contextUsed,
            };
        } catch (error) {
            console.error('❌ Error generating response:', error);

            return {
                success: false,
                response: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                contextUsed: false,
            };
        }
    }

    /**
     * Generate response with typing simulation
     */
    async generateWithDelay(options: GenerateResponseOptions): Promise<ResponseResult> {
        // Add random delay to make it more natural
        const delay = Math.random() *
            (config.bot.replyDelayMax - config.bot.replyDelayMin) +
            config.bot.replyDelayMin;

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.generate(options);
    }
}

export const responseGenerator = new ResponseGenerator();
