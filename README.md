# YouTube Summarizer

AI-powered YouTube video summarizer running entirely in your browser using WebLLM.

## Features

- 🤖 Runs local AI (Llama 3.1) in your browser
- 🔒 Privacy-first - no data leaves your device
- ⚡ No installation required
- 🎨 Modern dark UI

## Tech Stack

- Next.js 15
- Tailwind CSS
- @mlc-ai/web-llm

## Development

```bash
pnpm install
pnpm dev
```

## Deploy

```bash
vercel --prod
```

## How It Works

1. User pastes YouTube URL
2. AI model loads in browser (WebGPU)
3. Summary generated locally using Llama 3.1
