import React, { useRef, useState, useEffect } from "react";

type CaptureType = "owner" | "banner" | "ownerWithBanner";

interface OwnerBannerCaptureProps {
  captureType?: CaptureType;
  onSubmit: (data: {
    photo: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    timestamp?: string;
    photoFile?: File;
  }) => void;
}

const OwnerBannerCapture: React.FC<OwnerBannerCaptureProps> = ({ captureType = "ownerWithBanner", onSubmit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    if (captureType === "ownerWithBanner" || captureType === "owner") {
      getLocation();
    }
    stopCamera();
    startCamera();
    return () => {
      console.log("[OwnerBannerCapture] Cleanup: Stopping camera on unmount");
      stopCamera();
    };
    // eslint-disable-next-line
  }, [facingMode, captureType]);

  // Add cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log("[OwnerBannerCapture] Component unmounting: Cleaning up camera resources");
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera.");
    }
  };

  const stopCamera = () => {
    console.log("[OwnerBannerCapture] Stopping camera...", { hasStream: !!stream });
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log("[OwnerBannerCapture] Stopping track:", track.kind);
        track.stop();
      });
      setStream(null);
    }
    // Also clear the video source to ensure camera is released
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      let address = "";
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        address = data.display_name || "";
      } catch {}
      setLocation({ latitude, longitude, address });
    });
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    setTimestamp(`${dateStr} ${timeStr}`);
    // Overlay logic per captureType
    if (captureType === "ownerWithBanner") {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(255, 140, 0, 0.8)";
      ctx.fillRect(0, canvasRef.current.height - 60, canvasRef.current.width, 60);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Location: ${location?.address || "Unknown"}`, 10, canvasRef.current.height - 40);
      ctx.fillText(`Date: ${dateStr} Time: ${timeStr}`, 10, canvasRef.current.height - 20);
    } else if (captureType === "owner") {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(80, 80, 255, 0.7)";
      ctx.fillRect(0, canvasRef.current.height - 30, canvasRef.current.width, 30);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Date: ${dateStr} Time: ${timeStr}`, 10, canvasRef.current.height - 10);
    } else if (captureType === "banner") {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(0, 180, 80, 0.7)";
      ctx.fillRect(0, canvasRef.current.height - 30, canvasRef.current.width, 30);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Date: ${dateStr} Time: ${timeStr}`, 10, canvasRef.current.height - 10);
    }
    const photo = canvasRef.current.toDataURL("image/jpeg");
    setCaptured(photo);
    setLoading(false);
  };

  const handleFlip = () => {
    console.log("[OwnerBannerCapture] Flipping camera from", facingMode, "to", facingMode === 'user' ? 'environment' : 'user');
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const handleSubmit = () => {
    if (captured) {
      if (captureType === "ownerWithBanner" && location && timestamp) {
        onSubmit({ photo: captured, location, timestamp });
      } else if (captureType === "owner" && timestamp) {
        onSubmit({ photo: captured, timestamp });
      } else if (captureType === "banner" && timestamp) {
        onSubmit({ photo: captured, timestamp });
      }
    }
  };

  let title = "Capture Owner Beside Banner";
  if (captureType === "owner") title = "Capture Owner Image";
  if (captureType === "banner") title = "Capture Banner Image";

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-bold text-purple-700 mb-2 flex items-center gap-2">
        <span role="img" aria-label="camera">📷</span> {title}
      </h2>
      {!captured ? (
        <>
          <div className="bg-black rounded-lg shadow mb-2 w-full max-w-md flex items-center justify-center h-64 relative">
            {!stream ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-white">Loading camera...</span>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline className="rounded-lg w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div className="flex gap-2 mb-2 w-full max-w-md">
            <button type="button" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded font-semibold flex items-center justify-center gap-2" onClick={handleCapture} disabled={loading || !stream}>
              <span role="img" aria-label="camera">📸</span> {loading ? "Capturing..." : "Capture Image"}
            </button>
            <button type="button" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded font-semibold flex items-center justify-center gap-2" onClick={handleFlip}>
              <span role="img" aria-label="flip">🔄</span> Flip Camera
            </button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mt-2 w-full max-w-md text-sm text-gray-700 dark:text-white">
            <ul className="list-disc pl-4">
              <li>Camera permissions required</li>
              {captureType === "ownerWithBanner" && <li>Location permissions required</li>}
              <li>Photo includes timestamp</li>
              {captureType === "ownerWithBanner" && <li>Photo includes GPS coordinates</li>}
              <li>Works on both desktop and mobile devices</li>
              <li>Use the camera flip button (<span role="img" aria-label="flip">🔄</span>) to switch between front/back camera</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <img src={captured} alt="Captured" className="rounded-lg shadow w-full max-w-md mb-2" />
          {captureType === "ownerWithBanner" && <div className="text-xs mb-1"><b>Location:</b> {location?.address}</div>}
          <div className="text-xs mb-1"><b>Date & Time:</b> {timestamp}</div>
          <div className="flex gap-2 w-full max-w-md">
            <button type="button" className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-semibold" onClick={handleSubmit}>
              Use This Image
            </button>
            <button type="button" className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-semibold" onClick={() => setCaptured(null)}>
              Retake
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerBannerCapture;
