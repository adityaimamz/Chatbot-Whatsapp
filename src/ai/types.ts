export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GenerateOptions {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
}

export interface GenerateResponse {
    success: boolean;
    response: string;
    error?: string;
}

export interface AIClient {
    generate(options: GenerateOptions): Promise<GenerateResponse>;
    testConnection(): Promise<boolean>;
}
