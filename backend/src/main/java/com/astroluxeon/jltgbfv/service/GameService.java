package com.astroluxeon.jltgbfv.service;

import com.astroluxeon.jltgbfv.model.*;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Service
public class GameService {
    private final String DATA_FILE = "game-data.json";
    private final String DEFAULT_FILE = "game-default.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, Region> regions;
    private List<Challenge> challenges;
    private List<Challenge> battles;

    public GameService() {
        loadFromFile();
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
                saveToFile();
                break;
            }
        }
    }

    public void claimRegion(String id, String team) {
        if (regions.get(id) != null) {
            try {
                regions.get(id).setTeam(Team.valueOf(team));
                saveToFile();
                System.out.println(regions.get(id).getName() + " claimed by " + team);
            } catch (Exception e) {
                System.out.println(team + " is not a valid team.");
            }
        }
    }

    public void lockRegion(String id, boolean lock) {
        if (regions.get(id) != null) {
            regions.get(id).setLocked(lock);
            saveToFile();
            if (lock) {
                System.out.println(regions.get(id).getName() + " locked by " + regions.get(id).getTeam());
            }
        }
    }

    public void initializeNewGame() {
//        File file = new File(DEFAULT_FILE);
//        if (file.exists()) {
//            try {
//                GameState state = objectMapper.readValue(file, GameState.class);
//                this.regions = state.getRegions();
//                this.challenges = state.getChallenges();
//                System.out.println("Initialized new game.");
//            } catch (IOException e) {
//                System.out.println("Error initializing game: " + e.getMessage());
//            }
//        } else {
//            System.out.println("No data found.");
//        }

        this.regions = new HashMap<>();
        this.challenges = new ArrayList<>();

        regions.put("arbutus", new Region("arbutus", "Arbutus Ridge"));
        regions.put("grandview", new Region("grandview", "Grandview-Woodland"));
        regions.put("killarney", new Region("killarney", "Killarney"));
        regions.put("strathcona", new Region("strathcona", "Strathcona"));
        regions.put("sunset", new Region("sunset", "Sunset"));
        regions.put("hastings", new Region("hastings", "Hastings-Sunrise"));
        regions.put("kerrisdale", new Region("kerrisdale", "Kerrisdale"));
        regions.put("south-cambie", new Region("south-cambie", "South Cambie"));
        regions.put("riley-park", new Region("riley-park", "Riley Park"));
        regions.put("shaughnessy", new Region("shaughnessy", "Shaughnessy"));
        regions.put("fraserview", new Region("fraserview", "Victoria-Fraserview"));
        regions.put("west-point-grey", new Region("west-point-grey", "West Point Grey"));
        regions.put("mount-pleasant", new Region("mount-pleasant", "Mount Pleasant"));
        regions.put("collingwood", new Region("collingwood", "Renfrew-Collingwood"));
        regions.put("west-end", new Region("west-end", "West End"));
        regions.put("downtown", new Region("downtown", "Downtown"));
        regions.put("marpole", new Region("marpole", "Marpole"));
        regions.put("oakridge", new Region("oakridge", "Oakridge"));
        regions.put("dunbar", new Region("dunbar", "Dunbar-Southlands"));
        regions.put("fairview", new Region("fairview", "Fairview"));
        regions.put("kensington", new Region("kensington", "Kensington-Cedar Cottage"));
        regions.put("kitsilano", new Region("kitsilano", "Kitsilano"));

        challenges.add(new ClaimChallenge(0, "Challenge 1", "Challenge 1"));
        challenges.add(new ClaimChallenge(1, "Challenge 2", "Challenge 2"));
        challenges.add(new ClaimChallenge(2, "Challenge 3", "Challenge 3"));
        challenges.add(new ClaimChallenge(3, "Challenge 4", "Challenge 4"));
        challenges.add(new ClaimChallenge(4, "Challenge 5", "Challenge 5"));
        challenges.get(0).setStatus(Status.ACTIVE);
        challenges.get(1).setStatus(Status.ACTIVE);
        challenges.get(2).setStatus(Status.ACTIVE);

        battles.add(new BattleChallenge(0, "Battle 1", "Battle 1"));
        battles.add(new BattleChallenge(1, "Battle 2", "Battle 2"));
        battles.add(new BattleChallenge(2, "Battle 3", "Battle 3"));

        System.out.println("Initialized new game.");
        saveToFile();
    }

    private void loadFromFile() {
        File file = new File(DATA_FILE);
        if (file.exists()) {
            try {
                GameState state = objectMapper.readValue(file, GameState.class);
                this.regions = state.getRegions();
                this.challenges = state.getChallenges();
                System.out.println("Loaded data from file.");
            } catch (IOException e) {
                System.out.println("Error reading file: " + e.getMessage());
                initializeNewGame();
            }
        } else {
            System.out.println("No save file found.");
            initializeNewGame();
        }
    }

    private void loadDefault() {
        File file = new File(DEFAULT_FILE);
        if (file.exists()) {
            try {
                GameState state = objectMapper.readValue(file, GameState.class);
                this.regions = state.getRegions();
                this.challenges = state.getChallenges();
                System.out.println("Loaded data from file.");
            } catch (IOException e) {
                System.out.println("Error reading file: " + e.getMessage());
                initializeNewGame();
            }
        } else {
            System.out.println("No file found.");
            initializeNewGame();
        }
    }

    private void saveToFile() {
        try {
            GameState state = new GameState(this.regions, this.challenges);
            objectMapper.writeValue(new File(DATA_FILE), state);
        } catch (IOException e) {
            System.out.println("Error saving file: " + e.getMessage());
        }
    }
}
