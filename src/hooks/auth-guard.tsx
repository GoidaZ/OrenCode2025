"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { Spinner } from "@/components/ui/spinner";

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isError, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    } 
  }, [isAuthenticated, isLoading, isError, user]);

  if (isLoading) return <Spinner />;

  return <>{children}</>;
}