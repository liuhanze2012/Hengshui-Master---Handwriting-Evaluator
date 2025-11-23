
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge', // Use Edge runtime for faster cold starts
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prompt specifically tuned for Hengshui style with Chinese output
    const prompt = `
      你是一位精通"衡水体"（Hengshui Style）的英语书法阅卷专家。
      
      用户提供的图片已经过预处理（二值化），请分析图片中的手写英文。
      
      **衡水体评分标准：**
      1. **结构 (Structure)**: 字母应饱满圆润，严格占据四线三格的中间区域。
      2. **对齐 (Alignment)**: 书写必须严格紧贴基准线，不得漂浮或下沉。
      3. **倾斜度 (Slant)**: 整体垂直或通过统一的右倾角度（通常为5-15度），保持高度一致性。
      4. **间距 (Spacing)**: 单词内部字母紧凑（几无缝隙），单词之间留有明显空格（约一个字母a的宽度）。
      5. **连笔 (Ligatures)**: 杜绝随意连笔，模仿印刷体（如Arial/Times New Roman）的手写版。
      6. **清晰度 (Clarity)**: 极高的可读性，卷面整洁无涂改。

      **任务：**
      分析提供的书写样本。
      评分范围 0 到 100 分。
      - >= 80分：达标（Standard）。
      - < 80分：需改进（Needs Improvement）。

      **输出要求：**
      请以 **JSON** 格式返回结果，**所有文本反馈必须使用简体中文**。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "0-100的评分" },
            isPassing: { type: Type.BOOLEAN, description: "分数是否大于等于80" },
            feedback: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "整体评价（简体中文）"
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "符合衡水体标准的优点（简体中文）"
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "具体的改进建议（简体中文）"
            }
          },
          required: ["score", "isPassing", "feedback", "strengths", "improvements"]
        }
      }
    });

    if (response.text) {
      return new Response(response.text, {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error("Gemini API returned empty response");
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
