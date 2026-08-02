export type Team = 'NONE' | 'BLUE' | 'RED';
export type Status = 'INACTIVE' | 'ACTIVE' | 'COMPLETED';
export type ChallengeType = 'CLAIM' | 'BATTLE';

export interface Region {
  id: string;
  name: string;
  team: Team;
  locked: boolean;
}

export interface Challenge {
  type: ChallengeType;
  id: number;
  name: string;
  description: string;
  status: Status;
  team: Team;
}