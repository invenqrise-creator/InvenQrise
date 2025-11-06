
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import Papa from "papaparse";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ImportProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

interface ProductCSVRow {
    name: string;
    category: string;
    price: string;
    stock_foh: string;
    stock_boh: string;
    barcode: string;
    storeId: string;
}

export function ImportProductsDialog({ isOpen, onClose, onImportCompleted }: ImportProductsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user, isOwner } = useAuth();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please select a CSV file to import." });
      return;
    }
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to import products." });
        return;
    }

    setLoading(true);

    Papa.parse<ProductCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const products = results.data;
        if (products.length === 0) {
            toast({ variant: "destructive", title: "Empty File", description: "The selected CSV file is empty or invalid." });
            setLoading(false);
            return;
        }

        const batch = writeBatch(db);
        const productsCollection = collection(db, "products");

        let importedCount = 0;
        for (const product of products) {
            // Basic validation
            if (!product.name || !product.category || isNaN(parseFloat(product.price))) {
                console.warn("Skipping invalid row:", product);
                continue;
            }

            const storeId = isOwner ? product.storeId : user.storeId;
            if (!storeId) {
                console.warn("Skipping row with no storeId:", product);
                continue;
            }

            const newProductRef = doc(productsCollection);
            batch.set(newProductRef, {
                name: product.name,
                category: product.category,
                price: parseFloat(product.price) || 0,
                stock: {
                    "front-of-house": parseInt(product.stock_foh, 10) || 0,
                    "back-of-house": parseInt(product.stock_boh, 10) || 0,
                },
                barcode: product.barcode || "",
                storeId: storeId,
                imageUrl: `https://picsum.photos/400/400?random=${Math.random()}`,
                aiHint: product.name.split(" ").slice(0, 2).join(" "),
            });
            importedCount++;
        }

        try {
            await batch.commit();
            toast({
                title: "Import Successful!",
                description: `${importedCount} products have been added to the database.`
            });
            onImportCompleted();
            onClose();
        } catch (error) {
            console.error("Error importing products:", error);
            toast({ variant: "destructive", title: "Import Failed", description: "An error occurred while writing to the database." });
        } finally {
            setLoading(false);
        }
      },
      error: (error: any) => {
        toast({ variant: "destructive", title: "Parsing Error", description: `Failed to parse CSV file: ${error.message}` });
        setLoading(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple products at once. The file must have the correct headers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Alert>
                <AlertTitle>CSV Format Requirements</AlertTitle>
                <AlertDescription>
                    Your CSV must contain the following headers: <strong>name, category, price, stock_foh, stock_boh, barcode, storeId</strong>. The `storeId` column is only required if you are an Owner.
                </AlertDescription>
            </Alert>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
                <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import Products
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
