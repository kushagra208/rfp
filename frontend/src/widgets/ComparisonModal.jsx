import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material'

export default function ComparisonModal({ open, onClose, data }){
  if (!data) return null;

  const evaluations = Array.isArray(data.evaluations) ? data.evaluations : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>AI Proposal Comparison</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Recommendation: {data.recommended_proposal_id || 'N/A'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{data.explanation || ''}</Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Proposal ID</TableCell>
              <TableCell>Vendor ID</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Spec Match</TableCell>
              <TableCell>Delivery Risk</TableCell>
              <TableCell align="right">Overall</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((ev) => (
              <TableRow key={ev.proposal_id || Math.random()}>
                <TableCell sx={{ wordBreak: 'break-all' }}>{ev.proposal_id}</TableCell>
                <TableCell sx={{ wordBreak: 'break-all' }}>{ev.vendor_id}</TableCell>
                <TableCell align="right">{ev.price_total != null ? ev.price_total : '-'}</TableCell>
                <TableCell align="right">{ev.spec_match_score != null ? ev.spec_match_score : '-'}</TableCell>
                <TableCell>{ev.delivery_risk || '-'}</TableCell>
                <TableCell align="right">{ev.overall_score != null ? ev.overall_score : '-'}</TableCell>
                <TableCell style={{ maxWidth: 300, whiteSpace: 'normal' }}>{ev.notes || ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
