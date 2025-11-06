
"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfToday, endOfToday, startOfYesterday, endOfYesterday, subMonths } from "date-fns";
import { DateRange } from "react-day-picker";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Download, Loader, Wand2, LineChart, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSalesProjection, GenerateSalesProjectionOutput } from "@/ai/flows/generate-sales-projection";
import { sendReportEmail } from "@/ai/flows/send-report-email";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";


export default function ReportsPage() {
  const [loading, setLoading] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [generatingProjection, setGeneratingProjection] = React.useState(false);
  const [projectionResult, setProjectionResult] = React.useState<GenerateSalesProjectionOutput | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();


  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [projectionDate, setProjectionDate] = React.useState<DateRange | undefined>({
    from: subDays(startOfMonth(new Date()), 90),
    to: endOfMonth(new Date()),
  });

  // Set initial email to current user's email
  React.useEffect(() => {
    if (user?.email) {
        setRecipientEmail(user.email);
    }
  }, [user]);

  const getSalesData = React.useCallback(async (dateRange: DateRange) => {
    const salesQuery = query(
      collection(db, "sales"),
      where("date", ">=", dateRange.from!.toISOString()),
      where("date", "<=", dateRange.to!.toISOString()),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(salesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, []);

  const handleDownloadSalesReport = async () => {
    if (!date?.from || !date?.to) {
      toast({
        variant: "destructive",
        title: "Date Range Required",
        description: "Please select a start and end date for the report.",
      });
      return;
    }

    setLoading(true);

    try {
      const sales = await getSalesData(date);

      if (sales.length === 0) {
        toast({
            title: "No Data Found",
            description: "There are no sales in the selected date range.",
        });
        return;
      }

      // Convert data to CSV format
      const headers = ["SaleID", "Date", "CustomerName", "CustomerEmail", "Store", "TotalAmount", "Items"];
      const csvRows = [headers.join(",")];

      for (const sale of sales) {
        const values = [
            sale.id,
            format(new Date(sale.date), "yyyy-MM-dd HH:mm:ss"),
            `"${sale.customer.name}"`,
            sale.customer.email,
            sale.storeId || "N/A",
            sale.amount,
            `"${sale.items.map((i: any) => `${i.quantity}x ${i.name}`).join("; ")}"`
        ].join(',');
        csvRows.push(values);
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const
 
fileName = `sales-report-${format(date.from, "yyyy-MM-dd")}-to-${format(date.to, "yyyy-MM-dd")}.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Downloaded",
        description: `Successfully generated ${fileName}.`,
      });

    } catch (error) {
      console.error("Error generating sales report:", error);
      toast({
        variant: "destructive",
        title: "Report Failed",
        description: "Could not generate or download the sales report.",
      });
    } finally {
      setLoading(false);
    }
  };

    const handleSendEmailReport = async () => {
    if (!date?.from || !date?.to) {
      toast({ variant: "destructive", title: "Date Range Required", description: "Please select a date range for the report." });
      return;
    }
    if (!recipientEmail) {
      toast({ variant: "destructive", title: "Recipient Required", description: "Please enter an email address." });
      return;
    }
    setSendingEmail(true);
    try {
      const sales = await getSalesData(date);
      if (sales.length === 0) {
        toast({ title: "No Data", description: "No sales data in selected range to email." });
        setSendingEmail(false);
        return;
      }

      const response = await sendReportEmail({
        recipientEmail,
        salesData: sales,
        dateRange: { from: format(date.from, "PPP"), to: format(date.to, "PPP") },
      });
      
      if (response.success) {
        toast({ title: "Email Sent!", description: response.message });
      } else {
        toast({ variant: "destructive", title: "Email Failed", description: response.message, duration: 9000 });
      }

    } catch (error) {
      console.error("Error sending email report:", error);
      toast({ variant: "destructive", title: "Email Failed", description: "Could not send the email report." });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGenerateProjection = async () => {
    if (!projectionDate?.from || !projectionDate?.to) {
        toast({ variant: "destructive", title: "Date Range Required", description: "Please select a date range for historical data."});
        return;
    }

    setGeneratingProjection(true);
    setProjectionResult(null);

    try {
        const salesQuery = query(
            collection(db, "sales"),
            where("date", ">=", projectionDate.from.toISOString()),
            where("date", "<=", projectionDate.to.toISOString()),
            orderBy("date", "asc") // Order chronologically for analysis
        );
        const querySnapshot = await getDocs(salesQuery);
        const historicalSales = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.date,
                amount: data.amount,
            }
        });

        if (historicalSales.length < 10) {
            toast({ variant: "destructive", title: "Not Enough Data", description: "Need at least 10 sales in the selected range to generate a meaningful projection." });
            setGeneratingProjection(false);
            return;
        }

        const result = await generateSalesProjection({ historicalSales });
        setProjectionResult(result);

    } catch (error) {
        console.error("Error generating sales projection:", error);
        toast({ variant: "destructive", title: "Projection Failed", description: "Could not generate the sales projection." });
    } finally {
        setGeneratingProjection(false);
    }
  }

  const DateRangePresetButton = ({ label, range }: { label: string, range: DateRange }) => (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={() => setDate(range)}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Reports & Projections</h1>
        <p className="text-muted-foreground">
          Download your data or generate AI-powered insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Sales Report Download</CardTitle>
                <CardDescription>
                    Select a date range to download a report of all sales activity.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <p className="font-medium text-sm">Select Date Range</p>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex w-auto p-0" align="start">
                           <div className="flex flex-col space-y-2 border-r p-4">
                                <DateRangePresetButton label="Today" range={{ from: startOfToday(), to: endOfToday() }} />
                                <DateRangePresetButton label="Yesterday" range={{ from: startOfYesterday(), to: endOfYesterday() }} />
                                <DateRangePresetButton label="Last 7 Days" range={{ from: subDays(new Date(), 6), to: new Date() }} />
                                <DateRangePresetButton label="Last 30 Days" range={{ from: subDays(new Date(), 29), to: new Date() }} />
                                <Separator />
                                <DateRangePresetButton label="This Month" range={{ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }} />
                                <DateRangePresetButton label="Last Month" range={{ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }} />
                           </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardFooter className="gap-4">
                    <Button onClick={handleDownloadSalesReport} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </>
                    )}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Email Sales Report</CardTitle>
                    <CardDescription>
                        Send the sales report for the selected date range to an email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <p className="font-medium text-sm mb-2">Recipient Email</p>
                        <Input
                            type="email"
                            placeholder="recipient@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSendEmailReport} disabled={sendingEmail}>
                        {sendingEmail ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Report
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">AI Sales Projection</CardTitle>
                <CardDescription>
                    Use historical data to forecast sales for the next 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <div className="grid gap-2">
                    <p className="font-medium text-sm">Select Historical Data Range</p>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="projectionDate"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !projectionDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {projectionDate?.from ? (
                            projectionDate.to ? (
                            <>
                                {format(projectionDate.from, "LLL dd, y")} -{" "}
                                {format(projectionDate.to, "LLL dd, y")}
                            </>
                            ) : (
                            format(projectionDate.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={projectionDate?.from}
                        selected={projectionDate}
                        onSelect={setProjectionDate}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                    </Popover>
                </div>

                {generatingProjection && (
                    <div className="flex items-center justify-center p-8">
                        <Loader className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                )}


                {projectionResult && (
                    <Card className="w-full bg-accent/30 mt-4">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center gap-2">
                                <LineChart />
                                Next 30-Day Sales Forecast
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-sm mb-1">Projected Revenue</h3>
                                <p className="text-2xl font-bold text-primary">
                                    {projectionResult.projectedRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm mb-1">Projected Sales Count</h3>
                                <p className="text-2xl font-bold text-primary">{projectionResult.projectedSalesCount}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm mb-1">AI-Powered Summary</h3>
                                <p className="text-muted-foreground text-sm">{projectionResult.summary}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
             <CardFooter>
                <Button onClick={handleGenerateProjection} disabled={generatingProjection}>
                    {generatingProjection ? (
                        <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Projection
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
