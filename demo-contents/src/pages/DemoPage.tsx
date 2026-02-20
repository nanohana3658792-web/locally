import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SimpleMap } from '../components/demo/SimpleMap'
import { demoPatterns, flattenAreas, getPatternById } from '../data/demoPatterns'
import type { LatLng, Product } from '../types'
import { isPointInPolygon } from '../utils/polygonUtils'

const formatPatternName = (name: string): string =>
  name
    .replace(/小規模|中規模|全国|大規模|国際|地域展開|地域チェーン|全国展開|単拠点|会場規模|大規模施設/g, '')
    .replace(/\s+/g, ' ')
    .trim()

interface CandidateProduct {
  storeId: string
  storeName: string
  product: Product
}

export function DemoPage() {
  const { patternId } = useParams()
  const navigate = useNavigate()
  const pattern = useMemo(() => (patternId ? getPatternById(patternId) : undefined), [patternId])

  const [userLocation, setUserLocation] = useState<LatLng>(pattern?.mapConfig.center ?? { lat: 35.66, lng: 139.7 })
  const [idInput, setIdInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [candidateProducts, setCandidateProducts] = useState<CandidateProduct[]>([])
  const [noResultForCurrentLocation, setNoResultForCurrentLocation] = useState(false)
  const [highlightedAreaIds, setHighlightedAreaIds] = useState<string[]>([])
  const [focusedStoreIds, setFocusedStoreIds] = useState<string[]>([])
  const [isInputFlashing, setIsInputFlashing] = useState(false)

  useEffect(() => {
    if (!idInput) return
    setIsInputFlashing(true)
    const timer = window.setTimeout(() => {
      setIsInputFlashing(false)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [idInput])

  if (!pattern) {
    return (
      <main className="mx-auto w-[min(1200px,92vw)] py-5">
        <h1 className="text-2xl font-bold text-slate-900">パターンが見つかりません</h1>
        <Link className="btn-primary mt-3 inline-block rounded-lg px-3 py-2 text-sm font-medium" to="/">トップへ戻る</Link>
      </main>
    )
  }

  const productsByStore = new Map(pattern.productLists.map((x) => [x.storeId, x.products]))

  const search = () => {
    if (!/^\d{1,8}$/.test(idInput)) {
      alert('商品短縮IDは数字1〜8桁で入力してください')
      return
    }

    setNoResultForCurrentLocation(false)

    const matchedAreas = flattenAreas(pattern).filter((area) =>
      area.productShortId === idInput && isPointInPolygon(userLocation, area.vertices),
    )

    setHighlightedAreaIds(matchedAreas.map((x) => x.id))

    if (matchedAreas.length === 0) {
      setCandidateProducts([])
      setSelectedProduct(null)
      setFocusedStoreIds([])
      setNoResultForCurrentLocation(true)
      return
    }

    const stores = pattern.stores.filter((store) => matchedAreas.some((a) => a.storeId === store.id))
    setFocusedStoreIds(stores.map((s) => s.id))

    const matchedProducts = stores
      .map((store) => {
        const product = (productsByStore.get(store.id) ?? []).find((p) => p.productShortId === idInput)
        if (!product) return null
        return {
          storeId: store.id,
          storeName: store.name,
          product,
        }
      })
      .filter((item): item is CandidateProduct => item !== null)

    if (matchedProducts.length > 1) {
      setCandidateProducts(matchedProducts)
      setSelectedProduct(null)
      return
    }

    setCandidateProducts([])
    setSelectedProduct(matchedProducts[0]?.product ?? null)
  }

  const chooseProduct = (candidate: CandidateProduct) => {
    setSelectedProduct(candidate.product)
    setCandidateProducts([])
    setFocusedStoreIds([candidate.storeId])
  }

  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <section className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <strong className="block text-base text-slate-900">{formatPatternName(pattern.name)}</strong>
          <span className="text-sm text-slate-600">商品短縮ID:複数桁混在 / 利用料例（特許活用企業→ローカリー）:{pattern.monthlyEstimate}</span>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-slate-300 px-2 py-2 text-sm" value={pattern.id} onChange={(e) => navigate(`/demo/${e.target.value}`)}>
            {demoPatterns.map((x) => (
              <option key={x.id} value={x.id}>{formatPatternName(x.name)}（ID:{x.id}）</option>
            ))}
          </select>
          <Link className="btn-primary inline-block rounded-lg px-3 py-2 text-sm font-medium" to="/">トップ</Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">簡略マップ（商品短縮ID:複数桁混在）</h2>
          <SimpleMap
            pattern={pattern}
            onChangeUserLocation={setUserLocation}
            highlightedAreaIds={highlightedAreaIds}
            focusedStoreIds={focusedStoreIds}
            monochromeNonHighlighted={selectedProduct !== null || noResultForCurrentLocation}
          />
        </div>

        <div className="min-h-155 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">スマートフォン画面</h2>
          <p className="mt-1 text-sm text-slate-700">
            これはエンドユーザーのスマホ画面です。エンドユーザーは位置情報と店頭の商品短縮IDを使って、1回の操作でECの商品購入ページに到達できます。
          </p>
          {selectedProduct ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800">
                商品候補が1つのため、ECの商品ページがすぐに開きます
              </div>
              <button
                className="inline-block rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900"
                onClick={() => {
                  setSelectedProduct(null)
                  setHighlightedAreaIds([])
                  setFocusedStoreIds([])
                }}
              >
                ← 戻る
              </button>
            </div>
          ) : candidateProducts.length === 0 ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                数字ボタンはデモ用です。実際はエンドユーザーが店頭に掲示された商品短縮IDを記憶し、アプリに入力します。
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {pattern.sampleIds.map((id) => (
                  <button key={id} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-700" onClick={() => { setIdInput(id); setNoResultForCurrentLocation(false) }}>{id.length === 1 ? `⭐${id}` : id}</button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mx-auto mt-2 aspect-[9/19.5] w-full max-w-75 overflow-hidden rounded-[2.2rem] border-10 border-slate-900 bg-slate-50 shadow-sm">
            <div className="h-7 bg-slate-900" />
            <div className="flex h-[calc(100%-1.75rem)] flex-col">
              {selectedProduct ? (
                <div className="border-b border-slate-200 bg-slate-100 px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700">←</span>
                    <div className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-600">
                      https://example-shop.jp/product/{selectedProduct.productShortId}
                    </div>
                    <span className="text-xs text-slate-700">↻</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-slate-900">LOCALLY APP</p>
                    <p className="text-[10px] text-slate-500">ローカリー公式アプリ</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">デモ画面</span>
                </div>
              )}

              <div className={`flex-1 ${selectedProduct ? 'p-0' : 'p-3'}`}>
            {selectedProduct ? (
              <article className="flex h-full flex-col gap-2">
                <section className="bg-white p-3">
                  <div className="border-b border-slate-200 pb-2">
                    <p className="text-[11px] text-slate-500">架空の商品Webページ（企業EC）</p>
                    <h3 className="text-sm font-semibold text-slate-900">Example Shop 公式オンラインストア</h3>
                  </div>
                  <img className="mt-2 w-full rounded-lg border border-slate-200" src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                  <p className="mt-2 text-xs text-slate-600">商品コード: {selectedProduct.productShortId}</p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900">{selectedProduct.name}</h4>
                  <p className="mt-1 text-sm text-slate-700">商品価格: ¥{selectedProduct.price.toLocaleString()}</p>
                  <button className="btn-primary mt-2 block w-fit rounded-lg px-3 py-2 text-sm font-medium mx-auto" type="button">カートに入れる</button>
                </section>
              </article>
            ) : candidateProducts.length > 1 ? (
              <section>
                <div className="mb-2 flex items-start justify-start">
                  <button
                    className="inline-block rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900"
                    onClick={() => {
                      setCandidateProducts([])
                      setHighlightedAreaIds([])
                      setFocusedStoreIds([])
                    }}
                  >
                    ← 戻る
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900">複数の商品が見つかりました</h3>
                <ul className="mt-2 grid gap-2">
                  {candidateProducts.map((candidate) => (
                    <li key={`${candidate.storeId}-${candidate.product.productShortId}`}>
                      <button className="grid w-full gap-1 rounded-lg border border-slate-300 bg-white p-2.5 text-left" onClick={() => chooseProduct(candidate)}>
                        <strong>{candidate.product.name}</strong>
                        <span className="text-sm text-slate-600">ID: {candidate.product.productShortId} / {candidate.storeName}</span>
                        <span className="text-sm text-slate-600">商品価格: ¥{candidate.product.price.toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="flex h-full flex-col">
                <div className="flex flex-1 flex-col items-center justify-center">
                  {noResultForCurrentLocation && (
                    <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
                      この場所では該当する商品がありません。
                    </div>
                  )}
                  <label className="block text-sm text-slate-700">商品短縮ID</label>
                  <input
                    className={`mt-1 w-[10ch] rounded-lg border border-slate-300 px-2 py-2 text-center text-xl tracking-widest ${isInputFlashing ? 'short-id-flash' : ''}`}
                    inputMode="numeric"
                    value={idInput}
                    onChange={(e) => {
                      setIdInput(e.target.value.replace(/\D/g, '').slice(0, 8))
                      setNoResultForCurrentLocation(false)
                    }}
                  />
                  <button className="btn-primary mt-2 inline-block rounded-lg px-3 py-2 text-sm font-medium" onClick={search}>商品を見る</button>
                </div>
              </section>
            )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
