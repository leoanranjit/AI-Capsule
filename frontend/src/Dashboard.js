
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Dashboard() {
  const [capsules, setCapsules] = useState([])
  const [form, setForm] = useState({ id: null, project_name: '', prompt_title: '', prompt_version: '', prompt_text: '', response_summary: '', category: '', usefulness: '', reviewed: 0, improved: 0, screenshot_url: '', notes: '' })
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadCapsules()
  }, [])

  const loadCapsules = async () => {
    try {
      const res = await axios.get('/api/capsules')
      setCapsules(res.data)
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login')
      } else {
        setError('Unauthorized or failed to load.')
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (form.id) {
        await axios.put(`/api/capsules/${form.id}`, form)
      } else {
        await axios.post('/api/capsules', form)
      }
      setForm({ id: null, project_name: '', prompt_title: '', prompt_version: '', prompt_text: '', response_summary: '', category: '', usefulness: '', reviewed: 0, improved: 0, screenshot_url: '', notes: '' })
      loadCapsules()
    } catch (err) {
      setError('Failed to save.')
    }
  }

  const handleEdit = (cap) => {
    setForm(cap)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/capsules/${id}`)
      loadCapsules()
    } catch (err) {
      setError('Failed to delete.')
    }
  }

  const handleLogout = async () => {
    try {
      await axios.get('/api/auth/logout')
      window.location.href = '/'
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-delete">Logout</button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <h3>{form.id ? 'Edit Prompt' : 'Add New Prompt'}</h3>
        <input name="project_name" placeholder="Project Name" value={form.project_name} onChange={handleChange} required />
        <input name="prompt_title" placeholder="Prompt Title" value={form.prompt_title} onChange={handleChange} required />
        <input name="prompt_version" placeholder="Prompt Version" value={form.prompt_version} onChange={handleChange} />
        <input name="prompt_text" placeholder="Prompt Text" value={form.prompt_text} onChange={handleChange} required />
        <input name="response_summary" placeholder="Response Summary" value={form.response_summary} onChange={handleChange} />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
        <input name="usefulness" placeholder="Usefulness" value={form.usefulness} onChange={handleChange} />
        <input name="screenshot_url" placeholder="Screenshot URL" value={form.screenshot_url} onChange={handleChange} />
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <button type="submit">Save</button>
      </form>

      <h2>My Prompts</h2>
      {capsules.map(cap => (
        <div key={cap.id} className="capsule-card">
          <h3>{cap.prompt_title} ({cap.project_name})</h3>
          <p><strong>Prompt:</strong> {cap.prompt_text}</p>
          <div className="action-buttons">
            <button className="btn-edit" onClick={() => handleEdit(cap)}>Edit</button>
            <button className="btn-delete" onClick={() => handleDelete(cap.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Dashboard
