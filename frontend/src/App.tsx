import {useState} from 'react'
import { API_BASE_URL } from './config';
import './App.css'
import Map from './Map';
import Challenges from './Challenges';

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

  return (
    <div style={{ width: '95%', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Jet Lag: The Game – Battle for Vancouver</h1>
      <h3 style={{ textAlign: 'center' }}>Fruit Market Edition</h3>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'map' ? '#333' : '#ddd',
            color: activeTab === 'map' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Map
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'challenges' ? '#333' : '#ddd',
            color: activeTab === 'challenges' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Challenges
        </button>
        <button
          onClick={() => window.open('https://docs.google.com/document/d/1uHxpWV_sGMHQ17T4hG_Qxm5JjJ_uNXeDSoafO_Ndc8Q/edit?usp=sharing', '_blank', 'noopener,noreferrer')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ddd',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Rules
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'right', marginBottom: '20px' }}>
        <button
          onClick={handleReset}
          style={{ backgroundColor: '#ff4444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Reset Game
        </button>
      </div>

      <div>
        {activeTab === 'map' && <Map />}
        {activeTab === 'challenges' && <Challenges />}
      </div>
    </div>
  );
}

export default App
