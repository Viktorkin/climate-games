import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import ClimateGame from './ClimateGame'
import ClimateLocal from './ClimateLocal'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/global" element={<ClimateGame />} />
        <Route path="/local" element={<ClimateLocal />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
