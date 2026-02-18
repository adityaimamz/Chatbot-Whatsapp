import OpenAI from 'openai';
import { config } from '../config/index.js';
import { AIClient, GenerateOptions, GenerateResponse } from './types.js';

/**
 * OpenRouter AI Client
 */
export class OpenRouterClient implements AIClient {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: config.openrouter.apiKey,
            baseURL: config.openrouter.baseURL,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/whatsapp-chatbot',
                'X-Title': 'WhatsApp Chatbot',
            },
        });
    }

    /**
     * Generate AI response
     */
    async generate(options: GenerateOptions): Promise<GenerateResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                model: config.openrouter.model,
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 500,
            });

            // DEBUG: Log the full response from OpenRouter
            console.log('🔍 OpenRouter Raw Response:', JSON.stringify(completion, null, 2));

            const response = completion.choices[0]?.message?.content;

            if (!response) {
                console.error('❌ Empty response content from AI');
                return {
                    success: false,
                    response: '',
                    error: 'No response from AI',
                };
            }

            return {
                success: true,
                response: response.trim(),
            };
        } catch (error) {
            console.error('❌ OpenRouter API error:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            return {
                success: false,
                response: '',
                error: errorMessage,
            };
        }
    }

    /**
     * Test API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const result = await this.generate({
                messages: [
                    { role: 'user', content: 'Hello, reply with just "OK" if you can read this.' },
                ],
                maxTokens: 10,
            });

            return result.success;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }
}

export const openRouterClient = new OpenRouterClient();
