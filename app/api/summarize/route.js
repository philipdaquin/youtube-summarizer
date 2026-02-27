export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Demo response - local LLM requires local setup
    return Response.json({
      title: "YouTube Video",
      summary: `Demo mode: To enable local LLM summarization:

1. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh
2. Run: ollama serve
3. Pull a model: ollama pull llama2

This app will then use your local LLM to summarize YouTube videos!`,
      model: "Demo Mode (Local Ollama needed)"
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
