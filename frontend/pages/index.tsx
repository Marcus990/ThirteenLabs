import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Menu, Upload, Play, Zap, Eye, Box } from "lucide-react";
import VideoUpload from "../components/VideoUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import Sidebar from "../components/Sidebar";
import { uploadVideo, pollTaskStatus, StatusResponse } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleVideoUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus("");

    try {
      setProcessingStatus("Uploading video...");
      setUploadProgress(10);

      const uploadResponse = await uploadVideo(file);
      setUploadProgress(30);

      setProcessingStatus("Processing video with AI...");

      const result = await pollTaskStatus(
        uploadResponse.task_id,
        (status: StatusResponse) => {
          if (status.status === "pending") {
            setProcessingStatus("Analyzing video content...");
            setUploadProgress(50);
          }
        }
      );

      setUploadProgress(100);
      setProcessingStatus("Processing complete!");

      router.push(`/result/${uploadResponse.task_id}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStatus("");
    }
  };

  return (
    <>
      <Head>
        <title>ThirteenLabs - AI Video to 3D Game Converter</title>
        <meta
          name="description"
          content="Transform your videos into playable 3D games with AI"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-white">
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ThirteenLabs
                      </span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <main className="relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
              <div className="text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-6">
                    <div className="mr-2">
                      <Zap size={16} />
                    </div>
                    AI-Powered Video to 3D Game Conversion
                  </div>
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    Transform Videos into
                    <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                      3D Games
                    </span>
                  </h2>
                  <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Upload a video and watch as AI converts it into a fully playable 3D game.
                    Powered by advanced computer vision and generative AI technology.
                  </p>
                </div>

                {/* Upload Section */}
                <div className="max-w-2xl mx-auto mb-16">
                  {isUploading ? (
                    <LoadingSpinner
                      progress={uploadProgress}
                      message={processingStatus}
                    />
                  ) : (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                      <VideoUpload onUpload={handleVideoUpload} />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload</h3>
                    <p className="text-gray-400">Simple video upload process</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Eye size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Analyze</h3>
                    <p className="text-gray-400">AI analyzes your content</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Play size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Play</h3>
                    <p className="text-gray-400">Enjoy your 3D game</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-20 bg-black/20 border-t border-white/10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Revolutionary AI Technology
                  </h3>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Experience the future of content creation with our cutting-edge AI platform
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                      <Eye size={24} />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">Video Analysis</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Advanced AI analyzes your video to identify objects, actions, and key moments with precision.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                      <Box size={24} />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">3D Generation</h4>
                    <p className="text-gray-300 leading-relaxed">
                      AI generates detailed 3D models and environments from your video content automatically.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                      <Play size={24} />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">Game Creation</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Instantly create interactive 3D games with physics, controls, and gameplay mechanics.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    How It Works
                  </h3>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Three simple steps to create your 3D game
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">Upload Video</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Upload a 4-10 minute MP4 video with a clear main object or scene
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">AI Processing</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Our AI analyzes the video and generates 3D models and game mechanics
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">Play Game</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Enjoy your fully interactive 3D game with WASD controls and mouse look
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-black/40 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ThirteenLabs
                  </span>
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Transforming the future of content creation with AI-powered video to 3D game conversion
                </p>
                <div className="flex justify-center space-x-8">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}