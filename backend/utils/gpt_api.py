import os
import httpx
from typing import List, Optional
import json

class GPTAPI:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1"
        
        if not self.api_key:
            print("Warning: OPENAI_API_KEY not set, using mock responses")
    
    async def generate_text(self, model: str, prompt: str, max_tokens: int = 1000) -> str:
        """
        Generate text using GPT models
        """
        try:
            if not self.api_key or self.api_key == "mock":
                return self._get_mock_text_response(model, prompt)
            
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.7
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except Exception as e:
            print(f"GPT API error: {e}")
            return self._get_mock_text_response(model, prompt)
    
    async def generate_with_vision(self, model: str, prompt: str, images: List[str], max_tokens: int = 1000) -> str:
        """
        Generate text using GPT models with vision capabilities
        """
        try:
            if not self.api_key or self.api_key == "mock":
                return self._get_mock_vision_response(model, prompt)
            
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Prepare messages with images
            messages = [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    *[{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}} for img in images]
                ]
            }]
            
            data = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.7
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except Exception as e:
            print(f"GPT Vision API error: {e}")
            return self._get_mock_vision_response(model, prompt)
    
    def _get_mock_text_response(self, model: str, prompt: str) -> str:
        """
        Return mock text response for development
        """
        if "game" in prompt.lower():
            return """
            Game Concept: Car Racing Adventure
            
            Type: 3D Racing Game
            Objective: Drive the car through a winding track, collect coins, and reach the finish line.
            
            Controls: WASD for movement, Space for jump/brake
            Mechanics: Smooth physics, coin collection, obstacle avoidance
            Visual Style: Low-poly 3D with vibrant colors
            """
        elif "openscad" in prompt.lower():
            return """
            // Car model in OpenSCAD
            color([0.8, 0.2, 0.2]) {
                // Main body
                cube([20, 10, 5], center=true);
            }
            color([0.2, 0.2, 0.2]) {
                // Wheels
                translate([8, 6, -2]) cylinder(h=1, r=2);
                translate([8, -6, -2]) cylinder(h=1, r=2);
                translate([-8, 6, -2]) cylinder(h=1, r=2);
                translate([-8, -6, -2]) cylinder(h=1, r=2);
            }
            """
        else:
            return "Mock response for development purposes."
    
    def _get_mock_vision_response(self, model: str, prompt: str) -> str:
        """
        Return mock vision response for development
        """
        return """
        // 3D Model based on image analysis
        color([0.8, 0.2, 0.2]) {
            // Main object body
            cube([15, 8, 4], center=true);
        }
        color([0.2, 0.2, 0.2]) {
            // Details and features
            translate([0, 0, 2]) {
                cube([12, 6, 1], center=true);
            }
        }
        """ 