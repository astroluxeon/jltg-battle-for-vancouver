export type Type = 'CLAIM' | 'BATTLE';
export type Status = 'INACTIVE' | 'ACTIVE' | 'COMPLETED';
export type Team = 'NONE' | 'BLUE' | 'RED';

export interface GameState {
  regions: Record<string, Region>;
  challenges: Challenge[];
  battles: Challenge[];
}

export interface Region {
  id: string;
  name: string;
  team: Team;
  locked: boolean;
}

export interface Challenge {
  type: Type;
  id: number;
  name: string;
  description: string;
  status: Status;
  team: Team;
}