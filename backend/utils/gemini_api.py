import os
import base64
import httpx
import re
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GeminiAPI:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent"
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

    def strip_markdown_code_blocks(self, text: str) -> str:
        """
        Strip markdown code block formatting from text
        Removes ```javascript, ```js, ```, etc. from the beginning and end
        """
        # Remove leading and trailing whitespace
        text = text.strip()
        
        # Pattern to match markdown code blocks with optional language identifier
        # Matches: ```javascript, ```js, ```, etc.
        pattern = r'^```(?:javascript|js|typescript|ts)?\s*\n?(.*?)\n?```$'
        
        # Try to match the pattern
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        
        if match:
            # Return the content inside the code block
            return match.group(1).strip()
        else:
            # If no code block found, return the original text
            return text

    def strip_imports_and_exports(self, code: str) -> str:
        """
        Strip import and export statements from Three.js code, even if they span multiple lines
        """
        import re

        # Remove multi-line import statements
        code = re.sub(r'^import[\s\S]+?from\s+["\'].*?["\'];?\s*', '', code, flags=re.MULTILINE)

        # Remove multi-line export statements (e.g. export { model };)
        code = re.sub(r'^export\s+\{[\s\S]*?\};?\s*', '', code, flags=re.MULTILINE)

        return code.strip()

    def encode_image(self, image_path: str) -> str:
        """
        Encode an image file to base64
        """
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"❌ Error encoding image {image_path}: {str(e)}")
            return None

    async def generate_threejs_code(self, description: str, screenshot_paths: Dict[str, str]) -> str:
        try:
            print(f"🤖 [Gemini] Generating Three.js code...")
            print(f"📝 Description: {description[:100]}{'...' if len(description) > 100 else ''}")
            print(f"📸 Screenshots received: {list(screenshot_paths.keys())}")
            
            parts: List[Dict[str, Any]] = [{
                "text": f"""
                You are a senior Three.js engineer. Based on the following object and motion description and four reference images (top, front, side, back), generate clean, modular Three.js code to reconstruct the object in 3D, including animated motion if applicable.

                Description:
                {description}

                Output Requirements:
                - Output **only** valid Three.js code in **JavaScript ES6 module style** — no HTML, comments, or explanatory text.
                - The code must be **self-contained** and export a single `THREE.Group()` named `model` using `export {{ model }};` at the end.
                - If the object is animated, include appropriate `THREE.AnimationClip` and `THREE.AnimationMixer` setup inside the code to animate the model group using keyframe tracks.
                - Define all keyframe tracks (position, rotation, scale) based on motion details described (e.g., translation, rotation, trajectory, speed, duration).
                - Do not create an AnimationMixer inside the code. Instead, define any THREE.AnimationClip instances as needed and assign them to model.userData.clips = [ ... ]. The rendering engine will create the AnimationMixer externally and play these clips. Example output:
                model.userData.clips = [translationClip, rotationClip];
                export {{ model }};

                Geometry and Structure:
                - Use only basic geometry primitives from Three.js: `BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `TubeGeometry`, `ExtrudeGeometry`, `PlaneGeometry`, etc.
                - Group all components into a single `THREE.Group()` named `model`.
                - Subcomponents can be added as their own `THREE.Group()` instances and then attached to `model`.

                Materials:
                - Use `MeshStandardMaterial` only.
                - Set appropriate `color`, `roughness`, and `metalness` values that reflect the materials described (e.g. metal, plastic, wood, glass).

                Positioning and Scaling:
                - Ensure the model is centered around the origin (0, 0, 0).
                - Scale the model to fit within a camera view positioned 10–15 units away.
                - Use reasonable real-world proportions based on the description and reference views.

                Motion Rendering (if motion is present in the description):
                - Detect and implement animation if the description includes any movement types (e.g., rolling, tilting, bouncing, rotating).
                - Animate the model or subcomponents based on the described motion type, direction, duration, and trajectory.
                - If the motion is continuous or repetitive, use looping keyframe animations. If it's a one-time motion, animate once on load.
                - Represent translation (position), rotation (Euler angles or quaternion), or scaling as keyframe tracks in the animation.
                - Example: If the object rolls forward 3 meters in 2 seconds, create a `VectorKeyframeTrack` animating the `position.z` from 0 to 3 over 2 seconds.

                Constraints:
                - Do **not** include HTML, CSS, import statements, or scene/camera setup.
                - Do **not** include comments or explanation — only the pure Three.js JavaScript code for the model and animation.
                """
            }]

            image_count = 0
            for angle, image_path in screenshot_paths.items():
                if image_path and os.path.exists(image_path):
                    encoded_image = self.encode_image(image_path)
                    if encoded_image:
                        parts.append({
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": encoded_image
                            }
                        })
                        print(f"✅ Added {angle} image")
                        image_count += 1
                    else:
                        print(f"⚠️ Failed to encode {angle} image")
                else:
                    print(f"⚠️ File not found: {angle} → {image_path}")

            print(f"📊 Total images being sent to Gemini: {image_count}")

            payload = {
                "contents": [{
                    "role": "user",
                    "parts": parts
                }],
                "generationConfig": {
                    "temperature": 1.0,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 16000
                }
            }

            url = f"{self.base_url}?key={self.api_key}"

            async with httpx.AsyncClient(timeout=300.0) as client:
                print(f"🌐 Sending POST request to Gemini...")
                response = await client.post(url, json=payload)

                print(f"📬 Status: {response.status_code}")
                print(f"📦 Raw Response: {response.text[:300]}...")

                if response.status_code != 200:
                    raise Exception(f"Gemini API error: {response.status_code} - {response.text}")

                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            if "text" in part:
                                raw_text = part["text"]
                                print("✅ Three.js code received from Gemini")
                                
                                # Strip markdown code block formatting
                                cleaned_code = self.strip_markdown_code_blocks(raw_text)
                                print(f"🧹 Cleaned code length: {len(cleaned_code)} characters")
                                
                                # Strip import and export statements
                                cleaned_code = self.strip_imports_and_exports(cleaned_code)
                                print(f"🧹 Cleaned code length after stripping imports/exports: {len(cleaned_code)} characters")
                                
                                return cleaned_code
                raise Exception("Gemini returned unexpected response format")

        except Exception as e:
            print(f"❌ Gemini error: {e}")
            return """
                // Fallback Three.js code
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer();
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.body.appendChild(renderer.domElement);

                // Create a simple cube as placeholder
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
                """ 