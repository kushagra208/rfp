import React, { useState } from 'react'
import { Paper, Typography, TextField, Button, Box } from '@mui/material'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const API = path => `http://localhost:4000/api${path}`

export default function AddVendorPage(){
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleAdd(){
    if (!name.trim() || !contactEmail.trim()) {
      toast.error('Please provide vendor name and contact email.')
      return
    }
    
    setLoading(true)
    try {
      await axios.post(API('/vendors'), { name, contact_name: contactName, contact_email: contactEmail })
      toast.success('Vendor added successfully!')
      navigate('/vendors')
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || e.message || 'Failed to add vendor.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p:3 }}>
      <Typography variant="h6">Add Vendor</Typography>
      <Box sx={{ mt:2, display:'flex', flexDirection:'column', gap:2 }}>
        <TextField 
          label="Vendor Name" 
          value={name} 
          onChange={e=>setName(e.target.value)} 
          fullWidth 
          disabled={loading}
        />
        <TextField 
          label="Contact Name" 
          value={contactName} 
          onChange={e=>setContactName(e.target.value)} 
          fullWidth 
          disabled={loading}
        />
        <TextField 
          label="Contact Email" 
          value={contactEmail} 
          onChange={e=>setContactEmail(e.target.value)} 
          fullWidth 
          disabled={loading}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleAdd} disabled={loading}>
            {loading ? 'Adding...' : 'Add Vendor'}
          </Button>
          <Button variant="outlined" onClick={()=>navigate('/vendors')} disabled={loading}>Cancel</Button>
        </Box>
      </Box>
    </Paper>
  )
}
