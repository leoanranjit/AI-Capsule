
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import Home from './Home'
import Login from './Login'
import Dashboard from './Dashboard'
import './style.css'

function App() {
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    axios.get('/api/auth/status')
      .then(res => setIsAuth(res.data.authenticated))
      .catch(() => setIsAuth(false))
  }, [])

  return (
    <BrowserRouter>
      <div>
        <nav>
          <Link to="/">Home</Link>
          {!isAuth && <Link to="/login">Login</Link>}
          {isAuth && <Link to="/dashboard">Dashboard</Link>}
        </nav>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
