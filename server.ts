import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI Server-side Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "GTO Poker Trainer v42.0", time: new Date().toISOString() });
});

// Gemini AI GTO Audit Endpoint
app.post("/api/gto-audit", async (req, res) => {
  try {
    const { handDetails, customQuestion, userStatsSummary } = req.body;

    if (!handDetails) {
      return res.status(400).json({ error: "handDetails is required." });
    }

    const ai = getGeminiClient();

    const prompt = `
你是一位顶尖的德州扑克 GTO (Game Theory Optimal) 求解器理论与实战教练。
请对以下牌局手牌决策进行精确的 GTO 理论审计与解析。

【牌局上下文】
- Hero 位置: ${handDetails.heroPosition}
- 对手位置: ${handDetails.villainPosition || '未知'}
- Hero 手牌: ${handDetails.heroHand}
- 翻牌面/牌面: ${handDetails.board || '翻前 Preflop'}
- 阶段: ${handDetails.street}
- 当前底池大小: ${handDetails.potSize} BB
- Hero 采取的动作: ${handDetails.userAction}
- GTO Solver 推荐策略: ${JSON.stringify(handDetails.gtoOptimalActions)}

【用户统计/漏洞标签】
- 翻前准确率: ${userStatsSummary?.preflopAccuracy || '未知'}%
- 常见漏洞: ${userStatsSummary?.leakTags?.join(', ') || '暂无'}
- 用户提出的额外问题: ${customQuestion || '无'}

请分析以下 3 个核心 GTO 理论维度：
1. 范围优势与坚果优势 (Range & Nut Advantage) 分析
2. 阻挡牌效应 (Blockers & Unblockers) 与混合策略频率理由
3. EV (期望值) 损耗评估与后续调整建议

请输出格式严谨、极具专业洞察力且易于理解的 JSON 响应，格式如下：
{
  "evaluation": "PERFECT" | "ACCEPTABLE" | "BLUNDER",
  "analysis": "深刻清晰的策略分析文本...",
  "keyConcepts": {
    "rangeAdvantage": "范围优势分析说明",
    "blockerEffect": "阻挡牌效应说明",
    "evComparison": "EV对比与策略理由"
  },
  "recommendedDrill": "针对性训练建议"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluation: { type: Type.STRING },
            analysis: { type: Type.STRING },
            keyConcepts: {
              type: Type.OBJECT,
              properties: {
                rangeAdvantage: { type: Type.STRING },
                blockerEffect: { type: Type.STRING },
                evComparison: { type: Type.STRING },
              },
            },
            recommendedDrill: { type: Type.STRING },
          },
          required: ["evaluation", "analysis", "keyConcepts", "recommendedDrill"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const auditResult = JSON.parse(jsonText);

    return res.json({ success: true, audit: auditResult });
  } catch (error: any) {
    console.error("Gemini GTO Audit error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to conduct GTO audit via Gemini API",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GTO Poker Trainer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
