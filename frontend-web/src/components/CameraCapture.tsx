'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
    label: string;
    onCapture: (file: File) => void;
    currentImage?: string;
}

export default function CameraCapture({ label, onCapture, currentImage }: CameraCaptureProps) {
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(currentImage || null);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setShowCamera(false);

            // Converter base64 para File
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `${label.toLowerCase().replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                });
        }
    }, [webcamRef, label, onCapture]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            onCapture(file);
        }
    };

    const handleRemove = () => {
        setCapturedImage(null);
        setShowCamera(false);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {!capturedImage && !showCamera && (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex-1 px-4 py-3 border-2 border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Camera size={20} />
                        Tirar Foto
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Upload size={20} />
                        Carregar Arquivo
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            )}

            {showCamera && (
                <div className="relative bg-black rounded-lg overflow-hidden">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full"
                        videoConstraints={{
                            facingMode: 'user'
                        }}
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={capture}
                            className="px-6 py-3 bg-white text-purple-700 rounded-full font-bold hover:bg-purple-100 transition-all shadow-lg"
                        >
                            📸 Capturar
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCamera(false)}
                            className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all shadow-lg"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {capturedImage && (
                <div className="relative">
                    <img
                        src={capturedImage}
                        alt={label}
                        className="w-full h-64 object-cover rounded-lg border-2 border-green-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                handleRemove();
                                setShowCamera(true);
                            }}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg"
                            title="Tirar nova foto"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg"
                            title="Remover foto"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✓ Foto capturada
                    </div>
                </div>
            )}
        </div>
    );
}
