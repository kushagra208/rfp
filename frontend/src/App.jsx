import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import RfpsPage from './pages/RfpsPage'
import CreateRfpPage from './pages/CreateRfpPage'
import RfpDetailPage from './pages/RfpDetailPage'
import VendorsPage from './pages/VendorsPage'
import AddVendorPage from './pages/AddVendorPage'

export default function App() {
  return (
    <>
      <ToastContainer position="bottom-right" autoClose={4000} theme="light" />
      <AppBar position="static" color="primary">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
              RFP Manager
            </Typography>
            <Button component={Link} to="/rfps" color="inherit" size="small">RFPs</Button>
            <Button component={Link} to="/rfps/create" color="inherit" size="small">Create RFP</Button>
            <Button component={Link} to="/vendors" color="inherit" size="small">Vendors</Button>
          </Box>
          <Box>
            <Button component={Link} to="/rfps" color="inherit" variant="outlined" size="small">Dashboard</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 6 }}>
        <Routes>
          <Route path="/" element={<RfpsPage />} />
          <Route path="/rfps" element={<RfpsPage />} />
          <Route path="/rfps/create" element={<CreateRfpPage />} />
          <Route path="/rfps/:id" element={<RfpDetailPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/add" element={<AddVendorPage />} />
        </Routes>
      </Container>
    </>
  )
}
