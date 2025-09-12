import { createServer } from 'http';
import { runCafe24Ingest } from './cron/cafe24-ingest';

const PORT = process.env.INGEST_WORKER_PORT || 3001;

const server = createServer(async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/cron/run') {
    try {
      console.log('🚀 Manual cron job triggered via HTTP');
      
      // 인증 확인
      const authHeader = req.headers.authorization;
      const expectedSecret = process.env.CRON_SECRET || 'dev-secret';
      
      if (!authHeader || !authHeader.includes(expectedSecret)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      
      // 크론 작업 실행
      await runCafe24Ingest();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Cron job executed successfully',
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ Cron job HTTP error:', error);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Cron job execution failed',
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Ingest worker server running on port ${PORT}`);
  console.log(`📊 Cron endpoint: http://localhost:${PORT}/api/cron/run`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

export default server;
