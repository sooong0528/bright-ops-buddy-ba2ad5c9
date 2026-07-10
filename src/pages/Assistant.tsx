import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, Sparkles, Bot, User, FileText, Lightbulb,
  BookOpen, Database, MessageSquareQuote,
  Plus, Clock, Quote, BarChart3, AlertTriangle, ShieldAlert, Server,
  ArrowRight, FileSearch, ChevronDown, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ===================== 问答类型定义 ===================== */
type CategoryKey = "knowledge" | "data" | "context";

interface Category {
  key: CategoryKey;
  label: string;
  short: string;
  icon: any;
  desc: string;
  guideline: string; // 给用户的提问指引
  color: string;
  bg: string;
  border: string;
  examples: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "knowledge",
    label: "知识问答",
    short: "知识",
    icon: BookOpen,
    desc: "查询运维手册、SOP、FAQ、历史故障案例",
    guideline: "请描述您遇到的问题或想了解的运维知识，例如告警处理、操作步骤、指标含义等。",
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
    label: "数据查询",
    short: "数据",
    icon: Database,
    desc: "查询系统中的巡检、风险、设备等实时数据",
    guideline: "请说明您要查询的数据类型与时间范围，例如「本周异常」「风险最高设备」等。",
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    examples: [
      "本周有哪些巡检异常？",
      "哪些设备风险最高？",
      "最近 24 小时新增告警有哪些？",
      "数据库主机磁盘使用情况？",
    ],
  },
  {
    key: "context",
    label: "上下文追问",
    short: "追问",
    icon: MessageSquareQuote,
    desc: "基于巡检异常、故障分析等当前数据继续提问",
    guideline: "请先从巡检异常或故障分析进入，也可描述要追问的系统、指标和处置建议。",
    color: "text-accent-foreground",
    bg: "bg-accent",
    border: "border-accent",
    examples: [
      "这个异常最可能的根因是什么？",
      "当前建议是否需要先停服务？",
      "处理后应该观察哪些指标？",
      "如果建议不适用，人工记录怎么写？",
    ],
  },
];

/* ===================== 类型定义 ===================== */
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
  hit?: boolean; // 仅 knowledge 类用：是否命中知识库
  time: string;
}

interface OpsContext {
  source: string;
  id: string;
  title: string;
  summary: string;
  metric?: string;
  threshold?: string;
  evidenceSnapshot?: string;
  logEvidence?: string[];
  knowledgeCitations?: string[];
  returnPath?: string;
}

interface Conversation {
  id: string;
  title: string;
  category: CategoryKey;
  updatedAt: string;
  messages: Msg[];
  opsContext?: OpsContext;
}

/* ===================== 历史会话（mock） ===================== */
const initialConversations: Conversation[] = [
  {
    id: "c1",
    title: "磁盘空间不足处理",
    category: "knowledge",
    updatedAt: "10 分钟前",
    messages: [welcomeMsg("knowledge")],
  },
  {
    id: "c2",
    title: "本周巡检异常",
    category: "data",
    updatedAt: "1 小时前",
    messages: [welcomeMsg("data")],
  },
  {
    id: "c3",
    title: "营销系统磁盘异常追问",
    category: "context",
    updatedAt: "昨天",
    messages: [welcomeMsg("context")],
    opsContext: {
      source: "故障分析",
      id: "FA-20260626-001",
      title: "营销系统 / app-svc-01 / Nginx · 磁盘空间不足",
      summary: "建议优先检查 /data/logs 目录占用，确认日志轮转是否失效。",
      metric: "/data/logs 使用率 92%",
      threshold: ">=90% 持续 30 分钟",
      evidenceSnapshot: "Zabbix item vfs.fs.size[/data/logs,pused] 和 error 日志数量同步异常。",
      logEvidence: ["/data/logs/app/error.log · error/exception/timeout/failed 命中 120 条"],
      knowledgeCitations: ["磁盘水位告警处理建议（草稿）", "Linux 主机 CPU 高负载排查 SOP"],
      returnPath: "/fault-analysis/fa-001",
    },
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

/* ===================== 主组件 ===================== */
export default function Assistant() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>(initialConversations[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;
  const category = active.category;
  const cat = CATEGORIES.find((c) => c.key === category)!;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active.messages, loading]);

  // 接收来自巡检异常、故障分析等业务页面的上下文提问
  useEffect(() => {
    const raw = sessionStorage.getItem("assistant.pendingOpsContext");
    if (!raw) return;
    sessionStorage.removeItem("assistant.pendingOpsContext");
    try {
      const ctx = JSON.parse(raw) as OpsContext;
      const id = "c-" + Date.now();
      const conv: Conversation = {
        id,
        title: `追问：${ctx.title}`,
        category: "context",
        updatedAt: "刚刚",
        messages: [welcomeMsg("context")],
        opsContext: ctx,
      };
      setConversations((cs) => [conv, ...cs]);
      setActiveId(id);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newConversation(catKey: CategoryKey) {
    const id = "c-" + Date.now();
    const conv: Conversation = {
      id,
      title: "新会话",
      category: catKey,
      updatedAt: "刚刚",
      messages: [welcomeMsg(catKey)],
    };
    setConversations((cs) => [conv, ...cs]);
    setActiveId(id);
  }

  function switchCategory(catKey: CategoryKey) {
    // 切换类别：在当前会话只有欢迎消息时直接切换；否则新建会话
    if (active.messages.length <= 1) {
      setConversations((cs) =>
        cs.map((c) =>
          c.id === activeId
            ? {
                ...c,
                category: catKey,
                messages: [welcomeMsg(catKey)],
                opsContext: undefined,
              }
            : c,
        ),
      );
    } else {
      newConversation(catKey);
    }
  }

  function ask(q: string) {
    if (!q.trim() || loading) return;
    const userMsg: Msg = {
      id: "u-" + Date.now(),
      role: "user",
      content: q,
      category,
      time: now(),
    };
    setConversations((cs) =>
      cs.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length <= 1 ? q.slice(0, 18) : c.title,
              updatedAt: "刚刚",
              messages: [...c.messages, userMsg],
            }
          : c,
      ),
    );
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = generateReply(q, category, active.opsContext);
      setConversations((cs) =>
        cs.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c)),
      );
      setLoading(false);
    }, 900);
  }

  // 是否处于「欢迎态」（仅一条欢迎消息，未发起提问）
  const isWelcome = active.messages.length <= 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-9rem)]">
      {/* 左侧：会话历史 */}
      <aside className="lg:col-span-3 panel flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b">
          <Button
            onClick={() => newConversation("knowledge")}
            className="w-full justify-start gap-2 h-9"
            variant="outline"
          >
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
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2 transition ${
                  activeId === c.id
                    ? "bg-primary-soft border border-primary/30"
                    : "hover:bg-secondary border border-transparent"
                }`}
              >
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

      {/* 右侧：对话区 */}
      <div className="panel flex flex-col lg:col-span-9 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">智能问答</h3>
              <p className="text-xs text-muted-foreground">提供分析建议 · 不执行生产操作 · 全过程留痕</p>
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

        {/* 业务上下文条 */}
        {!isWelcome && category === "context" && active.opsContext && (
          <div className="px-5 py-3 border-b bg-secondary/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <FileSearch className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">当前上下文</span>
                    <StatusBadge tone="info">{active.opsContext.source}</StatusBadge>
                    <span className="text-xs font-mono text-muted-foreground">{active.opsContext.id}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{active.opsContext.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{active.opsContext.summary}</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {active.opsContext.metric && <ContextInfo label="指标" value={active.opsContext.metric} />}
                    {active.opsContext.threshold && <ContextInfo label="阈值" value={active.opsContext.threshold} />}
                    {active.opsContext.evidenceSnapshot && <ContextInfo label="证据" value={active.opsContext.evidenceSnapshot} />}
                    {active.opsContext.logEvidence?.length ? <ContextInfo label="日志" value={active.opsContext.logEvidence.join("；")} /> : null}
                    {active.opsContext.knowledgeCitations?.length ? <ContextInfo label="知识引用" value={active.opsContext.knowledgeCitations.join("；")} /> : null}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(active.opsContext?.returnPath ?? "/inspection")}
              >
                返回来源
              </Button>
            </div>
          </div>
        )}

        {/* 欢迎态：Kimi 风格大标题 + 居中输入框 */}
        {isWelcome ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl flex flex-col items-center">
              <h1 className="text-3xl font-semibold tracking-wide mb-2 text-foreground">
                智能问答
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                询问运维知识、查询系统数据，或基于当前异常继续追问
              </p>

              <ComposerBox
                input={input}
                setInput={setInput}
                ask={ask}
                category={category}
                cat={cat}
                onSwitchCategory={switchCategory}
                loading={loading}
                large
              />

              {/* 该类别常见提问 */}
              <div className="w-full mt-6 space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" /> 「{cat.label}」常见提问
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.examples.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="text-left rounded-lg border bg-card hover:border-primary/40 hover:shadow-elev-sm p-3 text-sm transition flex items-start justify-between gap-2 group"
                    >
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
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {active.messages.map((m) => (
                <Message key={m.id} msg={m} />
              ))}

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
              <ComposerBox
                input={input}
                setInput={setInput}
                ask={ask}
                category={category}
                cat={cat}
                onSwitchCategory={switchCategory}
                loading={loading}
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Quote className="h-3 w-3" />
                仅提供分析建议，不执行重启服务、修改配置等生产操作
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===================== 输入框组件（Kimi 风格） ===================== */
function ComposerBox({
  input, setInput, ask, category, cat, onSwitchCategory, loading, large,
}: {
  input: string;
  setInput: (v: string) => void;
  ask: (q: string) => void;
  category: CategoryKey;
  cat: Category;
  onSwitchCategory: (k: CategoryKey) => void;
  loading: boolean;
  large?: boolean;
}) {
  const Icon = cat.icon;
  return (
    <div className={`w-full rounded-2xl border bg-card shadow-elev-sm focus-within:border-primary/50 focus-within:shadow-elev-md transition ${large ? "p-3" : "p-2.5"}`}>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            ask(input);
          }
        }}
        placeholder={`「${cat.label}」：${cat.examples[0]}`}
        className={`resize-none border-0 focus-visible:ring-0 shadow-none px-2 ${large ? "min-h-[64px] text-sm" : "min-h-[44px] text-sm"}`}
        rows={large ? 2 : 1}
      />
      <div className="flex items-center gap-2 px-1 pt-1">
        {/* 模式切换 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${cat.bg} ${cat.border} ${cat.color} hover:shadow-elev-sm transition`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">{cat.label}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {CATEGORIES.map((c) => {
              const CIcon = c.icon;
              const active = c.key === category;
              return (
                <DropdownMenuItem
                  key={c.key}
                  onClick={() => onSwitchCategory(c.key)}
                  className="flex items-start gap-2 py-2"
                >
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

        <Button
          onClick={() => ask(input)}
          disabled={!input.trim() || loading}
          size="sm"
          className="h-8 px-3 ml-auto sm:ml-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ===================== 消息组件 ===================== */
function Message({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    const cat = msg.category ? CATEGORIES.find((c) => c.key === msg.category) : null;
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          {cat && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
              {cat.label}
            </span>
          )}
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
            {msg.content}
          </div>
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
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {i + 1}
                </span>
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
              {msg.hit ? "知识命中" : "未命中，已记录为知识缺口"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== 回复生成（mock） ===================== */
function ContextInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-2.5 py-2">
      <span className="text-muted-foreground">{label}：</span>
      <span className="text-foreground/85">{value}</span>
    </div>
  );
}

function generateReply(
  q: string,
  category: CategoryKey,
  opsCtx?: OpsContext,
): Msg {
  const base = {
    id: "a-" + Date.now(),
    role: "assistant" as const,
    time: now(),
    category,
  };

  if (category === "knowledge") {
    // 简单模拟命中：如包含「磁盘」「CPU」「交换机」等关键词则命中
    const hit = /磁盘|CPU|交换机|内存|Ping|MySQL|MQ|重启/i.test(q);
    if (hit) {
      return {
        ...base,
        hit: true,
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
      ...base,
      hit: false,
      content:
        "抱歉，当前知识库中未检索到与您问题高度匹配的条目。\n\n本次提问已记入「知识缺口」，将出现在下一份《知识服务情况分析报告》中，提示知识管理员补充相关文档。",
    };
  }

  if (category === "data") {
    if (/巡检.*异常|异常.*巡检/.test(q)) {
      return {
        ...base,
        content: "本周（2026-04-22 ~ 2026-04-29）巡检异常统计如下：",
        dataRows: [
          { label: "巡检任务总数", value: "42" },
          { label: "异常任务", value: "5", tone: "danger" },
          { label: "关注任务", value: "11", tone: "warn" },
          { label: "异常主机", value: "8 台", tone: "danger" },
          { label: "Top 异常类型", value: "磁盘水位 (4) / CPU (2)" },
        ],
      };
    }
    if (/风险.*高|高.*风险|风险设备/.test(q)) {
      return {
        ...base,
        content: "当前风险评分 Top 5 设备：",
        dataRows: [
          { label: "core-sw-01（核心交换机）", value: "风险分 92", tone: "danger" },
          { label: "db-master-01（主库）", value: "风险分 85", tone: "danger" },
          { label: "mq-01（消息中间件）", value: "风险分 78", tone: "warn" },
          { label: "app-svc-03（应用服务）", value: "风险分 71", tone: "warn" },
          { label: "redis-02（缓存）", value: "风险分 65", tone: "warn" },
        ],
      };
    }
    return {
      ...base,
      content: "已完成系统数据查询，结果如下：",
      dataRows: [
        { label: "查询范围", value: "全部主机 / 最近 24 小时" },
        { label: "命中记录数", value: "126" },
        { label: "异常记录", value: "9", tone: "warn" },
      ],
    };
  }

  if (!opsCtx) {
    return {
      ...base,
      content: "当前没有绑定具体异常或分析任务。请从巡检异常或故障分析详情进入，或直接描述系统、指标、异常现象。",
    };
  }
  if (/最需要关注|重点|关键/.test(q)) {
    return {
      ...base,
      content: `针对「${opsCtx.title}」，当前最需要关注的三个问题是：`,
      steps: [
        "确认 /data/logs 目录是否持续增长，避免磁盘继续抬升影响服务写日志",
        "检查日志轮转任务是否失效，重点看 cron、logrotate 配置和最近执行结果",
        "处理后持续观察磁盘水位、error 日志增量和 Nginx 访问状态",
      ],
      citations: [{ title: opsCtx.id, category: opsCtx.source }],
    };
  }
  if (/为什么|原因|判定/.test(q)) {
    return {
      ...base,
      content:
        "当前优先怀疑日志轮转失效，依据是：\n\n• 异常指标集中在 /data/logs，磁盘水位已达 92%\n• 同期 error 日志增量明显升高\n• 处置建议指向目录占用确认和日志清理，而不是主机整体容量不足\n\n建议先做只读确认，再由人工执行清理或轮转修复。",
      citations: [{ title: opsCtx.id, category: opsCtx.source }],
    };
  }
  if (/观察|恢复|验证|处理后/.test(q)) {
    return {
      ...base,
      content: "处理后建议观察以下指标：",
      dataRows: [
        { label: "/data/logs 使用率", value: "降至 80% 以下", tone: "warn" },
        { label: "error 日志增量", value: "连续 30 分钟无异常突增" },
        { label: "Nginx 访问状态", value: "无 5xx 持续增长" },
        { label: "巡检复核", value: "重新分析后状态为已完成" },
      ],
    };
  }
  if (/不适用|不正确|其他处理|人工记录/.test(q)) {
    return {
      ...base,
      content: "如果系统建议不适用，人工处理记录建议包含：",
      steps: [
        "选择「未采纳系统建议」或「使用其他处理方式」",
        "说明未采纳原因，例如根因不在日志目录、业务窗口不允许清理等",
        "记录实际处理动作、执行人、时间和处理前后截图",
        "保存后归档，后续可进入知识缺口或案例沉淀",
      ],
      citations: [{ title: opsCtx.id, category: opsCtx.source }],
    };
  }
  return {
    ...base,
    content: `已基于「${opsCtx.title}」分析您的问题。\n\n上下文摘要：${opsCtx.summary}\n\n建议优先确认影响范围，再进行人工处置标记。`,
    citations: [{ title: opsCtx.id, category: opsCtx.source }],
  };
}
