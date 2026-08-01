import {useEffect, useState} from 'react'
import { API_BASE_URL } from './config';

interface Challenge {
  type: string;
  id: number;
  name: string;
  description: string;
  status: string;
  team: string;
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [battles, setBattles] = useState<Challenge[]>([]);

  const fetchData = () => {
    if (navigator.onLine && document.visibilityState === 'visible') {
      fetch(`${API_BASE_URL}/challenges`)
        .then(response => response.json())
        .then(data => setChallenges(data))
        .catch(error => console.error("Failed to fetch challenges:", error));

      fetch(`${API_BASE_URL}/battles`)
        .then(response => response.json())
        .then(data => setBattles(data))
        .catch(error => console.error("Failed to fetch battles:", error));
    }
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 2000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleCompleteChallenge = (challenge: Challenge, team: string) => {
    fetch(`${API_BASE_URL}/challenges/${challenge.id}?team=${team}`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleStartBattle = () => {
    fetch(`${API_BASE_URL}/battles/new`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleCompleteBattle = (challenge: Challenge, team: string) => {
    fetch(`${API_BASE_URL}/battles/${challenge.id}?team=${team}`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleUndoChallenge = () => {
    fetch(`${API_BASE_URL}/challenges/undo`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleUndoBattle = (challenge: Challenge) => {
    fetch(`${API_BASE_URL}/battles/${challenge.id}/undo`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const activeBattle = battles.find(b => b.status === 'ACTIVE');
  const lastCompletedBattle = [...battles].reverse().find(b => b.status === 'COMPLETED');

  return (
    <div>
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#fff0f0',
        border: '2px solid #cc0000',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ marginTop: 0, color: '#cc0000' }}>Current Battle</h3>
        {activeBattle ? (
          <div>
            <div style={{ fontSize: '18px', marginBottom: '15px' }}>
              <strong>{activeBattle.id}.&nbsp;{activeBattle.name}:</strong> {activeBattle.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleUndoBattle(activeBattle)}
                style={{ backgroundColor: '#666666', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Undo Start Battle
              </button>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'RED')}
                style={{ backgroundColor: '#cc0000', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Red Win
              </button>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'BLUE')}
                style={{ backgroundColor: '#0000cc', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Blue Win
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#666666', fontStyle: 'italic' }}>No battles are currently active.</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {lastCompletedBattle && (
                <button
                  onClick={() => handleUndoBattle(lastCompletedBattle)}
                  style={{ backgroundColor: '#666666', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Undo Last Battle Win
                </button>
              )}
              <button
                onClick={handleStartBattle}
                style={{ backgroundColor: '#cc0000', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start Battle Challenge
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Challenges</h3>

          {challenges.some(c => c.status === 'COMPLETED') && (
            <button
              onClick={handleUndoChallenge}
              style={{ backgroundColor: '#666666', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              Undo Complete/Skip Challenge
            </button>
          )}
        </div>

        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {challenges
            .filter((challenge: Challenge) => challenge.type === 'claim' && challenge.status !== 'INACTIVE')
            .sort((a: Challenge, b: Challenge) => {
              if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
              if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
              return a.id - b.id;
            })
            .map((challenge: Challenge) => (
              <li
                key={challenge.id}
                style={{
                  position: 'relative',
                  marginBottom: '10px',
                  padding: '15px 10px',
                  minHeight: '120px',
                  borderBottom: '1px solid #eee',
                  textDecoration: challenge.status === 'COMPLETED' ? 'line-through' : 'none',
                  color: challenge.status === 'COMPLETED' ? '#888888' : '#000000',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div style={{ textAlign: 'center', padding: '0 160px' }}>
                  <strong>{challenge.id}.&nbsp;{challenge.name}</strong>:&nbsp;{challenge.description}
                </div>

                {challenge.status !== 'COMPLETED' && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handleCompleteChallenge(challenge, 'RED')}
                      style={{ backgroundColor: '#cc0000', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Red Complete
                    </button>
                    <button
                      onClick={() => handleCompleteChallenge(challenge, 'BLUE')}
                      style={{ backgroundColor: '#0000cc', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Blue Complete
                    </button>
                    <button
                      onClick={() => handleCompleteChallenge(challenge, 'NONE')}
                      style={{ backgroundColor: '#666666', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Skip
                    </button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}