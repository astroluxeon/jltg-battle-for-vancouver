import {useState} from 'react'
import './App.css'
import Map from './Map';
import Challenges from './Challenges';

function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'challenges'>('map');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the game? All data will be lost.")) {
      fetch('http://localhost:8080/api/reset', {
        method: 'POST',
      }).then(() => {
        setRefreshKey(prevKey => prevKey + 1);
      });
    }
  };

  return (
    <div style={{ width: '95%', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>JLTG: Battle for Vancouver</h1>

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
        {activeTab === 'map' && <Map refreshKey={refreshKey} />}
        {activeTab === 'challenges' && <Challenges refreshKey={refreshKey} />}
      </div>
    </div>
  );
}

export default App
