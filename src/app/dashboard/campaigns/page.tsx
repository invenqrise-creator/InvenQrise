
"use client"

import * as React from "react"
import { format } from "date-fns"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button"
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
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
  import { Skeleton } from "@/components/ui/skeleton";
import { CreateCampaignDialog } from "@/components/dashboard/create-campaign-dialog";


  interface Campaign {
    id: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string;
    status: "Active" | "Upcoming" | "Finished";
  }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "campaigns"));
      const campaignsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
      
      // Calculate status based on dates
      const today = new Date();
      const processedCampaigns = campaignsData.map(c => {
        const startDate = new Date(c.startDate);
        const endDate = new Date(c.endDate);
        let status: "Active" | "Upcoming" | "Finished" = "Finished";
        if (today >= startDate && today <= endDate) {
          status = "Active";
        } else if (today < startDate) {
          status = "Upcoming";
        }
        return { ...c, status };
      });

      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns: ", error);
    } finally {
      setLoading(false);
    }
  };


  React.useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <>
    <CreateCampaignDialog
      isOpen={isCreateDialogOpen}
      onClose={() => setIsCreateDialogOpen(false)}
      onCampaignCreated={fetchCampaigns}
    />
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Marketing Campaigns</h1>
        <p className="text-muted-foreground">
          Create and manage your marketing efforts.
        </p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline">Campaigns List</CardTitle>
                    <CardDescription>All past, active, and upcoming campaigns.</CardDescription>
                </div>
                 <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                ))
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.category}</TableCell>
                    <TableCell>{format(new Date(campaign.startDate), "PPP")}</TableCell>
                    <TableCell>{format(new Date(campaign.endDate), "PPP")}</TableCell>
                    <TableCell>
                        <Badge variant={
                            campaign.status === "Active" ? "default" :
                            campaign.status === "Upcoming" ? "secondary" :
                            "outline"
                        }
                        className={campaign.status === "Active" ? "bg-accent text-accent-foreground" : ""}
                        >
                            {campaign.status}
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
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
                        No campaigns found.
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
