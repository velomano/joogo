type Props = {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
};

export default function KpiCard({ label, value, sub, trend="flat" }: Props) {
  const tone =
    trend === "up" ? "text-success"
    : trend === "down" ? "text-danger"
    : "text-fg";
  return (
    <div className="primer-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-[22px] font-semibold leading-tight ${tone}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}