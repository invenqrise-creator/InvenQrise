
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { startOfMonth, endOfMonth } from "date-fns";

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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

interface Sale {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  date: string;
  amount: number;
  storeId?: string;
  items: SaleItem[];
}

interface MonthlyStat {
    name: string;
    quantity: number;
}


export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [highestSold, setHighestSold] = useState<MonthlyStat | null>(null);
  const [lowestSold, setLowestSold] = useState<MonthlyStat | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSales = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(salesQuery);
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setSales(salesData);

        // --- Calculate monthly stats ---
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const monthlySales = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });

        if (monthlySales.length > 0) {
            const productSales = new Map<string, { name: string; quantity: number }>();

            monthlySales.forEach(sale => {
                sale.items.forEach(item => {
                    const current = productSales.get(item.productId);
                    if (current) {
                        productSales.set(item.productId, { name: item.name, quantity: current.quantity + item.quantity });
                    } else {
                        productSales.set(item.productId, { name: item.name, quantity: item.quantity });
                    }
                });
            });

            if (productSales.size > 0) {
                const sortedProducts = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity);
                setHighestSold(sortedProducts[0]);
                setLowestSold(sortedProducts[sortedProducts.length - 1]);
            }
        }
        // --- End of monthly stats calculation ---

      } catch (error) {
        console.error("Error fetching sales: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch sales history."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [user, toast]);

  return (
    <div className="flex flex-col gap-8">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month's Top Seller</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-4/5"/> : highestSold ? (
                        <>
                        <div className="text-2xl font-bold">{highestSold.name}</div>
                        <p className="text-xs text-muted-foreground">{highestSold.quantity} units sold</p>
                        </>
                    ) : <p className="text-sm text-muted-foreground">Not enough data.</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month's Slowest Seller</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-8 w-4/5"/> : lowestSold ? (
                        <>
                        <div className="text-2xl font-bold">{lowestSold.name}</div>
                        <p className="text-xs text-muted-foreground">{lowestSold.quantity} units sold</p>
                        </>
                    ) : <p className="text-sm text-muted-foreground">Not enough data.</p>}
                </CardContent>
            </Card>
        </div>
        <div>
            <h1 className="text-3xl font-headline tracking-tight">Sales History</h1>
            <p className="text-muted-foreground">
            View all completed sales and transactions.
            </p>
        </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">All Sales</CardTitle>
              <CardDescription>
                A list of all sales recorded in the system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                ))
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                    <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                    <TableCell className="font-medium">{sale.customer.name}</TableCell>
                    <TableCell>{format(new Date(sale.date), "PPP p")}</TableCell>
                    <TableCell>{sale.storeId || "Online"}</TableCell>
                    <TableCell className="text-right">₹{sale.amount.toFixed(2)}</TableCell>
                    <TableCell>
                        <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="font-body">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem disabled>View Details (soon)</DropdownMenuItem>
                            <DropdownMenuItem disabled>Print Receipt (soon)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No sales found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
