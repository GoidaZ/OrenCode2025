'use client'
import authService from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isError, refetch: user_refresh } = useQuery({
    queryKey: ["getMe"],
    queryFn: () => authService.me(),
  });

  const isAuthenticated = Boolean(user && !isError)

  return {
    user,
    user_refresh,
    isAuthenticated,
    isLoading,
    isError,
  }
}