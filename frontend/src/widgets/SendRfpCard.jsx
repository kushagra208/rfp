import React, { useEffect, useState } from 'react'
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button, Checkbox, ListItemText, CircularProgress, Box } from '@mui/material'
import axios from 'axios'
import { toast } from 'react-toastify'

const API = path => `http://localhost:4000/api${path}`

export default function SendRfpCard({ rfp }) {
  const [vendors, setVendors] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(()=> {
    fetchVendors()
  }, [])

  async function fetchVendors(){
    setLoading(true)
    try {
      const res = await axios.get(API('/vendors'))
      setVendors(res.data)
      setSelected(res.data.map(v=>v.id))
    } catch (e) {
      console.error('Failed to fetch vendors', e)
      const errorMsg = e.response?.data?.error || 'Failed to fetch vendors.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!selected || selected.length === 0) {
      toast.error('Select at least one vendor.')
      return
    }
    
    setSending(true)
    try {
      const res = await axios.post(API(`/rfps/${rfp.id}/send`), { vendorIds: selected })
      const results = res.data.results || [];
      const successCount = results.filter(r => r.status === 'sent').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      if (errorCount > 0) {
        toast.warning(`Sent to ${successCount} vendor(s), ${errorCount} failed.`);
      } else {
        toast.success(`RFP sent to ${successCount} vendor(s)!`);
      }
      console.log('send result', res.data)
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || 'Failed to send RFP.'
      toast.error(errorMsg)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p:2 }}>
      <Typography variant="subtitle1">Send RFP</Typography>
      <FormControl fullWidth sx={{ mt:2 }}>
        <InputLabel id="vendor-select-label">Vendors</InputLabel>
        <Select
          labelId="vendor-select-label"
          multiple
          value={selected}
          onChange={(e) => {
            const value = e.target.value;
            setSelected(typeof value === 'string' ? value.split(',') : value);
          }}
          renderValue={(selectedIds) => {
            const names = vendors
              .filter(v => selectedIds.includes(v.id))
              .map(v => v.name)
              .join(', ');
            return names || "Select vendors";
          }}
          label="Vendors"
          disabled={sending}
        >
          {vendors.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              <Checkbox checked={selected.indexOf(v.id) > -1} />
              <ListItemText primary={`${v.name}`} secondary={v.contact_email} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button 
        variant="contained" 
        fullWidth 
        sx={{ mt: 2 }} 
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send RFP'}
      </Button>
    </Paper>
  )
}
