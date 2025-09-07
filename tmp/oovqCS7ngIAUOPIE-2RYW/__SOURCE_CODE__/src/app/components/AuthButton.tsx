// app/components/AuthButton.tsx
'use client';

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  // if (status === "loading") return <p>Chargement...</p>;

  if (session) {
    return (
      <div>
        <Button
          onClick={() => signOut()}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => signIn("github")}
    >
      Contiue with github
    </Button>
  );
}