
import React from 'react';
import { HandwritingAnalysis } from '../types';
import { CheckCircle, XCircle, Award, AlertCircle } from 'lucide-react';

interface AnalysisResultProps {
  result: HandwritingAnalysis;
  onRetry: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onRetry }) => {
  const isPassing = result.score >= 80;

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
      {/* Header Score Section */}
      <div className={`p-8 text-center ${isPassing ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex justify-center mb-4">
          {isPassing ? (
            <CheckCircle className="w-16 h-16 text-green-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-1">{result.score} / 100</h2>
        <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
          isPassing ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
        }`}>
          {isPassing ? '衡水体达标' : '需加强练习'}
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="p-6 space-y-6">
        
        {/* Strengths */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-slate-700 mb-3">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            优点 (Strengths)
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {str}
              </li>
            ))}
            {result.strengths.length === 0 && <p className="text-sm text-slate-400 italic">继续练习以积累优点。</p>}
          </ul>
        </div>

        {/* Improvements */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-slate-700 mb-3">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
            改进建议 (Improvements)
          </h3>
          <ul className="space-y-2">
            {result.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {imp}
              </li>
            ))}
             {result.improvements.length === 0 && <p className="text-sm text-slate-400 italic">完美！没有主要的改进建议。</p>}
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={onRetry}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg"
        >
          识别下一张 (Analyze Another)
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
