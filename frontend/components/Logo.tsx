import React from 'react';
import { useRouter } from 'next/router';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/');
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div 
      className={`flex items-center cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      {/* 3D Cube Logo */}
      <div className={`relative ${sizeClasses[size]} mr-3 group-hover:scale-110 transition-transform duration-300`}>
        {/* Cube faces */}
        <div className="absolute inset-0 transform rotate-45">
          {/* Front face */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg"></div>
          
          {/* Right face */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg transform rotate-y-45 origin-left"></div>
          
          {/* Top face */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg shadow-lg transform rotate-x-45 origin-bottom"></div>
          
          {/* 3D effect lines */}
          <div className="absolute inset-0 border-2 border-white border-opacity-20 rounded-lg"></div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
      </div>
      
      {/* Text */}
      <h1 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ThirteenLabs
        </span>
      </h1>
    </div>
  );
} 