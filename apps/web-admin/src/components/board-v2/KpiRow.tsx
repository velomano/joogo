import KpiCard from "./KpiCard";

export default function KpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard label="총 매출" value="₩2,274,396,563" sub="365일 평균 ₩6,231,223" />
      <KpiCard label="총 주문수" value="1,137건" sub="일평균 3건" />
      <KpiCard label="평균 ROAS" value="1.99" sub="광고비 1원당 1.99원 수익" />
      <KpiCard label="성장률" value="+12.5%" sub="전월 대비" trend="up" />
    </div>
  );
}