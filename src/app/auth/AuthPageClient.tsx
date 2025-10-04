"use client";

import authService from "@/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = () => {
    const keycloakAuthUrl = new URL(
      "http://localhost:8080/realms/test/protocol/openid-connect/auth"
    );
    keycloakAuthUrl.searchParams.set("client_id", "backend");
    keycloakAuthUrl.searchParams.set("redirect_uri", "http://localhost:3000/auth");
    keycloakAuthUrl.searchParams.set("response_type", "code");
    keycloakAuthUrl.searchParams.set("scope", "openid email profile");

    window.location.href = keycloakAuthUrl.toString();
  };

  const handleCallback = async (code: string) => {
    try {
      const data = await authService.callback(code);
      if (!data.id_token) return handleLogin();
      localStorage.setItem("token", data.id_token);
      router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) handleLogin();
    else handleCallback(code);
  }, [searchParams]);

  return (
    <div className="h-screen flex items-center justify-center font-medium">
      Идёт переадресация...
    </div>
  );
}
