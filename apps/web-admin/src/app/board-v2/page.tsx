import { PageShell, Section } from "@/components/ui/Shell";
import KpiRow from "@/components/board-v2/KpiRow";

export default function BoardV2() {
  return (
    <PageShell
      title="판매 보드 v2"
      actions={<span className="text-xs text-muted">2025-01-01 ~ 2025-12-31 · Mock API</span>}
    >
      <Section title="핵심 지표">
        <KpiRow />
      </Section>

      <Section title="일매출 추이" desc="최근 90일">
        {/* react-chartjs-2 라인차트: 축/그리드 연한 회색, 포인트 없음 */}
        <div className="h-[260px]">[Chart Here]</div>
      </Section>

      <Section title="브레이크다운">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="primer-card p-4">채널별 기여</div>
          <div className="primer-card p-4">지역별 매출</div>
          <div className="primer-card p-4">Top SKU</div>
        </div>
      </Section>

      <Section title="인사이트">
        <ul className="text-sm leading-6 text-fg">
          <li>• 날씨 온도와 매출 상관계수 0.85</li>
          <li>• ROAS 1.99 → 채널B에서 급락</li>
        </ul>
      </Section>
    </PageShell>
  );
}