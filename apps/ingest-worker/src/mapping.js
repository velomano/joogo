const synonyms = {
    sales_date: ["sales_date", "date", "판매일", "거래일"],
    sku: ["sku", "barcode", "바코드", "상품코드"],
    channel: ["channel", "판매처", "채널"],
    qty: ["qty", "quantity", "판매수량", "수량"],
    revenue: ["revenue", "amount", "매출", "금액"],
    cost: ["cost", "원가"],
    warehouse_code: ["warehouse_code", "location", "창고", "센터위치"],
    order_id: ["order_id", "주문번호"],
    customer_id: ["customer_id", "고객번호", "수취인"],
    region: ["region", "지역"],
    brand: ["brand", "브랜드"],
    extras: []
};
export function buildHeaderMap(headers) {
    const norm = headers.map(h => h.trim());
    const map = {};
    for (const key of Object.keys(synonyms)) {
        const cands = synonyms[key].map(s => s.toLowerCase());
        for (let i = 0; i < norm.length; i++) {
            const name = norm[i].toLowerCase();
            if (cands.includes(name)) {
                map[key] = i;
                break;
            }
        }
    }
    return map;
}
