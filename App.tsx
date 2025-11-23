
import React, { useState } from 'react';
import { AppState, HandwritingAnalysis } from './types';
import { analyzeHandwriting, processImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import AnalysisResult from './components/AnalysisResult';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<HandwritingAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  const handleImageSelect = async (file: File) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg("");
    
    try {
      setLoadingStatus("正在预处理图片...");
      // Apply Grayscale -> Denoise -> Adaptive Thresholding
      const base64Data = await processImage(file);
      
      setLoadingStatus("AI 正在分析字形结构...");
      // Send processed image to Gemini Backend API
      const analysis = await analyzeHandwriting(base64Data, "image/jpeg");
      
      setResult(analysis);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "无法分析图片，请重试。");
      setAppState(AppState.ERROR);
    }
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            <span className="text-blue-600">Hengshui</span>Master
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        
        {appState === AppState.IDLE && (
          <ImageUploader onImageSelected={handleImageSelect} />
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center animate-pulse max-w-xs text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">{loadingStatus}</h3>
            <p className="text-slate-500 mt-2 text-sm">
              应用自适应二值化与结构分析算法...
            </p>
          </div>
        )}

        {appState === AppState.RESULT && result && (
          <AnalysisResult result={result} onRetry={handleRetry} />
        )}

        {appState === AppState.ERROR && (
          <div className="text-center max-w-xs">
             <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-6">
               {errorMsg}
             </div>
             <button 
               onClick={handleRetry}
               className="text-slate-600 font-semibold hover:text-slate-900 underline"
             >
               重试 (Try Again)
             </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>&copy; 2024 Hengshui Evaluator. Powered by Gemini AI.</p>
      </footer>
    </div>
  );
};

export default App;
