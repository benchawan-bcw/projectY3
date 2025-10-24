import { HashRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// User
import Tracking from './components/User/Tracking.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <HashRouter>
      <Routes>
        {/* User */}
        <Route path="/" element={<Tracking />} />
      </Routes>
    </HashRouter>
  )
}

export default App
