import os
from supabase import create_client, Client
from typing import Dict, Any, List, Optional
from datetime import datetime

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

class SupabaseManager:
    """Manager class for Supabase database operations"""
    
    @staticmethod
    async def save_model_entry(
        description: str,
        timestamps: List[str],
        video_url: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        threejs_code: Optional[str] = None,
        task_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save a model entry to the database
        
        Args:
            description: Text description of the object
            timestamps: Array of timestamps as strings
            video_url: URL to the video file
            image_urls: Array of image URLs (top, front, side, back)
            threejs_code: Raw Three.js code as string
            task_id: TwelveLabs task ID for linking
            
        Returns:
            Dictionary containing the saved entry data
        """
        try:
            data = {
                "description": description,
                "timestamps": timestamps,
                "video_url": video_url,
                "image_urls": image_urls or [],
                "threejs_code": threejs_code,
                "task_id": task_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            result = supabase.table("model_entries").insert(data).execute()
            
            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to insert data into database")
                
        except Exception as e:
            print(f"❌ [Supabase] Error saving model entry: {str(e)}")
            raise
    
    @staticmethod
    async def get_all_entries() -> List[Dict[str, Any]]:
        """
        Get all model entries from the database
        
        Returns:
            List of all model entries
        """
        try:
            result = supabase.table("model_entries").select("*").order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            print(f"❌ [Supabase] Error fetching model entries: {str(e)}")
            raise
    
    @staticmethod
    async def get_entry_by_id(entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific model entry by ID
        
        Args:
            entry_id: UUID of the entry
            
        Returns:
            Model entry data or None if not found
        """
        try:
            result = supabase.table("model_entries").select("*").eq("id", entry_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"❌ [Supabase] Error fetching model entry {entry_id}: {str(e)}")
            raise
    
    @staticmethod
    async def get_entry_by_task_id(task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific model entry by TwelveLabs task ID
        
        Args:
            task_id: TwelveLabs task ID
            
        Returns:
            Model entry data or None if not found
        """
        try:
            result = supabase.table("model_entries").select("*").eq("task_id", task_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"❌ [Supabase] Error fetching model entry by task_id {task_id}: {str(e)}")
            raise
    
    @staticmethod
    async def entry_exists_by_task_id(task_id: str) -> bool:
        """
        Check if a model entry exists for a given task_id
        
        Args:
            task_id: TwelveLabs task ID
            
        Returns:
            True if entry exists, False otherwise
        """
        try:
            result = supabase.table("model_entries").select("id").eq("task_id", task_id).execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"❌ [Supabase] Error checking if entry exists for task_id {task_id}: {str(e)}")
            raise
    
    @staticmethod
    async def get_all_entries_by_task_id(task_id: str) -> List[Dict[str, Any]]:
        """
        Get all model entries for a given task_id (useful for finding duplicates)
        
        Args:
            task_id: TwelveLabs task ID
            
        Returns:
            List of all model entries for this task_id
        """
        try:
            result = supabase.table("model_entries").select("*").eq("task_id", task_id).order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            print(f"❌ [Supabase] Error fetching entries by task_id {task_id}: {str(e)}")
            raise
    
    @staticmethod
    async def update_entry(
        entry_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a model entry
        
        Args:
            entry_id: UUID of the entry to update
            updates: Dictionary of fields to update
            
        Returns:
            Updated model entry data or None if not found
        """
        try:
            result = supabase.table("model_entries").update(updates).eq("id", entry_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"❌ [Supabase] Error updating model entry {entry_id}: {str(e)}")
            raise
    
    @staticmethod
    async def delete_entry(entry_id: str) -> bool:
        """
        Delete a model entry
        
        Args:
            entry_id: UUID of the entry to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            result = supabase.table("model_entries").delete().eq("id", entry_id).execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"❌ [Supabase] Error deleting model entry {entry_id}: {str(e)}")
            raise 