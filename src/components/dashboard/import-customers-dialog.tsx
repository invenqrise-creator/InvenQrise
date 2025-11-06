
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

interface ImportCustomersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

interface CustomerCSVRow {
    name: string;
    email: string;
    phone: string;
    city: string;
}

export function ImportCustomersDialog({ isOpen, onClose, onImportCompleted }: ImportCustomersDialogProps) {
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

    Papa.parse<CustomerCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const customers = results.data;
        if (customers.length === 0) {
            toast({ variant: "destructive", title: "Empty File", description: "The selected CSV file is empty or invalid." });
            setLoading(false);
            return;
        }

        const batch = writeBatch(db);
        const customersCollection = collection(db, "customers");

        let importedCount = 0;
        for (const customer of customers) {
            // Basic validation
            if (!customer.name || !customer.email || !customer.phone || !customer.city) {
                console.warn("Skipping invalid row:", customer);
                continue;
            }

            const newCustomerRef = doc(customersCollection);
            batch.set(newCustomerRef, {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                city: customer.city,
            });
            importedCount++;
        }

        try {
            await batch.commit();
            toast({
                title: "Import Successful!",
                description: `${importedCount} customers have been added to the database.`
            });
            onImportCompleted();
            onClose();
        } catch (error) {
            console.error("Error importing customers:", error);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple customers at once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Alert>
                <AlertTitle>CSV Format Requirements</AlertTitle>
                <AlertDescription>
                    Your CSV must contain the following headers: <strong>name, email, phone, city</strong>.
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
                    Import Customers
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
