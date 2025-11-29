
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge', // Use Edge runtime for faster cold starts
};

export default async function handler(req: Request) {
  // 1. Method Check
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // 2. Security: Basic Origin/Referer Check
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const isLocal = origin?.includes('localhost') || origin?.includes('127.0.0.1');
  
  if (!isLocal && !origin && !referer) {
     return new Response(JSON.stringify({ error: 'Forbidden: Missing origin' }), { status: 403 });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Updated Prompt: Focus purely on visual similarity to "Shuyao Hengshui", ignore semantics.
    const prompt = `
      角色设定：你现在不是语言老师，而是一个高精度的OCR字体识别与比对引擎。
      
      核心任务：计算用户上传的手写图片与标准“舒窈英文衡水体 (Shuyao Hengshui Style)”的【视觉相似度】。
      
      重要指令：
      1. 绝对【不要】检查拼写错误、语法错误或内容意义。哪怕用户写的是乱码，只要字形符合标准，就是满分。
      2. 评分仅基于像素级的字形、结构、排版特征。

      参考标准（舒窈英文衡水体特征）：
      1. **笔触 (Stroke)**：
         - 模仿印刷体（Sans-serif/Arial风格），圆润饱满。
         - **严禁连笔**：字母之间完全断开。
         - **无圈环**：上伸字母（b, d, h, k, l）和下伸字母（g, p, q, y）的杆必须是直的，不能写成花体圆圈。
         - 特例：'t' 的底部通常不弯曲或仅微弯，'f' 为直线。
      2. **结构 (Structure)**：
         - 字母 'a', 'o', 'e', 'c' 等圆形结构必须极度饱满，接近正圆。
         - 单词内部字母间距极其紧凑（几乎相触），但单词之间留有标准空格。
      3. **排版 (Layout)**：
         - 严格的“齐头齐尾”，仿佛尺子量过。
         - 字母底部必须紧贴基准线，不能上下跳动。
         - 整体倾斜度统一（0度垂直 或 统一右倾5度）。

      评分标准 (0-100)：
      - 100分：看起来完全像是电脑打印的“舒窈衡水体”。
      - 80-99分：极度接近，仅有个别笔画有手写痕迹。
      - 60-79分：形似，但存在字距不匀、个别字母连笔或出格。
      - <60分：普通手写体，随意连笔，甚至花体。

      请输出 JSON 格式，所有反馈用简体中文：
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
            score: { type: Type.NUMBER, description: "视觉相似度评分 (0-100)" },
            isPassing: { type: Type.BOOLEAN, description: "是否 >= 80" },
            feedback: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "针对字形、笔触、排版的整体评价（不评判内容）"
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "符合舒窈体特征的细节（如：圆润度极佳、无连笔）"
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "偏离舒窈体特征的细节（如：y的尾巴打圈了、单词间距过大）"
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
