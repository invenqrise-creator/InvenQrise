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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, Wand2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { suggestCampaignName, SuggestCampaignNameOutput } from "@/ai/flows/suggest-campaign-name";

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  category: z.string({ required_error: "Please select a category." }),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }, { required_error: "Please select a date range." }),
  productIds: z.array(z.string()).min(1, "Please select at least one product."),
});

type FormData = z.infer<typeof formSchema>;

interface Product {
  id: string;
  name: string;
}

interface CreateCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
}

export function CreateCampaignDialog({ isOpen, onClose, onCampaignCreated }: CreateCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SuggestCampaignNameOutput | null>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      productIds: [],
    },
  });

  const selectedCategory = form.watch("category");
  const selectedProductIds = form.watch("productIds");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        setCategories(querySnapshot.docs.map(doc => doc.data().name).sort());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load categories." });
      }
    };
    fetchCategories();
  }, [toast]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) return;
      form.setValue("productIds", []); // Reset products when category changes
      try {
        const q = query(collection(db, "products"), where("category", "==", selectedCategory));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load products for this category." });
      }
    };
    fetchProducts();
  }, [selectedCategory, form, toast]);

  const handleSuggestName = async () => {
    if (!selectedCategory || selectedProductIds.length === 0) {
      toast({ variant: "destructive", title: "Info Missing", description: "Please select a category and at least one product first." });
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
      const result = await suggestCampaignName({
        category: selectedCategory,
        products: selectedProducts.map(p => p.name),
      });
      setAiResult(result);
      form.setValue("name", result.campaignName, { shouldValidate: true });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to get AI suggestion." });
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      await addDoc(collection(db, "campaigns"), {
        name: values.name,
        category: values.category,
        startDate: values.dateRange.from.toISOString(),
        endDate: values.dateRange.to.toISOString(),
        productIds: values.productIds,
        // Status will be calculated dynamically on the page
      });

      toast({
        title: "Campaign Created!",
        description: `The "${values.name}" campaign has been successfully created.`,
      });

      onCampaignCreated();
      form.reset();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create campaign." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Fill out the details below to launch a new marketing campaign.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date Range</FormLabel>
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
                                    {field.value?.from ? (
                                        field.value.to ? (
                                        <>
                                            {format(field.value.from, "LLL dd, y")} -{" "}
                                            {format(field.value.to, "LLL dd, y")}
                                        </>
                                        ) : (
                                        format(field.value.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={field.value?.from}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <FormLabel>Applicable Products</FormLabel>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="productIds"
                          render={({ field }) => (
                            <FormItem key={product.id} className="flex flex-row items-start space-x-3 space-y-0 py-1">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, product.id])
                                      : field.onChange(field.value?.filter((value) => value !== product.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{product.name}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedCategory ? "No products found in this category." : "Select a category to see products."}
                      </p>
                    )}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., Summer Fresh Deals" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSuggestName} disabled={aiLoading}>
                        {aiLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Suggest
                    </Button>
                  </div>
                   {aiResult && (
                    <div className="p-2 text-sm text-muted-foreground border rounded-md mt-2 bg-accent/20">
                      <span className="font-semibold text-primary">AI Suggestion:</span> {aiResult.reasoning}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
