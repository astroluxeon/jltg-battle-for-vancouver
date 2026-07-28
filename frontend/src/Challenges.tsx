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
  winner?: string;
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
      <h3>Active Challenges:</h3>
      <ul>
        {challenges
          .filter((challenge: Challenge) => challenge.type === 'claim')
          .map((challenge: Challenge) => (
            <li key={challenge.id}>
              {challenge.name}:&nbsp;{challenge.description}&nbsp;&nbsp;&nbsp;
              <button onClick={() => handleComplete(challenge)}>Complete Challenge</button>
            </li>
          ))}
      </ul>
    </div>
  )
}