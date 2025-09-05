"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
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
        router.replace("/login");
      }
    }
  }, [router, currentUser, loading]);

  return (
     <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
  );
}
