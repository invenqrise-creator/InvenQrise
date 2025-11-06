
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCustomerDialog } from "@/components/dashboard/create-customer-dialog";
import { ImportCustomersDialog } from "@/components/dashboard/import-customers-dialog";


export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);


  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <>
    <CreateCustomerDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCustomerCreated={fetchCustomers}
    />
    <ImportCustomersDialog
      isOpen={isImportDialogOpen}
      onClose={() => setIsImportDialogOpen(false)}
      onImportCompleted={fetchCustomers}
    />
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          View and manage your customer database.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">Customer List</CardTitle>
              <CardDescription>
                A list of all customers in your records.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import from CSV
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Customer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">City</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                    <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{customer.city}</TableCell>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        No customers found.
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
