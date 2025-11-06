
"use client";

import * as React from "react";
import jsQR from "jsqr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CameraOff } from "lucide-react";

interface QrCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QrCodeScanner({ isOpen, onClose, onScan }: QrCodeScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationFrameIdRef = React.useRef<number | null>(null);

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  const stopCamera = React.useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = React.useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Main effect for camera and scanning logic
  React.useEffect(() => {
    if (!isOpen) {
      // Ensure camera is stopped if the dialog is closed externally
      stopCamera();
      return;
    }

    const startCameraAndScan = async () => {
      setHasPermission(null); // Reset permission state on open

      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermission(false);
        console.error("Your browser doesn't support camera access.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play(); // Ensure video is playing
        }

        const tick = () => {
          if (!streamRef.current) return; // Stop if stream is gone

          if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
              canvas.height = video.videoHeight;
              canvas.width = video.videoWidth;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

              if (code) {
                // IMPORTANT: Stop everything before calling onScan
                stopCamera();
                onScan(code.data); 
                return; // Exit the loop
              }
            }
          }
          animationFrameIdRef.current = requestAnimationFrame(tick);
        };
        
        animationFrameIdRef.current = requestAnimationFrame(tick);

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
      }
    };

    startCameraAndScan();

    // The single, most important cleanup function
    return () => {
      stopCamera();
    };
  }, [isOpen, onScan, stopCamera]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code within the frame to scan it.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex aspect-video w-full items-center justify-center rounded-md border bg-muted overflow-hidden">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          {hasPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                       Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
             </div>
           )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
