import fs from 'fs/promises';
import path from 'path';
import {GameState, Region, Challenge, Team, Lock, ChallengeState} from '../../shared/types';

const DEFAULT_FILE = path.join(process.cwd(), 'game-default.json');
const ACTIVE_DECK_SIZE = 6;
const MAX_UNDO = 10;

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
}

export interface SavedGame {
  data: GameState;
  undoStack: ChallengeState[];
}

export class GameService {
  private data: GameState;
  private undoStack: ChallengeState[];

  constructor(
    savedGame: SavedGame,
    private readonly persist: (game: SavedGame) => Promise<void>,
    private readonly reload: () => Promise<SavedGame>,
    private readonly defaultFile = DEFAULT_FILE
  ) {
    this.data = structuredClone(savedGame.data);
    this.undoStack = structuredClone(savedGame.undoStack);
  }

  public async loadFromFile(): Promise<void> {
    const savedGame = await this.reload();
    this.data = structuredClone(savedGame.data);
    this.undoStack = structuredClone(savedGame.undoStack);
  }

  private async saveToFile(): Promise<void> {
    await this.persist({data: this.data, undoStack: this.undoStack});
  }

  public async initializeNewGame(): Promise<void> {
    const data = await fs.readFile(this.defaultFile, 'utf-8');
    this.data = JSON.parse(data);
    this.undoStack = [];

    for (let i = 0; i < ACTIVE_DECK_SIZE; i++) {
      this.drawCard(this.data.challenges);
    }

    await this.saveToFile();
  }

  private saveGameState(): void {
    const snapshot: ChallengeState = {
      challenges: JSON.parse(JSON.stringify(this.data.challenges)),
      battles: JSON.parse(JSON.stringify(this.data.battles))
    };

    this.undoStack.push(snapshot);

    if (this.undoStack.length > MAX_UNDO) {
      this.undoStack.shift();
    }
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
      if (region.lock !== 'NONE') return;
      region.team = team;
      await this.saveToFile();
      console.log(`${region.name} claimed by ${team}`);
    } else {
      console.log(`Region ${id} not found.`);
    }
  }

  public async lockRegion(id: string, lock: Lock): Promise<void> {
    const region = this.data.regions[id];

    if (region) {
      region.lock = lock;
      await this.saveToFile();

      const action = {NONE: 'unlocked', LOCK: 'locked', BATTLE: 'battle locked'}[lock];
      console.log(`${region.name} ${action} by ${region.team}`);
    }
  }

  public async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) return false;

    const prevState = this.undoStack.pop();

    if (prevState) {
      this.data.challenges = JSON.parse(JSON.stringify(prevState.challenges));
      this.data.battles = JSON.parse(JSON.stringify(prevState.battles));

      await this.saveToFile();
      return true;
    }

    return false;
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
