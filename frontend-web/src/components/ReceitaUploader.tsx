'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

interface ReceitaUploaderProps {
    onImageSelect: (file: File | null) => void;
    currentImage: File | null;
}

export default function ReceitaUploader({ onImageSelect, currentImage }: ReceitaUploaderProps) {
    const [showWebcam, setShowWebcam] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Conectar stream ao vídeo quando disponível
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Limpar stream ao desmontar
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Iniciar webcam
    const startWebcam = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Câmera traseira no mobile
            });
            setStream(mediaStream);
            setShowWebcam(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            alert('Erro ao acessar câmera. Verifique as permissões.');
            console.error(error);
        }
    };

    // Parar webcam
    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowWebcam(false);
    };

    // Capturar foto da webcam
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'receita.jpg', { type: 'image/jpeg' });
                        onImageSelect(file);
                        setPreview(URL.createObjectURL(blob));
                        stopWebcam();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    // Upload de arquivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Drag & Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Remover imagem
    const removeImage = () => {
        onImageSelect(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
                Receita Médica (Opcional)
            </label>

            {/* Preview da imagem */}
            {preview && (
                <div className="relative border-2 border-green-500 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-green-700">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">Receita anexada</span>
                        </div>
                        <button
                            onClick={removeImage}
                            className="text-red-600 hover:text-red-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <img
                        src={preview}
                        alt="Preview da receita"
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                </div>
            )}

            {/* Webcam Modal */}
            {showWebcam && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Capturar Receita</h3>
                            <button onClick={stopWebcam} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full rounded-lg mb-4"
                        />

                        <canvas ref={canvasRef} className="hidden" />

                        <button
                            onClick={capturePhoto}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            📸 Capturar Foto
                        </button>
                    </div>
                </div>
            )}

            {/* Botões de ação */}
            {!preview && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={startWebcam}
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                        <Camera className="w-5 h-5" />
                        Usar Câmera
                    </button>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition font-medium"
                    >
                        <Upload className="w-5 h-5" />
                        Fazer Upload
                    </button>
                </div>
            )}

            {/* Drag & Drop Area */}
            {!preview && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600">
                        Arraste e solte a imagem aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Formatos: JPG, PNG (máx. 5MB)
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
