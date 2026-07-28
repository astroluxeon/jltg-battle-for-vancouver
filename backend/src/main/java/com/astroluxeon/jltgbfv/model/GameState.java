package com.astroluxeon.jltgbfv.model;

import java.util.Map;
import java.util.List;

public class GameState {
    private Map<String, Region> regions;
    private List<Challenge> challenges;
    private List<Challenge> battles;

    public GameState() {}

    public GameState(Map<String, Region> regions, List<Challenge> challenges, List<Challenge> battles) {
        this.regions = regions;
        this.challenges = challenges;
        this.battles = battles;
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
}