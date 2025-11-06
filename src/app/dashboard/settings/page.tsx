
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(), // For display, not editing
});

type FormData = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
      });
      setFetching(false);
    } else if (!authLoading) {
      // If auth is done loading and there's no user, redirect
      toast({ variant: "destructive", title: "Unauthorized", description: "You must be logged in to view this page." });
      router.push("/");
    }
  }, [user, authLoading, form, router, toast]);

  async function onSubmit(values: FormData) {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: values.name,
      });
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
      // Optionally, you might want to refresh the auth state or redirect
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem updating your profile.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      {fetching ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Profile</CardTitle>
                <CardDescription>
                  This is how your name will be displayed in the app. Email cannot be changed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
