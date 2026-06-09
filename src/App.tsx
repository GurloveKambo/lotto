import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Entry } from './pages/Entry'
import { Strategies } from './pages/Strategies'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

type Page = 'dashboard' | 'entry' | 'strategies' | 'reports' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard />
      case 'entry':       return <Entry />
      case 'strategies':  return <Strategies />
      case 'reports':     return <Reports />
      case 'settings':    return <Settings />
    }
  }

  return (
    <Layout page={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  )
}
