package com.astroluxeon.jltgbfv;

import com.astroluxeon.jltgbfv.service.GameService;
import com.astroluxeon.jltgbfv.model.Challenge;
import org.springframework.web.bind.annotation.*;

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
        return "Backend is running";
    }

    @GetMapping("/challenges")
    public List<Challenge> getChallenges() {
        return gameService.getActiveChallenges();
    }

    @PostMapping("/challenges/{id}")
    public void markChallengeComplete(@PathVariable int id) {
        gameService.completeChallenge(id);
    }
}
