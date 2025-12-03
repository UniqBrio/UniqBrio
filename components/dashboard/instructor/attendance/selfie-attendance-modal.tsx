"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, RotateCw, X, Check, MapPin, Clock, User, Calendar } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";

interface SelfieAttendanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (photo: string, location: any, timestamp: string) => void;
  onShowToast?: (title: string, description: string) => void;
}

export function SelfieAttendanceModal({ isOpen, onOpenChange, onSubmit, onShowToast }: SelfieAttendanceModalProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  
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
    if (isOpen) {
      getLocation();
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

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
    if (onSubmit && captured) {
      onSubmit(captured, location, timestamp);
    }
    if (onShowToast) {
      onShowToast(
        "🎉 Feature Preview Complete!",
        "This is a UI experience demo. The full Selfie Attendance feature for instructors and students will be available soon!"
      );
    }
    handleClose();
  };

  const handleClose = () => {
    setCaptured(null);
    onOpenChange(false);
    stopCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" style={{ color: primaryColor }} />
              Selfie Attendance
            </div>
            <Badge 
              className="text-xs font-bold"
              style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
            >
              Coming Soon
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Feature Preview Banner */}
        <div 
          className="rounded-lg p-3 text-white text-center -mt-2"
          style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <p className="text-sm font-semibold">🎯 UI Experience Preview</p>
          <p className="text-xs mt-1 opacity-90">Try out the interface - Full feature launching soon!</p>
        </div>

        <div className="space-y-4">
          {/* Show error if any */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Show camera feed or captured image */}
          {!captured ? (
            <>
              {/* Camera Feed */}
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
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
                  disabled={!stream || loading}
                  className="flex-1 text-white text-sm py-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : "Capture"}
                </Button>
                <Button
                  onClick={handleFlip}
                  disabled={!stream}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Location Info */}
              {location && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                    <p className="text-xs">
                      <span className="font-semibold">Current Location:</span>{" "}
                      <span className="text-muted-foreground">
                        {location.address || "Fetching..."}
                      </span>
                    </p>
                  </div>
                </div>
              )}
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

              {/* Captured Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: primaryColor }}>Captured Details</h3>
                
                <div className="grid gap-3">
                  {/* Instructor Info */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                      <User className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Instructor</p>
                      <p className="text-sm font-medium truncate">Current User</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{timestamp.split(' ')[0]}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{timestamp.split(' ').slice(1).join(' ')}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Location</p>
                      <p className="text-sm font-medium break-words">
                        {location?.address || "Unknown Location"}
                      </p>
                      {location?.latitude && location?.longitude && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 text-white text-sm py-2 relative"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  <span>Try Experience</span>
                  <Badge 
                    className="ml-2 text-[10px] font-bold px-1.5 py-0.5"
                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                  >
                    Coming Soon
                  </Badge>
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
              <div className="text-center bg-muted/30 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">
                  This is a UI preview. Full attendance feature launching soon for instructors and students!
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
