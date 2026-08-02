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
  console.log('A client connected to the dashboard');
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

app.post('/api/challenges/undo', async (req: Request, res: Response) => {
  await gameService.undoChallenge();
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/battles/new', async (req: Request, res: Response) => {
  await gameService.startBattle();
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/battles/undo', async (req: Request, res: Response) => {
  await gameService.undoBattle();
  pushGameState();
  res.sendStatus(200);
});

app.post('/api/reset', async (req: Request, res: Response) => {
  const resetKey = req.header('Reset-Key');
  if (resetKey !== 'bloodorange') {
    res.status(403).send("Unauthorized reset attempt.");
    return;
  }
  await gameService.initializeNewGame();
  pushGameState();
  res.status(200).send("Game successfully reset.");
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
    // CRITICAL: We now listen on the HTTP `server` object, not the Express `app` object!
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
  }
}

startServer();