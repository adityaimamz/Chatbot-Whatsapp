import readline from 'readline';
import { responseGenerator } from '../bot/responseGenerator.js';
import { getDatabase } from '../knowledge/database.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('==========================================');
console.log('  AI Chat Response Tester');
console.log('  Type a message and press Enter to test.');
console.log('  Type "exit" to quit.');
console.log('==========================================\n');

async function askQuestion() {
    rl.question('You: ', async (message) => {
        if (message.toLowerCase() === 'exit') {
            console.log('Exiting...');
            rl.close();
            process.exit(0);
        }

        try {
            const db = getDatabase();
            if (db.getCount() === 0) {
                console.warn('[WARN] Database is empty. Import chat first for better results.');
            }

            process.stdout.write('[INFO] Generating response... ');

            const startTime = Date.now();
            const result = await responseGenerator.generate({
                message: message,
                useContext: true,
            });
            const duration = Date.now() - startTime;

            console.log(`(${duration}ms)`);

            if (result.success) {
                console.log(`\nBot: ${result.response}`);
                if (result.contextUsed) {
                    console.log(`\n[Context Used]`);
                }
            } else {
                console.error(`\n[ERROR] ${result.error}`);
            }

            console.log('\n==========================================\n');
        } catch (error) {
            console.error('\n[ERROR] Unexpected error:', error);
        }

        askQuestion();
    });
}

// Start the loop
askQuestion();
