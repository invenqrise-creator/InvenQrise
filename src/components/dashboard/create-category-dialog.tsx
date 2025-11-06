
"use client";

import { useState } from "react";
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
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
}

export function CreateCategoryDialog({ isOpen, onClose, onCategoryCreated }: CreateCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: values.name,
      });

      toast({
        title: "Category Created!",
        description: `"${values.name}" has been added to your categories.`,
      });

      onCategoryCreated();
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        variant: "destructive",
        title: "Error Creating Category",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Enter a name for the new product category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Beverages" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
