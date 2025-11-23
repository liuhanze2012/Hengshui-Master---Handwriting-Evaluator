
import { HandwritingAnalysis } from "../types";

// Image processing pipeline: Resize -> Grayscale -> Denoise -> Adaptive Binarization
export const processImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // 1. Resize to manageable size for JS processing (max 1024px)
      // This ensures the expensive pixel manipulation doesn't freeze the UI
      const MAX_SIZE = 1024;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;

      // 2. Grayscale & Denoise
      // Using canvas filter for optimized Grayscale and Blur (Approximation of Denoising)
      ctx.filter = 'grayscale(100%) blur(0.5px)';
      ctx.drawImage(img, 0, 0, width, height);

      // 3. Adaptive Thresholding (Bradley-Roth / Sauvola variant)
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data; // RGBA array
      
      // Create Integral Image for O(1) sum queries
      const integral = new Int32Array(width * height);
      
      for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const val = data[i]; // R channel (already grayscale)
          sum += val;
          if (y === 0) {
            integral[y * width + x] = sum;
          } else {
            integral[y * width + x] = sum + integral[(y - 1) * width + x];
          }
        }
      }

      // Apply threshold
      const windowSize = Math.floor(width / 16);
      const s2 = Math.floor(windowSize / 2);
      const T = 0.15; // Threshold constant

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const x1 = Math.max(0, x - s2);
          const x2 = Math.min(width - 1, x + s2);
          const y1 = Math.max(0, y - s2);
          const y2 = Math.min(height - 1, y + s2);

          const count = (x2 - x1 + 1) * (y2 - y1 + 1);

          const getInt = (cx: number, cy: number) => {
             if (cx < 0 || cy < 0) return 0;
             return integral[cy * width + cx];
          }
          
          const sum = getInt(x2, y2) - getInt(x2, y1 - 1) - getInt(x1 - 1, y2) + getInt(x1 - 1, y1 - 1);
          const mean = sum / count;
          
          const idx = (y * width + x) * 4;
          
          // If pixel is significantly darker than local mean, it's ink (0). Else paper (255).
          const bin = data[idx] < mean * (1 - T) ? 0 : 255;
          
          data[idx] = bin;     // R
          data[idx + 1] = bin; // G
          data[idx + 2] = bin; // B
          // Alpha remains 255
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Return base64 string without prefix
      const base64Url = canvas.toDataURL('image/jpeg', 0.9);
      resolve(base64Url.split(',')[1]);
    };
    
    img.onerror = (err) => reject(err);
    img.src = objectUrl;
  });
};

export const analyzeHandwriting = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<HandwritingAnalysis> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as HandwritingAnalysis;

  } catch (error) {
    console.error("Error analyzing handwriting:", error);
    throw new Error("无法分析图片，请检查网络或重试。");
  }
};
