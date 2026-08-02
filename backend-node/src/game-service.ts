import fs from 'fs/promises';
import path from 'path';
import { Region, Challenge, Team } from './types';

export interface GameData {
  regions: Record<string, Region>;
  challenges: Challenge[];
  battles: Challenge[];
  challengeHistory: [number, number][];
}

const DATA_FILE = path.join(process.cwd(), 'game-data.json');
const DEFAULT_FILE = path.join(process.cwd(), 'game-default.json');
const ACTIVE_DECK_SIZE = 6;

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
}

class GameService {
  private data: GameData = {
    regions: {},
    challenges: [],
    battles: [],
    challengeHistory: []
  };

  public async init(): Promise<void> {
    await this.loadFromFile();
  }

  private async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      this.data = JSON.parse(data);
      console.log('Loaded save data.');
    } catch (error) {
      console.log('No save data found or error reading data. Initializing new game...');
      await this.initializeNewGame();
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const data = JSON.stringify(this.data, null, 2);
      await fs.writeFile(DATA_FILE, data, 'utf-8');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  public async initializeNewGame(): Promise<void> {
    try {
      const data = await fs.readFile(DEFAULT_FILE, 'utf-8');
      this.data = JSON.parse(data);
      this.data.challengeHistory = [];
    } catch (error) {
      console.error('Error initializing default game data:', error);
      this.data = { regions: {}, challenges: [], battles: [], challengeHistory: [] };
    }

    for (let i = 0; i < ACTIVE_DECK_SIZE; i++) {
      this.drawCard(this.data.challenges);
    }

    console.log('Initialized new game.');
    await this.saveToFile();
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
    const inactiveCards = deck.filter(c => c.status === 'INACTIVE');

    if (inactiveCards.length > 0) {
      shuffle(inactiveCards);
      const challenge = inactiveCards[0];

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
      challenge.status = 'COMPLETED';
      challenge.team = team;

      const newCard = this.drawCard(this.data.challenges);
      const id2 = newCard ? newCard.id : -1;

      this.data.challengeHistory.push([id, id2]);
      await this.saveToFile();
    }
  }

  public async startBattle(): Promise<Challenge | null> {
    const c = this.drawCard(this.data.battles);
    await this.saveToFile();
    return c;
  }

  public async completeBattle(id: number, team: Team): Promise<void> {
    const battle = this.data.battles.find(c => c.id === id);

    if (battle && battle.status === 'ACTIVE') {
      battle.status = 'COMPLETED';
      battle.team = team;
      await this.saveToFile();
    }
  }

  public async claimRegion(id: string, team: Team): Promise<void> {
    const region = this.data.regions[id];
    if (region) {
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
      region.locked = lock;
      await this.saveToFile();
      if (lock) {
        console.log(`${region.name} locked by ${region.team}`);
      }
    }
  }

  public async undoChallenge(): Promise<void> {
    if (this.data.challengeHistory.length === 0) return;

    const [id1, id2] = this.data.challengeHistory.pop()!;

    const challenge1 = this.data.challenges.find(c => c.id === id1);
    if (challenge1) {
      challenge1.status = 'ACTIVE';
      challenge1.team = 'NONE';
    }

    if (id2 !== -1) {
      const challenge2 = this.data.challenges.find(c => c.id === id2);
      if (challenge2) {
        challenge2.status = 'INACTIVE';
      }
    }

    await this.saveToFile();
  }

  public async undoBattle(id: number): Promise<void> {
    const battle = this.data.battles.find(c => c.id === id);

    if (battle) {
      if (battle.status === 'COMPLETED') {
        battle.status = 'ACTIVE';
        battle.team = 'NONE';
      } else if (battle.status === 'ACTIVE') {
        battle.status = 'INACTIVE';
        battle.team = 'NONE';
      }
      await this.saveToFile();
    }
  }
}

export const gameService = new GameService();