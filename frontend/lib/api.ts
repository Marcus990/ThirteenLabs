import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds to match backend timeout
});

export interface UploadResponse {
  task_id: string;
  video_id: string;
  message: string;
}

export interface StatusResponse {
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface ResultResponse {
  task_id: string;
  description: string;
  timestamps: {
    front: string | null;
    side: string | null;
    back: string | null;
    top: string | null;
  };
  screenshots?: {
    front?: string;
    side?: string;
    back?: string;
    top?: string;
  };
  threejs_code?: string;
  video_id: string;
}

export interface GameResponse {
  job_id: string;
  game_html?: string;
  gltf_url?: string;
  object_description?: string;
  openscad_code?: string;
}

export const uploadVideo = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);

  const response = await api.post<UploadResponse>('/upload_video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const checkStatus = async (taskId: string): Promise<StatusResponse> => {
  const response = await api.get<StatusResponse>(`/status/${taskId}`);
  return response.data;
};

export const getResult = async (taskId: string): Promise<ResultResponse> => {
  const response = await api.get<ResultResponse>(`/result/${taskId}`);
  return response.data;
};

export const getResultFromEntry = async (entryId: string): Promise<ResultResponse> => {
  const response = await api.get<ResultResponse>(`/result-from-entry/${entryId}`);
  return response.data;
};

export const generate3DModel = async (taskId: string): Promise<{
  task_id: string;
  threejs_code: string;
  status: string;
  message: string;
}> => {
  const response = await api.post(`/generate_3d_model/${taskId}`);
  return response.data;
};

export const generate3DModelFromEntry = async (entryId: string): Promise<{
  entry_id: string;
  threejs_code: string;
  status: string;
  message: string;
}> => {
  const response = await api.post(`/generate_3d_model_from_entry/${entryId}`);
  return response.data;
};

// Legacy endpoints for backward compatibility
export const checkJobStatus = async (jobId: string): Promise<StatusResponse> => {
  const response = await api.get<StatusResponse>(`/job_status/${jobId}`);
  return response.data;
};

export const getGame = async (jobId: string): Promise<GameResponse> => {
  const response = await api.get<GameResponse>(`/game/${jobId}`);
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string; service: string }> => {
  const response = await api.get('/health');
  return response.data;
};

// Polling utility function
export const pollTaskStatus = async (
  taskId: string,
  onStatusUpdate?: (status: StatusResponse) => void,
  maxAttempts: number = 100, // 5 minutes with 3-second intervals
  interval: number = 3000
): Promise<ResultResponse> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const status = await checkStatus(taskId);
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      if (status.status === 'completed') {
        return await getResult(taskId);
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Task failed');
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Task not found');
      }
      throw error;
    }
  }
  
  throw new Error('Task polling timed out');
};

// Model Entries API (Supabase)
export interface ModelEntry {
  id: string;
  description: string;
  timestamps: string[];
  video_url?: string;
  image_urls: string[];
  threejs_code?: string;
  created_at: string;
}

export interface ModelEntriesResponse {
  entries: ModelEntry[];
  count: number;
}

export const getModelEntries = async (): Promise<ModelEntriesResponse> => {
  const response = await api.get<ModelEntriesResponse>('/model-entries');
  return response.data;
};

export const getModelEntry = async (entryId: string): Promise<ModelEntry> => {
  const response = await api.get<ModelEntry>(`/model-entries/${entryId}`);
  return response.data;
};

export const updateModelEntry = async (entryId: string, updates: Partial<ModelEntry>): Promise<ModelEntry> => {
  const response = await api.put<ModelEntry>(`/model-entries/${entryId}`, updates);
  return response.data;
};

export const deleteModelEntry = async (entryId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/model-entries/${entryId}`);
  return response.data;
}; 