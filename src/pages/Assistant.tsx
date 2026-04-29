import { useState, useRef, useEffect } from "react";
import {
  Send, Sparkles, Bot, User, FileText, Lightbulb,
  BookOpen, Database, FileBarChart, MessageSquareQuote,
  Plus, Clock, Quote, BarChart3, AlertTriangle, ShieldAlert, Server,
  ArrowRight, FileSearch, ChevronDown, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ===================== 四类问答类型定义 ===================== */
type CategoryKey = "knowledge" | "data" | "report" | "report_followup";

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
    key: "report",
    label: "报告生成",
    short: "报告",
    icon: FileBarChart,
    desc: "通过自然语言生成巡检质量 / 风险研判 / 知识服务报告",
    guideline: "请指定报告类型、时间范围与分析对象，仅支持三类报告：巡检质量、风险研判、知识服务。",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    examples: [
      "生成本周巡检质量报告",
      "帮我生成风险研判周报",
      "重新生成最近 30 天的知识服务报告",
      "生成上月数据库主机的巡检质量月报",
    ],
  },
  {
    key: "report_followup",
    label: "报告追问",
    short: "追问",
    icon: MessageSquareQuote,
    desc: "针对某份报告进行解读、对比、汇总",
    guideline: "请先在报告中心打开一份报告，再就该报告内容进行追问。当前演示已绑定一份样例报告。",
    color: "text-accent-foreground",
    bg: "bg-accent",
    border: "border-accent",
    examples: [
      "这份报告里最需要关注的三个问题是什么？",
      "为什么核心交换机被判定为高风险？",
      "和上周相比有什么变化？",
      "帮我总结成领导汇报版",
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
  reportCard?: { type: string; range: string; status: string };
  hit?: boolean; // 仅 knowledge 类用：是否命中知识库
  time: string;
}

interface Conversation {
  id: string;
  title: string;
  category: CategoryKey;
  updatedAt: string;
  messages: Msg[];
  reportContext?: { id: string; title: string; type: string }; // 报告追问上下文
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
    title: "生成本周巡检质量报告",
    category: "report",
    updatedAt: "昨天",
    messages: [welcomeMsg("report")],
  },
  {
    id: "c4",
    title: "风险研判周报追问",
    category: "report_followup",
    updatedAt: "2 天前",
    messages: [welcomeMsg("report_followup")],
    reportContext: { id: "R-2026-W17", title: "风险研判周报 (2026-W17)", type: "风险研判" },
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

  // 接收来自报告中心的「追问」跳转
  useEffect(() => {
    const raw = sessionStorage.getItem("assistant.pendingReportContext");
    if (!raw) return;
    sessionStorage.removeItem("assistant.pendingReportContext");
    try {
      const ctx = JSON.parse(raw) as { id: string; title: string; type: string };
      const id = "c-" + Date.now();
      const conv: Conversation = {
        id,
        title: `追问：${ctx.title}`,
        category: "report_followup",
        updatedAt: "刚刚",
        messages: [welcomeMsg("report_followup")],
        reportContext: ctx,
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
      reportContext: catKey === "report_followup"
        ? { id: "R-2026-W17", title: "风险研判周报 (2026-W17)", type: "风险研判" }
        : undefined,
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
                reportContext: catKey === "report_followup"
                  ? { id: "R-2026-W17", title: "风险研判周报 (2026-W17)", type: "风险研判" }
                  : undefined,
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
      const reply = generateReply(q, category, active.reportContext);
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

        {/* 报告追问上下文条 */}
        {!isWelcome && category === "report_followup" && active.reportContext && (
          <div className="px-5 py-2 border-b bg-secondary/30 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">当前追问的报告：</span>
            <span className="text-xs font-medium">{active.reportContext.title}</span>
            <StatusBadge tone="info" className="ml-auto">{active.reportContext.type}</StatusBadge>
          </div>
        )}

        {/* 欢迎态：Kimi 风格大标题 + 居中输入框 */}
        {isWelcome ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl flex flex-col items-center">
              <h1 className="text-3xl font-semibold tracking-wide mb-2 text-foreground">
                智能问答助手
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                询问运维知识、查询系统数据、生成或解读报告
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
                助手仅提供分析与建议，不直接执行重启服务、修改配置等生产写操作
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

        {msg.reportCard && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileBarChart className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold">{msg.reportCard.type}</span>
              <StatusBadge tone="success" className="ml-auto">{msg.reportCard.status}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">时间范围：{msg.reportCard.range}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs">查看报告</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs">导出 PDF</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs">归档至报告中心</Button>
            </div>
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

/* ===================== 回复生成（mock，按四类区分） ===================== */
function generateReply(
  q: string,
  category: CategoryKey,
  reportCtx?: { id: string; title: string; type: string },
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
        "抱歉，当前知识库中未检索到与您问题高度匹配的条目。\n\n本次提问已记入「知识缺口」，将出现在下一份《知识服务月报》中，提示知识管理员补充相关文档。",
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

  if (category === "report") {
    // 识别报告类型
    let type = "巡检质量报告（周报）";
    let range = "本周（2026-04-22 ~ 2026-04-29）";
    if (/风险/.test(q)) type = "风险研判报告（周报）";
    else if (/知识/.test(q)) {
      type = "知识服务报告（月报）";
      range = "最近 30 天（2026-03-30 ~ 2026-04-29）";
    } else if (/月/.test(q)) range = "最近 30 天";

    return {
      ...base,
      content: `已根据您的描述匹配报告模板并生成报告，结果已自动归档至报告中心。`,
      reportCard: { type, range, status: "已生成" },
    };
  }

  // report_followup
  if (!reportCtx) {
    return {
      ...base,
      content: "请先在报告中心打开一份报告，再就该报告内容进行追问。",
    };
  }
  if (/最需要关注|重点|关键/.test(q)) {
    return {
      ...base,
      content: `针对《${reportCtx.title}》，本周最需要关注的三个问题是：`,
      steps: [
        "核心交换机 core-sw-01 端口持续抖动，影响 3 个业务系统访问",
        "数据库主库 db-master-01 内存增长趋势异常，预计 5 天内触达高水位",
        "MQ 集群消息堆积事件 4 起，需评估消费者扩容",
      ],
      citations: [{ title: reportCtx.title, category: reportCtx.type }],
    };
  }
  if (/为什么|原因|判定/.test(q)) {
    return {
      ...base,
      content:
        "核心交换机被判定为高风险的依据：\n\n• 本周 Ping 抖动事件 12 起，超过基线 (≤3)\n• 端口错包数环比上升 38%\n• 影响业务系统数 3 个，覆盖核心交易链路\n\n综合风险评分 92（高）。",
      citations: [{ title: reportCtx.title, category: reportCtx.type }],
    };
  }
  if (/对比|相比|变化/.test(q)) {
    return {
      ...base,
      content: "与上周相比的主要变化：",
      dataRows: [
        { label: "高风险设备数", value: "2 → 3", tone: "warn" },
        { label: "异常巡检项", value: "16 → 12（↓25%）" },
        { label: "新增风险项", value: "core-sw-01 端口抖动", tone: "danger" },
        { label: "已闭环风险", value: "redis-01 内存泄漏" },
      ],
    };
  }
  if (/汇报|总结|领导/.test(q)) {
    return {
      ...base,
      content:
        `《${reportCtx.title}》—— 领导汇报版：\n\n本周整体运行平稳，发现高风险设备 3 台，重点关注核心交换机端口抖动问题，已制定整改计划；异常巡检项较上周下降 25%，知识库支撑效率持续提升。建议本周重点跟进核心交换机硬件巡检。`,
      citations: [{ title: reportCtx.title, category: reportCtx.type }],
    };
  }
  return {
    ...base,
    content: `已基于《${reportCtx.title}》分析您的问题。如需更深入解读，可继续追问具体设备或指标。`,
    citations: [{ title: reportCtx.title, category: reportCtx.type }],
  };
}
