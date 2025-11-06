
"use client";

import * as React from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader, Wand2, ArrowUp, ArrowDown, ShoppingBasket, NotepadText } from "lucide-react";
import { generateInventoryInsights } from "@/ai/flows/generate-inventory-insights";
import { type GenerateInventoryInsightsOutput } from "@/ai/flows/generate-inventory-insights.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PredictiveAnalysisPage() {
  const [loading, setLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<GenerateInventoryInsightsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    setAnalysisResult(null);

    try {
      // 1. Fetch sales data from the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const salesQuery = query(
        collection(db, "sales"),
        where("date", ">=", thirtyDaysAgo.toISOString()),
        orderBy("date", "desc")
      );
      const salesSnapshot = await getDocs(salesQuery);
      
      const salesData = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Recursively convert Timestamps to ISO strings
        const convertTimestamps = (obj: any): any => {
            if (!obj) return obj;
            if (obj instanceof Timestamp) {
                return obj.toDate().toISOString();
            }
            if (Array.isArray(obj)) {
                return obj.map(convertTimestamps);
            }
            if (typeof obj === 'object') {
                const newObj: { [key: string]: any } = {};
                for (const key in obj) {
                    newObj[key] = convertTimestamps(obj[key]);
                }
                return newObj;
            }
            return obj;
        };
        return convertTimestamps(data);
      });

      if (salesData.length < 5) {
        toast({ variant: "destructive", title: "Not Enough Data", description: "At least 5 sales in the last 30 days are needed to generate an analysis." });
        setLoading(false);
        return;
      }
      
      // 2. Fetch all product data for stock levels
      const productsQuery = query(collection(db, "products"));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        // Convert any timestamps in product data as well
        for (const key in data) {
            if (data[key] instanceof Timestamp) {
                (data as any)[key] = data[key].toDate().toISOString();
            }
        }
        return data;
      });

      // 3. Call the AI flow with serializable data
      const result = await generateInventoryInsights({
        salesData: salesData,
        productsData: productsData as any,
      });
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "AI-powered inventory insights have been generated." });

    } catch (error) {
      console.error("Error generating inventory analysis:", error);
      toast({ variant: "destructive", title: "Analysis Failed", description: "Could not generate the inventory analysis. The server might be busy. Please try again in a moment." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Predictive Analysis</h1>
        <p className="text-muted-foreground">
          Generate AI-powered inventory insights from your recent sales data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Inventory Purchase Advisor</CardTitle>
          <CardDescription>
            Analyze the last 30 days of sales to get suggestions on best/worst sellers and what products to reorder.
          </CardDescription>
        </CardHeader>
        <CardFooter>
            <Button onClick={handleGenerateAnalysis} disabled={loading}>
                {loading ? (
                    <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Sales Data...
                    </>
                ) : (
                    <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Insights
                    </>
                )}
            </Button>
        </CardFooter>
      </Card>
      
      {loading && (
        <div className="flex items-center justify-center p-12">
            <Loader className="h-12 w-12 animate-spin text-primary"/>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-8">
            <Alert>
                <NotepadText className="h-4 w-4" />
                <AlertTitle className="font-headline">AI Summary</AlertTitle>
                <AlertDescription>{analysisResult.summary}</AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <ArrowUp className="text-green-500"/> Top 5 Best Sellers
                        </CardTitle>
                         <CardDescription>Products with the highest sales volume in the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Product</TableHead><TableHead className="text-right">Units Sold</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisResult.bestSellers.map(p => (
                                    <TableRow key={p.productName}><TableCell className="font-medium">{p.productName}</TableCell><TableCell className="text-right">{p.unitsSold}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <ArrowDown className="text-red-500"/> Top 5 Worst Sellers
                        </CardTitle>
                         <CardDescription>Products with the lowest sales volume in the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow><TableHead>Product</TableHead><TableHead className="text-right">Units Sold</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisResult.worstSellers.map(p => (
                                    <TableRow key={p.productName}><TableCell className="font-medium">{p.productName}</TableCell><TableCell className="text-right">{p.unitsSold}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <ShoppingBasket /> Purchase Suggestions
                    </CardTitle>
                    <CardDescription>
                        AI recommendations for reordering stock to meet predicted demand.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {analysisResult.purchaseSuggestions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Current Stock</TableHead>
                                    <TableHead className="text-right">Predicted Sales (30d)</TableHead>
                                    <TableHead className="text-right">Suggested Reorder Qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisResult.purchaseSuggestions.map(p => (
                                    <TableRow key={p.productName}>
                                        <TableCell className="font-medium">{p.productName}</TableCell>
                                        <TableCell className="text-right">{p.currentStock}</TableCell>
                                        <TableCell className="text-right">{p.predictedSales}</TableCell>
                                        <TableCell className="text-right"><Badge>{p.suggestedPurchaseQuantity}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No immediate purchase suggestions. Stock levels for top sellers appear adequate for now.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
      )}
    </div>
  );
}
