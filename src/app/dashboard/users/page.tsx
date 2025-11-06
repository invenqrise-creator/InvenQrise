
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Store, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CreateUserDialog } from "@/components/dashboard/create-user-dialog";


interface User {
    id: string;
    name: string;
    email: string;
    role: "Owner" | "Admin" | "Inventory Manager" | "Marketing Manager" | "Stock Keeper";
    avatar?: string;
    storeId?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user: currentUser, isOwner, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    } catch (error) {
        console.error("Error fetching users: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch user data." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openDeleteDialog = (user: User) => {
    if (user.id === currentUser?.uid) {
        toast({ variant: "destructive", title: "Action Forbidden", description: "You cannot delete your own account."});
        return;
    }
    if (user.role === 'Owner') {
        toast({ variant: "destructive", title: "Action Forbidden", description: "The Owner account cannot be deleted."});
        return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
        await deleteDoc(doc(db, "users", userToDelete.id));
        toast({ title: "User Deleted", description: `${userToDelete.name} has been removed from the system.`});
        fetchUsers(); 
    } catch (error) {
        console.error("Error deleting user: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete user."});
    } finally {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    }
  };


  return (
    <>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{userToDelete?.name}</span> and remove their data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Delete User</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <CreateUserDialog 
      isOpen={isCreateDialogOpen} 
      onClose={() => setIsCreateDialogOpen(false)}
      onUserCreated={fetchUsers}
    />

    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage your team and their roles.
        </p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline">User List</CardTitle>
                    <CardDescription>All users with access to InvenQrise.</CardDescription>
                </div>
                 {isAdmin && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create User
                    </Button>
                 )}
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span>{user.name}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                        <Badge variant={
                            user.role === 'Owner' ? 'default' : 
                            user.role === 'Admin' ? 'secondary' :
                            'outline'
                            }
                            className={user.role === 'Owner' ? 'bg-accent text-accent-foreground' : ''}
                        >
                            {user.role}
                        </Badge>
                        </TableCell>
                        <TableCell>
                            {user.storeId ? (
                                <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.storeId}</span>
                                </div>
                            ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isOwner && currentUser?.id !== user.id}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="font-body">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem disabled>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit (soon)
                                </DropdownMenuItem>
                                {isOwner && (
                                    <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        No users found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
