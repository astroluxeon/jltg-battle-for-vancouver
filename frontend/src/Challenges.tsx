import {useEffect, useState} from 'react'

interface ChallengesProps {
  refreshKey: number;
}

interface Challenge {
  id: number;
  description: string;
  status: string;
}

export default function Challenges({ refreshKey }: ChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/challenges')
      .then(response => response.json())
      .then(data => setChallenges(data));
  }, [refreshKey]);

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
      <br />
      <h3>Active Challenges:</h3>
      <ul>
        {challenges.map((challenge: Challenge) =>
          <li key={challenge.id}>
            {challenge.description}&nbsp;&nbsp;&nbsp;
            <button onClick={() => handleComplete(challenge)}>Complete Challenge</button>
          </li>
        )}
      </ul>
    </div>
  )
}