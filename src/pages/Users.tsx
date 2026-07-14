import { useState } from "react";
import { Plus, ShieldCheck, Eye, UserCog, Users as UsersIcon } from "lucide-react";
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
import { TableActions } from "@/components/TableActions";
import { toast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const editUser = (user: (typeof users)[number]) => toast({ title: "编辑用户", description: user.name });
  const toggleUser = (user: (typeof users)[number]) => toast({
    title: `${user.status === "启用" ? "停用" : "启用"}用户`,
    description: user.name,
  });

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
              <TableRow key={u.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-soft text-primary text-xs font-medium">
                        {u.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="font-medium text-sm text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                      onClick={(event) => { event.stopPropagation(); setSelectedUserId(u.id); }}
                    >
                      {u.name}
                    </button>
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
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <TableActions actions={[
                    { label: "编辑用户", onClick: () => editUser(u) },
                    { label: u.status === "启用" ? "停用" : "启用", onClick: () => toggleUser(u) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUser.name}</SheetTitle>
                <SheetDescription>{selectedUser.account} · {selectedUser.role}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                <UserInfo label="账号" value={selectedUser.account} />
                <UserInfo label="角色" value={selectedUser.role} />
                <UserInfo label="所属部门" value={selectedUser.department} />
                <UserInfo label="状态" value={selectedUser.status} />
                <UserInfo label="最近登录" value={selectedUser.lastLogin} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => editUser(selectedUser)}>编辑用户</Button>
                <Button variant="outline" size="sm" onClick={() => toggleUser(selectedUser)}>
                  {selectedUser.status === "启用" ? "停用" : "启用"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
