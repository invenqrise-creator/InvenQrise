
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const LOW_STOCK_THRESHOLD = 20;

interface Product {
    id: string;
    name: string;
    stock: {
        "front-of-house": number;
        "back-of-house": number;
    };
    storeId?: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        let productsQuery = query(collection(db, "products"));
        // If user is not an Owner, filter products by their storeId
        if (user.role !== 'Owner' && user.storeId) {
            productsQuery = query(productsQuery, where("storeId", "==", user.storeId));
        }

        const querySnapshot = await getDocs(productsQuery);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products for inventory: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch inventory data." });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, toast]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Stock Levels</h1>
        <p className="text-muted-foreground">
          Track stock levels for your products {user?.storeId && `at ${user.storeId}`}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Product Stock</CardTitle>
          <CardDescription>
            Detailed view of stock across all locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                {user?.role === 'Owner' && <TableHead>Store</TableHead>}
                <TableHead>Front-of-house</TableHead>
                <TableHead>Back-of-house</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    {user?.role === 'Owner' && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => {
                  const totalStock = (product.stock?.["front-of-house"] || 0) + (product.stock?.["back-of-house"] || 0);
                  const isLowStock = totalStock <= LOW_STOCK_THRESHOLD;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      {user?.role === 'Owner' && <TableCell>{product.storeId || 'N/A'}</TableCell>}
                      <TableCell>{product.stock?.["front-of-house"] ?? 0}</TableCell>
                      <TableCell>{product.stock?.["back-of-house"] ?? 0}</TableCell>
                      <TableCell>{totalStock}</TableCell>
                      <TableCell className="text-right">
                        {isLowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                 <TableRow>
                  <TableCell colSpan={user?.role === 'Owner' ? 6 : 5} className="text-center h-24">
                    No inventory data found.
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
