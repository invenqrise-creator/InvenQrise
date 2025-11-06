
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { MoreHorizontal, PlusCircle, QrCode, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCodeScanner } from "@/components/dashboard/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ImportProductsDialog } from "@/components/dashboard/import-products-dialog";
import { format, isBefore, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";

// Define the type for a single product
interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: {
        "front-of-house": number;
        "back-of-house": number;
    };
    imageUrl: string;
    aiHint: string;
    barcode?: string;
    storeId?: string;
    expiryDate?: string;
    createdAt?: Timestamp;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let productsQuery = query(collection(db, "products"));
      // If user is not an Owner, filter products by their storeId
      if (user.role !== 'Owner' && user.storeId) {
          productsQuery = query(collection(db, "products"), where("storeId", "==", user.storeId));
      }
      
      const querySnapshot = await getDocs(productsQuery);
      let productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      // Sort products on the client-side
      productsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0); // Fallback for old products
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Separate recent products from the rest
      const recent = productsData.slice(0, 3);
      const rest = productsData.slice(3);

      setRecentProducts(recent);
      setProducts(rest);

    } catch (error) {
      console.error("Error fetching products: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch products.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleScan = async (scannedBarcode: string) => {
    setIsScannerOpen(false);
    
    let productQuery = query(collection(db, "products"), where("barcode", "==", scannedBarcode));
    if(user?.role !== 'Owner' && user?.storeId) {
        productQuery = query(productQuery, where("storeId", "==", user.storeId));
    }
    
    try {
      const querySnapshot = await getDocs(productQuery);
      
      if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        toast({
          title: "Product Found",
          description: `Redirecting to edit page for ${productDoc.data().name}.`,
        });
        router.push(`/dashboard/products/edit/${productDoc.id}`);
      } else {
        toast({
          title: "New QR Code Scanned",
          description: "Redirecting to add a new product.",
        });
        router.push(`/dashboard/products/new?barcode=${scannedBarcode}`);
      }
    } catch (error) {
      console.error("Error checking for product:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not verify QR code against the database.",
      });
    }
  };

  const getExpiryStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return "none";
    const date = new Date(expiryDate);
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);

    if (isBefore(date, today) || isToday(date)) return "expired";
    if (isBefore(date, sevenDaysFromNow)) return "expiring_soon";
    return "valid";
  }

  return (
    <>
      <QrCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
      <ImportProductsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportCompleted={fetchProducts}
      />
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-headline tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Browse and manage your product catalog {user?.storeId && `for ${user.storeId}`}.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import from CSV
            </Button>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" /> Scan to Edit/Add
            </Button>
            <Button asChild>
                <Link href="/dashboard/products/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                </Link>
            </Button>
          </div>
        </div>

        {/* Recent Additions Section */}
        {(loading || recentProducts.length > 0) && (
            <div className="space-y-4">
                <h2 className="text-2xl font-headline tracking-tight">Recent Additions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader><Skeleton className="h-40 w-full rounded-md" /></CardHeader>
                                <CardContent><Skeleton className="h-6 w-3/4" /></CardContent>
                                <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
                            </Card>
                        ))
                    ) : (
                        recentProducts.map(product => (
                            <Card key={product.id}>
                                <CardHeader className="p-0">
                                    <Image
                                        alt={product.name}
                                        className="aspect-video w-full rounded-t-lg object-cover"
                                        height="200"
                                        width="350"
                                        src={product.imageUrl || 'https://placehold.co/350x200'}
                                        data-ai-hint={product.aiHint}
                                    />
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg">{product.name}</h3>
                                    <Badge variant="secondary">{product.category}</Badge>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button asChild size="sm">
                                      <Link href={`/dashboard/products/edit/${product.id}`}>Edit Product</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* All Products Table */}
        <Card>
          <CardHeader>
              <CardTitle className="font-headline">Product List</CardTitle>
              <CardDescription>All products available in your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Total Stock
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Expires On</TableHead>
                  {user?.role === "Owner" && <TableHead>Store</TableHead>}
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-16 w-16 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {user?.role === "Owner" && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      <TableCell>
                        <div className="flex justify-end">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length > 0 || recentProducts.length > 0 ? (
                  products.map((product) => {
                    const totalStock = Object.values(product.stock || {}).reduce(
                      (acc, val) => acc + val,
                      0
                    );
                    const expiryStatus = getExpiryStatus(product.expiryDate);
                    return (
                      <TableRow key={product.id} className={cn({
                        "bg-red-500/10 hover:bg-red-500/20": expiryStatus === "expired",
                        "bg-yellow-500/10 hover:bg-yellow-500/20": expiryStatus === "expiring_soon",
                      })}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            width="64"
                            src={product.imageUrl || 'https://placehold.co/64x64'}
                            data-ai-hint={product.aiHint}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.barcode || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          ₹{product.price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {totalStock}
                        </TableCell>
                        <TableCell className={cn("hidden md:table-cell", {
                            "text-red-600 font-medium": expiryStatus === "expired",
                            "text-yellow-600": expiryStatus === "expiring_soon",
                        })}>
                          {product.expiryDate ? format(new Date(product.expiryDate), "PPP") : 'N/A'}
                        </TableCell>
                        {user?.role === "Owner" && <TableCell>{product.storeId || 'N/A'}</TableCell>}
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
                                  <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/products/edit/${product.id}`}>Edit</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={user?.role === "Owner" ? 9 : 8} className="text-center h-24">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    