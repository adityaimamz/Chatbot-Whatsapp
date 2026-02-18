import { getDatabase, SearchResult } from './database.js';

export interface RetrievalResult {
    success: boolean;
    context: string;
    sources: SearchResult[];
}

/**
 * Retrieve relevant context from knowledge base
 */
export class KnowledgeRetriever {
    private db = getDatabase();

    /**
     * Retrieve relevant context for a query
     */
    retrieve(query: string, limit: number = 5): RetrievalResult {
        try {
            // Extract and sanitize keywords to prevent SQL errors and improve search
            const keywords = this.extractKeywords(query);

            if (keywords.length === 0) {
                return {
                    success: true,
                    context: '',
                    sources: [],
                };
            }

            // Use OR for better recall (matches any of the keywords)
            // The FTS5 rank will ensure the most relevant results come first
            const searchQuery = keywords.join(' OR ');

            // Search in knowledge base
            const results = this.db.search(searchQuery, limit);

            if (results.length === 0) {
                return {
                    success: true,
                    context: '',
                    sources: [],
                };
            }

            // Format context
            const context = this.formatContext(results);

            return {
                success: true,
                context,
                sources: results,
            };
        } catch (error) {
            console.error('❌ Error retrieving context:', error);
            // Return empty context on error rather than failing
            return {
                success: false,
                context: '',
                sources: [],
            };
        }
    }

    /**
     * Format search results into a context string
     */
    private formatContext(results: SearchResult[]): string {
        if (results.length === 0) return '';

        const contextParts = results.map((result, index) => {
            // Extract sender from context string (e.g. "From chat with Adit at...")
            let sender = 'Unknown';
            if (result.context) {
                const match = result.context.match(/From chat with (.+?) at/);
                if (match) {
                    sender = match[1];
                }
            }
            return `[${index + 1}] (${sender}): ${result.content}`;
        });

        return contextParts.join('\n\n');
    }

    /**
     * Get similar messages based on keyword matching
     */
    getSimilarMessages(message: string, limit: number = 3): SearchResult[] {
        // Extract keywords from message (simple approach)
        const keywords = this.extractKeywords(message);

        if (keywords.length === 0) {
            return [];
        }

        // Search with keywords
        const query = keywords.join(' OR ');
        return this.db.search(query, limit);
    }

    /**
     * Extract keywords from message
     * This is a simple implementation - can be improved with NLP
     */
    private extractKeywords(message: string): string[] {
        // Remove common words (stopwords in Indonesian and English)
        const stopwords = new Set([
            'yang', 'dan', 'di', 'dari', 'untuk', 'ke', 'ini', 'itu', 'dengan', 'pada',
            'adalah', 'atau', 'juga', 'akan', 'sudah', 'tidak', 'ada', 'bisa', 'saya',
            'kamu', 'aku', 'dia', 'mereka', 'kami', 'kita',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should',
        ]);

        // Clean and split message
        const words = message
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word =>
                word.length > 1 &&
                !stopwords.has(word) &&
                !/^\d+$/.test(word) // remove numbers
            );

        // Get unique words
        return Array.from(new Set(words));
    }

    /**
     * Get random examples from knowledge base
     * Useful for showing bot's personality
     */
    getRandomExamples(count: number = 3): SearchResult[] {
        const total = this.db.getCount();

        if (total === 0) return [];

        const examples: SearchResult[] = [];
        const usedIds = new Set<number>();

        for (let i = 0; i < count && i < total; i++) {
            let randomId: number;
            do {
                randomId = Math.floor(Math.random() * total) + 1;
            } while (usedIds.has(randomId));

            usedIds.add(randomId);
        }

        return examples;
    }
}

export const knowledgeRetriever = new KnowledgeRetriever();
