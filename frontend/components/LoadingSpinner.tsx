import React from 'react';

interface LoadingSpinnerProps {
  progress?: number;
  message?: string;
}

export default function LoadingSpinner({ progress = 0, message = "Processing your video..." }: LoadingSpinnerProps) {
  return (
    <div className="text-center space-y-8">
      {/* Animated Spinner */}
      <div className="relative w-24 h-24 mx-auto">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 opacity-20"></div>

        {/* Animated Spinner Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-transparent animate-spin"></div>

        {/* Circular Progress Ring (Optional) */}
        {/* Comment this out if you don't want dual spinning rings */}
        {/* <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, #ec4899 ${progress * 3.6}deg, transparent 0deg)`,
            maskImage: 'radial-gradient(white 60%, transparent 61%)',
            WebkitMaskImage: 'radial-gradient(white 60%, transparent 61%)',
            transition: 'background 0.5s ease-in-out',
          }}
        ></div> */}

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress Text */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">{message}</h3>
        <p className="text-gray-300 text-lg">This may take a few minutes...</p>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-gray-700 bg-opacity-50 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}% complete</p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-md mx-auto">
        <div className="space-y-3">
          {[
            { threshold: 0, text: "Video uploaded" },
            { threshold: 20, text: "Analyzing video content" },
            { threshold: 40, text: "Generating 3D models" },
            { threshold: 60, text: "Creating game mechanics" },
            { threshold: 80, text: "Finalizing your game" },
          ].map(({ threshold, text }) => (
            <div className="flex items-center space-x-3" key={text}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  progress > threshold ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                {progress > threshold ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className="text-gray-300">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
