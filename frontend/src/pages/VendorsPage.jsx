import React, { useEffect, useState } from 'react'
import { Paper, Typography, Button, List, ListItem, ListItemText, Divider, CircularProgress, Box } from '@mui/material'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const API = path => `http://localhost:4000/api${path}`

export default function VendorsPage(){
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=> { fetchVendors() }, [])

  async function fetchVendors(){
    setLoading(true)
    try {
      const res = await axios.get(API('/vendors'))
      setVendors(res.data)
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || 'Failed to fetch vendors.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="h5">Vendors</Typography>
        <Typography color="text.secondary">Manage vendor contacts used to send RFPs.</Typography>
        <Button component={Link} to="/vendors/add" sx={{ mt:2 }} variant="contained">Add Vendor</Button>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p:1 }}>
          <List>
            {vendors.map(v => (
              <React.Fragment key={v.id}>
                <ListItem>
                  <ListItemText primary={v.name} secondary={`${v.contact_name || '-'} • ${v.contact_email || '-'}`} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
            {vendors.length === 0 && <Typography sx={{ p:2 }} color="text.secondary">No vendors yet.</Typography>}
          </List>
        </Paper>
      )}
    </div>
  )
}
