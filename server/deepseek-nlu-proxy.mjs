import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const port = Number(process.env.PACEMIX_NLU_PORT || 8788);
const allowedOrigin = process.env.PACEMIX_ALLOWED_ORIGIN || "http://127.0.0.1:4173";

function apiKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  return execFileSync("security", ["find-generic-password", "-s", "PaceMix DeepSeek API", "-a", "pacemix-local", "-w"], { encoding: "utf8" }).trim();
}

function send(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": allowedOrigin, "Vary": "Origin" });
  response.end(JSON.stringify(data));
}

const server = createServer(async (request, response) => {
  if (request.headers.origin && request.headers.origin !== allowedOrigin) return send(response, 403, { error: "origin_not_allowed" });
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return response.end();
  }
  if (request.method !== "POST" || request.url !== "/api/pace-nlu") return send(response, 404, { error: "not_found" });
  let raw = "";
  request.on("data", (chunk) => { raw += chunk; if (raw.length > 32_000) request.destroy(); });
  request.on("end", async () => {
    try {
      const { text, draft } = JSON.parse(raw);
      if (typeof text !== "string" || text.length > 2_000) return send(response, 400, { error: "invalid_input" });
      const upstream = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "你是 PaceMix 训练需求解析器。只输出 JSON：{minutes:number|null,activity:'跑步'|'跑步机爬坡'|'跑步机快走'|null,language:'mixed'|'zh'|'en'|null,languageExplicit:boolean,languageEvidence:string|null,intensity:'easy'|'medium'|'hard'|'ai'|'custom'|null,customStages:[{minutes:number,speed:number}]|null}。仅提取用户明确说出的条件，禁止臆测。languageExplicit 仅在用户明确提出中文歌、英文歌、华语、欧美、混合等音乐语言偏好时为 true，languageEvidence 必须逐字摘取该原文短语；否则 languageExplicit=false、languageEvidence=null。用户使用中文表达不等于要中文歌。若用户给了完整的单段匀速或分段 km/h 配速，则 customStages 必须覆盖总时长且 intensity='custom'。SPM 是步频，BPM 是音乐节拍，不是心率。" },
            { role: "user", content: `已有条件：${JSON.stringify(draft)}\n用户表达：${text}` },
          ],
        }),
      });
      if (!upstream.ok) return send(response, 502, { error: "model_unavailable" });
      const data = await upstream.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string") return send(response, 502, { error: "invalid_model_response" });
      return send(response, 200, { intent: JSON.parse(content) });
    } catch {
      return send(response, 500, { error: "nlu_failed" });
    }
  });
});

server.listen(port, "127.0.0.1", () => console.log(`PaceMix NLU proxy listening on http://127.0.0.1:${port}`));
