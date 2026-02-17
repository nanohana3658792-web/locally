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
      <main className="container page-main">
        <h1>パターンが見つかりません</h1>
        <Link className="btn" to="/">トップへ戻る</Link>
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
    <main className="container page-main">
      <section className="pattern-bar">
        <div>
          <strong>{pattern.name}</strong>
          <span>{pattern.useCase} / {pattern.areaScale} / {pattern.idDigits}桁 / {pattern.companyScale} / {pattern.monthlyEstimate}</span>
        </div>
        <div className="row-gap">
          <select value={pattern.id} onChange={(e) => navigate(`/demo/${e.target.value}`)}>
            {demoPatterns.map((x) => (
              <option key={x.id} value={x.id}>{x.id}</option>
            ))}
          </select>
          <Link className="btn" to="/">トップ</Link>
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h2>簡略マップ</h2>
          <SimpleMap
            pattern={pattern}
            userLocation={userLocation}
            onChangeUserLocation={setUserLocation}
            highlightedAreaIds={highlightedAreaIds}
            focusedStoreIds={focusedStoreIds}
          />
        </div>

        <div className="panel phone-panel">
          <h2>スマートフォン画面</h2>
          <div className="phone-frame">
            {selectedProduct ? (
              <article className="product-card">
                <button className="btn text-btn" onClick={() => setSelectedProduct(null)}>← 戻る</button>
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                <p>ID: {selectedProduct.productShortId}{selectedProduct.goroawase ? `（${selectedProduct.goroawase}）` : ''}</p>
                <h3>{selectedProduct.name}</h3>
                <p>¥{selectedProduct.price.toLocaleString()}</p>
                <a className="btn" href={selectedProduct.ecUrl} target="_blank" rel="noreferrer">EC購入はこちら</a>
                <p>在庫: {selectedProduct.stock === 'available' ? 'あり' : selectedProduct.stock === 'few' ? '残りわずか' : 'なし'}</p>
                <p>月額参考: ¥{selectedProduct.monthlyFee.toLocaleString()}/商品</p>
              </article>
            ) : candidateStores.length > 1 ? (
              <section>
                <h3>複数の店舗が見つかりました</h3>
                <ul className="store-select-list">
                  {candidateStores.map((store) => (
                    <li key={store.id}>
                      <button onClick={() => chooseStore(store)}>
                        <strong>{store.name}</strong>
                        <span>{store.category} / 約{Math.round(roughDistanceMeters(userLocation, store.position))}m</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section>
                <p>現在位置: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                <label>商品短縮ID（数字のみ）</label>
                <input inputMode="numeric" value={idInput} onChange={(e) => setIdInput(e.target.value.replace(/\D/g, '').slice(0, 8))} />
                <button className="btn" onClick={search}>検索する</button>
                <div className="chips">
                  {pattern.sampleIds.map((id) => (
                    <button key={id} className="chip" onClick={() => setIdInput(id)}>{id.length === 1 ? `⭐${id}` : id}</button>
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
