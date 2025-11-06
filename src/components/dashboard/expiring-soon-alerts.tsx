
"use client";

import { Clock, PackageSearch } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export interface ExpiringProduct {
  id: string;
  name: string;
  expiryDate?: string;
  storeId?: string;
}

interface ExpiringSoonAlertsProps {
  products: ExpiringProduct[];
  loading: boolean;
}

export function ExpiringSoonAlerts({ products, loading }: ExpiringSoonAlertsProps) {
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
    return null; // Don't render anything if there are no expiring products
  }

  return (
    <Alert className="border-yellow-500/50 text-yellow-600 dark:border-yellow-500/50 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-500">
      <Clock className="h-4 w-4" />
      <AlertTitle className="text-yellow-700 dark:text-yellow-500">Products Expiring Soon ({products.length} items)</AlertTitle>
      <AlertDescription>
        The following items are expiring within 5 days.
      </AlertDescription>
      <Card className="mt-4 bg-background text-foreground shadow-none border-yellow-500/30">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Expires On</TableHead>
                <TableHead className="w-[110px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.storeId || "Online"}</TableCell>
                    <TableCell className="text-right">{product.expiryDate ? format(new Date(product.expiryDate), "PPP") : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/products/edit/${product.id}`}>
                                <PackageSearch className="mr-2 h-3 w-3"/>
                                View
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Alert>
  );
}
