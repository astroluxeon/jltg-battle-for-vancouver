package com.astroluxeon.jltgbfv.model;

import java.util.Map;
import java.util.List;
import java.util.Stack;

public class GameState {
    private Map<String, Region> regions;
    private List<Challenge> challenges;
    private List<Challenge> battles;
    private Stack<Integer> challengeHistory;

    public GameState() {}

    public GameState(Map<String, Region> regions, List<Challenge> challenges, List<Challenge> battles, Stack<Integer> challengeHistory) {
        this.regions = regions;
        this.challenges = challenges;
        this.battles = battles;
        this.challengeHistory = challengeHistory;
    }

    public Map<String, Region> getRegions() {
        return regions;
    }

    public void setRegions(Map<String, Region> regions) {
        this.regions = regions;
    }

    public List<Challenge> getChallenges() {
        return challenges;
    }

    public void setChallenges(List<Challenge> challenges) {
        this.challenges = challenges;
    }

    public List<Challenge> getBattles() {
        return battles;
    }

    public void setBattles(List<Challenge> battles) {
        this.battles = battles;
    }

    public Stack<Integer> getChallengeHistory() {
        return challengeHistory;
    }

    public void setChallengeHistory(Stack<Integer> challengeHistory) {
        this.challengeHistory = challengeHistory;
    }
}