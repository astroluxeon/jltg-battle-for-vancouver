import express, {Request, Response, NextFunction} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import {GameService} from './game-service';
import {GameStore} from './game-store';
import {Team, Lock} from "../../shared/types";
import {normalizeGameId} from '../../shared/game-id';

export function createGameServer(gameStore: GameStore) {
  const app = express();
  const server = http.createServer(app);
  const games = express.Router({mergeParams: true});

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  const getGameState = (gameService: GameService) => ({
    regions: gameService.getRegions(),
    challenges: gameService.getChallenges(),
    battles: gameService.getBattles()
  });

  const pushGameState = (req: Request) => {
    const id = normalizeGameId(req.params.gameId as string);
    io.to(id).emit('gameStateUpdate', getGameState(gameStore.getGame(id)!));
  };

  io.use(async (socket, next) => {
    try {
      const id = socket.handshake.auth.gameId;
      if (typeof id !== 'string' || !await gameStore.loadGame(id)) {
        return next(new Error('Game not found.'));
      }
      socket.handshake.auth.gameId = normalizeGameId(id);
      next();
    } catch (error) {
      console.error('Unable to load game:', error);
      next(new Error('Unable to load the game. Please try again.'));
    }
  });

  io.on('connection', (socket) => {
    const id = socket.handshake.auth.gameId as string;
    socket.join(id);
    socket.emit('gameStateUpdate', getGameState(gameStore.getGame(id)!));
  });

  app.post('/api/games', async (_req: Request, res: Response) => {
    const id = await gameStore.createGame();
    res.status(201).json({id});
  });

  games.use(async (req: Request, res: Response, next: NextFunction) => {
    const gameService = await gameStore.loadGame(req.params.gameId as string);
    if (!gameService) return res.status(404).json({error: 'Game not found. Check the game ID and try again.'});
    res.locals.gameService = gameService;
    next();
  });

  games.get('/data', (req: Request, res: Response) => {
    const data = getGameState(res.locals.gameService);
    console.log(`Loaded game: ${normalizeGameId(req.params.gameId as string)}`);
    res.json(data);
  });
  games.get('/regions', (_req: Request, res: Response) => res.json(res.locals.gameService.getRegions()));
  games.get('/challenges', (_req: Request, res: Response) => res.json(res.locals.gameService.getChallenges()));
  games.get('/battles', (_req: Request, res: Response) => res.json(res.locals.gameService.getBattles()));

  games.post('/undo', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    await gameService.undo();
    pushGameState(req);
    res.sendStatus(200);
  });

  games.post('/battles/new', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    await gameService.startBattle();
    pushGameState(req);
    res.sendStatus(200);
  });

  games.post('/reset', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    const resetKey = req.header('Reset-Key')?.toLowerCase();
    if (resetKey === 'banana') {
      await gameService.loadFromFile();
      pushGameState(req);
      res.status(403).send("Unauthorized reset attempt.");
    } else if (resetKey?.startsWith('banana ')) {
      const swapChallenges = resetKey.match(/^banana\s+(\d+)\s+(\d+)$/);
      if (swapChallenges) {
        const deactivate = parseInt(swapChallenges[1]!, 10);
        const activate = parseInt(swapChallenges[2]!, 10);
        await gameService.swapActiveChallenge(deactivate, activate);
        pushGameState(req);
      }
      res.status(403).send("Unauthorized reset attempt.");
    } else if (resetKey === 'peach') {
      await gameService.clearUndoStack();
      res.status(403).send("Unauthorized reset attempt.");
    } else if (resetKey === 'bloodorange') {
      await gameService.initializeNewGame();
      pushGameState(req);
      res.status(200).send("Game successfully reset.");
    } else {
      res.status(403).send("Unauthorized reset attempt.");
    }
  });

  games.post('/challenges/:id', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    const id = parseInt(req.params.id as string, 10);
    const team = req.query.team as string;
    if (!team) return res.status(400).send("Missing team parameter");

    await gameService.completeChallenge(id, team.toUpperCase() as Team);
    pushGameState(req);
    res.sendStatus(200);
  });

  games.post('/battles/:id', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    const id = parseInt(req.params.id as string, 10);
    const team = req.query.team as string;
    if (!team) return res.status(400).send("Missing team parameter");

    await gameService.completeBattle(id, team.toUpperCase() as Team);
    pushGameState(req);
    res.sendStatus(200);
  });

  games.post('/regions/:id/claim', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    const id = req.params.id;
    const team = req.query.team as string;
    if (!team) return res.status(400).send("Missing team parameter");

    await gameService.claimRegion(id as string, team.toUpperCase() as Team);
    pushGameState(req);
    res.sendStatus(200);
  });

  games.post('/regions/:id/lock', async (req: Request, res: Response) => {
    const gameService: GameService = res.locals.gameService;
    const id = req.params.id;
    const lock = req.query.lock as string;
    if (!lock) return res.status(400).send("Missing lock state");
    await gameService.lockRegion(id as string, lock.toUpperCase() as Lock);
    pushGameState(req);
    res.sendStatus(200);
  });

  app.use('/api/games/:gameId', games);
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Game request failed:', error);
    res.status(500).json({error: 'Unable to load or save the game. Please try again.'});
  });

  return {server, io};
}

async function startServer() {
  try {
    const gameStore = new GameStore();
    const {server} = createGameServer(gameStore);
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
    process.exitCode = 1;
  }
}

if (require.main === module) void startServer();
