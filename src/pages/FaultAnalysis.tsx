import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  faultAnalysisTasks,
  type AnalysisStatus,
  type HandlingStatus,
  type RecommendationLevel,
} from "@/lib/mockData";

const analysisStatuses: ("all" | AnalysisStatus)[] = ["all", "待分析", "分析中", "已完成", "分析失败"];
const handlingStatuses: ("all" | HandlingStatus)[] = ["all", "待处理", "已确认", "已归档"];
const recommendationLevels: ("all" | RecommendationLevel)[] = ["all", "一般", "严重", "紧急"];

export default function FaultAnalysis() {
  const navigate = useNavigate();
  const [handlingOverrides] = useState<Record<string, HandlingStatus>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("faultAnalysis.handlingStatus") ?? "{}");
    } catch {
      return {};
    }
  });
  const [keyword, setKeyword] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState<"all" | AnalysisStatus>("all");
  const [handlingStatus, setHandlingStatus] = useState<"all" | HandlingStatus>("all");
  const [level, setLevel] = useState<"all" | RecommendationLevel>("all");

  const filtered = useMemo(() => {
    return faultAnalysisTasks.filter((task) => {
      const normalized = keyword.trim().toLowerCase();
      if (analysisStatus !== "all" && task.status !== analysisStatus) return false;
      const currentHandlingStatus = handlingOverrides[task.id] ?? task.handlingStatus;
      if (handlingStatus !== "all" && currentHandlingStatus !== handlingStatus) return false;
      if (level !== "all" && task.recommendationLevel !== level) return false;
      if (!normalized) return true;
      return [task.taskNo, task.objectLabel, task.abnormalType, task.metricValue, task.suggestionSummary]
        .some((item) => item.toLowerCase().includes(normalized));
    });
  }, [analysisStatus, handlingOverrides, handlingStatus, keyword, level]);

  const stats = useMemo(() => {
    return {
      total: faultAnalysisTasks.length,
      active: faultAnalysisTasks.filter((task) => (handlingOverrides[task.id] ?? task.handlingStatus) === "待处理").length,
      serious: faultAnalysisTasks.filter((task) => task.recommendationLevel !== "一般").length,
      completed: faultAnalysisTasks.filter((task) => task.status === "已完成").length,
    };
  }, [handlingOverrides]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="分析任务" value={stats.total} tone="info" />
        <SummaryCard label="待处理" value={stats.active} tone="warning" />
        <SummaryCard label="严重及以上" value={stats.serious} tone="destructive" />
        <SummaryCard label="已完成分析" value={stats.completed} tone="success" />
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive-soft text-destructive flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">故障分析任务</h2>
              <p className="text-xs text-muted-foreground mt-0.5">由巡检异常或关注记录发起，汇总证据、建议和处理结果</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <FileText className="h-4 w-4 mr-2" />报告中心
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索任务编号 / 对象 / 异常类型 / 建议"
              className="h-9 pl-8"
            />
          </div>
          <FilterSelect value={analysisStatus} onChange={(value) => setAnalysisStatus(value as "all" | AnalysisStatus)} items={analysisStatuses} placeholder="分析状态" />
          <FilterSelect value={handlingStatus} onChange={(value) => setHandlingStatus(value as "all" | HandlingStatus)} items={handlingStatuses} placeholder="处理状态" />
          <FilterSelect value={level} onChange={(value) => setLevel(value as "all" | RecommendationLevel)} items={recommendationLevels} placeholder="建议等级" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>分析任务</TableHead>
              <TableHead>触发来源</TableHead>
              <TableHead>影响对象</TableHead>
              <TableHead>异常类型</TableHead>
              <TableHead>异常指标</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>处置建议</TableHead>
              <TableHead>负责人</TableHead>
              <TableHead>报告</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((task) => {
              const currentHandlingStatus = handlingOverrides[task.id] ?? task.handlingStatus;
              return (
              <TableRow key={task.id} className="hover:bg-secondary/40">
                <TableCell>
                  <button className="font-medium hover:text-primary" onClick={() => navigate(`/fault-analysis/${task.id}`)}>
                    {task.taskNo}
                  </button>
                  <div className="text-xs text-muted-foreground mt-1">{task.createdAt}</div>
                </TableCell>
                <TableCell><StatusBadge tone="info">{task.triggerSource}</StatusBadge></TableCell>
                <TableCell className="max-w-[240px] text-sm leading-relaxed">{task.objectLabel}</TableCell>
                <TableCell>{task.abnormalType}</TableCell>
                <TableCell className="font-medium text-destructive">{task.metricValue}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge tone={statusTone(task.status)}>{task.status}</StatusBadge>
                    <StatusBadge tone={currentHandlingStatus === "待处理" ? "warning" : statusTone(currentHandlingStatus)}>
                      {currentHandlingStatus}
                    </StatusBadge>
                  </div>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge tone={task.recommendationLevel === "紧急" ? "destructive" : task.recommendationLevel === "严重" ? "warning" : "info"}>
                      {task.recommendationLevel}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{task.suggestionSummary}</p>
                </TableCell>
                <TableCell>{task.owner}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge tone={statusTone(task.reportStatus)}>{task.reportStatus}</StatusBadge>
                    {task.degradation !== "无降级" && <StatusBadge tone="warning">{task.degradation}</StatusBadge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/fault-analysis/${task.id}`)}>
                      详情
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/fault-analysis/${task.id}`)}>
                      标记处理结果
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  items,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  items: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item} value={item}>
            {item === "all" ? `全部${placeholder}` : item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive" | "info";
}) {
  const toneClass = {
    success: "text-success bg-success-soft",
    warning: "text-warning bg-warning-soft",
    destructive: "text-destructive bg-destructive-soft",
    info: "text-info bg-info-soft",
  }[tone];

  return (
    <div className="stat-card flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
