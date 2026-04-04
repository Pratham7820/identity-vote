import { useRef, useState, useCallback, useEffect } from 'react';
import { loadModels, getFaceDescriptor } from '@/lib/faceRecognition';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (descriptor: number[]) => void;
  mode?: 'register' | 'verify';
}

export function FaceCapture({ onCapture, mode = 'register' }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'captured' | 'error'>('idle');
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch {
      setError('Camera access denied or face models failed to load');
      setStatus('error');
    }
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus('loading');
    const descriptor = await getFaceDescriptor(videoRef.current);
    if (descriptor) {
      onCapture(Array.from(descriptor));
      setStatus('captured');
      // Stop camera
      streamRef.current?.getTracks().forEach(t => t.stop());
    } else {
      setError('No face detected. Please ensure your face is clearly visible.');
      setStatus('ready');
    }
  }, [onCapture]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          style={{ display: status === 'ready' || status === 'loading' ? 'block' : 'none', transform: 'scaleX(-1)' }}
        />
        {status === 'idle' && (
          <div className="text-center space-y-3 p-6">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {mode === 'register' ? 'Capture face data for voter registration' : 'Verify your identity to cast vote'}
            </p>
            <Button onClick={startCamera} className="glow-primary">
              Start Camera
            </Button>
          </div>
        )}
        {status === 'captured' && (
          <div className="text-center space-y-2 p-6">
            <CheckCircle className="w-12 h-12 mx-auto text-primary" />
            <p className="text-primary font-medium">Face {mode === 'register' ? 'captured' : 'verified'} successfully</p>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center space-y-3 p-6">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-destructive text-sm">{error}</p>
            <Button onClick={startCamera} variant="outline">Retry</Button>
          </div>
        )}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-primary/30 rounded-lg" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/50 animate-scan-line" />
          </div>
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
      {status === 'ready' && (
        <Button onClick={capture} className="w-full glow-primary">
          <Camera className="w-4 h-4 mr-2" />
          {mode === 'register' ? 'Capture Face' : 'Verify Face'}
        </Button>
      )}
      {error && status === 'ready' && (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
