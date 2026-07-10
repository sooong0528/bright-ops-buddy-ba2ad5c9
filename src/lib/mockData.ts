// Mock 数据 —— 智能运维平台演示
export type HostStatus = "正常" | "异常" | "关注";
export type Severity = "严重" | "警告" | "提示";
export type AnalysisStatus = "待分析" | "分析中" | "已完成" | "分析失败";
export type HandlingStatus = "待处理" | "已确认" | "已归档";
export type RecommendationLevel = "一般" | "严重" | "紧急";
export type HandlingMethod = "采纳系统建议" | "部分采纳系统建议" | "未采纳系统建议" | "使用其他处理方式";
export type AnalysisTriggerSource = "巡检异常" | "关注记录";
export type ReportStatus = "草稿" | "已生成" | "已归档" | "生成失败";
export type ReportGenerateStatus = "未生成" | "已生成" | "生成失败";
export type OpsAssetType = "主机" | "数据库" | "日志源";
export type MetricDataSource = "Zabbix" | "日志文件" | "数据库视图" | "应用探针" | "人工配置";
export type MetricJudgeStatus = "正常" | "关注" | "异常" | "缺项";
export type AnalysisLinkStatus = "未发起" | "分析中" | "已生成分析结果";

export interface Host {
  id: string;
  name: string;
  ip: string;
  group: string;
  status: HostStatus;
  cpu: number;
  memory: number;
  disk: number;
  ping: number; // ms
  uptime: string;
}

export interface InspectionTask {
  id: string;
  name: string;
  type: "日常巡检" | "周巡检" | "手动巡检";
  templateId?: string;
  schedule: string;
  lastRun: string;
  status: "已完成" | "运行中" | "失败" | "待运行";
  normal: number;
  attention: number;
  abnormal: number;
  description?: string;
  targets: string[]; // 主机组或主机
  metrics: ("CPU" | "内存" | "磁盘" | "Ping")[];
  enabled: boolean;
  owner: string;
  createdAt: string;
}

export interface InspectionRun {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  duration: string; // 例如 "1m 12s"
  status: "已完成" | "失败" | "运行中";
  trigger: "定时" | "手动" | "API";
  operator: string;
  normal: number;
  attention: number;
  abnormal: number;
  summary: string;
}

export interface AlertItem {
  id: string;
  host: string;
  metric: string;
  severity: Severity;
  value: string;
  threshold: string;
  time: string;
  description: string;
  suggestion: string;
}

export type ReportCategory = "巡检报告" | "故障分析报告" | "知识服务情况分析报告";
export type ReportFrequency = "日报" | "周报" | "月报";

export interface ReportItem {
  id: string;
  reportNo: string;
  title: string;
  category: ReportCategory;
  frequency: ReportFrequency;
  period: string;
  generatedAt: string;
  author: "系统自动" | string;
  summary: string;
  status: ReportStatus;
  sourceTaskId?: string;
  sourceTaskNo?: string;
  handlingStatus?: HandlingStatus;
  handlingSummary?: string;
  auditTraceId?: string;
  notifyUsers?: string[];
  // 巡检报告指标
  quality?: {
    completionRate: number; // 完成率 %
    coverageRate: number;   // 覆盖率 %
    totalTasks: number;
    finishedTasks: number;
    totalHosts: number;
    coveredHosts: number;
    abnormal: number;
    attention: number;
    normal: number;
    failedRuns: number;
  };
  // 故障分析报告指标
  risk?: {
    riskLevel: "高" | "中" | "低";
    riskScore: number; // 0-100
    keyAlerts: { host: string; metric: string; trend: string; severity: Severity }[];
    rootCauses: string[];
    focusHosts: string[];
    recommendations: string[];
  };
  // 知识服务情况分析报告指标
  knowledge?: {
    totalQA: number;             // 问答次数
    citedKnowledge: number;      // 命中知识条目
    citationRate: number;        // 命中率 %
    newDocs: number;             // 新增文档
    updatedDocs: number;         // 更新文档
    topQuestions: { q: string; count: number }[];
    topDocs: { title: string; cited: number }[];
    coverageGaps: string[];      // 知识盲区
  };
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: "运维手册" | "SOP" | "故障案例" | "FAQ";
  tags: string[];
  updatedAt: string;
  version: string;
  owner: string;
  status: "已发布" | "草稿" | "已下架";
  excerpt: string;
  citationStats: {
    qa: number;
    faultAnalysis: number;
    reports: number;
    total: number;
  };
}

export interface UserItem {
  id: string;
  name: string;
  account: string;
  role: "系统管理员" | "运维人员";
  department: string;
  phone: string;
  email: string;
  status: "启用" | "停用";
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
  result: "成功" | "失败";
  ip: string;
  traceId?: string;
  objectType?: string;
  objectId?: string;
  agentName?: string;
  inputSummary?: string;
  outputSummary?: string;
  dataSource?: string;
  degradation?: string;
}

export interface AssetHost {
  id: string;
  systemCode: string;
  systemName: string;
  hostId: string;
  hostName: string;
  ip: string;
  serviceName: string;
  ownerUser: string;
  notifyUser: string;
  status: "运行中" | "停用";
}

export interface OpsAsset {
  id: string;
  type: OpsAssetType;
  name: string;
  systemName: string;
  address?: string;
  ip: string;
  hostName?: string;
  port?: string;
  databaseType?: "MySQL" | "Oracle" | "PostgreSQL";
  instanceName?: string;
  serviceName?: string;
  relatedAssetId?: string;
  applicationName?: string;
  logPath?: string;
  logType?: "应用日志" | "数据库日志" | "中间件日志" | "系统日志";
  defaultLogWindow?: string;
  logKeywords?: string[];
  owner: string;
  ownerUserId: string;
  notifyUserIds: string[];
  status: "运行中" | "停用";
  onboardingSource: "手工录入" | "Excel 导入" | "预置样例";
  onboardingStatus: "待完善" | "已纳管" | "停用";
  monitoringPlatform: "Zabbix";
  monitoringObjectName: string;
  zabbixHostId: string;
  zabbixSyncStatus: "已匹配" | "未匹配" | "多个候选";
  lastUpdatedAt: string;
  notifyTarget: string;
  description: string;
}

export interface DetectableMetric {
  id: string;
  code: string;
  name: string;
  assetType: OpsAssetType;
  dataSource: MetricDataSource;
  sourceIdentifier: string;
  unit: string;
  attentionThreshold: string;
  abnormalThreshold: string;
  judgeWindow: string;
  missingPolicy: "标记缺项" | "跳过" | "沿用上次值";
  status: "启用" | "停用";
}

export interface InspectionTemplate {
  id: string;
  name: string;
  targetAssetTypes: OpsAssetType[];
  metricIds: string[];
  scheduleSuggestion: string;
  notificationRule: string;
  ownerRole: string;
  description: string;
}

export interface InspectionMetricResult {
  id: string;
  runId: string;
  assetId: string;
  metricId: string;
  currentValue: string;
  attentionThreshold: string;
  abnormalThreshold: string;
  judgeWindow: string;
  status: MetricJudgeStatus;
  collectedAt: string;
  evidenceSnapshot: string;
  dataSource: MetricDataSource;
  sourceIdentifier: string;
  logEvidence?: {
    path: string;
    keywords: string[];
    hitCount: number;
    timeWindow: string;
  };
}

export interface AbnormalRecord {
  id: string;
  sourceRunId: string;
  sourceTaskName: string;
  triggerSource: AnalysisTriggerSource;
  assetId: string;
  objectLabel: string;
  abnormalType: string;
  metricValue: string;
  threshold: string;
  severity: Severity;
  occurredAt: string;
  evidenceSnapshot: string;
  metricResultId: string;
  analysisLinkStatus: AnalysisLinkStatus;
  handlingStatus: HandlingStatus;
}

export interface MetricTrendPoint {
  time: string;
  diskUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  errorCount: number;
}

export interface LogEvidence {
  id: string;
  source: string;
  time: string;
  level: "error" | "warn" | "info";
  keyword: string;
  excerpt: string;
}

export interface KnowledgeCitation {
  id: string;
  title: string;
  docType: "SOP" | "运维手册" | "故障案例" | "应急预案";
  version: string;
  excerpt: string;
}

export interface ManualHandlingRecord {
  status: HandlingStatus;
  method: HandlingMethod;
  description: string;
  attachments: { id: string; name: string; type: "截图" | "文档" }[];
  handledBy: string;
  handledAt: string;
}

export interface AgentTraceStep {
  id: string;
  agentName: string;
  inputSummary: string;
  outputSummary: string;
  duration: string;
  status: "成功" | "失败" | "降级";
}

export interface FaultAnalysisTask {
  id: string;
  taskNo: string;
  abnormalRecordId: string;
  triggerSource: AnalysisTriggerSource;
  assetId: string;
  objectLabel: string;
  abnormalType: string;
  metricValue: string;
  evidenceSnapshot: string;
  status: AnalysisStatus;
  reportStatus: ReportGenerateStatus;
  reportId?: string;
  degradation: "无降级" | "日志不可用" | "知识未命中" | "模型超时" | "部分数据缺失";
  canArchive: boolean;
  recommendationLevel: RecommendationLevel;
  suggestionSummary: string;
  owner: string;
  createdAt: string;
  handlingStatus: HandlingStatus;
  timeWindow: string;
  traceId: string;
  sourceMetricResultIds: string[];
  causeHypotheses: string[];
  suggestions: string[];
  manualConfirmItems: string[];
  metricTrend: MetricTrendPoint[];
  logEvidence: LogEvidence[];
  knowledgeCitations: KnowledgeCitation[];
  handlingRecord: ManualHandlingRecord;
  agentTrace: AgentTraceStep[];
}

export interface KnowledgeGap {
  id: string;
  question: string;
  source: "智能问答" | "故障分析" | "报告追问";
  suggestedDocType: "SOP" | "运维手册" | "故障案例" | "应急预案" | "FAQ";
  status: "待补充" | "已补充" | "暂不处理";
  createdAt: string;
  linkedDocTitle?: string;
  handledBy?: string;
  handledAt?: string;
}

export interface RoleBoundary {
  role: "系统管理员" | "运维人员";
  responsibilities: string[];
  mainPages: string[];
  restrictedNotes: string[];
}

export const hosts: Host[] = [
  { id: "h1", name: "app-web-01", ip: "10.20.1.11", group: "Web 接入层", status: "正常", cpu: 32, memory: 58, disk: 46, ping: 0.6, uptime: "32 天" },
  { id: "h2", name: "app-web-02", ip: "10.20.1.12", group: "Web 接入层", status: "关注", cpu: 71, memory: 64, disk: 52, ping: 0.7, uptime: "32 天" },
  { id: "h3", name: "app-svc-01", ip: "10.20.2.21", group: "应用服务层", status: "异常", cpu: 92, memory: 88, disk: 79, ping: 1.4, uptime: "8 天" },
  { id: "h4", name: "app-svc-02", ip: "10.20.2.22", group: "应用服务层", status: "正常", cpu: 41, memory: 53, disk: 48, ping: 0.8, uptime: "32 天" },
  { id: "h5", name: "db-master-01", ip: "10.20.3.31", group: "数据库", status: "关注", cpu: 64, memory: 82, disk: 68, ping: 0.4, uptime: "120 天" },
  { id: "h6", name: "db-slave-01", ip: "10.20.3.32", group: "数据库", status: "正常", cpu: 28, memory: 60, disk: 54, ping: 0.4, uptime: "120 天" },
  { id: "h7", name: "cache-01", ip: "10.20.4.41", group: "缓存层", status: "正常", cpu: 18, memory: 44, disk: 22, ping: 0.5, uptime: "60 天" },
  { id: "h8", name: "mq-01", ip: "10.20.5.51", group: "消息中间件", status: "异常", cpu: 12, memory: 30, disk: 18, ping: 9999, uptime: "—" },
];

export const inspectionTasks: InspectionTask[] = [
  { id: "t1", name: "全量主机日常巡检", type: "日常巡检", templateId: "tpl-host-basic", schedule: "每日 08:00", lastRun: "2025-04-22 08:00", status: "已完成", normal: 6, attention: 2, abnormal: 2, description: "对全部业务主机进行 CPU/内存/磁盘/Ping 四项基础指标巡检。", targets: ["全部主机组"], metrics: ["CPU", "内存", "磁盘", "Ping"], enabled: true, owner: "李管理", createdAt: "2025-01-10" },
  { id: "t2", name: "数据库专项巡检", type: "日常巡检", templateId: "tpl-db-basic", schedule: "每日 09:00", lastRun: "2025-04-22 09:00", status: "已完成", normal: 1, attention: 1, abnormal: 0, description: "针对 MySQL 主从节点的资源使用情况进行专项核查。", targets: ["数据库"], metrics: ["CPU", "内存", "磁盘"], enabled: true, owner: "张运维", createdAt: "2025-02-03" },
  { id: "t3", name: "周度容量趋势巡检", type: "周巡检", templateId: "tpl-host-basic", schedule: "每周一 07:30", lastRun: "2025-04-21 07:30", status: "已完成", normal: 5, attention: 3, abnormal: 0, description: "汇总一周磁盘容量与内存使用趋势，输出关注主机清单。", targets: ["全部主机组"], metrics: ["磁盘", "内存"], enabled: true, owner: "李管理", createdAt: "2025-01-15" },
  { id: "t4", name: "应用服务与日志巡检", type: "日常巡检", templateId: "tpl-log-basic", schedule: "每 30 分钟", lastRun: "2025-04-22 10:30", status: "运行中", normal: 7, attention: 0, abnormal: 1, description: "检查应用服务可用性与关键日志异常数量。", targets: ["应用服务层"], metrics: ["CPU", "内存", "磁盘", "Ping"], enabled: true, owner: "王巡检", createdAt: "2025-03-01" },
  { id: "t5", name: "手动 — 应急核查", type: "手动巡检", templateId: "tpl-host-basic", schedule: "—", lastRun: "2025-04-22 10:12", status: "已完成", normal: 4, attention: 1, abnormal: 1, description: "应急场景下针对指定主机的临时核查任务。", targets: ["app-svc-01", "mq-01"], metrics: ["CPU", "内存", "Ping"], enabled: true, owner: "张运维", createdAt: "2025-04-22" },
];

// 任务执行历史（按 taskId 关联）
export const inspectionRuns: InspectionRun[] = [
  { id: "run-1024", taskId: "t1", startTime: "2025-04-22 08:00:02", endTime: "2025-04-22 08:01:14", duration: "1m 12s", status: "已完成", trigger: "定时", operator: "系统", normal: 6, attention: 2, abnormal: 2, summary: "app-svc-01 CPU 92%、mq-01 ICMP 失败，已生成异常摘要。" },
  { id: "run-1023", taskId: "t1", startTime: "2025-04-21 08:00:01", endTime: "2025-04-21 08:01:08", duration: "1m 07s", status: "已完成", trigger: "定时", operator: "系统", normal: 7, attention: 1, abnormal: 0, summary: "db-master-01 内存 81%，触发关注。" },
  { id: "run-1022", taskId: "t1", startTime: "2025-04-20 08:00:03", endTime: "2025-04-20 08:01:10", duration: "1m 07s", status: "已完成", trigger: "定时", operator: "系统", normal: 8, attention: 0, abnormal: 0, summary: "全部指标正常。" },
  { id: "run-1021", taskId: "t1", startTime: "2025-04-19 08:00:00", endTime: "2025-04-19 08:01:21", duration: "1m 21s", status: "已完成", trigger: "定时", operator: "系统", normal: 7, attention: 1, abnormal: 0, summary: "app-web-02 CPU 短时升高至 73%。" },
  { id: "run-1020", taskId: "t1", startTime: "2025-04-18 08:00:02", endTime: "2025-04-18 08:01:05", duration: "1m 03s", status: "失败", trigger: "定时", operator: "系统", normal: 0, attention: 0, abnormal: 0, summary: "Zabbix API 鉴权失败，任务中止。" },

  { id: "run-2008", taskId: "t2", startTime: "2025-04-22 09:00:01", endTime: "2025-04-22 09:00:42", duration: "41s", status: "已完成", trigger: "定时", operator: "系统", normal: 1, attention: 1, abnormal: 0, summary: "db-master-01 内存升至 82%。" },
  { id: "run-2007", taskId: "t2", startTime: "2025-04-21 09:00:00", endTime: "2025-04-21 09:00:38", duration: "38s", status: "已完成", trigger: "定时", operator: "系统", normal: 2, attention: 0, abnormal: 0, summary: "数据库节点全部正常。" },

  { id: "run-3005", taskId: "t3", startTime: "2025-04-21 07:30:01", endTime: "2025-04-21 07:32:15", duration: "2m 14s", status: "已完成", trigger: "定时", operator: "系统", normal: 5, attention: 3, abnormal: 0, summary: "3 台主机磁盘使用率周环比上升 >5%。" },

  { id: "run-4099", taskId: "t4", startTime: "2025-04-22 10:30:00", endTime: "—", duration: "进行中", status: "运行中", trigger: "定时", operator: "系统", normal: 7, attention: 0, abnormal: 1, summary: "mq-01 仍处于失联状态。" },
  { id: "run-4098", taskId: "t4", startTime: "2025-04-22 10:00:00", endTime: "2025-04-22 10:00:18", duration: "18s", status: "已完成", trigger: "定时", operator: "系统", normal: 7, attention: 0, abnormal: 1, summary: "mq-01 ICMP 失败。" },
  { id: "run-4097", taskId: "t4", startTime: "2025-04-22 09:30:00", endTime: "2025-04-22 09:30:16", duration: "16s", status: "已完成", trigger: "定时", operator: "系统", normal: 8, attention: 0, abnormal: 0, summary: "全部主机连通。" },

  { id: "run-5001", taskId: "t5", startTime: "2025-04-22 10:12:33", endTime: "2025-04-22 10:13:45", duration: "1m 12s", status: "已完成", trigger: "手动", operator: "张运维", normal: 0, attention: 1, abnormal: 1, summary: "应急核查 app-svc-01 与 mq-01，确认异常持续。" },
];

export const alerts: AlertItem[] = [
  { id: "a0", host: "app-svc-01", metric: "磁盘空间 /data/logs", severity: "严重", value: "92%", threshold: ">90% 持续 30 分钟", time: "2026-06-26 09:42", description: "营销系统应用服务节点日志目录磁盘水位持续高位，error 日志量同步上升，可能影响日志写入和服务稳定性。", suggestion: "建议优先检查 /data/logs 目录占用，确认日志归档任务状态，并保留处理截图。" },
  { id: "a1", host: "app-svc-01", metric: "CPU 使用率", severity: "严重", value: "92%", threshold: ">85% 持续 10 分钟", time: "2025-04-22 09:42", description: "应用服务节点 CPU 持续高位，可能存在请求堆积或慢任务。", suggestion: "1) 查看应用线程数与 GC 情况；2) 比对昨日同时段流量；3) 必要时联系开发确认。" },
  { id: "a2", host: "mq-01", metric: "Ping/ICMP", severity: "严重", value: "超时", threshold: "连续 3 次失败", time: "2025-04-22 10:18", description: "消息中间件主机 ICMP 探测失败，疑似网络中断或主机宕机。", suggestion: "1) 通过跳板机尝试登录；2) 联系网络确认链路；3) 评估业务影响并启用备用链路。" },
  { id: "a3", host: "db-master-01", metric: "内存使用率", severity: "警告", value: "82%", threshold: ">80% 持续 30 分钟", time: "2025-04-22 08:55", description: "数据库内存使用率上升，关注是否存在长事务或缓存膨胀。", suggestion: "1) 查看 InnoDB Buffer Pool；2) 排查长事务；3) 留意慢查询。" },
  { id: "a4", host: "app-web-02", metric: "CPU 使用率", severity: "提示", value: "71%", threshold: ">70%", time: "2025-04-22 10:02", description: "Web 节点 CPU 上升至关注阈值，暂未达告警线。", suggestion: "持续观察，比对负载均衡分配是否均匀。" },
];

export const assetHosts: AssetHost[] = [
  {
    id: "asset-app-svc-01",
    systemCode: "marketing",
    systemName: "营销系统",
    hostId: "zbx-10021",
    hostName: "app-svc-01",
    ip: "10.20.2.21",
    serviceName: "应用服务 / 日志归档",
    ownerUser: "张运维",
    notifyUser: "张运维、李管理",
    status: "运行中",
  },
  {
    id: "asset-db-master-01",
    systemCode: "marketing",
    systemName: "营销系统",
    hostId: "zbx-10031",
    hostName: "db-master-01",
    ip: "10.20.3.31",
    serviceName: "MySQL 主库",
    ownerUser: "赵DBA",
    notifyUser: "赵DBA、李管理",
    status: "运行中",
  },
];

export const opsAssets: OpsAsset[] = [
  {
    id: "asset-app-svc-01",
    type: "主机",
    name: "app-svc-01",
    systemName: "营销系统",
    address: "10.20.2.21",
    ip: "10.20.2.21",
    hostName: "app-svc-01",
    owner: "张运维",
    ownerUserId: "u2",
    notifyUserIds: ["u2", "u1"],
    status: "运行中",
    onboardingSource: "Excel 导入",
    onboardingStatus: "已纳管",
    monitoringPlatform: "Zabbix",
    monitoringObjectName: "app-svc-01",
    zabbixHostId: "zbx-10021",
    zabbixSyncStatus: "已匹配",
    lastUpdatedAt: "2026-06-26 09:35",
    notifyTarget: "张运维 / 李管理",
    description: "营销系统应用服务部署主机，资产管理只维护部署位置、责任人、Zabbix Host 映射和关联日志源。",
  },
  {
    id: "asset-db-master-01",
    type: "数据库",
    name: "db-master-01 / MySQL 主库",
    systemName: "营销系统",
    address: "10.20.3.31:3306",
    ip: "10.20.3.31",
    hostName: "db-master-01",
    port: "3306",
    databaseType: "MySQL",
    instanceName: "marketing_mysql_primary",
    serviceName: "MySQL 主库",
    relatedAssetId: "asset-app-svc-01",
    owner: "赵DBA",
    ownerUserId: "u4",
    notifyUserIds: ["u4", "u1"],
    status: "运行中",
    onboardingSource: "Excel 导入",
    onboardingStatus: "已纳管",
    monitoringPlatform: "Zabbix",
    monitoringObjectName: "db-master-01",
    zabbixHostId: "zbx-10031",
    zabbixSyncStatus: "已匹配",
    lastUpdatedAt: "2026-06-26 09:32",
    notifyTarget: "赵DBA / 李管理",
    description: "营销系统 MySQL 主库，资产管理记录 IP、端口、数据库类型、实例名称和 Zabbix Host 映射。",
  },
  {
    id: "asset-log-app-error",
    type: "日志源",
    name: "应用错误日志",
    systemName: "营销系统",
    address: "10.20.2.21",
    ip: "10.20.2.21",
    hostName: "app-svc-01",
    applicationName: "营销服务",
    relatedAssetId: "asset-app-svc-01",
    logPath: "/data/logs/app/error.log",
    logType: "应用日志",
    defaultLogWindow: "异常前后 30 分钟",
    logKeywords: ["error", "exception", "timeout", "failed"],
    owner: "张运维",
    ownerUserId: "u2",
    notifyUserIds: ["u2"],
    status: "运行中",
    onboardingSource: "手工录入",
    onboardingStatus: "已纳管",
    monitoringPlatform: "Zabbix",
    monitoringObjectName: "",
    zabbixHostId: "",
    zabbixSyncStatus: "未匹配",
    lastUpdatedAt: "2026-06-26 10:10",
    notifyTarget: "张运维",
    description: "应用错误日志源。系统按部署主机 IP、主机名称、应用名称、日志路径和时间范围检索日志；采集通道由系统内置。",
  },
];

export const detectableMetrics: DetectableMetric[] = [
  {
    id: "metric-host-disk-logs",
    code: "host.disk.logs.pused",
    name: "/data/logs 磁盘使用率",
    assetType: "主机",
    dataSource: "Zabbix",
    sourceIdentifier: "vfs.fs.size[/data/logs,pused]",
    unit: "%",
    attentionThreshold: ">=80%",
    abnormalThreshold: ">=90%",
    judgeWindow: "持续 30 分钟",
    missingPolicy: "标记缺项",
    status: "启用",
  },
  {
    id: "metric-host-cpu",
    code: "host.cpu.util",
    name: "CPU 使用率",
    assetType: "主机",
    dataSource: "Zabbix",
    sourceIdentifier: "system.cpu.util[,idle]",
    unit: "%",
    attentionThreshold: ">=70%",
    abnormalThreshold: ">=85%",
    judgeWindow: "持续 10 分钟",
    missingPolicy: "标记缺项",
    status: "启用",
  },
  {
    id: "metric-db-memory",
    code: "db.memory.util",
    name: "数据库主机内存使用率",
    assetType: "数据库",
    dataSource: "Zabbix",
    sourceIdentifier: "vm.memory.size[pused]",
    unit: "%",
    attentionThreshold: ">=80%",
    abnormalThreshold: ">=90%",
    judgeWindow: "持续 30 分钟",
    missingPolicy: "标记缺项",
    status: "启用",
  },
  {
    id: "metric-log-error-count",
    code: "log.error.count",
    name: "错误日志关键字命中数",
    assetType: "日志源",
    dataSource: "日志文件",
    sourceIdentifier: "/data/logs/app/error.log",
    unit: "条",
    attentionThreshold: ">=50 条",
    abnormalThreshold: ">=100 条",
    judgeWindow: "最近 30 分钟",
    missingPolicy: "标记缺项",
    status: "启用",
  },
];

export const inspectionTemplates: InspectionTemplate[] = [
  {
    id: "tpl-host-basic",
    name: "主机基础巡检",
    targetAssetTypes: ["主机"],
    metricIds: ["metric-host-cpu", "metric-host-disk-logs"],
    scheduleSuggestion: "每日 08:00",
    notificationRule: "异常通知资产负责人，关注项进入记录池",
    ownerRole: "运维人员",
    description: "覆盖主机 CPU、内存、磁盘等基础资源指标。",
  },
  {
    id: "tpl-db-basic",
    name: "数据库专项巡检",
    targetAssetTypes: ["数据库"],
    metricIds: ["metric-db-memory"],
    scheduleSuggestion: "每日 09:00",
    notificationRule: "关注项通知 DBA，异常项进入故障分析",
    ownerRole: "运维人员",
    description: "P1 MVP 先覆盖数据库主机资源类指标，不做复杂 SQL 专项分析。",
  },
  {
    id: "tpl-log-basic",
    name: "日志异常巡检",
    targetAssetTypes: ["日志源"],
    metricIds: ["metric-log-error-count"],
    scheduleSuggestion: "每 30 分钟",
    notificationRule: "异常日志数量超过阈值后进入异常/关注记录池",
    ownerRole: "运维人员",
    description: "统计关键日志文件中 error/exception/timeout/failed 等关键字命中数量。",
  },
];

export const inspectionMetricResults: InspectionMetricResult[] = [
  {
    id: "imr-20260626-001",
    runId: "run-1024",
    assetId: "asset-app-svc-01",
    metricId: "metric-host-disk-logs",
    currentValue: "92%",
    attentionThreshold: ">=80%",
    abnormalThreshold: ">=90%",
    judgeWindow: "持续 30 分钟",
    status: "异常",
    collectedAt: "2026-06-26 09:42",
    evidenceSnapshot: "Zabbix item vfs.fs.size[/data/logs,pused] 最近 30 分钟保持 90% 以上。",
    dataSource: "Zabbix",
    sourceIdentifier: "vfs.fs.size[/data/logs,pused]",
  },
  {
    id: "imr-20260626-002",
    runId: "run-1024",
    assetId: "asset-log-app-error",
    metricId: "metric-log-error-count",
    currentValue: "120 条",
    attentionThreshold: ">=50 条",
    abnormalThreshold: ">=100 条",
    judgeWindow: "最近 30 分钟",
    status: "异常",
    collectedAt: "2026-06-26 09:42",
    evidenceSnapshot: "/data/logs/app/error.log 最近 30 分钟 error/exception/timeout/failed 命中 120 条。",
    dataSource: "日志文件",
    sourceIdentifier: "/data/logs/app/error.log",
    logEvidence: {
      path: "/data/logs/app/error.log",
      keywords: ["error", "exception", "timeout", "failed"],
      hitCount: 120,
      timeWindow: "2026-06-26 09:10 ~ 09:42",
    },
  },
  {
    id: "imr-20260626-003",
    runId: "run-2008",
    assetId: "asset-db-master-01",
    metricId: "metric-db-memory",
    currentValue: "82%",
    attentionThreshold: ">=80%",
    abnormalThreshold: ">=90%",
    judgeWindow: "持续 30 分钟",
    status: "关注",
    collectedAt: "2026-06-26 09:50",
    evidenceSnapshot: "数据库主机内存使用率连续 30 分钟超过关注阈值，未达到异常阈值。",
    dataSource: "Zabbix",
    sourceIdentifier: "vm.memory.size[pused]",
  },
];

export const abnormalRecords: AbnormalRecord[] = [
  {
    id: "AR-20260626-001",
    sourceRunId: "run-1024",
    sourceTaskName: "全量主机日常巡检",
    triggerSource: "巡检异常",
    assetId: "asset-app-svc-01",
    objectLabel: "营销系统 / app-svc-01 / 10.20.2.21 / 应用服务",
    abnormalType: "磁盘空间不足",
    metricValue: "/data/logs 使用率 92%",
    threshold: ">90% 持续 30 分钟",
    severity: "严重",
    occurredAt: "2026-06-26 09:42",
    evidenceSnapshot: "Zabbix item vfs.fs.size[/data/logs,pused] 最近 30 分钟保持 90% 以上，应用 error 日志同步上升。",
    metricResultId: "imr-20260626-002",
    analysisLinkStatus: "已生成分析结果",
    handlingStatus: "待处理",
  },
  {
    id: "AR-20260626-002",
    sourceRunId: "run-2008",
    sourceTaskName: "数据库专项巡检",
    triggerSource: "关注记录",
    assetId: "asset-db-master-01",
    objectLabel: "营销系统 / db-master-01 / 10.20.3.31 / MySQL 主库",
    abnormalType: "内存使用率偏高",
    metricValue: "内存使用率 82%",
    threshold: ">80% 持续 30 分钟",
    severity: "警告",
    occurredAt: "2026-06-26 09:50",
    evidenceSnapshot: "数据库主机内存使用率连续 30 分钟超过关注阈值，暂未达到严重级别。",
    metricResultId: "imr-20260626-003",
    analysisLinkStatus: "分析中",
    handlingStatus: "待处理",
  },
];

export const faultAnalysisTasks: FaultAnalysisTask[] = [
  {
    id: "fa-001",
    taskNo: "FA-20260626-001",
    abnormalRecordId: "AR-20260626-001",
    triggerSource: "巡检异常",
    assetId: "asset-app-svc-01",
    objectLabel: "营销系统 / app-svc-01 / 10.20.2.21 / 应用服务",
    abnormalType: "磁盘空间不足",
    metricValue: "/data/logs 使用率 92%",
    evidenceSnapshot: "Zabbix item vfs.fs.size[/data/logs,pused] 最近 30 分钟保持 90% 以上，应用 error 日志同步上升。",
    status: "已完成",
    reportStatus: "已生成",
    reportId: "r-fa-001",
    degradation: "无降级",
    canArchive: false,
    recommendationLevel: "严重",
    suggestionSummary: "建议优先检查 /data/logs 目录占用并确认日志归档任务状态。",
    owner: "张运维",
    createdAt: "2026-06-26 09:45",
    handlingStatus: "待处理",
    timeWindow: "2026-06-26 09:10 ~ 09:45",
    traceId: "TRACE-20260626-0001",
    sourceMetricResultIds: ["imr-20260626-001", "imr-20260626-002", "imr-20260626-004"],
    causeHypotheses: [
      "应用日志归档任务可能执行失败，导致 /data/logs 目录持续增长。",
      "短时间 error 日志数量上升，可能放大了日志写入量。",
      "当前证据不足以确认最终根因，需要人工核对归档任务和目录占用明细。",
    ],
    suggestions: [
      "优先检查 /data/logs 下各子目录占用，确认是否存在异常增长的日志文件。",
      "核对日志归档任务最近一次执行状态，确认是否存在归档失败或权限异常。",
      "保留监控恢复截图和处理说明，处理完成后在系统中标记处理结果。",
    ],
    manualConfirmItems: [
      "人工登录业务主机核对 /data/logs 目录实际占用。",
      "确认日志归档任务最近一次执行结果。",
      "确认是否需要联系应用负责人降低异常日志输出。",
    ],
    metricTrend: [
      { time: "09:10", diskUsage: 88, cpuUsage: 42, memoryUsage: 64, errorCount: 12 },
      { time: "09:20", diskUsage: 90, cpuUsage: 45, memoryUsage: 65, errorCount: 34 },
      { time: "09:30", diskUsage: 91, cpuUsage: 47, memoryUsage: 66, errorCount: 78 },
      { time: "09:40", diskUsage: 92, cpuUsage: 46, memoryUsage: 66, errorCount: 120 },
    ],
    logEvidence: [
      {
        id: "log-001",
        source: "app-svc-01:/data/logs/app/error.log",
        time: "2026-06-26 09:37:12",
        level: "error",
        keyword: "No space left on device",
        excerpt: "ERROR archive.writer - write failed: No space left on device, path=/data/logs/app/error.log",
      },
      {
        id: "log-002",
        source: "app-svc-01:/data/logs/archive/archive.log",
        time: "2026-06-26 09:39:08",
        level: "warn",
        keyword: "archive failed",
        excerpt: "WARN archive.job - archive failed, target=/data/logs/archive, reason=permission denied",
      },
    ],
    knowledgeCitations: [
      {
        id: "k6",
        title: "磁盘水位告警处理建议（草稿）",
        docType: "SOP",
        version: "v0.1",
        excerpt: "磁盘使用率超过 90% 时，应先确认增长目录，再判断是否可清理临时文件或恢复归档任务。",
      },
      {
        id: "k1",
        title: "Linux 主机 CPU 高负载排查 SOP",
        docType: "SOP",
        version: "v1.3",
        excerpt: "资源类异常需要同时保留监控截图、处理记录和人工确认事项。",
      },
    ],
    handlingRecord: {
      status: "待处理",
      method: "采纳系统建议",
      description: "等待运维人员补充实际处理过程、结果和恢复截图。",
      attachments: [],
      handledBy: "张运维",
      handledAt: "待处理",
    },
    agentTrace: [
      {
        id: "trace-step-001",
        agentName: "分析调度服务",
        inputSummary: "接收巡检异常 AR-20260626-001，创建故障分析任务。",
        outputSummary: "生成 Trace ID 并分派资产、指标、日志和知识检索子任务。",
        duration: "0.8s",
        status: "成功",
      },
      {
        id: "trace-step-002",
        agentName: "故障分析服务",
        inputSummary: "读取磁盘水位、error 日志数量和资产上下文。",
        outputSummary: "生成原因假设、处置建议和人工确认事项。",
        duration: "18.6s",
        status: "成功",
      },
      {
        id: "trace-step-003",
        agentName: "知识检索服务",
        inputSummary: "检索磁盘水位、日志归档、资源异常相关知识。",
        outputSummary: "命中 2 条知识引用，1 条为草稿 SOP。",
        duration: "2.4s",
        status: "成功",
      },
    ],
  },
  {
    id: "fa-002",
    taskNo: "FA-20260626-002",
    abnormalRecordId: "AR-20260626-002",
    triggerSource: "关注记录",
    assetId: "asset-db-master-01",
    objectLabel: "营销系统 / db-master-01 / 10.20.3.31 / MySQL 主库",
    abnormalType: "内存使用率偏高",
    metricValue: "内存使用率 82%",
    evidenceSnapshot: "数据库主机内存使用率连续 30 分钟超过关注阈值，暂未达到严重级别。",
    status: "分析中",
    reportStatus: "未生成",
    degradation: "知识未命中",
    canArchive: false,
    recommendationLevel: "一般",
    suggestionSummary: "建议观察数据库连接数和 Buffer Pool 命中率，暂不需要立即处置。",
    owner: "赵DBA",
    createdAt: "2026-06-26 09:52",
    handlingStatus: "待处理",
    timeWindow: "2026-06-26 09:20 ~ 09:52",
    traceId: "TRACE-20260626-0002",
    sourceMetricResultIds: ["imr-20260626-003"],
    causeHypotheses: [
      "数据库 Buffer Pool 使用率升高，可能与业务查询峰值相关。",
      "当前未达到异常阈值，仍需人工观察连接数、慢 SQL 和缓存命中率。",
    ],
    suggestions: [
      "观察未来 30 分钟内存曲线是否继续上升。",
      "核对当前连接数和长事务数量，确认是否存在异常会话。",
      "若内存超过异常阈值，再升级为严重分析任务并生成报告。",
    ],
    manualConfirmItems: [
      "DBA 核对当前连接数、长事务和 Buffer Pool 命中率。",
      "确认是否存在批处理或报表任务导致短时内存升高。",
    ],
    metricTrend: [
      { time: "09:20", diskUsage: 68, cpuUsage: 44, memoryUsage: 79, errorCount: 0 },
      { time: "09:30", diskUsage: 68, cpuUsage: 48, memoryUsage: 81, errorCount: 0 },
      { time: "09:40", diskUsage: 69, cpuUsage: 46, memoryUsage: 82, errorCount: 1 },
      { time: "09:50", diskUsage: 69, cpuUsage: 45, memoryUsage: 82, errorCount: 0 },
    ],
    logEvidence: [
      {
        id: "log-101",
        source: "db-master-01:/data/mysql/slow.log",
        time: "2026-06-26 09:45:18",
        level: "info",
        keyword: "slow query",
        excerpt: "未发现异常慢查询峰值，最近 30 分钟慢 SQL 数量保持低位。",
      },
    ],
    knowledgeCitations: [],
    handlingRecord: {
      status: "待处理",
      method: "采纳系统建议",
      description: "分析仍在进行中，等待 DBA 补充人工观察结果。",
      attachments: [],
      handledBy: "赵DBA",
      handledAt: "待处理",
    },
    agentTrace: [
      {
        id: "trace-step-101",
        agentName: "分析调度服务",
        inputSummary: "接收关注记录 AR-20260626-002，创建故障分析任务。",
        outputSummary: "生成 Trace ID 并分派数据库指标回溯任务。",
        duration: "0.6s",
        status: "成功",
      },
      {
        id: "trace-step-102",
        agentName: "故障分析服务",
        inputSummary: "读取内存趋势、数据库资产上下文和慢 SQL 摘要。",
        outputSummary: "分析仍在进行中；知识库未命中可直接引用的数据库内存关注项 SOP。",
        duration: "进行中",
        status: "降级",
      },
    ],
  },
];

export const knowledgeGaps: KnowledgeGap[] = [
  {
    id: "kg-001",
    question: "日志归档任务失败导致磁盘水位升高时，是否有标准清理顺序？",
    source: "故障分析",
    suggestedDocType: "SOP",
    status: "待补充",
    createdAt: "2026-06-26 10:20",
  },
  {
    id: "kg-002",
    question: "数据库内存进入关注区间但未达异常阈值时，是否有轻量观察 SOP？",
    source: "故障分析",
    suggestedDocType: "运维手册",
    status: "已补充",
    createdAt: "2026-06-26 10:28",
    linkedDocTitle: "MySQL 内存关注项观察手册 v1.0",
    handledBy: "知识管理员",
    handledAt: "2026-06-26 10:45",
  },
  {
    id: "kg-003",
    question: "报告追问中多次询问归档前处理记录完整性说明。",
    source: "报告追问",
    suggestedDocType: "FAQ",
    status: "暂不处理",
    createdAt: "2026-06-26 10:40",
    handledBy: "知识管理员",
    handledAt: "2026-06-26 10:50",
  },
];

export const reports: ReportItem[] = [
  {
    id: "r1",
    reportNo: "IR-20260626-001",
    title: "营销系统日常巡检日报",
    category: "巡检报告",
    frequency: "日报",
    period: "2026-06-26",
    generatedAt: "2026-06-26 08:15",
    author: "系统自动",
    summary: "全量 8 台主机完成巡检，覆盖率 100%，2 项异常 2 项关注，主要集中在 app-svc-01 与 mq-01。",
    status: "已生成",
    notifyUsers: ["张运维", "李管理"],
    quality: {
      completionRate: 98.5, coverageRate: 100, totalTasks: 5, finishedTasks: 5,
      totalHosts: 8, coveredHosts: 8, abnormal: 2, attention: 2, normal: 4, failedRuns: 0,
    },
  },
  {
    id: "r2",
    reportNo: "IR-20260626-002",
    title: "营销系统巡检周报",
    category: "巡检报告",
    frequency: "周报",
    period: "2026-06-19 ~ 06-25",
    generatedAt: "2026-06-26 09:00",
    author: "系统自动",
    summary: "本周共执行巡检任务 35 次，完成率 97.1%，覆盖全部 8 台主机，识别异常 5 项、关注 9 项。",
    status: "已归档",
    notifyUsers: ["张运维", "李管理"],
    quality: {
      completionRate: 97.1, coverageRate: 100, totalTasks: 35, finishedTasks: 34,
      totalHosts: 8, coveredHosts: 8, abnormal: 5, attention: 9, normal: 21, failedRuns: 1,
    },
  },
  {
    id: "r-fa-001",
    reportNo: "FR-20260626-001",
    title: "营销系统 / app-svc-01 磁盘空间不足故障分析报告",
    category: "故障分析报告",
    frequency: "日报",
    period: "2026-06-26 09:10 ~ 09:45",
    generatedAt: "2026-06-26 10:05",
    author: "系统自动",
    summary: "来源任务 FA-20260626-001。/data/logs 使用率 92%，建议优先检查日志目录占用和归档任务状态；处理结果待补充。",
    status: "已生成",
    sourceTaskId: "fa-001",
    sourceTaskNo: "FA-20260626-001",
    handlingStatus: "待处理",
    handlingSummary: "处理结果待补充",
    auditTraceId: "TRACE-20260626-0001",
    notifyUsers: ["张运维", "李管理"],
    risk: {
      riskLevel: "中",
      riskScore: 72,
      keyAlerts: [
        { host: "app-svc-01", metric: "/data/logs 使用率", trend: "最近 30 分钟保持 90% 以上", severity: "严重" },
        { host: "app-svc-01", metric: "error 日志数", trend: "30 分钟内上升至 120 条", severity: "警告" },
      ],
      rootCauses: [
        "日志归档任务可能执行失败，导致 /data/logs 目录持续增长",
        "error 日志数量上升可能放大日志写入量",
        "当前证据不足以确认最终根因，需要人工核对目录占用和归档任务状态",
      ],
      focusHosts: ["app-svc-01"],
      recommendations: [
        "检查 /data/logs 下各子目录占用，确认是否存在异常增长文件",
        "核对日志归档任务最近一次执行状态",
        "保留处理说明和恢复截图，归档前补齐人工处理记录",
      ],
    },
  },
  {
    id: "r4",
    reportNo: "KR-20260626-001",
    title: "知识服务月度报告",
    category: "知识服务情况分析报告",
    frequency: "月报",
    period: "2026-06",
    generatedAt: "2026-06-26 09:00",
    author: "系统自动",
    summary: "本月共承接问答 326 次，命中知识库 287 次，命中率 88%；新增 4 篇 SOP、更新 6 篇文档；识别 3 个知识盲区。",
    status: "已归档",
    notifyUsers: ["李管理"],
    knowledge: {
      totalQA: 326,
      citedKnowledge: 287,
      citationRate: 88,
      newDocs: 4,
      updatedDocs: 6,
      topQuestions: [
        { q: "CPU 使用率持续高位如何排查", count: 42 },
        { q: "MQ 节点失联应急处理流程", count: 31 },
        { q: "MySQL 内存增长原因分析", count: 27 },
        { q: "服务重启前后确认事项", count: 23 },
        { q: "磁盘水位告警处理", count: 18 },
      ],
      topDocs: [
        { title: "Linux 主机 CPU 高负载排查 SOP v1.3", cited: 56 },
        { title: "MySQL 内存使用率升高处理手册 v2.0", cited: 41 },
        { title: "MQ 节点宕机历史故障案例 (2024-11)", cited: 33 },
        { title: "服务重启前后确认事项 FAQ v1.1", cited: 28 },
      ],
      coverageGaps: [
        "缺少缓存层（Redis）专项排查 SOP，本月相关问答 12 次未命中",
        "缺少跨机房链路抖动应急流程",
        "Zabbix 自定义指标对接说明文档版本陈旧",
      ],
    },
  },
];

export const knowledge: KnowledgeItem[] = [
  { id: "k1", title: "Linux 主机 CPU 高负载排查 SOP", category: "SOP", tags: ["CPU", "Linux", "性能"], updatedAt: "2025-04-18", version: "v1.3", owner: "运维组", status: "已发布", excerpt: "覆盖 top / pidstat / perf 等基础排查步骤与常见根因。", citationStats: { qa: 42, faultAnalysis: 9, reports: 5, total: 56 } },
  { id: "k2", title: "MySQL 内存使用率升高处理手册", category: "运维手册", tags: ["MySQL", "内存", "数据库"], updatedAt: "2025-04-12", version: "v2.0", owner: "DBA", status: "已发布", excerpt: "包含 Buffer Pool、连接数、长事务等检查项及处理建议。", citationStats: { qa: 27, faultAnalysis: 8, reports: 6, total: 41 } },
  { id: "k3", title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例", tags: ["MQ", "宕机", "网络"], updatedAt: "2025-03-30", version: "v1.0", owner: "运维组", status: "已发布", excerpt: "完整记录 2024-11 一次 MQ 宕机的发现、定位、恢复全过程。", citationStats: { qa: 21, faultAnalysis: 7, reports: 5, total: 33 } },
  { id: "k4", title: "服务重启前后确认事项 FAQ", category: "FAQ", tags: ["服务", "重启", "操作"], updatedAt: "2025-04-20", version: "v1.1", owner: "运维组", status: "已发布", excerpt: "重启前后必须确认的 8 项内容及回滚预案。", citationStats: { qa: 18, faultAnalysis: 4, reports: 6, total: 28 } },
  { id: "k5", title: "Zabbix 基础指标含义说明", category: "运维手册", tags: ["Zabbix", "指标", "监控"], updatedAt: "2025-04-05", version: "v1.0", owner: "监控组", status: "已发布", excerpt: "对接入的 CPU/内存/磁盘/Ping 指标进行业务化解释。", citationStats: { qa: 14, faultAnalysis: 5, reports: 2, total: 21 } },
  { id: "k6", title: "磁盘水位告警处理建议（草稿）", category: "SOP", tags: ["磁盘", "容量"], updatedAt: "2025-04-21", version: "v0.1", owner: "运维组", status: "草稿", excerpt: "针对磁盘 80% / 90% 不同水位的标准化处理流程。", citationStats: { qa: 18, faultAnalysis: 6, reports: 3, total: 27 } },
];

export const roleBoundaries: RoleBoundary[] = [
  {
    role: "系统管理员",
    responsibilities: ["配置资产与巡检规则", "维护知识库目录", "管理用户角色", "查看审计与导出入口"],
    mainPages: ["配置与管理", "资产管理", "巡检配置", "知识库", "用户与角色", "审计留痕"],
    restrictedNotes: ["不直接执行生产处置动作", "不代替运维人员填写现场处理结果"],
  },
  {
    role: "运维人员",
    responsibilities: ["查看巡检结果", "从异常/关注记录发起故障分析", "补充人工处理记录", "生成和追问报告"],
    mainPages: ["巡检中心", "故障分析", "报告中心", "智能问答"],
    restrictedNotes: ["不维护系统级用户权限", "归档前必须补齐处理记录"],
  },
];

export const users: UserItem[] = [
  { id: "u1", name: "李管理", account: "admin", role: "系统管理员", department: "运维平台组", phone: "13800001000", email: "li.admin@example.local", status: "启用", lastLogin: "2026-06-26 09:50" },
  { id: "u2", name: "张运维", account: "zhang.yw", role: "运维人员", department: "业务运维组", phone: "13800001001", email: "zhang.yw@example.local", status: "启用", lastLogin: "2026-06-26 10:15" },
  { id: "u3", name: "王巡检", account: "wang.xj", role: "运维人员", department: "业务运维组", phone: "13800001002", email: "wang.xj@example.local", status: "启用", lastLogin: "2026-06-26 08:02" },
  { id: "u4", name: "赵DBA", account: "zhao.dba", role: "运维人员", department: "数据库运维组", phone: "13800001003", email: "zhao.dba@example.local", status: "启用", lastLogin: "2026-06-25 17:30" },
];

export const auditLogs: AuditLog[] = [
  {
    id: "l0",
    time: "2026-06-26 09:45",
    user: "系统",
    action: "完成故障分析",
    target: "FA-20260626-001",
    result: "成功",
    ip: "—",
    traceId: "TRACE-20260626-0001",
    objectType: "故障分析任务",
    objectId: "FA-20260626-001",
    agentName: "故障分析服务",
    inputSummary: "巡检异常 AR-20260626-001，/data/logs 使用率 92%。",
    outputSummary: "输出严重级建议：检查日志目录占用并确认归档任务状态。",
    dataSource: "Zabbix / 日志检索 / 知识库",
    degradation: "无降级",
  },
  {
    id: "l0-1",
    time: "2026-06-26 10:05",
    user: "系统",
    action: "生成故障分析报告",
    target: "FR-20260626-001",
    result: "成功",
    ip: "—",
    traceId: "TRACE-20260626-0001",
    objectType: "报告",
    objectId: "r-fa-001",
    agentName: "报告生成服务",
    inputSummary: "读取故障分析任务 FA-20260626-001、证据依据、建议和人工处理状态。",
    outputSummary: "生成故障分析报告，处理结果标记为待补充。",
    dataSource: "故障分析任务 / 指标趋势 / 日志证据 / 知识引用",
    degradation: "无降级",
  },
  {
    id: "l0-2",
    time: "2026-06-26 09:46",
    user: "张运维",
    action: "查看故障分析",
    target: "FA-20260626-001",
    result: "成功",
    ip: "10.10.1.22",
    traceId: "TRACE-20260626-0001",
    objectType: "故障分析任务",
    objectId: "FA-20260626-001",
  },
  {
    id: "l0-3",
    time: "2026-06-26 09:52",
    user: "系统",
    action: "创建故障分析任务",
    target: "FA-20260626-002",
    result: "成功",
    ip: "—",
    traceId: "TRACE-20260626-0002",
    objectType: "故障分析任务",
    objectId: "FA-20260626-002",
    agentName: "分析调度服务",
    inputSummary: "关注记录 AR-20260626-002，内存使用率 82%。",
    outputSummary: "创建分析中任务，等待数据库指标回溯结果。",
    dataSource: "Zabbix / 资产映射 / 数据库巡检结果",
    degradation: "无降级",
  },
  {
    id: "l0-4",
    time: "2026-06-26 09:53",
    user: "系统",
    action: "故障分析降级",
    target: "FA-20260626-002",
    result: "成功",
    ip: "—",
    traceId: "TRACE-20260626-0002",
    objectType: "故障分析任务",
    objectId: "FA-20260626-002",
    agentName: "知识检索服务",
    inputSummary: "检索数据库内存关注项、Buffer Pool、长事务等知识。",
    outputSummary: "未命中可直接引用的关注项处置 SOP，已生成知识缺口 kg-002。",
    dataSource: "知识库 / 故障分析任务",
    degradation: "知识未命中",
  },
  {
    id: "l0-5",
    time: "2026-06-26 10:12",
    user: "张运维",
    action: "报告追问",
    target: "FR-20260626-001",
    result: "成功",
    ip: "10.10.1.22",
    traceId: "TRACE-20260626-0001-RPT01",
    objectType: "报告",
    objectId: "r-fa-001",
    agentName: "报告追问服务",
    inputSummary: "用户追问故障分析报告最需要关注的问题。",
    outputSummary: "返回日志目录占用、归档任务状态和处理记录完整性三个关注点。",
    dataSource: "故障分析报告 / 故障分析任务 / 知识引用",
    degradation: "无降级",
  },
  { id: "l1", time: "2025-04-22 10:31", user: "张运维", action: "生成报告", target: "MQ 主机连通性异常摘要", result: "成功", ip: "10.10.1.22" },
  { id: "l2", time: "2025-04-22 10:18", user: "系统", action: "触发巡检", target: "网络连通性巡检", result: "成功", ip: "—" },
  { id: "l3", time: "2025-04-22 09:50", user: "李管理", action: "登录", target: "平台门户", result: "成功", ip: "10.10.1.5" },
  { id: "l4", time: "2025-04-22 09:12", user: "张运维", action: "更新知识条目", target: "服务重启前后确认事项 FAQ", result: "成功", ip: "10.10.1.22" },
  { id: "l5", time: "2025-04-22 08:00", user: "系统", action: "触发巡检", target: "全量主机日常巡检", result: "成功", ip: "—" },
  { id: "l6", time: "2025-04-21 17:45", user: "赵DBA", action: "查看报告", target: "业务系统运维周报", result: "成功", ip: "10.10.1.40" },
  { id: "l7", time: "2025-04-21 14:02", user: "外部账号", action: "登录", target: "平台门户", result: "失败", ip: "10.10.9.99" },
];

// 趋势数据
export const cpuTrend = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  "app-svc-01": 30 + Math.round(Math.sin(i / 3) * 15 + (i > 8 && i < 12 ? 50 : 10) + Math.random() * 8),
  "app-web-01": 25 + Math.round(Math.sin(i / 4) * 10 + Math.random() * 10),
  "db-master-01": 40 + Math.round(Math.cos(i / 5) * 12 + Math.random() * 8),
}));

export const memoryTrend = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  used: 55 + Math.round(Math.sin(i / 4) * 12 + Math.random() * 6),
}));

export const inspectionDistribution = [
  { name: "正常", value: 23, color: "hsl(var(--success))" },
  { name: "关注", value: 7, color: "hsl(var(--warning))" },
  { name: "异常", value: 3, color: "hsl(var(--destructive))" },
];

export const weeklyAlertTrend = [
  { day: "周一", 严重: 1, 警告: 3, 提示: 5 },
  { day: "周二", 严重: 0, 警告: 2, 提示: 4 },
  { day: "周三", 严重: 2, 警告: 4, 提示: 6 },
  { day: "周四", 严重: 1, 警告: 1, 提示: 3 },
  { day: "周五", 严重: 0, 警告: 2, 提示: 4 },
  { day: "周六", 严重: 0, 警告: 1, 提示: 2 },
  { day: "周日", 严重: 1, 警告: 2, 提示: 3 },
];
