import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SimpleMap } from '../components/demo/SimpleMap'
import { demoPatterns, flattenAreas, getPatternById } from '../data/demoPatterns'
import type { LatLng, Product, Store } from '../types'
import { isPointInPolygon, roughDistanceMeters } from '../utils/polygonUtils'

export function DemoPage() {
  const { patternId } = useParams()
  const navigate = useNavigate()
  const pattern = useMemo(() => (patternId ? getPatternById(patternId) : undefined), [patternId])

  const [userLocation, setUserLocation] = useState<LatLng>(pattern?.mapConfig.center ?? { lat: 35.66, lng: 139.7 })
  const [idInput, setIdInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [candidateStores, setCandidateStores] = useState<Store[]>([])
  const [highlightedAreaIds, setHighlightedAreaIds] = useState<string[]>([])
  const [focusedStoreIds, setFocusedStoreIds] = useState<string[]>([])

  if (!pattern) {
    return (
      <main className="mx-auto w-[min(1200px,92vw)] py-5">
        <h1 className="text-2xl font-bold text-slate-900">パターンが見つかりません</h1>
        <Link className="mt-3 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" to="/">トップへ戻る</Link>
      </main>
    )
  }

  const productsByStore = new Map(pattern.productLists.map((x) => [x.storeId, x.products]))

  const search = () => {
    if (!/^\d{1,8}$/.test(idInput)) {
      alert('商品短縮IDは数字1〜8桁で入力してください')
      return
    }

    const matchedAreas = flattenAreas(pattern).filter((area) =>
      area.productShortId === idInput && isPointInPolygon(userLocation, area.vertices),
    )

    setHighlightedAreaIds(matchedAreas.map((x) => x.id))

    if (matchedAreas.length === 0) {
      setCandidateStores([])
      setSelectedProduct(null)
      return
    }

    const stores = pattern.stores.filter((store) => matchedAreas.some((a) => a.storeId === store.id))
    setFocusedStoreIds(stores.map((s) => s.id))

    if (stores.length > 1) {
      setCandidateStores(stores)
      setSelectedProduct(null)
      return
    }

    const onlyStore = stores[0]
    const product = (productsByStore.get(onlyStore.id) ?? []).find((p) => p.productShortId === idInput) ?? null
    setCandidateStores([])
    setSelectedProduct(product)
  }

  const chooseStore = (store: Store) => {
    const product = (productsByStore.get(store.id) ?? []).find((p) => p.productShortId === idInput) ?? null
    setSelectedProduct(product)
    setCandidateStores([])
    setFocusedStoreIds([store.id])
  }

  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <section className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <strong className="block text-base text-slate-900">{pattern.name}</strong>
          <span className="text-sm text-slate-600">{pattern.useCase} / {pattern.areaScale} / {pattern.idDigits}桁 / {pattern.companyScale} / {pattern.monthlyEstimate}</span>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-slate-300 px-2 py-2 text-sm" value={pattern.id} onChange={(e) => navigate(`/demo/${e.target.value}`)}>
            {demoPatterns.map((x) => (
              <option key={x.id} value={x.id}>{x.id}</option>
            ))}
          </select>
          <Link className="inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" to="/">トップ</Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">簡略マップ</h2>
          <SimpleMap
            pattern={pattern}
            userLocation={userLocation}
            onChangeUserLocation={setUserLocation}
            highlightedAreaIds={highlightedAreaIds}
            focusedStoreIds={focusedStoreIds}
          />
        </div>

        <div className="min-h-155 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">スマートフォン画面</h2>
          <div className="mx-auto mt-2 min-h-130 w-full max-w-90 rounded-3xl border-10 border-slate-900 bg-slate-50 p-3.5">
            {selectedProduct ? (
              <article>
                <button className="inline-block rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900" onClick={() => setSelectedProduct(null)}>← 戻る</button>
                <img className="mt-2 w-full rounded-lg border border-slate-200" src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                <p className="mt-2 text-sm text-slate-700">ID: {selectedProduct.productShortId}{selectedProduct.goroawase ? `（${selectedProduct.goroawase}）` : ''}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{selectedProduct.name}</h3>
                <p className="mt-1 text-sm text-slate-700">¥{selectedProduct.price.toLocaleString()}</p>
                <a className="mt-2 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" href={selectedProduct.ecUrl} target="_blank" rel="noreferrer">EC購入はこちら</a>
                <p className="mt-2 text-sm text-slate-700">在庫: {selectedProduct.stock === 'available' ? 'あり' : selectedProduct.stock === 'few' ? '残りわずか' : 'なし'}</p>
                <p className="mt-1 text-sm text-slate-700">月額参考: ¥{selectedProduct.monthlyFee.toLocaleString()}/商品</p>
              </article>
            ) : candidateStores.length > 1 ? (
              <section>
                <h3 className="font-semibold text-slate-900">複数の店舗が見つかりました</h3>
                <ul className="mt-2 grid gap-2">
                  {candidateStores.map((store) => (
                    <li key={store.id}>
                      <button className="grid w-full gap-1 rounded-lg border border-slate-300 bg-white p-2.5 text-left" onClick={() => chooseStore(store)}>
                        <strong>{store.name}</strong>
                        <span className="text-sm text-slate-600">{store.category} / 約{Math.round(roughDistanceMeters(userLocation, store.position))}m</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section>
                <p className="text-sm text-slate-700">現在位置: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                <label className="mt-2 block text-sm text-slate-700">商品短縮ID（数字のみ）</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                  inputMode="numeric"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
                <button className="mt-2 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" onClick={search}>検索する</button>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {pattern.sampleIds.map((id) => (
                    <button key={id} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-700" onClick={() => setIdInput(id)}>{id.length === 1 ? `⭐${id}` : id}</button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
