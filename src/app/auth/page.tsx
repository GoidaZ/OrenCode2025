import { Suspense } from "react";
import AuthPageClient from "./AuthPageClient";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <AuthPageClient />
    </Suspense>
  );
}
