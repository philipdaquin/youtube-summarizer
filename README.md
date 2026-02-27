# YouTube Summarizer

AI-powered YouTube video summarizer using local LLMs.

## Setup

```bash
npm install
npm run dev
```

## Local LLM Setup (Optional)

To enable local LLM summarization:

1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Run: `ollama serve`
3. Pull a model: `ollama pull llama2`

## Deploy

```bash
vercel --prod
```
