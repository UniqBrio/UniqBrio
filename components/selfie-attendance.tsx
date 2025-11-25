"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

interface AttendanceData {
  photo: string
  timestamp: string
  location: LocationData
  submitted: boolean
}

interface SelfieAttendanceProps {
  onSubmit: (data: AttendanceData) => void;
}

const SelfieAttendance: React.FC<SelfieAttendanceProps> = ({ onSubmit }) => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [timestamp, setTimestamp] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getCurrentLocation = useCallback(() => {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          let address = "Address not found";
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData && geoData.display_name) {
                address = geoData.display_name;
              }
            }
          } catch {}
          resolve({ latitude, longitude, accuracy, address });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      )
    })
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const locationData = await getCurrentLocation()
      setLocation(locationData)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera or location")
    } finally {
      setIsLoading(false)
    }
  }, [getCurrentLocation, facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !location) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const now = new Date()
    const timestampText = now.toLocaleString()
    setTimestamp(timestampText)
    const overlayPadding = 10;
    const textPaddingFromEdge = 20;
    const baseFontSize = 16;
    const fontSize = Math.max(12, Math.min(baseFontSize, canvas.width / 35));
    const lineHeight = fontSize * 1.5;
    context.font = `${fontSize}px Arial`;
    context.textAlign = "right";
    context.textBaseline = "bottom";
    let textLines: string[] = [];
    textLines.push(`🎯 Accuracy: ${location.accuracy.toFixed(0)}m`);
    if (location.address && location.address !== "Address not found") {
      const maxTextWidth = canvas.width - (textPaddingFromEdge * 2);
      let currentLine = "";
      const words = location.address.split(" ");
      let addressWrappedLines = [];
      for (const word of words) {
        const testLine = currentLine + word + " ";
        if (context.measureText(testLine).width > maxTextWidth && currentLine.length > 0) {
          addressWrappedLines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      }
      addressWrappedLines.push(currentLine.trim());
      for (let i = addressWrappedLines.length - 1; i >= 0; i--) {
        textLines.push(`📍 ${addressWrappedLines[i]}`);
      }
    } else {
      textLines.push(`📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    }
    textLines.push(`📅 ${timestampText}`);
    const overlayHeight = (textLines.length * lineHeight) + (overlayPadding * 2);
    context.fillStyle = "rgba(0, 0, 0, 0.7)"
    context.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight)
    context.fillStyle = "white"
    for (let i = 0; i < textLines.length; i++) {
      const yPosition = canvas.height - overlayPadding - (i * lineHeight);
      context.fillText(textLines[i], canvas.width - textPaddingFromEdge, yPosition);
    }
    const photoData = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedPhoto(photoData)
    stopCamera()
  }, [location, stopCamera])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  if (capturedPhoto && location && timestamp) {
    return (
      <div className="space-y-4">
        <img src={capturedPhoto} alt="Captured selfie" className="w-full h-48 object-cover rounded-lg mb-2" />
        <div className="text-sm text-gray-600 dark:text-white">
          <div><b>Location:</b> {location.address || `${location.latitude}, ${location.longitude}`}</div>
          <div><b>Date & Time:</b> {timestamp}</div>
        </div>
        <button className="mt-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition" onClick={() => onSubmit({ photo: capturedPhoto, timestamp, location, submitted: true })}>
          Use This Photo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover rounded-lg mb-2" />
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg" onClick={capturePhoto} disabled={isLoading || !location}>
        {isLoading ? "Loading..." : "Capture Photo"}
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default SelfieAttendance;
