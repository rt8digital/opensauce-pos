import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Edit, Trash2, Shield, User } from "lucide-react";
import { User as UserType } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { PinDialog } from "@/components/auth/pin-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserManagementCardProps {
    onAuthRequired: () => void;
}

export function UserManagementCard({ onAuthRequired }: UserManagementCardProps) {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        pin: "",
        role: "cashier" as "admin" | "cashier"
    });
    const [pinDialogMode, setPinDialogMode] = useState<'create' | 'change'>('create');
    const { toast } = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await apiRequest('GET', '/api/users');
            const userList = await response.json();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to load users:", error);
            onAuthRequired();
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (pin: string) => {
        try {
            const response = await apiRequest('POST', '/api/users', {
                name: formData.name,
                pin,
                role: formData.role
            });
            const user = await response.json();

            setUsers(prev => [...prev, user]);
            setShowAddDialog(false);
            setFormData({ name: "", pin: "", role: "cashier" });
            toast({
                title: "User created",
                description: `${user.name} has been added successfully.`
            });
        } catch (error) {
            throw error;
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await apiRequest('PATCH', `/api/users/${selectedUser.id}`, {
                name: formData.name,
                role: formData.role
            });
            const updatedUser = await response.json();

            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setShowEditDialog(false);
            setSelectedUser(null);
            setFormData({ name: "", pin: "", role: "cashier" });
            toast({
                title: "User updated",
                description: `${updatedUser.name} has been updated successfully.`
            });
        } catch (error) {
            console.error("Failed to update user:", error);
            toast({
                title: "Error",
                description: "Failed to update user",
                variant: "destructive"
            });
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await apiRequest('DELETE', `/api/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast({
                title: "User deleted",
                description: "User has been removed successfully."
            });
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive"
            });
        }
    };

    const handleChangePin = async (pin: string) => {
        if (!selectedUser) return;

        try {
            const response = await apiRequest('PATCH', `/api/users/${selectedUser.id}/pin`, { pin });
            const updatedUser = await response.json();
            toast({
                title: "PIN changed",
                description: `PIN for ${updatedUser.name} has been updated.`
            });
            setSelectedUser(null);
        } catch (error) {
            throw error;
        }
    };

    const openAddDialog = () => {
        setFormData({ name: "", pin: "", role: "cashier" });
        setShowPinDialog(true);
        setPinDialogMode('create');
    };

    const openEditDialog = (user: UserType) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            pin: "",
            role: user.role as "admin" | "cashier"
        });
        setShowEditDialog(true);
    };

    const openChangePinDialog = (user: UserType) => {
        setSelectedUser(user);
        setShowPinDialog(true);
        setPinDialogMode('change');
    };

    const handlePinSubmit = async (pin: string) => {
        if (pinDialogMode === 'create') {
            await handleAddUser(pin);
        } else {
            await handleChangePin(pin);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">Loading users...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                Manage system users and their access permissions
                            </CardDescription>
                        </div>
                        <Button onClick={openAddDialog} size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    {user.role === 'admin' ? (
                                        <Shield className="w-5 h-5 text-primary" />
                                    ) : (
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                            {user.isOwner && (
                                                <Badge variant="outline">Owner</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(user)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openChangePinDialog(user)}
                                    >
                                        PIN
                                    </Button>
                                    {!user.isOwner && isAdmin && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete {user.name}? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-name">Name</Label>
                            <Input
                                id="user-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter user name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) =>
                                    setFormData(prev => ({ ...prev, role: value as "admin" | "cashier" }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowAddDialog(false);
                                    setShowPinDialog(true);
                                    setPinDialogMode('create');
                                }}
                                disabled={!formData.name.trim()}
                            >
                                Next: Set PIN
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter user name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) =>
                                    setFormData(prev => ({ ...prev, role: value as "admin" | "cashier" }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditUser} disabled={!formData.name.trim()}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PIN Dialog */}
            <PinDialog
                open={showPinDialog}
                onOpenChange={setShowPinDialog}
                title={pinDialogMode === 'create' ? "Create PIN" : "Change PIN"}
                description={
                    pinDialogMode === 'create'
                        ? `Create a 6-digit PIN for ${formData.name || selectedUser?.name}`
                        : `Change PIN for ${selectedUser?.name}`
                }
                onSubmit={handlePinSubmit}
                submitLabel={pinDialogMode === 'create' ? "Create User" : "Change PIN"}
            />
        </>
    );
}
