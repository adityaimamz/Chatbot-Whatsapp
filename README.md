# 🤖 WhatsApp AI Chatbot with RAG

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Node](https://img.shields.io/badge/Node.js-18%2B-green)

A smart WhatsApp chatbot that **learns from your chat history** using RAG (Retrieval-Augmented Generation). It mimics your personality and style using advanced AI models (OpenRouter/Gemini), completely for free.

## ✨ Key Features

- 🧠 **Personalized AI**: Learns your speaking style from exported WhatsApp chats.
- 🔍 **RAG System**: Context-aware responses based on your historical conversations.
- ⚡ **Multi-Provider**: Supports **OpenRouter** (DeepSeek, Llama, Mistral) and **Google Gemini**.
- 💬 **Auto-Reply**: Automatically handles chats while you're away.
- 🛡️ **Privacy Focused**: Runs locally, data stored in SQLite.
- 🐳 **Easy Setup**: Simple command-line tools to manage knowledge base.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed.
- A WhatsApp account (linked via QR code).
- API Key from [OpenRouter](https://openrouter.ai/keys) or [Google AI Studio](https://aistudio.google.com/).

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/whatsapp-chatbot-rag.git
cd whatsapp-chatbot-rag

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Configuration

Edit `.env` file with your details:

```env
# Choose AI Provider: "openrouter" or "gemini"
AI_PROVIDER=openrouter

# Add your API Key
OPENROUTER_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Bot Settings
BOT_NAME=My AI Clone
ALLOWED_NUMBERS=628123456789,628987654321
```

### 4. Import Data (The "Training")

To make the bot sound like you, import your WhatsApp chat history:

1.  **Export Chat**: In WhatsApp > Contact Info > Export Chat > Without Media.
2.  **Run Import**:
    ```bash
    npm run import-chat path/to/_chat.txt -- --user "Your Name"
    ```

### 5. Run the Bot

```bash
npm run dev
```

Scan the QR code with WhatsApp (Linked Devices), and your bot is live!

## 🛠️ Development & Tools

### CLI Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the bot in development mode |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run import-chat` | Import chat logs to knowledge base |
| `npm run add-knowledge` | Manually add/edit/delete knowledge entries |
| `npm run test:chat` | Test AI responses interactively without WhatsApp |

### 🎭 Customizing Personality

To give your bot a unique personality, you need to configure the `PromptBuilder`.

1.  **Create your configuration**:
    Copy the example file `src/ai/promptBuilder.example.ts` to `src/ai/promptBuilder.ts`.
    *(Note: `src/ai/promptBuilder.ts` is git-ignored so your custom prompts remain private)*

    ```bash
    cp src/ai/promptBuilder.example.ts src/ai/promptBuilder.ts
    # Or on Windows Command Prompt:
    # copy src\ai\promptBuilder.example.ts src\ai\promptBuilder.ts
    ```

2.  **Edit `src/ai/promptBuilder.ts`**:
    Open the file and modify the `buildSystemPrompt()` method. This is where you define the bot's name, hobbies, writing style, and rules.

    ```typescript
    // Example inside src/ai/promptBuilder.ts
    private buildSystemPrompt(): string {
        return `Kamu adalah [BOT_NAME].
        
        KARAKTER:
        - Ramah, lucu, dan suka membantu.
        - Menggunakan bahasa gaul/santai.
        
        INSTRUKSI:
        - Jawab pertanyaan dengan singkat.
        - Jangan terlalu formal.`;
    }
    ```

## 📂 Project Structure

```
src/
├── ai/                 # AI service integration (OpenRouter, Gemini)
├── bot/                # Core bot logic & message handling
├── config/             # Environment configuration
├── knowledge/          # RAG system (SQLite + Vector search logic)
├── scripts/            # CLI utilities for data management
├── whatsapp/           # WhatsApp Web client wrapper
└── index.ts            # Application entry point
```

## ⚠️ Disclaimer

This project uses [whatsapp-web.js](https://wwebjs.dev/), which is not an official WhatsApp API. Using automated software on WhatsApp accounts may violate their Terms of Service. Use at your own risk.

## 📄 License

MIT © [Your Name]
