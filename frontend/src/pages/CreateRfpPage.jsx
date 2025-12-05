import React, { useState } from 'react'
import { Paper, Typography, TextField, Button, Box } from '@mui/material'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const API = path => `http://localhost:4000/api${path}`

export default function CreateRfpPage() {
  const [title, setTitle] = useState('')
  const [natural, setNatural] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleCreate() {
    if (!natural.trim()) {
      toast.error('Please add a description for the RFP.')
      return
    }
    if (!title.trim()) {
      toast.error('Please add a title for the RFP.')
      return
    }
    
    setLoading(true)
    try {
      const res = await axios.post(API('/rfps'), { natural_text: natural, title: title })
      const rfp = res.data
      // redirect to rfp detail if id exists
      if (rfp?.id) {
        toast.success('RFP created successfully!')
        navigate(`/rfps/${rfp.id}`)
      } else {
        toast.info('RFP created (check response details).')
      }
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || e.message || 'Failed to create RFP. Check backend.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Create RFP from natural text</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Write a simple procurement brief — the AI will convert it into a structured RFP.
      </Typography>

      <TextField
        label="RFP title"
        placeholder="e.g., Office Supplies Procurement"
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <TextField
        label="RFP description / brief"
        multiline
        minRows={6}
        value={natural}
        onChange={e => setNatural(e.target.value)}
        fullWidth
      />

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create RFP'}
        </Button>
        <Button variant="outlined" onClick={() => { setTitle(''); setNatural(''); }}>Clear</Button>
      </Box>
    </Paper>
  )
}
