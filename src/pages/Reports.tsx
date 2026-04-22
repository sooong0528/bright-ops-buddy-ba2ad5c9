import { useState } from "react";
import { FileText, Download, Eye, Plus, Calendar, Filter, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { reports } from "@/lib/mockData";

export default function Reports() {
  const [active, setActive] = useState("全部");
  const filtered = active === "全部" ? reports : reports.filter((r) => r.type === active);
  const [selected, setSelected] = useState(reports[0]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList>
            <TabsTrigger value="全部">全部</TabsTrigger>
            <TabsTrigger value="日报">日报</TabsTrigger>
            <TabsTrigger value="周报">周报</TabsTrigger>
            <TabsTrigger value="异常摘要">异常摘要</TabsTrigger>
            <TabsTrigger value="问答记录">问答记录</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="选择日期范围" className="w-48 pl-8 h-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />筛选</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />生成报告</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left panel p-4 transition-all ${
                selected.id === r.id ? "border-primary shadow-elev-md ring-2 ring-primary/10" : "hover:border-border hover:shadow-elev-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{r.title}</h4>
                    <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <StatusBadge tone="info">{r.type}</StatusBadge>
                    <span>{r.period}</span>
                    <span>· {r.author}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 panel p-6">
          <div className="flex items-start justify-between gap-3 mb-5 pb-5 border-b">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge tone="info">{selected.type}</StatusBadge>
                <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
              </div>
              <h2 className="text-xl font-semibold">{selected.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                周期 {selected.period} · 生成于 {selected.generatedAt} · 由 {selected.author} 输出
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />预览</Button>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />导出</Button>
            </div>
          </div>

          <div className="space-y-5 text-sm leading-relaxed">
            <Section title="一、报告摘要">
              <p>{selected.summary}</p>
            </Section>

            <Section title="二、巡检结论">
              <ul className="space-y-2 list-none">
                <ResultItem tone="destructive" label="异常项 (2)">
                  app-svc-01 CPU 持续 92% · mq-01 ICMP 探测失败
                </ResultItem>
                <ResultItem tone="warning" label="关注项 (2)">
                  app-web-02 CPU 71% 上升 · db-master-01 内存 82%
                </ResultItem>
                <ResultItem tone="success" label="正常项 (4)">
                  app-web-01 / app-svc-02 / db-slave-01 / cache-01 各项指标平稳
                </ResultItem>
              </ul>
            </Section>

            <Section title="三、建议事项">
              <ol className="space-y-2 ml-4 list-decimal">
                <li>优先处理 mq-01 连通性异常，启动应急流程并评估业务影响。</li>
                <li>对 app-svc-01 进行线程栈采样，确认是否存在慢任务或死循环。</li>
                <li>关注 db-master-01 内存增长趋势，必要时排查长事务。</li>
                <li>本周巡检策略保持不变，下周评估是否新增 MQ 专项巡检。</li>
              </ol>
            </Section>

            <Section title="四、引用依据">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { t: "Zabbix 监控数据", s: "2025-04-22 00:00 - 24:00" },
                  { t: "Linux CPU 高负载 SOP v1.3", s: "知识库引用" },
                  { t: "MQ 宕机历史案例 (2024-11)", s: "知识库引用" },
                  { t: "MySQL 内存使用率手册 v2.0", s: "知识库引用" },
                ].map((c) => (
                  <div key={c.t} className="flex gap-2 items-start rounded-lg border bg-secondary/40 p-2.5">
                    <Quote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{c.t}</p>
                      <p className="text-xs text-muted-foreground">{c.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <div className="rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground">
              本报告由报告生成 Agent 自动整理，已存入审计留痕。如需修改，请由具备相应权限的用户在草稿状态下进行调整。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 text-foreground/90">{title}</h3>
      <div className="text-foreground/80">{children}</div>
    </section>
  );
}

function ResultItem({ tone, label, children }: { tone: "success" | "warning" | "destructive"; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start rounded-lg border bg-card p-3">
      <StatusBadge tone={tone} className="shrink-0">{label}</StatusBadge>
      <span className="text-xs text-foreground/85">{children}</span>
    </li>
  );
}
