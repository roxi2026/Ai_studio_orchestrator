import { Download, Info, Settings, Shield, Smartphone, Globe, BrainCircuit } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const handleDownload = async () => {
    const zip = new JSZip();
    const files = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'popup.css',
      'offscreen.html',
      'offscreen.js',
      'background.js',
      'aistudio_content.js',
      'content.js',
      'inject.js'
    ];

    try {
      for (const file of files) {
        const response = await fetch(`/extension/${file}`);
        if (!response.ok) throw new Error(`Failed to fetch ${file}`);
        const content = await response.text();
        zip.file(file, content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'omnipotent-ai-orchestrator.zip');
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Failed to download extension files.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Hero Section */}
      <header className="bg-zinc-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <BrainCircuit className="w-4 h-4" />
            v2.0 "God Mode" Update
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Omnipotent AI Orchestrator
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Transform Google AI Studio into a universal, autonomous web agent. 
            This extension allows Gemini to navigate, read, and interact with <strong>any website</strong> on the internet autonomously.
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Download Extension (.zip)
          </button>
        </div>
      </header>

      {/* Architecture Section */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-500" />
            God Mode Capabilities
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Universal DOM Control
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                The AI can now output JSON-based <code>&lt;ACTION&gt;</code> tags to execute commands like <code>NAVIGATE</code>, <code>CLICK</code>, <code>TYPE</code>, and <code>READ</code> on any target URL.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
                Autonomous Feedback Loop
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                The background Service Worker intercepts the model's actions, executes them on the target tab, and feeds the result back into AI Studio, creating a continuous, self-piloting loop.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3">Persistent Memory</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                The agent can use the <code>STORE</code> action to save variables, extracted data, and context to the extension's local storage, allowing it to maintain state across long-running workflows.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3">JavaScript Evaluation</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                For complex interactions, the agent can use the <code>EVALUATE</code> action to inject and run raw JavaScript directly within the context of the target webpage.
              </p>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Info className="w-6 h-6 text-indigo-500" />
            Installation Guide
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-zinc-400" />
                Desktop (Google Chrome)
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-zinc-600">
                <li>Download and extract the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm">omnipotent-ai-orchestrator.zip</code> file.</li>
                <li>Open Chrome and navigate to <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm">chrome://extensions/</code>.</li>
                <li>Enable <strong>Developer mode</strong> in the top right corner.</li>
                <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
                <li>Navigate to <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Google AI Studio</a>.</li>
                <li>Click the extension icon, enter your goal, and click <strong>Start</strong>.</li>
              </ol>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-zinc-400" />
                Mobile (Kiwi Browser)
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-zinc-600">
                <li>Install Kiwi Browser from the Google Play Store.</li>
                <li>Download and extract the extension zip file to your device.</li>
                <li>Open Kiwi Browser and navigate to <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm">kiwi://extensions/</code>.</li>
                <li>Enable <strong>Developer mode</strong>.</li>
                <li>Tap <strong>+(from .zip/.crx/.user.js)</strong> and select the extracted folder.</li>
                <li className="text-amber-600 bg-amber-50 p-3 rounded-lg mt-4 text-sm">
                  <strong>Important:</strong> To prevent the service worker from being suspended by Android's battery management, 
                  you must grant Kiwi Browser unrestricted background battery usage in your device settings.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
