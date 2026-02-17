import { Link, Route, Routes } from 'react-router-dom'
import { DemoPage } from './pages/DemoPage'
import { SlidePage } from './pages/SlidePage'
import { TopPage } from './pages/TopPage'

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="container row-between">
          <Link to="/" className="brand">ローカリー（仮名）</Link>
          <nav className="nav">
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
      <footer className="site-footer">© ローカリー | 特許第6837635号</footer>
    </>
  )
}
