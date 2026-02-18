import { program } from 'commander';
import fs from 'fs';
import { chatParser } from '../knowledge/parser.js';
import { getDatabase } from '../knowledge/database.js';

/**
 * CLI tool to import WhatsApp chat history
 */
program
    .name('import-chat')
    .description('Import WhatsApp chat export file to knowledge base')
    .argument('<file>', 'Path to WhatsApp chat export file (.txt)')
    .option('-u, --user <name>', 'Only import messages from specific user')
    .option('-c, --clear', 'Clear existing knowledge before import')
    .action(async (file: string, options: { user?: string; clear?: boolean }) => {
        try {
            console.log(`[INFO] Importing chat from: ${file}`);

            // Check if file exists
            if (!fs.existsSync(file)) {
                console.error(`[ERROR] File not found: ${file}`);
                process.exit(1);
            }

            const db = getDatabase();

            // Clear database if requested
            if (options.clear) {
                console.log('[INFO] Clearing existing knowledge...');
                db.clearAll();
            }

            // Parse chat file
            console.log('[INFO] Parsing chat file...');
            const messages = chatParser.parseChatFile(file);
            console.log(`[SUCCESS] Found ${messages.length} messages`);

            // Get statistics
            const stats = chatParser.getChatStats(messages);
            console.log('\n--- Chat Statistics ---');
            console.log(`Total messages: ${stats.totalMessages}`);
            console.log(`Unique senders: ${stats.uniqueSenders}`);
            console.log('Message count by sender:');
            stats.senders.forEach((sender) => {
                console.log(`  - ${sender.name}: ${sender.count} messages`);
            });
            console.log('-----------------------\n');

            // Ask user to confirm if no --user specified
            let userName = options.user;

            if (!userName && stats.uniqueSenders > 1) {
                console.log('[WARN] Multiple senders found.');
                console.log('Please specify which user to import using --user option.');
                console.log('Example: npm run import-chat chat.txt --user "Your Name"');
                console.log('\nAvailable users:');
                stats.senders.forEach((sender) => {
                    console.log(`  - ${sender.name}`);
                });
                process.exit(0);
            }

            // Convert to knowledge format
            console.log('[INFO] Converting to knowledge format...');
            const knowledge = chatParser.convertToKnowledge(messages, userName);
            console.log(`[SUCCESS] Prepared ${knowledge.length} knowledge entries`);

            if (knowledge.length === 0) {
                console.log('[WARN] No valid messages to import.');
                process.exit(0);
            }

            // Insert to database
            console.log('[INFO] Saving to database...');
            const inserted = db.insertMessages(knowledge);
            console.log(`[SUCCESS] Successfully imported ${inserted} messages!`);

            const totalKnowledge = db.getCount();
            console.log(`[INFO] Total knowledge in database: ${totalKnowledge}`);

            db.close();
        } catch (error) {
            console.error('[ERROR] Import failed:', error);
            process.exit(1);
        }
    });

program.parse();
