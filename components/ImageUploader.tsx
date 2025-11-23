import React, { useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  // Type-safe props for the file input to handle 'capture' attribute issues
  const inputProps = {
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: handleFileChange,
    capture: "environment" as any // Type assertion to bypass strict TS check if needed
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="w-10 h-10 text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">衡水体 AI 评分</h2>
        <p className="text-slate-500 mb-8">
          上传或拍摄你的英文手写照片，获取 AI 专业评分和建议。
        </p>

        <div className="space-y-4">
          {/* Hidden Input with spread props */}
          <input
            ref={fileInputRef}
            {...inputProps}
          />

          {/* Camera Button (Mobile Optimized) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-transform active:scale-95"
          >
            <Camera className="w-5 h-5 mr-2" />
            拍摄 / 上传照片
          </button>
          
          <p className="text-xs text-slate-400 mt-4">
            确保光线充足，文字清晰对焦。
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 font-medium">目标：&gt;80 分 (达标)</p>
        <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
           <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 w-4/5 rounded-full opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;