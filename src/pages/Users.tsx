import { Plus, ShieldCheck, Eye, UserCog, MoreHorizontal, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { users } from "@/lib/mockData";
import { StatCard, StatCardGrid } from "@/components/StatCard";

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <StatCardGrid>
        <StatCard title="用户总数" value={users.length} unit="人" icon={UsersIcon} tone="primary" description={`启用 ${users.filter((user) => user.status === "启用").length} · 停用 ${users.filter((user) => user.status === "停用").length}`} />
        <StatCard title="系统管理员" value={users.filter((user) => user.role === "系统管理员").length} unit="人" icon={ShieldCheck} tone="destructive" description="拥有全部系统权限" />
        <StatCard title="运维人员" value={users.filter((user) => user.role === "运维人员").length} unit="人" icon={UserCog} tone="success" description="执行巡检与故障分析" />
        <StatCard title="查看用户" value={users.filter((user) => user.role === "查看用户").length} unit="人" icon={Eye} tone="info" description="只读查看业务结果" />
      </StatCardGrid>

      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">用户列表</h3>
            <p className="text-xs text-muted-foreground mt-0.5">简单角色管理 · 满足当前轻量化场景</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="搜索用户" className="w-56 h-9" />
            <Button><Plus className="h-4 w-4 mr-1" />新建用户</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>账号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>所属部门</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最近登录</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="hover:bg-secondary/40">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-soft text-primary text-xs font-medium">
                        {u.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{u.account}</TableCell>
                <TableCell>
                  <StatusBadge tone={u.role === "系统管理员" ? "destructive" : u.role === "运维人员" ? "info" : "muted"}>
                    {u.role}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.department}</TableCell>
                <TableCell><StatusBadge tone={statusTone(u.status)} dot>{u.status}</StatusBadge></TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{u.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
