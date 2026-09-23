
import React from 'react'

function Login() {

  const handleLogin = () => {
    // i did this so it works locally and on render
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000/login' : '/login'
    window.location.href = backendUrl
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Login with GitHub</button>
    </div>
  )
}

export default Login
