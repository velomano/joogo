export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 테스트 페이지</h1>
      <p>Next.js가 정상적으로 작동하고 있습니다!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>📋 현재 상태:</h3>
        <ul>
          <li>✅ Next.js 서버 실행 중</li>
          <li>✅ 페이지 렌더링 정상</li>
          <li>✅ TypeScript 컴파일 정상</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/admin/items/upload" style={{ 
          display: 'inline-block', 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px' 
        }}>
          📤 업로드 페이지로 이동
        </a>
      </div>
    </div>
  );
}


