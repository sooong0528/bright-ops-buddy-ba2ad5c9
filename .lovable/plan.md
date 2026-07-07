# 统一"观测配置" 与 "巡检任务编辑" 的交互

## 问题
- 资产管理 → 观测配置：Sheet 中用 Tab 切 Zabbix / 日志，左侧 host 列表拥挤，横向空间不足；日志源只有源名称，无法说明用途。
- 巡检配置 → 新建巡检任务：Dialog 承载资源较多时非常局促；与观测配置形态不一致。

## 目标
一套通用的"配置抽屉"骨架，覆盖两个场景，减少认知成本。

## 通用骨架（新组件 `ConfigDrawer`）
- 组件：`Sheet` + `side="right"` + `w-full sm:max-w-[960px]`，顶部固定标题条，底部固定操作条。
- 主体：**三栏布局**
  ```text
  ┌─ 左：范围选择 (280px) ─┬─ 中/右：详情配置 ─────────────────┐
  │ 搜索框                 │ 顶部：当前选中对象摘要             │
  │ 类型分组折叠           │ 分区：Zabbix 指标 / 日志源         │
  │ 复选 + 已选数量徽标    │ 卡片式多选，带"全选/清空/推荐"    │
  └────────────────────────┴────────────────────────────────────┘
  ```
- 左栏支持关键词搜索（命中标红）、按资产类型分组、显示"已选 N 项"。
- 中/右栏用**分区**取代 Tab：一次性看到 Zabbix 指标 + 日志源，避免用户来回切换。

## 场景 1：资产管理 → 观测配置
- 左栏：Zabbix Host 池（按现有 `zabbixHostPool` 展示，未来可搜索）。
- 右栏两个分区：
  - **Zabbix 指标**：当前 Host 的推荐指标（`itemPoolByType[asset.type]`），多选 + "推荐全选"。
  - **日志源**：卡片列表，每张卡片包含：
    - 复选框 + 源名称（如 `es-app-log`）
    - **用途描述输入框**（Input，占位："系统日志 / 安全日志 / 运行日志 / 应用日志 / 错误日志 / 访问日志"）
    - 输入框仅在勾选后可编辑
- 数据结构变化：
  ```ts
  logSources: { source: string; purpose: string }[]  // 从 string[] 升级
  ```
  兼容旧数据：读取时若为 `string` 自动包一层。

## 场景 2：巡检配置 → 新建巡检任务
- 复用同一 `ConfigDrawer` 骨架。
- 左栏：**资源池**（`assets`），按类型分组 + 搜索 + 复选 + 已选数徽标。
- 右栏两个分区：
  - **任务基础信息**（名称 / 类型 / 调度 / 负责人 / 描述 / AI 助手入口）折叠在顶部。
  - **每资源指标**：以卡片列出已选资源，每张卡片列出该资源类型的指标池，支持全选/清空；与当前 `assetSelections` 数据结构一致，无需迁移。
- Dialog → Sheet 之后再多资源也不局促，且底部操作条常驻，避免长表单要滚动到底找按钮。

## 技术要点
- 抽屉宽度 `sm:max-w-[960px]`，主体 `grid grid-cols-[280px_1fr]`，两栏各自 `overflow-y-auto`。
- 左栏搜索用 `useMemo` + 关键词高亮 span。
- 日志源 `purpose` 输入 debounce 到本地 state 即可，不额外引入库。
- `observationConfigs` 的 mock 类型升级：`{ source, purpose }`；`initConfigs`、`statusOf`、详情展示同步更新。

## 涉及文件
- `src/pages/Assets.tsx`：`ObservationEditor` 改为新版三栏 Sheet，日志源加 purpose 输入。
- `src/lib/mockData.ts`：`ObservationConfig.logSources` 升级为对象数组，示例数据补默认用途。
- `src/pages/InspectionAdmin.tsx`：`TaskEditorDialog` 换成 `TaskEditorSheet`（Sheet + 三栏），保留 AI 助手、合并检测等既有能力。
- （可选）抽出 `src/components/ConfigDrawerShell.tsx` 承载通用骨架，两处引用。

## 不做
- 不改动巡检判定规则、AI 助手 Edge Function 逻辑、任务列表和详情 Sheet。
- 不改动数据库/后端结构（当前为 mock）。
