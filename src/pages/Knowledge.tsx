import { useState } from "react";
import { Search, Plus, BookOpen, FileEdit, Tag, Clock, Eye, AlertTriangle, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { knowledge, knowledgeGaps } from "@/lib/mockData";

export default function Knowledge() {
  const [active, setActive] = useState("全部");
  const [q, setQ] = useState("");
  const [gaps, setGaps] = useState(knowledgeGaps);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const categories = [
    { name: "全部", count: knowledge.length },
    { name: "运维手册", count: knowledge.filter((item) => item.category === "运维手册").length },
    { name: "SOP", count: knowledge.filter((item) => item.category === "SOP").length },
    { name: "故障案例", count: knowledge.filter((item) => item.category === "故障案例").length },
    { name: "FAQ", count: knowledge.filter((item) => item.category === "FAQ").length },
  ];

  const list = knowledge.filter(
    (k) =>
      (active === "全部" || k.category === active) &&
      (q === "" || k.title.includes(q) || k.tags.some((t) => t.includes(q)))
  );

  return (
    <div className="space-y-5">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="知识总数" value={String(knowledge.length)} sub="已发布 5 · 草稿 1" tone="primary" />
        <StatTile label="本月新增" value="2" sub="较上月 +1" tone="info" />
        <StatTile label="知识缺口" value={String(gaps.length)} sub="由问答和故障分析沉淀" tone="warning" />
        <StatTile label="知识引用率" value="89%" sub="问答中知识库引用比例" tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧分类 */}
        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-3">分类</h3>
          <div className="space-y-1">
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => setActive(c.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                  active === c.name ? "bg-primary-soft text-primary font-medium" : "hover:bg-secondary/60 text-foreground/80"
                }`}
              >
                <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{c.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧列表 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索标题或标签…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-card" />
            </div>
            <div className="flex items-center rounded-md border bg-card p-0.5">
              <Button
                type="button"
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("card")}
                aria-label="卡片视图"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
                aria-label="列表视图"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button><Plus className="h-4 w-4 mr-1" />新建知识</Button>
          </div>

          {viewMode === "list" ? (
            <div className="panel overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>知识名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>引用</TableHead>
                    <TableHead>维护人</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((k) => (
                    <TableRow key={k.id} className="hover:bg-secondary/40">
                      <TableCell>
                        <p className="font-medium text-sm">{k.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{k.version}</p>
                      </TableCell>
                      <TableCell><StatusBadge tone="info">{k.category}</StatusBadge></TableCell>
                      <TableCell><StatusBadge tone={statusTone(k.status)}>{k.status}</StatusBadge></TableCell>
                      <TableCell className="text-xs tabular-nums">{k.citationStats.total}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{k.owner}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{k.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="查看"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="编辑"><FileEdit className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((k) => (
                <div key={k.id} className="panel p-4 hover:border-primary/40 hover:shadow-elev-md transition group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <StatusBadge tone="info">{k.category}</StatusBadge>
                    <StatusBadge tone={statusTone(k.status)}>{k.status}</StatusBadge>
                  </div>
                  <h4 className="text-sm font-semibold leading-snug mb-1.5 group-hover:text-primary transition">{k.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{k.excerpt}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {k.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-0.5">
                        <Tag className="h-2.5 w-2.5" />{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{k.updatedAt} · 引用 {k.citationStats.total}</span>
                    <div className="flex items-center gap-2">
                      <span>{k.owner}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="查看"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="编辑"><FileEdit className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {list.length === 0 && (
            <div className="panel p-12 text-center text-sm text-muted-foreground">
              没有匹配的知识条目，试试调整筛选条件
            </div>
          )}

          <div className="panel p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold">知识缺口</h3>
              </div>
              <StatusBadge tone="warning">待补充 {gaps.filter((item) => item.status === "待补充").length}</StatusBadge>
            </div>
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap.id} className="rounded-lg border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="info">{gap.source}</StatusBadge>
                      <StatusBadge tone={statusTone(gap.status)}>{gap.status}</StatusBadge>
                      <StatusBadge tone="muted">{gap.suggestedDocType}</StatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant={gap.status === "待补充" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setGaps((items) => items.map((item) => item.id === gap.id ? { ...item, status: "待补充" } : item))}
                      >
                        待补充
                      </Button>
                      <Button
                        size="sm"
                        variant={gap.status === "已补充" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setGaps((items) => items.map((item) => item.id === gap.id ? { ...item, status: "已补充", linkedDocTitle: item.linkedDocTitle ?? "待关联知识文档", handledBy: "知识管理员", handledAt: "刚刚" } : item))}
                      >
                        已补充
                      </Button>
                      <Button
                        size="sm"
                        variant={gap.status === "暂不处理" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setGaps((items) => items.map((item) => item.id === gap.id ? { ...item, status: "暂不处理", handledBy: "知识管理员", handledAt: "刚刚" } : item))}
                      >
                        暂不处理
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{gap.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {gap.createdAt}
                    {gap.linkedDocTitle ? ` · 关联文档：${gap.linkedDocTitle}` : ""}
                    {gap.handledBy ? ` · ${gap.handledBy} ${gap.handledAt}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "primary" | "info" | "warning" | "success" }) {
  const map: Record<string, string> = {
    primary: "from-primary/10 to-primary/5 text-primary",
    info: "from-info/10 to-info/5 text-info",
    warning: "from-warning/15 to-warning/5 text-warning",
    success: "from-success/10 to-success/5 text-success",
  };
  return (
    <div className={`stat-card bg-gradient-to-br ${map[tone]}`}>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-3xl font-semibold tabular-nums mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
