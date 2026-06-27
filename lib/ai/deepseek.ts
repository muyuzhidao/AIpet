// DeepSeek(OpenAI 兼容)调用封装。用于第 5 步 AI 分析。
// base/key/model 取自 .env;统一要求 JSON 对象输出。

import { fetchWithTimeout } from "../http";

const BASE_URL = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "");
const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export function hasDeepSeek(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// 清理孤立 surrogate(emoji 被 slice 截断时产生)与控制字符,否则 JSON.stringify 出非法转义、API 报 400。
const LONE_HIGH_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g;
const LONE_LOW_SURROGATE = /(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", "g");

function sanitizeContent(text: string): string {
  return text.replace(LONE_HIGH_SURROGATE, "").replace(LONE_LOW_SURROGATE, "").replace(CONTROL_CHARS, " ");
}

// 调用 chat completions,要求返回 JSON 对象,返回 message.content 文本。
export async function chatJson(messages: ChatMessage[]): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY ?? "";
  if (!key) throw new Error("缺少 DEEPSEEK_API_KEY");

  const res = await fetchWithTimeout(
    `${BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map((m) => ({ role: m.role, content: sanitizeContent(m.content) })),
        stream: false,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    },
    120_000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
