
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Search, UserPlus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { CreateCustomerDialog } from "./create-customer-dialog";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}

interface CustomerSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerSearchDialog({ isOpen, onClose, onSelectCustomer }: CustomerSearchDialogProps) {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setAllCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch customers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);
  
  const handleCustomerCreated = () => {
    fetchCustomers(); // Refetch customers after a new one is created
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return allCustomers;
    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allCustomers]);


  return (
    <>
      <CreateCustomerDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Search for an existing customer or add a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="animate-spin text-muted-foreground" />
                </div>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onSelectCustomer(customer)}>
                      Select
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No customers found.</p>
              )}
            </div>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(true)}>
                <UserPlus className="mr-2"/>
                Create New Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
