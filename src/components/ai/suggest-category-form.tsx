"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { categories as existingCategories } from "@/lib/placeholder-data";
import {
  suggestProductCategory,
  type SuggestProductCategoryOutput,
} from "@/ai/flows/suggest-product-category";
import { Loader, Wand2 } from "lucide-react";

const formSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters."),
  productDescription: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(500, "Description must be less than 500 characters."),
});

export function SuggestCategoryForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestProductCategoryOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productDescription: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);

    try {
      const suggestion = await suggestProductCategory({
        ...values,
        existingCategories,
      });
      setResult(suggestion);
    } catch (error) {
      console.error("Error getting suggestion:", error);
      // Here you would typically show a toast notification
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Suggest Product Category</CardTitle>
        <CardDescription>
          Enter a product&apos;s name and description, and our AI will suggest the
          best category based on customer insights.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Gluten-Free Oat Milk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A creamy, delicious, and dairy-free alternative to traditional milk. Perfect for cereals, coffee, or baking."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Suggest Category
                </>
              )}
            </Button>
            {result && (
              <Card className="w-full bg-accent/30">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">AI Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-sm mb-1">Suggested Category</h3>
                        <p className="text-lg font-medium text-primary-foreground bg-primary rounded-md px-3 py-1 inline-block">{result.suggestedCategory}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm mb-1">Reasoning</h3>
                        <p className="text-muted-foreground">{result.reasoning}</p>
                    </div>
                </CardContent>
              </Card>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
