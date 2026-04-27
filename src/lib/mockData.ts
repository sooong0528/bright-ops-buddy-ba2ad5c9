// Mock 数据 —— 智能运维平台演示
export type HostStatus = "正常" | "异常" | "关注";
export type Severity = "严重" | "警告" | "提示";

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

export interface ReportItem {
  id: string;
  title: string;
  type: "日报" | "周报" | "异常摘要" | "问答记录";
  period: string;
  generatedAt: string;
  author: "系统自动" | string;
  summary: string;
  status: "已归档" | "草稿";
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
}

export interface UserItem {
  id: string;
  name: string;
  account: string;
  role: "管理员" | "运维用户" | "查看用户";
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
  { id: "t1", name: "全量主机日常巡检", type: "日常巡检", schedule: "每日 08:00", lastRun: "2025-04-22 08:00", status: "已完成", normal: 6, attention: 2, abnormal: 2, description: "对全部业务主机进行 CPU/内存/磁盘/Ping 四项基础指标巡检。", targets: ["全部主机组"], metrics: ["CPU", "内存", "磁盘", "Ping"], enabled: true, owner: "李管理", createdAt: "2025-01-10" },
  { id: "t2", name: "数据库专项巡检", type: "日常巡检", schedule: "每日 09:00", lastRun: "2025-04-22 09:00", status: "已完成", normal: 1, attention: 1, abnormal: 0, description: "针对 MySQL 主从节点的资源使用情况进行专项核查。", targets: ["数据库"], metrics: ["CPU", "内存", "磁盘"], enabled: true, owner: "张运维", createdAt: "2025-02-03" },
  { id: "t3", name: "周度容量趋势巡检", type: "周巡检", schedule: "每周一 07:30", lastRun: "2025-04-21 07:30", status: "已完成", normal: 5, attention: 3, abnormal: 0, description: "汇总一周磁盘容量与内存使用趋势，输出关注主机清单。", targets: ["全部主机组"], metrics: ["磁盘", "内存"], enabled: true, owner: "李管理", createdAt: "2025-01-15" },
  { id: "t4", name: "网络连通性巡检", type: "日常巡检", schedule: "每 30 分钟", lastRun: "2025-04-22 10:30", status: "运行中", normal: 7, attention: 0, abnormal: 1, description: "高频次 ICMP 探测，及时发现节点失联。", targets: ["全部主机组"], metrics: ["Ping"], enabled: true, owner: "王巡检", createdAt: "2025-03-01" },
  { id: "t5", name: "手动 — 应急核查", type: "手动巡检", schedule: "—", lastRun: "2025-04-22 10:12", status: "已完成", normal: 4, attention: 1, abnormal: 1, description: "应急场景下针对指定主机的临时核查任务。", targets: ["app-svc-01", "mq-01"], metrics: ["CPU", "内存", "Ping"], enabled: true, owner: "张运维", createdAt: "2025-04-22" },
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
  { id: "a1", host: "app-svc-01", metric: "CPU 使用率", severity: "严重", value: "92%", threshold: ">85% 持续 10 分钟", time: "2025-04-22 09:42", description: "应用服务节点 CPU 持续高位，可能存在请求堆积或慢任务。", suggestion: "1) 查看应用线程数与 GC 情况；2) 比对昨日同时段流量；3) 必要时联系开发确认。" },
  { id: "a2", host: "mq-01", metric: "Ping/ICMP", severity: "严重", value: "超时", threshold: "连续 3 次失败", time: "2025-04-22 10:18", description: "消息中间件主机 ICMP 探测失败，疑似网络中断或主机宕机。", suggestion: "1) 通过跳板机尝试登录；2) 联系网络确认链路；3) 评估业务影响并启用备用链路。" },
  { id: "a3", host: "db-master-01", metric: "内存使用率", severity: "警告", value: "82%", threshold: ">80% 持续 30 分钟", time: "2025-04-22 08:55", description: "数据库内存使用率上升，关注是否存在长事务或缓存膨胀。", suggestion: "1) 查看 InnoDB Buffer Pool；2) 排查长事务；3) 留意慢查询。" },
  { id: "a4", host: "app-web-02", metric: "CPU 使用率", severity: "提示", value: "71%", threshold: ">70%", time: "2025-04-22 10:02", description: "Web 节点 CPU 上升至关注阈值，暂未达告警线。", suggestion: "持续观察，比对负载均衡分配是否均匀。" },
];

export const reports: ReportItem[] = [
  { id: "r1", title: "业务系统日常巡检日报", type: "日报", period: "2025-04-21", generatedAt: "2025-04-22 08:15", author: "系统自动", summary: "全量 8 台主机完成巡检，2 项异常 2 项关注，主要集中在 app-svc-01 与 mq-01。", status: "已归档" },
  { id: "r2", title: "业务系统运维周报", type: "周报", period: "2025-04-14 ~ 04-20", generatedAt: "2025-04-21 09:00", author: "系统自动", summary: "本周共触发轻量提醒 12 次，重启服务 1 次，知识库新增 3 条 SOP。", status: "已归档" },
  { id: "r3", title: "MQ 主机连通性异常摘要", type: "异常摘要", period: "2025-04-22 10:18", generatedAt: "2025-04-22 10:21", author: "系统自动", summary: "mq-01 主机连续 3 次 ICMP 失败，已自动关联历史 SOP 与处理建议。", status: "已归档" },
  { id: "r4", title: "知识问答输出记录 — 数据库内存", type: "问答记录", period: "2025-04-22", generatedAt: "2025-04-22 10:30", author: "张运维", summary: "围绕 db-master-01 内存升高的问答整理，引用 2 篇 SOP 与 1 个历史案例。", status: "草稿" },
];

export const knowledge: KnowledgeItem[] = [
  { id: "k1", title: "Linux 主机 CPU 高负载排查 SOP", category: "SOP", tags: ["CPU", "Linux", "性能"], updatedAt: "2025-04-18", version: "v1.3", owner: "运维组", status: "已发布", excerpt: "覆盖 top / pidstat / perf 等基础排查步骤与常见根因。" },
  { id: "k2", title: "MySQL 内存使用率升高处理手册", category: "运维手册", tags: ["MySQL", "内存", "数据库"], updatedAt: "2025-04-12", version: "v2.0", owner: "DBA", status: "已发布", excerpt: "包含 Buffer Pool、连接数、长事务等检查项及处理建议。" },
  { id: "k3", title: "MQ 节点宕机历史故障案例 (2024-11)", category: "故障案例", tags: ["MQ", "宕机", "网络"], updatedAt: "2025-03-30", version: "v1.0", owner: "运维组", status: "已发布", excerpt: "完整记录 2024-11 一次 MQ 宕机的发现、定位、恢复全过程。" },
  { id: "k4", title: "服务重启前后确认事项 FAQ", category: "FAQ", tags: ["服务", "重启", "操作"], updatedAt: "2025-04-20", version: "v1.1", owner: "运维组", status: "已发布", excerpt: "重启前后必须确认的 8 项内容及回滚预案。" },
  { id: "k5", title: "Zabbix 基础指标含义说明", category: "运维手册", tags: ["Zabbix", "指标", "监控"], updatedAt: "2025-04-05", version: "v1.0", owner: "监控组", status: "已发布", excerpt: "对接入的 CPU/内存/磁盘/Ping 指标进行业务化解释。" },
  { id: "k6", title: "磁盘水位告警处理建议（草稿）", category: "SOP", tags: ["磁盘", "容量"], updatedAt: "2025-04-21", version: "v0.1", owner: "运维组", status: "草稿", excerpt: "针对磁盘 80% / 90% 不同水位的标准化处理流程。" },
];

export const users: UserItem[] = [
  { id: "u1", name: "李管理", account: "admin", role: "管理员", department: "运维平台组", status: "启用", lastLogin: "2025-04-22 09:50" },
  { id: "u2", name: "张运维", account: "zhang.yw", role: "运维用户", department: "业务运维组", status: "启用", lastLogin: "2025-04-22 10:15" },
  { id: "u3", name: "王巡检", account: "wang.xj", role: "运维用户", department: "业务运维组", status: "启用", lastLogin: "2025-04-22 08:02" },
  { id: "u4", name: "赵主管", account: "zhao.lead", role: "查看用户", department: "运维管理", status: "启用", lastLogin: "2025-04-21 17:30" },
  { id: "u5", name: "刘外包", account: "liu.out", role: "查看用户", department: "外部支持", status: "停用", lastLogin: "2025-03-12 14:21" },
];

export const auditLogs: AuditLog[] = [
  { id: "l1", time: "2025-04-22 10:31", user: "张运维", action: "生成报告", target: "MQ 主机连通性异常摘要", result: "成功", ip: "10.10.1.22" },
  { id: "l2", time: "2025-04-22 10:18", user: "系统", action: "触发巡检", target: "网络连通性巡检", result: "成功", ip: "—" },
  { id: "l3", time: "2025-04-22 09:50", user: "李管理", action: "登录", target: "平台门户", result: "成功", ip: "10.10.1.5" },
  { id: "l4", time: "2025-04-22 09:12", user: "张运维", action: "更新知识条目", target: "服务重启前后确认事项 FAQ", result: "成功", ip: "10.10.1.22" },
  { id: "l5", time: "2025-04-22 08:00", user: "系统", action: "触发巡检", target: "全量主机日常巡检", result: "成功", ip: "—" },
  { id: "l6", time: "2025-04-21 17:45", user: "赵主管", action: "查看报告", target: "业务系统运维周报", result: "成功", ip: "10.10.1.40" },
  { id: "l7", time: "2025-04-21 14:02", user: "刘外包", action: "登录", target: "平台门户", result: "失败", ip: "10.10.9.99" },
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
