
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCategoryDialog } from "@/components/dashboard/create-category-dialog";

interface Category {
    id: string;
    name: string;
    productCount: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const fetchCategoriesAndCounts = async () => {
        setLoading(true);
        try {
            // Fetch all products to count them per category
            const productsSnapshot = await getDocs(collection(db, "products"));
            const productCounts = productsSnapshot.docs.reduce((acc, doc) => {
                const product = doc.data();
                const category = product.category || "Uncategorized";
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Fetch all categories from the 'categories' collection
            const categoriesSnapshot = await getDocs(collection(db, "categories"));
            const categoriesData = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                productCount: productCounts[doc.data().name] || 0
            })).sort((a, b) => a.name.localeCompare(b.name));
            
            setCategories(categoriesData);

        } catch (error) {
            console.error("Error fetching categories and products: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategoriesAndCounts();
    }, []);


  return (
    <>
    <CreateCategoryDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCategoryCreated={fetchCategoriesAndCounts}
    />
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Organize your products into categories.
        </p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline">Category List</CardTitle>
                    <CardDescription>Manage your product categories.</CardDescription>
                </div>
                 <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Category
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-right">Product Count</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => (
                    <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">
                        {category.productCount}
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
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                        No categories found. Create one to get started.
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
