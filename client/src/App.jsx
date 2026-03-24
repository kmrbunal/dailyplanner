import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { DayProvider } from './context/DayContext'
import { AlarmProvider } from './hooks/useAlarms'
import PlannerLayout from './components/layout/PlannerLayout'

export default function App() {
  return (
    <>
      <SignedOut>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: '24px'
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            color: 'var(--accent-dark)',
            marginBottom: '8px',
            fontStyle: 'italic',
            letterSpacing: '2px'
          }}>Daily Planner</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            color: 'var(--text-light)',
            marginBottom: '24px',
            fontSize: '14px'
          }}>Sign in to sync your planner across devices</p>
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <AuthProvider>
          <StoreProvider>
            <DayProvider>
              <AlarmProvider>
                <PlannerLayout />
              </AlarmProvider>
            </DayProvider>
          </StoreProvider>
        </AuthProvider>
      </SignedIn>
    </>
  )
}
