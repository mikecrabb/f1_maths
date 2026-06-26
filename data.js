window.RACE_DATA = (() => {
  const tyreCompounds = {
    soft: {
      label: "Soft",
      compoundOffset: -0.6,
      wearPerLap: 5.5,
      wearMultiplier: 5.0,
      cliffThreshold: 78,
      effectiveLife: "10-14 laps",
      description: "Fast but fragile"
    },
    medium: {
      label: "Medium",
      compoundOffset: 0.0,
      wearPerLap: 3.5,
      wearMultiplier: 4.0,
      cliffThreshold: 82,
      effectiveLife: "16-22 laps",
      description: "Balanced pace and durability"
    },
    hard: {
      label: "Hard",
      compoundOffset: 0.5,
      wearPerLap: 2.2,
      wearMultiplier: 3.0,
      cliffThreshold: 88,
      effectiveLife: "24-30 laps",
      description: "Slower but durable"
    }
  };

  const carCatalogue = [
    ["C01", "Apex GP", "Voss", "calm"],
    ["C02", "Apex GP", "Renaud", "balanced"],
    ["C03", "Velocity", "Harker", "aggressive"],
    ["C04", "Velocity", "Sato", "patient"],
    ["C05", "Northstar", "Iversen", "balanced"],
    ["C06", "Orbit", "Malik", "aggressive"],
    ["C07", "Dundee Racing", "Player Car", "player"],
    ["C08", "Helix", "Novak", "patient"],
    ["C09", "Northstar", "Bell", "balanced"],
    ["C10", "Falcon", "Okafor", "aggressive"],
    ["C11", "Falcon", "Mercer", "patient"],
    ["C12", "Helix", "Quinn", "balanced"],
    ["C13", "Zenith", "Duarte", "patient"],
    ["C14", "Zenith", "Cole", "aggressive"],
    ["C15", "Summit", "Shah", "balanced"],
    ["C16", "Summit", "Lenz", "patient"],
    ["C17", "Vector", "Marek", "aggressive"],
    ["C18", "Vector", "Price", "balanced"],
    ["C19", "Nova", "Singh", "patient"],
    ["C20", "Nova", "Adler", "aggressive"]
  ].map(([id, team, driver, style]) => ({ id, team, driver, style }));

  const scenarioPresets = [
    {
      id: "easy-silverstone-static",
      difficulty: "easy",
      name: "Silverstone Static",
      description: "A calm long-run opening where the likely winning move is to stay patient and use the early safety car discount.",
      startLap: 8,
      playerPosition: 8,
      playerTyre: "hard",
      playerWear: 18,
      playerGapAhead: 2.3,
      playerGapBehind: 1.6,
      safetyCarProbability: 0.65,
      safetyCarEarliestOffset: 2,
      safetyCarLatestOffset: 5,
      fieldTheme: "long-run"
    },
    {
      id: "easy-barcelona-buffer",
      difficulty: "easy",
      name: "Barcelona Buffer",
      description: "You have breathing room on medium tyres and enough laps left to compare a clean one-stop against a simple overcut.",
      startLap: 24,
      playerPosition: 6,
      playerTyre: "medium",
      playerWear: 41,
      playerGapAhead: 2.7,
      playerGapBehind: 2.2,
      safetyCarProbability: 0.1,
      fieldTheme: "front-fight"
    },
    {
      id: "easy-red-bull-rhythm",
      difficulty: "easy",
      name: "Red Bull Rhythm",
      description: "A balanced race from the lower top ten where the field is spread enough for tyre life and pit loss to be the main variables.",
      startLap: 18,
      playerPosition: 9,
      playerTyre: "hard",
      playerWear: 24,
      playerGapAhead: 3.0,
      playerGapBehind: 2.5,
      safetyCarProbability: 0.08,
      fieldTheme: "long-run"
    },
    {
      id: "medium-monza-drs-trap",
      difficulty: "medium",
      name: "Monza DRS Trap",
      description: "You are pinned inside a compressed midfield train where tiny pit timing differences can flip five positions.",
      startLap: 32,
      playerPosition: 7,
      playerTyre: "medium",
      playerWear: 54,
      playerGapAhead: 1.9,
      playerGapBehind: 1.4,
      safetyCarProbability: 0.18,
      fieldTheme: "compressed"
    },
    {
      id: "medium-suzuka-air-pocket",
      difficulty: "medium",
      name: "Suzuka Air Pocket",
      description: "You start near the front in clear air on durable tyres, where track position may be worth more than the early stop.",
      startLap: 38,
      playerPosition: 4,
      playerTyre: "hard",
      playerWear: 36,
      playerGapAhead: 3.6,
      playerGapBehind: 2.0,
      safetyCarProbability: 0.08,
      fieldTheme: "long-run"
    },
    {
      id: "medium-interlagos-offset",
      difficulty: "medium",
      name: "Interlagos Offset",
      description: "Cars around you are split across compounds, so the challenge is reading which rival windows matter and which are decoys.",
      startLap: 34,
      playerPosition: 11,
      playerTyre: "medium",
      playerWear: 49,
      playerGapAhead: 1.6,
      playerGapBehind: 1.5,
      safetyCarProbability: 0.22,
      fieldTheme: "mixed"
    },
    {
      id: "hard-sakhir-soft-collapse",
      difficulty: "hard",
      name: "Sakhir Soft Collapse",
      description: "You are chasing on worn softs near the cliff. Delay too long and the lap-time loss accelerates hard.",
      startLap: 41,
      playerPosition: 10,
      playerTyre: "soft",
      playerWear: 72,
      playerGapAhead: 1.2,
      playerGapBehind: 1.7,
      safetyCarProbability: 0.12,
      fieldTheme: "soft-chaos"
    },
    {
      id: "hard-baku-roulette",
      difficulty: "hard",
      name: "Baku Roulette",
      description: "You are buried in traffic with a volatile safety-car chance. The smartest strategy may depend on timing chaos, not pure pace.",
      startLap: 44,
      playerPosition: 13,
      playerTyre: "medium",
      playerWear: 63,
      playerGapAhead: 1.5,
      playerGapBehind: 1.1,
      safetyCarProbability: 0.42,
      fieldTheme: "mixed"
    },
    {
      id: "extreme-spa-double-bluff",
      difficulty: "extreme",
      name: "Spa Double Bluff",
      description: "The final challenge: you are near the front with enough pace to undercut, but one wrong response to the cars around you can ruin the race.",
      startLap: 42,
      playerPosition: 5,
      playerTyre: "medium",
      playerWear: 64,
      playerGapAhead: 1.7,
      playerGapBehind: 1.2,
      safetyCarProbability: 0.16,
      fieldTheme: "front-fight"
    }
  ];

  const gapIncrements = [2.1, 2.5, 2.6, 2.8, 3.0, 2.6, 2.4, 2.9, 3.0, 3.2, 3.3, 3.5, 3.7, 3.9, 4.2, 4.6, 5.1, 5.8, 6.5];

  const fieldThemes = {
    compressed: ["medium", "hard", "soft", "medium", "soft", "hard"],
    "long-run": ["hard", "medium", "hard", "medium", "soft", "hard"],
    "soft-chaos": ["soft", "medium", "soft", "hard", "medium", "soft"],
    mixed: ["medium", "hard", "soft", "medium", "hard", "medium"],
    "front-fight": ["medium", "soft", "medium", "hard", "medium", "soft"]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function estimateTyreAge(tyreKey, wear) {
    return Math.max(1, Math.round(wear / tyreCompounds[tyreKey].wearPerLap));
  }

  function buildRaceConfig(preset) {
    const totalLaps = 65;
    const remainingLaps = totalLaps - preset.startLap;
    const firstPause = clamp(preset.startLap + Math.max(4, Math.floor(remainingLaps * 0.28)), preset.startLap + 2, totalLaps - 8);
    const secondPause = clamp(preset.startLap + Math.max(8, Math.floor(remainingLaps * 0.58)), preset.startLap + 5, totalLaps - 4);
    const safetyCarEarliestLap = preset.safetyCarEarliestOffset !== undefined
      ? clamp(preset.startLap + preset.safetyCarEarliestOffset, preset.startLap + 1, totalLaps - 1)
      : clamp(preset.startLap + 3, preset.startLap + 1, totalLaps - 8);
    const safetyCarLatestLap = preset.safetyCarLatestOffset !== undefined
      ? clamp(preset.startLap + preset.safetyCarLatestOffset, safetyCarEarliestLap, totalLaps - 1)
      : clamp(preset.startLap + 16, preset.startLap + 5, totalLaps - 4);
    return {
      raceName: `Race Strategy Challenge: ${preset.name}`,
      totalLaps,
      startLap: preset.startLap,
      playerCarId: "C07",
      baseLapTime: 90.0,
      normalPitLoss: 22.0,
      safetyCarPitLoss: 11.0,
      safetyCarProbability: preset.safetyCarProbability,
      safetyCarEarliestLap,
      safetyCarLatestLap,
      safetyCarDurationLaps: 2,
      leaderboardStorageKey: "raceStrategyLeaderboard",
      automaticPauseLaps: [...new Set([firstPause, secondPause])].sort((a, b) => a - b),
      dirtyAirGap: 1.5,
      dirtyAirPenalty: 0.4,
      trafficGap: 2.0,
      trafficPenalty: 0.65
    };
  }

  function buildStartingGrid(playerPosition) {
    const player = carCatalogue.find((car) => car.id === "C07");
    const rest = carCatalogue.filter((car) => car.id !== "C07");
    const ordered = [...rest];
    ordered.splice(playerPosition - 1, 0, player);
    return ordered;
  }

  function buildGapProfile(preset) {
    const gaps = [0];
    const increments = gapIncrements.slice();
    if (preset.playerPosition > 1 && preset.playerGapAhead) {
      increments[preset.playerPosition - 2] = preset.playerGapAhead;
    }
    if (preset.playerPosition < 20 && preset.playerGapBehind) {
      increments[preset.playerPosition - 1] = preset.playerGapBehind;
    }
    for (let index = 1; index < 20; index += 1) {
      gaps[index] = Number((gaps[index - 1] + increments[index - 1]).toFixed(1));
    }
    return gaps;
  }

  function inferCompound(theme, position) {
    const sequence = fieldThemes[theme] || fieldThemes.mixed;
    return sequence[(position - 1) % sequence.length];
  }

  function inferWear(compound, position, preset) {
    const bandBias = position <= 5 ? -6 : position >= 15 ? 5 : 0;
    const themeBias = {
      compressed: 6,
      "long-run": -7,
      "soft-chaos": 10,
      mixed: 2,
      "front-fight": 4
    }[preset.fieldTheme] || 0;
    const tyreBias = compound === "soft" ? 18 : compound === "medium" ? 8 : -4;
    return clamp(30 + bandBias + themeBias + tyreBias + (position % 3) * 3, 18, 84);
  }

  function nextCompound(currentTyre, lapsRemainingAfterStop) {
    if (currentTyre === "soft") {
      return lapsRemainingAfterStop > 16 ? "hard" : "medium";
    }
    if (currentTyre === "medium") {
      return lapsRemainingAfterStop > 18 ? "hard" : "soft";
    }
    return lapsRemainingAfterStop > 12 ? "medium" : "soft";
  }

  function describeCarState(compound, wear, isPlayer) {
    if (isPlayer) {
      return {
        strategyType: "Player decision",
        pitSoonConfidence: "Unknown",
        notes: "Player-controlled car"
      };
    }
    if (compound === "soft" && wear >= 66) {
      return {
        strategyType: "Must pit soon",
        pitSoonConfidence: "Very High",
        notes: "Severe degradation risk"
      };
    }
    if (compound === "hard" && wear <= 34) {
      return {
        strategyType: "Long first stint",
        pitSoonConfidence: "Low",
        notes: "May stay out much longer"
      };
    }
    if (compound === "medium" && wear >= 58) {
      return {
        strategyType: "Undercut threat",
        pitSoonConfidence: "High",
        notes: "Likely to trigger the local pit window"
      };
    }
    return {
      strategyType: "Balanced",
      pitSoonConfidence: wear >= 52 ? "Medium" : "Low",
      notes: "Standard one-stop pressure"
    };
  }

  function buildCars(preset, raceConfig) {
    const ordered = buildStartingGrid(preset.playerPosition);
    const gaps = buildGapProfile(preset);
    return ordered.map((car, index) => {
      const position = index + 1;
      const isPlayer = car.id === raceConfig.playerCarId;
      const tyre = isPlayer ? preset.playerTyre : inferCompound(preset.fieldTheme, position);
      const tyreWear = isPlayer ? preset.playerWear : inferWear(tyre, position, preset);
      const tyreAge = isPlayer
        ? estimateTyreAge(preset.playerTyre, preset.playerWear)
        : estimateTyreAge(tyre, tyreWear);
      const stateDescription = describeCarState(tyre, tyreWear, isPlayer);
      return {
        id: car.id,
        team: car.team,
        driver: car.driver,
        style: car.style,
        isPlayer,
        position,
        gapToLeader: gaps[index],
        gapToCarAhead: index === 0 ? null : Number((gaps[index] - gaps[index - 1]).toFixed(1)),
        tyre,
        tyreAge,
        tyreWear,
        strategyType: stateDescription.strategyType,
        pitSoonConfidence: stateDescription.pitSoonConfidence,
        notes: stateDescription.notes,
        estimatedTyreLife: tyreCompounds[tyre].effectiveLife,
        totalRaceTime: gaps[index],
        completedStops: [],
        tyreHistory: [tyre],
        plannedPitLap: null,
        plannedCompound: null,
        status: "running",
        trafficLapsRemaining: 0,
        outLapRemaining: 0,
        undercutGain: 0,
        paceDeltaLog: []
      };
    });
  }

  function buildOpponentStrategies(cars, raceConfig) {
    const strategies = {};
    cars.forEach((car) => {
      if (car.isPlayer) {
        return;
      }
      const tyreData = tyreCompounds[car.tyre];
      const wearToCliff = tyreData.cliffThreshold - car.tyreWear;
      const rawLapsToCliff = wearToCliff <= 0 ? 1 : Math.max(1, Math.floor(wearToCliff / tyreData.wearPerLap));
      const styleOffset = car.style === "aggressive" ? 2 : car.style === "patient" ? -2 : 0;
      const firstPitLap = clamp(raceConfig.startLap + rawLapsToCliff - 1 - styleOffset, raceConfig.startLap + 1, raceConfig.totalLaps - 6);
      const firstPitCompound = nextCompound(car.tyre, raceConfig.totalLaps - firstPitLap);
      const lifeSpan = firstPitCompound === "soft" ? 12 : firstPitCompound === "medium" ? 18 : 24;
      const secondPitLap = firstPitCompound === "soft" && firstPitLap + lifeSpan - 3 < raceConfig.totalLaps - 3
        ? firstPitLap + lifeSpan - 3
        : null;
      strategies[car.id] = {
        firstPitLap,
        firstPitCompound,
        secondPitLap,
        secondPitCompound: secondPitLap ? nextCompound(firstPitCompound, raceConfig.totalLaps - secondPitLap) : null,
        respondsToSafetyCar: car.style !== "patient" || car.tyre !== "hard"
      };
    });
    return strategies;
  }

  function buildBaselinePlan(player, raceConfig) {
    const tyreData = tyreCompounds[player.tyre];
    const lapsToCliff = Math.max(1, Math.floor((tyreData.cliffThreshold - player.tyreWear) / tyreData.wearPerLap));
    const firstPitLap = clamp(raceConfig.startLap + Math.max(1, lapsToCliff - 1), raceConfig.startLap + 1, raceConfig.totalLaps - 5);
    return {
      firstPitLap,
      firstPitCompound: nextCompound(player.tyre, raceConfig.totalLaps - firstPitLap)
    };
  }

  function createScenarioBundle(presetInput) {
    const preset = clone(presetInput);
    const raceConfig = buildRaceConfig(preset);
    const cars = buildCars(preset, raceConfig);
    const player = cars.find((car) => car.isPlayer);
    const opponentStrategies = buildOpponentStrategies(cars, raceConfig);
    const baselinePlan = buildBaselinePlan(player, raceConfig);
    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      raceConfig,
      cars,
      opponentStrategies,
      baselinePlan
    };
  }

  function getScenarioBundle(id) {
    const preset = scenarioPresets.find((item) => item.id === id) || scenarioPresets[0];
    return createScenarioBundle(preset);
  }

  function createCustomScenarioBundle(customInput) {
    const basePreset = scenarioPresets.find((item) => item.id === customInput.baseScenarioId) || scenarioPresets[0];
    const customPreset = {
      ...basePreset,
      id: "custom-scenario",
      name: customInput.name || "Custom Condition",
      description: "User-defined starting condition.",
      startLap: clamp(toNumber(customInput.startLap, basePreset.startLap), 20, 45),
      playerPosition: clamp(toNumber(customInput.playerPosition, basePreset.playerPosition), 1, 20),
      playerTyre: ["soft", "medium", "hard"].includes(customInput.playerTyre) ? customInput.playerTyre : "medium",
      playerWear: clamp(toNumber(customInput.playerWear, basePreset.playerWear), 8, 84),
      playerGapAhead: clamp(toNumber(customInput.playerGapAhead, basePreset.playerGapAhead || 2.0), 0.6, 8.0),
      playerGapBehind: clamp(toNumber(customInput.playerGapBehind, basePreset.playerGapBehind || 2.0), 0.6, 8.0),
      safetyCarProbability: clamp(toNumber(customInput.safetyCarProbability, basePreset.safetyCarProbability), 0, 0.8),
      fieldTheme: customInput.fieldTheme && fieldThemes[customInput.fieldTheme] ? customInput.fieldTheme : basePreset.fieldTheme
    };
    return createScenarioBundle(customPreset);
  }

  return {
    tyreCompounds,
    scenarioPresets: scenarioPresets.map((preset) => ({
      id: preset.id,
      difficulty: preset.difficulty,
      name: preset.name,
      description: preset.description,
      startLap: preset.startLap,
      playerPosition: preset.playerPosition,
      playerTyre: preset.playerTyre,
      playerWear: preset.playerWear,
      playerGapAhead: preset.playerGapAhead,
      playerGapBehind: preset.playerGapBehind,
      safetyCarProbability: preset.safetyCarProbability,
      safetyCarEarliestOffset: preset.safetyCarEarliestOffset,
      safetyCarLatestOffset: preset.safetyCarLatestOffset,
      fieldTheme: preset.fieldTheme
    })),
    defaultScenarioId: scenarioPresets[0].id,
    getScenarioBundle,
    createCustomScenarioBundle
  };
})();
