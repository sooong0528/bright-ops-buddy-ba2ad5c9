import {
  LayoutDashboard,
  ClipboardCheck,
  TriangleAlert,
  Bot,
  FileText,
  BookOpen,
  Users,
  ScrollText,
  Activity,
  Settings2,
  Wrench,
  Boxes,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type MainItem = { title: string; url: string; icon: any };

const mainItems: MainItem[] = [
  { title: "总览驾驶舱", url: "/", icon: LayoutDashboard },
  { title: "巡检结果", url: "/inspection", icon: ClipboardCheck },
  { title: "异常记录", url: "/inspection/abnormal", icon: TriangleAlert },
  { title: "故障分析", url: "/analysis", icon: Wrench },
  { title: "智能问答", url: "/assistant", icon: Bot },
  { title: "报告中心", url: "/reports", icon: FileText },
];

const manageItems = [
  { title: "资产管理", url: "/assets", icon: Boxes },
  { title: "巡检管理", url: "/inspection-admin", icon: Settings2 },
  { title: "知识库管理", url: "/knowledge", icon: BookOpen },
  { title: "用户与权限", url: "/users", icon: Users },
  { title: "审计留痕", url: "/audit", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className={`flex items-center border-b border-sidebar-border ${collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-5"}`}>
          <div className={`flex shrink-0 items-center justify-center bg-gradient-primary shadow-glow ${collapsed ? "h-9 w-9 rounded-lg" : "h-10 w-10 rounded-xl"}`}>
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-base font-semibold text-sidebar-accent-foreground tracking-tight">智能运维平台</span>
              <span className="text-xs text-sidebar-foreground/70 mt-0.5">SmartOps · v1.0</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">运维工作台</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">配置与管理</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
