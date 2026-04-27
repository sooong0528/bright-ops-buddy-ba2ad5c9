// Edge Function: 巡检任务 AI 助手
// 支持两种模式：
//   - mode = "parse"  : 自然语言 -> 巡检任务草稿
//   - mode = "merge"  : 评估新任务与现有任务的可合并性，给出建议

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_TYPES = ["日常巡检", "周巡检", "手动巡检"];
const VALID_METRICS = ["CPU", "内存", "磁盘", "Ping"];
const VALID_GROUPS = [
  "全部主机组",
  "Web 接入层",
  "应用服务层",
  "数据库",
  "缓存层",
  "消息中间件",
];

const SYSTEM_PROMPT = `你是企业级智能运维平台的巡检规则助手。
平台对接的 Zabbix 监控仅提供以下 4 类硬件指标：CPU、内存、磁盘、Ping。
平台支持的目标主机组固定为：${VALID_GROUPS.join("、")}。
任务类型仅有：${VALID_TYPES.join("、")}。
你需要严格按调用方指定的工具结构返回结果，所有字段必须是中文且取值在允许范围内。`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt, draft, existingTasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    let body: Record<string, unknown>;
    if (mode === "parse") {
      body = buildParseBody(prompt);
    } else if (mode === "merge") {
      body = buildMergeBody(draft, existingTasks);
    } else {
      return jsonResponse({ error: "未知的 mode" }, 400);
    }

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      if (resp.status === 429) {
        return jsonResponse(
          { error: "请求过于频繁，请稍后再试" },
          429,
        );
      }
      if (resp.status === 402) {
        return jsonResponse(
          { error: "Lovable AI 余额不足，请到 Settings → Workspace → Usage 充值" },
          402,
        );
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return jsonResponse({ error: "AI 网关错误" }, 500);
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return jsonResponse({ error: "AI 未返回结构化结果" }, 500);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("解析失败", e, toolCall.function.arguments);
      return jsonResponse({ error: "AI 返回内容解析失败" }, 500);
    }

    return jsonResponse({ result: parsed });
  } catch (e) {
    console.error("inspection-ai error", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "未知错误" },
      500,
    );
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildParseBody(prompt: string) {
  return {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `请根据下面的自然语言描述，生成一条巡检任务草稿。\n\n描述：${prompt}\n\n` +
          `如果描述里没有明确指定，请按业务常识给出合理默认值，并在 reasoning 字段中说明你的推断依据；` +
          `metrics 与 targets 必须从枚举中选择，无法对应到的需求请在 reasoning 中提示。`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "create_inspection_task",
          description: "根据自然语言生成一条巡检任务草稿",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "任务名称，简洁有业务含义" },
              type: { type: "string", enum: VALID_TYPES },
              schedule: {
                type: "string",
                description: "调度策略，例如 '每日 08:00' / '每 30 分钟'",
              },
              metrics: {
                type: "array",
                items: { type: "string", enum: VALID_METRICS },
              },
              targets: {
                type: "array",
                items: { type: "string", enum: VALID_GROUPS },
              },
              owner: { type: "string", description: "建议的负责人，未提及时填 '运维组'" },
              description: { type: "string", description: "任务说明 / 业务背景" },
              reasoning: {
                type: "string",
                description: "字段推断依据，向用户解释 AI 的判断",
              },
            },
            required: [
              "name",
              "type",
              "schedule",
              "metrics",
              "targets",
              "owner",
              "description",
              "reasoning",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "create_inspection_task" },
    },
  };
}

function buildMergeBody(draft: unknown, existingTasks: unknown) {
  return {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `下面是用户当前正在编辑的巡检任务草稿（DRAFT）和系统中已存在的巡检任务列表（EXISTING）。\n` +
          `请判断 DRAFT 是否与 EXISTING 中某条任务存在显著重叠（指标 / 目标 / 调度），并给出建议：\n` +
          `- 若可合并，verdict = "merge"，并在 mergeIntoTaskId 中给出目标任务 id，提供合并后的字段；\n` +
          `- 若可优化但不应合并（例如调度冲突、覆盖范围过大），verdict = "adjust"；\n` +
          `- 若无冲突，verdict = "keep"。\n` +
          `risks 列出潜在风险（如重复巡检带来的资源浪费、告警噪音等）。\n\n` +
          `DRAFT = ${JSON.stringify(draft)}\n\n` +
          `EXISTING = ${JSON.stringify(existingTasks)}`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "suggest_merge",
          description: "给出新巡检任务与现有任务的合并/调整建议",
          parameters: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["merge", "adjust", "keep"] },
              summary: { type: "string", description: "一句话结论" },
              mergeIntoTaskId: {
                type: "string",
                description: "若 verdict=merge，给出建议合并到的任务 id；否则空字符串",
              },
              suggestedTask: {
                type: "object",
                description: "建议保留 / 合并后的任务字段；若 verdict=keep，可与 DRAFT 一致",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: VALID_TYPES },
                  schedule: { type: "string" },
                  metrics: {
                    type: "array",
                    items: { type: "string", enum: VALID_METRICS },
                  },
                  targets: {
                    type: "array",
                    items: { type: "string", enum: VALID_GROUPS },
                  },
                  description: { type: "string" },
                },
                required: [
                  "name",
                  "type",
                  "schedule",
                  "metrics",
                  "targets",
                  "description",
                ],
                additionalProperties: false,
              },
              reasoning: { type: "string", description: "判断依据，逐条说明" },
              risks: {
                type: "array",
                items: { type: "string" },
                description: "潜在风险或注意事项",
              },
            },
            required: [
              "verdict",
              "summary",
              "mergeIntoTaskId",
              "suggestedTask",
              "reasoning",
              "risks",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "suggest_merge" } },
  };
}
