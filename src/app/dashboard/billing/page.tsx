
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, writeBatch, increment, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCodeScanner } from "@/components/dashboard/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ShoppingCart, Trash2, XCircle, UserPlus, Contact } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Customer, CustomerSearchDialog } from "@/components/dashboard/customer-search-dialog";
import { Input } from "@/components/ui/input";
import { sendLowStockEmail } from "@/ai/flows/send-low-stock-email";
import { sendBillingEmail } from "@/ai/flows/send-billing-email";

const LOW_STOCK_THRESHOLD = 20;

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: {
    "front-of-house": number;
    "back-of-house": number;
  }
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function BillingPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleScan = async (scannedBarcode: string) => {
    setIsScannerOpen(false);

    if (!user?.storeId && user?.role !== 'Owner') {
        toast({ variant: "destructive", title: "Action Forbidden", description: "You are not assigned to a store to bill from." });
        return;
    }
    
    // Check if the item is already in the cart
    const productRef = collection(db, "products");
    let q = query(productRef, where("barcode", "==", scannedBarcode));

    // Scope query to user's store if they are not an owner
    if (user?.role !== 'Owner' && user?.storeId) {
        q = query(q, where("storeId", "==", user.storeId));
    }


    try {
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        const productData = productDoc.data() as Omit<Product, 'id'>;
        const productId = productDoc.id;

        const existingCartItem = cart.find(item => item.id === productId);

        if (existingCartItem) {
            if (existingCartItem.cartQuantity < productData.stock["front-of-house"]) {
                 setCart(cart.map(item => 
                    item.id === productId 
                    ? { ...item, cartQuantity: item.cartQuantity + 1 } 
                    : item
                ));
            } else {
                toast({
                    variant: "destructive",
                    title: "Stock Limit Reached",
                    description: `No more units of ${productData.name} available at the front-of-house.`,
                });
            }
        } else {
            if(productData.stock["front-of-house"] > 0) {
                const newCartItem: CartItem = {
                    id: productId,
                    name: productData.name,
                    price: productData.price,
                    imageUrl: productData.imageUrl,
                    stock: productData.stock,
                    cartQuantity: 1,
                };
                setCart(prevCart => [...prevCart, newCartItem]);
            } else {
                toast({
                    variant: "destructive",
                    title: "Out of Stock",
                    description: `${productData.name} is out of stock at the front-of-house.`,
                });
            }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Product Not Found",
          description: "This QR code does not match any product in your store's database.",
        });
      }
    } catch (error) {
      console.error("Error handling scanned item for billing:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not fetch product details.",
      });
    }
  };

  const handleQuantityChange = (productId: string, newQuantityValue: number | string) => {
    const newQuantity = typeof newQuantityValue === 'string' ? parseInt(newQuantityValue, 10) : newQuantityValue;

    setCart(cart.map(item => {
        if (item.id === productId) {
            // If input is empty/invalid, keep the current quantity or set to 1
            if (isNaN(newQuantity) || newQuantity < 1) {
                return { ...item, cartQuantity: 1 };
            }
            if (newQuantity > item.stock["front-of-house"]) {
                toast({
                    variant: "destructive",
                    title: "Stock Limit Reached",
                    description: `Only ${item.stock["front-of-house"]} units of ${item.name} available.`,
                });
                return { ...item, cartQuantity: item.stock["front-of-house"] };
            }
            return { ...item, cartQuantity: newQuantity };
        }
        return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);

  const completeSale = async () => {
    if (cart.length === 0) {
        toast({ title: "Empty Cart", description: "Scan items to add them to the cart before completing a sale." });
        return;
    }
    if (!selectedCustomer) {
        toast({ variant: "destructive", title: "Customer Not Selected", description: "Please select or add a customer before completing the sale." });
        return;
    }


    setLoading(true);
    const batch = writeBatch(db);
    const salesCollectionRef = collection(db, "sales");
    const saleDate = new Date().toISOString();

    // 1. Decrement stock for each item in the cart
    for (const cartItem of cart) {
        const productRef = doc(db, "products", cartItem.id);
        batch.update(productRef, { "stock.front-of-house": increment(-cartItem.cartQuantity) });
    }

    // 2. Create a new sale document
    const saleData = {
        amount: cartTotal,
        customer: { 
            id: selectedCustomer.id,
            name: selectedCustomer.name, 
            email: selectedCustomer.email 
        },
        date: saleDate,
        storeId: user?.storeId || "Online",
        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.cartQuantity,
            price: item.price,
        })),
    };
    
    try {
        await batch.commit(); // Commit stock updates
        const saleDocRef = await addDoc(salesCollectionRef, saleData); // Add the sale record and get its reference

        toast({
            title: "Sale Completed!",
            description: `Successfully processed ${cart.length} item(s). Stock and sales records have been updated.`,
        });

        // 3. Send billing email
        sendBillingEmail({
            recipientEmail: selectedCustomer.email,
            recipientName: selectedCustomer.name,
            saleId: saleDocRef.id,
            saleDate: saleDate,
            items: saleData.items,
            totalAmount: saleData.amount,
            storeId: saleData.storeId,
        }).then(response => {
            if (response.success) {
                toast({ title: "Receipt Sent", description: response.message });
            } else {
                 toast({ variant: "destructive", title: "Email Failed", description: response.message });
            }
        });


        // 4. Check for low stock and send email
        for (const cartItem of cart) {
            const productRef = doc(db, "products", cartItem.id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const productData = productSnap.data();
                const totalStock = (productData.stock?.["front-of-house"] || 0) + (productData.stock?.["back-of-house"] || 0);

                if (totalStock <= LOW_STOCK_THRESHOLD) {
                    // Send email non-blocking in the background
                    sendLowStockEmail({
                        productName: productData.name,
                        currentStock: totalStock,
                        storeId: productData.storeId || "N/A",
                        recipientEmail: user?.email || "", // Send to the current user
                    }).then(response => {
                        if (response.success) {
                             toast({ title: "Low Stock Alert Sent", description: `An email for ${productData.name} has been sent.` });
                        }
                    });
                }
            }
        }


        setCart([]); // Clear the cart
        setSelectedCustomer(null); // Clear selected customer
    } catch (error) {
        console.error("Error completing sale:", error);
        toast({
            variant: "destructive",
            title: "Sale Failed",
            description: "There was an error updating records. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerDialogOpen(false);
    toast({
        title: "Customer Selected",
        description: `${customer.name} is now associated with this sale.`
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <QrCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
      <CustomerSearchDialog 
        isOpen={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Billing / Point of Sale</h1>
        <p className="text-muted-foreground">
          Scan products to add them to the customer's cart and complete the sale{user?.storeId && ` for ${user.storeId}`}.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Customer Cart</CardTitle>
                    <CardDescription>Items scanned for the current transaction.</CardDescription>
                </CardHeader>
                <CardContent>
                    {cart.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Item</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="w-[100px] text-right">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"><span className="sr-only">Remove</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover"/>
                                        </TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Input 
                                                type="number" 
                                                value={item.cartQuantity || ''}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                onBlur={(e) => {
                                                    if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                                        handleQuantityChange(item.id, 1);
                                                    }
                                                }}
                                                min="1"
                                                max={item.stock["front-of-house"]}
                                                className="w-20 text-right h-8"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">₹{(item.price * item.cartQuantity).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                                <XCircle className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                            <ShoppingCart className="mx-auto h-12 w-12" />
                            <p className="mt-4">The cart is empty. Start scanning to add items.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex justify-between items-center bg-muted/50 p-4 rounded-b-lg">
                    <div className="text-lg font-bold">Grand Total</div>
                    <div className="text-2xl font-headline">₹{cartTotal.toFixed(2)}</div>
                </CardFooter>
            </Card>
        </div>
        
        <div className="md:col-span-1">
            <Card className="sticky top-8">
                <CardHeader>
                    <CardTitle className="font-headline">Transaction</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <div className="space-y-2">
                        <h3 className="text-sm font-medium">Customer</h3>
                        {selectedCustomer ? (
                            <Card className="p-3 bg-secondary">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{selectedCustomer.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
                                </div>
                            </Card>
                        ) : (
                             <Button variant="outline" className="w-full justify-start" onClick={() => setIsCustomerDialogOpen(true)}>
                                <UserPlus className="mr-2" />
                                Select or Add Customer
                            </Button>
                        )}
                       
                    </div>
                    <Button size="lg" onClick={() => setIsScannerOpen(true)}>
                        <QrCode className="mr-2"/>
                        Scan Item
                    </Button>
                     <Button size="lg" variant="destructive" onClick={() => setCart([])} disabled={cart.length === 0}>
                        <Trash2 className="mr-2"/>
                        Clear Cart
                    </Button>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={completeSale} disabled={loading || cart.length === 0 || !selectedCustomer}>
                        {loading ? "Processing..." : "Complete Sale"}
                    </Button>
                </CardFooter>
            </Card>
        </div>

      </div>
    </div>
  );
}
