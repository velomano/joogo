import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Triggering GitHub Actions cron job...');
    
    const githubToken = process.env.PAT_TOKEN; // GitHub Personal Access Token
    const repo = process.env.REPO_NAME || 'your-username/joogo'; // 실제 레포지토리명으로 변경
    
    if (!githubToken) {
      return NextResponse.json({
        success: false,
        message: 'GitHub token not configured'
      }, { status: 500 });
    }
    
    // GitHub Actions 워크플로우 수동 실행
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/cron-ingest.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main', // main 브랜치에서 실행
        inputs: {
          force_run: 'true'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      throw new Error(`GitHub API error: ${response.status} ${errorText}`);
    }
    
    console.log('✅ GitHub Actions cron job triggered successfully');
    
    return NextResponse.json({
      success: true,
      message: 'GitHub Actions cron job triggered successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to trigger GitHub Actions:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to trigger GitHub Actions',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
