
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export interface Sale {
    id: string;
    customer: {
        name: string;
        email: string;
    };
    amount: number;
    date: string;
}

interface RecentSalesProps {
    sales: Sale[];
    loading?: boolean;
}

export function RecentSales({ sales, loading }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="ml-auto h-4 w-12" />
            </div>
        ))
      ) : sales.length > 0 ? (
        sales.map((sale) => (
            <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9">
                <AvatarImage
                src={`https://picsum.photos/100/100?random=${sale.id}`}
                alt="Avatar"
                />
                <AvatarFallback>
                {sale.customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                {sale.customer.name}
                </p>
                <p className="text-sm text-muted-foreground">
                {sale.customer.email}
                </p>
            </div>
            <div className="ml-auto font-medium">+₹{sale.amount.toFixed(2)}</div>
            </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center">No recent sales.</p>
      )}
    </div>
  );
}
