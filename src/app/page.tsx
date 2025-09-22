"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      if (currentUser) {
        switch (currentUser.role) {
            case 'Admin':
              router.replace('/admin');
              break;
            case 'Supervisor':
              router.replace('/supervisor');
              break;
            case 'Coordinator':
              router.replace('/coordinator');
              break;
            case 'Collaborator':
              router.replace('/collaborator');
              break;
            default:
              router.replace('/login');
          }
      } else {
        // In development, redirect to admin page by default instead of login
        if (process.env.NODE_ENV === 'development') {
          router.replace('/admin');
        } else {
          router.replace("/login");
        }
      }
    }
  }, [router, currentUser, loading, isClient]);

  return (
     <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
  );
}
