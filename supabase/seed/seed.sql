-- 데모 데이터 시드: 하나의 테넌트/채널/상품/주문/아이템을 생성
do $$
declare
  v_tenant uuid;
  v_channel uuid;
  v_order1 uuid;
  v_order2 uuid;
begin
  -- 1) 테넌트 생성
  insert into core.tenants(name)
  values ('Demo Tenant')
  returning id into v_tenant;

  -- 2) 채널 생성 (mock)
  insert into core.channels(id, tenant_id, name, type, status)
  values (gen_random_uuid(), v_tenant, 'Mock Store', 'mock', 'active')
  returning id into v_channel;

  -- 3) 상품 3개
  insert into core.products(id, tenant_id, sku, barcode, name, option, unit)
  values
    (gen_random_uuid(), v_tenant, 'SKU-1001', '880100000001', 'Red T-Shirt', 'L', 'ea'),
    (gen_random_uuid(), v_tenant, 'SKU-2002', '880200000002', 'Blue Hoodie', 'M', 'ea'),
    (gen_random_uuid(), v_tenant, 'SKU-3003', '880300000003', 'Black Cap', null, 'ea');

  -- 4) 주문 1
  insert into core.orders(id, tenant_id, channel_id, channel_order_no, buyer, ordered_at, status)
  values (gen_random_uuid(), v_tenant, v_channel, 'MOCK-10001', '홍길동', now() - interval '1 day', 'new')
  returning id into v_order1;

  insert into core.order_items(id, order_id, sku, qty, option, price)
  values
    (gen_random_uuid(), v_order1, 'SKU-1001', 2, 'L', 20000),
    (gen_random_uuid(), v_order1, 'SKU-3003', 1, null, 12000);

  -- 5) 주문 2
  insert into core.orders(id, tenant_id, channel_id, channel_order_no, buyer, ordered_at, status)
  values (gen_random_uuid(), v_tenant, v_channel, 'MOCK-10002', '김철수', now(), 'new')
  returning id into v_order2;

  insert into core.order_items(id, order_id, sku, qty, option, price)
  values
    (gen_random_uuid(), v_order2, 'SKU-2002', 1, 'M', 45000);

end $$;
