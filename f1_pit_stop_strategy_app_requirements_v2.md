# Race Strategy Challenge: F1-Inspired Pit Stop Decision App

## 1. Project overview

The app is a browser-based recruitment activity for BSc Mathematics. It places S5/S6 pupils and open day visitors in the role of a race strategist on an F1-style pit wall. Their task is to decide when to pit, which tyre compound to choose, and whether to make further stops as the race unfolds.

The activity should show that mathematics is useful, applied, strategic and fun. It should connect directly to ideas such as optimisation, modelling, probability, uncertainty, trade-offs, rates of change, data interpretation, simulation and decision-making under imperfect information.

The app must run entirely in the browser using **HTML, CSS and JavaScript only**. It must not require a server, database, build pipeline, backend framework, external API, login system or internet connection once loaded.

## 2. Core proposition

The user is not trying to drive the car. The user is making strategic decisions from the pit wall.

The player sees a fixed race situation with 20 cars, each with a current position, gap, tyre compound, tyre wear level, and likely strategy. The player controls one car and chooses when to pit and which compound to fit. The simulation then animates the rest of the race, allowing the player to pause and make further pit decisions. A safety car may occur with a 10% probability and, if it does, the simulation pauses immediately so that the player can reconsider strategy.

The app should not make the optimal strategy obvious. In particular, it must not be clear that the best approach is to pit immediately onto new tyres at the first opportunity. The initial race state, tyre degradation, traffic, pit loss, compound rules and opponent strategies should create a genuine strategic trade-off.

## 3. Target audience

Primary audience:

- S5/S6 school pupils considering university study.
- Pupils who may enjoy maths but may not yet see how it applies to exciting real-world decisions.

Secondary audience:

- Open day visitors.
- Parents and guardians attending recruitment events.
- Offer holders and prospective applicants.

The activity should be usable in two modes:

1. **Guided stand/classroom mode**: an academic facilitates a small group around one screen for approximately 10-15 minutes.
2. **Quick self-guided mode**: a visitor uses the app independently for approximately 5 minutes.

The first version should be optimised for small groups around one laptop or tablet screen.

## 4. Educational message

The app should communicate five messages:

1. Maths helps people make better decisions.
2. Maths is about modelling messy real-world situations, not just performing calculations.
3. Maths is useful in sport, engineering, logistics, finance, computing and AI.
4. Maths at Dundee is applied, relevant and connected to real problems.
5. Maths can be fun, visual and strategic.

A suggested closing message:

> In this challenge, you used mathematical modelling to make a decision under uncertainty. You balanced tyre degradation, time loss, traffic, probability and risk. That is what applied mathematics often looks like in the real world.

## 5. Technical constraints

The app must be implemented using only:

- HTML
- CSS
- JavaScript
- Browser localStorage for leaderboard data

The app must not require:

- A server
- A backend database
- A JavaScript framework
- A package manager
- A build step
- An account or login
- Internet access during use
- External APIs

Preferred file structure:

```text
/race-strategy-challenge
  index.html
  styles.css
  app.js
  data.js
  README.md
```

The app should work by opening `index.html` directly in a browser.

## 6. Overall user flow

1. User sees a title screen and brief explanation.
2. User enters a team name or chooses to continue anonymously.
3. User sees the current race state.
4. User reviews the 20-car field, tyre compounds, gaps, tyre wear and uncertainty indicators.
5. User chooses whether to pit now, stay out, or plan an intended pit lap.
6. If pitting, user selects a tyre compound.
7. User presses **Commit Strategy**.
8. The race simulation animates lap by lap.
9. During the animation, the user can pause and make further pit-stop decisions.
10. The user may make zero, one, or multiple additional pit stops.
11. If a safety car occurs, the app pauses immediately and gives the user a chance to respond.
12. At the end of the race, the app shows final result, score, leaderboard entry and mathematical explanation.
13. User can restart the same scenario.
14. Facilitator can clear the leaderboard from an admin/reset control.

## 7. Race scenario design

### 7.1 Fixed base scenario

The app should use a fixed base race scenario. This makes the activity easier to facilitate and allows different groups to discuss the same strategic problem.

The race should not begin on Lap 1. The app should place the user partway through a race, where some strategy has already unfolded. This gives richer context and avoids the simplistic interpretation that the player should pit immediately at the start.

Recommended default:

- Race length: 40 laps
- App starts: Lap 14
- User's car: currently P7
- Player must finish the race
- Pit lane time loss under normal racing: 22 seconds
- Pit lane time loss under safety car: 11 seconds
- Safety car probability: 10% per race, not per lap
- Weather: not included
- Crashes, damage and reliability failures: not included

### 7.2 Safety car randomness

The base race should be deterministic except for the safety car.

Safety car rule:

- At the start of each playthrough, the app should determine whether a safety car will occur.
- There should be a 10% probability that a safety car occurs during the race.
- If a safety car is selected, the app should choose a lap between Lap 18 and Lap 32.
- When the simulation reaches the safety car lap, the race must pause immediately.
- The user should be shown a clear safety car alert and given the opportunity to pit or continue.
- Pit loss should be reduced while the safety car is active.
- The safety car should last for 2 laps.
- After the safety car phase, racing resumes.

For fairness, the leaderboard should record whether a safety car occurred in that run.

Optional facilitator setting:

- Add a hidden or admin-only toggle to disable the safety car for fully deterministic demonstration mode.
- Default should be safety car enabled.

## 8. The 20-car starting race state

The app must include a full 20-car field at the point where the activity begins.

Each car must have:

- Car ID
- Team name
- Driver name or fictional driver label
- Current position
- Current lap gap to leader
- Gap to car ahead
- Tyre compound
- Tyre age in laps
- Tyre wear percentage
- Estimated tyre life remaining
- Strategy type
- Probability/confidence note about whether they will pit soon
- Whether this car is player-controlled

Names should be fictional and not use real F1 team or driver names. The visual style may be F1-inspired, but avoid relying on real trademarks.

### 8.1 Suggested fixed field at Lap 14

The following table should be used as the default scenario data. Values may be refined during implementation, but the strategic shape should remain.

| Pos | Car | Team | Driver | Gap to Leader | Gap Ahead | Tyre | Tyre Age | Wear | Strategy Type | Pit Soon Confidence | Notes |
|---:|---|---|---|---:|---:|---|---:|---:|---|---|---|
| 1 | C01 | Apex GP | Voss | +0.0s | - | Medium | 13 | 42% | One-stop likely | Medium | Leader managing tyres |
| 2 | C02 | Apex GP | Renaud | +2.4s | 2.4s | Medium | 13 | 44% | One-stop likely | Medium | Similar strategy to leader |
| 3 | C03 | Velocity | Harker | +5.9s | 3.5s | Soft | 8 | 61% | Early stopper likely | High | Fast but tyres fading |
| 4 | C04 | Velocity | Sato | +8.3s | 2.4s | Hard | 13 | 26% | Long first stint | Low | May stay out much longer |
| 5 | C05 | Northstar | Iversen | +12.1s | 3.8s | Medium | 13 | 46% | Balanced | Medium | Within undercut range |
| 6 | C06 | Orbit | Malik | +15.0s | 2.9s | Soft | 9 | 68% | Must pit soon | Very High | Vulnerable on worn softs |
| 7 | C07 | Dundee Racing | Player Car | +17.6s | 2.6s | Medium | 13 | 49% | Player decision | Unknown | Player-controlled car |
| 8 | C08 | Helix | Novak | +19.8s | 2.2s | Hard | 13 | 29% | Long first stint | Low | Could block after pit exit |
| 9 | C09 | Northstar | Bell | +22.9s | 3.1s | Medium | 13 | 50% | Balanced | Medium | Similar tyres to player |
| 10 | C10 | Falcon | Okafor | +26.3s | 3.4s | Soft | 7 | 55% | Early stopper likely | High | Fast short-run pace |
| 11 | C11 | Falcon | Mercer | +29.5s | 3.2s | Hard | 13 | 24% | Long first stint | Very Low | May not pit until late |
| 12 | C12 | Helix | Quinn | +33.2s | 3.7s | Medium | 12 | 45% | Balanced | Medium | In potential pit traffic |
| 13 | C13 | Zenith | Duarte | +36.8s | 3.6s | Hard | 13 | 31% | Long first stint | Low | Slower car but durable tyres |
| 14 | C14 | Zenith | Cole | +40.7s | 3.9s | Soft | 10 | 72% | Must pit soon | Very High | Likely to pit within 2 laps |
| 15 | C15 | Summit | Shah | +44.4s | 3.7s | Medium | 13 | 52% | Balanced | Medium | Could undercut back markers |
| 16 | C16 | Summit | Lenz | +48.9s | 4.5s | Hard | 13 | 28% | Long first stint | Low | Traffic risk after stop |
| 17 | C17 | Vector | Marek | +54.0s | 5.1s | Soft | 6 | 48% | Two-stop likely | Medium | May be aggressive |
| 18 | C18 | Vector | Price | +59.6s | 5.6s | Medium | 13 | 56% | Balanced | Medium | Tyres beginning to drop off |
| 19 | C19 | Nova | Singh | +66.2s | 6.6s | Hard | 13 | 33% | Long first stint | Low | Slow but difficult traffic |
| 20 | C20 | Nova | Adler | +73.5s | 7.3s | Soft | 11 | 79% | Must pit soon | Very High | Severe degradation |

### 8.2 Strategic purpose of this field

The field is designed to create uncertainty and trade-off:

- The player is near cars with different tyre strategies.
- Some cars ahead are vulnerable on soft tyres.
- Some cars behind are on hard tyres and may stay out.
- Pitting immediately may put the player into traffic behind slower hard-tyre runners.
- Staying out too long risks losing time to cars that undercut.
- The best strategy should depend on interpreting gaps, tyre wear and compound choice.
- There should not be a single obviously correct answer from the initial screen.

## 9. Tyre model

The app must model three dry tyre compounds:

1. Soft
2. Medium
3. Hard

No wet or intermediate tyres are required.

### 9.1 Compound characteristics

Suggested characteristics:

| Compound | Base Pace Bonus | Degradation Rate | Effective Life | Strategic Meaning |
|---|---:|---:|---:|---|
| Soft | Fastest | High | 10-14 laps | Good for short aggressive stints |
| Medium | Balanced | Moderate | 16-22 laps | Flexible default strategy |
| Hard | Slowest initially | Low | 24-30 laps | Useful for long stints |

### 9.2 Tyre performance formula

Each car's lap time should be calculated from:

```text
lapTime = baseLapTime
        + compoundOffset
        + wearPenalty
        + dirtyAirPenalty
        + trafficPenalty
        + randomNoise
```

For the player-facing version, `randomNoise` should be very small or zero except for safety car handling. The app should feel like a mathematical model, not a random game.

Suggested values:

```text
baseLapTime = 90.000 seconds
soft compoundOffset = -0.600 seconds
medium compoundOffset = 0.000 seconds
hard compoundOffset = +0.500 seconds
```

Wear penalty should increase non-linearly as tyres degrade:

```text
wearPenalty = (wearPercentage / 100)^2 * compoundWearMultiplier
```

Suggested multipliers:

```text
soft compoundWearMultiplier = 5.0
medium compoundWearMultiplier = 4.0
hard compoundWearMultiplier = 3.0
```

Tyre wear should increase each lap:

```text
soft wear increase per lap = 5.5%
medium wear increase per lap = 3.5%
hard wear increase per lap = 2.2%
```

Tyre wear should be capped at 100%, but performance should become very poor above 85%.

### 9.3 Cliff effect

To avoid simple decisions, tyres should include a cliff effect. Once wear reaches a high threshold, lap time should deteriorate quickly.

Suggested cliff thresholds:

```text
soft cliff = 78%
medium cliff = 82%
hard cliff = 88%
```

If wear is above the cliff threshold:

```text
cliffPenalty = (wear - cliffThreshold) * 0.15 seconds
```

This helps explain to pupils that degradation is not always linear.

## 10. Pit stop model

### 10.1 Pit loss

Normal pit stop loss:

```text
22 seconds
```

Safety car pit stop loss:

```text
11 seconds
```

Pit loss should include the time lost entering the pit lane, changing tyres and rejoining the track.

### 10.2 Unlimited additional stops

The player must be able to make any number of pit stops, subject to race context.

The app should allow the player to pause the simulation and choose:

- Stay out
- Pit this lap
- Select soft tyres
- Select medium tyres
- Select hard tyres

The player should not be forced to make a second stop, but should be allowed to do so. This supports interesting strategies such as:

- One-stop strategy
- Two-stop strategy
- Late soft-tyre attack
- Safety car opportunistic stop
- Recovery after tyre cliff

### 10.3 Preventing trivial immediate-stop optimisation

The model must be tuned so that pitting immediately at the first decision point is not obviously best.

This should be achieved by scenario design rather than by forbidding the action.

Requirements:

- Pitting immediately on Lap 14 should be allowed.
- If the player pits immediately, they should usually rejoin in traffic.
- Immediate soft tyres should produce fast lap times but may require another stop.
- Immediate hard tyres should avoid another stop but give weak short-term pace.
- Waiting may allow traffic to clear but increases tyre degradation risk.
- Pitting one or two laps later may sometimes be better, depending on opponent behaviour.
- The end-of-race explanation should show why the player's timing helped or hurt them.

Acceptance criterion:

- In the default no-safety-car scenario, the best-scoring strategy should not be “pit immediately on Lap 14 for soft tyres and never stop again”.
- Immediate pitting should be a plausible but risky strategy, not an obviously dominant one.

## 11. Opponent strategy model

The 19 non-player cars should follow predefined but imperfectly visible strategies.

Each opponent should have:

- Planned first pit window
- Preferred second stint compound
- Whether they are likely to make one or two stops
- Sensitivity to tyre wear
- Whether they respond to safety car
- Confidence label shown to the user

### 11.1 Opponent strategy types

Use the following strategy types:

#### Must pit soon

Cars on highly worn soft tyres. They are likely to pit within 1-3 laps.

#### Early stopper likely

Cars on soft tyres with moderate wear. They may pit soon to avoid tyre cliff or attempt an undercut.

#### Balanced

Cars on medium tyres. They may pit during the normal pit window.

#### Long first stint

Cars on hard tyres. They are likely to stay out and may create traffic for cars that pit early.

#### Two-stop likely

Cars that may use soft tyres aggressively and pit more than once.

### 11.2 Imperfect information

The player should not see exact opponent pit plans. Instead, they should see uncertainty information such as:

- Very High chance of pitting soon
- High chance of pitting soon
- Medium chance of pitting soon
- Low chance of pitting soon
- Very Low chance of pitting soon

The underlying race should still be mostly deterministic. The uncertainty is primarily about what the player can infer, not necessarily random opponent behaviour.

## 12. Undercut and overcut model

The app must explain undercutting and overcutting in simple terms.

### 12.1 Undercut

An undercut occurs when a car pits earlier, uses fresher tyres, sets faster laps, and gains time over cars that stay out on older tyres.

In the model:

- Fresh tyres should offer a pace benefit.
- The undercut should be powerful when the other car is on worn tyres.
- The undercut should be weakened if the pitting car rejoins in traffic.

### 12.2 Overcut

An overcut occurs when a car stays out longer and gains time while the pitting car is delayed by traffic or slow tyre warm-up.

In the model:

- Hard tyres may allow a longer first stint.
- Staying out may be beneficial if the car has clear air.
- Pitting into traffic should create an overcut opportunity for those who stay out.

### 12.3 Explanation requirement

At the end of the race, the app should identify whether the player's strategy looked like:

- Successful undercut
- Failed undercut due to traffic
- Successful overcut
- Failed overcut due to tyre degradation
- Conservative one-stop
- Aggressive multi-stop
- Safety car opportunist

## 13. Simulation and animation

### 13.1 Commit Strategy button

The app must include a clear **Commit Strategy** button.

When pressed:

- The player's current decision is locked in.
- The race simulation begins or resumes.
- The app animates the race lap by lap.
- The animation should take enough time for users to see how the race is unfolding.

### 13.2 Animation speed

The animation should not instantly jump to the final result.

Suggested behaviour:

- Each simulated lap takes approximately 1.0-1.5 seconds.
- The current lap number updates visibly.
- Car positions and gaps update each lap.
- Tyre wear changes each lap.
- Pit stops are shown as visible events.
- Position changes should be highlighted.
- Key messages appear in an event feed.

Example event feed messages:

- `Lap 15: C06 pits from soft tyres to hard tyres.`
- `Lap 16: Player stays out. Tyre wear now 56%.`
- `Lap 17: C03 undercuts C02 after pitting early.`
- `Lap 22: Player rejoins in P10 behind slower traffic.`
- `Lap 26: Safety car deployed. Race paused.`

### 13.3 Pause button

The app must include a **Pause** button during animation.

When paused:

- The simulation stops immediately.
- The player can inspect current race state.
- The player can choose to pit on the current lap or continue.
- The player can select a tyre compound if pitting.
- The player can press **Commit Strategy** to resume.

### 13.4 Automatic pause points

The simulation should pause automatically when:

- A safety car is deployed.
- The player's tyres reach a critical wear threshold, such as 85%.
- The race reaches a predefined strategic prompt lap, such as Lap 20 or Lap 28.

Automatic prompts should be helpful, but not excessive. The app should remain a quick stand activity.

### 13.5 End condition

The simulation ends when the final lap is completed.

The final screen should show:

- Final position
- Time gap to winner
- Number of pit stops made
- Tyre compounds used
- Strategy score
- Scoreboard submission
- Explanation of what happened
- Mathematical breakdown
- Restart button

## 14. Player controls

The player should be able to:

- Enter a team name or continue anonymously.
- Inspect the current race table.
- Inspect their own car's tyre wear, gap and projected pit exit position.
- Choose to stay out.
- Choose to pit.
- Select a tyre compound when pitting.
- Commit the current strategy.
- Pause the simulation.
- Resume after pausing.
- Make additional pit stops later.
- Restart the scenario.
- View the leaderboard.

The facilitator/admin should be able to:

- Clear the leaderboard.
- Restart the current run.
- Optionally disable the safety car for demonstration mode.

## 15. Main screens

### 15.1 Title screen

Content:

- App title: `Race Strategy Challenge`
- Subtitle: `Can you make the right pit call?`
- Short explanation of task
- Team name input
- Start button

Suggested text:

> You are on the pit wall. Your driver is in P7. The tyres are fading, rivals are choosing different strategies, and the data is incomplete. Decide when to pit, which tyres to use, and whether to stop again before the end.

### 15.2 Race dashboard screen

This is the main app screen.

It should include:

- Current lap and total laps
- Player position
- Player gap to car ahead and behind
- Player tyre compound
- Player tyre wear
- Estimated pit loss
- Estimated pit exit position if pitting now
- Current safety car status
- Race table with 20 cars
- Decision controls
- Event feed
- Pause/commit controls

### 15.3 Decision panel

The decision panel should show:

- `Stay out`
- `Pit this lap`
- Tyre compound selection: Soft, Medium, Hard
- Estimated consequences:
  - projected pit exit position
  - expected tyre life
  - possible traffic warning
  - undercut/overcut risk indicator

The app should not give a direct recommendation. It can show model outputs, but the player must make the decision.

Good wording:

> The model estimates that pitting now would rejoin you around P11, close to cars on older hard tyres. Fresh tyres may be faster, but traffic could reduce the benefit.

Avoid wording:

> You should pit now.

### 15.4 Animation screen/state

The dashboard remains visible while the race progresses. During animation:

- Inputs are disabled unless paused.
- Current lap updates.
- Race table updates.
- Event feed updates.
- Pause button remains active.
- Safety car pauses immediately if triggered.

### 15.5 Safety car alert

If safety car occurs:

- Show modal or prominent panel.
- Pause simulation immediately.
- Explain reduced pit loss.
- Allow player to pit or stay out.

Suggested text:

> Safety car deployed. The field slows down, so the time lost by pitting is reduced. This can make a pit stop more attractive, but rivals may have the same idea.

Controls:

- Stay out
- Pit under safety car
- Select tyre compound
- Commit Strategy

### 15.6 Results screen

The results screen should include:

- Final position
- Final time
- Gap to winner
- Score
- Number of stops
- Tyre sequence
- Safety car occurred: yes/no
- Main strategic explanation
- Maths breakdown
- Leaderboard
- Restart button

## 16. Scoring model

The score should reward good race strategy, not just final position.

Suggested score out of 100:

```text
positionScore = based on final position
strategyScore = based on tyre use and pit timing
riskScore = based on avoiding severe tyre cliff and excessive traffic
mathsScore = based on estimated time gained/lost against baseline strategy
safetyCarAdjustment = neutral flag, not a bonus
```

Suggested weighting:

```text
final position: 50 points
race time versus baseline: 25 points
tyre management: 15 points
strategic efficiency: 10 points
```

### 16.1 Position score

Suggested position score:

```text
P1 = 50
P2 = 46
P3 = 43
P4 = 40
P5 = 37
P6 = 34
P7 = 31
P8 = 28
P9 = 25
P10 = 22
P11 = 19
P12 = 16
P13 = 13
P14 = 10
P15 = 8
P16 = 6
P17 = 4
P18 = 3
P19 = 2
P20 = 1
```

### 16.2 Baseline comparison

The app should compare the player's result against a predefined baseline strategy.

Suggested baseline:

- Start Lap 14 on medium tyres.
- Pit on Lap 22.
- Switch to hard tyres.
- No further stop unless safety car occurs.

The results screen should say whether the player gained or lost time against this baseline.

### 16.3 Tyre management score

Award points for:

- Avoiding tyre cliff for long periods.
- Choosing compounds that can complete realistic stint lengths.
- Using soft tyres effectively rather than running them too long.
- Not making unnecessary repeated stops.

Do not over-penalise experimentation. This is a recruitment activity and should remain encouraging.

## 17. Leaderboard

The app should include a local leaderboard using browser localStorage.

Leaderboard fields:

- Team name
- Score
- Final position
- Race time
- Number of stops
- Tyre sequence
- Safety car occurred: yes/no
- Timestamp

The leaderboard should:

- Display top 10 scores.
- Store data locally in the browser only.
- Require no server.
- Require no personal data.
- Allow anonymous entries.
- Include a clear reset/clear button for event staff.

### 17.1 Clear leaderboard

The app must provide a clear leaderboard reset option.

Suggested approach:

- A `Clear Leaderboard` button appears in a facilitator/admin area.
- On click, show confirmation: `Are you sure you want to clear all local scores?`
- If confirmed, remove leaderboard data from localStorage.

### 17.2 Privacy

The app should not collect personal data. Team name should be optional and should default to labels such as:

- Team 1
- Team 2
- Guest Strategist

If users enter names, the app should make clear that the score is stored only on this device.

## 18. Mathematical explanation layer

The app should reveal some maths during play and provide a fuller explanation afterwards.

### 18.1 During the activity

Show simple model outputs such as:

- Tyre wear percentage
- Estimated pit loss
- Projected pit exit position
- Expected tyre life remaining
- Risk of traffic
- Chance rivals may pit soon

Do not overload the user with formulae during the main activity.

### 18.2 After the race

The results screen should explain:

- Why tyre degradation mattered.
- How pit loss affected strategy.
- Whether the player gained or lost time through undercut/overcut.
- How uncertainty affected the decision.
- How the safety car changed the model, if it occurred.
- How the player's strategy compares with the baseline.

Example explanation:

> You pitted on Lap 21 for hard tyres. This avoided the medium tyre cliff and gave you enough tyre life to finish. However, you rejoined behind two cars on older hard tyres, which reduced the benefit of the undercut. Compared with the baseline strategy, you gained 1.8 seconds overall and finished P6.

### 18.3 Link to Dundee Maths

The final explanation should connect the activity to university-level maths without sounding like marketing copy.

Suggested text:

> This is a simplified version of mathematical modelling. You used changing rates, estimates, constraints and uncertainty to make a practical decision. These same ideas appear in sport, finance, logistics, health, climate, computing and engineering.

## 19. Data model

The implementation should use structured JavaScript objects in `data.js`.

### 19.1 Race config

```javascript
const raceConfig = {
  raceName: "Race Strategy Challenge",
  totalLaps: 40,
  startLap: 14,
  playerCarId: "C07",
  baseLapTime: 90.0,
  normalPitLoss: 22.0,
  safetyCarPitLoss: 11.0,
  safetyCarProbability: 0.10,
  safetyCarEarliestLap: 18,
  safetyCarLatestLap: 32,
  safetyCarDurationLaps: 2,
  leaderboardStorageKey: "raceStrategyLeaderboard"
};
```

### 19.2 Tyre compounds

```javascript
const tyreCompounds = {
  soft: {
    label: "Soft",
    compoundOffset: -0.6,
    wearPerLap: 5.5,
    wearMultiplier: 5.0,
    cliffThreshold: 78,
    description: "Fast but fragile"
  },
  medium: {
    label: "Medium",
    compoundOffset: 0.0,
    wearPerLap: 3.5,
    wearMultiplier: 4.0,
    cliffThreshold: 82,
    description: "Balanced pace and durability"
  },
  hard: {
    label: "Hard",
    compoundOffset: 0.5,
    wearPerLap: 2.2,
    wearMultiplier: 3.0,
    cliffThreshold: 88,
    description: "Slower but durable"
  }
};
```

### 19.3 Car object

```javascript
const car = {
  id: "C07",
  team: "Dundee Racing",
  driver: "Player Car",
  isPlayer: true,
  position: 7,
  gapToLeader: 17.6,
  gapToCarAhead: 2.6,
  tyre: "medium",
  tyreAge: 13,
  tyreWear: 49,
  strategyType: "Player decision",
  pitSoonConfidence: "Unknown",
  plannedStops: [],
  completedStops: [],
  totalRaceTime: 0,
  status: "running"
};
```

### 19.4 Opponent planned strategy object

```javascript
const opponentStrategy = {
  carId: "C06",
  firstPitLap: 15,
  firstPitCompound: "hard",
  secondPitLap: null,
  secondPitCompound: null,
  respondsToSafetyCar: true,
  confidenceShownToUser: "Very High"
};
```

### 19.5 Leaderboard entry

```javascript
const leaderboardEntry = {
  teamName: "Guest Strategist",
  score: 82,
  finalPosition: 6,
  raceTime: 3632.4,
  stops: 1,
  tyreSequence: ["Medium", "Hard"],
  safetyCarOccurred: false,
  timestamp: "2026-06-25T12:00:00.000Z"
};
```

## 20. Required functions

The JavaScript implementation should include functions equivalent to the following:

```javascript
initialiseRace()
renderDashboard()
renderRaceTable()
renderDecisionPanel()
commitStrategy()
pauseRace()
resumeRace()
advanceOneLap()
calculateLapTime(car)
calculateTyreWear(car)
applyPitStop(car, newCompound)
updateRaceOrder()
calculateProjectedPitExit(playerCar)
checkSafetyCarTrigger()
handleSafetyCarPause()
checkAutomaticPause()
completeRace()
calculateScore()
renderResults()
saveLeaderboardEntry()
loadLeaderboard()
clearLeaderboard()
restartScenario()
```

## 21. Race simulation logic

### 21.1 Lap advancement

For each simulated lap:

1. Check whether race is paused.
2. Check whether safety car should deploy.
3. Apply opponent pit decisions for this lap.
4. Apply player pit decision if committed for this lap.
5. Calculate lap time for each car.
6. Increase tyre age.
7. Increase tyre wear.
8. Add lap time to total race time.
9. Update gaps and positions.
10. Update event feed.
11. Render dashboard.
12. Check for automatic pause triggers.
13. If final lap completed, end race.

### 21.2 Position calculation

Positions should be calculated by total race time rather than by simple manual swaps.

At the start of the scenario, initialise each car's `totalRaceTime` based on the gap to leader. For example:

```text
leader totalRaceTime = 0
other car totalRaceTime = gapToLeader
```

Each lap adds calculated lap time. Cars are then sorted by total race time, lowest first.

This makes undercuts and overcuts emerge naturally from the model.

### 21.3 Traffic and dirty air

The app should include a simple traffic model.

If a car is within 1.5 seconds of the car ahead, apply a dirty air penalty.

Suggested penalty:

```text
0.4 seconds per lap
```

If a car exits the pits within 2.0 seconds behind another car, show a traffic warning and apply traffic penalty until the gap increases.

This is important because it prevents pitting immediately from becoming obviously best.

## 22. Accessibility and usability requirements

The app should be accessible for recruitment events.

Requirements:

- Large readable text.
- Strong contrast.
- Keyboard-accessible controls.
- No colour-only communication; use labels and icons as well as colour.
- Works on laptop, tablet and projected display.
- Buttons large enough for touch use.
- No flashing effects.
- Animation should be pausable.
- Event feed should use text, not just visual changes.
- Results should be understandable without prior F1 knowledge.

## 23. Visual style

The app should feel like a simplified pit wall dashboard.

Suggested style:

- Dark dashboard background.
- Clear timing table.
- Tyre compounds shown with labels and simple visual tags.
- Player car highlighted.
- Event feed styled like race control messages.
- Results screen should feel celebratory but still educational.

Do not rely on real F1 branding, team names, logos or driver names.

## 24. Acceptance criteria

The app is complete when:

1. It runs entirely from static files with no server.
2. It loads a fixed 20-car race state at Lap 14.
3. Each car has position, gap, tyre compound, tyre age, tyre wear and strategy information.
4. The player controls the P7 car.
5. The player can choose when to pit and which tyre compound to use.
6. The player can make unlimited additional pit stops.
7. The player can pause and resume the race.
8. The race animates lap by lap after pressing **Commit Strategy**.
9. The simulation visibly updates positions, gaps, tyre wear and event feed.
10. A safety car has a 10% chance of occurring during the race.
11. If safety car occurs, the simulation pauses immediately.
12. Safety car pit loss is lower than normal pit loss.
13. The app models tyre degradation, pit loss, traffic, undercut and overcut.
14. The best strategy is not obviously to pit immediately onto new tyres.
15. The app shows a final score and explanation.
16. The app saves a local leaderboard using localStorage.
17. The leaderboard can be cleared by a facilitator.
18. The app does not collect personal data.
19. The app is usable in a 5-minute stand interaction.
20. The app includes an educational explanation linking the activity to mathematical modelling.

## 25. Suggested implementation phases

### Phase 1: Static prototype

- Build title screen.
- Build dashboard layout.
- Display 20-car race table.
- Display player decision controls.
- No simulation yet.

### Phase 2: Deterministic race engine

- Implement lap time calculation.
- Implement tyre wear.
- Implement pit stops.
- Implement race order updates.
- Implement fixed opponent strategies.

### Phase 3: Player strategy and animation

- Add Commit Strategy button.
- Animate lap-by-lap progression.
- Add pause/resume.
- Allow unlimited additional player stops.
- Add event feed.

### Phase 4: Safety car and strategy explanation

- Add 10% safety car probability.
- Add safety car pause behaviour.
- Add reduced pit loss under safety car.
- Add undercut/overcut explanation.

### Phase 5: Results and leaderboard

- Add scoring.
- Add results screen.
- Add localStorage leaderboard.
- Add clear leaderboard option.

### Phase 6: Recruitment polish

- Improve visual styling.
- Add simple maths explanations.
- Add accessibility checks.
- Add facilitator notes in README.

## 26. README requirements

The project should include a short `README.md` explaining:

- What the app does.
- How to run it locally.
- That it needs no server.
- How to clear the leaderboard.
- How to disable safety car mode if implemented.
- How the scoring works.
- How the activity connects to BSc Mathematics recruitment.

Suggested README opening:

> Race Strategy Challenge is a browser-based recruitment activity for BSc Mathematics. It uses an F1-inspired pit stop strategy problem to introduce optimisation, modelling, probability, uncertainty and decision-making. The app runs entirely in the browser using HTML, CSS and JavaScript.

## 27. Strong design guidance

Keep the activity focused. The goal is not to build a complete motorsport simulator. The goal is to create a strategic, visual and mathematically meaningful recruitment experience.

The first version should prioritise:

- Clear decision-making.
- Good visual feedback.
- A believable but simple model.
- A strong educational explanation.
- Fast reset for recruitment events.

Avoid:

- Excessive realism.
- Complex weather systems.
- Damage or crashes.
- Real F1 branding.
- Overly detailed telemetry.
- Requiring users to understand motorsport before playing.

The user should leave thinking:

> I made a strategic decision using maths, and it was fun.
