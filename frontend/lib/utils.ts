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