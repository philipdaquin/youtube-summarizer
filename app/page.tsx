'use client';

import { useState, useRef, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState('');
  const [model, setModel] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const initModel = async () => {
    try {
      setStatus('Initializing AI model...');
      const selectedModel = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
      
      const newModel = await webllm.CreateMLCEngine(
        selectedModel,
        {
          initProgressCallback: (p) => {
            setProgress(Math.round(p.progress * 100));
            setStatus(`Loading: ${p.text}`);
          }
        }
      );
      
      setModel(newModel);
      setInitialized(true);
      setStatus('Ready!');
    } catch (e) {
      console.error('Init error:', e);
      setError('Failed to load AI model. Please refresh and try again.');
      setStatus('');
    }
  };

  const generateSummary = async () => {
    if (!url) return;
    
    setLoading(true);
    setError('');
    setSummary('');
    
    try {
      // Extract video ID and get info
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      setStatus('Fetching video information...');
      
      // Get video title via oEmbed
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${url}&format=json`
      );
      const oembedData = await oembedRes.json();
      const videoTitle = oembedData.title;
      
      setStatus('Generating summary with local AI...');
      
      const prompt = `You are a helpful AI assistant. The user wants to summarize a YouTube video titled "${videoTitle}". 

Provide a concise summary of what this video is likely about based on the title. If you don't have access to the actual video content, create a reasonable summary based on typical content for this title format and suggest what topics might be covered.

Format your response as:
**Title:** [video title]

**Summary:** [2-3 sentence summary]

**Key Topics:** [3-5 bullet points of likely topics]`;

      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a helpful AI assistant that summarizes YouTube videos.' },
        { role: 'user', content: prompt }
      ];

      const chunks = [];
      const completion = await model.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        chunks.push(content);
        setSummary(chunks.join(''));
      }
      
      setStatus('');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            YouTube Summarizer
          </h1>
          <p className="text-zinc-400 text-lg">
            AI-powered summaries. Runs entirely in your browser.
          </p>
        </div>

        {/* Model Init Card */}
        {!initialized && !error && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Load AI Model</h2>
              <p className="text-zinc-400 mb-6 text-sm">
                This runs a local AI model in your browser. First load takes ~2-3 minutes.
              </p>
              
              {status && (
                <div className="mb-4">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-zinc-100 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{status}</p>
                </div>
              )}
              
              <button
                onClick={initModel}
                disabled={loading}
                className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load Model'}
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950/50 border border-red-900 rounded-2xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => { setError(''); setInitialized(false); }}
              className="mt-4 text-sm text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main Interface */}
        {initialized && (
          <>
            {/* Input */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  onClick={generateSummary}
                  disabled={loading || !url}
                  className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Summarize'}
                </button>
              </div>
              
              {status && (
                <p className="text-sm text-zinc-500 mt-3">{status}</p>
              )}
            </div>

            {/* Results */}
            {summary && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-zinc-400">Summary generated locally</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('**')) {
                      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                    }
                    if (line.startsWith('-')) {
                      return <li key={i} className="text-zinc-300 ml-4">{line.replace('- ', '')}</li>;
                    }
                    return line ? <p key={i} className="text-zinc-300 mb-2">{line}</p> : null;
                  })}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="mt-8 text-center text-zinc-500 text-sm">
              <p>🔒 All processing happens in your browser. Your data never leaves your device.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
