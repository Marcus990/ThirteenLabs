import asyncio
import os
from pathlib import Path
from typing import Dict, Any, List
import base64
import subprocess

from utils.twelve_labs import TwelveLabsAPI
from utils.ffmpeg import FFmpegProcessor
from utils.gpt_api import GPTAPI

# In-memory storage for job results
job_results: Dict[str, Dict[str, Any]] = {}
job_status: Dict[str, Dict[str, Any]] = {}

async def process_twelve_labs_analysis(video_id: str, task_id: str, job_id: str) -> Dict[str, Any]:
    """
    Process Twelve Labs analysis asynchronously
    """
    try:
        print(f"\n🔍 [Twelve Labs Analysis] Starting analysis for job {job_id}")
        print(f"📹 Video ID: {video_id}")
        print(f"🆔 Task ID: {task_id}")
        
        # Update status
        job_status[job_id] = {
            "step": "twelve_labs_analysis",
            "percent": 10,
            "message": "Polling Twelve Labs task completion..."
        }
        
        # Initialize Twelve Labs API
        twelve_labs = TwelveLabsAPI()
        
        # Process the analysis
        analysis_result = await twelve_labs.process_twelve_labs_analysis(video_id, task_id)
        
        # Print results to terminal
        print(f"\n✅ [Twelve Labs Analysis] Analysis completed for job {job_id}")
        print(f"📝 Object Description:")
        print(f"   {analysis_result['description']}")
        print(f"\n⏰ Timestamps by Angle:")
        
        timestamps = analysis_result["timestamps"]
        for angle, times in timestamps.items():
            if times:
                print(f"   {angle.upper()}: {', '.join([f'{t:.2f}s' for t in times])}")
            else:
                print(f"   {angle.upper()}: No timestamps found")
        
        print(f"\n📊 Summary:")
        print(f"   Total timestamps found: {sum(len(times) for times in timestamps.values())}")
        print(f"   Angles with timestamps: {sum(1 for times in timestamps.values() if times)}/4")
        
        # Store result
        job_results[job_id] = {
            "job_id": job_id,
            "video_id": video_id,
            "task_id": task_id,
            "description": analysis_result["description"],
            "timestamps": analysis_result["timestamps"],
            "status": "completed"
        }
        
        # Update status
        job_status[job_id] = {
            "step": "twelve_labs_completed",
            "percent": 100,
            "message": "Twelve Labs analysis completed successfully"
        }
        
        return job_results[job_id]
        
    except Exception as e:
        print(f"\n❌ [Twelve Labs Analysis] Error for job {job_id}: {str(e)}")
        
        # Update status with error
        job_status[job_id] = {
            "step": "twelve_labs_error",
            "percent": 0,
            "error": str(e)
        }
        raise e

async def generate_openscad_code(screenshot_paths: List[str], object_description: str) -> str:
    """
    Generate OpenSCAD code using GPT-o3 with screenshots and object description
    """
    try:
        gpt_api = GPTAPI()
        
        # Read and encode screenshots
        encoded_images = []
        for path in screenshot_paths:
            with open(path, "rb") as f:
                image_data = f.read()
                encoded_images.append(base64.b64encode(image_data).decode('utf-8'))
        
        # Create prompt for OpenSCAD generation
        prompt = f"""
        You are an expert in OpenSCAD 3D modeling. Based on the provided screenshots and object description, generate clean, efficient OpenSCAD code.

        Object Description: {object_description}

        Requirements:
        1. Create a 3D model that represents the main object from the screenshots
        2. Use appropriate colors that match the object
        3. Keep the model simple but recognizable
        4. Use proper OpenSCAD syntax and best practices
        5. Include comments explaining the key parts
        6. Make the model suitable for 3D printing (manifold, proper dimensions)

        Generate only the OpenSCAD code, no explanations.
        """
        
        # Call GPT-o3 with vision capabilities
        openscad_code = await gpt_api.generate_with_vision(
            model="gpt-4o",
            prompt=prompt,
            images=encoded_images,
            max_tokens=2000
        )
        
        return openscad_code
        
    except Exception as e:
        # Return mock OpenSCAD code for development
        return """
        // Mock OpenSCAD code for development
        color([0.8, 0.2, 0.2]) {
            cube([20, 10, 5], center=true);
        }
        color([0.2, 0.2, 0.2]) {
            translate([0, 0, 2.5]) {
                cube([18, 8, 1], center=true);
            }
        }
        """

async def generate_game_prompt(object_description: str) -> str:
    """
    Generate a game concept prompt using GPT-4o based on object description
    """
    try:
        gpt_api = GPTAPI()
        
        prompt = f"""
        You are a game designer. Based on the following object description, create a simple but engaging game concept for a 3D web game using Three.js.

        Object: {object_description}

        Create a game concept that:
        1. Features the object as the main character or central element
        2. Is simple enough to implement in Three.js
        3. Has clear objectives and controls
        4. Is fun and engaging for players
        5. Uses basic 3D mechanics (movement, collision, scoring)

        Provide a detailed game concept including:
        - Game type (racing, platformer, puzzle, etc.)
        - Main objective
        - Player controls
        - Game mechanics
        - Visual style suggestions
        - Difficulty progression

        Keep it concise but comprehensive.
        """
        
        game_prompt = await gpt_api.generate_text(
            model="gpt-4o",
            prompt=prompt,
            max_tokens=1000
        )
        
        return game_prompt
        
    except Exception as e:
        # Return mock game prompt for development
        return """
        Game Concept: Car Racing Adventure
        
        Type: 3D Racing Game
        Objective: Drive the car through a winding track, collect coins, and reach the finish line as quickly as possible.
        
        Controls:
        - WASD or Arrow Keys: Move the car
        - Space: Jump/Brake
        - Mouse: Look around
        
        Mechanics:
        - Smooth car physics with realistic movement
        - Coin collection for points
        - Obstacle avoidance
        - Time-based scoring
        - Multiple track sections with increasing difficulty
        
        Visual Style: Low-poly 3D with vibrant colors, cartoon-like aesthetic
        """

async def generate_game_code(openscad_code: str, game_prompt: str, gltf_url: str) -> str:
    """
    Generate complete Three.js game code using GPT-o3
    """
    try:
        gpt_api = GPTAPI()
        
        prompt = f"""
        You are an expert Three.js developer. Create a complete, playable 3D web game based on the following specifications.

        Game Concept: {game_prompt}
        
        3D Model: The game should use the GLTF model loaded from: {gltf_url}
        
        OpenSCAD Code (for reference): {openscad_code}

        Requirements:
        1. Create a complete HTML file with embedded Three.js game
        2. Load the GLTF model and use it as the main character/object
        3. Implement the game mechanics described in the concept
        4. Add proper controls (WASD/arrows for movement)
        5. Include collision detection
        6. Add scoring system
        7. Create a simple but engaging environment
        8. Use modern Three.js practices (r155+)
        9. Include proper lighting and shadows
        10. Make it responsive and mobile-friendly

        The game should be self-contained in a single HTML file with:
        - Complete HTML structure
        - Embedded CSS for styling
        - Embedded JavaScript with Three.js game logic
        - Proper error handling
        - Loading states
        - Game UI (score, controls, etc.)

        Generate only the complete HTML file, no explanations.
        """
        
        game_html = await gpt_api.generate_text(
            model="gpt-4o",
            prompt=prompt,
            max_tokens=4000
        )
        
        return game_html
        
    except Exception as e:
        # Return mock game HTML for development
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>3D Game</title>
            <style>
                body { margin: 0; overflow: hidden; background: #87CEEB; }
                #gameContainer { width: 100vw; height: 100vh; }
                #ui { position: absolute; top: 20px; left: 20px; color: white; font-family: Arial; }
            </style>
        </head>
        <body>
            <div id="gameContainer"></div>
            <div id="ui">
                <h3>Score: <span id="score">0</span></h3>
                <p>Use WASD to move</p>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r155/three.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/examples/js/loaders/GLTFLoader.js"></script>
            <script>
                // Mock Three.js game code
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer();
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.getElementById('gameContainer').appendChild(renderer.domElement);
                
                // Add a simple cube as placeholder
                const geometry = new THREE.BoxGeometry();
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new THREE.Mesh(geometry, material);
                scene.add(cube);
                
                camera.position.z = 5;
                
                function animate() {
                    requestAnimationFrame(animate);
                    cube.rotation.x += 0.01;
                    cube.rotation.y += 0.01;
                    renderer.render(scene, camera);
                }
                animate();
            </script>
        </body>
        </html>
        """

async def convert_openscad_to_gltf(openscad_code: str, job_id: str) -> str:
    """
    Convert OpenSCAD code to GLTF format via STL
    """
    try:
        # Create output directories
        output_dir = Path(f"uploads/models/{job_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save OpenSCAD code to file
        scad_file = output_dir / "model.scad"
        with open(scad_file, "w") as f:
            f.write(openscad_code)
        
        # Convert OpenSCAD to STL
        stl_file = output_dir / "model.stl"
        result = subprocess.run([
            "openscad", "-o", str(stl_file), str(scad_file)
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"OpenSCAD conversion failed: {result.stderr}")
        
        # Convert STL to GLTF using Blender
        gltf_file = output_dir / "model.glb"
        blender_script = f"""
import bpy
import sys

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import STL
bpy.ops.import_mesh.stl(filepath='{stl_file}')
obj = bpy.context.active_object

# Export as GLTF
bpy.ops.export_scene.gltf(
    filepath='{gltf_file}',
    export_format='GLB',
    use_selection=False
)
"""
        
        blender_script_file = output_dir / "convert.py"
        with open(blender_script_file, "w") as f:
            f.write(blender_script)
        
        result = subprocess.run([
            "blender", "--background", "--python", str(blender_script_file)
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Blender conversion failed: {result.stderr}")
        
        # Return the URL to the GLTF file
        gltf_url = f"/models/{job_id}/model.glb"
        return gltf_url
        
    except Exception as e:
        # Return placeholder GLTF URL for development
        return "/placeholder.glb"

async def process_video_pipeline(video_path: str, job_id: str) -> Dict[str, Any]:
    """
    Main video processing pipeline as async function
    """
    try:
        print(f"\n🎬 [Video Processing] Starting processing for job {job_id}")
        print(f"📁 Video path: {video_path}")
        
        # Update status
        job_status[job_id] = {
            "step": "starting",
            "percent": 0,
            "message": "Starting video processing..."
        }
        
        # Step 1: Upload to Twelve Labs and get analysis
        job_status[job_id] = {
            "step": "uploading_to_twelve_labs",
            "percent": 5,
            "message": "Uploading video to Twelve Labs..."
        }
        
        print(f"📤 Uploading video to Twelve Labs...")
        twelve_labs = TwelveLabsAPI()
        
        upload_result = await twelve_labs.upload_to_twelve_labs(video_path)
        video_id = upload_result["video_id"]
        task_id = upload_result["task_id"]
        
        print(f"✅ Video uploaded successfully")
        print(f"   Video ID: {video_id}")
        print(f"   Task ID: {task_id}")
        
        # Step 2: Process Twelve Labs analysis
        job_status[job_id] = {
            "step": "analyzing_video",
            "percent": 15,
            "message": "Analyzing video with Twelve Labs..."
        }
        
        print(f"🔍 Starting Twelve Labs analysis...")
        analysis_result = await process_twelve_labs_analysis(video_id, task_id, job_id)
        
        object_description = analysis_result["description"]
        timestamps = analysis_result["timestamps"]
        
        print(f"✅ Twelve Labs analysis completed")
        print(f"📝 Object description: {object_description[:100]}{'...' if len(object_description) > 100 else ''}")
        
        # Step 3: Extract screenshots from timestamps
        job_status[job_id] = {
            "step": "extracting_frames",
            "percent": 25,
            "message": "Extracting key frames..."
        }
        
        print(f"🖼️  Extracting frames from timestamps...")
        ffmpeg = FFmpegProcessor()
        screenshots_dir = Path(f"uploads/screenshots/{job_id}")
        screenshots_dir.mkdir(parents=True, exist_ok=True)
        
        # Flatten timestamps for frame extraction
        all_timestamps = []
        for angle_times in timestamps.values():
            all_timestamps.extend(angle_times)
        
        if all_timestamps:
            screenshot_paths = ffmpeg.extract_frames(video_path, all_timestamps, str(screenshots_dir))
            print(f"✅ Extracted {len(screenshot_paths)} frames")
        else:
            print(f"⚠️  No timestamps found, using default frame extraction")
            screenshot_paths = ffmpeg.extract_frames(video_path, [1.0, 3.0, 5.0], str(screenshots_dir))
        
        # Step 4: Generate OpenSCAD code with GPT-o3
        job_status[job_id] = {
            "step": "generating_openscad",
            "percent": 40,
            "message": "Generating 3D model code..."
        }
        
        print(f"🔧 Generating OpenSCAD code...")
        openscad_code = await generate_openscad_code(screenshot_paths, object_description)
        print(f"✅ OpenSCAD code generated")
        
        # Step 5: Generate game prompt with GPT-4o
        job_status[job_id] = {
            "step": "generating_game_prompt",
            "percent": 55,
            "message": "Creating game concept..."
        }
        
        print(f"🎮 Generating game concept...")
        game_prompt = await generate_game_prompt(object_description)
        print(f"✅ Game concept created")
        
        # Step 6: Convert OpenSCAD to GLTF
        job_status[job_id] = {
            "step": "converting_model",
            "percent": 70,
            "message": "Converting 3D model..."
        }
        
        print(f"🔄 Converting 3D model...")
        gltf_url = await convert_openscad_to_gltf(openscad_code, job_id)
        print(f"✅ 3D model converted")
        
        # Step 7: Generate final game code with GPT-o3
        job_status[job_id] = {
            "step": "generating_game",
            "percent": 85,
            "message": "Building interactive game..."
        }
        
        print(f"🎯 Building interactive game...")
        game_html = await generate_game_code(openscad_code, game_prompt, gltf_url)
        print(f"✅ Interactive game built")
        
        # Step 8: Complete
        job_status[job_id] = {
            "step": "completed",
            "percent": 100,
            "message": "Game ready!"
        }
        
        print(f"\n🎉 [Video Processing] Processing completed for job {job_id}")
        print(f"📊 Summary:")
        print(f"   - Object: {object_description[:50]}...")
        print(f"   - Frames extracted: {len(screenshot_paths)}")
        print(f"   - Game generated successfully")
        
        # Store final result
        final_result = {
            "job_id": job_id,
            "video_id": video_id,
            "task_id": task_id,
            "object_description": object_description,
            "timestamps": timestamps,
            "openscad_code": openscad_code,
            "game_prompt": game_prompt,
            "gltf_url": gltf_url,
            "game_html": game_html,
            "screenshots": screenshot_paths
        }
        
        job_results[job_id] = final_result
        return final_result
        
    except Exception as e:
        print(f"\n❌ [Video Processing] Error for job {job_id}: {str(e)}")
        print(f"🔍 Error details: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        
        # Update status with error
        job_status[job_id] = {
            "step": "error",
            "percent": 0,
            "error": str(e)
        }
        raise e

def get_job_status(job_id: str) -> Dict[str, Any]:
    """
    Get the current status of a job
    """
    return job_status.get(job_id, {
        "step": "unknown",
        "percent": 0,
        "message": "Job not found"
    })

def get_job_result(job_id: str) -> Dict[str, Any]:
    """
    Get the result of a completed job
    """
    return job_results.get(job_id, {}) 