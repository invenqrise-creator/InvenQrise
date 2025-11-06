
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
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

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const barcode = searchParams.get("barcode");
  const { user, isOwner } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock_foh: 0,
      stock_boh: 0,
      barcode: barcode || "",
      storeId: isOwner ? 'Online' : user?.storeId || ""
    },
  });

   useEffect(() => {
    if (barcode) {
      form.setValue("barcode", barcode);
    }
  }, [barcode, form]);

  useEffect(() => {
    // Set default storeId based on user role when component mounts
    if (!isOwner && user?.storeId) {
        form.setValue("storeId", user.storeId);
    } else if (isOwner) {
        form.setValue("storeId", "Online");
    }
  }, [isOwner, user, form]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const storeId = isOwner ? values.storeId : user?.storeId;
    if (!storeId) {
        toast({ variant: "destructive", title: "Error", description: "You are not assigned to a store." });
        return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name: values.name,
        category: values.category,
        price: values.price,
        stock: {
          "front-of-house": values.stock_foh,
          "back-of-house": values.stock_boh,
        },
        barcode: values.barcode,
        storeId: storeId, // Assign storeId
        imageUrl: `https://picsum.photos/400/400?random=${Math.random()}`,
        aiHint: values.name.split(" ").slice(0, 2).join(" "),
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Success!",
        description: "Product has been added successfully.",
      });
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error adding product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the product. Please try again.",
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
            <h1 className="text-3xl font-headline tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">
            Fill in the details below to add a new product to your inventory.
            </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Product Details</CardTitle>
              <CardDescription>
                Please provide the name, category, price, and stock levels.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Price ($)</FormLabel>
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
                            <Input placeholder="Scan or enter code" {...field} className="pl-10" />
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
                          disabled={(date) =>
                            date < new Date()
                          }
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
                    Adding Product...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
