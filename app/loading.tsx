"use client";

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
    </div>
  );
}