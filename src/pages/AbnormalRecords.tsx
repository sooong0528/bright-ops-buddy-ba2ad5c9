import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, Search, Clock, Eye, Stethoscope, MessageSquareQuote,
  MoreHorizontal, Bot, Ban, RotateCcw, CheckCircle2, FileText, Loader2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import {
  abnormalRecords, type AbnormalRecord,
  type RecordHandleStatus, type RecordAnalysisStatus,
} from "@/lib/mockData";

function handleStatusTone(s: RecordHandleStatus) {
  switch (s) {
    case "待处理": return "warning" as const;
    case "已恢复": return "success" as const;
    case "已忽略": return "muted" as const;
  }
}

function analysisStatusTone(s: RecordAnalysisStatus) {
  switch (s) {
    case "未分析": return "muted" as const;
    case "分析中": return "info" as const;
    case "已分析": return "success" as const;
    case "分析失败": return "destructive" as const;
  }
}

export default function AbnormalRecords() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [analysisFilter, setAnalysisFilter] = useState<string>("all");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  function goStartAnalysis(r: AbnormalRecord) {
    toast({ title: "已发起故障分析", description: `${r.assetName} · ${r.metric}` });
    navigate(`/analysis`);
  }
  function goViewAnalysis(r: AbnormalRecord) {
    if (r.analysisTaskId) navigate(`/analysis?task=${r.analysisTaskId}`);
    else navigate(`/analysis`);
  }
  function goRetryAnalysis(r: AbnormalRecord) {
    toast({ title: "已发起重新分析", description: `${r.assetName} · ${r.metric}（使用当前最新数据）` });
    navigate(r.analysisTaskId ? `/analysis?task=${r.analysisTaskId}` : `/analysis`);
  }
  function askAbout(r: AbnormalRecord) {
    sessionStorage.setItem("assistant.context", JSON.stringify({
      sourceType: r.currentLevel === "关注" ? "关注项" : "巡检异常",
      sourceId: r.id,
      title: `${r.assetName} · ${r.metric}`,
      snapshot: r.evidenceSnapshot || r.description,
    }));
    navigate("/assistant");
  }

  const filteredRecords = useMemo(() => {
    return abnormalRecords.filter((r) => {
      if (levelFilter !== "all" && r.currentLevel !== levelFilter && r.maxLevel !== levelFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (analysisFilter !== "all" && r.analysisStatus !== analysisFilter) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !r.assetName.toLowerCase().includes(k) &&
          !r.metric.toLowerCase().includes(k) &&
          !r.description.toLowerCase().includes(k)
        ) return false;
      }
      return true;
    });
  }, [levelFilter, statusFilter, analysisFilter, keyword]);

  const stats = useMemo(() => ({
    pending: abnormalRecords.filter((r) => r.status === "待处理").length,
    analyzed: abnormalRecords.filter((r) => r.analysisStatus === "已分析").length,
    recovered: abnormalRecords.filter((r) => r.status === "已恢复").length,
    ignored: abnormalRecords.filter((r) => r.status === "已忽略").length,
  }), []);

  const activeRecord = activeRecordId ? abnormalRecords.find((r) => r.id === activeRecordId) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={Clock} label="待处理" value={String(stats.pending)} tone="warning" />
        <SummaryTile icon={Bot} label="已分析" value={String(stats.analyzed)} tone="info" />
        <SummaryTile icon={CheckCircle2} label="已恢复" value={String(stats.recovered)} tone="success" />
        <SummaryTile icon={Ban} label="已忽略" value={String(stats.ignored)} tone="muted" />
      </div>

      <div className="filter-bar">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索资产 / 指标 / 描述"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 pl-8 w-56"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-9 w-28"><SelectValue placeholder="级别" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部级别</SelectItem>
              <SelectItem value="异常">异常</SelectItem>
              <SelectItem value="关注">关注</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="处理状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部处理状态</SelectItem>
              <SelectItem value="待处理">待处理</SelectItem>
              <SelectItem value="已恢复">已恢复</SelectItem>
              <SelectItem value="已忽略">已忽略</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisFilter} onValueChange={setAnalysisFilter}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="分析状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分析状态</SelectItem>
              <SelectItem value="未分析">未分析</SelectItem>
              <SelectItem value="分析中">分析中</SelectItem>
              <SelectItem value="已分析">已分析</SelectItem>
              <SelectItem value="分析失败">分析失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
      </div>

      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">当前级别</TableHead>
              <TableHead className="w-20">最高级别</TableHead>
              <TableHead>资产 / 指标</TableHead>
              <TableHead className="w-20">当前值</TableHead>
              <TableHead>触发规则</TableHead>
              <TableHead className="w-32">首次发现</TableHead>
              <TableHead className="w-32">最新记录</TableHead>
              <TableHead className="w-28">持续时间</TableHead>
              <TableHead className="w-24">处理状态</TableHead>
              <TableHead className="w-24">分析状态</TableHead>
              <TableHead className="text-right w-60">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">
                  暂无匹配的异常/关注记录
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => setActiveRecordId(r.id)}>
                  <TableCell>
                    <StatusBadge tone={r.currentLevel === "异常" ? "destructive" : "warning"}>
                      {r.currentLevel}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={r.maxLevel === "异常" ? "destructive" : "warning"}>
                      {r.maxLevel}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.assetName}</div>
                    <div className="text-xs text-muted-foreground">{r.metric}</div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums font-medium">{r.value}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.triggerRule}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {r.firstSeen}
                    <div className="text-sm text-muted-foreground/70 truncate" title={r.sourceRunLabel}>来源：{r.sourceRunLabel ?? "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {r.lastSeen}
                    <div className="text-sm text-muted-foreground/70">最近一次巡检命中</div>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {r.duration}
                    <div className="text-sm text-muted-foreground/70">出现 {r.occurrences} 次</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={handleStatusTone(r.status)}>{r.status}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={analysisStatusTone(r.analysisStatus)}>{r.analysisStatus}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => setActiveRecordId(r.id)}>
                        <Eye className="h-3 w-3 mr-1" />查看
                      </Button>
                      {r.analysisStatus === "未分析" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => goStartAnalysis(r)}>
                          <Stethoscope className="h-3 w-3 mr-1" />故障分析
                        </Button>
                      )}
                      {r.analysisStatus === "分析中" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => goViewAnalysis(r)}>
                          <Loader2 className="h-3 w-3 mr-1" />查看进度
                        </Button>
                      )}
                      {r.analysisStatus === "已分析" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => goViewAnalysis(r)}>
                          <FileText className="h-3 w-3 mr-1" />查看报告
                        </Button>
                      )}
                      {r.analysisStatus === "分析失败" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => goRetryAnalysis(r)}>
                          <RotateCcw className="h-3 w-3 mr-1" />重新分析
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {r.analysisStatus === "已分析" && (
                            <DropdownMenuItem onClick={() => goRetryAnalysis(r)}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" />重新分析
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => askAbout(r)}>
                            <MessageSquareQuote className="h-3.5 w-3.5 mr-2" />追问
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toast({ title: "已标记恢复", description: `${r.assetName} · ${r.metric}` })}>
                            <RotateCcw className="h-3.5 w-3.5 mr-2" />标记已恢复
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast({ title: "已忽略", description: `${r.assetName} · ${r.metric}` })}>
                            <Ban className="h-3.5 w-3.5 mr-2" />忽略
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>共 {filteredRecords.length} 条异常/关注记录</span>
          <span>待处理 {stats.pending} · 已分析 {stats.analyzed} · 已恢复 {stats.recovered} · 已忽略 {stats.ignored}</span>
        </div>
      </div>

      <RecordDetailSheet
        record={activeRecord}
        onClose={() => setActiveRecordId(null)}
        onStartAnalysis={(r) => { setActiveRecordId(null); goStartAnalysis(r); }}
        onViewAnalysis={(r) => { setActiveRecordId(null); goViewAnalysis(r); }}
        onRetryAnalysis={(r) => { setActiveRecordId(null); goRetryAnalysis(r); }}
        onAsk={(r) => { setActiveRecordId(null); askAbout(r); }}
      />
    </div>
  );
}

function SummaryTile({
  icon: Icon, label, value, tone, sub,
}: {
  icon: any; label: string; value: string; tone: "success" | "warning" | "destructive" | "info" | "muted"; sub?: string;
}) {
  const map: Record<string, string> = {
    success: "text-success bg-success-soft",
    warning: "text-warning bg-warning-soft",
    destructive: "text-destructive bg-destructive-soft",
    info: "text-info bg-info-soft",
    muted: "text-muted-foreground bg-muted",
  };
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">{sub ?? label}</div>
        {sub && <div className="text-sm text-muted-foreground/80">{label}</div>}
      </div>
    </div>
  );
}

function RecordDetailSheet({
  record, onClose, onStartAnalysis, onViewAnalysis, onRetryAnalysis, onAsk,
}: {
  record: AbnormalRecord | null;
  onClose: () => void;
  onStartAnalysis: (r: AbnormalRecord) => void;
  onViewAnalysis: (r: AbnormalRecord) => void;
  onRetryAnalysis: (r: AbnormalRecord) => void;
  onAsk: (r: AbnormalRecord) => void;
}) {
  return (
    <Sheet open={!!record} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        {record && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge tone={record.currentLevel === "异常" ? "destructive" : "warning"}>
                  当前 {record.currentLevel}
                </StatusBadge>
                <StatusBadge tone={record.maxLevel === "异常" ? "destructive" : "warning"}>
                  最高 {record.maxLevel}
                </StatusBadge>
                <SheetTitle className="text-lg">{record.assetName} · {record.metric}</SheetTitle>
                <StatusBadge tone={handleStatusTone(record.status)}>{record.status}</StatusBadge>
                <StatusBadge tone={analysisStatusTone(record.analysisStatus)}>{record.analysisStatus}</StatusBadge>
              </div>
              <SheetDescription className="text-sm">
                当前值 <span className="text-foreground font-medium tabular-nums">{record.value}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                触发规则 <span className="text-foreground">{record.triggerRule}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniTile label="首次发现" value={record.firstSeen} />
              <MiniTile label="最近发现" value={record.lastSeen} />
              <MiniTile label="持续时间" value={record.duration} />
              <MiniTile label="出现次数" value={`${record.occurrences} 次`} />
            </div>

            <Section title="触发依据">
              <p className="text-sm leading-relaxed">{record.description}</p>
              <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-foreground/80 whitespace-pre-line">
                {record.evidenceSnapshot}
              </div>
            </Section>

            <Section title={`巡检命中记录（${record.inspectionHits.length} 次）`}>
              <div className="rounded-md border bg-card divide-y">
                {record.inspectionHits.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs">
                    <StatusBadge tone={h.level === "异常" ? "destructive" : "warning"}>{h.level}</StatusBadge>
                    <span className="tabular-nums text-muted-foreground shrink-0">{h.time}</span>
                    <span className="flex-1 min-w-0 truncate text-foreground/85" title={h.runLabel}>{h.runLabel}</span>
                    <span className="tabular-nums font-medium">{h.value}</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-sm"
                      onClick={() => { onClose(); window.location.assign(`/inspection?run=${h.runId}`); }}>
                      查看
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                最近来源：{record.sourceRunLabel ?? record.runId}
              </div>
            </Section>

            <Section title="处理记录">
              {record.handleLog && record.handleLog.length > 0 ? (
                <div className="space-y-2">
                  {record.handleLog.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground tabular-nums shrink-0">{h.time}</span>
                      <span className="text-foreground font-medium shrink-0">{h.actor}</span>
                      <span className="text-foreground/80">{h.action}{h.note ? ` · ${h.note}` : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">暂无处理记录</div>
              )}
            </Section>

            <div className="mt-6 flex items-center gap-2 flex-wrap">
              {record.analysisStatus === "未分析" && (
                <Button variant="default" onClick={() => onStartAnalysis(record)}>
                  <Stethoscope className="h-4 w-4 mr-2" />故障分析
                </Button>
              )}
              {record.analysisStatus === "分析中" && (
                <Button variant="default" onClick={() => onViewAnalysis(record)}>
                  <Loader2 className="h-4 w-4 mr-2" />查看进度
                </Button>
              )}
              {record.analysisStatus === "已分析" && (
                <>
                  <Button variant="default" onClick={() => onViewAnalysis(record)}>
                    <FileText className="h-4 w-4 mr-2" />查看报告
                  </Button>
                  <Button variant="outline" onClick={() => onRetryAnalysis(record)}>
                    <RotateCcw className="h-4 w-4 mr-2" />重新分析
                  </Button>
                </>
              )}
              {record.analysisStatus === "分析失败" && (
                <Button variant="default" onClick={() => onRetryAnalysis(record)}>
                  <XCircle className="h-4 w-4 mr-2" />重新分析
                </Button>
              )}
              <Button variant="outline" onClick={() => onAsk(record)}>
                <MessageSquareQuote className="h-4 w-4 mr-2" />追问
              </Button>
              <Button variant="ghost" className="ml-auto"
                onClick={() => { toast({ title: "已标记恢复", description: `${record.assetName} · ${record.metric}` }); onClose(); }}>
                <RotateCcw className="h-4 w-4 mr-2" />标记已恢复
              </Button>
              <Button variant="ghost"
                onClick={() => { toast({ title: "已忽略", description: `${record.assetName} · ${record.metric}` }); onClose(); }}>
                <Ban className="h-4 w-4 mr-2" />忽略
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MiniTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
