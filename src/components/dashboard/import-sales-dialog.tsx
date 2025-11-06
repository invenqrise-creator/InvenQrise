
"use client";

import { useState } from "react";
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
import Papa from "papaparse";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ScrollArea } from "../ui/scroll-area";

interface ImportSalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

interface SaleCSVRow {
    date: string; // ISO format: "2024-01-15T10:30:00Z"
    customer_name: string;
    customer_email: string;
    store_id: string;
    amount: string; // "150.75"
    items: string; // JSON string: '[{"productId":"prod_001","name":"Organic Apples","quantity":3,"price":2.99}]'
}

export function ImportSalesDialog({ isOpen, onClose, onImportCompleted }: ImportSalesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  
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

    setLoading(true);

    Papa.parse<SaleCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const sales = results.data;
        if (sales.length === 0) {
            toast({ variant: "destructive", title: "Empty File", description: "The selected CSV file is empty or invalid." });
            setLoading(false);
            return;
        }

        const batch = writeBatch(db);
        const salesCollection = collection(db, "sales");

        let importedCount = 0;
        let errorCount = 0;

        for (const sale of sales) {
            try {
                // Basic validation
                if (!sale.date || !sale.customer_name || !sale.customer_email || !sale.amount || !sale.items) {
                    console.warn("Skipping invalid row (missing data):", sale);
                    errorCount++;
                    continue;
                }

                const newSaleRef = doc(salesCollection);
                const parsedItems = JSON.parse(sale.items);

                batch.set(newSaleRef, {
                    date: new Date(sale.date).toISOString(),
                    customer: {
                        name: sale.customer_name,
                        email: sale.customer_email,
                        // In a real scenario, you might want to link to an existing customer ID
                    },
                    storeId: sale.store_id || "Online",
                    amount: parseFloat(sale.amount),
                    items: parsedItems,
                });
                importedCount++;

            } catch (e) {
                console.error("Skipping row due to parsing error:", sale, e);
                errorCount++;
                continue;
            }
        }

        if (importedCount === 0 && errorCount > 0) {
            toast({ variant: "destructive", title: "Import Failed", description: `All ${errorCount} rows in the CSV contained errors. Please check the format.` });
            setLoading(false);
            return;
        }

        try {
            await batch.commit();
            toast({
                title: "Import Successful!",
                description: `${importedCount} sales have been added to the database. ${errorCount > 0 ? `${errorCount} rows were skipped due to errors.` : ''}`
            });
            onImportCompleted();
            onClose();
        } catch (error) {
            console.error("Error importing sales:", error);
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setFile(null);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Sales from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add historical sales data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Alert>
                <AlertTitle>CSV Format Requirements</AlertTitle>
                <AlertDescription>
                    <p>Your CSV must contain the following headers:</p>
                    <ul className="list-disc list-inside mt-2 text-xs">
                        <li><strong>date</strong>: The date of the sale in ISO format (e.g., `2024-05-21T14:30:00Z`).</li>
                        <li><strong>customer_name</strong>: The customer's full name.</li>
                        <li><strong>customer_email</strong>: The customer's email address.</li>
                        <li><strong>store_id</strong>: The ID of the store (e.g., "Downtown").</li>
                        <li><strong>amount</strong>: The total sale amount (e.g., `45.99`).</li>
                        <li><strong>items</strong>: A JSON string representing the items sold.</li>
                    </ul>
                    <p className="mt-2 text-xs"><strong>Items JSON Format Example:</strong></p>
                    <ScrollArea className="mt-1 max-h-24 w-full rounded-md border p-2">
                    <pre className="text-xs bg-muted/50 p-2 rounded">
                        <code>
                            {'[{"productId":"prod_001","name":"Organic Apples","quantity":2,"price":2.99}]'}
                        </code>
                    </pre>
                    </ScrollArea>

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
                    Import Sales
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
