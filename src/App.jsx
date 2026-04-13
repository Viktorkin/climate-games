import { useNavigate } from 'react-router-dom'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,500;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,300&display=swap');`

export default function App() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0e0e0a 0%, #1a2210 50%, #0e1408 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Lora', serif",
      padding: '24px 16px',
    }}>
      <style>{FONTS}</style>

      <div style={{ maxWidth: 720, width: '100%', textAlign: 'center' }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <span style={{
            fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase',
            color: '#c8821a', display: 'block', marginBottom: 14,
          }}>
            Interactive Climate Education
          </span>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 6vw, 52px)',
            color: '#f4efe4',
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Climate Action
          </h1>
          <p style={{
            color: '#8a7a60', fontSize: 15, fontStyle: 'italic', lineHeight: 1.7,
            maxWidth: 480, margin: '0 auto',
          }}>
            Two simulations. Two scales of impact. Both grounded in real science.
            Choose your role.
          </p>
        </div>

        {/* Game Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}>

          {/* Global Policy Game */}
          <button
            onClick={() => navigate('/global')}
            style={{
              background: '#13130d',
              border: '1.5px solid #2a2a1e',
              borderRadius: 10,
              padding: '32px 28px',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#f4efe4',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1.5px solid #c8821a55'
              e.currentTarget.style.background = '#1a1a10'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1.5px solid #2a2a1e'
              e.currentTarget.style.background = '#13130d'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 14 }}>🌍</div>
            <div style={{
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#c8821a', marginBottom: 8,
            }}>
              Global Scale · 5 Decades
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: '#f4efe4', marginBottom: 12, lineHeight: 1.2,
            }}>
              A Degree of Consequence
            </h2>
            <p style={{ fontSize: 13, color: '#a09070', lineHeight: 1.7, marginBottom: 18 }}>
              You are a UN Climate Coordinator. Five decisions, five decades, one planet.
              IPCC AR6-grounded science. Every choice shifts global temperature, sea levels,
              and biodiversity.
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {['CO₂ tracking', 'Policy decisions', 'AI narratives', 'Rewind & branch'].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, background: '#2a2a1e', color: '#8a7a60',
                  padding: '3px 8px', borderRadius: 3, letterSpacing: '0.05em',
                }}>{tag}</span>
              ))}
            </div>
            <div style={{
              marginTop: 22, color: '#c8821a', fontSize: 13,
              fontFamily: "'Source Serif 4', serif", fontStyle: 'italic',
            }}>
              Play now →
            </div>
          </button>

          {/* Local Community Game */}
          <button
            onClick={() => navigate('/local')}
            style={{
              background: '#faf6ee',
              border: '1.5px solid #d4c9a4',
              borderRadius: 10,
              padding: '32px 28px',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#2d2416',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1.5px solid #4a7c3f'
              e.currentTarget.style.background = '#f0f7e8'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1.5px solid #d4c9a4'
              e.currentTarget.style.background = '#faf6ee'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 14 }}>🌿</div>
            <div style={{
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#4a7c3f', marginBottom: 8,
            }}>
              Local Scale · 5 Years
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: '#1e2d14', marginBottom: 12, lineHeight: 1.2,
            }}>
              What You Can Actually Do
            </h2>
            <p style={{ fontSize: 13, color: '#6b5e4a', lineHeight: 1.7, marginBottom: 18 }}>
              You are a suburban homeowner and parent. Five years of real community choices —
              school boards, neighborhood organizing, local elections, household action.
              Grounded in peer-reviewed research on local climate leverage.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Community metrics', 'Ripple effects', 'AI narratives', 'Rewind & branch'].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, background: '#e8f0e0', color: '#5a7a4a',
                  padding: '3px 8px', borderRadius: 3, letterSpacing: '0.05em',
                }}>{tag}</span>
              ))}
            </div>
            <div style={{
              marginTop: 22, color: '#4a7c3f', fontSize: 13,
              fontFamily: "'Lora', serif", fontStyle: 'italic',
            }}>
              Play now →
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: '#4a4030', lineHeight: 1.7 }}>
          Both simulations use the Claude AI API to generate unique narrative consequences
          for every decision. Science citations drawn from IPCC AR6, IEA, EPA, and
          peer-reviewed research.
        </p>

      </div>
    </div>
  )
}
