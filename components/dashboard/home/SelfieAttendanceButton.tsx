"use client";
import React, { useState, useRef, useEffect } from "react";
import { Camera, RotateCw, X, Check } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";

interface SelfieAttendanceButtonProps {
  className?: string;
}

export function SelfieAttendanceButton({ className = "" }: SelfieAttendanceButtonProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [isHovered, setIsHovered] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  // Camera management
  useEffect(() => {
    if (showDialog) {
      getLocation();
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showDialog, facingMode]);

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
      setError("Unable to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
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
    
    // Add overlay with location and timestamp
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(138, 63, 252, 0.8)";
    ctx.fillRect(0, canvasRef.current.height - 80, canvasRef.current.width, 80);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Selfie Attendance`, 10, canvasRef.current.height - 60);
    ctx.fillText(`Location: ${location?.address || "Unknown"}`, 10, canvasRef.current.height - 40);
    ctx.fillText(`Date: ${dateStr} Time: ${timeStr}`, 10, canvasRef.current.height - 20);
    
    const photo = canvasRef.current.toDataURL("image/jpeg");
    setCaptured(photo);
    setLoading(false);
    stopCamera();
  };

  const handleFlip = () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleSubmit = () => {
    // Here you would implement the actual attendance submission logic
    console.log("Attendance submitted:", { photo: captured, location, timestamp });
    alert("🎉 Feature Preview Complete!\n\nThis is a UI experience demo. The full Selfie Attendance feature for instructors and students will be available soon!");
    handleClose();
  };

  const handleClose = () => {
    setCaptured(null);
    setShowDialog(false);
    stopCamera();
  };

  return (
    <>
      <div className={`${className} relative`}>
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setShowDialog(true)}
          className="group relative w-full overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_50px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
          style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backgroundImage: `linear-gradient(225deg, ${primaryColor}, ${secondaryColor})` }}
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>
          <div className="absolute -top-1 -right-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

          <div className="relative z-10 flex items-center gap-3 px-6 py-4">
            <div className="relative">
              <div className={`p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transition-all duration-300 ${isHovered ? "rotate-12 scale-110" : ""}`}>
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-left flex-1">
              <div className="text-base font-bold text-white flex items-center gap-2">
                Selfie Attendance
              </div>
              <div className="text-xs text-white/90 font-medium">
                Mark your attendance with a selfie
              </div>
            </div>

            <Badge 
              className="bg-white/90 backdrop-blur-sm text-xs font-bold shadow-lg"
              style={{ color: primaryColor }}
            >
              Coming Soon
            </Badge>
          </div>
        </button>
      </div>

      {/* Dialog with Camera Capture UI */}
      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Camera className="w-4 h-4" style={{ color: primaryColor }} />
              Selfie Attendance
              <Badge 
                className="ml-2 text-xs font-bold"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                Coming Soon
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* Feature Preview Banner */}
            <div className="bg-gradient-to-r rounded-lg p-3 text-white text-center"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <p className="text-sm font-semibold">UI Experience Preview</p>
              <p className="text-xs mt-1 opacity-90">Try out the interface - Full feature launching soon!</p>
            </div>
            {!captured ? (
              <>
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center h-64">
                  {!stream ? (
                    <div className="flex flex-col items-center justify-center w-full h-full text-white">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                      <span className="text-sm">Loading camera...</span>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Camera Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCapture}
                    disabled={loading || !stream}
                    className="flex-1 text-white text-sm py-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {loading ? "Capturing..." : "Capture Selfie"}
                  </Button>
                  <Button
                    onClick={handleFlip}
                    variant="outline"
                    className="px-3"
                    size="sm"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-1.5">How it will work:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Instructors and students will mark attendance with a selfie</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Location and timestamp will be automatically captured</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Secure verification with facial recognition</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Real-time attendance tracking and reports</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Captured Image Preview */}
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={captured} 
                    alt="Captured selfie" 
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Image Details */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs">
                    <span className="font-semibold">Location:</span>{" "}
                    <span className="text-muted-foreground">
                      {location?.address || "Unknown"}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Date & Time:</span>{" "}
                    <span className="text-muted-foreground">{timestamp}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 text-white text-sm py-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Try Experience
                  </Button>
                  <Button
                    onClick={handleRetake}
                    variant="outline"
                    className="flex-1 text-sm py-2"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                </div>

                {/* Coming Soon Notice */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    This is a UI preview. Full attendance feature launching soon for instructors and students!
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
