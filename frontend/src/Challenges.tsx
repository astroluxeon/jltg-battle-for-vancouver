import {useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {Challenge, Team} from '../../shared/types';
import {SERVER_URL} from './config';

const API_BASE_URL = `${SERVER_URL}/api`;

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [battles, setBattles] = useState<Challenge[]>([]);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('gameStateUpdate', (data) => {
      setChallenges(data.challenges);
      setBattles(data.battles);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCompleteChallenge = (challenge: Challenge, team: Team) => {
    fetch(`${API_BASE_URL}/challenges/${challenge.id}?team=${team}`, { method: 'POST' });
  };

  const handleStartBattle = () => {
    fetch(`${API_BASE_URL}/battles/new`, { method: 'POST' });
  };

  const handleCompleteBattle = (challenge: Challenge, team: Team) => {
    fetch(`${API_BASE_URL}/battles/${challenge.id}?team=${team}`, { method: 'POST' });
  };

  const activeBattle = battles.find(b => b.status === 'ACTIVE');

  return (
    <div>
      <div style={{
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: activeBattle ? '0 10px 25px rgba(220, 38, 38, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
        border: activeBattle ? '2px solid #fecaca' : '2px solid #a8a8cc',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: activeBattle ? '#dc2626' : '#64748b', fontSize: '22px' }}>
            ⚔️ Battle Challenge
          </h3>
        </div>

        {activeBattle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '18px', color: '#1e293b', lineHeight: '1.4' }}>
              <strong style={{ fontSize: '18px' }}>{activeBattle.id}. {activeBattle.name}</strong>
              <p style={{ fontSize: '16px', margin: '8px 0 0 0', color: '#475569' }}>{activeBattle.description}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'RED')}
                style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #b91c1c' }}
              >
                Red Win
              </button>
              <button
                onClick={() => handleCompleteBattle(activeBattle, 'BLUE')}
                style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #1d4ed8' }}
              >
                Blue Win
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>No Active Battle</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={handleStartBattle}
                style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #047857' }}
              >
                Start Battle
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#e2e8f0',
        minHeight: '100vh',
        border: '2px solid #a8a8cc',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 8px' }}>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#64748b' }}>Challenges</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {challenges
              .filter((challenge: Challenge) => challenge.type === 'CLAIM' && challenge.status !== 'INACTIVE')
              .sort((a: Challenge, b: Challenge) => {
                if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
                if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
                return a.id - b.id;
              })
              .map((challenge: Challenge) => {
                const isCompleted = challenge.status === 'COMPLETED';

                return (
                  <div
                    key={challenge.id}
                    style={{
                      backgroundColor: isCompleted ? '#f8fafc' : '#ffffff',
                      opacity: isCompleted ? 0.7 : 1,
                      borderRadius: '20px',
                      padding: '20px',
                      boxShadow: isCompleted ? 'none' : '0 4px 10px rgba(0,0,0,0.05)',
                      border: isCompleted ? '2px dashed #cbd5e1' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? '#94a3b8' : '#1e293b' }}>
                      <strong style={{ fontSize: '18px', display: 'block', marginBottom: '6px' }}>
                        {challenge.id}. {challenge.name}
                      </strong>
                      <span style={{ fontSize: '16px', color: isCompleted ? '#94a3b8' : '#475569', lineHeight: '1.4' }}>
                        {challenge.description}
                      </span>
                    </div>

                    {!isCompleted && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleCompleteChallenge(challenge, 'RED')}
                          style={{ flex: 1, minWidth: '100px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #b91c1c' }}
                        >
                          Red Complete
                        </button>
                        <button
                          onClick={() => handleCompleteChallenge(challenge, 'BLUE')}
                          style={{ flex: 1, minWidth: '100px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #1d4ed8' }}
                        >
                          Blue Complete
                        </button>
                        <button
                          onClick={() => handleCompleteChallenge(challenge, 'NONE')}
                          style={{ flex: 1, minWidth: '100px', padding: '12px', borderRadius: '9999px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #cbd5e1' }}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}