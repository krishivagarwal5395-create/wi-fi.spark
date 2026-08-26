
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { WiFiSettings } from '../types';

interface RouterScannerProps {
  onScanSuccess: (settings: Partial<WiFiSettings>) => void;
  onClose: () => void;
}

const RouterScanner: React.FC<RouterScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCapturing(true);
      } catch (err) {
        setError('Could not access camera. Please ensure you have granted permission.');
        console.error(err);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setError(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: "Extract the Wi-Fi SSID and Password from this router sticker. Return ONLY a JSON object with keys 'ssid' and 'password'. If you can't find them, return empty strings." }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.ssid) {
        onScanSuccess({
          ssid: result.ssid,
          password: result.password || '',
          encryption: 'WPA' // Default to WPA as it's most common on labels
        });
        onClose();
      } else {
        setError("Could not find Wi-Fi details. Please try a clearer photo.");
      }
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
            <h2 className="font-bold text-gray-900">AI Router Scanner</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="relative aspect-square bg-black overflow-hidden">
          {isCapturing ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {/* Viewfinder overlay */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
              <div className="text-white/70 text-xs font-medium bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest">
                Center Router Label
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <Zap className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
              </div>
              <p className="text-white font-bold text-lg drop-shadow-md">AI Reading Sticker...</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <button
            onClick={captureAndAnalyze}
            disabled={isAnalyzing || !isCapturing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            <span>{isAnalyzing ? 'Processing...' : 'Capture Label'}</span>
          </button>
          
          <p className="text-xs text-center text-gray-500 leading-relaxed px-4">
            Point your camera at the Wi-Fi info sticker on your router. Our AI will automatically detect the name and password.
          </p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default RouterScanner;
