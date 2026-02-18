import { Link } from 'react-router-dom'

const slides = [
  'タイトル', '課題', '解決策', '導入の簡単さ', '料金体系', 'システム構成', '処理フロー', 'デモンストレーション',
  '活用シーン1', '活用シーン2', '活用シーン3', '導入効果', 'ターゲット企業', '特許情報', '競合優位性', 'ロードマップ', 'まとめ・CTA',
]

export function SlidePage() {
  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Webスライド</h1>
        <Link className="inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white" to="/">トップへ戻る</Link>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
        {slides.map((title, idx) => (
          <section key={title} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">{idx + 1}. {title}</h2>
            <p className="mt-1 text-sm text-slate-700">ローカリーデモの{title}に関する説明スライド。</p>
          </section>
        ))}
      </div>
    </main>
  )
}
