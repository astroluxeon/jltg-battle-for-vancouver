import fs from 'fs/promises';
import path from 'path';
import {GameState, Region, Challenge, Team} from '../../shared/types';

const DATA_FILE = path.join(process.cwd(), 'game-data.json');
const DEFAULT_FILE = path.join(process.cwd(), 'game-default.json');
const ACTIVE_DECK_SIZE = 6;
const MAX_UNDO = 10;

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
}

class GameService {
  private data: GameState = {
    regions: {},
    challenges: [],
    battles: []
  };
  private undoStack: GameState[] = [];

  public async init(): Promise<void> {
    await this.loadFromFile();
  }

  public async loadFromFile(): Promise<void> {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      this.data = data.data;
      this.undoStack = data.undoStack || [];
      console.log('Loaded save data.');
    } catch (error) {
      console.log('No save data found or error reading data.');
      await this.initializeNewGame();
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const data = {
        data: this.data,
        undoStack: this.undoStack
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving file: ', error);
    }
  }

  public async initializeNewGame(): Promise<void> {
    try {
      const data = await fs.readFile(DEFAULT_FILE, 'utf-8');
      this.data = JSON.parse(data);
      this.undoStack = [];
    } catch (error) {
      console.error('Error initializing default game data: ', error);
      this.data = { regions: {}, challenges: [], battles: [] };
      this.undoStack = [];
    }

    for (let i = 0; i < ACTIVE_DECK_SIZE; i++) {
      this.drawCard(this.data.challenges);
    }

    await this.saveToFile();
  }

  private saveGameState(): void {
    const state = JSON.parse(JSON.stringify(this.data));
    this.undoStack.push(state);

    if (this.undoStack.length > MAX_UNDO) {
      this.undoStack.shift();
    }
  }

  public async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      return false;
    }

    const previous = this.undoStack.pop();

    if (previous) {
      this.data = JSON.parse(JSON.stringify(previous));
      await this.saveToFile();
      console.log("Undone last action.")
      return true;
    }

    return false;
  }

  public getChallenges(): Challenge[] {
    return this.data.challenges;
  }

  public getBattles(): Challenge[] {
    return this.data.battles;
  }

  public getRegions(): Region[] {
    return Object.values(this.data.regions);
  }

  private drawCard(deck: Challenge[]): Challenge | null {
    const inactive = deck.filter(c => c.status === 'INACTIVE');

    if (inactive.length > 0) {
      shuffle(inactive);
      const challenge = inactive[0];

      const target = deck.find(c => c.id === challenge?.id);
      if (target) {
        target.status = 'ACTIVE';
        return target;
      }
    }
    return null;
  }

  public async completeChallenge(id: number, team: Team): Promise<void> {
    const challenge = this.data.challenges.find(c => c.id === id);

    if (challenge && challenge.status === 'ACTIVE') {
      this.saveGameState();
      challenge.status = 'COMPLETED';
      challenge.team = team;
      this.drawCard(this.data.challenges);
      await this.saveToFile();
    }
  }

  public async startBattle(): Promise<Challenge | null> {
    this.saveGameState();
    const battle = this.drawCard(this.data.battles);
    await this.saveToFile();
    return battle;
  }

  public async completeBattle(id: number, team: Team): Promise<void> {
    const battle = this.data.battles.find(c => c.id === id);

    if (battle && battle.status === 'ACTIVE') {
      this.saveGameState();
      battle.status = 'COMPLETED';
      battle.team = team;
      await this.saveToFile();
    }
  }

  public async claimRegion(id: string, team: Team): Promise<void> {
    const region = this.data.regions[id];

    if (region) {
      if (region.locked) return;
      this.saveGameState();
      region.team = team;
      await this.saveToFile();
      console.log(`${region.name} claimed by ${team}`);
    } else {
      console.log(`Region ${id} not found.`);
    }
  }

  public async lockRegion(id: string, lock: boolean): Promise<void> {
    const region = this.data.regions[id];

    if (region) {
      this.saveGameState();
      region.locked = lock;
      await this.saveToFile();

      if (lock) {
        console.log(`${region.name} locked by ${region.team}`);
      }
    }
  }

  public async swapActiveChallenge(deactivate: number, activate: number): Promise<void> {
    const challenge1 = this.data.challenges.find(c => c.id === deactivate);
    const challenge2 = this.data.challenges.find(c => c.id === activate);

    if (challenge1?.status === 'ACTIVE' && challenge2?.status === 'INACTIVE') {
      this.saveGameState();
      challenge1.status = 'INACTIVE';
      challenge2.status = 'ACTIVE';
    }

    await this.saveToFile();
  }

  public async clearUndoStack(): Promise<void> {
    this.undoStack = [];
    await this.saveToFile();
  }
}

export const gameService = new GameService();