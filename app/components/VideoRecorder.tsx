'use client';

import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoRecorderProps {
  wsUrl?: string;
}

export default function VideoRecorder({ wsUrl = "ws://qnxpi-andrew.local:8080/" }: VideoRecorderProps) {
  const [status, setStatus] = useState('Connecting...');
  const [frameCount, setFrameCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [fileSize, setFileSize] = useState('0 MB');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState('Processing...');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    // Initialize FFmpeg
    const initFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on('log', ({ message }: { message: string }) => {
          console.log('FFmpeg:', message);
        });

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setConversionProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js', 'text/javascript'),
          wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
        });
        
        console.log('FFmpeg loaded successfully');
        setFfmpegLoaded(true);
        setStatus('Ready to connect');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setStatus('FFmpeg failed to load');
      }
    };

    initFFmpeg();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const connect = () => {
    if (isConnected) {
      disconnect();
      return;
    }

    setStatus('Connecting...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      setIsConnected(true);
      setStatus("Connected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Connection Error");
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setIsConnected(false);
      setStatus("Disconnected");
      stopRecording();
    };

    ws.onmessage = ({ data }) => {
      handleFrame(data);
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
    setStatus("Disconnected");
    stopRecording();
  };

  const handleFrame = (data: string) => {
    setFrameCount((prev: number) => prev + 1);
    drawFrame(data);
  };

  const drawFrame = (base64Data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const aspectRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      if (aspectRatio > 1) {
        drawHeight = drawWidth / aspectRatio;
      } else {
        drawWidth = drawHeight * aspectRatio;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };

    const formats = [
      `data:image/bmp;base64,${base64Data}`,
      `data:image/jpeg;base64,${base64Data}`,
      `data:image/png;base64,${base64Data}`
    ];

    let formatIndex = 0;
    img.onerror = () => {
      formatIndex++;
      if (formatIndex < formats.length) {
        img.src = formats[formatIndex];
      } else {
        console.error("Failed to load image in any format");
      }
    };

    img.src = formats[0];
  };

  const startRecording = () => {
    if (!isConnected || !canvasRef.current) return;

    recordedChunksRef.current = [];
    setIsRecording(true);
    startTimeRef.current = Date.now();

    const stream = canvasRef.current.captureStream(30);
    
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          updateFileSize();
        }
      };

      mediaRecorder.onstop = () => {
        createVideoBlob();
      };

      mediaRecorder.start(1000);

      recordingIntervalRef.current = setInterval(() => {
        updateRecordingTime();
      }, 1000);

      setStatus("Recording...");
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setStatus("Recording stopped");
  };

  const updateRecordingTime = () => {
    if (!startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const updateFileSize = () => {
    const totalSize = recordedChunksRef.current.reduce((size: number, chunk: Blob) => size + chunk.size, 0);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeMB} MB`);
  };

  const createVideoBlob = async () => {
    setShowDownload(true);
    setConversionStatus('Processing video...');
    setConversionProgress(0);

    try {
      const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      
      if (!ffmpegRef.current || !ffmpegLoaded) {
        throw new Error('FFmpeg not loaded');
      }

      // Write the WebM file to FFmpeg's virtual filesystem
      await ffmpegRef.current.writeFile('input.webm', await fetchFile(webmBlob));

      // Convert to MP4 using FFmpeg
      await ffmpegRef.current.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        'output.mp4'
      ]);

      // Read the converted MP4 file
      const data = await ffmpegRef.current.readFile('output.mp4');
      const mp4Blob = new Blob([data], { type: 'video/mp4' });
      
      const url = URL.createObjectURL(mp4Blob);
      const filename = `recorded_video_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`;
      
      setDownloadUrl(url);
      setDownloadFilename(filename);
      setConversionStatus('MP4 video ready for download!');
      setConversionProgress(100);
      setStatus("Video ready for download");
    } catch (error) {
      console.error('Error converting video:', error);
      setConversionStatus('Error converting video. Please try again.');
    }
  };

  const downloadVideo = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container">
      <h1>Video Stream Recorder</h1>
      
      <div className="status-panel">
        <div className="status">{status}</div>
        <div className="stats">
          <span>Frames received: {frameCount}</span>
          <span>Recording time: {recordingTime}</span>
          <span>File size: {fileSize}</span>
        </div>
      </div>
      
      <div className="video-container">
        <canvas 
          ref={canvasRef}
          id="videoCanvas" 
          width={300} 
          height={300}
        />
      </div>
      
      <div className="controls">
        <button 
          className="btn" 
          onClick={connect}
          disabled={!ffmpegLoaded}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <button 
          className={`btn ${isRecording ? 'recording' : ''}`}
          disabled={!isConnected || isRecording || !ffmpegLoaded}
          onClick={startRecording}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button 
          className="btn" 
          disabled={!isRecording}
          onClick={stopRecording}
        >
          Stop Recording
        </button>
        <button 
          className="btn" 
          disabled={!downloadUrl}
          onClick={downloadVideo}
        >
          Download MP4
        </button>
      </div>
      
      {showDownload && (
        <div className="download-section">
          <h3>Recording Complete!</h3>
          <p>{conversionStatus}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${conversionProgress}%` }}
            />
          </div>
          {downloadUrl && (
            <a 
              className="download-link" 
              href={downloadUrl}
              download={downloadFilename}
            >
              Download MP4 Video
            </a>
          )}
        </div>
      )}
    </div>
  );
} 