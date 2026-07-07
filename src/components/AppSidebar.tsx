import {
  LayoutDashboard,
  ClipboardCheck,
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
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SubItem = { title: string; url: string };
type MainItem = { title: string; url: string; icon: any; children?: SubItem[] };

const mainItems: MainItem[] = [
  { title: "总览驾驶舱", url: "/", icon: LayoutDashboard },
  {
    title: "巡检中心",
    url: "/inspection",
    icon: ClipboardCheck,
    children: [
      { title: "巡检结果", url: "/inspection" },
      { title: "异常记录", url: "/inspection?tab=abnormal" },
    ],
  },
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
  const location = useLocation();

  const isSubActive = (url: string) => {
    const [path, query] = url.split("?");
    if (location.pathname !== path) return false;
    if (!query) {
      // parent path is active only when no tab param
      return !location.search.includes("tab=");
    }
    return location.search.includes(query);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
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
              {mainItems.map((item) => {
                const parentActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
                return (
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
                    {item.children && !collapsed && parentActive && (
                      <SidebarMenuSub>
                        {item.children.map((c) => (
                          <SidebarMenuSubItem key={c.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive(c.url)}>
                              <NavLink to={c.url}>
                                <span>{c.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
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
      </SidebarContent>
    </Sidebar>
  );
}
