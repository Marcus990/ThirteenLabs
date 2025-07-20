import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, RefreshCw, Play, Settings } from 'lucide-react';
import GameViewer from '../../components/GameViewer';
import { getGame } from '../../lib/api';

export default function GamePage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadGame();
    }
  }, [jobId]);

  const loadGame = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getGame(jobId as string);
      setGameData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-purple-200 border-opacity-20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Play size={20} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading your game...</h2>
            <p className="text-gray-300">Preparing your 3D experience</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-red-300 mb-6">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={loadGame}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw size={18} />
              <span className="ml-2">Try Again</span>
            </button>
            <button 
              onClick={handleBack}
              className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
            >
              <ArrowLeft size={18} />
              <span className="ml-2">Back to Upload</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={handleBack}
          className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-70 transition-all duration-300 flex items-center border border-white border-opacity-20"
        >
          <ArrowLeft size={18} />
          <span className="ml-2">Back to ThirteenLabs</span>
        </button>
      </div>

      {/* Game Info Panel */}
      {gameData && (
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-4 rounded-xl border border-white border-opacity-20 max-w-sm">
            <h3 className="font-semibold text-purple-300 mb-2">Game Object</h3>
            <p className="text-sm text-gray-200 leading-relaxed">
              {gameData.object_description}
            </p>
          </div>
        </div>
      )}

      {/* Game Viewer */}
      <GameViewer gameData={gameData} />

      {/* Controls Panel */}
      <div className="absolute bottom-6 left-6 z-20">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-4 rounded-xl border border-white border-opacity-20">
          <h3 className="font-semibold text-purple-300 mb-2 flex items-center">
            <Settings size={16} />
            <span className="ml-2">Controls</span>
          </h3>
          <div className="text-sm text-gray-200 space-y-1">
            <p><span className="text-purple-300 font-medium">WASD:</span> Move around</p>
            <p><span className="text-purple-300 font-medium">Mouse:</span> Look around</p>
            <p><span className="text-purple-300 font-medium">Space:</span> Jump (if available)</p>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute bottom-6 right-6 z-20">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white border-opacity-10">
          <p className="text-sm text-gray-300">
            Powered by <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">ThirteenLabs</span>
          </p>
        </div>
      </div>
    </div>
  );
} 