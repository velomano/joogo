import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joogo - 판매·재고·마케팅 통합 보드",
  description: "ALL-IN-ONE 분석 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="app-layout">
          {/* 상단 헤더 */}
          <header className="app-header">
            <div className="header-content">
              <div className="logo-section">
                <a href="/" className="logo-link">
                  <div className="logo">Joogo</div>
                  <div className="company-name">Joogo Test Company</div>
                </a>
              </div>
              
              <nav className="main-nav">
                <a href="/board" className="nav-link">대시보드레거시</a>
                <a href="/board-upload-log" className="nav-link">보드업로드 로그</a>
              </nav>
              
              <div className="status-section">
                <div className="status-badge">시스템 정상</div>
              </div>
            </div>
          </header>

          {/* 메인 콘텐츠 */}
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}