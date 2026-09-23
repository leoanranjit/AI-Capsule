const express = require('express')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const axios = require('axios')
const path = require('path')
require('dotenv').config()
const db = require('./db')

const app = express()
const port = process.env.PORT || 3000

//read json and cookies
app.use(express.json())
app.use(cookieParser())

// i did this so my react app can talk to the backend
app.use(cors())

// serve the frontend files when deployed
app.use(express.static(path.join(__dirname, 'frontend/build')))

// make sure the app is running
app.get('/api/health', (req, res) => {
  res.json({ status: "ok" })
})

// start github oauth
app.get('/login', (req, res) => {
  const redirect_uri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/callback'
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}`)
})

// handle the github login callback
app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code
  try {
    // get the access token from github
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: {
        accept: 'application/json'
      }
    })
    
    const accessToken = tokenResponse.data.access_token
    
    // get the user id from github
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })
    
    const userId = userResponse.data.id.toString()
    
    // make a jwt token for the user
    const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
    
    // save the token in a secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    // send the user back to the dashboard
    res.redirect('/dashboard')
  } catch (error) {
    res.status(500).send('login failed')
  }
})

// logout
app.get('/api/auth/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ success: true })
})

app.get('/api/auth/status', (req, res) => {
  const token = req.cookies.token
  if (!token) return res.json({ authenticated: false })
  try {
    jwt.verify(token, process.env.JWT_SECRET)
    res.json({ authenticated: true })
  } catch (error) {
    res.json({ authenticated: false })
  }
})

// protect routes that need login
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).send('unauthorized')
  }
  try {
    // check if the token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).send('unauthorized')
  }
}

// get all capsules for the logged in user
app.get('/api/capsules', authMiddleware, (req, res) => {
  db.all('SELECT * FROM capsules WHERE user_id = ?', [req.user.user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// create a new capsule
app.post('/api/capsules', authMiddleware, (req, res) => {
  const { project_name, prompt_title, prompt_version, prompt_text, response_summary, category, usefulness, reviewed, improved, screenshot_url, notes } = req.body
  db.run(`INSERT INTO capsules (user_id, project_name, prompt_title, prompt_version, prompt_text, response_summary, category, usefulness, reviewed, improved, screenshot_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [req.user.user_id, project_name, prompt_title, prompt_version, prompt_text, response_summary, category, usefulness, reviewed || 0, improved || 0, screenshot_url, notes], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    })
})

// update an existing capsule
app.put('/api/capsules/:id', authMiddleware, (req, res) => {
  const { project_name, prompt_title, prompt_version, prompt_text, response_summary, category, usefulness, reviewed, improved, screenshot_url, notes } = req.body
  db.run(`UPDATE capsules SET project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?, response_summary = ?, category = ?, usefulness = ?, reviewed = ?, improved = ?, screenshot_url = ?, notes = ? WHERE id = ? AND user_id = ?`,
    [project_name, prompt_title, prompt_version, prompt_text, response_summary, category, usefulness, reviewed, improved, screenshot_url, notes, req.params.id, req.user.user_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ updated: this.changes })
    })
})

// delete a capsule
app.delete('/api/capsules/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM capsules WHERE id = ? AND user_id = ?', [req.params.id, req.user.user_id], function(err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ deleted: this.changes })
  })
})

// serve react for any other route
app.get('{/*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'))
})

// start the server
app.listen(port, () => {
  console.log('server started')
})
