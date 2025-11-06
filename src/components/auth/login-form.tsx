
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, type User as FirebaseAuthUser } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { sendOtpEmail } from "@/ai/flows/send-otp-email";
import type { User } from "@/hooks/use-auth";

type LoginStep = "credentials" | "otp";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<LoginStep>("credentials");

  // State to hold data between steps
  const [expectedOtp, setExpectedOtp] = useState<string | null>(null);
  const [tempFbUser, setTempFbUser] = useState<FirebaseAuthUser | null>(null);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Verify credentials with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // 2. Fetch user role from Firestore
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);


      if (!userDocSnap.exists()) {
        throw new Error("User document not found in database.");
      }

      const userDoc = userDocSnap.data() as User;
      const userRole = userDoc.role;

      // 3. Check if 2FA is required
      if (userRole === "Owner" || userRole === "Admin") {
        // 2FA required: Send OTP and move to OTP step
        setTempFbUser(fbUser);
        const otpResponse = await sendOtpEmail({ email: userDoc.email, name: userDoc.name });
        if (otpResponse.success) {
          setExpectedOtp(otpResponse.otp);
          setStep("otp");
          toast({ title: "Check your email", description: "An OTP has been sent to your registered email address." });
        } else {
          throw new Error(otpResponse.message || "Failed to send OTP. Please try again.");
        }
      } else {
        // No 2FA required: Login is successful, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password. Please try again.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed login attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message || "Failed to sign in. Please check your credentials.";
          break;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
      await auth.signOut(); // Sign out if any part of the process fails
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (otp === expectedOtp) {
      toast({ title: "Success!", description: "You have been successfully logged in."});
      router.push('/dashboard');
    } else {
      setError("Invalid OTP. Please try again.");
      toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect."});
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    setLoading(true);
    await auth.signOut();
    setStep("credentials");
    setOtp("");
    setExpectedOtp(null);
    setTempFbUser(null);
    setError(null);
    setLoading(false);
  }

  if (step === "otp") {
    return (
      <Card className="w-full max-w-sm border-none shadow-none">
        <form onSubmit={handleOtpSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Enter Security Code</CardTitle>
            <CardDescription>
              Check your email for the 6-digit code we sent to {email}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="_ _ _ _ _ _" 
                  required 
                  className="pl-10 tracking-[0.5em] text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  suppressHydrationWarning
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" className="w-full" disabled={loading} suppressHydrationWarning>
              {loading ? <><Loader className="animate-spin" />Verifying...</> : "Verify & Sign In"}
            </Button>
            <Button variant="link" size="sm" onClick={handleBackToLogin} disabled={loading}>
                Back to login
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-none shadow-none">
      <form onSubmit={handleCredentialSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                required 
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button type="submit" className="w-full" disabled={loading} suppressHydrationWarning>
            {loading ? (
              <>
                <Loader className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
