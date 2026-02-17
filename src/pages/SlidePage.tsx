import { Link } from 'react-router-dom'

const slides = [
  'タイトル', '課題', '解決策', '導入の簡単さ', '料金体系', 'システム構成', '処理フロー', 'デモンストレーション',
  '活用シーン1', '活用シーン2', '活用シーン3', '導入効果', 'ターゲット企業', '特許情報', '競合優位性', 'ロードマップ', 'まとめ・CTA',
]

export function SlidePage() {
  return (
    <main className="container page-main">
      <div className="row-between">
        <h1>Webスライド</h1>
        <Link className="btn" to="/">トップへ戻る</Link>
      </div>
      <div className="slide-grid">
        {slides.map((title, idx) => (
          <section key={title} className="slide-card">
            <h2>{idx + 1}. {title}</h2>
            <p>ローカリーデモの{title}に関する説明スライド。</p>
          </section>
        ))}
      </div>
    </main>
  )
}
