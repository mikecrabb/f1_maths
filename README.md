# Race Strategy Challenge

Race Strategy Challenge is a browser-based recruitment activity for BSc Mathematics. It uses an F1-inspired pit stop strategy problem to introduce optimisation, modelling, probability, uncertainty and decision-making. The app runs entirely in the browser using HTML, CSS and JavaScript.

## What it does

You take control of the pit wall for the fictional `Dundee Racing` car starting from P7 on Lap 14 of a 40-lap race. The app models:

- 20 cars with fixed initial gaps, tyre states and visible confidence labels
- Three tyre compounds with different pace, degradation and cliff thresholds
- Pit-loss trade-offs under green-flag and safety-car conditions
- Opponent pit windows and strategy types
- Traffic, dirty air, undercut and overcut effects
- A local top-10 leaderboard stored in `localStorage`

The simulation is designed so that an immediate stop is allowed but not obviously dominant.

## Run locally

No server or build step is required.

1. Open [index.html](/Users/michaelcrabb/Documents/code/f1_maths/index.html) directly in a browser.
2. Enter a team name or continue as `Guest Strategist`.
3. Choose whether to leave safety car randomness enabled.
4. Commit a strategy and manage further stops as the race unfolds.

## Files

- [index.html](/Users/michaelcrabb/Documents/code/f1_maths/index.html) contains the app layout.
- [styles.css](/Users/michaelcrabb/Documents/code/f1_maths/styles.css) contains the dashboard styling.
- [data.js](/Users/michaelcrabb/Documents/code/f1_maths/data.js) contains the race config, tyre model, field data and opponent strategy plans.
- [app.js](/Users/michaelcrabb/Documents/code/f1_maths/app.js) contains the simulation, rendering, scoring and leaderboard logic.

## Leaderboard

Scores are stored only in the browser on the current device.

- Use the `Clear leaderboard` button from the start screen, dashboard or results screen.
- Confirm the prompt to remove all stored entries from `localStorage`.

## Safety car mode

- Safety car mode is enabled by default.
- It has a 10% probability per playthrough.
- Facilitators can disable it from the start screen using `Facilitator mode: disable safety car randomness`.

## Scoring

Scores are out of 100 and combine:

- final position
- race time versus a baseline Lap 22 medium-to-hard strategy
- tyre management
- strategic efficiency

The results screen also explains whether your race resembled an undercut, overcut, conservative one-stop, aggressive multi-stop or safety-car opportunist strategy.

## Recruitment link

The activity is intentionally a simplified mathematical model rather than a full motorsport simulator. It is built to support short stand demonstrations and discussions about:

- optimisation
- rates of change
- uncertainty
- modelling assumptions
- decision-making under imperfect information
