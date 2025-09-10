"use client";
import { useRouter, useSearchParams } from "next/navigation";

const options = [
  { key: "all",  label: "전체" },
  { key: "csv",  label: "CSV" },
  { key: "api",  label: "API" },
  { key: "mock", label: "MOCK" },
];

export default function SourceChips() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("source") ?? "all";

  function setSource(v: string) {
    const q = new URLSearchParams(sp.toString());
    q.set("source", v);
    router.push(`?${q.toString()}`);
  }

  return (
    <div className="flex gap-2">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => setSource(o.key)}
          className={`px-3 py-1 rounded-2xl border ${current===o.key ? "bg-black text-white" : "bg-white"}`}
          aria-pressed={current===o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
