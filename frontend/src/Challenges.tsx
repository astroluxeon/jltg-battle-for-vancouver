import {useEffect, useState} from 'react'

interface ChallengesProps {
  refreshKey: number;
}

interface Challenge {
  type: string;
  id: number;
  name: string;
  description: string;
  status: string;
  team: string;
}

export default function Challenges({ refreshKey }: ChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [battles, setBattles] = useState<Challenge[]>([]);

  const fetchData = () => {
    fetch('http://localhost:8080/api/challenges')
      .then(response => response.json())
      .then(data => setChallenges(data));

    fetch('http://localhost:8080/api/battles')
      .then(response => response.json())
      .then(data => setBattles(data));
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleCompleteChallenge = (challenge: Challenge, team: string) => {
    fetch(`http://localhost:8080/api/challenges/${challenge.id}?team=${team}`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleStartBattle = () => {
    fetch('http://localhost:8080/api/battles/new', {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleCompleteBattle = (challenge: Challenge, team: string) => {
    fetch(`http://localhost:8080/api/battles/${challenge.id}?team=${team}`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleUndoChallenge = () => {
    fetch(`http://localhost:8080/api/challenges/undo`, {
      method: 'POST',
    }).then(() => fetchData());
  };

  const handleUndoBattle = (challenge: Challenge) => {
    fetch(`http://localhost:8080/api/battles/${challenge.id}/undo`, {
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
              <strong>{activeBattle.name}:</strong> {activeBattle.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleUndoBattle(activeBattle)}
                style={{ backgroundColor: '#666', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Undo Start Battle
              </button>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'RED')}
                style={{ backgroundColor: '#cc0000', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Red Wins
              </button>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'BLUE')}
                style={{ backgroundColor: '#0000cc', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Blue Wins
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#666', fontStyle: 'italic' }}>No battles are currently active.</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {lastCompletedBattle && (
                <button
                  onClick={() => handleUndoBattle(lastCompletedBattle)}
                  style={{ backgroundColor: '#666', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Undo Last Battle Win
                </button>
              )}
              <button
                onClick={handleStartBattle}
                style={{ backgroundColor: '#cc0000', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start Next Battle Challenge
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        {/* 2. Group the Header and the new Global Undo Button together */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Active Challenges</h3>

          {/* Only render the undo button if the stack isn't empty (there is at least 1 completed challenge) */}
          {challenges.some(c => c.status === 'COMPLETED') && (
            <button
              onClick={handleUndoChallenge}
              style={{ backgroundColor: '#888', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              Undo Last
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
                  borderBottom: '1px solid #eee',
                  textDecoration: challenge.status === 'COMPLETED' ? 'line-through' : 'none',
                  color: challenge.status === 'COMPLETED' ? '#888' : '#000',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div style={{ textAlign: 'center', padding: '0 160px' }}>
                  <strong>{challenge.name}</strong>:&nbsp;{challenge.description}
                </div>

                {/* 3. The individual Undo button is gone! We only render Red/Blue if it's active. */}
                {challenge.status !== 'COMPLETED' && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    display: 'flex',
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
                  </div>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}