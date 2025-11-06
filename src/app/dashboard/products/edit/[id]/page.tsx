
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader, ArrowLeft, QrCode, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const stores = ["Online", "Downtown", "Northside"];

const formSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  category: z.string({ required_error: "Please select a category." }),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  stock_foh: z.coerce.number().int().min(0, "Stock must be a positive integer."),
  stock_boh: z.coerce.number().int().min(0, "Stock must be a positive integer."),
  barcode: z.string().optional(),
  storeId: z.string().optional(),
  expiryDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditProductPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, isOwner } = useAuth();
  const productId = params.id as string;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

   useEffect(() => {
    const fetchCategories = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "categories"));
            const categoriesData = querySnapshot.docs.map(doc => doc.data().name as string);
            setCategories(categoriesData.sort());
        } catch (error) {
            console.error("Error fetching categories: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load categories." });
        }
    };
    fetchCategories();
  }, [toast]);

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
        setFetching(true);
        try {
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
                const productData = productDoc.data();
                form.reset({
                    name: productData.name,
                    category: productData.category,
                    price: productData.price,
                    stock_foh: productData.stock?.["front-of-house"] || 0,
                    stock_boh: productData.stock?.["back-of-house"] || 0,
                    barcode: productData.barcode || "",
                    storeId: productData.storeId || "",
                    expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : undefined,
                });
            } else {
                toast({ variant: "destructive", title: "Not Found", description: "Product does not exist." });
                router.push("/dashboard/products");
            }
        } catch (error) {
            console.error("Error fetching product:", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to fetch product data." });
        } finally {
            setFetching(false);
        }
    };
    fetchProduct();
  }, [productId, router, form, toast]);

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      await updateDoc(doc(db, "products", productId), {
        name: values.name,
        category: values.category,
        price: values.price,
        stock: {
          "front-of-house": values.stock_foh,
          "back-of-house": values.stock_boh,
        },
        barcode: values.barcode,
        storeId: values.storeId,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      });
      toast({
        title: "Success!",
        description: "Product has been updated successfully.",
      });
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error updating product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem updating the product.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/products">
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-headline tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">
                Update the details for this product.
            </p>
        </div>
      </div>
       {fetching ? (
        <Card>
            <CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                 {isOwner && <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>}
                 <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
        </Card>
      ) : (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Product Details</CardTitle>
              <CardDescription>
                Modify the name, category, price, and stock levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Organic Avocados" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code Value</FormLabel>
                     <div className="relative">
                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="e.g., P-FP-001" {...field} className="pl-10" />
                        </FormControl>
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock_foh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock (Front-of-house)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock_boh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock (Back-of-house)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isOwner && (
                <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Store</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Assign product to a store" />
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
               <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    Saving Changes...
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
