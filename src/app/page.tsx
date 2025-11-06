
"use client"

import * as React from "react";
import { LoginForm } from "@/components/auth/login-form";
import { InvenQriseIcon } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center space-y-4 mb-8">
        <InvenQriseIcon className="w-16 h-16 text-primary" />
        <h1 className="text-4xl font-headline font-bold text-foreground">InvenQrise</h1>
        <p className="text-muted-foreground">Smart Inventory Management for Supermarkets</p>
      </div>
       <Card className="w-full max-w-sm">
        <CardContent className="p-0">
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
