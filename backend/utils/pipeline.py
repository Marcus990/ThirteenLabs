import httpx
import asyncio
import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from utils.screenshot import ScreenshotProcessor

# Load environment variables from .env file
load_dotenv()

# In-memory storage for analysis results
analysis_results: Dict[str, Dict[str, Any]] = {}

class PipelineProcessor:
    def __init__(self):
        self.api_key = os.getenv("TWL_API_KEY")
        self.index_id = os.getenv("TWL_INDEX_ID")
        self.base_url = "https://api.twelvelabs.io/v1.3"
        
        if not self.api_key:
            raise ValueError("TWL_API_KEY environment variable is required")
        if not self.index_id:
            raise ValueError("TWL_INDEX_ID environment variable is required")

    async def process_pipeline(self, video_id: str, task_id: str, video_path: str = None, skip_polling: bool = False) -> Dict[str, Any]:
        """
        Main pipeline function that processes a video through Twelve Labs

        Args:
            video_id: The video ID from Twelve Labs
            task_id: The task ID from Twelve Labs
            video_path: Path to the video file for screenshots
            skip_polling: If True, skips polling and assumes video is already indexed

        Returns:
            Dict containing description and timestamps for different angles
        """
        print(f"\n🔄 [Pipeline] Starting processing for task {task_id}")
        print(f"📹 Video ID: {video_id}")

        try:
            # Step 1: Poll for indexing completion unless skipped
            if not skip_polling:
                await self._poll_indexing_status(task_id)
                print(f"✅ Task indexing completed for task {task_id}")
                
                # Step 1.5: Poll for video indexing completion
                await self._poll_video_indexing(video_id)
                print(f"✅ Video indexing completed for video {video_id}")
            else:
                print(f"⚠️ Skipping polling — assuming video is already indexed")

            # Step 2: Query object description
            print(f"🔍 Getting object description...")
            description = await self._query_object_description(video_id)

            # Step 3: Query object perspectives
            print(f"🔍 Getting object perspectives...")
            timestamps = await self._query_object_perspectives(video_id)

            # Step 4: Take screenshots if video path is provided
            screenshots = {}
            if video_path:
                print(f"📸 Taking screenshots for each view...")
                screenshot_processor = ScreenshotProcessor()
                if screenshot_processor.ffmpeg_available:
                    screenshots = screenshot_processor.take_screenshots_for_views(video_path, timestamps, task_id)
                    print(f"✅ Screenshots taken: {len(screenshots)} views")
                else:
                    print(f"⚠️  FFmpeg not available - screenshots will be skipped")
                    print(f"💡 Install FFmpeg to enable screenshot functionality")
            else:
                print(f"⚠️  No video path provided - skipping screenshots")

            # Step 5: Store results
            result = {
                "description": description,
                "timestamps": timestamps,
                "screenshots": screenshots,
                "status": "completed",
                "video_id": video_id,
                "task_id": task_id
            }

            analysis_results[task_id] = result

            print(f"✅ [Pipeline] Processing completed for task {task_id}")
            print(f"📝 Description: {description[:100]}{'...' if len(description) > 100 else ''}")
            print(f"⏰ Timestamps found: {sum(1 for t in timestamps.values() if t)}")
            print(f"📸 Screenshots taken: {len(screenshots)}")

            return result

        except Exception as e:
            print(f"❌ [Pipeline] Error processing task {task_id}: {str(e)}")

            # Store error result
            error_result = {
                "status": "failed",
                "error": str(e),
                "video_id": video_id,
                "task_id": task_id
            }
            analysis_results[task_id] = error_result

            raise e


    async def _poll_indexing_status(self, task_id: str) -> None:
        """
        Poll the task until it's completed or timeout is reached
        """
        url = f"{self.base_url}/tasks/{task_id}"
        headers = {"x-api-key": self.api_key}
        max_attempts = 100  # 5 minutes / 3 seconds per attempt
        attempt = 0
        
        async with httpx.AsyncClient() as client:
            while attempt < max_attempts:
                try:
                    response = await client.get(url, headers=headers, timeout=10.0)
                    
                    if response.status_code != 200:
                        raise Exception(f"Failed to get task status: {response.status_code} - {response.text}")
                    
                    data = response.json()
                    status = data.get("status")
                    
                    print(f"      📊 Task status: {status} (attempt {attempt + 1}/{max_attempts})")
                    
                    if status == "completed":
                        return
                    elif status == "failed":
                        raise Exception(f"Task failed: {data.get('error', 'Unknown error')}")
                    elif status == "ready":
                        # Video is ready for semantic queries
                        return
                    elif status in ["pending", "processing", "uploading", "queued", "video_not_ready"]:
                        # Continue polling for these statuses
                        pass
                    else:
                        pass # for now
                        # raise Exception(f"Unknown task status: {status}")
                    
                    # Wait 3 seconds before next attempt
                    await asyncio.sleep(3)
                    attempt += 1
                    
                except httpx.RequestError as e:
                    raise Exception(f"Network error polling task: {str(e)}")
            
            # If we get here, we've timed out
            raise TimeoutError(f"Task polling timed out after 5 minutes. Task ID: {task_id}")

    async def _poll_video_indexing(self, video_id: str) -> None:
        """
        Poll the video indexing status until it's ready for semantic queries
        """
        url = f"{self.base_url}/tasks"
        headers = {"x-api-key": self.api_key}
        max_attempts = 60  # 3 minutes / 3 seconds per attempt
        attempt = 0
        
        async with httpx.AsyncClient() as client:
            while attempt < max_attempts:
                try:
                    # Query tasks with video_id filter to get the specific video's status
                    params = {"video_id": video_id}
                    response = await client.get(url, headers=headers, params=params, timeout=10.0)
                    
                    if response.status_code != 200:
                        raise Exception(f"Failed to get video status: {response.status_code} - {response.text}")
                    
                    data = response.json()
                    
                    # Check if we have any tasks for this video
                    if "data" in data and len(data["data"]) > 0:
                        # Get the most recent task for this video
                        task = data["data"][0]
                        status = task.get("status")
                        
                        print(f"      📊 Video indexing status: {status} (attempt {attempt + 1}/{max_attempts})")
                        
                        if status == "ready":
                            # Additional verification: try a simple query to ensure semantic analysis is ready
                            print(f"      🔍 Verifying semantic analysis readiness...")
                            if await self._verify_semantic_readiness(video_id):
                                print(f"      ✅ Video is ready for semantic analysis")
                                return
                            else:
                                print(f"      ⏳ Video status is 'ready' but semantic analysis not yet available, continuing to poll...")
                        elif status == "failed":
                            raise Exception(f"Video indexing failed: {task.get('error', 'Unknown error')}")
                        elif status in ["pending", "processing", "indexing"]:
                            # Continue polling for these statuses
                            pass
                        else:
                            print(f"      ⚠️  Unknown video status: {status}, continuing to poll...")
                    else:
                        print(f"      ⏳ No tasks found for video {video_id}, waiting...")
                    
                    # Wait 3 seconds before next attempt
                    await asyncio.sleep(3)
                    attempt += 1
                    
                except httpx.RequestError as e:
                    raise Exception(f"Network error polling video: {str(e)}")
            
            # If we get here, we've timed out
            raise TimeoutError(f"Video indexing polling timed out after 3 minutes. Video ID: {video_id}")

    async def _verify_semantic_readiness(self, video_id: str) -> bool:
        """
        Verify that the video is truly ready for semantic analysis by making a simple test query
        """
        url = f"{self.base_url}/analyze"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "video_id": video_id,
            "prompt": "What is the main object in this video?",
            "temperature": 0.1,
            "stream": False
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                
                if response.status_code == 200:
                    return True
                elif response.status_code == 400:
                    error_data = response.json()
                    if error_data.get("code") == "video_not_ready":
                        return False
                    else:
                        # Other 400 errors might indicate the video is ready but the query failed
                        return True
                else:
                    # Other status codes might indicate the video is ready
                    return True
                    
            except Exception as e:
                print(f"      ⚠️  Error verifying semantic readiness: {e}")
                return False

    async def _query_object_description(self, video_id: str) -> str:
        url = f"{self.base_url}/analyze"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "video_id": video_id,
            "prompt": "You are a 3D model designer. Analyze the main object in this video and describe it in detailed, spatially-aware language. Include information about its geometry, structure, materials, color, size, proportions, and component parts. Describe how these parts connect or relate to each other. Note any textures, curves, or distinct design features. Use clear language that a large language model can convert into 3D geometry using primitives like boxes, cylinders, tubes, or curves. If visible, mention dimensions or relative scale, and whether the object is static or moving in the video.",
            "temperature": 0.2,
            "stream": False
        }

        max_retries = 10
        retry_delay = 3
        
        async with httpx.AsyncClient() as client:
            for attempt in range(max_retries):
                try:
                    response = await client.post(url, headers=headers, json=payload, timeout=60.0)

                    if response.status_code == 200:
                        data = response.json()
                        return data.get("data", "No description returned.")
                    elif response.status_code == 400:
                        error_data = response.json()
                        if error_data.get("code") == "video_not_ready":
                            print(f"      ⏳ Video not ready for analysis (attempt {attempt + 1}/{max_retries}), waiting {retry_delay}s...")
                            await asyncio.sleep(retry_delay)
                            retry_delay = min(retry_delay * 1.5, 30)  # Exponential backoff, max 30s
                            continue
                        else:
                            raise Exception(f"Failed to get object description: {response.status_code} - {response.text}")
                    else:
                        raise Exception(f"Failed to get object description: {response.status_code} - {response.text}")

                except httpx.RequestError as e:
                    if attempt == max_retries - 1:
                        raise Exception(f"Network error getting object description: {str(e)}")
                    print(f"      ⚠️  Network error (attempt {attempt + 1}/{max_retries}), retrying...")
                    await asyncio.sleep(retry_delay)
            
            raise Exception(f"Failed to get object description after {max_retries} attempts")

    async def _query_object_perspectives(self, video_id: str) -> Dict[str, str]:
        """
        Use the /analyze endpoint to get the best timestamp for each perspective (front, side, back, top).
        Returns a dict mapping angle -> timestamp (in MM:SS string format).
        """
        url = f"{self.base_url}/analyze"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        prompts = {
            "front": "Can you return me the exact timestamp of the best time which only the front view of the main object can be seen fully? At this moment in the video, only the front view should be able to be seen, not the side or back views. Only provide the best single timestamp for my request. Do not include any text other than the timestamp in your output. Your output should be in the format (XX:XX)",
            "side": "Can you return me the exact timestamp of the best time which only the side view of the main object can be seen fully? At this moment in the video, only the side view should be able to be seen, not the front or back views. Only provide the best single timestamp for my request. Do not include any text other than the timestamp in your output. Your output should be in the format (XX:XX)",
            "back": "Can you return me the exact timestamp of the best time which only the back view of the main object can be seen fully? At this moment in the video, only the back view should be able to be seen, not the side or front views. Only provide the best single timestamp for my request. Do not include any text other than the timestamp in your output. Your output should be in the format (XX:XX)",
            "top": "Can you return me the exact timestamp of the best time which only the top view of the main object can be seen fully? At this moment in the video, only the top view should be able to be seen, not the side views. Only provide the best single timestamp for my request. Do not include any text other than the timestamp in your output. Your output should be in the format (XX:XX)"
        }

        perspectives = {}

        async with httpx.AsyncClient() as client:
            for angle, prompt in prompts.items():
                max_retries = 10
                retry_delay = 3
                
                for attempt in range(max_retries):
                    try:
                        print(f"      🔍 Analyzing for {angle} view... (attempt {attempt + 1}/{max_retries})")

                        payload = {
                            "video_id": video_id,
                            "prompt": prompt,
                            "temperature": 0.2,
                            "stream": False
                        }

                        response = await client.post(url, headers=headers, json=payload, timeout=60.0)

                        if response.status_code == 200:
                            result_text = response.text.strip().replace('"', '')  # API returns a raw quoted string sometimes
                            
                            # Extract timestamp from complex response object
                            if result_text.startswith('{') and 'data:' in result_text:
                                # Parse the complex response format like {id:...,data:(00:00),usage:...}
                                import re
                                match = re.search(r'data:\(([^)]+)\)', result_text)
                                if match:
                                    result_text = match.group(1)
                            
                            perspectives[angle] = result_text
                            print(f"      ✅ Best {angle} view timestamp: {result_text}")
                            break  # Success, exit retry loop
                            
                        elif response.status_code == 400:
                            error_data = response.json()
                            if error_data.get("code") == "video_not_ready":
                                print(f"      ⏳ Video not ready for {angle} analysis (attempt {attempt + 1}/{max_retries}), waiting {retry_delay}s...")
                                await asyncio.sleep(retry_delay)
                                retry_delay = min(retry_delay * 1.5, 30)  # Exponential backoff, max 30s
                                continue
                            else:
                                print(f"      ⚠️  Analyze API failed for {angle}: {response.status_code} - {response.text}")
                                perspectives[angle] = None
                                break
                        else:
                            print(f"      ⚠️  Analyze API failed for {angle}: {response.status_code} - {response.text}")
                            perspectives[angle] = None
                            break

                    except Exception as e:
                        if attempt == max_retries - 1:
                            print(f"      ❌ Error analyzing {angle} angle after {max_retries} attempts: {e}")
                            perspectives[angle] = None
                        else:
                            print(f"      ⚠️  Error analyzing {angle} angle (attempt {attempt + 1}/{max_retries}): {e}")
                            await asyncio.sleep(retry_delay)

                await asyncio.sleep(0.5)  # Small delay between angles

        return perspectives


def get_analysis_result(task_id: str) -> Dict[str, Any]:
    """
    Get the analysis result for a task ID
    """
    return analysis_results.get(task_id, {})

def is_task_completed(task_id: str) -> bool:
    """
    Check if a task is completed
    """
    result = analysis_results.get(task_id, {})
    return result.get("status") == "completed"

def is_task_failed(task_id: str) -> bool:
    """
    Check if a task failed
    """
    result = analysis_results.get(task_id, {})
    return result.get("status") == "failed" 