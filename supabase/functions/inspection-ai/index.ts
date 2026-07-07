// Edge Function: 巡检任务 AI 助手
// 支持两种模式：
//   - mode = "parse"  : 自然语言 -> 巡检任务草稿（包含 资源 + 每个资源的指标）
//   - mode = "merge"  : 评估新任务与现有任务的可合并性，给出建议

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_TYPES = ["日常巡检", "周巡检", "手动巡检"];

const SYSTEM_PROMPT = `你是企业级智能运维平台的巡检规则助手。
平台的巡检任务遵循「先选资源、再选每个资源的指标」的模型：一个任务可以关联多个资源（主机 / 数据库 / 应用服务 / 中间件），每个资源上再独立勾选若干指标。
每类资源支持的指标集合固定如下：
- 主机：CPU、内存、磁盘、Ping
- 应用服务：端口、HTTP 健康检查、应用错误日志
- 数据库：连接数、慢查询、锁等待、数据库日志
- 中间件：存活状态、连接数、队列堆积、错误日志
任务类型只能是：${VALID_TYPES.join("、")}。
你必须严格按调用方指定的工具结构返回结果，assetId 必须来自调用方给出的资源目录，metrics 只能取该资源类型对应的指标；不允许编造。`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt, draft, existingTasks, assetCatalog } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    let body: Record<string, unknown>;
    if (mode === "parse") {
      body = buildParseBody(prompt, assetCatalog ?? []);
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
        return jsonResponse({ error: "请求过于频繁，请稍后再试" }, 429);
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

type CatalogAsset = {
  id: string;
  name: string;
  type: string;
  businessSystem?: string;
  ip?: string;
  environment?: string;
};

function buildParseBody(prompt: string, catalog: CatalogAsset[]) {
  const catalogText = catalog.length
    ? catalog
        .map(
          (a) =>
            `- id=${a.id} | ${a.type} | ${a.name} | 业务=${a.businessSystem ?? "-"} | IP=${a.ip ?? "-"} | 环境=${a.environment ?? "-"}`,
        )
        .join("\n")
    : "（当前无可选资源，请返回空的 assetSelections）";

  return {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `请根据下面的自然语言描述，生成一条巡检任务草稿，并从资源目录中挑选合适的资源、为每个资源选择要巡检的指标。\n\n` +
          `【资源目录】\n${catalogText}\n\n` +
          `【用户描述】${prompt}\n\n` +
          `要求：\n` +
          `1. assetSelections 中的 assetId 必须严格来自资源目录中的 id；不要编造。\n` +
          `2. 每个资源的 metrics 必须取该资源类型对应的合法指标：\n` +
          `   主机→CPU/内存/磁盘/Ping；应用服务→端口/HTTP 健康检查/应用错误日志；\n` +
          `   数据库→连接数/慢查询/锁等待/数据库日志；中间件→存活状态/连接数/队列堆积/错误日志。\n` +
          `3. 若描述指向"某类资源"（如"所有数据库"），则从目录中选出全部匹配项。\n` +
          `4. 若描述没有明确指定指标，就按该资源类型的常用指标合理默认。\n` +
          `5. 在 reasoning 中简要说明：为什么选这些资源、为什么选这些指标、以及调度/负责人是怎么推断的。`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "create_inspection_task",
          description: "生成一条巡检任务草稿，包含资源与每个资源上的指标",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "任务名称，简洁有业务含义" },
              type: { type: "string", enum: VALID_TYPES },
              schedule: {
                type: "string",
                description: "调度策略，例如 '每日 08:00' / '每 30 分钟'",
              },
              owner: {
                type: "string",
                description: "建议的负责人，未提及时填 '运维组'",
              },
              description: { type: "string", description: "任务说明 / 业务背景" },
              assetSelections: {
                type: "array",
                description: "选中的资源及其指标；assetId 必须来自给定资源目录",
                items: {
                  type: "object",
                  properties: {
                    assetId: { type: "string" },
                    metrics: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["assetId", "metrics"],
                  additionalProperties: false,
                },
              },
              reasoning: {
                type: "string",
                description: "字段推断依据，向用户解释 AI 的判断",
              },
            },
            required: [
              "name",
              "type",
              "schedule",
              "owner",
              "description",
              "assetSelections",
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
    model: "google/gemini-2.5-flash",
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
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: VALID_TYPES },
                  schedule: { type: "string" },
                  metrics: { type: "array", items: { type: "string" } },
                  targets: { type: "array", items: { type: "string" } },
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
              reasoning: { type: "string" },
              risks: { type: "array", items: { type: "string" } },
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
