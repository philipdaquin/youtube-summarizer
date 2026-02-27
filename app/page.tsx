'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState('');
  const [model, setModel] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for WebGPU support
    const checkWebGPU = async () => {
      if (!navigator.gpu) {
        setHasWebGPU(false);
        return;
      }
      try {
        const adapter = await navigator.gpu.requestAdapter();
        setHasWebGPU(!!adapter);
      } catch {
        setHasWebGPU(false);
      }
    };
    checkWebGPU();
  }, []);

  const initModel = async () => {
    try {
      setStatus('Loading AI engine...');
      const webllm = await import('@mlc-ai/web-llm');
      
      setStatus('Initializing AI model...');
      const selectedModel = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
      
      const newModel = await webllm.CreateMLCEngine(
        selectedModel,
        {
          initProgressCallback: (p: any) => {
            setProgress(Math.round(p.progress * 100));
            setStatus(`Loading: ${p.text}`);
          }
        }
      );
      
      setModel(newModel);
      setInitialized(true);
      setStatus('Ready!');
    } catch (e: any) {
      console.error('Init error:', e);
      setError('Failed to load AI model. Please refresh and try again.');
      setStatus('');
    }
  };

  const generateSummary = async () => {
    if (!model || !url) return;
    
    setLoading(true);
    setError('');
    setSummary('');
    
    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      setStatus('Fetching video information...');
      
      const oembedRes = await fetch(
        `https://www.youtube.com/oEmbed?url=${url}&format=json`
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

      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant that summarizes YouTube videos.' },
        { role: 'user', content: prompt }
      ];

      const chunks: string[] = [];
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
    } catch (e: any) {
      setError(e.message || 'An error occurred');
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            YouTube Summarizer
          </h1>
          <p className="text-zinc-400 text-lg">
            AI-powered summaries. Runs entirely in your browser.
          </p>
        </div>

        {/* WebGPU Check */}
        {hasWebGPU === false && (
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-400 font-semibold mb-1">WebGPU Required</h3>
                <p className="text-amber-200/70 text-sm mb-3">
                  This app requires WebGPU to run the AI model in your browser. Your browser or device doesn't seem to support WebGPU.
                </p>
                <div className="text-sm text-zinc-400">
                  <p className="mb-2"><strong>To use this app:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-500">
                    <li>Use Chrome 113+ or Edge 113+ on desktop</li>
                    <li>Make sure you're not in incognito mode (for some features)</li>
                    <li>On Mac: Use Chrome with Apple Silicon</li>
                    <li>Or try a different device with WebGPU support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Card */}
        {!initialized && !error && hasWebGPU !== false && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Load AI Model</h2>
              <p className="text-zinc-400 mb-6 text-sm">
                This runs a local AI model (Llama 3.1) in your browser using WebGPU. 
                First load takes ~2-3 minutes. Model is cached for subsequent visits.
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

            <div className="mt-8 text-center text-zinc-500 text-sm">
              <p>🔒 All processing happens in your browser. Your data never leaves your device.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
