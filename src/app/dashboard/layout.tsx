
"use client";
import React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSkeleton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {
  Archive,
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  Contact,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  ScanLine,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InvenQriseIcon } from "@/components/icons";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { ModeToggle } from "@/components/theme-toggle";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["Owner", "Admin", "Inventory Manager", "Marketing Manager", "Stock Keeper"]},
    { 
        id: "inventory",
        icon: Archive, 
        label: "Inventory", 
        roles: ["Owner", "Admin", "Inventory Manager", "Stock Keeper"],
        subItems: [
            { href: "/dashboard/products", label: "Products", roles: ["Owner", "Admin", "Inventory Manager", "Stock Keeper"] },
            { href: "/dashboard/inventory", label: "Stock Levels", roles: ["Owner", "Admin", "Inventory Manager", "Stock Keeper"] },
            { href: "/dashboard/transfers", label: "Stock Transfers", roles: ["Owner", "Admin", "Inventory Manager", "Stock Keeper"] },
            { href: "/dashboard/scan-stock", label: "Scan to Stock", roles: ["Owner", "Admin", "Stock Keeper"] },
        ]
    },
    { href: "/dashboard/orders", icon: ShoppingCart, label: "Sales", roles: ["Owner", "Admin", "Inventory Manager"] },
    { href: "/dashboard/categories", icon: Package, label: "Categories", roles: ["Owner", "Admin", "Inventory Manager"] },
    { href: "/dashboard/billing", icon: CircleDollarSign, label: "Billing / POS", roles: ["Owner", "Admin", "Inventory Manager"] },
    { href: "/dashboard/customers", icon: Contact, label: "Customers", roles: ["Owner", "Admin", "Marketing Manager", "Inventory Manager"] },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Sales Data", roles: ["Owner", "Admin", "Marketing Manager"] },
    { href: "/dashboard/reports", icon: FileText, label: "Reports", roles: ["Owner", "Admin", "Marketing Manager"] },
    { href: "/dashboard/predictive-analysis", icon: TrendingUp, label: "Predictive Analysis", roles: ["Owner", "Admin", "Marketing Manager"] },
    { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns", roles: ["Owner", "Admin", "Marketing Manager"] },
    { href: "/dashboard/ai-tools", icon: BrainCircuit, label: "AI Tools", roles: ["Owner", "Admin", "Inventory Manager", "Marketing Manager"] },
    { href: "/dashboard/users", icon: Users, label: "Users", roles: ["Owner", "Admin"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const hasAccess = (roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
  }

  const isSubItemActive = (subItems: any[]) => {
    return subItems.some(item => pathname === item.href);
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <InvenQriseIcon className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-headline font-bold text-sidebar-foreground">
                InvenQrise
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {loading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : (
                navItems.map((item) => {
                    if (!hasAccess(item.roles)) return null;

                    if (item.subItems) {
                        return (
                            <SidebarGroup key={item.id}>
                                <SidebarMenuButton
                                    isSubmenu
                                    isActive={isSubItemActive(item.subItems)}
                                    className="pr-4"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                <SidebarMenuSub>
                                    {item.subItems.map(subItem => (
                                        hasAccess(subItem.roles) && (
                                            <SidebarMenuSubItem key={subItem.href}>
                                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                                    <Link href={subItem.href}>
                                                        {subItem.label}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )
                                    ))}
                                </SidebarMenuSub>
                            </SidebarGroup>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={{
                                    children: item.label,
                                    className: "font-body",
                                }}
                            >
                                <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                    tooltip={{
                      children: "Settings",
                      className: "font-body",
                    }}
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {loading ? (
                <div className="flex items-center gap-2 p-2">
                   <SidebarMenuSkeleton />
                </div>
              ) : user && (
                <SidebarMenuItem>
                    <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || `https://picsum.photos/seed/${user.uid}/100/100`} />
                            <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-medium text-sm truncate">{user.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                    </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="flex items-center justify-between p-4 border-b md:justify-end gap-4">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2"/>
                        Log Out
                    </Button>
                </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-screen-2xl">
                    {loading ? <p>Loading...</p> : children}
                </div>
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
