import subprocess
import os
import shutil
from pathlib import Path
from typing import Dict, Optional
import re

class ScreenshotProcessor:
    def __init__(self):
        self.photos_dir = Path("photos")
        self.photos_dir.mkdir(exist_ok=True)
        self.ffmpeg_available = self._check_ffmpeg()
    
    def _check_ffmpeg(self) -> bool:
        """
        Check if FFmpeg is available on the system
        """
        return shutil.which("ffmpeg") is not None
    
    def timestamp_to_seconds(self, timestamp: str) -> float:
        """
        Convert MM:SS format to seconds
        """
        if not timestamp or timestamp == "null":
            return 0.0
        
        # Handle MM:SS format
        match = re.match(r'(\d+):(\d+)', timestamp)
        if match:
            minutes, seconds = map(int, match.groups())
            return minutes * 60 + seconds
        
        # Handle SS.MM format (seconds with decimal)
        try:
            return float(timestamp)
        except ValueError:
            return 0.0
    
    def take_screenshot(self, video_path: str, timestamp: str, output_filename: str) -> Optional[str]:
        """
        Take a screenshot at the specified timestamp using FFmpeg
        
        Args:
            video_path: Path to the video file
            timestamp: Timestamp in MM:SS format
            output_filename: Name for the output image file
            
        Returns:
            Path to the screenshot file if successful, None otherwise
        """
        if not self.ffmpeg_available:
            print(f"      ⚠️  FFmpeg not available - skipping screenshot for {timestamp}")
            print(f"      💡 Install FFmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Ubuntu)")
            return None
            
        try:
            # Convert timestamp to seconds
            seconds = self.timestamp_to_seconds(timestamp)
            
            # Create output path
            output_path = self.photos_dir / f"{output_filename}.jpg"
            
            # FFmpeg command to extract frame at specific time
            cmd = [
                "ffmpeg",
                "-i", video_path,
                "-ss", str(seconds),
                "-vframes", "1",
                "-q:v", "2",  # High quality
                "-y",  # Overwrite output file
                str(output_path)
            ]
            
            print(f"      📸 Taking screenshot at {timestamp} ({seconds}s) -> {output_path}")
            
            # Run FFmpeg command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and output_path.exists():
                print(f"      ✅ Screenshot saved: {output_path}")
                return str(output_path)
            else:
                print(f"      ❌ Screenshot failed: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            print(f"      ❌ Screenshot timeout for {timestamp}")
            return None
        except Exception as e:
            print(f"      ❌ Screenshot error for {timestamp}: {str(e)}")
            return None
    
    def take_screenshots_for_views(self, video_path: str, timestamps: Dict[str, str], task_id: str) -> Dict[str, str]:
        """
        Take screenshots for all views that have timestamps
        
        Args:
            video_path: Path to the video file
            timestamps: Dictionary of angle -> timestamp
            task_id: Task ID for naming files
            
        Returns:
            Dictionary of angle -> screenshot path
        """
        screenshots = {}
        
        for angle, timestamp in timestamps.items():
            if timestamp and timestamp != "null":
                filename = f"{task_id}_{angle}"
                screenshot_path = self.take_screenshot(video_path, timestamp, filename)
                if screenshot_path:
                    screenshots[angle] = screenshot_path
        
        return screenshots 