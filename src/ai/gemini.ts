import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from '../config/index.js';
import { AIClient, GenerateOptions, GenerateResponse } from './types.js';

/**
 * Google Gemini AI Client
 */
export class GeminiClient implements AIClient {
    private genAI: GoogleGenerativeAI;
    private defaultModelName: string;

    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.defaultModelName = config.gemini.model;
    }

    /**
     * Generate AI response
     */
    async generate(options: GenerateOptions): Promise<GenerateResponse> {
        try {
            const systemMessage = options.messages.find(m => m.role === 'system');

            // Filter out system message for chat history
            // And map roles to Gemini format (user/model)
            const chatHistory = options.messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            // Calculate max tokens (ensure it's valid)
            const maxTokens = options.maxTokens || 1000;

            // Get model with system instruction if present
            const modelConfig: any = {
                model: this.defaultModelName,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            };

            if (systemMessage) {
                modelConfig.systemInstruction = systemMessage.content;
            }

            const model = this.genAI.getGenerativeModel(modelConfig);

            // Pop the last message to send it as the current prompt
            const lastMessage = chatHistory.pop();

            if (!lastMessage) {
                return { success: false, response: '', error: 'No user message found' };
            }

            // Start chat with remaining history
            const chat = model.startChat({
                history: chatHistory,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: maxTokens,
                },
            });

            // Send the last message with retry logic
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    const result = await chat.sendMessage(lastMessage.parts[0].text);
                    const response = result.response.text();

                    return {
                        success: true,
                        response: response.trim(),
                    };
                } catch (error: any) {
                    if (error.status === 429 || error.message.includes('429')) {
                        console.warn(`⚠️ Gemini Rate Limit hit. Retrying in 2s... (${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                        retryCount++;
                        continue;
                    }
                    throw error;
                }
            }

            throw new Error('Max retries exceeded for Gemini API');

        } catch (error) {
            console.error('❌ Gemini API error:', error);
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
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const model = this.genAI.getGenerativeModel({ model: this.defaultModelName });
                const result = await model.generateContent('Hello, reply with just "OK"');
                const response = result.response.text();
                return response.length > 0;
            } catch (error: any) {
                if (error.status === 429 || error.message.includes('429')) {
                    console.warn(`⚠️ Gemini Connection Test Rate Limit. Retrying in 2s... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                    retryCount++;
                    continue;
                }
                console.error('❌ Connection test failed:', error);
                return false;
            }
        }
        return false;
    }
}
