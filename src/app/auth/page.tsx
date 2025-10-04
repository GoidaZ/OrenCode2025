"use client";
import authService from "@/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const params = useSearchParams();
  const router = useRouter()

  const handleLogin = () => {
    const keycloakAuthUrl = new URL(
      "http://localhost:8080/realms/test/protocol/openid-connect/auth"
    );
    keycloakAuthUrl.searchParams.set("client_id", "backend");
    keycloakAuthUrl.searchParams.set(
      "redirect_uri",
      "http://localhost:3000/auth"
    );
    keycloakAuthUrl.searchParams.set("response_type", "code");
    keycloakAuthUrl.searchParams.set("scope", "openid email profile");

    window.location.href = keycloakAuthUrl.toString();
  };

  const hendleCallback = async (code: string) => {
    try {
      const data = await authService.callback(code as string);
      console.log(data);
      if (!data.id_token) await handleLogin();
      localStorage.setItem("token", data.id_token);
      router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const code = params.get("code");
    if (!code) handleLogin();
    else hendleCallback(code);
  }, [params]);

  return (
    <div className="h-screen flex items-center justify-center font-medium">
      Идёт переадресация...
    </div>
  );
}
