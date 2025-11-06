
"use client";

import { AlertTriangle, PackageSearch } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export interface LowStockProduct {
  id: string;
  name: string;
  stock: {
    "front-of-house": number;
    "back-of-house": number;
  };
  storeId?: string;
}

interface LowStockAlertsProps {
  products: LowStockProduct[];
  loading: boolean;
}

export function LowStockAlerts({ products, loading }: LowStockAlertsProps) {
  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardContent>
        </Card>
    )
  }
  
  if (products.length === 0) {
    return null; // Don't render anything if there are no low stock products
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Low Stock Warning ({products.length} items)</AlertTitle>
      <AlertDescription>
        The following items are running low on stock. Consider reordering soon.
      </AlertDescription>
      <Card className="mt-4 bg-background text-foreground shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Total Stock</TableHead>
                <TableHead className="w-[110px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const totalStock =
                  (product.stock["front-of-house"] || 0) +
                  (product.stock["back-of-house"] || 0);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.storeId || "Online"}</TableCell>
                    <TableCell className="text-right">{totalStock}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/products/edit/${product.id}`}>
                                <PackageSearch className="mr-2 h-3 w-3"/>
                                View
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Alert>
  );
}
