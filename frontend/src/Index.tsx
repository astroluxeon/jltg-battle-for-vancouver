import {useState} from 'react';
import type {SubmitEvent} from 'react';
import {SERVER_URL} from './config';
import {normalizeGameId} from '../../shared/game-id';

export default function Index({onSelect}: {onSelect: (id: string) => void}) {
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGame = async (createNew: boolean) => {
    setLoading(true);
    setError('');
    try {
      const id = normalizeGameId(gameId);
      const response = await fetch(createNew
        ? `${SERVER_URL}/api/games`
        : `${SERVER_URL}/api/games/${encodeURIComponent(id)}/data`,
      {method: createNew ? 'POST' : 'GET'});
      if (!response.ok) {
        throw new Error(response.status === 404
          ? 'Game not found. Check the game ID and try again.'
          : 'Unable to load the game. Please try again.');
      }
      const result = await response.json();
      onSelect(createNew ? result.id : id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (gameId.trim()) void loadGame(false);
  };

  return (
    <main className="game-selection">
      <section className="game-selection-card" aria-labelledby="game-selection-title">
        <h1 id="game-selection-title">Battle for Vancouver</h1>
        <p>Create a new game or enter a game ID to continue playing.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="game-id">Game ID</label>
          <input
            id="game-id"
            value={gameId}
            onChange={event => setGameId(event.target.value.toUpperCase())}
            placeholder="GAMEID"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            minLength={6}
            maxLength={6}
            pattern="[A-Za-z2-9]{6}"
            aria-describedby="game-id-hint"
            required
            disabled={loading}
          />
          <button className="game-primary-button" disabled={loading || gameId.trim().length !== 6}>
            {loading ? 'Loading…' : 'Load Game'}
          </button>
        </form>
        <div className="game-selection-divider">or</div>
        <button className="game-default-button" disabled={loading} onClick={() => void loadGame(true)}>
          Create Game
        </button>
        {error && <p className="game-selection-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
