#!/usr/bin/env node

// Simple WhatsApp Chatbot - JavaScript Version
// Untuk memastikan semua dependencies berfungsi sebelum pakai TypeScript

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import OpenAI from 'openai';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config();

// Config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';
const DB_PATH = './data/knowledge.db';

console.log('╔════════════════════════════════════════╗');
console.log('║  WhatsApp Chatbot  - Simple Version   ║');
console.log('╚════════════════════════════════════════╝\n');

// Initialize OpenRouter
const openai = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

// Initialize Database
const db = new Database(DB_PATH);
console.log('✅ Database connected');

// Initialize WhatsApp Client
const client = new Client({
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

// QR Code Event
client.on('qr', (qr) => {
    console.log('\n📱 Scan QR code ini dengan WhatsApp:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n👆 Scan QR code di atas dengan WhatsApp kamu\n');
});

// Ready Event
client.on('ready', () => {
    console.log('✅ WhatsApp client siap!\n');
    console.log('✨ Bot sedang berjalan! Menunggu pesan masuk...\n');
});

// Message Event
client.on('message_create', async (message) => {
    //  Ignore own messages and group messages
    if (message.fromMe || message.from.includes('@g.us')) return;

    // Ignore empty messages
    if (!message.body || !message.body.trim()) return;

    try {
        console.log(`\n📨 Pesan dari: ${message.from}`);
        console.log(`💬 Isi: ${message.body}`);

        // Search knowledge base
        const stmt = db.prepare(`
      SELECT content FROM knowledge_fts
      WHERE knowledge_fts MATCH ?
      ORDER BY rank
      LIMIT 3
    `);

        const results = stmt.all(message.body);
        let context = '';

        if (results.length > 0) {
            context = results.map((r, i) => `${i + 1}. ${r.content}`).join('\n');
            console.log(`📚 Found ${results.length} context(s)`);
        }

        // Generate AI response
        console.log('🤖 Generating AI response...');

        const completion = await openai.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: 'system',
                    content: `Kamu adalah Adit. Kamu balas chat dengan gaya yang SANGAT santai dan casual seperti chat WhatsApp biasa.

PENTING - Gaya bahasa kamu:
- Pakai singkatan: "aku" bukan "saya", "kmu" atau "kamu", "gak" atau "ga", "udh" atau "udah", "emg" atau "emang"
- Pakai emoji sesekali 😆🤣👍😭 tapi jangan berlebihan
- Singkat dan to the point, gak bertele-tele
- Lowercase semua (kecuali nama atau awal kalimat kalau perlu)
- Kadang typo santai kayak "wkwk", "kwkw", "njir", "anjir"
- Friendly dan humble
- Jangan terlalu formal atau panjang

${context ? 'Ini contoh cara kamu biasanya chat (TIRU GAYA INI):\n' + context + '\n\nSekarang balas dengan gaya yang mirip!' : 'Balas dengan gaya chat Adit yang santai!'}`
                },
                {
                    role: 'user',
                    content: message.body
                }
            ],
            temperature: 0.8,
            max_tokens: 150,
        });

        const response = completion.choices[0]?.message?.content || 'Maaf, saya tidak bisa membalas sekarang.';

        console.log(`✅ Response: ${response.substring(0, 100)}...`);

        // Reply
        await message.reply(response);
        console.log('✅ Balasan terkirim!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await message.reply('Maaf, ada error. Coba lagi nanti ya! 🙏');
    }
});

// Error handling
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️  Disconnected:', reason);
});

// Initialize
console.log('🚀  Starting WhatsApp client...\n');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await client.destroy();
    db.close();
    process.exit(0);
});
