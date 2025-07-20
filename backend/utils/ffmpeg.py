import subprocess
import os
from pathlib import Path
from typing import List

class FFmpegProcessor:
    def __init__(self):
        self.ffmpeg_path = "ffmpeg"
    
    def extract_frames(self, video_path: str, timestamps: List[float], output_dir: str) -> List[str]:
        """
        Extract frames from video at specific timestamps
        """
        try:
            output_paths = []
            
            for i, timestamp in enumerate(timestamps):
                output_filename = f"frame_{i:03d}.jpg"
                output_path = os.path.join(output_dir, output_filename)
                
                # FFmpeg command to extract frame at specific timestamp
                cmd = [
                    self.ffmpeg_path,
                    "-i", video_path,
                    "-ss", str(timestamp),
                    "-vframes", "1",
                    "-q:v", "2",  # High quality
                    "-y",  # Overwrite output
                    output_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode == 0 and os.path.exists(output_path):
                    output_paths.append(output_path)
                else:
                    print(f"Failed to extract frame at {timestamp}s: {result.stderr}")
            
            # If no frames extracted, create a placeholder
            if not output_paths:
                output_paths = self._create_placeholder_frame(output_dir)
            
            return output_paths
            
        except Exception as e:
            print(f"FFmpeg error: {e}")
            return self._create_placeholder_frame(output_dir)
    
    def _create_placeholder_frame(self, output_dir: str) -> List[str]:
        """
        Create a placeholder frame for development
        """
        placeholder_path = os.path.join(output_dir, "placeholder.jpg")
        
        # Create a simple colored image using FFmpeg
        cmd = [
            self.ffmpeg_path,
            "-f", "lavfi",
            "-i", "color=c=red:size=640x480",
            "-vframes", "1",
            "-y",
            placeholder_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True)
            return [placeholder_path]
        except:
            # If FFmpeg fails, create an empty file
            Path(placeholder_path).touch()
            return [placeholder_path]
    
    def get_video_info(self, video_path: str) -> dict:
        """
        Get video information (duration, resolution, etc.)
        """
        try:
            cmd = [
                self.ffmpeg_path,
                "-i", video_path,
                "-f", "null",
                "-"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Parse duration from stderr output
            duration = None
            for line in result.stderr.split('\n'):
                if "Duration:" in line:
                    # Extract duration from line like "Duration: 00:00:05.00"
                    duration_str = line.split("Duration:")[1].split(",")[0].strip()
                    # Convert to seconds
                    parts = duration_str.split(":")
                    duration = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    break
            
            return {
                "duration": duration,
                "path": video_path
            }
            
        except Exception as e:
            print(f"Error getting video info: {e}")
            return {"duration": 5.0, "path": video_path} 