
"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

const assignableRoles = ["Admin", "Inventory Manager", "Marketing Manager", "Stock Keeper"];
const stores = ["Downtown", "Northside"]; // Hardcoded stores for now

const formSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["Admin", "Inventory Manager", "Marketing Manager", "Stock Keeper"] as const, { required_error: "Please select a role." }),
  storeId: z.string().optional(),
}).refine(data => {
    // If the role is one that requires a store, storeId must not be empty.
    if (["Admin", "Inventory Manager", "Marketing Manager", "Stock Keeper"].includes(data.role)) {
        return !!data.storeId;
    }
    return true;
}, {
    message: "This user role must be assigned to a store.",
    path: ["storeId"],
});


type FormData = z.infer<typeof formSchema>;

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export function CreateUserDialog({ isOpen, onClose, onUserCreated }: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser, isOwner } = useAuth();


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const selectedRole = form.watch("role");

  // Effect to set the storeId automatically for admins
  useEffect(() => {
    if (!isOwner && currentUser?.storeId) {
      form.setValue("storeId", currentUser.storeId);
    }
    // If an owner is creating a non-store-based user (if any), clear storeId
    if (isOwner && selectedRole && !["Admin", "Inventory Manager", "Marketing Manager", "Stock Keeper"].includes(selectedRole)) {
        form.clearErrors("storeId");
        form.setValue("storeId", undefined);
    }
  }, [selectedRole, isOwner, currentUser, form]);

  async function onSubmit(values: FormData) {
    setLoading(true);
    
    const tempAuth = getAuth(app, "temp-for-user-creation");

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        role: values.role,
        storeId: values.storeId, // This is now correctly set for both Owners and Admins
        avatar: `https://picsum.photos/seed/${user.uid}/100/100`,
      });

      toast({
        title: "User Created!",
        description: `${values.name} has been added with the role of ${values.role}.`,
      });

      onUserCreated();
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Error creating user:", error);
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      }
      toast({
        variant: "destructive",
        title: "Error Creating User",
        description: errorMessage,
      });
    } finally {
      await tempAuth.signOut().catch(() => {});
      setLoading(false);
    }
  }
  
  const availableRoles = isOwner ? assignableRoles : assignableRoles.filter(role => role !== "Admin");
  const canSelectStore = isOwner && (selectedRole === "Admin" || selectedRole === "Inventory Manager" || selectedRole === "Marketing Manager" || selectedRole === "Stock Keeper");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new user account. They will be able to log in with the email and password you provide.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role to assign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canSelectStore && (
                <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Assigned Store</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a store for this user" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {stores.map(store => (
                                <SelectItem key={store} value={store}>{store}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
