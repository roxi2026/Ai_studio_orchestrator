import { Download, Info, Settings, Shield, Smartphone, BrainCircuit, Zap, GitMerge, Clock, Database, Globe } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Base files
    const files = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'popup.css',
      'background.js',
      'aistudio_content.js',
      'aistudio_ui.js',
      'aistudio_ui.css',
      'inject.js',
      'puppet_content.js',
      'offscreen.html',
      'offscreen.js'
    ];

    try {
      // Performance Optimization: Fetch all extension assets concurrently using Promise.all
      // instead of sequential await in a loop, reducing network RTT latency overhead by ~N-fold.
      const fetchedFiles = await Promise.all(
        files.map(async (file) => {
          const response = await fetch(`/extension-chrome/${file}`);
          if (!response.ok) throw new Error(`Failed to fetch ${file}`);
          const content = await response.text();
          return { file, content };
        })
      );

      for (const { file, content } of fetchedFiles) {
        zip.file(file, content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `omnipotent-ai-orchestrator-v8.0-chrome.zip`);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert(`Failed to download extension files.`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Hero Section */}
      <header className="bg-zinc-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
            <GitMerge className="w-4 h-4" />
            v8.0 "Dynamic SML & Chain Execution" Update
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Omnipotent AI Orchestrator
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Transform Google AI Studio into a self-directing meta-agent powered by <strong>Central Command (CC)</strong>. 
            Now featuring an evolved <strong>Puppet Agency</strong> that can execute complex sequences via <code>&lt;PUPPET_CHAIN&gt;</code> and utilize new SML tags like <code>&lt;THINK&gt;</code>. Includes expanded commands: GET_URL, GET_TITLE, CHECK_EXISTS, COUNT_ELEMENTS, SCROLL_TO, NAVIGATE, RELOAD, and Local Storage manipulation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Download for Chrome / Kiwi (.zip)
            </button>
          </div>
        </div>
      </header>

      {/* Architecture Section */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-500" />
            Central Command Capabilities
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
                Central Command (CC)
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                The CC directs the overall direction and is the leader of the agency throughout each greater cycle, overseeing deployment and communications between chunked sequences.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                Puppet Recon Free Agents
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Deploy procedurally scripted free agents to any URL on demand using the <code>&lt;PUPPET_DEPLOY&gt;</code> or <code>&lt;PUPPET_CHAIN&gt;</code> tags. Extract text, HTML, links, or execute complex multi-step interactions directly from the AI Studio session.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Intelligent Session Handoff
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                The AI chooses when to trigger a <strong>New Chat</strong> to clear context bloat, perfectly executing the handoff while retaining stored memory via the <code>&lt;MEMORY_STORE&gt;</code> tag.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Advanced SML Framework
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Utilize special Semantic Markup Language (SML) tags like <code>&lt;THINK&gt;</code>, <code>&lt;PUPPET_CHAIN&gt;</code>, and <code>&lt;MEMORY_STORE&gt;</code> at every end to ensure the proper functioning and evolution of the entire system, allowing the agency to work hand-in-hand with the main CC.
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
                <li>Download and extract the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm">omnipotent-ai-orchestrator-v8.0-chrome.zip</code> file.</li>
                <li>Open Chrome and navigate to <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm">chrome://extensions/</code>.</li>
                <li>Enable <strong>Developer mode</strong> in the top right corner.</li>
                <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
                <li>Navigate to <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Google AI Studio</a>.</li>
                <li><strong>The Command Center will automatically appear in the bottom right corner.</strong> Enter your goal and click Initialize CC.</li>
              </ol>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-zinc-400" />
                Android (Kiwi Browser)
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-zinc-600">
                <li>Install Kiwi Browser from the Google Play Store.</li>
                <li>Download and extract the Chrome extension zip file to your device.</li>
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
