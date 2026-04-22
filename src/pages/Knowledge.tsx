import { useState } from "react";
import { Search, Plus, Upload, BookOpen, FileEdit, Tag, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { knowledge } from "@/lib/mockData";

const categories = [
  { name: "全部", count: 6 },
  { name: "运维手册", count: 2 },
  { name: "SOP", count: 2 },
  { name: "故障案例", count: 1 },
  { name: "FAQ", count: 1 },
];

export default function Knowledge() {
  const [active, setActive] = useState("全部");
  const [q, setQ] = useState("");

  const list = knowledge.filter(
    (k) =>
      (active === "全部" || k.category === active) &&
      (q === "" || k.title.includes(q) || k.tags.some((t) => t.includes(q)))
  );

  return (
    <div className="space-y-5">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="知识总数" value="6" sub="已发布 5 · 草稿 1" tone="primary" />
        <StatTile label="本月新增" value="2" sub="较上月 +1" tone="info" />
        <StatTile label="高频问答" value="14" sub="自动沉淀 FAQ 待审核" tone="warning" />
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
          <div className="mt-5 pt-5 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">热门标签</h4>
            <div className="flex flex-wrap gap-1.5">
              {["CPU", "MySQL", "MQ", "重启", "Linux", "网络", "Zabbix", "磁盘"].map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧列表 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索标题或标签…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-card" />
            </div>
            <Button variant="outline"><Upload className="h-4 w-4 mr-1" />批量导入</Button>
            <Button><Plus className="h-4 w-4 mr-1" />新建知识</Button>
          </div>

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
                  {k.tags.map((t) => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-0.5">
                      <Tag className="h-2.5 w-2.5" />{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{k.updatedAt} · {k.version}</span>
                  <div className="flex items-center gap-2">
                    <span>{k.owner}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><FileEdit className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {list.length === 0 && (
            <div className="panel p-12 text-center text-sm text-muted-foreground">
              没有匹配的知识条目，试试调整筛选条件
            </div>
          )}
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
