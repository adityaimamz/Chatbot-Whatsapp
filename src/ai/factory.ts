
import { config } from '../config/index.js';
import { AIClient } from './types.js';
import { openRouterClient } from './openrouter.js';
import { GeminiClient } from './gemini.js';

export class AIFactory {
    private static instance: AIClient;

    static getClient(): AIClient {
        if (!this.instance) {
            switch (config.aiProvider) {
                case 'gemini':
                    console.log('🤖 Using Google Gemini Provider');
                    this.instance = new GeminiClient();
                    break;
                case 'openrouter':
                default:
                    console.log('🤖 Using OpenRouter Provider');
                    this.instance = openRouterClient;
                    break;
            }
        }
        return this.instance;
    }
}

export const aiClient = AIFactory.getClient();
