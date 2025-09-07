"use client";
import { useSession } from "next-auth/react";
import AuthButton from "../components/AuthButton";

export default function LoginPage() {
  const { data: session } = useSession();

  // Access token is available after login
  const accessToken = (session as any)?.accessToken;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connexion</h1>
      <AuthButton />
      {accessToken && <p>Access Token: {accessToken}</p>}
    </div>
  );
}