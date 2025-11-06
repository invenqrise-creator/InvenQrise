
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface StockTransfer {
    id: string;
    source: string;
    destination: string;
    date: string;
    status: "Completed" | "In Transit" | "Pending Approval";
}

export default function TransfersPage() {
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "stockTransfers"));
                const transfersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockTransfer));
                setTransfers(transfersData);
            } catch (error) {
                console.error("Error fetching stock transfers: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransfers();
    }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Stock Transfers</h1>
        <p className="text-muted-foreground">
          Create, approve, and complete stock transfers between locations.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">Transfer List</CardTitle>
              <CardDescription>
                A list of all recent stock transfers.
              </CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Request Transfer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                ))
              ) : transfers.length > 0 ? (
                transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.id}</TableCell>
                    <TableCell>{transfer.source}</TableCell>
                    <TableCell>{transfer.destination}</TableCell>
                    <TableCell>{format(new Date(transfer.date), "PPP")}</TableCell>
                    <TableCell>
                        <Badge variant={
                            transfer.status === "Completed" ? "default" :
                            transfer.status === "In Transit" ? "secondary" :
                            "outline"
                        }
                        className={transfer.status === "Completed" ? "bg-accent text-accent-foreground" : ""}
                        >
                            {transfer.status}
                        </Badge>
                    </TableCell>
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {transfer.status === 'Pending Approval' && <DropdownMenuItem>Approve</DropdownMenuItem>}
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No stock transfers found.
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
