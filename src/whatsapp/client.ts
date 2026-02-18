// @ts-ignore - whatsapp-web.js has ES module issues
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { config } from '../config/index.js';

// Type imports
type Message = any; // Use any for now to avoid type issues

export type MessageHandler = (message: Message) => Promise<void>;

/**
 * WhatsApp Client Manager
 */
export class WhatsAppClient {
    private client: any;
    private messageHandler?: MessageHandler;
    private isReady = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'whatsapp-chatbot',
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ],
            },
        });

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // QR Code event
        this.client.on('qr', (qr: string) => {
            console.log('📱 Scan QR code ini dengan WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('\n👆 Scan QR code di atas dengan WhatsApp kamu');
        });

        // Ready event
        this.client.on('ready', () => {
            console.log('✅ WhatsApp client siap!');
            this.isReady = true;
        });

        // Authenticated event
        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp authenticated');
        });

        // Authentication failure event
        this.client.on('auth_failure', (msg: string) => {
            console.error('❌ Authentication failed:', msg);
        });

        // Disconnected event
        this.client.on('disconnected', (reason: string) => {
            console.log('⚠️  WhatsApp disconnected:', reason);
            this.isReady = false;
        });

        // Message event
        this.client.on('message_create', async (message: Message) => {
            if (this.messageHandler && this.shouldProcessMessage(message)) {
                try {
                    await this.messageHandler(message);
                } catch (error) {
                    console.error('❌ Error handling message:', error);
                }
            }
        });
    }

    /**
     * Check if message should be processed
     */
    private shouldProcessMessage(message: Message): boolean {
        // Ignore if bot is disabled
        if (!config.bot.enabled) return false;

        // Ignore own messages
        if (message.fromMe) return false;

        // Ignore group messages (optional - you can change this)
        if (message.from.includes('@g.us')) return false;

        // Check if from allowed numbers (if configured)
        if (config.whatsapp.allowedNumbers.length > 0) {
            const fromNumber = message.from.replace('@c.us', '');
            if (!config.whatsapp.allowedNumbers.includes(fromNumber)) {
                return false;
            }
        }

        // Ignore empty messages
        if (!message.body || !message.body.trim()) return false;

        return true;
    }

    /**
     * Initialize and start the client
     */
    async initialize(): Promise<void> {
        try {
            console.log('🚀 Menginisialisasi WhatsApp client...');
            console.log('⏳ Tunggu beberapa saat...');

            await this.client.initialize();
        } catch (error) {
            console.error('❌ Error initializing WhatsApp client:');
            if (error instanceof Error) {
                console.error('Message:', error.message);
                console.error('Stack:', error.stack);
            } else {
                console.error(error);
            }
            throw error;
        }
    }

    /**
     * Set message handler
     */
    onMessage(handler: MessageHandler): void {
        this.messageHandler = handler;
    }

    /**
     * Send a message
     */
    async sendMessage(chatId: string, message: string): Promise<void> {
        if (!this.isReady) {
            throw new Error('WhatsApp client is not ready');
        }

        await this.client.sendMessage(chatId, message);
    }

    /**
     * Reply to a message
     */
    async replyToMessage(message: Message, reply: string): Promise<void> {
        await message.reply(reply);
    }

    /**
     * Get client info
     */
    async getInfo(): Promise<any> {
        if (!this.isReady) {
            return null;
        }

        return await this.client.info;
    }

    /**
     * Check if client is ready
     */
    getIsReady(): boolean {
        return this.isReady;
    }

    /**
     * Destroy the client
     */
    async destroy(): Promise<void> {
        console.log('🛑 Menghentikan WhatsApp client...');
        await this.client.destroy();
        this.isReady = false;
    }
}

export const whatsappClient = new WhatsAppClient();
