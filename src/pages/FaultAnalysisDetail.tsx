import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ImageUp,
  RotateCcw,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  abnormalRecords,
  detectableMetrics,
  faultAnalysisTasks,
  inspectionMetricResults,
  inspectionRuns,
  inspectionTasks,
  opsAssets,
  type FaultAnalysisTask,
  type HandlingMethod,
  type HandlingStatus,
} from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const handlingStatuses: HandlingStatus[] = ["待处理", "已确认", "已归档"];
const handlingMethods: HandlingMethod[] = ["采纳系统建议", "部分采纳系统建议", "未采纳系统建议", "使用其他处理方式"];

export default function FaultAnalysisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const task = faultAnalysisTasks.find((item) => item.id === id);

  if (!task) {
    return (
      <div className="panel p-10 text-center space-y-4">
        <p className="text-sm text-muted-foreground">未找到对应故障分析任务</p>
        <Button asChild variant="outline"><Link to="/fault-analysis">返回列表</Link></Button>
      </div>
    );
  }

  return <DetailContent task={task} onBack={() => navigate("/fault-analysis")} />;
}

function DetailContent({ task, onBack }: { task: FaultAnalysisTask; onBack: () => void }) {
  const navigate = useNavigate();
  const storedHandling = readHandlingOverrides()[task.id] as HandlingStatus | undefined;
  const [handlingStatus, setHandlingStatus] = useState<HandlingStatus>(storedHandling ?? task.handlingStatus);
  const [method, setMethod] = useState<HandlingMethod>(task.handlingRecord?.method ?? "采纳系统建议");
  const [note, setNote] = useState(task.handlingRecord?.description ?? "");
  const [screenshot, setScreenshot] = useState(task.handlingRecord?.attachments[0]?.name ?? "");
  const [savedAt, setSavedAt] = useState(task.handlingRecord?.handledAt ?? "待处理");
  const [reportStatus, setReportStatus] = useState(task.reportStatus);

  const relatedReportTitle = useMemo(() => `${task.objectLabel} 故障分析报告`, [task.objectLabel]);
  const abnormalRecord = abnormalRecords.find((item) => item.id === task.abnormalRecordId);
  const sourceResults = task.sourceMetricResultIds.flatMap((resultId) => {
    const result = inspectionMetricResults.find((item) => item.id === resultId);
    return result ? [result] : [];
  });
  const primaryResult = sourceResults[0];
  const primaryMetric = primaryResult ? detectableMetrics.find((item) => item.id === primaryResult.metricId) : null;
  const sourceRun = abnormalRecord ? inspectionRuns.find((item) => item.id === abnormalRecord.sourceRunId) : null;
  const sourceTask = sourceRun ? inspectionTasks.find((item) => item.id === sourceRun.taskId) : null;
  const missingResults = sourceResults.filter((item) => item.status === "缺项");
  const asset = opsAssets.find((item) => item.id === task.assetId);
  const relatedLogSources = opsAssets.filter((item) =>
    item.type === "日志源" && (item.relatedAssetId === task.assetId || item.ip === asset?.ip || item.systemName === asset?.systemName),
  );

  function askAboutTask() {
    sessionStorage.setItem(
      "assistant.pendingOpsContext",
      JSON.stringify({
        source: "故障分析",
        id: task.taskNo,
        title: `${task.objectLabel} · ${task.abnormalType}`,
        summary: `${task.suggestionSummary}。原因假设：${task.causeHypotheses.join("；")}。降级信息：${task.degradation}`,
        metric: task.metricValue,
        evidenceSnapshot: task.evidenceSnapshot,
        logEvidence: task.logEvidence.map((log) => `${log.source} · ${log.keyword}`),
        knowledgeCitations: task.knowledgeCitations.map((item) => `${item.title} ${item.version}`),
        returnPath: `/fault-analysis/${task.id}`,
      }),
    );
    navigate("/assistant");
  }

  function saveHandlingRecord() {
    const trimmed = note.trim();
    if (handlingStatus !== "待处理" && !trimmed) {
      toast({ title: "请先填写人工说明", description: "已确认或归档前，需要记录实际核查或处置过程。" });
      return;
    }
    if ((method === "未采纳系统建议" || method === "使用其他处理方式") && !trimmed) {
      toast({ title: "请说明处理方式", description: "建议不正确或采用其他处理方式时，需要补充人工说明。" });
      return;
    }
    if (handlingStatus === "已归档" && reportStatus !== "已生成") {
      toast({ title: "暂不能归档", description: "归档前至少需要生成故障分析报告。" });
      return;
    }
    if (handlingStatus === "已归档" && !screenshot) {
      toast({ title: "暂不能归档", description: "归档前请补充处理截图或附件名称。" });
      return;
    }

    setSavedAt("2026-06-26 10:18");
    const next = { ...readHandlingOverrides(), [task.id]: handlingStatus };
    sessionStorage.setItem("faultAnalysis.handlingStatus", JSON.stringify(next));
    toast({
      title: handlingStatus === "已归档" ? "已归档" : "处理记录已保存",
      description: `${task.taskNo} · ${handlingStatus}`,
    });
  }

  function generateReport() {
    if (task.status !== "已完成") {
      toast({ title: "分析仍在进行中", description: "分析完成后才能生成故障分析报告。" });
      return;
    }
    setReportStatus("已生成");
    toast({ title: "已生成故障分析报告", description: "报告中将标记处理结果待补充，直到人工记录完整。" });
    navigate(`/reports?report=${task.reportId ?? "r-fa-001"}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="返回故障分析列表">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{task.taskNo}</h2>
            <p className="text-xs text-muted-foreground mt-1">{task.objectLabel} · {task.createdAt}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={askAboutTask}>
            <Bot className="h-4 w-4 mr-2" />基于此分析提问
          </Button>
          <Button variant="outline" onClick={generateReport}>
            <FileText className="h-4 w-4 mr-2" />{reportStatus === "已生成" ? "查看报告" : "生成报告"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/audit?trace=${task.traceId}`)}>
            <ScrollText className="h-4 w-4 mr-2" />查看审计
          </Button>
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />重新分析
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <section className="panel p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive-soft text-destructive flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">异常概况</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.triggerSource} · {task.abnormalRecordId}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <StatusBadge tone={statusTone(task.status)}>{task.status}</StatusBadge>
                <StatusBadge tone={statusTone(task.recommendationLevel)}>{task.recommendationLevel}</StatusBadge>
                <StatusBadge tone={statusTone(handlingStatus)}>{handlingStatus}</StatusBadge>
                <StatusBadge tone={statusTone(reportStatus)}>{reportStatus}</StatusBadge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <InfoTile label="异常类型" value={task.abnormalType} />
              <InfoTile label="异常指标" value={task.metricValue} danger />
              <InfoTile label="负责人" value={task.owner} />
              <InfoTile label="来源巡检任务" value={sourceTask?.name ?? abnormalRecord?.sourceTaskName ?? "—"} />
              <InfoTile label="指标来源" value={primaryMetric ? `${primaryMetric.dataSource} / ${primaryMetric.sourceIdentifier}` : "—"} />
              <InfoTile label="采集时间" value={primaryResult?.collectedAt ?? task.createdAt} />
            </div>
            <p className="text-sm leading-relaxed bg-muted/40 rounded-lg border p-3">{task.evidenceSnapshot}</p>
            {task.degradation !== "无降级" && (
              <p className="text-sm leading-relaxed rounded-lg border border-warning/30 bg-warning/5 p-3">
                知识未命中：当前仅生成原因假设，请结合现场数据确认。
              </p>
            )}
            {missingResults.length > 0 && (
              <p className="text-sm leading-relaxed rounded-lg border border-warning/30 bg-warning/5 p-3">
                数据降级说明：存在 {missingResults.length} 项巡检结果为缺项，已作为证据限制条件记录，原因假设需人工结合现场数据确认。
              </p>
            )}
          </section>

          <section className="panel p-5 space-y-4">
            <h3 className="font-semibold">原因假设与处置建议</h3>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <p className="text-sm font-medium">{task.suggestionSummary}</p>
              <div className="mt-3 space-y-2">
                {task.suggestions.map((item, index) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.causeHypotheses.map((item, index) => (
                <div key={item} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium">可能原因 {index + 1}</span>
                    <StatusBadge tone="info">需人工确认</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5 space-y-4">
            <div>
              <h3 className="font-semibold">证据依据</h3>
              <p className="text-xs text-muted-foreground mt-1">默认展示指标证据，日志、知识引用和调用链按需查看。</p>
            </div>
            <Tabs defaultValue="metric">
              <TabsList>
                <TabsTrigger value="metric">指标证据</TabsTrigger>
                <TabsTrigger value="log">日志证据</TabsTrigger>
                <TabsTrigger value="knowledge">知识引用</TabsTrigger>
                <TabsTrigger value="trace">调用链</TabsTrigger>
              </TabsList>

              <TabsContent value="metric" className="mt-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-2">指标趋势</p>
                  <div className="space-y-2">
                    {task.metricTrend.map((point) => (
                      <div key={point.time} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground tabular-nums">{point.time}</span>
                        <span className={point.diskUsage >= 90 ? "text-destructive font-medium" : "text-foreground"}>
                          /data/logs {point.diskUsage}% · CPU {point.cpuUsage}% · 内存 {point.memoryUsage}% · error {point.errorCount} 条
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                    指标：{primaryMetric?.name ?? task.abnormalType} · 单位 {primaryMetric?.unit ?? "%"} · 关注 {primaryResult?.attentionThreshold ?? "—"} / 异常 {primaryResult?.abnormalThreshold ?? "—"}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="log" className="mt-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="mb-3 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">日志检索依据</div>
                    <div className="mt-1">
                      系统根据资产管理中的日志源定位信息检索日志：{relatedLogSources.length > 0
                        ? relatedLogSources.map((item) => `${item.applicationName ?? item.name} / ${item.ip} / ${item.hostName ?? "未填主机名"} / ${item.logPath ?? "未填路径"} / ${item.defaultLogWindow ?? task.timeWindow}`).join("；")
                        : "当前资产未配置关联日志源，按异常对象和时间窗口降级检索。"}
                    </div>
                    <div className="mt-1">采集通道 Filebeat + ES 为系统内置能力，不在资产管理中配置。</div>
                  </div>
                  <div className="space-y-3">
                    {task.logEvidence.map((log) => (
                      <div key={log.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={log.level === "error" ? "destructive" : "warning"}>{log.level}</StatusBadge>
                          <span className="text-muted-foreground tabular-nums">{log.time}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground break-all">{log.source} · 关键字 {log.keyword}</p>
                        <p className="mt-1 text-foreground/80">{log.excerpt}</p>
                      </div>
                    ))}
                  </div>
                  {sourceResults.filter((item) => item.logEvidence).map((result) => result.logEvidence && (
                    <div key={result.id} className="mt-3 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                      日志路径：{result.logEvidence.path} · 关键字 {result.logEvidence.keywords.join("、")} · 命中 {result.logEvidence.hitCount} 条 · {result.logEvidence.timeWindow}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="knowledge" className="mt-3">
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  {task.knowledgeCitations.length === 0 ? (
                    <div className="text-xs rounded-md bg-warning/10 text-warning px-2 py-1.5">
                      暂无可直接引用知识，已进入知识缺口处理
                    </div>
                  ) : task.knowledgeCitations.map((item) => (
                    <div key={item.title} className="text-xs rounded-md bg-muted/50 px-2 py-1.5">
                      {item.title} · {item.version}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trace" className="mt-3">
                <div className="space-y-3">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Trace ID</p>
                    <p className="text-sm font-mono mt-1">{task.traceId}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {task.agentTrace.map((step) => (
                      <div key={step.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{step.agentName}</span>
                          <StatusBadge tone={statusTone(step.status)}>{step.status}</StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.inputSummary}</p>
                        <p className="text-xs text-foreground/80 mt-1">{step.outputSummary}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">关联报告：{relatedReportTitle}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/audit?trace=${task.traceId}`)}>
                      <ScrollText className="h-4 w-4 mr-2" />按 Trace 查看审计详情
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />人工处理结果
            </h3>
            <div className="space-y-3">
              <Field label="处理状态">
                <Select value={handlingStatus} onValueChange={(value) => setHandlingStatus(value as HandlingStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {handlingStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="处理方式">
                <Select value={method} onValueChange={(value) => setMethod(value as HandlingMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {handlingMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="人工说明">
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28" placeholder="填写实际处理过程、建议不准确原因或其他处理方式。" />
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm cursor-pointer hover:border-primary/40">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <ImageUp className="h-4 w-4" />
                  {screenshot || task.handlingRecord.attachments[0]?.name || "上传处理截图"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(event) => setScreenshot(event.target.files?.[0]?.name ?? "")}
                />
              </label>
              <Button className="w-full" onClick={saveHandlingRecord}>
                <CheckCircle2 className="h-4 w-4 mr-2" />保存处理记录
              </Button>
              <p className="text-xs text-muted-foreground">最近保存：{savedAt}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function readHandlingOverrides(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem("faultAnalysis.handlingStatus") ?? "{}");
  } catch {
    return {};
  }
}

function InfoTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium mt-1 ${danger ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
