import fs from 'fs/promises';
import path from 'path';
import {GameService, SavedGame} from './game-service';
import {generateGameId} from './game-id';
import {normalizeGameId} from '../../shared/game-id';

type SavedGames = Record<string, SavedGame>;

export class GameStore {
  private games: SavedGames = {};
  private readonly services = new Map<string, GameService>();
  private readonly reservedIds = new Set<string>();
  private pendingWrite: Promise<void> = Promise.resolve();
  private savedGamesLoad: Promise<void> | undefined;

  constructor(
    private readonly dataFile = path.join(process.cwd(), 'game-data.json'),
    private readonly defaultFile = path.join(process.cwd(), 'game-default.json'),
    private readonly generateId = generateGameId
  ) {}

  private ensureSavedGames(): Promise<void> {
    if (!this.savedGamesLoad) {
      this.savedGamesLoad = this.readSavedGames().catch(error => {
        this.savedGamesLoad = undefined;
        throw error;
      });
    }
    return this.savedGamesLoad;
  }

  private async readSavedGames(): Promise<void> {
    let raw: string;
    try {
      raw = await fs.readFile(this.dataFile, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }

    const saved = JSON.parse(raw);
    // Preserve saves from the original single-game format, including undo history.
    const isLegacySave = saved.data?.regions && Array.isArray(saved.data?.challenges);
    this.games = isLegacySave ? {[this.allocateId()]: {...saved, undoStack: saved.undoStack || []}} : saved;
    this.reservedIds.clear();
    if (isLegacySave) {
      await this.saveToFile();
      console.log(`Migrated save with game ID: ${Object.keys(this.games)[0]}`);
    }
  }

  public getGame(id: string): GameService | undefined {
    return this.services.get(normalizeGameId(id));
  }

  public async loadGame(id: string): Promise<GameService | undefined> {
    await this.ensureSavedGames();
    const normalizedId = normalizeGameId(id);
    const loaded = this.services.get(normalizedId);
    if (loaded) return loaded;

    const savedId = Object.keys(this.games).find(key => normalizeGameId(key) === normalizedId);
    if (!savedId) return undefined;
    const service = this.makeService(savedId, this.games[savedId]!);
    this.services.set(normalizedId, service);
    return service;
  }

  public async createGame(): Promise<string> {
    await this.ensureSavedGames();
    const id = this.allocateId();
    try {
      const service = this.makeService(id, {
        data: {regions: {}, challenges: [], battles: []},
        undoStack: []
      });
      await service.initializeNewGame();
      this.services.set(id, service);
      console.log(`Created game: ${id}`);
      return id;
    } finally {
      this.reservedIds.delete(id);
    }
  }

  private allocateId(): string {
    let id: string;
    do {
      id = this.generateId();
    } while (Object.hasOwn(this.games, id) || this.reservedIds.has(id));
    // Reserve before reading the template so concurrent requests cannot reuse an ID.
    this.reservedIds.add(id);
    return id;
  }

  private makeService(id: string, savedGame: SavedGame): GameService {
    return new GameService(savedGame, async game => {
      this.games[id] = structuredClone(game);
      await this.saveToFile();
    }, async () => {
      await this.pendingWrite;
      const games: SavedGames = JSON.parse(await fs.readFile(this.dataFile, 'utf-8'));
      const game = games[id];
      if (!game) throw new Error(`Game ${id} no longer exists in the save file.`);
      this.games[id] = structuredClone(game);
      return game;
    }, this.defaultFile);
  }

  private saveToFile(): Promise<void> {
    // Serialize writes across games, and replace the file only after a full write.
    const snapshot = JSON.stringify(this.games, null, 2) + '\n';
    const write = this.pendingWrite.then(async () => {
      const temporaryFile = `${this.dataFile}.tmp`;
      await fs.writeFile(temporaryFile, snapshot, 'utf-8');
      await fs.rename(temporaryFile, this.dataFile);
    });
    this.pendingWrite = write.catch(() => {});
    return write;
  }
}
