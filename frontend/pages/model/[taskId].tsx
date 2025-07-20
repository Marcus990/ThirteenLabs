import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Menu, ArrowLeft, Play, Download, Share2, Settings } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ThreeJSRenderer from '../../components/ThreeJSRenderer';
import Logo from '../../components/Logo';
import { getModelEntry, generate3DModel, ModelEntry } from '../../lib/api';

export default function ModelPage() {
  const router = useRouter();
  const { taskId } = router.query;
  const [entry, setEntry] = useState<ModelEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadEntry();
    }
  }, [taskId]);

  const loadEntry = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getModelEntry(taskId as string);
      setEntry(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate3D = async () => {
    if (!taskId) return;
    
    try {
      setGenerating(true);
      await generate3DModel(taskId as string);
      // Reload the entry to get the updated threejs_code
      await loadEntry();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate 3D model');
    } finally {
      setGenerating(false);
    }
  };

  const handleBackToResults = () => {
    router.push(`/result/${taskId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-80 fixed top-0 bottom-0 left-0 z-40">
          <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 ml-80 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              {/* Spinner Ring Background */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-200/20" />
              
              {/* Spinner Ring Animated Top Segment */}
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-transparent animate-spin" />
              
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  {/* 3D Cube Icon */}
                  <div className="w-4 h-4 relative">
                    {/* Cube faces */}
                    <div className="absolute inset-0 transform rotate-45">
                      {/* Front face */}
                      <div className="absolute inset-0 bg-white rounded-sm"></div>
                      
                      {/* Right face */}
                      <div className="absolute inset-0 bg-white bg-opacity-80 rounded-sm transform rotate-y-45 origin-left"></div>
                      
                      {/* Top face */}
                      <div className="absolute inset-0 bg-white bg-opacity-60 rounded-sm transform rotate-x-45 origin-bottom"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-400">Loading 3D experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-80 fixed top-0 bottom-0 left-0 z-40">
          <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 ml-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Entry not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>3D Experience - ThirteenLabs</title>
        <meta name="description" content="View and interact with your 3D experience" />
      </Head>

      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <div className="w-80 fixed top-0 bottom-0 left-0 z-40">
          <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-80">
          {/* Header */}
          <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors mr-4"
                  >
                    <Menu size={24} />
                  </button>
                  <button
                    onClick={handleBackToResults}
                    className="flex items-center text-gray-300 hover:text-white transition-colors mr-4"
                  >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Results
                  </button>
                  <Logo />
                </div>
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-300 hover:text-white transition-colors">
                    <Share2 size={20} />
                  </button>
                  <button className="p-2 text-gray-300 hover:text-white transition-colors">
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Model Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">3D Experience</h2>
                <p className="text-gray-300 text-lg">{entry.description}</p>
              </div>

              {/* 3D Model Viewer */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
                {entry.threejs_code ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">Interactive 3D Experience</h3>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => window.location.reload()}
                          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <Play size={16} className="mr-2" />
                          Re-Render Experience
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                          <Download size={16} className="mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                    
                    {/* 3D Model Container */}
                    <div className="bg-white rounded-xl h-96 flex items-center justify-center">
                      <ThreeJSRenderer 
                        threejsCode={entry.threejs_code} 
                        width={800} 
                        height={384} 
                      />
                    </div>

                    {/* Controls Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">3D Experience Controls</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                        <div>
                          <span className="font-medium">Mouse:</span> Rotate view
                        </div>
                        <div>
                          <span className="font-medium">Scroll:</span> Zoom in/out
                        </div>
                        <div>
                          <span className="font-medium">Right-click:</span> Pan view
                        </div>
                        <div>
                          <span className="font-medium">R:</span> Reset camera
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Play size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Generate 3D Model</h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                      Create an interactive 3D model from your video analysis. This will generate a detailed 3D visualization with motion and spatial awareness.
                    </p>
                    <button
                      onClick={handleGenerate3D}
                      disabled={generating}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Generating...
                        </div>
                      ) : (
                        'Generate 3D Model'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Model Details */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Model Information</h3>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamps:</span>
                      <span>{entry.timestamps.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span>{entry.image_urls.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3D Model:</span>
                      <span className={entry.threejs_code ? 'text-green-400' : 'text-red-400'}>
                        {entry.threejs_code ? 'Generated' : 'Not Generated'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      Export Model
                    </button>
                    <button className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      Share Model
                    </button>
                    <button className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      Download Assets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 