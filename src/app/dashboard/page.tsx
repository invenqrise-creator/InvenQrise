
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addDays, isBefore, startOfToday, getDaysInMonth, format } from "date-fns";

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSales, Sale } from "@/components/dashboard/recent-sales";
import SalesChart from "@/components/dashboard/sales-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { DollarSign, Package, ShoppingCart, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LowStockAlerts, LowStockProduct } from "@/components/dashboard/low-stock-alerts";
import { ExpiringSoonAlerts, ExpiringProduct } from "@/components/dashboard/expiring-soon-alerts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";


const LOW_STOCK_THRESHOLD = 20;
const EXPIRATION_THRESHOLD_DAYS = 5;

const chartConfig = {
  total: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
};

export default function DashboardPage() {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [allSalesData, setAllSalesData] = useState<Sale[]>([]);
  const [dailyChartData, setDailyChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [chartGranularity, setChartGranularity] = useState<"daily" | "monthly">("daily");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState<ExpiringProduct[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  
  const processDataForCharts = (sales: Sale[]) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const monthlySales = Array.from({ length: 12 }, (_, i) => ({
          name: format(new Date(currentYear, i), "MMM"),
          total: 0,
          monthIndex: i
      }));

      sales.forEach(sale => {
          const saleDate = new Date(sale.date);
          if(saleDate.getFullYear() === currentYear) {
              const month = saleDate.getMonth();
              monthlySales[month].total += sale.amount;
          }
      });
      setMonthlyChartData(monthlySales);

      if (selectedMonth === null) {
        updateDailyChart(sales, now.getMonth());
      }
  };
  
  const updateDailyChart = (sales: Sale[], monthIndex: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const dateForMonth = new Date(currentYear, monthIndex);
    const daysInMonth = getDaysInMonth(dateForMonth);

    const dailySales = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        total: 0,
    }));
    
    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        if(saleDate.getFullYear() === currentYear && saleDate.getMonth() === monthIndex) {
            const dayOfMonth = saleDate.getDate();
            dailySales[dayOfMonth - 1].total += sale.amount;
        }
    });
    setDailyChartData(dailySales);
  };
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(5));
      const salesSnapshot = await getDocs(salesQuery);
      const salesListData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setRecentSales(salesListData);

      const productsSnapshot = await getDocs(collection(db, "products"));
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allSalesSnapshot = await getDocs(collection(db, "sales"));
      
      const allSales = allSalesSnapshot.docs.map(doc => doc.data() as Sale);
      setAllSalesData(allSales);
      const totalRevenue = allSales.reduce((acc, sale) => acc + sale.amount, 0);

      setStats({
        totalRevenue,
        totalSales: allSales.length,
        totalProducts: productsSnapshot.size,
        activeUsers: usersSnapshot.size,
      });

      processDataForCharts(allSales);

      if (isAdmin) {
        let productsQuery = query(collection(db, "products"));
        if (user?.role === 'Admin' && user.storeId) {
          productsQuery = query(productsQuery, where("storeId", "==", user.storeId));
        }
        const allProductsSnapshot = await getDocs(productsQuery);
        const allProducts = allProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (LowStockProduct & ExpiringProduct)));
        
        const today = startOfToday();
        const expirationLimitDate = addDays(today, EXPIRATION_THRESHOLD_DAYS);

        const lowItems = allProducts.filter(product => {
          const totalStock = (product.stock?.["front-of-house"] || 0) + (product.stock?.["back-of-house"] || 0);
          return totalStock <= LOW_STOCK_THRESHOLD;
        });
        setLowStockProducts(lowItems);

        const expiringItems = allProducts.filter(product => {
          if (!product.expiryDate) return false;
          const expiry = new Date(product.expiryDate);
          return isBefore(expiry, expirationLimitDate) && !isBefore(expiry, today);
        });
        setExpiringSoonProducts(expiringItems);
      }

    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, isAdmin]);

    useEffect(() => {
        if (allSalesData.length > 0) {
            if(selectedMonth !== null) {
                updateDailyChart(allSalesData, selectedMonth);
            } else {
                updateDailyChart(allSalesData, new Date().getMonth());
            }
        }
    }, [selectedMonth, allSalesData]);

    const handleBarClick = (data: any) => {
        if (chartGranularity === 'monthly' && data && data.activePayload && data.activePayload[0]) {
            const monthIndex = data.activePayload[0].payload.monthIndex;
            setSelectedMonth(monthIndex);
            setChartGranularity('daily');
        }
    };

    const handleBackToMonthly = () => {
        setSelectedMonth(null);
        setChartGranularity('monthly');
    };

  const isOwner = user?.role === 'Owner';
  const canViewSensitiveData = isOwner || user?.role === 'Admin' || user?.role === 'Marketing Manager';
  
  const welcomeTitle = user?.role === 'Owner' ? 'Dashboard' : (user?.storeId || 'Dashboard');
  const welcomeMessage = user?.role === 'Owner' 
    ? "Welcome back! Here's a quick overview of all your stores."
    : `Welcome back! Here's a quick overview of your store.`;

  const chartData = chartGranularity === 'daily' ? dailyChartData : monthlyChartData;
  let chartDescription = "";
    if (chartGranularity === 'monthly') {
        chartDescription = "Monthly sales revenue for the current year. Click a bar to see daily data.";
    } else if (selectedMonth !== null) {
        const monthName = format(new Date(new Date().getFullYear(), selectedMonth), 'MMMM');
        chartDescription = `Daily sales revenue for ${monthName}.`;
    } else {
        chartDescription = "Daily sales revenue for the current month.";
    }

  return (
     <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">
          {welcomeTitle}
        </h1>
        <p className="text-muted-foreground">
          {welcomeMessage}
        </p>
      </div>

      <div className="space-y-4">
        {isAdmin && <LowStockAlerts products={lowStockProducts} loading={loading} />}
        {isAdmin && <ExpiringSoonAlerts products={expiringSoonProducts} loading={loading} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canViewSensitiveData && (
          <>
            <OverviewCards 
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              description="From all sales"
              loading={loading}
            />
            <OverviewCards 
              title="Sales"
              value={`+${stats.totalSales}`}
              icon={ShoppingCart}
              description="Total sales recorded"
              loading={loading}
            />
          </>
        )}
        <OverviewCards 
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          description="Across all categories"
          loading={loading}
        />
         {canViewSensitiveData && (
            <OverviewCards 
              title="Active Users"
              value={`+${stats.activeUsers}`}
              icon={Users}
              description="Total users registered"
              loading={loading}
            />
         )}
      </div>
      {canViewSensitiveData ? (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-8 xl:col-span-8">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                      {selectedMonth !== null && chartGranularity === 'daily' && (
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBackToMonthly}>
                               <ArrowLeft className="h-4 w-4" />
                           </Button>
                      )}
                      <CardTitle className="font-headline">Overview</CardTitle>
                  </div>
                  <CardDescription>{chartDescription}</CardDescription>
                </div>
                <Tabs 
                    value={chartGranularity} 
                    onValueChange={(value) => {
                        if (value === 'monthly') {
                            handleBackToMonthly();
                        } else {
                            // When toggling to daily, show current month not a selected one
                            setSelectedMonth(null); 
                            setChartGranularity('daily');
                        }
                    }} 
                    className="space-y-4"
                >
                    <TabsList>
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <SalesChart data={chartData} onBarClick={handleBarClick} />
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="col-span-12 lg:col-span-4 xl:col-span-4">
            <CardHeader>
              <CardTitle className="font-headline">Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentSales sales={recentSales} loading={loading}/>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Welcome</CardTitle>
            <CardDescription>Your dashboard is set up. Use the navigation on the left to access your tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view sales data. Please contact an administrator if you believe this is an error.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
