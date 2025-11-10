import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", {
              type: "image/jpeg",
            });
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
            onCapture(file);
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/50">
        {capturedImage ? (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured medicine"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <>
            {isCameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-4 border-primary/30 m-8 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click to open camera and capture medicine image
                </p>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        {!isCameraActive && !capturedImage && (
          <Button onClick={startCamera} className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            Open Camera
          </Button>
        )}
        
        {isCameraActive && (
          <>
            <Button onClick={captureImage} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
            <Button onClick={stopCamera} variant="destructive">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        )}

        {capturedImage && (
          <Button onClick={retake} variant="outline" className="flex-1">
            Retake Photo
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
