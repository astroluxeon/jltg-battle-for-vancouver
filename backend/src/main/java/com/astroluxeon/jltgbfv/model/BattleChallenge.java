package com.astroluxeon.jltgbfv.model;

public class BattleChallenge extends Challenge {
    private Team winner;

    public BattleChallenge() {}

    public BattleChallenge(int id, String name, String description) {
        super(id, name, description);
        this.winner = Team.NONE;
    }

    public Team getWinner() {
        return winner;
    }

    public void setWinner(Team winner) {
        this.winner = winner;
    }
}
