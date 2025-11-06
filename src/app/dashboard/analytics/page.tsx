
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDaysInMonth, format, getMonth, parse } from "date-fns";


import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSales, Sale } from "@/components/dashboard/recent-sales";
import SalesChart from "@/components/dashboard/sales-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { DollarSign, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportSalesDialog } from "@/components/dashboard/import-sales-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Users, ShoppingCart, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const chartConfig = {
  total: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
};

export default function AnalyticsPage() {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [allSalesData, setAllSalesData] = useState<Sale[]>([]);
  const [dailyChartData, setDailyChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [chartGranularity, setChartGranularity] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgSaleValue: 0,
    newCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { user, isAdmin } = useAuth();


  const processDataForCharts = (sales: Sale[]) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Process data for the MONTHLY chart: Monthly sales for the current year
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

      // By default, set the daily chart for the current month if no month is selected
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


  const fetchSalesData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
        const salesSnapshot = await getDocs(salesQuery);
        
        const salesListData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setRecentSales(salesListData.slice(0, 5));
        setAllSalesData(salesListData);

        const totalRevenue = salesListData.reduce((acc, sale) => acc + sale.amount, 0);
        const totalSales = salesListData.length;
        const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const newCustomers = customersSnapshot.size;

        setStats({
          totalRevenue,
          totalSales,
          avgSaleValue,
          newCustomers
        });

        processDataForCharts(salesListData);

      } catch (error) {
        console.error("Error fetching sales data: ", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchSalesData();
    }, [user]);


    useEffect(() => {
        if (allSalesData.length > 0) {
            if(selectedMonth !== null) {
                updateDailyChart(allSalesData, selectedMonth);
            } else {
                // When going back to monthly, reset daily chart to current month
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

  if (!isAdmin) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>You do not have permission to view this page.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p>Please contact an administrator if you believe this is an error.</p>
              </CardContent>
          </Card>
      )
  }

  const chartData = chartGranularity === 'daily' ? dailyChartData : monthlyChartData;
  
  let chartDescription = "";
  if (chartGranularity === 'monthly') {
      chartDescription = "A chart of total sales revenue per month for the current year. Click a bar to see daily data.";
  } else {
      const monthName = format(new Date(new Date().getFullYear(), selectedMonth ?? new Date().getMonth()), 'MMMM');
      chartDescription = `A chart of total sales revenue per day for ${monthName}.`;
  }

  return (
    <>
    <ImportSalesDialog
      isOpen={isImportDialogOpen}
      onClose={() => setIsImportDialogOpen(false)}
      onImportCompleted={fetchSalesData}
    />
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-headline tracking-tight">Sales Analytics</h1>
            <p className="text-muted-foreground">
            Analyze your sales performance and trends.
            </p>
        </div>
         <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import Sales
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <OverviewCards 
          title="Average Sale Value"
          value={`₹${stats.avgSaleValue.toFixed(2)}`}
          icon={DollarSign}
          description="Average per transaction"
          loading={loading}
        />
         <OverviewCards 
          title="New Customers"
          value={`+${stats.newCustomers}`}
          icon={Users}
          description="Total customers registered"
          loading={loading}
        />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 xl:col-span-8">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {selectedMonth !== null && (
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBackToMonthly}>
                             <ArrowLeft className="h-4 w-4" />
                         </Button>
                    )}
                    <CardTitle className="font-headline">Sales Overview</CardTitle>
                </div>
              <CardDescription>{chartDescription}</CardDescription>
            </div>
            <Tabs 
                value={chartGranularity} 
                onValueChange={(value) => {
                    if (value === 'monthly') {
                       handleBackToMonthly();
                    } else {
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
            <CardDescription>A list of the most recent sales from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales sales={recentSales} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
