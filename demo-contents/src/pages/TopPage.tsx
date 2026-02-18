import { Link } from 'react-router-dom'
import { demoPatterns } from '../data/demoPatterns'

export function TopPage() {
  return (
    <main className="container page-main">
      <section className="hero" id="about">
        <h1>ローカリー（仮名）デモンストレーション</h1>
        <p>特開2021-033380（特許第6837635号）に基づく、実店舗商品→EC商品URL変換のデモです。</p>
      </section>

      <section id="pricing" className="card">
        <h2>料金体系</h2>
        <p>料金 = ID桁数料金 × エリア面積係数</p>
        <table>
          <thead><tr><th>ID桁数</th><th>月額/商品</th></tr></thead>
          <tbody>
            <tr><td>1桁</td><td>¥50,000</td></tr>
            <tr><td>2桁</td><td>¥20,000</td></tr>
            <tr><td>3桁</td><td>¥8,000</td></tr>
            <tr><td>4桁</td><td>¥3,000</td></tr>
            <tr><td>5〜8桁</td><td>¥1,500〜¥200</td></tr>
          </tbody>
        </table>
      </section>

      <section id="features" className="card">
        <h2>機能アピール</h2>
        <ul>
          <li>緯度経度ベースの簡略マップ（Canvas/SVG相当）</li>
          <li>多角形エリアの重複表示、同一IDの複数店舗対応</li>
          <li>スマホ画面シミュレーション連動</li>
          <li>1〜8桁の数字ID検索、語呂合わせ表示</li>
        </ul>
      </section>

      <section id="effects" className="card">
        <h2>導入効果</h2>
        <ul>
          <li>導入工数の最小化（ID + エリア指定のみ）</li>
          <li>売上向上・在庫機会損失削減</li>
          <li>O2O体験の改善</li>
        </ul>
      </section>

      <section id="patent-scope" className="card">
        <h2>特許範囲の明示</h2>
        <p>国内特許: 特許第6837635号（有効・存続中） / 権利期間: 〜2039年8月16日</p>
      </section>

      <section id="demos" className="card">
        <h2>デモパターン一覧（30）</h2>
        <div className="demo-grid">
          {demoPatterns.map((pattern) => (
            <article key={pattern.id} className="demo-item">
              <h3>{pattern.id}</h3>
              <p>{pattern.useCase} / {pattern.areaScale} / {pattern.idDigits}桁 / {pattern.companyScale}</p>
              <p>{pattern.monthlyEstimate}</p>
              <Link className="btn" to={`/demo/${pattern.id}`}>デモを開く</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="slides" className="card">
        <h2>Webスライド</h2>
        <p>17枚構成のプレゼン資料をブラウザで閲覧できます。</p>
        <Link className="btn" to="/slides">スライドを見る</Link>
      </section>
    </main>
  )
}
