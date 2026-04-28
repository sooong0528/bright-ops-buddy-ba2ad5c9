import { Outlet, useLocation } from "react-router-dom";
import { Bell, Search, HelpCircle, Activity } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const titleMap: Record<string, { title: string; sub: string }> = {
  "/": { title: "总览驾驶舱", sub: "平台运行态势与关键指标一览" },
  "/inspection": { title: "巡检中心", sub: "巡检任务调度、结果分析与关注项识别" },
  "/assistant": { title: "智能问答", sub: "知识增强问答 · 引用手册、SOP、案例" },
  "/reports": { title: "报告中心", sub: "巡检日报 / 周报 / 异常摘要 / 问答记录" },
  "/knowledge": { title: "知识库管理", sub: "运维手册、SOP、故障案例与 FAQ 维护" },
  "/users": { title: "用户与权限", sub: "账号、角色与访问权限管理" },
  "/audit": { title: "审计留痕", sub: "任务、问答、报告与操作的全过程留痕" },
};

/**
 * 整体布局 - 规范 §1 / §2
 * 顶部品牌通栏 + 左侧主菜单 + 右侧主体工作区
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = titleMap[pathname] ?? { title: "智能运维平台", sub: "" };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* === 顶部品牌通栏 - 规范 §2 ===
          固定在顶部 · 高 56 · Logo 距左 20px · 系统名与 Logo 间距 48px · 垂直居中
          仅放品牌识别 + 全局辅助操作（搜索/通知/帮助/用户），不放任何一级菜单 */}
      <header className="sticky top-0 z-40 h-14 flex items-center bg-topbar text-topbar-foreground border-b border-topbar-border">
        {/* 品牌区 */}
        <div className="flex items-center h-full" style={{ paddingLeft: 20 }}>
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-primary shrink-0">
            <Activity className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span
            className="font-semibold tracking-tight text-base leading-none whitespace-nowrap"
            style={{ marginLeft: 48 }}
          >
            智能运维平台
          </span>
          <span className="ml-3 px-1.5 py-0.5 rounded-sm bg-white/10 text-[11px] leading-4 text-white/70">
            v1.0
          </span>
        </div>

        {/* 右侧全局辅助 */}
        <div className="ml-auto flex items-center gap-1 pr-5">
          <div className="relative hidden md:block mr-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
            <Input
              placeholder="全局搜索：主机 / 知识 / 报告"
              className="w-72 pl-8 h-8 bg-white/10 border-white/15 text-white placeholder:text-white/50 hover:bg-white/15 focus-visible:bg-white/15 focus-visible:border-primary"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <div className="ml-2 flex items-center gap-2 pl-3 border-l border-white/15">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">李</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-xs font-medium text-white">李管理</span>
              <span className="text-xs text-white/60">管理员</span>
            </div>
          </div>
        </div>
      </header>

      {/* === 左侧菜单 + 右侧主体 === */}
      <SidebarProvider>
        <div className="flex flex-1 w-full min-h-0">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* 页面标题区 - 规范 §4 */}
            <div className="sticky top-14 z-20 h-12 flex items-center gap-2 border-b border-border bg-card px-4 md:px-6">
              <SidebarTrigger className="text-muted-foreground shrink-0 -ml-1" />
              <div className="flex items-baseline gap-3 min-w-0">
                <h1 className="text-base font-semibold truncate tracking-tight">{meta.title}</h1>
                {meta.sub && (
                  <>
                    <span className="hidden md:inline-block h-3 w-px bg-border shrink-0" />
                    <p className="hidden md:block text-xs text-muted-foreground truncate">{meta.sub}</p>
                  </>
                )}
              </div>
            </div>
            <main className="flex-1 p-4 md:p-6 animate-fade-in">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
