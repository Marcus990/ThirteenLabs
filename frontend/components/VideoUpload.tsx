import React, { useState, useRef } from 'react';
import { Upload, Video, X, Clock, FileVideo } from 'lucide-react';

interface VideoUploadProps {
  onUpload: (file: File) => void;
}

export default function VideoUpload({ onUpload }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return 'Please select a video file';
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.mp4') && !file.name.toLowerCase().endsWith('.mov')) {
      return 'Only MP4 and MOV files are supported';
    }

    // Check file size (max 500MB for longer videos)
    if (file.size > 500 * 1024 * 1024) {
      return 'File size must be less than 500MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-purple-400 bg-purple-50 bg-opacity-10 scale-105'
            : selectedFile
            ? 'border-green-400 bg-green-50 bg-opacity-10'
            : 'border-gray-400 hover:border-purple-400 hover:bg-purple-50 hover:bg-opacity-5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {!selectedFile ? (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Drop your video here, or click to browse
              </h3>
              <p className="text-gray-300 text-lg">
                MP4 and MOV files only, max 500MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Video size={32} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedFile.name}
              </h3>
              <p className="text-gray-300">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="inline-flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={16} />
              <span className="ml-2">Remove</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 bg-red-900 bg-opacity-20 border border-red-500 border-opacity-30 rounded-2xl">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !error && (
        <div className="text-center">
          <button
            onClick={handleUpload}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Upload size={24} />
            <span className="ml-3">Create 3D Experience</span>
          </button>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">Video Requirements</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Duration</h4>
                <p className="text-gray-300 text-sm">4 seconds to 10 minutes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileVideo size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Format</h4>
                <p className="text-gray-300 text-sm">MP4 and MOV files only</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Content</h4>
                <p className="text-gray-300 text-sm">Clear main object visible</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Size</h4>
                <p className="text-gray-300 text-sm">Maximum 500MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 