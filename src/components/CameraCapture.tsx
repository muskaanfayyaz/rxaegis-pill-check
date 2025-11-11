import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setCameraError(false);
      setCapturedImage(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setCameraError(true);
      
      // Detect if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let description = "Camera access is not available. ";
      if (!isMobile) {
        description = "Camera access is available only on mobile devices. Please use the Upload File option or try this feature on a mobile device.";
      } else {
        description = "Camera access is restricted in preview mode. Please use Upload File or access the published app for full camera functionality.";
      }
      
      toast({
        title: "Camera Not Available",
        description,
        variant: "destructive",
      });
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
      {cameraError && (
        <div className="p-3 sm:p-4 bg-warning/10 border border-warning rounded-lg flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-warning-foreground">Camera Not Available</p>
            <p className="text-xs text-muted-foreground mt-1">
              {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                ? "Camera access is restricted in preview mode. Please use 'Upload File' or access the published app for full camera functionality."
                : "Camera access is available only on mobile devices. Please use 'Upload File' or try this feature on a mobile device."}
            </p>
          </div>
        </div>
      )}
      
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
