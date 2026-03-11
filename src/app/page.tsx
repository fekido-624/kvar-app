"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-primary rounded-lg mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}