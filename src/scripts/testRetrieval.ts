import { program } from 'commander';
import { knowledgeRetriever } from '../knowledge/retriever.js';
import { getDatabase } from '../knowledge/database.js';

program
    .name('test-retrieval')
    .description('Test knowledge retrieval for a given query')
    .argument('<query>', 'Query string to test')
    .option('-l, --limit <number>', 'Number of results to return', '5')
    .action(async (query, options) => {
        try {
            console.log(`[INFO] Testing retrieval for query: "${query}"`);

            const db = getDatabase();
            const totalDocs = db.getCount();
            console.log(`[INFO] Total documents in database: ${totalDocs}`);

            if (totalDocs === 0) {
                console.warn('[WARN] Database is empty. You need to import chat history first.');
                console.warn('Run: npm run import-chat knowledge/chat.txt -- --user "User Name"');
                return;
            }

            const limit = parseInt(options.limit);
            const result = knowledgeRetriever.retrieve(query, limit);

            if (result.success) {
                console.log(`[SUCCESS] Retrieval successful! Found ${result.sources.length} matches.`);

                if (result.sources.length > 0) {
                    console.log('\n--- Results ---');
                    result.sources.forEach((source, index) => {
                        console.log(`Result #${index + 1} (Relevance: ${source.relevance})`);
                        console.log(`Content: ${source.content}`);
                        console.log(`Context: ${source.context || 'N/A'}`);
                        console.log(`Category: ${source.category}`);
                        console.log('---');
                    });

                    console.log(`\n[INFO] Formatted Context:\n${result.context}`);
                } else {
                    console.log('[INFO] No matching knowledge found for this query.');
                }
            } else {
                console.error('[ERROR] Retrieval failed.');
            }

            db.close();
        } catch (error) {
            console.error('[ERROR] Retrieval failed:', error);
            process.exit(1);
        }
    });

program.parse();
