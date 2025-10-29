import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RecognitionResult, StudentImage } from '../types';
import Card from './Card';

interface LiveKioskProps {
    handleRecognition: (liveImage: StudentImage) => Promise<RecognitionResult | null>;
    getCurrentClass: () => string | null;
}

// Motion detection parameters
const MOTION_THRESHOLD = 5; // How much pixel difference triggers motion
const DOWNSAMPLE_WIDTH = 64; // Check a smaller image for performance
const MOTION_INTERVAL_MS = 200; // How often to check for motion

const LiveKiosk: React.FC<LiveKioskProps> = ({ handleRecognition, getCurrentClass }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const motionCanvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Provide an initial value to useRef to avoid "Expected 1 arguments, but got 0" error.
    const animationFrameId = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastImageData = useRef<Uint8ClampedArray | null>(null);
    const lastMotionCheck = useRef<number>(0);

    const [isDetecting, setIsDetecting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recognitionHistory, setRecognitionHistory] = useState<RecognitionResult[]>([]);
    const recentlyRecognized = useRef<Map<string, number>>(new Map());
    const COOLDOWN_PERIOD = 10000; // 10 seconds

    // Effect for camera setup and teardown. Runs ONLY once on mount/unmount.
    useEffect(() => {
        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                const errorResult: RecognitionResult = { recognized: false, message: "Camera permission denied. Please allow camera access and refresh." };
                setRecognitionHistory(prev => [errorResult, ...prev.slice(0, 4)]);
            }
        };

        setupCamera();

        // Cleanup function: this is critical for stopping the camera when the component unmounts.
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []); // Empty dependency array ensures this runs only ONCE.

    const triggerRecognition = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;
        
        setIsProcessing(true);
        lastImageData.current = null; // Reset motion detection to prevent immediate re-trigger

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');

        const liveImage: StudentImage = {
            name: `capture-${Date.now()}.jpg`,
            base64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
        };

        const result = await handleRecognition(liveImage);

        if (result) {
            if (result.recognized && result.studentId) {
                const now = Date.now();
                const lastRecognitionTime = recentlyRecognized.current.get(result.studentId);
                if (!lastRecognitionTime || (now - lastRecognitionTime > COOLDOWN_PERIOD)) {
                    recentlyRecognized.current.set(result.studentId, now);
                    setRecognitionHistory(prev => [result, ...prev.slice(0, 4)]);
                }
            } else {
                 setRecognitionHistory(prev => [result, ...prev.slice(0, 4)]);
            }
        }

        setTimeout(() => {
            setIsProcessing(false);
        }, 2000); // Cooldown before processing again
    }, [handleRecognition, isProcessing]);

    const detectMotion = useCallback(() => {
        if (!isDetecting || isProcessing || !videoRef.current || !motionCanvasRef.current) {
            animationFrameId.current = requestAnimationFrame(detectMotion);
            return;
        }

        const now = Date.now();
        if (now - lastMotionCheck.current < MOTION_INTERVAL_MS) {
            animationFrameId.current = requestAnimationFrame(detectMotion);
            return;
        }
        lastMotionCheck.current = now;

        const video = videoRef.current;
        const canvas = motionCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const aspectRatio = video.videoHeight / video.videoWidth;
        const height = DOWNSAMPLE_WIDTH * aspectRatio;
        canvas.width = DOWNSAMPLE_WIDTH;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, DOWNSAMPLE_WIDTH, height);

        const currentImageData = ctx.getImageData(0, 0, DOWNSAMPLE_WIDTH, height).data;

        if (lastImageData.current) {
            let diff = 0;
            for (let i = 0; i < currentImageData.length; i += 4) {
                const r1 = lastImageData.current[i];
                const g1 = lastImageData.current[i + 1];
                const b1 = lastImageData.current[i + 2];
                const r2 = currentImageData[i];
                const g2 = currentImageData[i + 1];
                const b2 = currentImageData[i + 2];
                diff += Math.abs((r1+g1+b1) - (r2+g2+b2));
            }

            const avgDiff = (diff / (currentImageData.length / 4));
            if (avgDiff > MOTION_THRESHOLD) {
                triggerRecognition();
            }
        }
        lastImageData.current = currentImageData;

        animationFrameId.current = requestAnimationFrame(detectMotion);
    }, [isDetecting, isProcessing, triggerRecognition]);
    
    // Effect to start/stop the motion detection loop based on `isDetecting` state
    useEffect(() => {
        if (isDetecting) {
            lastMotionCheck.current = 0;
            lastImageData.current = null;
            animationFrameId.current = requestAnimationFrame(detectMotion);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    }, [isDetecting, detectMotion]);


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-200">Live Attendance Kiosk</h2>
                <p className="text-gray-400">Start real-time detection to automatically mark attendance on motion.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3">
                    <Card title="Live Camera Feed">
                        <div className="relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-md border-2 border-gray-700 bg-gray-900 aspect-video"></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                            <canvas ref={motionCanvasRef} className="hidden"></canvas>
                             {isDetecting && (
                                <div className="absolute top-3 left-3 flex items-center bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="ml-2">DETECTING MOTION</span>
                                </div>
                            )}
                            {isProcessing && (
                                 <div className="absolute top-3 right-3 flex items-center bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                     <span className="ml-2">PROCESSING...</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsDetecting(prev => !prev)} className={`mt-4 w-full flex items-center justify-center font-bold py-3 px-4 rounded-md transition duration-300 ${isDetecting ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
                                {isDetecting ? 'Stop Real-time Detection' : 'Start Real-time Detection'}
                        </button>
                        <div className="text-center mt-4 text-sm text-gray-400">
                            Current Class: <span className="font-bold text-gray-200">{getCurrentClass() || 'None'}</span>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title="Recent Activity">
                        {recognitionHistory.length === 0 ? (
                             <p className="text-gray-400 text-center py-8">System is ready. Start detection to see live results.</p>
                        ) : (
                            <div className="space-y-3">
                                {recognitionHistory.map((result, index) => (
                                    <div key={index} className={`p-3 rounded-lg border text-sm ${result.recognized && result.className ? 'bg-green-500/10 border-green-500/30' : (result.recognized ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30')}`}>
                                        <p className="font-bold">{result.message}</p>
                                        {result.studentId && <p>ID: <span className="font-mono">{result.studentId}</span></p>}
                                        {result.confidence && <p>Confidence: <span className="font-mono">{(result.confidence * 100).toFixed(1)}%</span></p>}
                                        {result.className && <p>Class: <span className="font-mono">{result.className}</span></p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LiveKiosk;