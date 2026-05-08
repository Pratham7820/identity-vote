import { useRef, useState, useCallback, useEffect } from 'react';
import { loadModels, getFaceDescriptor, getAveragedFaceDescriptor } from '@/lib/faceRecognition';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (descriptor: number[]) => void;
  mode?: 'register' | 'verify';
}

export function FaceCapture({ onCapture, mode = 'register' }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'capturing' | 'captured' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
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
    setStatus('capturing');
    setError('');

    let descriptor: Float32Array | null = null;

    if (mode === 'register') {
      // Take 5 averaged samples for a robust on-chain template.
      // This makes verification work even when the user later wears/removes glasses.
      setProgress('Capturing samples (1/5)...');
      const samples: Float32Array[] = [];
      for (let i = 0; i < 5; i++) {
        setProgress(`Capturing samples (${i + 1}/5)... hold still`);
        const d = await getFaceDescriptor(videoRef.current);
        if (d) samples.push(d);
        await new Promise((r) => setTimeout(r, 300));
      }
      if (samples.length >= 3) {
        const len = samples[0].length;
        const avg = new Float32Array(len);
        for (const d of samples) for (let i = 0; i < len; i++) avg[i] += d[i];
        for (let i = 0; i < len; i++) avg[i] /= samples.length;
        descriptor = avg;
      }
    } else {
      // Verification: average 3 quick samples for stability
      setProgress('Verifying...');
      descriptor = await getAveragedFaceDescriptor(videoRef.current, 3, 200);
    }

    setProgress('');

    if (descriptor) {
      onCapture(Array.from(descriptor));
      setStatus('captured');
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } else {
      setError('No face detected. Ensure good lighting and that your face is clearly visible.');
      setStatus('ready');
    }
  }, [onCapture, mode]);

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
          style={{ display: status === 'ready' || status === 'loading' || status === 'capturing' ? 'block' : 'none', transform: 'scaleX(-1)' }}
        />
        {status === 'idle' && (
          <div className="text-center space-y-3 p-6 max-w-sm">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {mode === 'register' ? 'Capture face data for voter registration' : 'Verify your identity to cast vote'}
            </p>
            <ul className="text-[11px] text-muted-foreground text-left space-y-1 bg-secondary/40 rounded-lg p-3 border border-border">
              <li>💡 Use bright, even lighting — avoid backlight from windows.</li>
              <li>👓 {mode === 'register' ? 'Capture without glasses if possible — verification still works with them on.' : 'Glasses, masks or beards are tolerated, but a clear face is best.'}</li>
              <li>📏 Keep face centered, ~30cm from the camera, looking straight ahead.</li>
              <li>🙂 Neutral expression, no extreme angles or shadows.</li>
              <li>🚫 Remove hats or anything covering forehead/eyebrows.</li>
              {mode === 'register' && <li>⏱ Hold still — we capture 5 samples for a robust template.</li>}
            </ul>
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
        {(status === 'loading' || status === 'capturing') && (
          <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            {progress && <p className="text-sm text-primary font-medium">{progress}</p>}
          </div>
        )}
      </div>
      {status === 'ready' && (
        <Button onClick={capture} className="w-full glow-primary">
          <Camera className="w-4 h-4 mr-2" />
          {mode === 'register' ? 'Capture Face (5 samples)' : 'Verify Face'}
        </Button>
      )}
      {error && status === 'ready' && (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
