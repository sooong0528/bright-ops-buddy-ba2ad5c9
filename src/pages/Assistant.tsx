import { useState, useRef, useEffect } from "react";
import {
  Send, Sparkles, Bot, User, FileText, Lightbulb,
  BookOpen, Database, MessageSquareQuote,
  Plus, Clock, Quote, BarChart3,
  ArrowRight, FileSearch, ChevronDown, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ===================== 三类问答类型 ===================== */
type CategoryKey = "knowledge" | "data" | "context";

interface Category {
  key: CategoryKey;
  label: string;
  short: string;
  icon: any;
  desc: string;
  guideline: string;
  color: string;
  bg: string;
  border: string;
  examples: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "knowledge",
    label: "知识库问答",
    short: "知识",
    icon: BookOpen,
    desc: "查询运维手册、SOP、FAQ、历史故障案例（计入知识命中/命中率/盲区）",
    guideline: "请描述您想了解的运维知识、告警处理或操作规程。",
    color: "text-primary",
    bg: "bg-primary-soft",
    border: "border-primary/30",
    examples: [
      "核心交换机端口异常怎么排查？",
      "磁盘空间不足怎么处理？",
      "MySQL 切主操作的标准流程？",
      "CPU 使用率多少算异常？",
    ],
  },
  {
    key: "data",
    label: "系统数据查询",
    short: "数据",
    icon: Database,
    desc: "查询系统巡检结果、异常记录、资产等实时数据（不计入知识命中）",
    guideline: "请说明您要查询的数据类型与时间范围，例如「本周异常」「核心资产状态」等。",
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    examples: [
      "本周有哪些巡检异常？",
      "当前有哪些待处理的关注项？",
      "最近 24 小时新增告警有哪些？",
      "核心资产整体健康情况？",
    ],
  },
  {
    key: "context",
    label: "上下文追问",
    short: "追问",
    icon: MessageSquareQuote,
    desc: "针对某份报告 / 巡检结果 / 异常记录进行解读、对比、汇总",
    guideline: "请先在报告中心或巡检中心打开一条上下文后进入，或直接就当前上下文进行追问。",
    color: "text-accent-foreground",
    bg: "bg-accent",
    border: "border-accent",
    examples: [
      "这份报告里最需要关注的三个问题是什么？",
      "为什么此次异常被判定为严重？",
      "和上周相比有什么变化？",
      "帮我总结成领导汇报版",
    ],
  },
];

interface Citation { title: string; category: string }
interface DataRow { label: string; value: string; tone?: "default" | "warn" | "danger" }
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: CategoryKey;
  citations?: Citation[];
  steps?: string[];
  dataRows?: DataRow[];
  hit?: boolean;
  time: string;
}

interface ContextRef {
  sourceType: "报告" | "巡检异常" | "关注项";
  sourceId: string;
  title: string;
  snapshot?: string;
}

interface Conversation {
  id: string;
  title: string;
  category: CategoryKey;
  updatedAt: string;
  messages: Msg[];
  context?: ContextRef;
}

const initialConversations: Conversation[] = [
  { id: "c1", title: "磁盘空间不足处理", category: "knowledge", updatedAt: "10 分钟前", messages: [welcomeMsg("knowledge")] },
  { id: "c2", title: "本周巡检异常", category: "data", updatedAt: "1 小时前", messages: [welcomeMsg("data")] },
  {
    id: "c3", title: "app-svc-01 CPU 分析追问", category: "context", updatedAt: "昨天",
    messages: [welcomeMsg("context")],
    context: { sourceType: "报告", sourceId: "r3", title: "app-svc-01 CPU 持续高位 故障分析报告" },
  },
];

function welcomeMsg(cat: CategoryKey): Msg {
  const c = CATEGORIES.find((x) => x.key === cat)!;
  return {
    id: "w-" + Math.random().toString(36).slice(2, 8),
    role: "assistant",
    content: `您好，当前会话类别为「${c.label}」。${c.guideline}`,
    time: now(),
  };
}
function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Assistant() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>(initialConversations[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;
  const category = active.category;
  const cat = CATEGORIES.find((c) => c.key === category)!;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active.messages, loading]);

  // 接收来自报告中心 / 巡检中心的「追问」跳转
  useEffect(() => {
    const raw = sessionStorage.getItem("assistant.context")
      || sessionStorage.getItem("assistant.pendingReportContext");
    if (!raw) return;
    sessionStorage.removeItem("assistant.context");
    sessionStorage.removeItem("assistant.pendingReportContext");
    try {
      const parsed = JSON.parse(raw);
      const ctx: ContextRef = parsed.sourceType
        ? parsed
        : { sourceType: "报告", sourceId: parsed.id, title: parsed.title, snapshot: parsed.type };
      const id = "c-" + Date.now();
      setConversations((cs) => [{
        id,
        title: `追问：${ctx.title}`,
        category: "context",
        updatedAt: "刚刚",
        messages: [welcomeMsg("context")],
        context: ctx,
      }, ...cs]);
      setActiveId(id);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newConversation(catKey: CategoryKey) {
    const id = "c-" + Date.now();
    setConversations((cs) => [{
      id, title: "新会话", category: catKey, updatedAt: "刚刚",
      messages: [welcomeMsg(catKey)],
    }, ...cs]);
    setActiveId(id);
  }

  function switchCategory(catKey: CategoryKey) {
    if (active.messages.length <= 1) {
      setConversations((cs) => cs.map((c) => c.id === activeId
        ? { ...c, category: catKey, messages: [welcomeMsg(catKey)] }
        : c));
    } else {
      newConversation(catKey);
    }
  }

  function ask(q: string) {
    if (!q.trim() || loading) return;
    const userMsg: Msg = { id: "u-" + Date.now(), role: "user", content: q, category, time: now() };
    setConversations((cs) => cs.map((c) => c.id === activeId
      ? { ...c, title: c.messages.length <= 1 ? q.slice(0, 18) : c.title, updatedAt: "刚刚", messages: [...c.messages, userMsg] }
      : c));
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const reply = generateReply(q, category, active.context);
      setConversations((cs) => cs.map((c) => c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c));
      setLoading(false);
    }, 900);
  }

  const isWelcome = active.messages.length <= 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-9rem)]">
      <aside className="lg:col-span-3 panel flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b">
          <Button onClick={() => newConversation("knowledge")} className="w-full justify-start gap-2 h-9" variant="outline">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">新建会话</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘ K</span>
          </Button>
        </div>
        <div className="px-3 pt-3 pb-1 text-xs text-muted-foreground">历史会话</div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {conversations.map((c) => {
            const m = CATEGORIES.find((x) => x.key === c.category)!;
            const Icon = m.icon;
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2 transition ${
                  activeId === c.id ? "bg-primary-soft border border-primary/30" : "hover:bg-secondary border border-transparent"
                }`}>
                <div className={`h-7 w-7 rounded-md ${m.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span className={`px-1 rounded ${m.bg} ${m.color}`}>{m.short}</span>
                    <Clock className="h-3 w-3" /> {c.updatedAt}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="panel flex flex-col lg:col-span-9 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">智能问答 Agent</h3>
              <p className="text-xs text-muted-foreground">辅助决策 · 不直接执行生产写操作 · 全过程留痕</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isWelcome && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${cat.bg} ${cat.border} ${cat.color}`}>
                <cat.icon className="h-3 w-3" />
                {cat.label}
              </span>
            )}
            <StatusBadge tone="success" dot>在线</StatusBadge>
          </div>
        </div>

        {!isWelcome && category === "context" && active.context && (
          <div className="px-5 py-2 border-b bg-secondary/30 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">当前追问的上下文：</span>
            <span className="text-xs font-medium">{active.context.title}</span>
            <StatusBadge tone="info" className="ml-auto">{active.context.sourceType}</StatusBadge>
          </div>
        )}

        {isWelcome ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl flex flex-col items-center">
              <h1 className="text-3xl font-semibold tracking-wide mb-2 text-foreground">智能问答助手</h1>
              <p className="text-sm text-muted-foreground mb-8">询问运维知识、查询系统数据、就特定报告或异常展开追问</p>

              <ComposerBox input={input} setInput={setInput} ask={ask} category={category} cat={cat}
                onSwitchCategory={switchCategory} loading={loading} large />

              <div className="w-full mt-6 space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" /> 「{cat.label}」常见提问
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.examples.map((s) => (
                    <button key={s} onClick={() => ask(s)}
                      className="text-left rounded-lg border bg-card hover:border-primary/40 hover:shadow-elev-sm p-3 text-sm transition flex items-start justify-between gap-2 group">
                      <span className="line-clamp-2">{s}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {active.messages.map((m) => <Message key={m.id} msg={m} />)}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <span className="flex items-center gap-1">
                    正在处理「{cat.label}」请求
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                      <span className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <span className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </span>
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t p-4 bg-secondary/30">
              <ComposerBox input={input} setInput={setInput} ask={ask} category={category} cat={cat}
                onSwitchCategory={switchCategory} loading={loading} />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Quote className="h-3 w-3" />
                助手仅提供分析与建议，不直接执行重启服务、修改配置等生产写操作
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ComposerBox({
  input, setInput, ask, category, cat, onSwitchCategory, loading, large,
}: {
  input: string; setInput: (v: string) => void; ask: (q: string) => void;
  category: CategoryKey; cat: Category;
  onSwitchCategory: (k: CategoryKey) => void; loading: boolean; large?: boolean;
}) {
  const Icon = cat.icon;
  return (
    <div className={`w-full rounded-2xl border bg-card shadow-elev-sm focus-within:border-primary/50 focus-within:shadow-elev-md transition ${large ? "p-3" : "p-2.5"}`}>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
        placeholder={`「${cat.label}」：${cat.examples[0]}`}
        className={`resize-none border-0 focus-visible:ring-0 shadow-none px-2 ${large ? "min-h-[64px] text-sm" : "min-h-[44px] text-sm"}`}
        rows={large ? 2 : 1} />
      <div className="flex items-center gap-2 px-1 pt-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button"
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${cat.bg} ${cat.border} ${cat.color} hover:shadow-elev-sm transition`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">{cat.label}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {CATEGORIES.filter((c) => c.key !== "context").map((c) => {
              const CIcon = c.icon;
              const active = c.key === category;
              return (
                <DropdownMenuItem key={c.key} onClick={() => onSwitchCategory(c.key)} className="flex items-start gap-2 py-2">
                  <div className={`h-7 w-7 rounded-md ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <CIcon className={`h-3.5 w-3.5 ${c.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{c.label}</span>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.desc}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground hidden sm:inline truncate flex-1">
          {cat.guideline.length > 40 ? cat.guideline.slice(0, 40) + "…" : cat.guideline}
        </span>

        <Button onClick={() => ask(input)} disabled={!input.trim() || loading} size="sm" className="h-8 px-3 ml-auto sm:ml-0">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    const cat = msg.category ? CATEGORIES.find((c) => c.key === msg.category) : null;
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          {cat && <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>}
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">{msg.content}</div>
          <span className="text-xs text-muted-foreground">{msg.time}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[88%] space-y-2.5 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 text-sm whitespace-pre-line leading-relaxed">
          {msg.content}
        </div>
        {msg.steps && (
          <ol className="space-y-1.5 ml-1">
            {msg.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground/85">
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        )}
        {msg.dataRows && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 text-xs font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> 查询结果
            </div>
            <table className="w-full text-xs">
              <tbody>
                {msg.dataRows.map((r, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                    <td className={`px-3 py-2 text-right font-medium ${
                      r.tone === "danger" ? "text-destructive" : r.tone === "warn" ? "text-warning" : ""
                    }`}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {msg.citations && (
          <div className="flex flex-wrap gap-1.5">
            {msg.citations.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-accent text-accent-foreground border border-accent/30">
                <FileText className="h-3 w-3" /> {c.title}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{msg.time}</span>
          {msg.category === "knowledge" && msg.hit !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              msg.hit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}>
              {msg.hit ? "知识命中" : "未命中（已记入知识缺口）"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function generateReply(q: string, category: CategoryKey, ctx?: ContextRef): Msg {
  const base = { id: "a-" + Date.now(), role: "assistant" as const, time: now(), category };

  if (category === "knowledge") {
    const hit = /磁盘|CPU|交换机|内存|Ping|MySQL|MQ|重启/i.test(q);
    if (hit) {
      return {
        ...base, hit: true,
        content: "已为您从知识库中检索到相关条目，建议处理步骤如下：",
        steps: [
          "确认告警来源与影响范围（业务系统、影响用户数）",
          "登录主机执行基础排查命令，收集现场数据",
          "对照 SOP 文档逐项处理，避免越权操作",
          "处理后持续观察 30 分钟，确认指标恢复",
        ],
        citations: [
          { title: "Linux 主机基础排查 SOP v1.3", category: "SOP" },
          { title: "常见告警处理 FAQ v1.1", category: "FAQ" },
        ],
      };
    }
    return {
      ...base, hit: false,
      content: "抱歉，当前知识库中未检索到与您问题高度匹配的条目。\n\n本次提问已记入「知识缺口」，将出现在下一份《知识服务情况分析报告》中，提示知识管理员补充相关文档。",
    };
  }

  if (category === "data") {
    if (/巡检.*异常|异常.*巡检/.test(q)) {
      return {
        ...base, content: "本周（2025-04-15 ~ 2025-04-22）巡检异常统计如下：",
        dataRows: [
          { label: "巡检任务总数", value: "42" },
          { label: "异常任务", value: "5", tone: "danger" },
          { label: "关注任务", value: "11", tone: "warn" },
          { label: "异常主机", value: "8 台", tone: "danger" },
          { label: "Top 异常类型", value: "磁盘水位 (4) / CPU (2)" },
        ],
      };
    }
    if (/关注/.test(q)) {
      return {
        ...base, content: "当前待处理的关注项：",
        dataRows: [
          { label: "app-web-02 CPU 71%", value: "关注", tone: "warn" },
          { label: "db-slave-01 磁盘 68%", value: "关注", tone: "warn" },
          { label: "db-master-01 内存 82%", value: "关注 · 分析中", tone: "warn" },
        ],
      };
    }
    return {
      ...base, content: "已完成系统数据查询，结果如下：",
      dataRows: [
        { label: "查询范围", value: "全部资产 / 最近 24 小时" },
        { label: "命中记录数", value: "126" },
        { label: "异常记录", value: "9", tone: "warn" },
      ],
    };
  }

  // context
  if (!ctx) {
    return { ...base, content: "请先在报告中心 / 巡检中心 / 故障分析页面打开一条上下文，再返回此处进行追问。" };
  }
  if (/最需要关注|重点|关键/.test(q)) {
    return {
      ...base, content: `针对《${ctx.title}》，建议重点关注的三个问题：`,
      steps: [
        "核心交换机 core-sw-01 端口持续抖动，影响 3 个业务系统访问",
        "数据库主库 db-master-01 内存增长趋势异常，预计 5 天内触达高水位",
        "MQ 集群消息堆积事件 4 起，需评估消费者扩容",
      ],
      citations: [{ title: ctx.title, category: ctx.sourceType }],
    };
  }
  if (/为什么|原因|判定/.test(q)) {
    return {
      ...base,
      content: "判定依据：\n\n• 采样窗口内多次触发异常阈值\n• 环比 / 同比出现明显偏离\n• 关联日志中出现异常关键字\n• 参考历史同类案例综合评估\n\n综合判定为高优先级需人工介入。",
      citations: [{ title: ctx.title, category: ctx.sourceType }],
    };
  }
  if (/对比|相比|变化/.test(q)) {
    return {
      ...base, content: "与上一周期相比的主要变化：",
      dataRows: [
        { label: "异常项数量", value: "16 → 12（↓25%）" },
        { label: "关注项数量", value: "8 → 11（↑37%）", tone: "warn" },
        { label: "新增关注对象", value: "core-sw-01 端口抖动", tone: "danger" },
        { label: "已闭环项", value: "redis-01 内存泄漏" },
      ],
    };
  }
  if (/汇报|总结|领导/.test(q)) {
    return {
      ...base,
      content: `《${ctx.title}》—— 领导汇报版：\n\n本周整体运行平稳，发现待重点关注对象若干，已形成处置建议并流转责任人；异常巡检项较上周下降 25%，知识库支撑效率持续提升。建议本周重点跟进核心交换机与数据库主库两处趋势性问题。`,
      citations: [{ title: ctx.title, category: ctx.sourceType }],
    };
  }
  return {
    ...base, content: `已基于《${ctx.title}》分析您的问题。如需更深入解读，可继续追问具体设备、指标或时间段。`,
    citations: [{ title: ctx.title, category: ctx.sourceType }],
  };
}
