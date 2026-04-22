import { Outlet, useLocation } from "react-router-dom";
import { Bell, Search, HelpCircle } from "lucide-react";
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

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = titleMap[pathname] ?? { title: "智能运维平台", sub: "" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 md:px-6">
            <SidebarTrigger className="text-foreground" />
            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-base font-semibold truncate">{meta.title}</h1>
              <p className="text-xs text-muted-foreground truncate">{meta.sub}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索主机 / 知识 / 报告" className="w-64 pl-8 h-9 bg-secondary/60 border-transparent focus-visible:bg-card" />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <div className="ml-1 flex items-center gap-2 pl-3 border-l">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">李</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-xs font-medium">李管理</span>
                  <span className="text-[10px] text-muted-foreground">管理员</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
