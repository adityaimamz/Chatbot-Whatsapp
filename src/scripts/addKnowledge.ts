import { getDatabase } from '../knowledge/database.js';
import readline from 'readline';

/**
 * CLI tool to manage knowledge manually
 */

const db = getDatabase();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function addKnowledge() {
    console.log('\n--- Add New Knowledge ---\n');

    const content = await question('Message content: ');

    if (!content.trim()) {
        console.log('[ERROR] Content cannot be empty');
        return;
    }

    const context = await question('Context (optional): ');
    const category = await question('Category (default: manual): ');

    const id = db.insertMessage({
        content: content.trim(),
        context: context.trim() || undefined,
        category: category.trim() || 'manual',
    });

    console.log(`[SUCCESS] Knowledge added with ID: ${id}`);
}

async function listKnowledge() {
    const messages = db.getAllMessages();

    if (messages.length === 0) {
        console.log('\n[INFO] No knowledge found in database\n');
        return;
    }

    console.log(`\n--- Total Knowledge: ${messages.length} ---\n`);

    messages.slice(0, 20).forEach((msg) => {
        console.log(`ID: ${msg.id}`);
        console.log(`Content: ${msg.content}`);
        if (msg.context) console.log(`Context: ${msg.context}`);
        console.log(`Category: ${msg.category}`);
        console.log(`Created: ${msg.createdAt}`);
        console.log('---');
    });

    if (messages.length > 20) {
        console.log(`\n... and ${messages.length - 20} more entries`);
    }
}

async function deleteKnowledge() {
    const idStr = await question('\nEnter knowledge ID to delete: ');
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
        console.log('[ERROR] Invalid ID');
        return;
    }

    const deleted = db.deleteMessage(id);

    if (deleted) {
        console.log('[SUCCESS] Knowledge deleted');
    } else {
        console.log('[ERROR] Knowledge not found');
    }
}

async function searchKnowledge() {
    const query = await question('\nEnter search query: ');

    if (!query.trim()) {
        console.log('[ERROR] Query cannot be empty');
        return;
    }

    const results = db.search(query, 10);

    if (results.length === 0) {
        console.log('\n[INFO] No results found\n');
        return;
    }

    console.log(`\n--- Found ${results.length} results ---\n`);

    results.forEach((result, index) => {
        console.log(`${index + 1}. ID: ${result.id}`);
        console.log(`   Content: ${result.content}`);
        if (result.context) console.log(`   Context: ${result.context}`);
        console.log('---');
    });
}

async function showStats() {
    const count = db.getCount();
    console.log(`\n--- Knowledge Statistics ---`);
    console.log(`Total entries: ${count}\n`);
}

async function interactive() {
    console.log('\n=======================================');
    console.log('  WhatsApp Chatbot - Knowledge Manager');
    console.log('=======================================\n');

    while (true) {
        console.log('\nOptions:');
        console.log('1. Add knowledge');
        console.log('2. List knowledge');
        console.log('3. Search knowledge');
        console.log('4. Delete knowledge');
        console.log('5. Show statistics');
        console.log('6. Exit');

        const choice = await question('\nChoose an option (1-6): ');

        switch (choice) {
            case '1':
                await addKnowledge();
                break;
            case '2':
                await listKnowledge();
                break;
            case '3':
                await searchKnowledge();
                break;
            case '4':
                await deleteKnowledge();
                break;
            case '5':
                await showStats();
                break;
            case '6':
                console.log('\nGoodbye!');
                rl.close();
                db.close();
                process.exit(0);
            default:
                console.log('[ERROR] Invalid option');
        }
    }
}

// Run interactive mode
interactive();
