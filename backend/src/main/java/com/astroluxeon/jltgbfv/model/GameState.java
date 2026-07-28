package com.astroluxeon.jltgbfv.model;

import java.util.Map;
import java.util.List;

public class GameState {
    private Map<String, Region> regions;
    private List<Challenge> challenges;

    public GameState() {}

    public GameState(Map<String, Region> regions, List<Challenge> challenges) {
        this.regions = regions;
        this.challenges = challenges;
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
}