import {useEffect, useState} from 'react'
import './App.css'
import Map from './Map';

interface Challenge {
  id: number;
  description: string;
  status: string;
}

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/challenges')
        .then(response => response.json())
        .then(data => setChallenges(data))
  }, [])

  const handleComplete = (challenge: Challenge) => {
    fetch(`http://localhost:8080/api/challenges/${challenge.id}`, {
      method: 'POST',
    }).then(() => {
      fetch('http://localhost:8080/api/challenges')
          .then(response => response.json())
          .then(data => setChallenges(data));
    });
  };

  return (
    <div>
      <h1>Active Challenges:</h1>
      <ul>
        {challenges.map((challenge: Challenge) =>
          <li key={challenge.id}>
            {challenge.description}&nbsp;&nbsp;&nbsp;
            <button onClick={() => handleComplete(challenge)}>Complete Challenge</button>
          </li>
        )}
      </ul>
      <Map />
    </div>
  )
}

export default App
