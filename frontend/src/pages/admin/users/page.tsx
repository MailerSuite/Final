import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageHeader from '@/components/ui/page-header';
import UserForm from "@/components/admin/UserForm";
import { adminApi, UserAdminView } from "@/api/admin";
import axios from '@/http/axios';

const AdminUsers = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUserPlan, setEditingUserPlan] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== "all") params.status_filter = statusFilter;
      if (roleFilter && roleFilter !== "all") params.role_filter = roleFilter;
      
      const data = await adminApi.listUsers(params);
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, statusFilter, roleFilter]);

  const handleCreate = async (data: any) => {
    try {
      // Create user using the new backend API
      await axios.post('/api/v1/admin/users', data);
      toast.success("User created successfully");
      setCreateOpen(false);
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to create user";
      toast.error(errorMessage);
      console.error("Error creating user:", error);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    
    try {
      await adminApi.updateUser(editingUser.id, data);
      toast.success("User updated successfully");
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await adminApi.deleteUser(userId, false); // Soft delete by default
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    }
  };

  const handleUpdatePlan = async (userId: string, plan: string) => {
    try {
      await adminApi.updateUserPlan(userId, plan);
      toast.success(`User plan updated to ${plan}`);
      setEditingUserPlan(null);
      loadUsers();
    } catch (error) {
      toast.error("Failed to update user plan");
      console.error("Error updating user plan:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      deleted: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      user: "outline",
      moderator: "secondary",
      admin: "default",
      super_admin: "destructive"
    };
    
    return (
      <Badge variant={variants[role] || "outline"}>
        {role}
      </Badge>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-3 sm:p-4 space-y-4"
      role="main"
      aria-label="User Management Dashboard"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
            <span className="text-2xl" role="img" aria-label="Users">👥</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              User Management Dashboard
            </h1>
            <p className="text-zinc-400">Comprehensive user accounts and permissions management • UPDATED!</p>
          </div>
        </div>
      </header>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
              Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-label="User Data Table">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users ({users.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table className="min-w-[720px] sm:min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-6 py-4 text-foreground">{user.id}</TableCell>
                  <TableCell className="px-6 py-4">{user.email}</TableCell>
                  <TableCell className="px-6 py-4">{user.username}</TableCell>
                  <TableCell className="px-6 py-4">{user.full_name || '—'}</TableCell>
                  <TableCell className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {editingUserPlan === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={newPlan} onValueChange={setNewPlan}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLAN1">PLAN1</SelectItem>
                            <SelectItem value="PLAN2">PLAN2</SelectItem>
                            <SelectItem value="PLAN3">PLAN3</SelectItem>
                            <SelectItem value="PLAN4">PLAN4</SelectItem>
                            <SelectItem value="PLAN5">PLAN5</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePlan(user.id, newPlan)}
                          disabled={!newPlan}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUserPlan(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.plan || user.subscription_plan || "PLAN1"}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserPlan(user.id);
                            setNewPlan(user.plan || user.subscription_plan || "PLAN1");
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && !loading && (
            <p className="mt-4 text-sm text-muted-foreground">No users found.</p>
          )}
          {loading && (
            <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>
          )}
        </CardContent>
      </Card>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingUser !== null} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdate}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminUsers;
