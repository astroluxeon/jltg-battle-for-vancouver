package com.astroluxeon.jltgbfv.service;

import org.springframework.stereotype.Service;
import com.astroluxeon.jltgbfv.model.Region;
import com.astroluxeon.jltgbfv.model.Challenge;
import com.astroluxeon.jltgbfv.model.Status;
import com.astroluxeon.jltgbfv.model.Team;

import java.util.*;

@Service
public class GameService {
    private Map<String, Region> regions;
    private List<Challenge> challenges;

    public GameService() {
        regions = new HashMap<>();
        challenges = new ArrayList<>();

        // TODO: initialize regions and challenges
        regions.put("downtown", new Region("downtown", "Downtown"));
        regions.put("west-end", new Region("west-end", "West End"));
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

    public Collection<Region> getRegions() {
        return regions.values();
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

    public void claimRegion(String id, String team) {
        if (regions.get(id) != null) {
            try {
                regions.get(id).setTeam(Team.valueOf(team));
                System.out.println(regions.get(id).getName() + " claimed by " + team);
            } catch (Exception e) {
                System.out.println(team + " is not a valid team.");
            }
        }
    }

    public void lockRegion(String id, boolean lock) {
        if (regions.get(id) != null) {
            regions.get(id).setLocked(lock);
            System.out.println(regions.get(id).getName() + " locked by " + regions.get(id).getTeam());
        }
    }
}
