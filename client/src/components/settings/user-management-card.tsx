import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Edit, Trash2, Shield, User, Key, CheckCircle2 } from "lucide-react";
import type { User as UserType } from "../../../../shared/types";
import { useAuth } from "@/contexts/auth-context";
import { PinDialog } from "@/components/auth/pin-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        setIsSubmitting(true);
        try {
            if (!formData.name.trim()) {
                toast({ title: "Error", description: "Please enter a name for the user.", variant: "destructive" });
                return;
            }
            if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
                toast({ title: "Error", description: "PIN must be exactly 6 digits.", variant: "destructive" });
                return;
            }
            const duplicateUser = users.find(user => user.name.toLowerCase().trim() === formData.name.toLowerCase().trim());
            if (duplicateUser) {
                toast({ title: "Error", description: "A user with this name already exists.", variant: "destructive" });
                return;
            }
            const response = await apiRequest('POST', '/api/users', { name: formData.name.trim(), pin, role: formData.role });
            const user = await response.json();
            setUsers(prev => [...prev, user]);
            setShowAddDialog(false);
            setFormData({ name: "", pin: "", role: "cashier" });
            toast({ title: "User created", description: `${user.name} has been added successfully.` });
        } catch (error: any) {
            console.error("Failed to add user:", error);
            toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            if (!formData.name.trim()) {
                toast({ title: "Error", description: "Please enter a name for the user.", variant: "destructive" });
                return;
            }
            const response = await apiRequest('PATCH', `/api/users/${selectedUser.id}`, { name: formData.name.trim(), role: formData.role });
            const updatedUser = await response.json();
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setShowEditDialog(false);
            setSelectedUser(null);
            setFormData({ name: "", pin: "", role: "cashier" });
            toast({ title: "User updated", description: `${updatedUser.name} has been updated successfully.` });
        } catch (error: any) {
            console.error("Failed to update user:", error);
            toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await apiRequest('DELETE', `/api/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast({ title: "User deleted", description: "User has been removed successfully." });
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
        }
    };

    const handleChangePin = async (pin: string) => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
                toast({ title: "Error", description: "PIN must be exactly 6 digits.", variant: "destructive" });
                return;
            }
            const response = await apiRequest('PATCH', `/api/users/${selectedUser.id}/pin`, { pin });
            const updatedUser = await response.json();
            toast({ title: "PIN changed", description: `PIN for ${updatedUser.name} has been updated.` });
            setSelectedUser(null);
        } catch (error: any) {
            console.error("Failed to change PIN:", error);
            toast({ title: "Error", description: error.message || "Failed to change PIN", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePinSubmit = async (pin: string) => {
        if (pinDialogMode === 'create') await handleAddUser(pin);
        else await handleChangePin(pin);
    };

    if (loading) {
        return (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-center py-12 text-muted-foreground animate-pulse">Loading identity profiles...</div></CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-4 border-b border-border/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Identity Management</CardTitle>
                                <CardDescription>Control system access and hierarchical permissions</CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => { setFormData({ name: "", pin: "", role: "cashier" }); setShowAddDialog(true); }} className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map((user) => (
                            <div key={user.id} className="group/user relative flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-2xl shadow-inner transition-colors",
                                        user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-background/50 text-muted-foreground"
                                    )}>
                                        {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg leading-tight">{user.name}</p>
                                            {user.isOwner && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-black uppercase tracking-widest h-5 px-2 rounded-full",
                                                user.role === 'admin' ? "border-primary/50 text-primary bg-primary/5" : "border-border text-muted-foreground"
                                            )}>
                                                {user.role}
                                            </Badge>
                                            {user.isOwner && (
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest h-5 px-2 rounded-full border-amber-500/50 text-amber-500 bg-amber-500/5">
                                                    Primary Owner
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover/user:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setFormData({ name: user.name, pin: "", role: user.role as "admin" | "cashier" }); setShowEditDialog(true); }} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setShowPinDialog(true); setPinDialogMode('change'); }} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                        <Key className="w-4 h-4" />
                                    </Button>
                                    {!user.isOwner && isAdmin && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete <span className="font-bold text-foreground">{user.name}</span> and all associated authentication credentials. This action is irreversible.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl">Retain User</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                                        Confirm Deletion
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

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-border/50 bg-background/95 backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <DialogHeader className="px-8 pt-8 pb-4">
                        <DialogTitle className="text-2xl font-black">Create Profile</DialogTitle>
                        <CardDescription>Enter details to add a new system member</CardDescription>
                    </DialogHeader>
                    <div className="px-8 pb-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Identity Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="John Doe" className="h-12 rounded-xl bg-muted/30 border-border/50 focus:border-primary" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Access Tier</Label>
                                <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v as any }))}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50">
                                        <SelectItem value="cashier" className="rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-muted text-muted-foreground"><User className="h-3.5 w-3.5" /></div>
                                                <div className="text-left"><p className="font-bold text-sm">Cashier</p><p className="text-[10px] text-muted-foreground leading-tight">Sales & Transactions</p></div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin" className="rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Shield className="h-3.5 w-3.5" /></div>
                                                <div className="text-left"><p className="font-bold text-sm">Administrator</p><p className="text-[10px] text-muted-foreground leading-tight">Full System Authority</p></div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={() => { setShowAddDialog(false); setShowPinDialog(true); setPinDialogMode('create'); }} disabled={!formData.name.trim()} className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20">
                            Configure Security PIN
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-border/50 bg-background/95 backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <DialogHeader className="px-8 pt-8 pb-4">
                        <DialogTitle className="text-2xl font-black">Edit Identity</DialogTitle>
                        <CardDescription>Modify user permissions or display name</CardDescription>
                    </DialogHeader>
                    <div className="px-8 pb-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="h-12 rounded-xl bg-muted/30 border-border/50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Update Tier</Label>
                                <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v as any }))}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50">
                                        <SelectItem value="cashier" className="rounded-lg">Cashier Access</SelectItem>
                                        <SelectItem value="admin" className="rounded-lg">Administrative Rights</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={handleEditUser} disabled={!formData.name.trim() || isSubmitting} className="w-full h-12 rounded-xl font-bold">
                            {isSubmitting ? "Syncing Identity..." : "Apply Transformations"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <PinDialog
                open={showPinDialog}
                onOpenChange={setShowPinDialog}
                title={pinDialogMode === 'create' ? "Security PIN" : "Update PIN"}
                description={pinDialogMode === 'create' ? `Authenticate ${formData.name} with a 6-digit access token.` : `Enter a new security token for ${selectedUser?.name}.`}
                onSubmit={handlePinSubmit}
                submitLabel={pinDialogMode === 'create' ? "Confirm & Create" : "Authorize Update"}
            />
        </div>
    );
}
