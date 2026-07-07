import { useMemo, useState } from "react";
import {
  Search,
  Upload,
  BookOpen,
  Tag,
  Clock,
  Eye,
  FileEdit,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Power,
  PowerOff,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { knowledge as knowledgeSeed } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

type ParseStatus = "已完成" | "解析中" | "解析失败";

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  tags: string[];
  updatedAt: string;
  version: string;
  owner: string;
  excerpt: string;
  citedCount: number;
  // 新增文档型字段
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
  appliesTo: string[]; // 适用资产类型
  businessSystems: string[]; // 关联业务系统
  description: string;
  parseStatus: ParseStatus;
  parsedChunks: number;
  enabled: boolean;
}

const seedDocs: KnowledgeDoc[] = knowledgeSeed.map((k, idx) => ({
  id: k.id,
  title: k.title,
  category: k.category,
  tags: k.tags,
  updatedAt: k.updatedAt,
  version: k.version,
  owner: k.owner,
  excerpt: k.excerpt,
  citedCount: k.citedCount,
  fileName: `${k.title}.pdf`,
  fileType: "PDF",
  fileSize: `${(0.6 + idx * 0.35).toFixed(2)} MB`,
  uploadedAt: k.updatedAt + " 10:12",
  appliesTo: idx % 3 === 0 ? ["主机"] : idx % 3 === 1 ? ["数据库"] : ["应用服务", "中间件"],
  businessSystems: idx % 2 === 0 ? ["核心交易系统"] : ["运营支撑系统"],
  description: k.excerpt,
  parseStatus: k.status === "草稿" ? "解析失败" : "已完成",
  parsedChunks: k.status === "草稿" ? 0 : 20 + idx * 6,
  enabled: k.status === "已发布",
}));

const categoryList = ["全部", "运维手册", "SOP", "故障案例", "FAQ", "应急预案"];
const assetTypes = ["主机", "数据库", "应用服务", "中间件"];
const businessSystems = ["核心交易系统", "运营支撑系统", "结算系统", "内部管理系统"];

export default function Knowledge() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(seedDocs);
  const [active, setActive] = useState("全部");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"card" | "list">("card");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDoc | null>(null);
  const [editDoc, setEditDoc] = useState<KnowledgeDoc | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<KnowledgeDoc | null>(null);

  const list = useMemo(
    () =>
      docs.filter(
        (k) =>
          (active === "全部" || k.category === active) &&
          (q === "" || k.title.includes(q) || k.tags.some((t) => t.includes(q)) || k.fileName.includes(q))
      ),
    [docs, active, q]
  );

  const stats = useMemo(() => {
    const enabled = docs.filter((d) => d.enabled).length;
    const failed = docs.filter((d) => d.parseStatus === "解析失败").length;
    return { total: docs.length, enabled, disabled: docs.length - enabled, failed };
  }, [docs]);

  const toggleEnabled = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = !d.enabled;
        toast({ title: next ? "已启用" : "已停用", description: `${d.title} ${next ? "将参与" : "已退出"}智能问答和故障分析` });
        return { ...d, enabled: next };
      })
    );
  };

  const reparse = (doc: KnowledgeDoc) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, parseStatus: "解析中" as ParseStatus } : d)));
    toast({ title: "已提交重新解析", description: `${doc.title} 基于当前文件重新解析和索引` });
    setTimeout(() => {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, parseStatus: "已完成", parsedChunks: Math.max(d.parsedChunks, 18) } : d)));
    }, 1200);
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "已删除", description: "文档已从知识库移除（软删除）" });
    setDeleteDoc(null);
  };

  const saveEdit = (patch: KnowledgeDoc) => {
    setDocs((prev) => prev.map((d) => (d.id === patch.id ? patch : d)));
    setEditDoc(null);
    toast({ title: "已保存", description: "文档元信息已更新" });
  };

  const handleUpload = (payload: {
    fileName: string;
    businessSystems: string[];
    description: string;
  }) => {
    const id = `k${Date.now()}`;
    const now = new Date().toISOString().slice(0, 10);
    const created: KnowledgeDoc = {
      id,
      title: payload.fileName.replace(/\.(pdf|docx?|md|txt)$/i, ""),
      category: "运维手册",
      tags: ["自动识别", "待复核"],
      updatedAt: now,
      version: "v1.0",
      owner: "当前用户",
      excerpt: "系统正在识别摘要…",
      citedCount: 0,
      fileName: payload.fileName,
      fileType: (payload.fileName.split(".").pop() || "PDF").toUpperCase(),
      fileSize: "1.20 MB",
      uploadedAt: now + " " + new Date().toTimeString().slice(0, 5),
      appliesTo: ["主机"],
      businessSystems: payload.businessSystems,
      description: payload.description,
      parseStatus: "解析中",
      parsedChunks: 0,
      enabled: true,
    };
    setDocs((prev) => [created, ...prev]);
    setUploadOpen(false);
    toast({ title: "上传成功", description: "系统正在自动识别文档类型、适用资产和标签" });
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, parseStatus: "已完成", parsedChunks: 24, excerpt: "系统已解析并生成 24 个知识片段。", tags: ["自动识别", "运维", "SOP"] }
            : d
        )
      );
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="文档总数" value={String(stats.total)} sub="上传即入库" tone="primary" />
        <StatTile label="启用中" value={String(stats.enabled)} sub="参与问答与故障分析" tone="success" />
        <StatTile label="已停用" value={String(stats.disabled)} sub="保留但不参与检索" tone="info" />
        <StatTile label="解析失败" value={String(stats.failed)} sub="可点击「重新解析」重试" tone="warning" />
      </div>

      {/* 说明文案 */}
      <div className="panel px-4 py-3 text-sm text-muted-foreground leading-relaxed">
        上传运维手册、故障处理 SOP、应急预案等材料，系统会自动解析文档内容，并识别文档类型、适用资产和标签，用于智能问答和故障分析。
        如需更新文档内容，请重新上传新文档，并停用或删除旧文档。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧分类 */}
        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-3">分类</h3>
          <div className="space-y-1">
            {categoryList.map((c) => {
              const count = c === "全部" ? docs.length : docs.filter((d) => d.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                    active === c ? "bg-primary-soft text-primary font-medium" : "hover:bg-secondary/60 text-foreground/80"
                  }`}
                >
                  <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{c}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                </button>
              );
            })}
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
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索标题、标签或文件名…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-card" />
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as "card" | "list")}>
              <TabsList>
                <TabsTrigger value="card">卡片</TabsTrigger>
                <TabsTrigger value="list">列表</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4 mr-1" />上传材料</Button>
          </div>

          {view === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((k) => (
                <div key={k.id} className="panel p-4 hover:border-primary/40 hover:shadow-elev-md transition group flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="info">{k.category}</StatusBadge>
                      <ParseBadge status={k.parseStatus} />
                    </div>
                    <StatusBadge tone={k.enabled ? "success" : "muted"}>{k.enabled ? "启用" : "停用"}</StatusBadge>
                  </div>
                  <h4 className="text-sm font-semibold leading-snug mb-1.5 group-hover:text-primary transition cursor-pointer" onClick={() => setDetailDoc(k)}>
                    {k.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{k.excerpt}</p>
                  <div className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" />{k.fileName} · {k.fileSize}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {k.tags.slice(0, 5).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-0.5">
                        <Tag className="h-2.5 w-2.5" />{t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{k.updatedAt}</span>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetailDoc(k)}>查看详情</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditDoc(k)}>编辑信息</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => reparse(k)}>重新解析</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleEnabled(k.id)}>{k.enabled ? "停用" : "启用"}</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDoc(k)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">文档名称</th>
                    <th className="text-left px-3 py-2 font-medium">分类</th>
                    <th className="text-left px-3 py-2 font-medium">适用资产</th>
                    <th className="text-left px-3 py-2 font-medium">解析</th>
                    <th className="text-left px-3 py-2 font-medium">状态</th>
                    <th className="text-left px-3 py-2 font-medium">更新时间</th>
                    <th className="text-right px-3 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((k, idx) => (
                    <tr key={k.id} className={idx % 2 ? "bg-muted/20" : ""}>
                      <td className="px-3 py-2">
                        <div className="font-medium truncate max-w-[240px]" title={k.title}>{k.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[240px]">{k.fileName}</div>
                      </td>
                      <td className="px-3 py-2"><StatusBadge tone="info">{k.category}</StatusBadge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{k.appliesTo.join("、")}</td>
                      <td className="px-3 py-2"><ParseBadge status={k.parseStatus} /></td>
                      <td className="px-3 py-2"><StatusBadge tone={k.enabled ? "success" : "muted"}>{k.enabled ? "启用" : "停用"}</StatusBadge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{k.updatedAt}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetailDoc(k)}>查看</Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditDoc(k)}>编辑信息</Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => reparse(k)}>重新解析</Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleEnabled(k.id)}>{k.enabled ? "停用" : "启用"}</Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => setDeleteDoc(k)}>删除</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list.length === 0 && (
            <div className="panel p-12 text-center text-sm text-muted-foreground">
              没有匹配的文档，试试调整筛选条件或上传新材料
            </div>
          )}
        </div>
      </div>

      {/* 上传抽屉 */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={handleUpload} />

      {/* 详情抽屉 */}
      <DetailSheet doc={detailDoc} onOpenChange={(o) => !o && setDetailDoc(null)} onReparse={reparse} onToggle={toggleEnabled} onEdit={(d) => { setDetailDoc(null); setEditDoc(d); }} />

      {/* 编辑抽屉 */}
      <EditSheet doc={editDoc} onOpenChange={(o) => !o && setEditDoc(null)} onSave={saveEdit} />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文档？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后文档将从知识库移除，不再参与智能问答和故障分析。MVP 阶段为软删除，可联系管理员恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteDoc && removeDoc(deleteDoc.id)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ParseBadge({ status }: { status: ParseStatus }) {
  if (status === "已完成") return <StatusBadge tone="success"><CheckCircle2 className="h-3 w-3" />已解析</StatusBadge>;
  if (status === "解析中") return <StatusBadge tone="info"><RefreshCw className="h-3 w-3 animate-spin" />解析中</StatusBadge>;
  return <StatusBadge tone="destructive"><AlertCircle className="h-3 w-3" />解析失败</StatusBadge>;
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

/* ============ 上传对话框 ============ */
function UploadDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: { fileName: string; businessSystems: string[]; description: string }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [system, setSystem] = useState<string>("");
  const [desc, setDesc] = useState("");

  const reset = () => { setFile(null); setSystem(""); setDesc(""); };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>上传材料</DialogTitle>
          <DialogDescription>
            支持 PDF / Word / Markdown 等文档格式。上传后系统将自动识别文档类型、适用资产、标签和摘要。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">选择文件 <span className="text-destructive">*</span></Label>
            <label className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-8 cursor-pointer hover:border-primary/50 hover:bg-primary-soft/30 transition">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "点击选择或拖拽文件到此处"}
              </span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.md,.txt" />
            </label>
            <p className="text-xs text-muted-foreground mt-1">文档类型、适用资产、标签、摘要由系统自动识别，可稍后在「编辑信息」中调整。</p>
          </div>

          <div>
            <Label className="text-xs">关联业务系统（可选）</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="选择业务系统" /></SelectTrigger>
              <SelectContent>
                {businessSystems.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">文档说明（可选）</Label>
            <Textarea className="mt-1" rows={3} placeholder="简要描述文档用途或适用范围" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            disabled={!file}
            onClick={() => file && onSubmit({ fileName: file.name, businessSystems: system ? [system] : [], description: desc })}
          >
            上传
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ 详情抽屉 ============ */
function DetailSheet({
  doc,
  onOpenChange,
  onReparse,
  onToggle,
  onEdit,
}: {
  doc: KnowledgeDoc | null;
  onOpenChange: (o: boolean) => void;
  onReparse: (d: KnowledgeDoc) => void;
  onToggle: (id: string) => void;
  onEdit: (d: KnowledgeDoc) => void;
}) {
  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {doc && (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-base">{doc.title}</SheetTitle>
                  <SheetDescription className="text-xs mt-1">{doc.fileName} · {doc.fileSize} · 上传于 {doc.uploadedAt}</SheetDescription>
                </div>
                <StatusBadge tone={doc.enabled ? "success" : "muted"}>{doc.enabled ? "启用" : "停用"}</StatusBadge>
              </div>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <Section title="文件信息">
                <InfoRow label="文件名" value={doc.fileName} />
                <InfoRow label="文件类型" value={doc.fileType} />
                <InfoRow label="文件大小" value={doc.fileSize} />
                <InfoRow label="上传时间" value={doc.uploadedAt} />
                <InfoRow label="上传人" value={doc.owner} />
              </Section>

              <Section title="智能识别结果">
                <InfoRow label="文档类型" value={doc.category} />
                <InfoRow label="适用资产" value={doc.appliesTo.join("、") || "—"} />
                <InfoRow label="关联业务系统" value={doc.businessSystems.join("、") || "—"} />
                <InfoRow label="标签" value={
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>
                } />
                <InfoRow label="摘要" value={doc.excerpt} />
              </Section>

              <Section title="解析信息">
                <InfoRow label="解析状态" value={<ParseBadge status={doc.parseStatus} />} />
                <InfoRow label="知识片段数" value={doc.parsedChunks ? `${doc.parsedChunks} 段` : "—"} />
                <InfoRow label="被引用次数" value={`${doc.citedCount} 次`} />
              </Section>

              <Section title="启用状态">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  启用状态决定文档是否参与智能问答和故障分析检索。停用后文档仍保留，不参与检索。
                </p>
              </Section>
            </div>

            <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(doc)}><FileEdit className="h-3.5 w-3.5 mr-1" />编辑信息</Button>
              <Button variant="outline" size="sm" onClick={() => onReparse(doc)}><RefreshCw className="h-3.5 w-3.5 mr-1" />重新解析</Button>
              <Button variant="outline" size="sm" onClick={() => onToggle(doc.id)}>
                {doc.enabled ? <><PowerOff className="h-3.5 w-3.5 mr-1" />停用</> : <><Power className="h-3.5 w-3.5 mr-1" />启用</>}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      <div className="space-y-2 rounded-lg border bg-card p-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">{label}</div>
      <div className="flex-1 min-w-0 break-words">{value}</div>
    </div>
  );
}

/* ============ 编辑抽屉（仅元信息） ============ */
function EditSheet({
  doc,
  onOpenChange,
  onSave,
}: {
  doc: KnowledgeDoc | null;
  onOpenChange: (o: boolean) => void;
  onSave: (d: KnowledgeDoc) => void;
}) {
  const [draft, setDraft] = useState<KnowledgeDoc | null>(doc);
  const [tagInput, setTagInput] = useState("");

  // Sync when opening a different doc
  useMemo(() => setDraft(doc), [doc]);

  if (!doc || !draft) return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}><SheetContent /></Sheet>
  );

  const toggleAsset = (a: string) => {
    setDraft({ ...draft, appliesTo: draft.appliesTo.includes(a) ? draft.appliesTo.filter((x) => x !== a) : [...draft.appliesTo, a] });
  };
  const toggleSystem = (s: string) => {
    setDraft({ ...draft, businessSystems: draft.businessSystems.includes(s) ? draft.businessSystems.filter((x) => x !== s) : [...draft.businessSystems, s] });
  };
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) setDraft({ ...draft, tags: [...draft.tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) });

  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>编辑文档信息</SheetTitle>
          <SheetDescription className="text-xs">
            仅支持编辑文档元信息。原始文档正文与解析后的知识片段不可编辑，如需更新内容请重新上传新文档并停用旧文档。
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div>
            <Label className="text-xs">文档名称 <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">文档类型</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryList.filter((c) => c !== "全部").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">启用状态</Label>
              <Select value={draft.enabled ? "启用" : "停用"} onValueChange={(v) => setDraft({ ...draft, enabled: v === "启用" })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="启用">启用</SelectItem>
                  <SelectItem value="停用">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">适用资产</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {assetTypes.map((a) => {
                const on = draft.appliesTo.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAsset(a)}
                    className={`text-xs px-2 py-1 rounded-md border transition ${on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">关联业务系统</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {businessSystems.map((s) => {
                const on = draft.businessSystems.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSystem(s)}
                    className={`text-xs px-2 py-1 rounded-md border transition ${on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">标签</Label>
            <div className="mt-1 flex flex-wrap gap-1.5 mb-2">
              {draft.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-1">
                  {t}
                  <button onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="输入标签后按回车" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
              <Button variant="outline" size="sm" onClick={addTag}>添加</Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">摘要 / 说明</Label>
            <Textarea className="mt-1" rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value, excerpt: e.target.value })} />
          </div>

          <div className="rounded-md bg-muted/40 border px-3 py-2 text-xs text-muted-foreground">
            原始文档正文和解析后的知识片段无法在此编辑。如需更新内容，请<strong className="text-foreground">重新上传新文档</strong>并停用或删除旧文档。
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => onSave(draft)}>保存</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
