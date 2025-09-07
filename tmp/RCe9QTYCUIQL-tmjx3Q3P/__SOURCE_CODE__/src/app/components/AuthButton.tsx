// app/components/AuthButton.tsx
'use client';

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Chargement...</p>;

  if (session) {
    return (
      <div>
        <p>Bienvenue, {session.user?.name}</p>
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("github")}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Se connecter avec GitHub
    </button>
  );
}