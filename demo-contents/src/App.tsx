import { Link, Route, Routes } from 'react-router-dom'
import { DemoPage } from './pages/DemoPage'
import { SlidePage } from './pages/SlidePage'
import { TopPage } from './pages/TopPage'

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-[min(1200px,92vw)] items-center justify-between gap-3">
          <Link to="/" className="py-3 text-base font-bold">ローカリー（仮名）</Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-700 md:flex">
            <Link to="/">トップ</Link>
            <Link to="/slides">スライド</Link>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/demo/:patternId" element={<DemoPage />} />
        <Route path="/slides" element={<SlidePage />} />
      </Routes>
      <footer className="mt-8 border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-600">© ローカリー | 特許第6837635号</footer>
    </>
  )
}
