import fs from 'fs/promises';
import path from 'path';
import {GameData, Region, Challenge, Team} from '../../shared/types';

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
    challengeHistory: [],
    battleHistory: []
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
      console.log('No save data found or error reading data. Initializing new game.');
      await this.initializeNewGame();
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const data = JSON.stringify(this.data, null, 2);
      await fs.writeFile(DATA_FILE, data, 'utf-8');
    } catch (error) {
      console.error('Error saving file: ', error);
    }
  }

  public async initializeNewGame(): Promise<void> {
    try {
      const data = await fs.readFile(DEFAULT_FILE, 'utf-8');
      this.data = JSON.parse(data);
    } catch (error) {
      console.error('Error initializing default game data:', error);
      this.data = { regions: {}, challenges: [], battles: [], challengeHistory: [], battleHistory: [] };
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
      challenge.status = 'COMPLETED';
      challenge.team = team;

      const newChallenge = this.drawCard(this.data.challenges);
      const id2 = newChallenge ? newChallenge.id : -1;

      this.data.challengeHistory.push([id, id2]);
      await this.saveToFile();
    }
  }

  public async startBattle(): Promise<Challenge | null> {
    const battle = this.drawCard(this.data.battles);
    await this.saveToFile();
    return battle;
  }

  public async completeBattle(id: number, team: Team): Promise<void> {
    const battle = this.data.battles.find(c => c.id === id);

    if (battle && battle.status === 'ACTIVE') {
      battle.status = 'COMPLETED';
      battle.team = team;
      this.data.battleHistory.push(id);
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

  public async undoBattle(): Promise<void> {
    const active = this.data.battles.find(c => c.status === 'ACTIVE');

    if (active) {
      active.status = 'INACTIVE';
      active.team = 'NONE';
    } else {
      if (this.data.battleHistory.length === 0) return;

      const id = this.data.battleHistory.pop()!;
      const battle = this.data.battles.find(c => c.id === id);
      if (battle) {
        battle.status = 'ACTIVE';
        battle.team = 'NONE';
      }
    }

    await this.saveToFile();
  }
}

export const gameService = new GameService();