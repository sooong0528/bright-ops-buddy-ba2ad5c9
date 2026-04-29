import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send, Sparkles, BookOpen, FileText, Bot, User, Quote, Lightbulb,
  Stethoscope, ListChecks, Gauge, Search, Plus, Clock, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { knowledge } from "@/lib/mockData";

/* ===================== 四类问题定义 ===================== */
type CategoryKey = "diagnosis" | "operation" | "metric" | "knowledge";

interface Category {
  key: CategoryKey;
  label: string;
  icon: any;
  desc: string;
  color: string;
  bg: string;
  border: string;
  examples: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "diagnosis",
    label: "故障诊断",
    icon: Stethoscope,
    desc: "针对告警、异常进行根因分析与排查建议",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    examples: [
      "app-svc-01 CPU 持续 92% 怎么排查？",
      "mq-01 节点 Ping 不通是什么原因？",
      "db-master-01 内存增长过快，可能是什么问题？",
    ],
  },
  {
    key: "operation",
    label: "操作指引",
    icon: ListChecks,
    desc: "提供标准化操作流程（SOP），辅助执行",
    color: "text-primary",
    bg: "bg-primary-soft",
    border: "border-primary/30",
    examples: [
      "重启业务服务前后需要确认什么？",
      "如何安全清理磁盘空间？",
      "MySQL 切主操作的标准流程？",
    ],
  },
  {
    key: "metric",
    label: "指标解读",
    icon: Gauge,
    desc: "解释 Zabbix 监控指标含义、阈值与影响",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    examples: [
      "CPU 使用率多少算异常？",
      "内存 use 与 available 的区别？",
      "Ping 丢包率超过多少需要关注？",
    ],
  },
  {
    key: "knowledge",
    label: "知识检索",
    icon: BookOpen,
    desc: "检索运维手册、FAQ、历史故障案例",
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    examples: [
      "有没有 MQ 宕机的历史案例？",
      "查找磁盘水位告警相关 SOP",
      "Zabbix 基础指标说明文档",
    ],
  },
];

/* ===================== 类型定义 ===================== */
interface Citation {
  title: string;
  category: string;
}
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: CategoryKey;
  citations?: Citation[];
  steps?: string[];
  time: string;
}

interface Conversation {
  id: string;
  title: string;
  category: CategoryKey;
  updatedAt: string;
  messages: Msg[];
}

/* ===================== 历史会话（mock） ===================== */
const initialConversations: Conversation[] = [
  {
    id: "c1",
    title: "app-svc-01 CPU 高",
    category: "diagnosis",
    updatedAt: "10 分钟前",
    messages: [
      welcomeMsg(),
    ],
  },
  {
    id: "c2",
    title: "重启服务前确认",
    category: "operation",
    updatedAt: "昨天",
    messages: [welcomeMsg()],
  },
  {
    id: "c3",
    title: "Ping 指标含义",
    category: "metric",
    updatedAt: "2 天前",
    messages: [welcomeMsg()],
  },
];

function welcomeMsg(): Msg {
  return {
    id: "w-" + Math.random().toString(36).slice(2, 8),
    role: "assistant",
    content:
      "您好，我是知识问答 Agent。请先选择问题类别，我会按照对应的知识范围（SOP / 故障案例 / 运维手册 / FAQ）为您作答，并附带引用来源。",
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
  const [category, setCategory] = useState<CategoryKey>("diagnosis");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;
  const cat = CATEGORIES.find((c) => c.key === category)!;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active.messages, loading]);

  function newConversation() {
    const id = "c-" + Date.now();
    const conv: Conversation = {
      id,
      title: "新会话",
      category,
      updatedAt: "刚刚",
      messages: [welcomeMsg()],
    };
    setConversations((cs) => [conv, ...cs]);
    setActiveId(id);
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
              title: c.messages.length <= 1 ? q.slice(0, 16) : c.title,
              category,
              updatedAt: "刚刚",
              messages: [...c.messages, userMsg],
            }
          : c,
      ),
    );
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = generateReply(q, category);
      setConversations((cs) =>
        cs.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c)),
      );
      setLoading(false);
    }, 900);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-9rem)]">
      {/* 左侧：会话历史 */}
      <aside className="lg:col-span-3 panel flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b">
          <Button onClick={newConversation} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" /> 新建会话
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
                onClick={() => {
                  setActiveId(c.id);
                  setCategory(c.category);
                }}
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
                    <Clock className="h-3 w-3" /> {c.updatedAt}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 中间：对话区 */}
      <div className="panel flex flex-col lg:col-span-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">知识问答 Agent</h3>
              <p className="text-xs text-muted-foreground">辅助决策 · 不直接执行生产写操作</p>
            </div>
          </div>
          <StatusBadge tone="success" dot>在线</StatusBadge>
        </div>

        {/* 类别切换 */}
        <div className="px-4 py-3 border-b bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">问题类别：</span>
            <span className="text-xs text-foreground/70">{cat.desc}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                    isActive
                      ? `${c.bg} ${c.border} ${c.color}`
                      : "bg-card border-border text-foreground/70 hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {active.messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}

          {/* 首次进入展示该类别的示例问题 */}
          {active.messages.length === 1 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-primary" /> 「{cat.label}」常见问题
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.examples.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className={`text-left rounded-lg border bg-card hover:${cat.bg} hover:${cat.border} p-3 text-sm transition group`}
                  >
                    <span className="line-clamp-2">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="flex items-center gap-1">
                正在检索「{cat.label}」相关知识
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
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder={`基于「${cat.label}」提问，例如：${cat.examples[0]}`}
              className="resize-none bg-card min-h-[60px]"
              rows={2}
            />
            <Button onClick={() => ask(input)} disabled={!input.trim() || loading} className="h-[60px] px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            回答仅供参考，所有处理动作请由运维人员确认后执行 · 全过程留痕
          </p>
        </div>
      </div>

      {/* 右侧：相关知识 */}
      <aside className="panel p-5 hidden lg:flex lg:col-span-3 flex-col gap-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" /> 相关知识
          </h3>
          <p className="text-xs text-muted-foreground mb-3">基于当前类别筛选</p>
          <div className="space-y-2">
            {knowledgeForCategory(category).map((k) => (
              <div key={k.id} className="rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-elev-sm transition">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium leading-snug">{k.title}</span>
                  <StatusBadge tone="info" className="shrink-0">{k.category}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{k.excerpt}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {k.tags.map((t) => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-primary-soft/60 border border-primary/20 p-3">
          <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1.5">
            <Quote className="h-3 w-3" /> 平台原则
          </p>
          <p className="text-xs leading-relaxed text-foreground/80">
            助手仅提供分析与建议，不直接执行重启服务、修改配置等生产写操作。所有问答均保留依据与来源。
          </p>
        </div>
      </aside>
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
      <div className="max-w-[85%] space-y-2.5">
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
        {msg.citations && (
          <div className="flex flex-wrap gap-1.5">
            {msg.citations.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-accent text-accent-foreground border border-accent/30">
                <FileText className="h-3 w-3" /> {c.title}
              </span>
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground block">{msg.time}</span>
      </div>
    </div>
  );
}

/* ===================== 知识筛选 ===================== */
function knowledgeForCategory(cat: CategoryKey) {
  if (cat === "diagnosis") return knowledge.filter((k) => k.category === "故障案例" || k.category === "SOP").slice(0, 4);
  if (cat === "operation") return knowledge.filter((k) => k.category === "SOP" || k.category === "FAQ").slice(0, 4);
  if (cat === "metric") return knowledge.filter((k) => k.category === "运维手册").slice(0, 4);
  return knowledge.slice(0, 4);
}

/* ===================== 回复生成（mock） ===================== */
function generateReply(q: string, category: CategoryKey): Msg {
  const base = {
    id: "a-" + Date.now(),
    role: "assistant" as const,
    time: now(),
    category,
  };

  if (category === "diagnosis") {
    return {
      ...base,
      content: "结合 Zabbix 监控记录与历史案例，建议按以下顺序排查：",
      steps: [
        "在 Zabbix 中确认指标高位是否伴随负载、上下文切换升高",
        "登录主机执行 top / pidstat，定位占用最高的进程与线程",
        "若为 Java 应用，使用 jstack 查看线程栈，关注是否存在死循环或慢任务",
        "对比昨日同时段流量与请求量，判断是否突增导致",
        "如确认无异常流量，可联系应用方评估是否需要重启，并按 SOP 执行",
      ],
      citations: [
        { title: "Linux 主机 CPU 高负载排查 SOP v1.3", category: "SOP" },
        { title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例" },
      ],
    };
  }

  if (category === "operation") {
    return {
      ...base,
      content: "该操作为高风险变更，建议严格按以下 SOP 执行：",
      steps: [
        "前置：确认变更窗口、通知相关业务方、备份配置",
        "前置：检查依赖服务状态、确认回滚方案",
        "执行：使用标准命令，分批次进行，避免全量影响",
        "执行后：核对进程、端口、健康检查接口",
        "执行后：观察 30 分钟监控曲线，必要时同步问题群",
      ],
      citations: [{ title: "服务重启前后确认事项 FAQ v1.1", category: "FAQ" }],
    };
  }

  if (category === "metric") {
    return {
      ...base,
      content:
        "Zabbix 中该指标的业务含义与阈值参考如下：\n\n• 含义：反映系统资源在采样周期内的占用比例\n• 正常区间：< 70%\n• 关注区间：70% ~ 85%\n• 异常区间：> 85% 持续 10 分钟\n\n注意：阈值会因业务类型不同而调整，数据库类节点通常更敏感。",
      citations: [{ title: "Zabbix 基础指标含义说明 v1.0", category: "运维手册" }],
    };
  }

  // knowledge
  return {
    ...base,
    content: "已为您检索到以下相关条目，按相关度排序：",
    steps: [
      "Linux 主机 CPU 高负载排查 SOP v1.3 — 命中度 92%",
      "MQ 节点宕机历史故障案例 (2024-11) — 命中度 81%",
      "服务重启前后确认事项 FAQ v1.1 — 命中度 76%",
    ],
    citations: [
      { title: "Linux 主机 CPU 高负载排查 SOP v1.3", category: "SOP" },
      { title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例" },
      { title: "服务重启前后确认事项 FAQ v1.1", category: "FAQ" },
    ],
  };
}
