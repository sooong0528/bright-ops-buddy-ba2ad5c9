import {
  LayoutDashboard,
  ClipboardCheck,
  Bot,
  FileText,
  BookOpen,
  Users,
  ScrollText,
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

/**
 * 左侧主菜单 - 规范 §3
 * 一级导航 · 浅色专业 SaaS · 选中态使用主题色 #00C1BE
 * Logo 已迁移到顶部品牌通栏，此处仅承载导航
 */
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar pt-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground/80 text-xs font-medium px-3">
              运维工作台
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-sm h-9"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px] border-sidebar-primary"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground/80 text-xs font-medium px-3">
              配置与管理
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-sm h-9"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px] border-sidebar-primary"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-3 mx-3 mb-3 rounded border border-border bg-secondary/60">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-xs font-semibold text-foreground">Zabbix 7.0.21</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              已接入 8 台主机
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
