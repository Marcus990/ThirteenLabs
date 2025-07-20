const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Constructs the full URL for an image stored in the backend
 * @param imagePath - The relative path from the database (e.g., "photos/filename.jpg")
 * @returns The full URL to access the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Construct full URL
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Extracts filename from a path
 * @param path - The file path
 * @returns The filename
 */
export const getFilenameFromPath = (path: string): string => {
  if (!path) return '';
  return path.split('/').pop() || '';
};

/**
 * Constructs the full URL for a video stored in the backend
 * @param videoPath - The relative path from the database (e.g., "uploads/filename.mp4")
 * @returns The full URL to access the video
 */
export const getVideoUrl = (videoPath: string): string => {
  if (!videoPath) return '';
  
  // If it's already a full URL, return as is
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    return videoPath;
  }
  
  // Remove leading slash if present
  const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
  
  // Construct full URL
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Converts a timestamp string (MM:SS format) to seconds
 * @param timestamp - The timestamp string (e.g., "01:23")
 * @returns The time in seconds
 */
export const timestampToSeconds = (timestamp: string): number => {
  if (!timestamp) return 0;
  
  const parts = timestamp.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  
  return 0;
}; 