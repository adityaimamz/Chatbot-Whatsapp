import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

export interface Message {
    id?: number;
    content: string;
    context?: string;
    category?: string;
    createdAt?: string;
}

export interface SearchResult extends Message {
    relevance: number;
}

class KnowledgeDatabase {
    private db: Database.Database;

    constructor() {
        // Ensure data directory exists
        const dataDir = path.dirname(config.database.path);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new Database(config.database.path);
        this.initialize();
    }

    private initialize() {
        // Create knowledge table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        context TEXT,
        category TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create index for faster search
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_content 
      ON knowledge(content);
    `);

        // Create FTS virtual table for full-text search
        this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts 
      USING fts5(content, context, category, content=knowledge, content_rowid=id);
    `);

        // Create triggers to keep FTS table in sync
        this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge BEGIN
        INSERT INTO knowledge_fts(rowid, content, context, category)
        VALUES (new.id, new.content, new.context, new.category);
      END;
    `);

        this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge BEGIN
        DELETE FROM knowledge_fts WHERE rowid = old.id;
      END;
    `);

        this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge BEGIN
        UPDATE knowledge_fts 
        SET content = new.content, context = new.context, category = new.category
        WHERE rowid = new.id;
      END;
    `);

        console.log('✅ Database initialized successfully');
    }

    // Insert a new message to knowledge base
    insertMessage(message: Omit<Message, 'id' | 'createdAt'>): number {
        const stmt = this.db.prepare(`
      INSERT INTO knowledge (content, context, category)
      VALUES (?, ?, ?)
    `);

        const result = stmt.run(
            message.content,
            message.context || null,
            message.category || 'general'
        );

        return result.lastInsertRowid as number;
    }

    // Batch insert messages
    insertMessages(messages: Omit<Message, 'id' | 'createdAt'>[]): number {
        const insert = this.db.prepare(`
      INSERT INTO knowledge (content, context, category)
      VALUES (?, ?, ?)
    `);

        const insertMany = this.db.transaction((msgs: typeof messages) => {
            for (const msg of msgs) {
                insert.run(msg.content, msg.context || null, msg.category || 'general');
            }
        });

        insertMany(messages);
        return messages.length;
    }

    // Search for relevant messages using full-text search
    search(query: string, limit: number = 5): SearchResult[] {
        const stmt = this.db.prepare(`
      SELECT 
        k.id,
        k.content,
        k.context,
        k.category,
        k.created_at as createdAt,
        knowledge_fts.rank as relevance
      FROM knowledge_fts
      JOIN knowledge k ON knowledge_fts.rowid = k.id
      WHERE knowledge_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);

        return stmt.all(query, limit) as SearchResult[];
    }

    // Get all messages
    getAllMessages(): Message[] {
        const stmt = this.db.prepare(`
      SELECT id, content, context, category, created_at as createdAt
      FROM knowledge
      ORDER BY created_at DESC
    `);

        return stmt.all() as Message[];
    }

    // Delete a message
    deleteMessage(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM knowledge WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Get total count
    getCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM knowledge');
        const result = stmt.get() as { count: number };
        return result.count;
    }

    // Clear all knowledge
    clearAll(): void {
        this.db.exec('DELETE FROM knowledge');
        console.log('🗑️  All knowledge cleared');
    }

    // Close database connection
    close(): void {
        this.db.close();
    }
}

// Singleton instance
let dbInstance: KnowledgeDatabase | null = null;

export function getDatabase(): KnowledgeDatabase {
    if (!dbInstance) {
        dbInstance = new KnowledgeDatabase();
    }
    return dbInstance;
}

export { KnowledgeDatabase };
