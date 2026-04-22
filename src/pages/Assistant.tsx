import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, BookOpen, FileText, Bot, User, Quote, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { knowledge } from "@/lib/mockData";

interface Citation {
  title: string;
  category: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  steps?: string[];
}

const seeded: Msg[] = [
  {
    role: "assistant",
    content:
      "您好，我是知识问答 Agent。我可以基于运维手册、SOP、故障案例和巡检结果回答您的问题。所有回答都会附带引用来源。\n\n您可以试试下面的常见问题：",
  },
];

const suggestions = [
  "app-svc-01 CPU 持续 92% 怎么排查？",
  "MQ 节点 Ping 不通一般如何处理？",
  "数据库内存使用率升高需要看哪些指标？",
  "重启业务服务前后需要确认什么？",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>(seeded);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = generateReply(q);
      setMessages((m) => [...m, reply]);
      setLoading(false);
    }, 900);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-9rem)]">
      {/* 对话区 */}
      <div className="panel flex flex-col lg:col-span-3 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">知识问答 Agent</h3>
              <p className="text-[11px] text-muted-foreground">辅助决策 · 不直接执行生产写操作</p>
            </div>
          </div>
          <StatusBadge tone="success" dot>在线</StatusBadge>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}

          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="text-left rounded-lg border bg-card hover:bg-primary-soft hover:border-primary/40 p-3 text-sm transition group"
                >
                  <Lightbulb className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="flex items-center gap-1">
                正在检索知识库
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
              placeholder="向运维助手提问，例如：app-svc-01 CPU 飙高如何排查？"
              className="resize-none bg-card min-h-[60px]"
              rows={2}
            />
            <Button onClick={() => ask(input)} disabled={!input.trim() || loading} className="h-[60px] px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">回答仅供参考，所有处理动作请由运维人员确认后执行 · 全过程留痕</p>
        </div>
      </div>

      {/* 右侧引用面板 */}
      <div className="panel p-5 hidden lg:flex flex-col gap-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" /> 相关知识
          </h3>
          <div className="space-y-2">
            {knowledge.slice(0, 4).map((k) => (
              <div key={k.id} className="rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-elev-sm transition">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium leading-snug">{k.title}</span>
                  <StatusBadge tone="info" className="shrink-0">{k.category}</StatusBadge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{k.excerpt}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {k.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
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
          <p className="text-[11px] leading-relaxed text-foreground/80">
            助手仅提供分析与建议，不直接执行重启服务、修改配置等生产写操作。所有问答均保留依据与来源。
          </p>
        </div>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
          {msg.content}
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
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        )}
        {msg.citations && (
          <div className="flex flex-wrap gap-1.5">
            {msg.citations.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-accent text-accent-foreground border border-accent/30">
                <FileText className="h-3 w-3" /> {c.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function generateReply(q: string): Msg {
  const lower = q.toLowerCase();
  if (q.includes("CPU") || lower.includes("cpu")) {
    return {
      role: "assistant",
      content:
        "针对 app-svc-01 CPU 持续 92% 的情况，结合 Zabbix 监控记录与历史经验，建议按以下顺序排查：",
      steps: [
        "在 Zabbix 中确认 CPU 高位是否伴随负载、上下文切换升高（10:00 起持续 30 分钟以上需重点关注）",
        "登录主机执行 top / pidstat，定位占用最高的进程与线程",
        "若为 Java 应用，使用 jstack 查看线程栈，关注是否存在死循环或慢任务",
        "对比昨日同时段流量与请求量，判断是否突增导致",
        "如确认无异常流量，可联系应用方评估是否需要重启，并按 SOP 执行重启前后确认",
      ],
      citations: [
        { title: "Linux 主机 CPU 高负载排查 SOP v1.3", category: "SOP" },
        { title: "服务重启前后确认事项 FAQ", category: "FAQ" },
      ],
    };
  }
  if (q.includes("MQ") || q.includes("Ping") || q.includes("ping")) {
    return {
      role: "assistant",
      content: "MQ 节点 ICMP 失败属于严重级别告警，建议立刻启动应急流程：",
      steps: [
        "通过跳板机或带外管理尝试登录 mq-01，确认主机是否真实宕机",
        "联系网络团队确认 10.20.5.51 所在网段链路状态",
        "评估业务影响：消费端是否有积压、生产端是否报错",
        "按 2024-11 历史案例处理：必要时切换到备用 MQ 集群",
        "故障恢复后在 24h 内补充故障案例条目",
      ],
      citations: [
        { title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例" },
        { title: "Zabbix 基础指标含义说明", category: "运维手册" },
      ],
    };
  }
  if (q.includes("内存") || q.includes("数据库")) {
    return {
      role: "assistant",
      content: "数据库内存升高通常需要从以下维度核查，重点关注 InnoDB Buffer Pool 与连接数：",
      steps: [
        "查看 InnoDB Buffer Pool 命中率与脏页比例",
        "排查是否存在长事务（>5min）阻塞回收",
        "确认连接数是否突增，是否有慢查询积压",
        "比对最近 7 天同时段，识别趋势性增长还是瞬时波动",
      ],
      citations: [
        { title: "MySQL 内存使用率升高处理手册 v2.0", category: "运维手册" },
      ],
    };
  }
  if (q.includes("重启")) {
    return {
      role: "assistant",
      content: "服务重启是高风险操作，建议严格按照以下确认事项执行：",
      steps: [
        "重启前：确认变更窗口、通知相关业务方、备份配置",
        "重启前：检查依赖服务状态、确认回滚方案",
        "执行：使用标准 SOP 命令，分批次重启避免全量影响",
        "重启后：核对进程、端口、健康检查接口",
        "重启后：观察 30 分钟监控曲线，必要时同步问题群",
      ],
      citations: [{ title: "服务重启前后确认事项 FAQ v1.1", category: "FAQ" }],
    };
  }
  return {
    role: "assistant",
    content:
      "我已检索运维手册与 SOP，但暂未找到与该问题完全匹配的条目。建议：\n• 提供更多上下文（涉及哪台主机、哪个指标、出现时间）\n• 或参考下方相关知识尝试自主排查\n\n如需进一步协助，可联系平台管理员补充对应 SOP 至知识库。",
    citations: [{ title: "Zabbix 基础指标含义说明", category: "运维手册" }],
  };
}
