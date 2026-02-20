import { useState } from 'react'
import { Link } from 'react-router-dom'
import { demoPatterns } from '../data/demoPatterns'

const formatPatternName = (name: string): string =>
  name
    .replace(/小規模|中規模|全国|大規模|国際|地域展開|地域チェーン|全国展開|単拠点|会場規模|大規模施設/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function TopPage() {
  const visiblePatterns = demoPatterns.filter((pattern) => pattern.useCase !== 'プラットフォーム')
  const [selectedUseCase, setSelectedUseCase] = useState<'all' | string>('all')
  const useCases = [...new Set(visiblePatterns.map((pattern) => pattern.useCase))].sort((a, b) => a.localeCompare(b, 'ja'))

  const groupedByUseCase = useCases.map((useCase) => {
    const patterns = visiblePatterns
      .filter((pattern) => pattern.useCase === useCase)
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id, 'en'))
    return {
      useCase,
      patterns,
      firstPatternId: patterns[0]?.id ?? '',
      samplePatternNames: patterns.slice(0, 3).map((pattern) => formatPatternName(pattern.name)),
      minFee: Math.min(...patterns.map((pattern) => Number(pattern.monthlyEstimate.replace(/[^\d]/g, '')))),
      maxFee: Math.max(...patterns.map((pattern) => Number(pattern.monthlyEstimate.replace(/[^\d]/g, '')))),
    }
  })

  const toneClasses = [
    { card: 'border-sky-200 bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
    { card: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
    { card: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
    { card: 'border-violet-200 bg-violet-50', badge: 'bg-violet-100 text-violet-800' },
    { card: 'border-rose-200 bg-rose-50', badge: 'bg-rose-100 text-rose-800' },
    { card: 'border-cyan-200 bg-cyan-50', badge: 'bg-cyan-100 text-cyan-800' },
  ] as const

  const toneByUseCase = useCases.reduce<Record<string, (typeof toneClasses)[number]>>((acc, useCase, idx) => {
    acc[useCase] = toneClasses[idx % toneClasses.length]
    return acc
  }, {})

  const filteredGroups = selectedUseCase === 'all'
    ? groupedByUseCase
    : groupedByUseCase.filter((group) => group.useCase === selectedUseCase)

  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <section id="demos" className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">特開2021-033380（特許第6837635号）に基づく、実店舗商品→EC商品URL変換のデモです。</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">デモパターン一覧（{visiblePatterns.length}）</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${selectedUseCase === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
            onClick={() => setSelectedUseCase('all')}
          >
            すべて（{visiblePatterns.length}）
          </button>
          {useCases.map((useCase) => (
            <button
              key={useCase}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${selectedUseCase === useCase ? 'border-slate-900 bg-slate-900 text-white' : toneByUseCase[useCase].badge}`}
              onClick={() => setSelectedUseCase(useCase)}
            >
              {useCase}（{visiblePatterns.filter((pattern) => pattern.useCase === useCase).length}）
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
          {filteredGroups.map((group) => (
            <article key={group.useCase} className={`rounded-lg border p-3 ${toneByUseCase[group.useCase].card}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{group.useCase}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${toneByUseCase[group.useCase].badge}`}>{group.patterns.length}パターン</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-700">{group.samplePatternNames.join(' / ')}</p>
              <p className="mt-1 text-xs text-slate-600">商品短縮ID: 複数桁混在</p>
              <p className="mt-1 text-xs text-slate-600">利用料例（特許活用企業→ローカリー）: ¥{group.minFee.toLocaleString()}〜¥{group.maxFee.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-600">代表パターン: {group.firstPatternId}</p>
              <Link className="btn-primary mt-2 inline-block rounded-lg px-2.5 py-1.5 text-xs font-medium" to={`/demo/${group.firstPatternId}`}>このカテゴリのデモを開く</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">料金体系</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">※ 以下は特許活用企業がローカリーに支払う利用料の例です（商品価格ではありません）。</p>
        <p className="mt-1 text-sm text-slate-700">料金 = ID桁数料金 × エリア面積係数</p>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-800">ID桁数</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-800">利用料例（月額/商品）</th>
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
    </main>
  )
}
