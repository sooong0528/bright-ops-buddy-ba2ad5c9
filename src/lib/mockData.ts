// Mock 数据 —— 智能运维平台演示
export type HostStatus = "正常" | "异常" | "关注";
export type Severity = "严重" | "警告" | "提示";
export type AbnormalLevel = "异常" | "关注";
export type AssetType = "主机" | "数据库" | "应用服务" | "中间件";
export type Environment = "生产" | "预生产" | "测试";
export type Importance = "核心" | "重要" | "一般";

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

export type SchemeScopeType = "全部" | "指定业务系统" | "指定资产";

export interface CheckItemConfig {
  key: string;
  name: string;
  enabled: boolean;
  warn: string;   // 关注条件
  crit: string;   // 异常条件
  window: string; // 判定窗口
  optional?: boolean;
}

export interface InspectionTask {
  id: string;
  name: string;
  type: "日常巡检" | "周巡检" | "手动巡检";
  schedule: string;
  lastRun: string;
  status: "已完成" | "运行中" | "失败" | "待运行";
  normal: number;
  attention: number;
  abnormal: number;
  description?: string;
  /** 资源 → 该资源上要巡检的指标（兼容字段，由 assetIds + checkItems 派生） */
  assetSelections: { assetId: string; metrics: string[] }[];
  /** 兼容旧字段：资源名称的扁平列表 */
  targets: string[];
  /** 兼容旧字段：所有指标的扁平去重列表 */
  metrics: string[];
  enabled: boolean;
  owner: string;
  createdAt: string;

  /* ===== 巡检方案新字段（MVP） ===== */
  appliesTo?: AssetType;
  scopeType?: SchemeScopeType;
  businessSystems?: string[];
  environments?: Environment[];
  assetIds?: string[];
  checkItems?: CheckItemConfig[];
  scheduleMode?: "定时" | "手动";
  frequency?: string;
  runAt?: string;
  notifyMode?: "不通知" | "通知资产负责人";
  notifyChannels?: string[];
  generateReport?: boolean;
  lastResult?: "正常" | "关注" | "异常" | "—";
}

/** 各资产类型默认推荐巡检项 */
export const defaultCheckItemsByAssetType: Record<AssetType, CheckItemConfig[]> = {
  主机: [
    { key: "cpu", name: "CPU 利用率", enabled: true, warn: "≥75%", crit: "≥90%", window: "10 分钟平均值" },
    { key: "mem", name: "内存使用率", enabled: true, warn: "≥75%", crit: "≥90%", window: "10 分钟平均值" },
    { key: "disk", name: "磁盘使用率", enabled: true, warn: "≥75%", crit: "≥90%", window: "30 分钟最大值" },
    { key: "ping", name: "Ping 连通性", enabled: true, warn: "1 次失败", crit: "连续 3 次失败", window: "最近 3 次" },
  ],
  应用服务: [
    { key: "port", name: "端口存活", enabled: true, warn: "1 次失败", crit: "连续 3 次失败", window: "最近 3 次" },
    { key: "http_status", name: "HTTP 状态码", enabled: true, warn: "非 200", crit: "连续 3 次非 200", window: "最近 3 次" },
    { key: "http_rt", name: "HTTP 响应时间", enabled: true, warn: "≥1000ms", crit: "≥3000ms", window: "5 分钟平均值" },
    { key: "app_err_log", name: "应用错误日志数", enabled: true, warn: "≥10 条", crit: "≥50 条", window: "10 分钟" },
    { key: "access_5xx", name: "访问日志 5xx 数", enabled: true, warn: "≥10 条", crit: "≥50 条", window: "10 分钟" },
  ],
  数据库: [
    { key: "db_avail", name: "数据库可用性", enabled: true, warn: "-", crit: "不可用", window: "当前状态" },
    { key: "port", name: "端口存活", enabled: true, warn: "1 次失败", crit: "连续 3 次失败", window: "最近 3 次" },
    { key: "conn", name: "连接数使用率", enabled: true, warn: "≥70%", crit: "≥90%", window: "5 分钟平均值" },
    { key: "slow_sql", name: "慢查询数", enabled: true, warn: "≥10 次", crit: "≥50 次", window: "10 分钟" },
    { key: "data_disk", name: "数据盘使用率", enabled: true, warn: "≥75%", crit: "≥90%", window: "30 分钟最大值" },
    { key: "repl_lag", name: "主从延迟", enabled: false, warn: "≥30s", crit: "≥120s", window: "5 分钟平均值", optional: true },
  ],
  中间件: [
    { key: "port", name: "端口存活", enabled: true, warn: "1 次失败", crit: "连续 3 次失败", window: "最近 3 次" },
    { key: "proc", name: "进程存活", enabled: true, warn: "-", crit: "进程不存在", window: "当前状态" },
    { key: "conn", name: "连接数", enabled: true, warn: "≥70%", crit: "≥90%", window: "5 分钟平均值" },
    { key: "mem", name: "内存使用率", enabled: true, warn: "≥75%", crit: "≥90%", window: "10 分钟平均值" },
    { key: "queue_lag", name: "消息堆积 / 延迟", enabled: false, warn: "≥1000", crit: "≥5000", window: "10 分钟", optional: true },
    { key: "err_log", name: "错误日志数", enabled: true, warn: "≥10 条", crit: "≥50 条", window: "10 分钟" },
  ],
};

export interface InspectionRun {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  duration: string;
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

/* ========== 资产 & 观测配置 ========== */
export interface Asset {
  id: string;
  code: string;              // 资产编码
  name: string;
  type: AssetType;
  businessSystem: string;    // 业务系统
  ip: string;
  port?: string;
  hostname?: string;
  environment: Environment;
  importance: Importance;
  status: "在用" | "停用";
  owner: string;             // 运维责任人
  description?: string;
  // 类型专有字段（简化，按类型选择性使用）
  os?: string;
  location?: string;
  spec?: string;
  dbType?: string;
  dbInstance?: string;
  dbSchema?: string;
  dbRole?: string;
  serviceType?: string;
  serviceCode?: string;
  serviceUrl?: string;
  mwType?: string;
  mwVersion?: string;
  observationStatus: "已配置" | "部分配置" | "未配置";
}

export interface ObservationConfig {
  assetId: string;
  zabbixHost: string;                                    // 已映射的 Zabbix Host
  items: { key: string; name: string; warn: number; crit: number; window: string }[]; // 指标 & 阈值
  logSources: {
    source: string;   // ES 索引 / Beat 名
    path: string;     // 日志路径
    logType: string;
    window: string;
    keywords: string[];
  }[];
}

/* ========== 异常/关注记录 & 故障分析 ========== */
export type RecordHandleStatus = "待处理" | "已恢复" | "已忽略";
export type RecordAnalysisStatus = "未分析" | "分析中" | "已分析" | "分析失败";

export interface AbnormalRecord {
  id: string;
  taskId: string;              // 来源巡检任务
  runId: string;               // 来源巡检执行
  sourceRunLabel?: string;     // 来源巡检显示名（方案 · 执行编号）
  assetId: string;
  assetName: string;
  assetType: AssetType;
  businessSystem: string;
  metric: string;
  level: AbnormalLevel;
  value: string;
  /** @deprecated 使用 triggerRule */
  threshold: string;
  /** 触发规则（可为阈值 / 连续失败 / 环比等） */
  triggerRule: string;
  /** @deprecated 使用 firstSeen / lastSeen */
  time: string;
  firstSeen: string;
  lastSeen: string;
  duration: string;
  occurrences: number;
  description: string;
  evidenceSnapshot: string;    // 证据快照文字
  status: RecordHandleStatus;
  analysisStatus: RecordAnalysisStatus;
  analysisTaskId?: string;
  handleLog?: { time: string; actor: string; action: string; note?: string }[];
}

export type AnalysisTaskStatus = "分析中" | "已分析" | "分析失败";

export interface AnalysisTask {
  id: string;
  recordId: string;
  // 关联异常快照（用于列表展示）
  assetName: string;
  assetType: AssetType;
  businessSystem: string;
  metric: string;
  /** 当前级别：最近一次巡检命中的级别 */
  currentLevel: AbnormalLevel;
  /** 最高级别：本次问题周期内曾达到的最高级别 */
  maxLevel: AbnormalLevel;
  source: "异常记录" | "手动";
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  status: AnalysisTaskStatus;
  /** 分析中进度步骤 */
  progress?: { label: string; done: boolean }[];
  failReason?: string;
  // 分析结果
  metricTrend: {
    metric: string;
    baseline: string;
    observation: string;
    points: { time: string; value: number }[];
  };
  logSnippets: {
    time: string;
    source: string;
    level: string;
    keyword: string;
    text: string;
  }[];
  knowledgeRefs: { id: string; title: string; snippet: string; category: string }[];
  hypotheses: string[];       // 原因假设
  actions: string[];          // 处置建议
  humanConfirm: string[];     // 人工确认事项
  impact: string;
  priority: "高" | "中" | "低";
  evidence: string[];         // 数据来源和证据链
  agentTrace: { agent: string; input: string; output: string; duration: string }[];
}

/* ========== 报告 ========== */
export type ReportCategory = "巡检报告" | "故障分析报告" | "知识服务情况分析报告";
export type ReportFrequency = "日报" | "周报" | "月报";

export interface ReportItem {
  id: string;
  title: string;
  category: ReportCategory;
  frequency: ReportFrequency;
  period: string;
  generatedAt: string;
  author: "系统自动" | string;
  summary: string;
  status: "已归档" | "草稿";
  quality?: {
    completionRate: number;
    coverageRate: number;
    totalTasks: number;
    finishedTasks: number;
    totalHosts: number;
    coveredHosts: number;
    abnormal: number;
    attention: number;
    normal: number;
    failedRuns: number;
  };
  // 故障分析报告
  analysis?: {
    recordId: string;
    asset: string;
    severity: Severity;
    metricTrendSummary: string;
    logHits: { time: string; source: string; text: string }[];
    knowledgeRefs: { title: string; snippet: string }[];
    hypotheses: string[];
    actions: string[];
    humanConfirm: string[];
    evidence: string[];
    priority: "高" | "中" | "低";
  };
  knowledge?: {
    totalQA: number;
    citedKnowledge: number;
    citationRate: number;
    newDocs: number;
    updatedDocs: number;
    topQuestions: { q: string; count: number }[];
    topDocs: { title: string; cited: number }[];
    coverageGaps: string[];
  };
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: "运维手册" | "SOP" | "故障案例" | "FAQ" | "应急预案";
  tags: string[];
  updatedAt: string;
  version: string;
  owner: string;
  status: "已发布" | "草稿" | "已下架";
  excerpt: string;
  citedCount: number;
}

export interface KnowledgeGap {
  id: string;
  question: string;
  category: string;
  hitAttempts: number;
  lastAsked: string;
  suggestion: string;
  status: "待补充" | "已补充" | "忽略";
}

export interface UserItem {
  id: string;
  name: string;
  account: string;
  role: "系统管理员" | "运维人员" | "查看用户";
  department: string;
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
  category?: "用户操作" | "任务执行" | "Agent 调用" | "数据来源";
}

export interface AgentRun {
  id: string;
  agent: string;
  task: string;
  status: "成功" | "失败" | "运行中";
  duration: string;
  startTime: string;
  input: string;
  output: string;
}

/* ========== Hosts / Tasks / Runs / Alerts（保留原样，供巡检模块使用） ========== */
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
  {
    id: "t1", name: "主机基础巡检", type: "日常巡检", schedule: "每日 08:00",
    lastRun: "2025-04-22 08:00", status: "已完成",
    normal: 6, attention: 2, abnormal: 2,
    description: "对全部生产主机执行 CPU / 内存 / 磁盘 / Ping 四项基础指标巡检。",
    appliesTo: "主机", scopeType: "全部",
    businessSystems: [], assetIds: ["as1", "as2", "as3"],
    checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["主机"])),
    scheduleMode: "定时", frequency: "每日 08:00", runAt: "08:00",
    notifyMode: "通知资产负责人", notifyChannels: ["站内消息", "邮件"], generateReport: true,
    lastResult: "异常",
    assetSelections: [
      { assetId: "as1", metrics: ["CPU 利用率", "内存使用率", "磁盘使用率", "Ping 连通性"] },
      { assetId: "as2", metrics: ["CPU 利用率", "内存使用率", "磁盘使用率", "Ping 连通性"] },
      { assetId: "as3", metrics: ["CPU 利用率", "内存使用率", "磁盘使用率", "Ping 连通性"] },
    ],
    targets: ["app-svc-01", "app-web-01", "mq-01"],
    metrics: ["CPU 利用率", "内存使用率", "磁盘使用率", "Ping 连通性"],
    enabled: true, owner: "李管理", createdAt: "2025-01-10",
  },
  {
    id: "t2", name: "数据库专项巡检", type: "日常巡检", schedule: "每日 09:00",
    lastRun: "2025-04-22 09:00", status: "已完成",
    normal: 1, attention: 1, abnormal: 0,
    description: "针对核心交易系统数据库执行连接数、慢查询、可用性等核心指标核查。",
    appliesTo: "数据库", scopeType: "指定业务系统",
    businessSystems: ["核心交易系统"], assetIds: ["as4", "as5"],
    checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["数据库"])),
    scheduleMode: "定时", frequency: "每日 09:00", runAt: "09:00",
    notifyMode: "通知资产负责人", notifyChannels: ["站内消息"], generateReport: true,
    lastResult: "关注",
    assetSelections: [
      { assetId: "as4", metrics: ["数据库可用性", "连接数使用率", "慢查询数", "数据盘使用率"] },
      { assetId: "as5", metrics: ["数据库可用性", "连接数使用率"] },
    ],
    targets: ["db-master-01 (核心库主)", "db-slave-01 (核心库从)"],
    metrics: ["数据库可用性", "连接数使用率", "慢查询数", "数据盘使用率"],
    enabled: true, owner: "张运维", createdAt: "2025-02-03",
  },
  {
    id: "t3", name: "应用服务健康巡检", type: "日常巡检", schedule: "每 30 分钟",
    lastRun: "2025-04-22 10:30", status: "运行中",
    normal: 5, attention: 3, abnormal: 0,
    description: "对全部应用服务巡检端口存活、HTTP 状态码 / 响应时间及应用错误日志。",
    appliesTo: "应用服务", scopeType: "全部",
    businessSystems: [], assetIds: ["as6", "as7"],
    checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["应用服务"])),
    scheduleMode: "定时", frequency: "每 30 分钟", runAt: "*/30 * * * *",
    notifyMode: "通知资产负责人", notifyChannels: ["站内消息", "邮件"], generateReport: false,
    lastResult: "关注",
    assetSelections: [
      { assetId: "as6", metrics: ["端口存活", "HTTP 状态码", "HTTP 响应时间", "应用错误日志数"] },
      { assetId: "as7", metrics: ["端口存活", "HTTP 状态码", "HTTP 响应时间"] },
    ],
    targets: ["订单服务 order-svc", "网关服务 gateway"],
    metrics: ["端口存活", "HTTP 状态码", "HTTP 响应时间", "应用错误日志数"],
    enabled: true, owner: "王巡检", createdAt: "2025-03-01",
  },
  {
    id: "t4", name: "中间件专项巡检", type: "日常巡检", schedule: "每小时",
    lastRun: "2025-04-22 10:00", status: "已完成",
    normal: 1, attention: 0, abnormal: 1,
    description: "对消息与缓存中间件巡检端口 / 进程 / 连接数 / 错误日志。",
    appliesTo: "中间件", scopeType: "指定资产",
    businessSystems: [], assetIds: ["as8", "as9"],
    checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["中间件"])),
    scheduleMode: "定时", frequency: "每小时", runAt: "0 * * * *",
    notifyMode: "通知资产负责人", notifyChannels: ["站内消息"], generateReport: false,
    lastResult: "异常",
    assetSelections: [
      { assetId: "as8", metrics: ["端口存活", "进程存活", "连接数", "错误日志数"] },
      { assetId: "as9", metrics: ["端口存活", "进程存活", "连接数"] },
    ],
    targets: ["RabbitMQ 主集群", "Redis 缓存集群"],
    metrics: ["端口存活", "进程存活", "连接数", "错误日志数"],
    enabled: true, owner: "张运维", createdAt: "2025-03-12",
  },
  {
    id: "t5", name: "手动 — 主机应急核查", type: "手动巡检", schedule: "—",
    lastRun: "2025-04-22 10:12", status: "已完成",
    normal: 4, attention: 1, abnormal: 1,
    description: "应急场景下对指定主机进行 CPU / 内存 / Ping 临时核查。",
    appliesTo: "主机", scopeType: "指定资产",
    businessSystems: [], assetIds: ["as1", "as3"],
    checkItems: (JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["主机"])) as CheckItemConfig[])
      .map((it) => ({ ...it, enabled: ["cpu", "mem", "ping"].includes(it.key) })),
    scheduleMode: "手动", frequency: "手动触发",
    notifyMode: "不通知", notifyChannels: [], generateReport: false,
    lastResult: "异常",
    assetSelections: [
      { assetId: "as1", metrics: ["CPU 利用率", "内存使用率", "Ping 连通性"] },
      { assetId: "as3", metrics: ["CPU 利用率", "内存使用率", "Ping 连通性"] },
    ],
    targets: ["app-svc-01", "mq-01"],
    metrics: ["CPU 利用率", "内存使用率", "Ping 连通性"],
    enabled: true, owner: "张运维", createdAt: "2025-04-22",
  },
];


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
  { id: "a1", host: "app-svc-01", metric: "CPU 使用率", severity: "严重", value: "92%", threshold: ">85% 持续 10 分钟", time: "2025-04-22 09:42", description: "应用服务节点 CPU 持续高位，可能存在请求堆积或慢任务。", suggestion: "1) 查看应用线程数与 GC 情况；2) 比对昨日同时段流量；3) 必要时联系开发确认。" },
  { id: "a2", host: "mq-01", metric: "Ping/ICMP", severity: "严重", value: "超时", threshold: "连续 3 次失败", time: "2025-04-22 10:18", description: "消息中间件主机 ICMP 探测失败，疑似网络中断或主机宕机。", suggestion: "1) 通过跳板机尝试登录；2) 联系网络确认链路；3) 评估业务影响并启用备用链路。" },
  { id: "a3", host: "db-master-01", metric: "内存使用率", severity: "警告", value: "82%", threshold: ">80% 持续 30 分钟", time: "2025-04-22 08:55", description: "数据库内存使用率上升，关注是否存在长事务或缓存膨胀。", suggestion: "1) 查看 InnoDB Buffer Pool；2) 排查长事务；3) 留意慢查询。" },
  { id: "a4", host: "app-web-02", metric: "CPU 使用率", severity: "提示", value: "71%", threshold: ">70%", time: "2025-04-22 10:02", description: "Web 节点 CPU 上升至关注阈值，暂未达告警线。", suggestion: "持续观察，比对负载均衡分配是否均匀。" },
];

/* ========== 资产 ========== */
export const assets: Asset[] = [
  { id: "as1", code: "HOST-0001", name: "app-svc-01", type: "主机", businessSystem: "核心交易系统", ip: "10.20.2.21", port: "22/8080", hostname: "app-svc-01.corp", environment: "生产", importance: "核心", status: "在用", owner: "张运维", os: "CentOS 7.9", location: "北京-A 机房 3-05", spec: "8C16G / 500G SSD", observationStatus: "已配置" },
  { id: "as2", code: "HOST-0002", name: "app-web-01", type: "主机", businessSystem: "核心交易系统", ip: "10.20.1.11", port: "22/80", hostname: "app-web-01.corp", environment: "生产", importance: "重要", status: "在用", owner: "王巡检", os: "CentOS 7.9", location: "北京-A 机房 3-01", spec: "4C8G / 200G", observationStatus: "已配置" },
  { id: "as3", code: "HOST-0003", name: "mq-01", type: "主机", businessSystem: "消息平台", ip: "10.20.5.51", port: "22", hostname: "mq-01.corp", environment: "生产", importance: "核心", status: "在用", owner: "张运维", os: "Ubuntu 22.04", location: "北京-B 机房 2-08", spec: "8C32G / 1T", observationStatus: "部分配置" },
  { id: "as4", code: "DB-0001", name: "db-master-01 (核心库主)", type: "数据库", businessSystem: "核心交易系统", ip: "10.20.3.31", port: "3306", environment: "生产", importance: "核心", status: "在用", owner: "李管理", dbType: "MySQL 8.0", dbInstance: "core-master", dbSchema: "trade_core", dbRole: "主库", observationStatus: "已配置" },
  { id: "as5", code: "DB-0002", name: "db-slave-01 (核心库从)", type: "数据库", businessSystem: "核心交易系统", ip: "10.20.3.32", port: "3306", environment: "生产", importance: "重要", status: "在用", owner: "李管理", dbType: "MySQL 8.0", dbInstance: "core-slave", dbSchema: "trade_core", dbRole: "从库", observationStatus: "已配置" },
  { id: "as6", code: "APP-0001", name: "订单服务 order-svc", type: "应用服务", businessSystem: "核心交易系统", ip: "10.20.2.21", port: "8080", environment: "生产", importance: "核心", status: "在用", owner: "张运维", serviceType: "SpringBoot", serviceCode: "order-svc", serviceUrl: "http://order.corp/api", observationStatus: "已配置" },
  { id: "as7", code: "APP-0002", name: "网关服务 gateway", type: "应用服务", businessSystem: "核心交易系统", ip: "10.20.1.11", port: "80", environment: "生产", importance: "核心", status: "在用", owner: "王巡检", serviceType: "Nginx", serviceCode: "gateway", serviceUrl: "http://api.corp", observationStatus: "已配置" },
  { id: "as8", code: "MW-0001", name: "RabbitMQ 主集群", type: "中间件", businessSystem: "消息平台", ip: "10.20.5.51", port: "5672", environment: "生产", importance: "核心", status: "在用", owner: "张运维", mwType: "RabbitMQ", mwVersion: "3.12", observationStatus: "部分配置" },
  { id: "as9", code: "MW-0002", name: "Redis 缓存集群", type: "中间件", businessSystem: "核心交易系统", ip: "10.20.4.41", port: "6379", environment: "生产", importance: "重要", status: "在用", owner: "王巡检", mwType: "Redis", mwVersion: "7.0", observationStatus: "未配置" },
];

export const observationConfigs: Record<string, ObservationConfig> = {
  as1: {
    assetId: "as1",
    zabbixHost: "app-svc-01",
    items: [
      { key: "system.cpu.util", name: "CPU 利用率", warn: 75, crit: 90, window: "10 分钟" },
      { key: "vm.memory.utilization", name: "内存使用率", warn: 75, crit: 90, window: "10 分钟" },
      { key: "vfs.fs.pused", name: "磁盘使用率", warn: 75, crit: 90, window: "30 分钟" },
      { key: "icmpping", name: "Ping 连通性", warn: 100, crit: 0, window: "3 次" },
    ],
    logSources: [
      { source: "es-app-log", path: "/var/log/order-svc/app.log", logType: "应用日志", window: "10 分钟", keywords: ["error", "timeout", "exception"] },
    ],
  },
  as4: {
    assetId: "as4",
    zabbixHost: "db-master-01",
    items: [
      { key: "mysql.status[Threads_connected]", name: "连接数", warn: 200, crit: 400, window: "5 分钟" },
      { key: "vm.memory.utilization", name: "内存使用率", warn: 75, crit: 90, window: "30 分钟" },
      { key: "mysql.slow_queries", name: "慢查询数", warn: 20, crit: 50, window: "10 分钟" },
    ],
    logSources: [
      { source: "es-mysql-log", path: "/var/log/mysql/error.log", logType: "数据库日志", window: "15 分钟", keywords: ["ERROR", "deadlock", "Lock wait timeout"] },
    ],
  },
  as3: {
    assetId: "as3",
    zabbixHost: "mq-01",
    items: [
      { key: "icmpping", name: "Ping 连通性", warn: 100, crit: 0, window: "3 次" },
      { key: "system.cpu.util", name: "CPU 利用率", warn: 75, crit: 90, window: "10 分钟" },
    ],
    logSources: [
      { source: "es-mq-log", path: "/var/log/rabbitmq/rabbit@mq-01.log", logType: "中间件日志", window: "15 分钟", keywords: ["error", "disconnect", "unreachable"] },
    ],
  },
};

/* ========== 异常/关注记录 ========== */
export const abnormalRecords: AbnormalRecord[] = [
  {
    id: "abn-001", taskId: "t1", runId: "run-1024", sourceRunLabel: "主机基础巡检 · #1024",
    assetId: "as1", assetName: "app-svc-01", assetType: "主机", businessSystem: "核心交易系统",
    metric: "CPU 使用率", level: "异常", value: "92%",
    threshold: ">90% 持续 10 分钟", triggerRule: ">90% 持续 10 分钟",
    time: "2025-04-22 09:42",
    firstSeen: "2025-04-22 09:12", lastSeen: "2025-04-22 09:42", duration: "30 分钟", occurrences: 5,
    description: "应用服务节点 CPU 持续 92%，接近处理上限，可能出现请求堆积。",
    evidenceSnapshot: "过去 30 分钟内 CPU 5 次突破 90% 阈值，采样值：91/92/93/92/94。",
    status: "待处理", analysisStatus: "分析中", analysisTaskId: "an-001",
    handleLog: [
      { time: "2025-04-22 09:45", actor: "张运维", action: "认领处理" },
      { time: "2025-04-22 09:50", actor: "张运维", action: "发起故障分析", note: "关联 an-001" },
    ],
  },
  {
    id: "abn-002", taskId: "t4", runId: "run-4098", sourceRunLabel: "MQ 周巡检 · #4098",
    assetId: "as3", assetName: "mq-01", assetType: "中间件", businessSystem: "核心交易系统",
    metric: "Ping/ICMP", level: "异常", value: "超时",
    threshold: "连续 3 次失败", triggerRule: "连续 3 次 ICMP 探测失败",
    time: "2025-04-22 10:18",
    firstSeen: "2025-04-22 10:15", lastSeen: "2025-04-22 10:18", duration: "3 分钟", occurrences: 3,
    description: "MQ 主机 ICMP 连续 3 次探测失败，疑似链路或主机异常。",
    evidenceSnapshot: "10:15/10:16/10:17 ICMP 请求均超时；同网段其他主机可达。",
    status: "待处理", analysisStatus: "未分析",
  },
  {
    id: "abn-003", taskId: "t2", runId: "run-2008", sourceRunLabel: "数据库日常巡检 · #2008",
    assetId: "as4", assetName: "db-master-01", assetType: "数据库", businessSystem: "核心交易系统",
    metric: "内存使用率", level: "关注", value: "82%",
    threshold: "75% ~ 90%", triggerRule: "10 分钟平均值 ≥75%",
    time: "2025-04-22 09:03",
    firstSeen: "2025-04-22 03:12", lastSeen: "2025-04-22 09:03", duration: "5 小时 51 分钟", occurrences: 12,
    description: "数据库内存使用率升至 82%，接近关注阈值上限。",
    evidenceSnapshot: "近 6 小时内存呈缓慢上升趋势：72% → 82%。",
    status: "待处理", analysisStatus: "已分析", analysisTaskId: "an-003",
  },
  {
    id: "abn-004", taskId: "t1", runId: "run-1024", sourceRunLabel: "主机基础巡检 · #1024",
    assetId: "as2", assetName: "app-web-02", assetType: "主机", businessSystem: "官网门户",
    metric: "CPU 使用率", level: "关注", value: "71%",
    threshold: "70% ~ 85%", triggerRule: "10 分钟平均值 ≥70%",
    time: "2025-04-22 10:02",
    firstSeen: "2025-04-22 10:02", lastSeen: "2025-04-22 10:02", duration: "刚刚", occurrences: 1,
    description: "Web 节点 CPU 上升至关注阈值。",
    evidenceSnapshot: "10:00 起 CPU 由 45% 升至 71%，与流量增长基本吻合。",
    status: "待处理", analysisStatus: "未分析",
  },
  {
    id: "abn-005", taskId: "t3", runId: "run-3005", sourceRunLabel: "从库周巡检 · #3005",
    assetId: "as5", assetName: "db-slave-01", assetType: "数据库", businessSystem: "核心交易系统",
    metric: "磁盘使用率", level: "关注", value: "68%",
    threshold: "周环比 >+5%", triggerRule: "周环比 >+5%",
    time: "2025-04-21 07:32",
    firstSeen: "2025-04-14 07:30", lastSeen: "2025-04-21 07:32", duration: "7 天", occurrences: 7,
    description: "从库磁盘一周内增长 6%，需关注 binlog 保留策略。",
    evidenceSnapshot: "一周磁盘使用率：62% → 68%。",
    status: "已恢复", analysisStatus: "已分析", analysisTaskId: "an-005",
    handleLog: [
      { time: "2025-04-21 09:00", actor: "李管理", action: "标记已恢复", note: "已清理过期 binlog" },
    ],
  },
  {
    id: "abn-006", taskId: "t4", runId: "run-4099", sourceRunLabel: "中间件专项巡检 · #4099",
    assetId: "as8", assetName: "rabbitmq-cluster", assetType: "中间件", businessSystem: "核心交易系统",
    metric: "消息堆积", level: "异常", value: "6800",
    threshold: "≥5000", triggerRule: "10 分钟内消息堆积 ≥5000",
    time: "2025-04-22 08:20",
    firstSeen: "2025-04-22 08:00", lastSeen: "2025-04-22 08:20", duration: "20 分钟", occurrences: 2,
    description: "订单队列堆积超过 5000，消费端处理速度不足。",
    evidenceSnapshot: "队列 order.q 堆积由 1200 上涨至 6800。",
    status: "待处理", analysisStatus: "分析失败", analysisTaskId: "an-006",
  },
];

/* ========== 故障分析任务 ========== */
export const analysisTasks: AnalysisTask[] = [
  {
    id: "an-001", recordId: "abn-001",
    assetName: "app-svc-01", assetType: "主机", businessSystem: "核心交易系统",
    metric: "CPU 使用率", currentLevel: "异常", maxLevel: "异常",
    source: "异常记录",
    createdBy: "张运维", createdAt: "2025-04-22 09:50",
    completedAt: undefined,
    status: "分析中",
    progress: [
      { label: "已读取巡检指标", done: true },
      { label: "已获取相关日志", done: true },
      { label: "已检索知识库", done: true },
      { label: "正在生成原因分析和处理建议", done: false },
    ],
    metricTrend: {
      metric: "CPU 使用率 (app-svc-01)",
      baseline: "过去 7 天同时段均值 45%",
      observation: "本次异常前 30 分钟 CPU 从 55% 上升至 92%，与请求量增长呈正相关。",
      points: Array.from({ length: 24 }, (_, i) => ({
        time: `${String(9 + Math.floor(i / 6)).padStart(2, "0")}:${String((i % 6) * 10).padStart(2, "0")}`,
        value: 45 + Math.min(50, i * 2 + Math.round(Math.random() * 6)),
      })),
    },
    logSnippets: [
      { time: "09:38:12", source: "order-svc/app.log", level: "ERROR", keyword: "timeout", text: "HttpClient timeout after 5000ms when calling inventory-svc" },
      { time: "09:39:01", source: "order-svc/app.log", level: "WARN", keyword: "slow", text: "Slow SQL detected: SELECT * FROM orders WHERE ... executed 3.4s" },
      { time: "09:41:44", source: "order-svc/app.log", level: "ERROR", keyword: "exception", text: "java.util.concurrent.RejectedExecutionException: Task rejected from thread pool" },
    ],
    knowledgeRefs: [
      { id: "k1", title: "Linux 主机 CPU 高负载排查 SOP", snippet: "通过 top / pidstat 定位高 CPU 进程，再结合线程栈判断是否为业务代码热点。", category: "SOP" },
      { id: "k3", title: "订单服务历史 CPU 打满案例 (2024-11)", snippet: "上次问题根因为下游库存服务响应慢导致线程池耗尽。", category: "故障案例" },
    ],
    hypotheses: [
      "下游 inventory-svc 响应延迟上升，导致订单服务线程池耗尽",
      "存在慢 SQL（>3s）拖慢事务处理",
      "10:00 起流量增长 20% 触及资源上限",
    ],
    actions: [
      "登录 app-svc-01 执行 top / jstack 采集线程栈",
      "确认 inventory-svc 当前健康状态与响应耗时",
      "联系 DBA 排查 SlowLog 中出现的慢查询",
      "评估临时扩容或限流方案（非本系统执行）",
    ],
    humanConfirm: [
      "请值班运维登录主机核实实际线程池水位",
      "请联系应用负责人评估是否触发限流预案",
    ],
    impact: "订单下单接口可能出现响应超时，影响核心交易链路。",
    priority: "高",
    evidence: [
      "Zabbix 指标：system.cpu.util 09:12-09:42 采样 12 次",
      "ES 日志：order-svc/app.log 09:30-09:45 共命中 17 条",
      "知识库引用：Linux CPU 排查 SOP v1.3、订单服务历史案例",
    ],
    agentTrace: [
      { agent: "指挥调度 Agent", input: "abn-001 手动发起", output: "分派巡检回溯 + 日志 + 知识匹配", duration: "120ms" },
      { agent: "数据查询 Agent", input: "app-svc-01 CPU 30min", output: "24 点采样", duration: "480ms" },
      { agent: "日志辅助 Agent", input: "关键字 error/timeout/exception 15min", output: "3 条命中", duration: "780ms" },
      { agent: "知识问答 Agent", input: "CPU 高负载 + 订单服务", output: "2 条知识引用", duration: "620ms" },
      { agent: "故障分析 Agent", input: "综合上述", output: "3 假设 + 4 建议", duration: "1.4s" },
    ],
  },
  {
    id: "an-003", recordId: "abn-003",
    assetName: "db-master-01", assetType: "数据库", businessSystem: "核心交易系统",
    metric: "内存使用率", currentLevel: "关注", maxLevel: "异常",
    source: "异常记录",
    createdBy: "李管理", createdAt: "2025-04-22 09:20", completedAt: "2025-04-22 09:26",
    status: "已分析",
    metricTrend: {
      metric: "内存使用率 (db-master-01)",
      baseline: "过去 7 天均值 68%",
      observation: "6 小时内内存由 72% 缓升至 82%，尚未触发告警。",
      points: Array.from({ length: 24 }, (_, i) => ({
        time: `${String(3 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
        value: 70 + Math.round(i * 0.5 + Math.random() * 3),
      })),
    },
    logSnippets: [
      { time: "08:41", source: "mysql/error.log", level: "WARN", keyword: "Lock wait timeout", text: "InnoDB: Lock wait timeout exceeded; try restarting transaction" },
    ],
    knowledgeRefs: [
      { id: "k2", title: "MySQL 内存使用率升高处理手册", snippet: "重点检查 Buffer Pool、连接数、长事务。", category: "运维手册" },
    ],
    hypotheses: [
      "可能存在长事务导致 undo 段膨胀",
      "InnoDB Buffer Pool 命中率下降触发额外内存分配",
    ],
    actions: [
      "查询 information_schema.INNODB_TRX 检查长事务",
      "观察 Buffer Pool 命中率与脏页比例",
    ],
    humanConfirm: ["请 DBA 确认是否需要 kill 长事务"],
    impact: "若持续增长可能触发 OOM，影响交易写入。",
    priority: "中",
    evidence: [
      "Zabbix：内存 6 小时采样 24 点",
      "ES：mysql/error.log 命中 1 条 Lock wait",
    ],
    agentTrace: [
      { agent: "指挥调度 Agent", input: "abn-003 手动发起", output: "分派", duration: "110ms" },
      { agent: "数据查询 Agent", input: "内存 6h", output: "24 点", duration: "520ms" },
      { agent: "日志辅助 Agent", input: "Lock wait / ERROR", output: "1 条", duration: "610ms" },
    ],
  },
  {
    id: "an-005", recordId: "abn-005",
    assetName: "db-slave-01", assetType: "数据库", businessSystem: "核心交易系统",
    metric: "磁盘使用率", currentLevel: "关注", maxLevel: "关注",
    source: "异常记录",
    createdBy: "李管理", createdAt: "2025-04-21 08:00", completedAt: "2025-04-21 08:05",
    status: "已分析",
    metricTrend: {
      metric: "磁盘使用率 (db-slave-01)",
      baseline: "上周均值 62%",
      observation: "一周内磁盘由 62% 上升至 68%，主要为 binlog 增长。",
      points: Array.from({ length: 7 }, (_, i) => ({ time: `D${i + 1}`, value: 62 + i })),
    },
    logSnippets: [],
    knowledgeRefs: [
      { id: "k4", title: "MySQL binlog 保留策略调整", snippet: "根据备份窗口调整 expire_logs_days。", category: "运维手册" },
    ],
    hypotheses: ["binlog 保留天数过长"],
    actions: ["缩短 expire_logs_days 至 7 天并清理过期 binlog"],
    humanConfirm: [],
    impact: "磁盘继续增长可能影响从库写入。",
    priority: "低",
    evidence: ["Zabbix：磁盘 7 天采样"],
    agentTrace: [
      { agent: "数据查询 Agent", input: "磁盘 7d", output: "7 点", duration: "300ms" },
    ],
  },
  {
    id: "an-006", recordId: "abn-006",
    assetName: "rabbitmq-cluster", assetType: "中间件", businessSystem: "核心交易系统",
    metric: "消息堆积", currentLevel: "异常", maxLevel: "异常",
    source: "异常记录",
    createdBy: "王巡检", createdAt: "2025-04-22 08:25", completedAt: "2025-04-22 08:27",
    status: "分析失败",
    failReason: "调用 Zabbix 数据接口超时，未能获取指标趋势数据。",
    metricTrend: {
      metric: "消息堆积 (order.q)",
      baseline: "均值 1200",
      observation: "—",
      points: [],
    },
    logSnippets: [],
    knowledgeRefs: [],
    hypotheses: [],
    actions: [],
    humanConfirm: [],
    impact: "—",
    priority: "高",
    evidence: [],
    agentTrace: [
      { agent: "数据查询 Agent", input: "消息堆积 30min", output: "调用超时", duration: "5.0s" },
    ],
  },
];

/* ========== 报告 ========== */
export const reports: ReportItem[] = [
  {
    id: "r1",
    title: "业务系统巡检日报",
    category: "巡检报告",
    frequency: "日报",
    period: "2025-04-21",
    generatedAt: "2025-04-22 08:15",
    author: "系统自动",
    summary: "全量 8 台主机完成巡检，覆盖率 100%，2 项异常 2 项关注，主要集中在 app-svc-01 与 mq-01。",
    status: "已归档",
    quality: {
      completionRate: 98.5, coverageRate: 100, totalTasks: 5, finishedTasks: 5,
      totalHosts: 8, coveredHosts: 8, abnormal: 2, attention: 2, normal: 4, failedRuns: 0,
    },
  },
  {
    id: "r2",
    title: "业务系统巡检周报",
    category: "巡检报告",
    frequency: "周报",
    period: "2025-04-14 ~ 04-20",
    generatedAt: "2025-04-21 09:00",
    author: "系统自动",
    summary: "本周共执行巡检任务 35 次，完成率 97.1%，覆盖全部 8 台主机，识别异常 5 项、关注 9 项。",
    status: "已归档",
    quality: {
      completionRate: 97.1, coverageRate: 100, totalTasks: 35, finishedTasks: 34,
      totalHosts: 8, coveredHosts: 8, abnormal: 5, attention: 9, normal: 21, failedRuns: 1,
    },
  },
  {
    id: "r3",
    title: "app-svc-01 CPU 持续高位 故障分析报告",
    category: "故障分析报告",
    frequency: "日报",
    period: "2025-04-22",
    generatedAt: "2025-04-22 10:05",
    author: "系统自动",
    summary: "针对 abn-001 异常记录形成故障分析报告，综合指标趋势、应用日志与知识库引用，形成 3 项原因假设与 4 项处置建议。",
    status: "已归档",
    analysis: {
      recordId: "abn-001",
      asset: "app-svc-01 (核心交易 · 订单服务)",
      severity: "严重",
      metricTrendSummary: "过去 30 分钟 CPU 由 55% 升至 92%，与请求量增长呈正相关；对比 7 天基线偏离 +47%。",
      logHits: [
        { time: "09:38", source: "order-svc/app.log", text: "HttpClient timeout when calling inventory-svc" },
        { time: "09:41", source: "order-svc/app.log", text: "Task rejected from thread pool" },
      ],
      knowledgeRefs: [
        { title: "Linux 主机 CPU 高负载排查 SOP v1.3", snippet: "top / pidstat 定位高 CPU 进程，再结合线程栈判断热点。" },
        { title: "订单服务历史 CPU 打满案例 (2024-11)", snippet: "上次根因为下游库存服务响应慢导致线程池耗尽。" },
      ],
      hypotheses: [
        "下游 inventory-svc 响应变慢导致订单服务线程池耗尽",
        "SlowLog 中存在慢查询拖慢事务",
        "10:00 起流量增长 20% 触及资源上限",
      ],
      actions: [
        "登录 app-svc-01 执行 top / jstack 采集线程栈",
        "确认 inventory-svc 当前健康状态与响应耗时",
        "联系 DBA 排查慢查询",
        "评估临时扩容或限流方案",
      ],
      humanConfirm: [
        "请值班运维登录主机核实线程池水位",
        "请联系应用负责人评估是否触发限流预案",
      ],
      evidence: [
        "Zabbix: system.cpu.util 12 点采样",
        "ES: order-svc/app.log 17 条命中",
        "Knowledge: SOP v1.3 / 2024-11 案例",
      ],
      priority: "高",
    },
  },
  {
    id: "r4",
    title: "知识服务月度报告",
    category: "知识服务情况分析报告",
    frequency: "月报",
    period: "2025-04",
    generatedAt: "2025-04-22 09:00",
    author: "系统自动",
    summary: "本月共承接问答 326 次，命中知识库 287 次，命中率 88%；新增 4 篇 SOP、更新 6 篇文档；识别 3 个知识盲区。",
    status: "已归档",
    knowledge: {
      totalQA: 326, citedKnowledge: 287, citationRate: 88, newDocs: 4, updatedDocs: 6,
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

/* ========== 知识库 & 盲区 ========== */
export const knowledge: KnowledgeItem[] = [
  { id: "k1", title: "Linux 主机 CPU 高负载排查 SOP", category: "SOP", tags: ["CPU", "Linux", "性能"], updatedAt: "2025-04-18", version: "v1.3", owner: "运维组", status: "已发布", excerpt: "覆盖 top / pidstat / perf 等基础排查步骤与常见根因。", citedCount: 56 },
  { id: "k2", title: "MySQL 内存使用率升高处理手册", category: "运维手册", tags: ["MySQL", "内存", "数据库"], updatedAt: "2025-04-12", version: "v2.0", owner: "DBA", status: "已发布", excerpt: "包含 Buffer Pool、连接数、长事务等检查项及处理建议。", citedCount: 41 },
  { id: "k3", title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例", tags: ["MQ", "宕机", "网络"], updatedAt: "2025-03-30", version: "v1.0", owner: "运维组", status: "已发布", excerpt: "完整记录 2024-11 一次 MQ 宕机的发现、定位、恢复全过程。", citedCount: 33 },
  { id: "k4", title: "服务重启前后确认事项 FAQ", category: "FAQ", tags: ["服务", "重启", "操作"], updatedAt: "2025-04-20", version: "v1.1", owner: "运维组", status: "已发布", excerpt: "重启前后必须确认的 8 项内容及回滚预案。", citedCount: 28 },
  { id: "k5", title: "Zabbix 基础指标含义说明", category: "运维手册", tags: ["Zabbix", "指标", "监控"], updatedAt: "2025-04-05", version: "v1.0", owner: "监控组", status: "已发布", excerpt: "对接入的 CPU/内存/磁盘/Ping 指标进行业务化解释。", citedCount: 12 },
  { id: "k6", title: "磁盘水位告警处理建议（草稿）", category: "SOP", tags: ["磁盘", "容量"], updatedAt: "2025-04-21", version: "v0.1", owner: "运维组", status: "草稿", excerpt: "针对磁盘 80% / 90% 不同水位的标准化处理流程。", citedCount: 0 },
  { id: "k7", title: "核心交易系统应急预案", category: "应急预案", tags: ["应急", "核心交易"], updatedAt: "2025-04-10", version: "v2.1", owner: "运维组", status: "已发布", excerpt: "核心交易系统在关键组件失效时的应急切换与回滚流程。", citedCount: 18 },
];

export const knowledgeGaps: KnowledgeGap[] = [
  { id: "g1", question: "Redis 内存持续增长如何排查", category: "缓存", hitAttempts: 12, lastAsked: "2025-04-21 15:20", suggestion: "补充 Redis 内存排查 SOP", status: "待补充" },
  { id: "g2", question: "跨机房链路抖动应急流程", category: "网络", hitAttempts: 6, lastAsked: "2025-04-19 10:11", suggestion: "补充跨机房链路应急预案", status: "待补充" },
  { id: "g3", question: "Zabbix 自定义指标对接方式", category: "监控", hitAttempts: 4, lastAsked: "2025-04-18 14:02", suggestion: "更新 Zabbix 指标说明文档", status: "待补充" },
  { id: "g4", question: "RabbitMQ 消费者堆积处理", category: "中间件", hitAttempts: 3, lastAsked: "2025-04-15 09:55", suggestion: "补充 RabbitMQ 消费堆积案例", status: "已补充" },
];

/* ========== 用户 & 审计 ========== */
export const users: UserItem[] = [
  { id: "u1", name: "李管理", account: "admin", role: "系统管理员", department: "运维平台组", status: "启用", lastLogin: "2025-04-22 09:50" },
  { id: "u2", name: "张运维", account: "zhang.yw", role: "运维人员", department: "业务运维组", status: "启用", lastLogin: "2025-04-22 10:15" },
  { id: "u3", name: "王巡检", account: "wang.xj", role: "运维人员", department: "业务运维组", status: "启用", lastLogin: "2025-04-22 08:02" },
  { id: "u4", name: "赵主管", account: "zhao.lead", role: "查看用户", department: "运维管理", status: "启用", lastLogin: "2025-04-21 17:30" },
  { id: "u5", name: "刘外包", account: "liu.out", role: "查看用户", department: "外部支持", status: "停用", lastLogin: "2025-03-12 14:21" },
];

export const auditLogs: AuditLog[] = [
  { id: "l1", time: "2025-04-22 10:31", user: "张运维", action: "生成报告", target: "app-svc-01 故障分析报告", result: "成功", ip: "10.10.1.22", category: "用户操作" },
  { id: "l2", time: "2025-04-22 10:18", user: "系统", action: "触发巡检", target: "网络连通性巡检", result: "成功", ip: "—", category: "任务执行" },
  { id: "l3", time: "2025-04-22 09:50", user: "李管理", action: "登录", target: "平台门户", result: "成功", ip: "10.10.1.5", category: "用户操作" },
  { id: "l4", time: "2025-04-22 09:45", user: "系统", action: "Agent 调用", target: "故障分析 Agent · abn-001", result: "成功", ip: "—", category: "Agent 调用" },
  { id: "l5", time: "2025-04-22 09:12", user: "张运维", action: "更新知识条目", target: "服务重启前后确认事项 FAQ", result: "成功", ip: "10.10.1.22", category: "用户操作" },
  { id: "l6", time: "2025-04-22 09:00", user: "系统", action: "数据接入", target: "Zabbix API · 拉取 32 项指标", result: "成功", ip: "—", category: "数据来源" },
  { id: "l7", time: "2025-04-22 08:55", user: "系统", action: "数据接入", target: "ES · order-svc/app.log 检索", result: "成功", ip: "—", category: "数据来源" },
  { id: "l8", time: "2025-04-22 08:00", user: "系统", action: "触发巡检", target: "全量主机日常巡检", result: "成功", ip: "—", category: "任务执行" },
  { id: "l9", time: "2025-04-21 17:45", user: "赵主管", action: "查看报告", target: "巡检周报", result: "成功", ip: "10.10.1.40", category: "用户操作" },
  { id: "l10", time: "2025-04-21 14:02", user: "刘外包", action: "登录", target: "平台门户", result: "失败", ip: "10.10.9.99", category: "用户操作" },
];

export const agentRuns: AgentRun[] = [
  { id: "ag1", agent: "指挥调度 Agent", task: "故障分析 abn-001 分派", status: "成功", duration: "120ms", startTime: "2025-04-22 09:50:02", input: "record=abn-001", output: "分派 3 个子 Agent" },
  { id: "ag2", agent: "数据查询 Agent", task: "Zabbix 指标回溯", status: "成功", duration: "480ms", startTime: "2025-04-22 09:50:04", input: "app-svc-01 cpu 30m", output: "24 个采样点" },
  { id: "ag3", agent: "日志辅助 Agent", task: "ES 关键字检索", status: "成功", duration: "780ms", startTime: "2025-04-22 09:50:05", input: "order-svc keywords=error,timeout", output: "3 条命中" },
  { id: "ag4", agent: "知识问答 Agent", task: "SOP 匹配", status: "成功", duration: "620ms", startTime: "2025-04-22 09:50:07", input: "CPU 高负载", output: "2 条引用" },
  { id: "ag5", agent: "故障分析 Agent", task: "综合分析输出", status: "成功", duration: "1.4s", startTime: "2025-04-22 09:50:09", input: "abn-001 综合上下文", output: "3 假设 + 4 建议" },
  { id: "ag6", agent: "报告生成 Agent", task: "故障分析报告 r3", status: "成功", duration: "2.1s", startTime: "2025-04-22 10:04:22", input: "an-001", output: "已归档 r3" },
];

/* ========== 图表数据（保留） ========== */
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
