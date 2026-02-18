import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

console.log('Testing WhatsApp Web.js initialization...');

try {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'test-bot',
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        },
    });

    client.on('qr', (qr) => {
        console.log('✅ QR Code generated successfully!');
        console.log('QR:', qr.substring(0, 50) + '...');
    });

    client.on('ready', () => {
        console.log('✅ Client is ready!');
        process.exit(0);
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Auth failure:', msg);
        process.exit(1);
    });

    console.log('Initializing client...');
    await client.initialize();
} catch (error) {
    console.error('❌ Error:');
    console.error(error);
    process.exit(1);
}
