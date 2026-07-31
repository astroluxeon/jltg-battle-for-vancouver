package com.astroluxeon.jltgbfv.controller;

import com.astroluxeon.jltgbfv.model.Region;
import com.astroluxeon.jltgbfv.service.GameService;
import com.astroluxeon.jltgbfv.model.Challenge;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collection;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/status")
    public String status() {
        return "Success";
    }

    @GetMapping("/challenges")
    public List<Challenge> getChallenges() {
        return gameService.getChallenges();
    }

    @GetMapping("/battles")
    public List<Challenge> getBattles() {
        return gameService.getBattles();
    }

    @GetMapping("/regions")
    public Collection<Region> getRegions() {
        return gameService.getRegions();
    }

    @PostMapping("/challenges/{id}")
    public void completeChallenge(@PathVariable int id, @RequestParam String team) {
        gameService.completeChallenge(id, team.toUpperCase());
    }

    @PostMapping("/challenges/undo")
    public void undoChallenge() {
        gameService.undoChallenge();
    }

    @PostMapping("/battles/new")
    public Challenge startBattle() {
        return gameService.startBattle();
    }

    @PostMapping("battles/{id}")
    public void completeBattle(@PathVariable int id, @RequestParam String team) {
        gameService.completeBattle(id, team.toUpperCase());
    }

    @PostMapping("/battles/{id}/undo")
    public void undoBattle(@PathVariable int id) {
        gameService.undoBattle(id);
    }

    @PostMapping("/regions/{id}/claim")
    public void claimRegion(@PathVariable String id, @RequestParam String team) {
        gameService.claimRegion(id, team.toUpperCase());
    }

    @PostMapping("/regions/{id}/lock")
    public void lockRegion(@PathVariable String id, @RequestParam boolean lock) {
        gameService.lockRegion(id, lock);
    }

    @PostMapping("/reset")
    public ResponseEntity<String> resetGame(@RequestHeader(value = "Reset-Key", required = false) String resetKey) {
        if (!resetKey.equals("bloodorange")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized reset attempt.");
        }

        gameService.initializeNewGame();
        return ResponseEntity.ok("Game successfully reset.");
    }
}
