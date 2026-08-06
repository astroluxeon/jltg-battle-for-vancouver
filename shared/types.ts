export type Type = 'CLAIM' | 'BATTLE';
export type Status = 'INACTIVE' | 'ACTIVE' | 'COMPLETED';
export type Team = 'NONE' | 'BLUE' | 'RED';
export type Lock = 'NONE' | 'LOCK' | 'BATTLE';

export interface GameState {
  regions: Record<string, Region>;
  challenges: Challenge[];
  battles: Challenge[];
}

export interface Region {
  id: string;
  name: string;
  team: Team;
  lock: Lock;
}

export interface Challenge {
  type: Type;
  id: number;
  name: string;
  description: string;
  status: Status;
  team: Team;
}