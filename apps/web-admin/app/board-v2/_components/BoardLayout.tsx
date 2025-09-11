'use client'; import { ReactNode } from 'react';
export default function BoardLayout({children}:{children:ReactNode}){return(
  <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">{children}</div>
  </div>
);}
