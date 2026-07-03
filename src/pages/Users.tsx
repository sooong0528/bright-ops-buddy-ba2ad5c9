import { Plus, ShieldCheck, Eye, UserCog, MoreHorizontal } from "lucide-react";
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

const roles = [
  { name: "管理员", count: 1, desc: "拥有全部模块的操作权限，可管理知识库、用户、配置", color: "destructive" as const, icon: ShieldCheck },
  { name: "运维用户", count: 2, desc: "可执行巡检、生成报告、维护知识库", color: "primary" as const, icon: UserCog },
  { name: "查看用户", count: 2, desc: "仅可查看巡检结果、报告与知识库", color: "info" as const, icon: Eye },
];

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="panel p-5">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                r.color === "destructive" ? "bg-destructive-soft text-destructive" :
                r.color === "primary" ? "bg-primary-soft text-primary" :
                "bg-info-soft text-info"
              }`}>
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{r.name}</h4>
                  <span className="text-xs tabular-nums text-muted-foreground">{r.count} 人</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
