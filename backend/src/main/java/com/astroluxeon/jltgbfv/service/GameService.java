package com.astroluxeon.jltgbfv.service;

import org.springframework.stereotype.Service;
import com.astroluxeon.jltgbfv.model.Region;
import com.astroluxeon.jltgbfv.model.Challenge;
import com.astroluxeon.jltgbfv.model.Status;

import java.util.List;
import java.util.ArrayList;

@Service
public class GameService {
    private List<Region> regions;
    private List<Challenge> challenges;

    public GameService() {
        regions = new ArrayList<>();
        challenges = new ArrayList<>();
        regions.add(new Region(0, "Downtown"));
        regions.add(new Region(1, "West End"));
        challenges.add(new Challenge(0, "Challenge 0"));
        challenges.add(new Challenge(1, "Challenge 1"));
        challenges.add(new Challenge(2, "Challenge 2"));
        challenges.add(new Challenge(3, "Challenge 3"));
        challenges.get(0).setStatus(Status.ACTIVE);
        challenges.get(1).setStatus(Status.ACTIVE);
        challenges.get(2).setStatus(Status.ACTIVE);
    }

    public List<Challenge> getActiveChallenges() {
        List<Challenge> active = new ArrayList<>();
        for (Challenge c : challenges) {
            if (c.getStatus() == Status.ACTIVE) {
                active.add(c);
            }
        }
        return active;
    }

    public void completeChallenge(int id) {
        challenges.get(id).setStatus(Status.COMPLETED);
        for (int i = id + 1; i < challenges.size(); i++) {
            if (challenges.get(i).getStatus() == Status.INACTIVE) {
                challenges.get(i).setStatus(Status.ACTIVE);
                break;
            }
        }
    }
}
