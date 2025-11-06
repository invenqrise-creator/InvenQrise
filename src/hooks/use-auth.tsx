
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export type UserRole = "Owner" | "Admin" | "Inventory Manager" | "Marketing Manager" | "Stock Keeper";

export type User = {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    storeId?: string; // Add storeId to the user type
};

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isInventoryManager: boolean;
  isMarketingManager: boolean;
  isStockKeeper: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            // If on the login page, let the form handle the logic.
            if (pathname === "/") {
                setUser(null); 
                setLoading(false);
                return;
            }

            if (fbUser) {
                // User is signed in
                const userDocRef = doc(db, "users", fbUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = { uid: fbUser.uid, ...userDoc.data() } as User;
                    setUser(userData);
                } else {
                    // User exists in Auth but not Firestore, log them out
                    setUser(null); 
                    await auth.signOut();
                    router.push("/");
                }
            } else {
                // User is signed out, redirect to login page
                setUser(null);
                if (pathname.startsWith('/dashboard')) {
                    router.push('/');
                }
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [router, pathname]);

    const value: AuthContextType = {
        user,
        firebaseUser,
        loading,
        isOwner: user?.role === 'Owner',
        isAdmin: user?.role === 'Owner' || user?.role === 'Admin',
        isInventoryManager: user?.role === 'Owner' || user?.role === 'Admin' || user?.role === 'Inventory Manager',
        isMarketingManager: user?.role === 'Owner' || user?.role === 'Admin' || user?.role === 'Marketing Manager',
        isStockKeeper: user?.role === 'Owner' || user?.role === 'Admin' || user?.role === 'Inventory Manager' || user?.role === 'Stock Keeper',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
