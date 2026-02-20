import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    title: 'タイトル',
    subtitle: 'ローカリー（仮名）デモンストレーション',
    bullets: [
      '特開2021-033380（特許第6837635号）ベースのO2Oデモ',
      '実店舗商品 → EC商品URLへの導線を可視化',
      '左: 地図 / 右: スマホ画面の2パネル連動',
    ],
  },
  {
    title: '課題',
    subtitle: 'ショールーミング時の機会損失',
    bullets: [
      '店舗で興味を持っても購入導線が分断される',
      '在庫切れ時にそのまま離脱しやすい',
      '店舗体験とEC体験がつながらずCVRが低下',
    ],
  },
  {
    title: '解決策',
    subtitle: '位置情報 + 商品短縮IDで即時特定',
    bullets: [
      'ユーザーは数字IDを入力するだけで商品候補へ到達',
      '位置情報で同じIDでも店舗を判別可能',
      'EC購入リンクへ直接遷移し購入完了を短縮',
    ],
  },
  {
    title: '導入の簡単さ',
    subtitle: '導入企業が設定するのは2つだけ',
    bullets: [
      '商品ごとの商品短縮ID（数字1〜8桁）',
      '商品ごとの多角形エリア（緯度経度頂点）',
      '外部API不要で導入ハードルを低減',
    ],
  },
  {
    title: '料金体系',
    subtitle: 'ID桁数 × エリア面積で月額を算出',
    bullets: [
      '1桁IDは希少価値が高くプレミアム価格',
      '4桁は語呂合わせ運用に適した価格帯',
      '広域エリアほどリーチ拡大により単価上昇',
    ],
  },
  {
    title: 'システム構成',
    subtitle: 'ユーザー端末・商品検索・商品提示',
    bullets: [
      '端末から位置情報とIDを送信',
      '検索処理で該当店舗・商品を抽出',
      '商品情報とEC購入リンクを返却',
    ],
  },
  {
    title: '処理フロー',
    subtitle: '体験の流れ',
    bullets: [
      '地図クリックで現在位置を確定',
      'ID入力後に多角形内包判定で候補抽出',
      '単一候補は商品表示 / 複数候補は店舗選択へ遷移',
    ],
  },
  {
    title: 'デモンストレーション',
    subtitle: '2パネル連動の確認ポイント',
    bullets: [
      '左地図のエリア判定結果が右スマホに反映',
      '右検索で該当エリアを左地図でハイライト',
      '同一ID重複時に店舗選択画面を表示',
    ],
  },
  {
    title: '活用シーン1',
    subtitle: 'アパレル（試着→EC購入）',
    bullets: [
      '店頭で試着後に最適サイズをECで購入',
      '在庫切れカラーの機会損失を削減',
      '配送連携で手ぶら帰宅を実現',
    ],
  },
  {
    title: '活用シーン2',
    subtitle: '家電量販（比較購買）',
    bullets: [
      '店頭確認後にEC在庫・価格を即時参照',
      '大型商品の配送導線を簡略化',
      '店舗来店データとEC購買データを統合',
    ],
  },
  {
    title: '活用シーン3',
    subtitle: 'コンビニ（限定商品・まとめ買い）',
    bullets: [
      '店頭限定商品をECで継続販売',
      '短縮IDで瞬時に再購入導線を提供',
      '語呂合わせIDで販促・記憶定着を強化',
    ],
  },
  {
    title: '導入効果',
    subtitle: '業務・売上の定量効果（想定）',
    bullets: [
      '導入工数の圧縮（設定中心の運用）',
      'EC売上向上と機会損失削減を同時実現',
      '店舗接客とオンライン購買の体験を統合',
    ],
  },
  {
    title: 'ターゲット企業',
    subtitle: '小売・メーカー・プラットフォーム',
    bullets: [
      '実店舗とECを持つオムニチャネル事業者',
      '展示会やショールームを活用するメーカー',
      '複数テナント連携を行う大規模事業者',
    ],
  },
  {
    title: '特許情報',
    subtitle: '権利範囲と運用上の位置付け',
    bullets: [
      '国内特許: 特許第6837635号（有効）',
      '国際出願: PCT/JP2020/030880',
      '第三者利用時はライセンス許諾が必要',
    ],
  },
  {
    title: '競合優位性',
    subtitle: '短縮ID運用と位置依存特定の組み合わせ',
    bullets: [
      '短桁IDで入力負荷を軽減',
      '同一IDが複数店舗で共存可能',
      '地図API非依存でデモ運用コストを抑制',
    ],
  },
  {
    title: 'ロードマップ',
    subtitle: 'デモから実運用へ',
    bullets: [
      'Phase1: UI/データ基盤の整備',
      'Phase2: 30パターンの運用検証',
      'Phase3: 実導入想定の業務フロー接続',
    ],
  },
  {
    title: 'まとめ・CTA',
    subtitle: '次のアクション',
    bullets: [
      'ローカリーで実店舗とECの体験を連結',
      'デモパターンで自社ユースケースを確認',
      '導入検討は特許ライセンス条件と合わせて調整',
    ],
  },
] as const

export function SlidePage() {
  const [current, setCurrent] = useState(0)

  const slide = useMemo(() => slides[current], [current])

  const goPrev = () => setCurrent((prev) => Math.max(0, prev - 1))
  const goNext = () => setCurrent((prev) => Math.min(slides.length - 1, prev + 1))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrent((prev) => Math.min(slides.length - 1, prev + 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrent((prev) => Math.max(0, prev - 1))
      }
      if (e.key === 'Home') {
        setCurrent(0)
      }
      if (e.key === 'End') {
        setCurrent(slides.length - 1)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <main className="mx-auto w-[min(1200px,92vw)] py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Webスライド</h1>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800" onClick={goPrev} disabled={current === 0}>前へ</button>
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800" onClick={goNext} disabled={current === slides.length - 1}>次へ</button>
          <Link className="btn-primary inline-block rounded-lg px-3 py-2 text-sm font-medium" to="/">トップへ戻る</Link>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-700">操作: ← / → キー、PageUp / PageDown、Home / End</p>

      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm text-slate-600">{current + 1} / {slides.length}</div>
        <article className="aspect-video w-full rounded-lg bg-slate-900 p-6 text-slate-100 md:p-10">
          <h2 className="text-2xl font-bold md:text-4xl">{slide.title}</h2>
          <p className="mt-2 text-base text-slate-200 md:text-xl">{slide.subtitle}</p>
          <ul className="mt-5 list-inside list-disc space-y-2 text-sm md:text-lg">
            {slide.bullets.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>

        <div className="mt-3 flex flex-wrap gap-2">
          {slides.map((item, idx) => (
            <button
              key={item.title}
              className={`rounded-full border px-2.5 py-1 text-xs ${idx === current ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
              onClick={() => setCurrent(idx)}
            >
              {idx + 1}. {item.title}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800" onClick={goPrev} disabled={current === 0}>前へ</button>
        <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800" onClick={goNext} disabled={current === slides.length - 1}>次へ</button>
      </div>
    </main>
  )
}
