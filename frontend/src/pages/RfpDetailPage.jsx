import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Paper, Typography, Button, Box, Grid, CircularProgress } from '@mui/material'
import axios from 'axios'
import { toast } from 'react-toastify'
import SendRfpCard from '../widgets/SendRfpCard'
import ComparisonModal from '../widgets/ComparisonModal'

const API = path => `http://localhost:4000/api${path}`

export default function RfpDetailPage(){
  const { id } = useParams()
  const [rfp, setRfp] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)

  useEffect(()=> {
    if (id) fetchRfp()
  }, [id])

  async function fetchRfp(){
    setLoading(true)
    try {
      const res = await axios.get(API(`/rfps/${id}`))
      console.log('Fetched RFP:', res.data)
      setRfp(res.data)
      setProposals(res.data.Proposals || [])
    } catch (e) {
      console.error('Failed to fetch RFP:', e.message)
      const errorMsg = e.response?.data?.error || 'Failed to fetch RFP details.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleCompare(){
    setComparing(true)
    try {
      const res = await axios.post(API(`/rfps/${id}/compare`))
      toast.success('Proposal comparison completed!')
      console.log('AI compare:', res.data)
      setComparisonResult(res.data)
      setComparisonOpen(true)
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || 'Comparison failed. Check backend logs.'
      toast.error(errorMsg)
    } finally {
      setComparing(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!rfp) {
    return <Typography>RFP not found.</Typography>
  }

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5">{rfp.title}</Typography>
            <Typography color="text.secondary" sx={{ mt:1, mb:2 }}>
              {rfp.description_raw}
            </Typography>

            <Typography variant="subtitle1">Structured JSON</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12 }}>{JSON.stringify(rfp.structured_json || {}, null, 2)}</pre>
          </Paper>

          <Box sx={{ mt:2 }}>
            <Paper sx={{ p:2 }}>
              <Typography variant="h6">Proposals</Typography>
              {proposals.length === 0 && <Typography color="text.secondary">No proposals ingested yet.</Typography>}
              {proposals.map(p => (
                <Box key={p.id} sx={{ borderBottom: '1px solid #eee', py:1 }}>
                  <Typography><strong>Proposal:</strong> {p.vendor_id || 'Unknown vendor'}</Typography>
                  <Typography variant="body2" color="text.secondary">{p.received_at}</Typography>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(p.parsed_json || {}, null, 2)}</pre>
                </Box>
              ))}
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <SendRfpCard rfp={rfp} />
          <Paper sx={{ mt:2, p:2 }}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleCompare}
              disabled={comparing || proposals.length === 0}
            >
              {comparing ? 'Comparing...' : 'Compare Proposals (AI)'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
      <ComparisonModal open={comparisonOpen} onClose={() => setComparisonOpen(false)} data={comparisonResult} />
    </div>
  )
}
