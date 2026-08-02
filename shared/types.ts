export type Team = 'NONE' | 'BLUE' | 'RED';
export type Type = 'CLAIM' | 'BATTLE';
export type Status = 'INACTIVE' | 'ACTIVE' | 'COMPLETED';

export interface GameData {
  regions: Record<string, Region>;
  challenges: Challenge[];
  battles: Challenge[];
  challengeHistory: [number, number][];
  battleHistory: number[];
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