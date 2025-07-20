import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Play, Eye, Clock, FileText, Menu } from 'lucide-react';
import { getResult, ResultResponse, generate3DModel } from '../../lib/api';
import { getImageUrl, getVideoUrl, timestampToSeconds } from '../../lib/utils';
import Sidebar from '../../components/Sidebar';
import Logo from '../../components/Logo';

export default function ResultPage() {
  const router = useRouter();
  const { taskId } = router.query;
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [threejsCode, setThreejsCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      loadResult();
    }
  }, [taskId]);

  useEffect(() => {
    if (videoUrl) {
      console.log(`🎥 [Frontend] Video URL state updated: ${videoUrl}`);
    }
  }, [videoUrl]);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 [Frontend] Loading result for ${taskId}`);
      
      // Always call getResult - backend will handle routing to appropriate data source
      const data = await getResult(taskId as string);
      
      console.log(`🔍 [Frontend] Received data:`, {
        task_id: data.task_id,
        description: data.description?.substring(0, 100) + '...',
        timestamps: data.timestamps,
        screenshots: data.screenshots,
        has_threejs_code: !!data.threejs_code
      });
      
      // Additional debugging for timestamps and screenshots
      console.log(`🔍 [Frontend] Detailed timestamps:`, data.timestamps);
      console.log(`🔍 [Frontend] Detailed screenshots:`, data.screenshots);
      
      // Check if data is valid
      if (!data.description) {
        console.warn(`⚠️ [Frontend] No description found in data`);
      }
      
      if (!data.timestamps || Object.keys(data.timestamps).length === 0) {
        console.warn(`⚠️ [Frontend] No timestamps found in data`);
      }
      
      if (!data.screenshots || Object.keys(data.screenshots).length === 0) {
        console.warn(`⚠️ [Frontend] No screenshots found in data`);
      }
      
      setResult(data);
      
      // Set video URL if available
      if (data.video_url) {
        const fullVideoUrl = getVideoUrl(data.video_url);
        setVideoUrl(fullVideoUrl);
        console.log(`🎥 [Frontend] Video URL set: ${fullVideoUrl}`);
        console.log(`🎥 [Frontend] Original video_url from API: ${data.video_url}`);
        console.log(`🎥 [Frontend] API_BASE_URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`);
      } else {
        console.log(`⚠️ [Frontend] No video_url found in data:`, data);
      }
    } catch (err) {
      console.error(`❌ [Frontend] Error loading result:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleCreate3DExperience = async () => {
    if (!taskId) return;
    
    try {
      setGeneratingModel(true);
      
      console.log('🤖 Generating 3D model with Gemini...');
      
      // Always call generate3DModel - backend will handle routing
      const response = await generate3DModel(taskId as string);
      
      setThreejsCode(response.threejs_code);
      console.log('✅ 3D model generated successfully');
      
      // Redirect to the 3D model preview page
      router.push(`/model/${taskId}`);
      
    } catch (error) {
      console.error('❌ Error generating 3D model:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate 3D model');
    } finally {
      setGeneratingModel(false);
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    if (!videoRef.current || !timestamp) return;
    
    const seconds = timestampToSeconds(timestamp);
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            {/* Spinner Ring Background */}
            <div className="absolute inset-0 rounded-full border-4 border-purple-200/20" />
  
            {/* Spinner Ring Animated Top Segment */}
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-transparent animate-spin" />
  
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {/* 3D Cube Icon */}
                <div className="w-5 h-5 relative">
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
  
          {/* Text */}
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading analysis results...</h2>
            <p className="text-gray-300">Preparing your video insights</p>
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
              onClick={loadResult}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Eye size={18} />
              <span className="ml-2">Try Again</span>
            </button>
            <button 
              onClick={handleBack}
              className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
            >
              <span className="ml-2">Back to Upload</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const totalTimestamps = Object.values(result.timestamps).filter(timestamp => timestamp !== null).length;

  return (
    <>
      <Head>
        <title>Analysis Results - ThirteenLabs</title>
        <meta name="description" content="Video analysis results from ThirteenLabs" />
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
                  <Logo />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Video Analysis Complete
              </h1>
              <p className="text-xl text-gray-300">
                Your video has been analyzed and is ready for interactive 3D experience creation
              </p>
            </div>

            {/* Video Player Section */}
            {videoUrl ? (
              <div className="mb-12 bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                    <Play size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Original Video</h2>
                </div>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg shadow-lg"
                    controls
                    preload="metadata"
                    onError={(e) => console.error(`❌ [Frontend] Video error:`, e)}
                    onLoadStart={() => console.log(`🎥 [Frontend] Video loading started`)}
                    onLoadedData={() => console.log(`🎥 [Frontend] Video data loaded`)}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/quicktime" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ) : (
              <div className="mb-12 bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                    <Play size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Original Video</h2>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-400">No video available for this analysis</p>
                  <p className="text-sm text-gray-500 mt-2">Video URL: {result?.video_url || 'Not set'}</p>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Object Description */}
              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                    <FileText size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Object Description</h2>
                </div>
                <p className="text-gray-200 leading-relaxed text-lg">
                  {result.description}
                </p>
              </div>

              {/* Timestamps Summary */}
              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                    <Clock size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Key Moments</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total timestamps found:</span>
                    <span className="text-white font-semibold">{totalTimestamps}</span>
                  </div>
                  {Object.entries(result.timestamps).map(([angle, timestamp]) => (
                    <div key={angle} className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{angle} angle:</span>
                      <span 
                        className={`font-semibold flex items-center ${
                          timestamp && videoUrl 
                            ? 'text-purple-400 hover:text-purple-300 cursor-pointer transition-colors' 
                            : 'text-white'
                        }`}
                        onClick={() => timestamp && videoUrl && handleTimestampClick(timestamp)}
                      >
                        {timestamp || 'No timestamp'}
                        {timestamp && videoUrl && (
                          <Play size={12} className="ml-1 opacity-70" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orthographic Views */}
            <div className="mt-8 bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
              <h2 className="text-2xl font-bold text-white mb-6">Orthographic Views</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(result.timestamps).map(([angle, timestamp]) => {
                  const screenshotUrl = result.screenshots?.[angle];
                  const fullImageUrl = screenshotUrl ? getImageUrl(screenshotUrl) : null;
                  
                  console.log(`🔍 [Frontend] Rendering ${angle}:`, {
                    timestamp,
                    screenshotUrl,
                    fullImageUrl
                  });
                  
                  return (
                    <div key={angle} className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-300 capitalize">{angle} Angle</h3>
                      {timestamp ? (
                        <div className="space-y-2">
                          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div 
                              className={`font-mono text-sm mb-2 flex items-center ${
                                videoUrl 
                                  ? 'text-purple-400 hover:text-purple-300 cursor-pointer transition-colors' 
                                  : 'text-white'
                              }`}
                              onClick={() => videoUrl && handleTimestampClick(timestamp)}
                            >
                              {timestamp}
                              {videoUrl && (
                                <Play size={10} className="ml-1 opacity-70" />
                              )}
                            </div>
                            {fullImageUrl ? (
                              <img 
                                src={fullImageUrl}
                                alt={`${angle} view at ${timestamp}`}
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => console.error(`❌ [Frontend] Image failed to load: ${fullImageUrl}`, e)}
                                onLoad={() => console.log(`✅ [Frontend] Image loaded successfully: ${fullImageUrl}`)}
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-sm">Screenshot loading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No timestamp found</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 text-center">
              {result.threejs_code ? (
                // 3D model already exists - show view button
                <button
                  onClick={() => router.push(`/model/${taskId}`)}
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-2xl transition-all duration-300 transform shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Play size={24} />
                  <span className="ml-3">View 3D Experience</span>
                </button>
              ) : (
                // No 3D model yet - show generate button
                <button
                  onClick={handleCreate3DExperience}
                  disabled={generatingModel}
                  className={`inline-flex items-center px-8 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 transform shadow-lg hover:shadow-xl ${
                    generatingModel 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105'
                  }`}
                >
                  {generatingModel ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span>Creating 3D Experience...</span>
                    </>
                  ) : (
                    <>
                      <Play size={24} />
                      <span className="ml-3">Create 3D Experience</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Branding */}
            <div className="fixed bottom-6 right-6 z-20">
              <div className="bg-black bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white border-opacity-10">
                <p className="text-sm text-gray-300">
                  Powered by <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">ThirteenLabs</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 