import {
  LayoutDashboard,
  ClipboardCheck,
  Bot,
  FileText,
  BookOpen,
  Users,
  ScrollText,
  Activity,
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

const mainItems = [
  { title: "总览驾驶舱", url: "/", icon: LayoutDashboard },
  { title: "巡检中心", url: "/inspection", icon: ClipboardCheck },
  { title: "智能问答", url: "/assistant", icon: Bot },
  { title: "报告中心", url: "/reports", icon: FileText },
];

const manageItems = [
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
        {/* Logo 区 */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-primary">
            <Activity className="h-[18px] w-[18px] text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-base font-semibold text-sidebar-accent-foreground tracking-tight">智能运维平台</span>
              <span className="text-xs text-sidebar-foreground/60 mt-0.5">SmartOps · v1.0</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">运维工作台</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
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
                  <SidebarMenuButton asChild>
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

        {!collapsed && (
          <div className="mt-auto p-3 m-3 rounded-md bg-sidebar-accent/40 border border-sidebar-border">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
              <span className="text-xs font-semibold text-sidebar-accent-foreground">Zabbix 7.0.21</span>
            </div>
            <p className="text-xs leading-relaxed text-sidebar-foreground/70">
              已接入 8 台主机 · CPU / 内存 / 磁盘 / Ping
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
