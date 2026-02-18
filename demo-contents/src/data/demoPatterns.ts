import type { DemoPattern, LatLng, PolygonArea, Product, Store } from '../types'

const goroMap: Record<string, string> = {
  '29': 'にく',
  '39': 'サンキュー',
  '104': 'いれよ',
  '1129': 'いいにく',
  '3150': 'さいこう',
  '4649': 'よろしく',
}

const digitFee: Record<number, number> = {
  1: 50000,
  2: 20000,
  3: 8000,
  4: 3000,
  5: 1500,
  6: 800,
  7: 400,
  8: 200,
}

type PatternMeta = Omit<DemoPattern, 'stores' | 'productLists' | 'sampleIds' | 'hasDuplicateIds' | 'mapConfig'>

const baseMeta: PatternMeta[] = [
  { id: 'CVS-S-1-SM', name: 'コンビニ小規模', useCase: 'コンビニ', areaScale: 'S', idDigits: 1, companyScale: '中小企業', monthlyEstimate: '¥50,500', description: 'プレミアム1桁IDデモ' },
  { id: 'CVS-L-4-LG', name: 'コンビニ全国', useCase: 'コンビニ', areaScale: 'L', idDigits: 4, companyScale: '大企業', monthlyEstimate: '¥18,000', description: '語呂合わせID活用デモ' },
  { id: 'APR-S-2-SM', name: 'アパレル小規模', useCase: 'アパレル', areaScale: 'S', idDigits: 2, companyScale: '中小企業', monthlyEstimate: '¥21,500', description: '試着→EC連携デモ' },
  { id: 'APR-M-4-MD', name: 'アパレル中規模', useCase: 'アパレル', areaScale: 'M', idDigits: 4, companyScale: '中堅企業', monthlyEstimate: '¥8,000', description: '地域チェーン向けデモ' },
  { id: 'APR-L-6-LG', name: 'アパレル全国', useCase: 'アパレル', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '全国チェーン向けデモ' },
  { id: 'ELC-M-4-LG', name: '家電量販中規模', useCase: '家電量販', areaScale: 'M', idDigits: 4, companyScale: '大企業', monthlyEstimate: '¥8,000', description: '家電の比較購買デモ' },
  { id: 'ELC-L-6-LG', name: '家電量販全国', useCase: '家電量販', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '全国家電チェーンデモ' },
  { id: 'BKS-S-2-SM', name: '書店小規模', useCase: '書店', areaScale: 'S', idDigits: 2, companyScale: '中小企業', monthlyEstimate: '¥21,500', description: '在庫補完EC連携' },
  { id: 'BKS-L-6-LG', name: '書店全国', useCase: '書店', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '電子書籍連携' },
  { id: 'HMC-M-4-MD', name: 'ホームセンター中規模', useCase: 'ホームセンター', areaScale: 'M', idDigits: 4, companyScale: '中堅企業', monthlyEstimate: '¥8,000', description: '大型商品EC連携' },
  { id: 'SPM-L-6-LG', name: 'スーパー全国', useCase: 'スーパーマーケット', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: 'ネットスーパー連携' },
  { id: 'DRG-M-4-MD', name: 'ドラッグ中規模', useCase: 'ドラッグストア', areaScale: 'M', idDigits: 4, companyScale: '中堅企業', monthlyEstimate: '¥8,000', description: '語呂合わせ活用デモ' },
  { id: 'DRG-L-6-LG', name: 'ドラッグ全国', useCase: 'ドラッグストア', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '全国ドラッグEC連携' },
  { id: 'RES-S-1-SM', name: '飲食小規模', useCase: '飲食店', areaScale: 'S', idDigits: 1, companyScale: '小規模', monthlyEstimate: '¥50,500', description: '1桁IDプレミアムデモ' },
  { id: 'RES-L-4-LG', name: '飲食全国', useCase: '飲食チェーン', areaScale: 'L', idDigits: 4, companyScale: '大企業', monthlyEstimate: '¥18,000', description: '語呂合わせ販促デモ' },
  { id: 'REA-M-5-LG', name: '不動産中規模', useCase: '不動産', areaScale: 'M', idDigits: 5, companyScale: '大企業', monthlyEstimate: '¥6,500', description: 'モデルルーム連携' },
  { id: 'CAR-M-5-LG', name: '自動車中規模', useCase: '自動車ディーラー', areaScale: 'M', idDigits: 5, companyScale: '大企業', monthlyEstimate: '¥6,500', description: '試乗→見積連携' },
  { id: 'DEP-L-4-LG', name: '百貨店全国', useCase: '百貨店', areaScale: 'L', idDigits: 4, companyScale: '大企業', monthlyEstimate: '¥18,000', description: '高級品EC導線' },
  { id: 'SPT-M-3-MD', name: 'スポーツ中規模', useCase: 'スポーツ用品', areaScale: 'M', idDigits: 3, companyScale: '中堅企業', monthlyEstimate: '¥13,000', description: '試用→EC購入' },
  { id: 'COS-L-6-LG', name: '化粧品全国', useCase: '化粧品', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '定期購入導線' },
  { id: 'TRV-M-4-MD', name: '旅行中規模', useCase: '旅行代理店', areaScale: 'M', idDigits: 4, companyScale: '中堅企業', monthlyEstimate: '¥8,000', description: '店頭相談→予約' },
  { id: 'BNK-L-5-LG', name: '金融全国', useCase: '銀行・金融', areaScale: 'L', idDigits: 5, companyScale: '大企業', monthlyEstimate: '¥16,500', description: '窓口→オンライン申込' },
  { id: 'LOG-L-7-LG', name: '物流全国', useCase: '物流', areaScale: 'L', idDigits: 7, companyScale: '大企業', monthlyEstimate: '¥15,400', description: 'ロッカー×EC連携' },
  { id: 'AGR-S-1-SM', name: '直売所小規模', useCase: '農産物直売所', areaScale: 'S', idDigits: 1, companyScale: '小規模', monthlyEstimate: '¥50,500', description: '地方特産品デモ' },
  { id: 'EXB-M-3-MD', name: '展示会中規模', useCase: '展示会・イベント', areaScale: 'M', idDigits: 3, companyScale: '中堅企業', monthlyEstimate: '¥13,000', description: '展示品EC導線' },
  { id: 'MUS-S-2-SM', name: '美術館小規模', useCase: '美術館・博物館', areaScale: 'S', idDigits: 2, companyScale: '小規模', monthlyEstimate: '¥21,500', description: 'ミュージアムEC連携' },
  { id: 'THP-L-6-LG', name: 'テーマパーク大規模', useCase: 'テーマパーク', areaScale: 'L', idDigits: 6, companyScale: '大企業', monthlyEstimate: '¥15,800', description: '園内グッズ配送' },
  { id: 'DFS-L-8-GL', name: '免税店国際', useCase: '免税店', areaScale: 'L', idDigits: 8, companyScale: 'グローバル', monthlyEstimate: '¥15,200', description: 'インバウンド再購入' },
  { id: 'B2B-L-8-LG', name: 'BtoB卸売全国', useCase: 'BtoB卸売', areaScale: 'L', idDigits: 8, companyScale: '大企業', monthlyEstimate: '¥15,200', description: '現場確認→発注' },
  { id: 'PFM-L-7-GL', name: 'プラットフォーム全国', useCase: 'プラットフォーム', areaScale: 'L', idDigits: 7, companyScale: 'グローバル', monthlyEstimate: '¥15,400', description: 'マルチテナント連携' },
]

const mkId = (digits: number, seed: number): string => {
  if (digits === 1) return String(seed % 10)
  const min = Math.pow(10, digits - 1)
  const max = Math.pow(10, digits) - 1
  return String(min + (seed * 137) % (max - min))
}

const shift = (p: LatLng, dLat: number, dLng: number): LatLng => ({ lat: p.lat + dLat, lng: p.lng + dLng })

const mkPolygon = (center: LatLng, width: number, height: number): LatLng[] => [
  shift(center, height, -width),
  shift(center, height, width),
  shift(center, -height, width),
  shift(center, -height, -width),
]

const makeStores = (meta: PatternMeta, idx: number): Store[] => {
  const base = { lat: 35.66 + idx * 0.0015, lng: 139.70 + idx * 0.0012 }
  const id1 = mkId(meta.idDigits, idx + 3)
  const id2 = mkId(meta.idDigits, idx + 9)
  const id3 = meta.idDigits >= 4 ? '4649'.slice(0, meta.idDigits) : mkId(meta.idDigits, idx + 21)
  const duplicateId = idx === 0 ? '29' : id1

  const storeA: Store = {
    id: `${meta.id}-A`,
    name: `${meta.useCase} 渋谷店`,
    category: meta.useCase,
    position: base,
    polygonAreas: [
      {
        id: `${meta.id}-A-1`,
        storeId: `${meta.id}-A`,
        productShortId: duplicateId,
        vertices: mkPolygon(base, 0.0016, 0.0012),
        color: '#ff3b30',
        opacity: 0.2,
        label: `ID:${duplicateId} エリア`,
        isPremiumArea: meta.idDigits === 1,
      },
      {
        id: `${meta.id}-A-2`,
        storeId: `${meta.id}-A`,
        productShortId: id2,
        vertices: mkPolygon(shift(base, -0.0005, 0.0008), 0.001, 0.0008),
        color: '#ff3b30',
        opacity: 0.35,
        label: `ID:${id2} エリア`,
      },
      {
        id: `${meta.id}-A-3`,
        storeId: `${meta.id}-A`,
        productShortId: id3,
        vertices: mkPolygon(shift(base, -0.0002, 0.0014), 0.0009, 0.0007),
        color: '#ff3b30',
        opacity: 0.5,
        label: `ID:${id3} エリア`,
      },
    ],
  }

  const storeBBase = shift(base, -0.0011, 0.0018)
  const storeB: Store = {
    id: `${meta.id}-B`,
    name: `${meta.useCase} 新宿店`,
    category: meta.useCase,
    position: storeBBase,
    polygonAreas: [
      {
        id: `${meta.id}-B-1`,
        storeId: `${meta.id}-B`,
        productShortId: duplicateId,
        vertices: mkPolygon(shift(storeBBase, 0.0004, -0.0006), 0.0015, 0.0011),
        color: '#007aff',
        opacity: 0.25,
        label: `ID:${duplicateId} エリア（店舗B）`,
      },
      {
        id: `${meta.id}-B-2`,
        storeId: `${meta.id}-B`,
        productShortId: mkId(meta.idDigits, idx + 33),
        vertices: mkPolygon(shift(storeBBase, -0.0008, 0.0005), 0.0011, 0.0008),
        color: '#007aff',
        opacity: 0.4,
        label: '店舗Bエリア',
      },
    ],
  }

  return [storeA, storeB]
}

const makeProducts = (meta: PatternMeta, stores: Store[]): DemoPattern['productLists'] => {
  const fee = digitFee[meta.idDigits]
  return stores.map((store, idx) => {
    const ids = [...new Set(store.polygonAreas.map((a) => a.productShortId))]
    const products: Product[] = ids.map((id, n) => ({
      productShortId: id,
      name: `${meta.useCase} 商品 ${n + 1}`,
      price: 980 + idx * 500 + n * 300,
      description: `${meta.useCase}向けデモ商品。実店舗確認後にECで購入できます。`,
      imageUrl: 'https://placehold.co/320x180?text=Product',
      ecUrl: `https://example.com/ec/${meta.id}/${id}`,
      stock: n % 3 === 0 ? 'available' : n % 3 === 1 ? 'few' : 'none',
      category: meta.useCase,
      isPremiumId: id.length === 1,
      goroawase: goroMap[id],
      monthlyFee: fee,
    }))
    return { storeId: store.id, products }
  })
}

const makeSampleIds = (stores: Store[]): string[] => {
  const ids = new Set<string>()
  for (const store of stores) {
    for (const area of store.polygonAreas) ids.add(area.productShortId)
  }
  return [...ids].slice(0, 5)
}

export const demoPatterns: DemoPattern[] = baseMeta.map((meta, idx) => {
  const stores = makeStores(meta, idx)
  const productLists = makeProducts(meta, stores)
  return {
    ...meta,
    stores,
    productLists,
    sampleIds: makeSampleIds(stores),
    hasDuplicateIds: idx === 0,
    mapConfig: {
      center: { lat: 35.66 + idx * 0.0015, lng: 139.7 + idx * 0.0012 },
      zoomLevel: 1,
      minZoom: 0.5,
      maxZoom: 4,
      scaleUnit: 'm',
    },
  }
})

export const getPatternById = (patternId: string): DemoPattern | undefined =>
  demoPatterns.find((p) => p.id === patternId)

export const flattenAreas = (pattern: DemoPattern): PolygonArea[] =>
  pattern.stores.flatMap((store) => store.polygonAreas)
