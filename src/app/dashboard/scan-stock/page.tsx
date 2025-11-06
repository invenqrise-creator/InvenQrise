
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCodeScanner } from "@/components/dashboard/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { PackagePlus, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";


export default function ScanStockPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleScan = async (scannedBarcode: string) => {
    setIsScannerOpen(false);

    if (!user?.storeId && user?.role !== 'Owner') {
        toast({ variant: "destructive", title: "Action Forbidden", description: "You are not assigned to a store." });
        return;
    }
    
    let productQuery = query(collection(db, "products"), where("barcode", "==", scannedBarcode));
    // Admins can only scan products for their own store
    if (user.role === 'Admin' && user.storeId) {
        productQuery = query(productQuery, where("storeId", "==", user.storeId));
    }

    try {
      const querySnapshot = await getDocs(productQuery);
      
      if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        const docRef = doc(db, "products", productDoc.id);

        // Increment stock in the back-of-house
        await updateDoc(docRef, {
            "stock.back-of-house": increment(1)
        });

        toast({
          title: "Stock Updated!",
          description: `1 unit of ${productDoc.data().name} has been added to the back-of-house stock.`,
        });

      } else {
        toast({
          title: "New Product Scanned",
          description: "This QR code isn't in your database. Let's add it as a new product.",
        });
        router.push(`/dashboard/products/new?barcode=${scannedBarcode}`);
      }
    } catch (error) {
      console.error("Error handling scanned stock:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not update stock levels.",
      });
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <QrCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Scan to Stock</h1>
        <p className="text-muted-foreground">
          Quickly add incoming inventory by scanning product QR codes.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Stock-In Scanner</CardTitle>
            <CardDescription>
                Click the button below to open your camera and start scanning items to add them to your inventory for your store: {user?.storeId || "Online"}.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-12">
            <PackagePlus className="w-24 h-24 text-muted-foreground/50" />
            <Button size="lg" onClick={() => setIsScannerOpen(true)}>
                <QrCode className="mr-2"/>
                Start Scanning
            </Button>
            <Alert className="max-w-md text-left">
                <AlertTitle>How it Works</AlertTitle>
                <AlertDescription>
                    If a scanned product is already in your database for your store, its "back-of-house" stock will be increased by one. If it's a new product, you will be taken to the "Add Product" form to enter its details.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
