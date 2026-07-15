import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import MainApp from './pages/MainApp'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
