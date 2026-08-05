import express, {Request, Response} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import {gameService} from './game-service';
import {Team} from "../../shared/types";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const pushGameState = () => {
  io.emit('gameStateUpdate', {
    regions: gameService.getRegions(),
    challenges: gameService.getChallenges(),
    battles: gameService.getBattles()
  });
};

io.on('connection', (socket) => {
  console.log('Client connected.');
  socket.emit('gameStateUpdate', {
    regions: gameService.getRegions(),
    challenges: gameService.getChallenges(),
    battles: gameService.getBattles()
  });
});

app.get('/api/data', (req: Request, res: Response) => {
  res.json({
    regions: gameService.getRegions(),
    challenges: gameService.getChallenges(),
    battles: gameService.getBattles()
  });
});

app.get('/api/regions', (req: Request, res: Response) => res.json(gameService.getRegions()));
app.get('/api/challenges', (req: Request, res: Response) => res.json(gameService.getChallenges()));
app.get('/api/battles', (req: Request, res: Response) => res.json(gameService.getBattles()));

app.post('/api/undo', async (req: Request, res: Response) => {
  await gameService.undo();
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/battles/new', async (req: Request, res: Response) => {
  await gameService.startBattle();
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/reset', async (req: Request, res: Response) => {
  const resetKey = req.header('Reset-Key')?.toLowerCase();
  if (resetKey === 'banana') {
    await gameService.loadFromFile();
    pushGameState();
    res.status(403).send("Unauthorized reset attempt.");
  } else if (resetKey?.startsWith('banana ')) {
    const swapChallenges = resetKey.match(/^banana\s+(\d+)\s+(\d+)$/);
    if (swapChallenges) {
      const deactivate = parseInt(swapChallenges[1]!, 10);
      const activate = parseInt(swapChallenges[2]!, 10);
      await gameService.swapActiveChallenge(deactivate, activate);
      pushGameState();
    }
    res.status(403).send("Unauthorized reset attempt.");
  } else if (resetKey === 'peach') {
    await gameService.clearUndoStack();
    res.status(403).send("Unauthorized reset attempt.");
  } else if (resetKey === 'bloodorange') {
    await gameService.initializeNewGame();
    pushGameState();
    res.status(200).send("Game successfully reset.");
  } else {
    res.status(403).send("Unauthorized reset attempt.");
  }
});

app.post('/api/challenges/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const team = req.query.team as string;
  if (!team) return res.status(400).send("Missing team parameter");

  await gameService.completeChallenge(id, team.toUpperCase() as Team);
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/battles/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const team = req.query.team as string;
  if (!team) return res.status(400).send("Missing team parameter");

  await gameService.completeBattle(id, team.toUpperCase() as Team);
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/regions/:id/claim', async (req: Request, res: Response) => {
  const id = req.params.id;
  const team = req.query.team as string;
  if (!team) return res.status(400).send("Missing team parameter");

  await gameService.claimRegion(id as string, team.toUpperCase() as Team);
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/regions/:id/lock', async (req: Request, res: Response) => {
  const id = req.params.id;
  const lock = req.query.lock === 'true';
  await gameService.lockRegion(id as string, lock);
  pushGameState();
  res.sendStatus(200);
});

async function startServer() {
  try {
    await gameService.init();
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
  }
}

startServer();