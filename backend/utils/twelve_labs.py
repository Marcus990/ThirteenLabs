import httpx
import os
from typing import Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class TwelveLabsAPI:
    def __init__(self):
        self.api_key = os.getenv("TWL_API_KEY")
        self.index_id = os.getenv("TWL_INDEX_ID")
        self.base_url = "https://api.twelvelabs.io/v1.3"
        
        if not self.api_key:
            raise ValueError("TWL_API_KEY environment variable is required")
        if not self.index_id:
            raise ValueError("TWL_INDEX_ID environment variable is required")

    async def upload_to_twelve_labs(self, video_path: str) -> Dict[str, Any]:
        """
        Upload a video file to Twelve Labs for indexing
        
        Args:
            video_path: Path to the video file to upload
            
        Returns:
            Dict containing task_id and video_id from Twelve Labs response
            
        Raises:
            Exception: If upload fails or response is invalid
        """
        if not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        url = f"{self.base_url}/tasks"
        headers = {"x-api-key": self.api_key}
        
        # Prepare the multipart form data
        with open(video_path, "rb") as video_file:
            files = {
                "index_id": (None, self.index_id),
                "video_file": (Path(video_path).name, video_file, "video/mp4"),
            }
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        url,
                        headers=headers,
                        files=files,
                        timeout=60.0  # 60 second timeout for video upload
                    )
                    
                    if response.status_code not in [200, 201]:
                        raise Exception(f"Twelve Labs upload failed: {response.status_code} - {response.text}")
                    
                    data = response.json()
                    
                    # Validate response structure
                    if "_id" not in data or "video_id" not in data:
                        raise Exception(f"Invalid response from Twelve Labs: {data}")
                    
                    return {
                        "task_id": data["_id"],
                        "video_id": data["video_id"]
                    }
                    
                except httpx.RequestError as e:
                    raise Exception(f"Network error uploading to Twelve Labs: {str(e)}")
                except Exception as e:
                    raise Exception(f"Error uploading to Twelve Labs: {str(e)}") 