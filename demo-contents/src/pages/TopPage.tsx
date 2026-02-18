import { Link } from 'react-router-dom'
import { demoPatterns } from '../data/demoPatterns'

export function TopPage() {
  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <section id="about" className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-bold text-slate-900">ローカリー（仮名）デモンストレーション</h1>
        <p className="mt-2 text-sm text-slate-700">特開2021-033380（特許第6837635号）に基づく、実店舗商品→EC商品URL変換のデモです。</p>
      </section>

      <section id="pricing" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">料金体系</h2>
        <p className="mt-1 text-sm text-slate-700">料金 = ID桁数料金 × エリア面積係数</p>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-800">ID桁数</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-800">月額/商品</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border-b border-slate-200 px-2 py-2">1桁</td><td className="border-b border-slate-200 px-2 py-2">¥50,000</td></tr>
            <tr><td className="border-b border-slate-200 px-2 py-2">2桁</td><td className="border-b border-slate-200 px-2 py-2">¥20,000</td></tr>
            <tr><td className="border-b border-slate-200 px-2 py-2">3桁</td><td className="border-b border-slate-200 px-2 py-2">¥8,000</td></tr>
            <tr><td className="border-b border-slate-200 px-2 py-2">4桁</td><td className="border-b border-slate-200 px-2 py-2">¥3,000</td></tr>
            <tr><td className="border-b border-slate-200 px-2 py-2">5〜8桁</td><td className="border-b border-slate-200 px-2 py-2">¥1,500〜¥200</td></tr>
          </tbody>
        </table>
      </section>

      <section id="features" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">機能アピール</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          <li>緯度経度ベースの簡略マップ（Canvas/SVG相当）</li>
          <li>多角形エリアの重複表示、同一IDの複数店舗対応</li>
          <li>スマホ画面シミュレーション連動</li>
          <li>1〜8桁の数字ID検索、語呂合わせ表示</li>
        </ul>
      </section>

      <section id="effects" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">導入効果</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          <li>導入工数の最小化（ID + エリア指定のみ）</li>
          <li>売上向上・在庫機会損失削減</li>
          <li>O2O体験の改善</li>
        </ul>
      </section>

      <section id="patent-scope" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">特許範囲の明示</h2>
        <p className="mt-1 text-sm text-slate-700">国内特許: 特許第6837635号（有効・存続中） / 権利期間: 〜2039年8月16日</p>
      </section>

      <section id="demos" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">デモパターン一覧（30）</h2>
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
          {demoPatterns.map((pattern) => (
            <article key={pattern.id} className="rounded-lg border border-slate-200 p-3">
              <h3 className="font-semibold text-slate-900">{pattern.id}</h3>
              <p className="mt-1 text-sm text-slate-700">{pattern.useCase} / {pattern.areaScale} / {pattern.idDigits}桁 / {pattern.companyScale}</p>
              <p className="mt-1 text-sm text-slate-700">{pattern.monthlyEstimate}</p>
              <Link className="mt-2 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" to={`/demo/${pattern.id}`}>デモを開く</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="slides" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Webスライド</h2>
        <p className="mt-1 text-sm text-slate-700">17枚構成のプレゼン資料をブラウザで閲覧できます。</p>
        <Link className="mt-2 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" to="/slides">スライドを見る</Link>
      </section>
    </main>
  )
}
