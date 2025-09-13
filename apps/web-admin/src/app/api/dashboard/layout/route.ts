import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase/server';
import { getCacheHeaders } from '../../../lib/cache';

const LayoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
  static: z.boolean().optional(),
  isDraggable: z.boolean().optional(),
  isResizable: z.boolean().optional(),
});

const LayoutSchema = z.array(LayoutItemSchema);

const SaveLayoutRequestSchema = z.object({
  page: z.enum(['sales', 'inventory', 'ai', 'help']),
  layout: LayoutSchema,
  tenantId: z.string().uuid().optional(),
});

const GetLayoutRequestSchema = z.object({
  page: z.enum(['sales', 'inventory', 'ai', 'help']),
  tenantId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const tenantId = searchParams.get('tenant_id');
    
    const { page: validatedPage, tenantId: validatedTenantId } = GetLayoutRequestSchema.parse({
      page,
      tenantId: tenantId || undefined,
    });

    // TODO: 실제 사용자 ID 가져오기 (인증 구현 후)
    const userId = '00000000-0000-0000-0000-000000000001'; // 임시 사용자 ID
    const finalTenantId = validatedTenantId || '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('layout')
      .eq('user_id', userId)
      .eq('tenant_id', finalTenantId)
      .eq('page', validatedPage)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Layout 조회 오류:', error);
      return NextResponse.json({ error: 'Layout 조회 실패' }, { status: 500 });
    }

    const response = NextResponse.json({ 
      layout: data?.layout || getDefaultLayout(validatedPage),
      success: true 
    });
    
    Object.entries(getCacheHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Layout API 오류:', error);
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, layout, tenantId } = SaveLayoutRequestSchema.parse(body);

    // TODO: 실제 사용자 ID 가져오기 (인증 구현 후)
    const userId = '00000000-0000-0000-0000-000000000001'; // 임시 사용자 ID
    const finalTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    const { error } = await supabase
      .from('user_dashboard_layouts')
      .upsert({
        user_id: userId,
        tenant_id: finalTenantId,
        page,
        layout,
      }, {
        onConflict: 'user_id,tenant_id,page'
      });

    if (error) {
      console.error('Layout 저장 오류:', error);
      return NextResponse.json({ error: 'Layout 저장 실패' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    
    Object.entries(getCacheHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Layout API 오류:', error);
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }
}

// 기본 레이아웃 정의
function getDefaultLayout(page: string) {
  const defaultLayouts = {
    sales: [
      { i: 'kpi', x: 0, y: 0, w: 12, h: 2 },
      { i: 'trend', x: 0, y: 2, w: 8, h: 4 },
      { i: 'calendar', x: 8, y: 2, w: 4, h: 4 },
      { i: 'channel', x: 0, y: 6, w: 6, h: 4 },
      { i: 'region', x: 6, y: 6, w: 6, h: 4 },
      { i: 'pareto', x: 0, y: 10, w: 8, h: 4 },
      { i: 'elasticity', x: 8, y: 10, w: 4, h: 4 },
      { i: 'anomaly', x: 0, y: 14, w: 12, h: 3 },
    ],
    inventory: [
      { i: 'kpi', x: 0, y: 0, w: 12, h: 2 },
      { i: 'stockout', x: 0, y: 2, w: 6, h: 4 },
      { i: 'excess', x: 6, y: 2, w: 6, h: 4 },
      { i: 'abc', x: 0, y: 6, w: 8, h: 4 },
      { i: 'aging', x: 8, y: 6, w: 4, h: 4 },
      { i: 'reorder', x: 0, y: 10, w: 6, h: 4 },
      { i: 'warehouse', x: 6, y: 10, w: 6, h: 4 },
      { i: 'location', x: 0, y: 14, w: 12, h: 3 },
    ],
    ai: [
      { i: 'query', x: 0, y: 0, w: 4, h: 8 },
      { i: 'results', x: 4, y: 0, w: 4, h: 8 },
      { i: 'evidence', x: 8, y: 0, w: 4, h: 8 },
      { i: 'actions', x: 0, y: 8, w: 12, h: 3 },
    ],
    help: [
      { i: 'content', x: 0, y: 0, w: 12, h: 12 },
    ],
  };

  return defaultLayouts[page as keyof typeof defaultLayouts] || [];
}
