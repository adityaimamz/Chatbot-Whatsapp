import fs from 'fs';
import { Message } from './database.js';

export interface ParsedChat {
    timestamp: string;
    sender: string;
    message: string;
}

/**
 * Parse WhatsApp chat export file
 * Format expected: [DD/MM/YYYY, HH:MM:SS] Sender: Message
 * or: DD/MM/YYYY, HH:MM - Sender: Message
 */
export class WhatsAppChatParser {
    private userNames: Set<string> = new Set();

    /**
     * Parse chat file and extract messages
     */
    parseChatFile(filePath: string): ParsedChat[] {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const messages: ParsedChat[] = [];
        let currentMessage: ParsedChat | null = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Check if this is a new message (starts with date/time)
            const match = this.parseMessageLine(line);

            if (match) {
                // Save previous message if exists
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                // Start new message
                currentMessage = match;
            } else if (currentMessage) {
                // This is a continuation of the previous message (multi-line)
                currentMessage.message += '\n' + line;
            }
        }

        // Don't forget the last message
        if (currentMessage) {
            messages.push(currentMessage);
        }

        return messages;
    }

    /**
     * Try to parse a message line
     * Supports multiple WhatsApp export formats
     */
    private parseMessageLine(line: string): ParsedChat | null {
        // Format 1: [DD/MM/YYYY, HH:MM:SS] Sender: Message
        const pattern1 = /^\[(\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2}:\d{2})\]\s([^:]+):\s(.*)$/;
        let match = line.match(pattern1);

        if (match) {
            return {
                timestamp: match[1],
                sender: match[2].trim(),
                message: match[3],
            };
        }

        // Format 2: DD/MM/YYYY, HH:MM - Sender: Message
        const pattern2 = /^(\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2})\s-\s([^:]+):\s(.*)$/;
        match = line.match(pattern2);

        if (match) {
            return {
                timestamp: match[1],
                sender: match[2].trim(),
                message: match[3],
            };
        }

        // Format 3: DD/MM/YY, HH:MM - Sender: Message
        const pattern3 = /^(\d{2}\/\d{2}\/\d{2},\s\d{2}:\d{2})\s-\s([^:]+):\s(.*)$/;
        match = line.match(pattern3);

        if (match) {
            return {
                timestamp: match[1],
                sender: match[2].trim(),
                message: match[3],
            };
        }

        // Format 4: DD/MM/YY HH.MM - Sender: Message (Indonesian format with dot)
        const pattern4 = /^(\d{2}\/\d{2}\/\d{2})\s(\d{2}\.\d{2})\s-\s([^:]+):\s(.*)$/;
        match = line.match(pattern4);

        if (match) {
            return {
                timestamp: `${match[1]}, ${match[2].replace('.', ':')}`, // Normalize to standard format
                sender: match[3].trim(),
                message: match[4],
            };
        }

        return null;
    }

    /**
     * Filter messages to only include those from specific user
     */
    filterByUser(messages: ParsedChat[], userName: string): ParsedChat[] {
        return messages.filter(msg =>
            msg.sender.toLowerCase() === userName.toLowerCase()
        );
    }

    /**
     * Convert parsed messages to database format
     */
    convertToKnowledge(messages: ParsedChat[], userName?: string): Omit<Message, 'id' | 'createdAt'>[] {
        return messages
            .filter(msg => {
                // Filter out system messages
                if (msg.message.includes('Messages and calls are end-to-end encrypted')) return false;
                if (msg.message.includes('created group')) return false;
                if (msg.message.includes('changed the subject')) return false;
                if (msg.message.includes('left')) return false;
                if (msg.message.includes('joined using')) return false;
                if (msg.message.includes('<Media omitted>')) return false;

                // Filter by user if specified
                if (userName && msg.sender.toLowerCase() !== userName.toLowerCase()) {
                    return false;
                }

                return true;
            })
            .map(msg => ({
                content: msg.message,
                context: `From chat with ${msg.sender} at ${msg.timestamp}`,
                category: 'whatsapp_chat',
            }));
    }

    /**
     * Get unique senders from messages
     */
    getUniqueSenders(messages: ParsedChat[]): string[] {
        const senders = new Set<string>();
        messages.forEach(msg => senders.add(msg.sender));
        return Array.from(senders).sort();
    }

    /**
     * Get statistics about the chat
     */
    getChatStats(messages: ParsedChat[]): {
        totalMessages: number;
        uniqueSenders: number;
        senders: { name: string; count: number }[];
    } {
        const senderCounts = new Map<string, number>();

        messages.forEach(msg => {
            senderCounts.set(msg.sender, (senderCounts.get(msg.sender) || 0) + 1);
        });

        const senders = Array.from(senderCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalMessages: messages.length,
            uniqueSenders: senderCounts.size,
            senders,
        };
    }
}

export const chatParser = new WhatsAppChatParser();
