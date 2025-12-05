import React, { useEffect, useState } from 'react'
import { Paper, Typography, Grid, Button, Card, CardContent, CircularProgress, Box } from '@mui/material'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const API = path => `http://localhost:4000/api${path}`

export default function RfpsPage() {
  const [rfps, setRfps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRfps()
  }, [])

  async function fetchRfps() {
    setLoading(true)
    try {
      const res = await axios.get(API('/rfps'))
      setRfps(res.data || [])
    } catch (e) {
      console.warn('Could not fetch rfps list:', e.message)
      const errorMsg = e.response?.data?.error || 'Failed to fetch RFPs.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={8}>
          <Typography variant="h5">RFPs</Typography>
          <Typography color="text.secondary">Create, send and review incoming proposals.</Typography>
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'right' }}>
          <Button component={Link} to="/rfps/create" variant="contained">Create New RFP</Button>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {rfps.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography>No RFPs found. Use "Create New RFP" to generate a new one.</Typography>
            </Paper>
          </Grid>
        )}

        {rfps.map(r => (
          <Grid item xs={12} md={6} key={r.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{r.title || 'Untitled RFP'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {r.description_raw ? r.description_raw.substring(0, 140) + '...' : ''}
                </Typography>

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Button component={Link} to={`/rfps/${r.id}`} size="small">View</Button>
                  <Button component={Link} to={`/rfps/${r.id}`} size="small">Compare</Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}
