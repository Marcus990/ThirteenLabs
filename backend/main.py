from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os
from pathlib import Path
import shutil
from typing import Dict, Any
import aiofiles
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from utils.async_processing import process_video_pipeline, get_job_status, get_job_result
from utils.pipeline import PipelineProcessor, get_analysis_result, is_task_completed, is_task_failed
from utils.gemini_api import GeminiAPI
from utils.supabase_client import SupabaseManager

app = FastAPI(title="Thirteen Labs API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/photos", StaticFiles(directory="photos"), name="photos")

@app.post("/upload_video")
async def upload_video(video: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Upload a video file, validate it, save locally, and upload to Twelve Labs
    """
    # Validate file type
    if not video.filename or not video.filename.lower().endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Only MP4 files are supported")
    
    if not video.content_type or not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file")
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.mp4"
    video_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save video file asynchronously
        async with aiofiles.open(video_path, 'wb') as f:
            content = await video.read()
            await f.write(content)
        
        # Validate video using moviepy
        try:
            with VideoFileClip(str(video_path)) as clip:
                duration = clip.duration
                size = video_path.stat().st_size / (1024 * 1024)  # Size in MB
                
                # Get resolution
                width, height = clip.size
                resolution = f"{width}x{height}"
                
                # Validate duration (4 seconds to 10 minutes)
                if duration < 4:
                    # Clean up invalid file
                    os.remove(video_path)
                    raise HTTPException(
                        status_code=400, 
                        detail="Video duration must be at least 4 seconds"
                    )
                
                if duration > 600:  # 10 minutes
                    # Clean up invalid file
                    os.remove(video_path)
                    raise HTTPException(
                        status_code=400, 
                        detail="Video duration must be less than 10 minutes"
                    )
                
        except Exception as e:
            # Clean up file if validation fails
            if video_path.exists():
                os.remove(video_path)
            
            if "duration" in str(e).lower():
                raise HTTPException(status_code=400, detail="Invalid video file or corrupted video")
            else:
                raise HTTPException(status_code=400, detail=f"Error validating video: {str(e)}")
        
        # Upload to Twelve Labs
        try:
            from utils.twelve_labs import TwelveLabsAPI
            twelve_labs = TwelveLabsAPI()
            twelve_labs_result = await twelve_labs.upload_to_twelve_labs(str(video_path))
            task_id = twelve_labs_result["task_id"]
            video_id = twelve_labs_result["video_id"]
            # task_id = "64c91bd8c2e8cc001f23a709"
            # video_id = "687c3fa261fa6d2e4d154327"
        except Exception as e:
            # Clean up file if Twelve Labs upload fails
            if video_path.exists():
                os.remove(video_path)
            raise HTTPException(status_code=500, detail=f"Failed to upload to Twelve Labs: {str(e)}")
        
        # Start background processing pipeline
        if background_tasks:
            pipeline = PipelineProcessor()
            background_tasks.add_task(pipeline.process_pipeline, video_id, task_id, str(video_path))
        
        print(f"📝 [API] Task {task_id} started with background processing")
        
        return JSONResponse({
            "task_id": task_id,
            "video_id": video_id,
            "message": "Processing started"
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up file on any other error
        if video_path.exists():
            os.remove(video_path)
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")

@app.get("/status/{task_id}")
async def check_status(task_id: str):
    """
    Check the status of a processing task
    """
    try:
        if is_task_completed(task_id):
            return {"status": "completed"}
        elif is_task_failed(task_id):
            result = get_analysis_result(task_id)
            return {"status": "failed", "error": result.get("error", "Unknown error")}
        else:
            return {"status": "pending"}
    except Exception as e:
        print(f"❌ [API] Error checking status for task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking status: {str(e)}")

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    """
    Get the analysis result for a completed task or database entry
    """
    try:
        # Check if this is a UUID (entry ID) or a regular task ID
        import re
        is_entry_id = re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', task_id, re.IGNORECASE)
        
        if is_entry_id:
            # This is an entry ID from the database - return directly from database
            print(f"🔍 [API] Detected entry ID: {task_id}")
            return await get_result_from_entry(task_id)
        
        # This is a regular task ID - get from in-memory result and save to database
        print(f"🔍 [API] Detected task ID: {task_id}")
        result = get_analysis_result(task_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if result.get("status") == "failed":
            raise HTTPException(status_code=500, detail=f"Task failed: {result.get('error', 'Unknown error')}")
        
        if result.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Task not completed yet")
        
        # Save to Supabase
        try:
            description = result.get("description", "")
            
            # Define the expected order of angles
            angle_order = ["front", "side", "back", "top"]
            
            # Convert timestamps object to array maintaining order
            timestamps = []
            timestamps_obj = result.get("timestamps", {})
            for angle in angle_order:
                timestamp = timestamps_obj.get(angle)
                if timestamp:
                    timestamps.append(timestamp)  # Save just the timestamp, not "angle: timestamp"
            
            # Get image URLs from screenshots maintaining order
            image_urls = []
            screenshots_obj = result.get("screenshots", {})
            for angle in angle_order:
                url = screenshots_obj.get(angle)
                if url:
                    image_urls.append(url)
            
            # Save to database
            saved_entry = await SupabaseManager.save_model_entry(
                description=description,
                timestamps=timestamps,
                video_url=result.get("video_url"),
                image_urls=image_urls,
                threejs_code=result.get("threejs_code"),
                task_id=task_id
            )
            print(f"✅ [API] Saved task {task_id} to Supabase with entry ID: {saved_entry.get('id')}")
            
            # Return data from database (single source of truth)
            return await get_result_from_entry(saved_entry.get('id'))
            
        except Exception as e:
            print(f"⚠️ [API] Failed to save to Supabase for task {task_id}: {str(e)}")
            # Fallback to in-memory result if database save fails
            return JSONResponse({
                "task_id": task_id,
                "description": result.get("description"),
                "timestamps": result.get("timestamps"),
                "screenshots": result.get("screenshots", {}),
                "video_id": result.get("video_id")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error retrieving result for task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving result: {str(e)}")

@app.post("/generate_3d_model/{task_id}")
async def generate_3d_model(task_id: str):
    """
    Generate 3D model using Gemini API based on database entry
    """
    try:
        # Check if this is a UUID (entry ID) or a regular task ID
        import re
        is_entry_id = re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', task_id, re.IGNORECASE)
        
        if is_entry_id:
            # This is an entry ID from the database - generate directly from entry
            print(f"🔍 [API] Generating 3D model for entry ID: {task_id}")
            return await generate_3d_model_from_entry(task_id)
        
        # This is a regular task ID - find the database entry for this task_id
        print(f"🔍 [API] Generating 3D model for task ID: {task_id}")
        entry = await SupabaseManager.get_entry_by_task_id(task_id)
        
        if not entry:
            raise HTTPException(status_code=404, detail="No database entry found for this task")
        
        # Use the database entry ID for 3D model generation
        return await generate_3d_model_from_entry(entry.get("id"))
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error generating 3D model for task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating 3D model: {str(e)}")

@app.post("/generate_3d_model_from_entry/{entry_id}")
async def generate_3d_model_from_entry(entry_id: str):
    """
    Generate 3D model using Gemini API based on database entry
    """
    try:
        # Get the entry from database
        entry = await SupabaseManager.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Extract data for Gemini
        description = entry.get("description", "")
        image_urls = entry.get("image_urls", [])
        
        if not description:
            raise HTTPException(status_code=400, detail="No description available")
        
        if not image_urls:
            raise HTTPException(status_code=400, detail="No screenshots available")
        
        # Convert image_urls array to screenshots object
        screenshots = {}
        if len(image_urls) >= 4:
            screenshots = {
                "front": image_urls[0] if len(image_urls) > 0 else None,
                "side": image_urls[1] if len(image_urls) > 1 else None,
                "back": image_urls[2] if len(image_urls) > 2 else None,
                "top": image_urls[3] if len(image_urls) > 3 else None
            }
        
        # Generate 3D model using Gemini
        gemini_api = GeminiAPI()
        threejs_code = await gemini_api.generate_threejs_code(description, screenshots)
        
        # Update the entry with Three.js code
        await SupabaseManager.update_entry(entry_id, {"threejs_code": threejs_code})
        print(f"✅ [API] Updated Supabase entry {entry_id} with Three.js code")
        
        return JSONResponse({
            "entry_id": entry_id,
            "threejs_code": threejs_code,
            "status": "success",
            "message": "3D model generated successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error generating 3D model for entry {entry_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating 3D model: {str(e)}")

@app.get("/job_status/{job_id}")
async def get_job_status_endpoint(job_id: str):
    """
    Get processing status for a job (legacy endpoint)
    """
    try:
        # Get the job status
        status = get_job_status(job_id)
        
        if status.get("error"):
            return JSONResponse({
                "job_id": job_id,
                "status": "failed",
                "step": status.get("step", "error"),
                "percent": status.get("percent", 0),
                "error": status.get("error")
            })
        
        if status.get("step") == "completed":
            return JSONResponse({
                "job_id": job_id,
                "status": "completed",
                "step": "completed",
                "percent": 100,
                "message": "Processing completed successfully"
            })
        
        return JSONResponse({
            "job_id": job_id,
            "status": "processing",
            "step": status.get("step", "starting"),
            "percent": status.get("percent", 0),
            "message": status.get("message", "Processing video...")
        })
        
    except Exception as e:
        print(f"❌ [API] Error checking status for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking status: {str(e)}")

@app.get("/game/{job_id}")
async def get_game(job_id: str):
    """
    Get the generated Three.js game for a completed job
    """
    try:
        # Get the job result
        result = get_job_result(job_id)
        
        if not result:
            # Check if job is still processing
            status = get_job_status(job_id)
            if status.get("step") != "completed":
                raise HTTPException(status_code=400, detail="Job not completed yet")
            else:
                raise HTTPException(status_code=404, detail="Job not found")
        
        # Return game data
        return JSONResponse({
            "job_id": job_id,
            "game_html": result.get("game_html"),
            "gltf_url": result.get("gltf_url"),
            "object_description": result.get("object_description"),
            "openscad_code": result.get("openscad_code")
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error retrieving game for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving game: {str(e)}")

@app.get("/analysis/{job_id}")
async def get_analysis(job_id: str):
    """
    Get Twelve Labs analysis results for a job
    """
    try:
        # Get the job result
        result = get_job_result(job_id)
        
        if not result:
            # Check if job is still processing
            status = get_job_status(job_id)
            if status.get("step") != "completed":
                return JSONResponse({
                    "job_id": job_id,
                    "status": "processing",
                    "step": status.get("step", "starting"),
                    "percent": status.get("percent", 0),
                    "message": status.get("message", "Processing analysis...")
                })
            else:
                raise HTTPException(status_code=404, detail="Job not found")
        
        # Return analysis data
        return JSONResponse({
            "job_id": job_id,
            "status": "completed",
            "description": result.get("object_description"),
            "timestamps": result.get("timestamps"),
            "video_id": result.get("video_id"),
            "twelve_labs_task_id": result.get("task_id")
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error retrieving analysis for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "thirteen-labs-api"}

@app.get("/model-entries")
async def get_model_entries():
    """
    Get all model entries from the database
    """
    try:
        entries = await SupabaseManager.get_all_entries()
        return JSONResponse({
            "entries": entries,
            "count": len(entries)
        })
    except Exception as e:
        print(f"❌ [API] Error fetching model entries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching model entries: {str(e)}")

@app.get("/model-entries/{entry_id}")
async def get_model_entry(entry_id: str):
    """
    Get a specific model entry by ID
    """
    try:
        entry = await SupabaseManager.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Model entry not found")
        
        return JSONResponse(entry)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error fetching model entry {entry_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching model entry: {str(e)}")

@app.get("/result-from-entry/{entry_id}")
async def get_result_from_entry(entry_id: str):
    """
    Get a model entry by ID and convert it to ResultResponse format
    """
    try:
        entry = await SupabaseManager.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Model entry not found")
        
        print(f"🔍 [DEBUG] Entry data for {entry_id}:")
        print(f"   Description: {entry.get('description', '')[:100]}...")
        print(f"   Timestamps: {entry.get('timestamps', [])}")
        print(f"   Image URLs: {entry.get('image_urls', [])}")
        print(f"   Entry ID: {entry.get('id')}")
        print(f"   Created at: {entry.get('created_at')}")
        
        # Define the expected order of angles
        angle_order = ["front", "side", "back", "top"]
        
        # Convert timestamps array to object format maintaining order
        timestamps = {
            "front": None,
            "side": None,
            "back": None,
            "top": None
        }
        
        timestamps_array = entry.get("timestamps", [])
        print(f"🔍 [DEBUG] Timestamps array length: {len(timestamps_array)}")
        for i, timestamp in enumerate(timestamps_array):
            if i < len(angle_order):
                timestamps[angle_order[i]] = timestamp
                print(f"   {angle_order[i]}: {timestamp}")
        
        # Convert image_urls array to screenshots object maintaining order
        screenshots = {
            "front": None,
            "side": None,
            "back": None,
            "top": None
        }
        
        image_urls = entry.get("image_urls", [])
        print(f"🔍 [DEBUG] Image URLs array length: {len(image_urls)}")
        for i, image_url in enumerate(image_urls):
            if i < len(angle_order) and image_url:
                # Images are saved as "photos/filename.jpg" in the database
                # Return the path as-is for the frontend to construct the URL
                screenshots[angle_order[i]] = image_url
                print(f"   {angle_order[i]}: {image_url}")
        
        print(f"🔍 [DEBUG] Converted data:")
        print(f"   Timestamps: {timestamps}")
        print(f"   Screenshots: {screenshots}")
        
        # Create ResultResponse format
        result_response = {
            "task_id": entry_id,  # Use entry_id as task_id for compatibility
            "description": entry.get("description", ""),
            "timestamps": timestamps,
            "screenshots": screenshots,
            "threejs_code": entry.get("threejs_code"),
            "video_id": entry.get("video_url", "")  # Use video_url as video_id
        }
        
        print(f"🔍 [DEBUG] Final result response:")
        print(f"   Task ID: {result_response['task_id']}")
        print(f"   Description length: {len(result_response['description'])}")
        print(f"   Timestamps keys: {list(result_response['timestamps'].keys())}")
        print(f"   Screenshots keys: {list(result_response['screenshots'].keys())}")
        print(f"   Has Three.js code: {bool(result_response['threejs_code'])}")
        
        return JSONResponse(result_response)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error fetching result from entry {entry_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching result from entry: {str(e)}")

@app.put("/model-entries/{entry_id}")
async def update_model_entry(entry_id: str, updates: Dict[str, Any]):
    """
    Update a model entry
    """
    try:
        entry = await SupabaseManager.update_entry(entry_id, updates)
        if not entry:
            raise HTTPException(status_code=404, detail="Model entry not found")
        
        return JSONResponse(entry)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error updating model entry {entry_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating model entry: {str(e)}")

@app.delete("/model-entries/{entry_id}")
async def delete_model_entry(entry_id: str):
    """
    Delete a model entry
    """
    try:
        success = await SupabaseManager.delete_entry(entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Model entry not found")
        
        return JSONResponse({"message": "Model entry deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error deleting model entry {entry_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting model entry: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 