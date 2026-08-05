import {useState} from 'react'
import {SERVER_URL} from './config';
import './App.css'
import Map from './Map';
import Challenges from './Challenges';

const API_BASE_URL = `${SERVER_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'challenges'>('map');

  const handleReset = () => {
    const keyword = window.prompt("To reset the game, enter \"bloodorange\" below:");

    if (keyword !== null) {
      fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
        headers: {
          'Reset-Key': keyword
        }
      }).then(response => {
        if (response.ok) {
          alert("Game successfully reset.");
        } else {
          alert("Incorrect keyword.");
        }
      }).catch(error => {
        console.error("Error connecting to server:", error);
      });
    }
  };

  const handleUndo = () => {
    if (window.confirm("Are you sure you want to undo the previous action?")) {
      fetch(`${API_BASE_URL}/undo`, { method: 'POST' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '800px', padding: '24px 20px 12px 20px', boxSizing: 'border-box' }}>
        <h1 style={{
          margin: '0 0 4px 0',
          textAlign: 'center',
          fontSize: '36px',
          fontWeight: '900',
          color: '#0f172a',
          lineHeight: '1.2'
        }}>
          Jet Lag: The Game – Battle for Vancouver
        </h1>
        <h3 style={{
          margin: 0,
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '600',
          color: '#64748b'
        }}>
          Fruit Market Edition •{' '}
          <a
            href="https://github.com/astroluxeon/jltg-battle-for-vancouver/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#f97316', textDecoration: 'none' }}
          >
            By Blood Orange
          </a>
        </h3>
      </div>

      <div style={{ width: '100%', maxWidth: '1000px', padding: '0 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#e2e8f0',
          padding: '6px',
          borderRadius: '9999px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('map')}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: '9999px', border: 'none',
              backgroundColor: activeTab === 'map' ? '#ffffff' : 'transparent',
              color: activeTab === 'map' ? '#0f172a' : '#64748b',
              fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              boxShadow: activeTab === 'map' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: '9999px', border: 'none',
              backgroundColor: activeTab === 'challenges' ? '#ffffff' : 'transparent',
              color: activeTab === 'challenges' ? '#0f172a' : '#64748b',
              fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              boxShadow: activeTab === 'challenges' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Challenges
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <button
            onClick={() => window.open('https://docs.google.com/document/d/1uHxpWV_sGMHQ17T4hG_Qxm5JjJ_uNXeDSoafO_Ndc8Q/edit?usp=sharing', '_blank', 'noopener,noreferrer')}
            style={{
              backgroundColor: '#c7dbf0', color: '#2563eb', padding: '6px 12px',
              borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '12px'
            }}
          >
            📄 Rules
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleUndo}
              style={{
                backgroundColor: '#c7dbf0', color: '#2563eb', padding: '6px 12px',
                borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '12px'
              }}
            >
              ↩️ Undo
            </button>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#fee2e2', color: '#dc2626', padding: '6px 12px',
                borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '12px'
              }}
            >
              ⚠️ Reset Game
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: '95%', maxWidth: '1000px', boxSizing: 'border-box', flexGrow: 1 }}>
        {activeTab === 'map' && <Map />}
        {activeTab === 'challenges' && <Challenges />}
      </div>
      <br />
    </div>
  );
}

export default App;