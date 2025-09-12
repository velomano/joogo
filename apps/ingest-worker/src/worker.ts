// 클라우드플레어 Workers용 크론 작업
import { runCafe24Ingest } from './cron/cafe24-ingest';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 수동 실행 엔드포인트
    if (url.pathname === '/api/cron/run' && request.method === 'POST') {
      try {
        // 인증 확인
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.includes(env.CRON_SECRET)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 크론 작업 실행
        await runCafe24Ingest();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Cron job executed successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Cron job execution failed',
          error: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 크론 트리거 (자동 실행)
    if (url.pathname === '/cron' && request.method === 'POST') {
      try {
        console.log('🚀 Scheduled cron job triggered');
        await runCafe24Ingest();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Scheduled cron job completed'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('❌ Scheduled cron job failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 헬스체크
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  
  // 크론 트리거 핸들러
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext): Promise<void> {
    console.log('🕐 Cron trigger fired:', event.scheduledTime);
    
    try {
      await runCafe24Ingest();
      console.log('✅ Scheduled cron job completed');
    } catch (error) {
      console.error('❌ Scheduled cron job failed:', error);
    }
  }
};
