(function () {
  const dataApi = window.RACE_DATA;
  const { tyreCompounds } = dataApi;
  const SECTORS_PER_LAP = 12;
  const LAP_DURATION_MS = 3000;
  const SECTOR_DURATION_MS = LAP_DURATION_MS / SECTORS_PER_LAP;
  let raceConfig = {};
  let cars = [];
  let opponentStrategies = {};
  let baselinePlan = {};

  const state = {
    teamName: "Guest Strategist",
    cars: [],
    currentLap: 0,
    currentSector: 0,
    positionDeltaSector: 0,
    racePaused: true,
    raceStarted: false,
    raceFinished: false,
    timerId: null,
    decision: {
      action: "stay",
      compound: "medium",
      timingOffset: 0
    },
    pendingPlayerPit: null,
    playerStopCount: 0,
    raceMapMode: "leader",
    eventFeed: [],
    automaticPauseReason: "",
    pauseContext: null,
    selectedScenarioId: dataApi.defaultScenarioId,
    scenarioSelection: null,
    activeScenarioName: "",
    disableSafetyCar: false,
    safetyCar: {
      willOccur: false,
      triggerLap: null,
      active: false,
      remainingLaps: 0,
      occurred: false
    },
    carHistories: {},
    playerHistory: [],
    result: null
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", initialiseApp);

  function initialiseApp() {
    cacheDom();
    bindEvents();
    populateScenarioControls();
    renderLeaderboard("startLeaderboard");
    showScreen("startScreen");
  }

  function cacheDom() {
    [
      "startScreen", "dashboardScreen", "resultsScreen", "startForm", "teamName", "disableSafetyCar",
      "scenarioPreset", "scenarioCards", "scenarioSummary", "useCustomScenario", "customScenarioPanel", "customScenarioName", "customBaseScenario", "customFieldTheme",
      "customStartLap", "customPlayerPosition", "customPlayerTyre", "customPlayerWear", "customGapAhead", "customGapBehind", "customSafetyCarProbability",
      "lapDisplay", "playerPositionDisplay", "gapDisplay", "tyreDisplay", "pitLossDisplay",
      "raceTableBody", "eventFeed", "decisionInsights", "decisionStatus", "safetyCarDisplay", "raceStatusDisplay", "raceMap", "raceMapMode", "raceMapCaption",
      "playerCommandCard", "mathsLiveGrid", "decisionSummaryCard", "decisionMathCard",
      "commitButton", "pauseButton", "restartButton", "playAgainButton", "resultsCharts", "resultsChartDriver",
      "resultsHeadline", "resultsSummary", "resultsExplanation", "strategyComparison",
      "pauseModal", "pauseModalBackdrop", "pauseModalDismiss", "pauseModalTitle", "pauseModalReason", "pauseModalStats", "pauseModalWhy", "pauseModalAction"
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    dom.startForm.addEventListener("submit", (event) => {
      event.preventDefault();
      startChallenge();
    });
    dom.scenarioPreset.addEventListener("change", handleScenarioPresetChange);
    dom.useCustomScenario.addEventListener("change", syncScenarioBuilderUi);
    dom.customBaseScenario.addEventListener("change", () => {
      const preset = dataApi.scenarioPresets.find((scenario) => scenario.id === dom.customBaseScenario.value);
      applyPresetValuesToCustomForm(preset, true);
      updateScenarioSummary();
    });
    ["customBaseScenario", "customFieldTheme", "customStartLap", "customPlayerPosition", "customPlayerTyre", "customPlayerWear", "customGapAhead", "customGapBehind", "customSafetyCarProbability", "customScenarioName"].forEach((id) => {
      dom[id].addEventListener("input", updateScenarioSummary);
      dom[id].addEventListener("change", updateScenarioSummary);
    });

    document.getElementById("decisionForm").addEventListener("change", syncDecisionFromForm);
    dom.commitButton.addEventListener("click", commitStrategy);
    dom.pauseButton.addEventListener("click", togglePause);
    dom.restartButton.addEventListener("click", restartScenario);
    dom.playAgainButton.addEventListener("click", restartScenario);
    dom.raceMapMode.addEventListener("change", () => {
      state.raceMapMode = dom.raceMapMode.value;
      renderDashboard();
    });
    dom.resultsChartDriver.addEventListener("change", () => {
      if (state.result) {
        renderResultsCharts(state.result, dom.resultsChartDriver.value);
      }
    });
    dom.pauseModalDismiss.addEventListener("click", dismissPauseModal);
    dom.pauseModalBackdrop.addEventListener("click", dismissPauseModal);

    ["clearLeaderboardStart", "clearLeaderboardDashboard", "clearLeaderboardResults"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", clearLeaderboard);
      }
    });
  }

  function populateScenarioControls() {
    const presetOptions = dataApi.scenarioPresets.map((scenario) => `
      <option value="${scenario.id}">${escapeHtml(scenario.name)}</option>
    `).join("");
    dom.scenarioPreset.innerHTML = presetOptions;
    dom.customBaseScenario.innerHTML = presetOptions;
    dom.scenarioPreset.value = dataApi.defaultScenarioId;
    dom.customBaseScenario.value = dataApi.defaultScenarioId;
    applyPresetValuesToCustomForm(dataApi.scenarioPresets.find((scenario) => scenario.id === dataApi.defaultScenarioId));
    renderScenarioCards();
    syncScenarioBuilderUi();
  }

  function handleScenarioPresetChange() {
    const preset = getSelectedPreset();
    state.selectedScenarioId = preset.id;
    if (!dom.useCustomScenario.checked) {
      applyPresetValuesToCustomForm(preset);
    }
    renderScenarioCards();
    updateScenarioSummary();
  }

  function syncScenarioBuilderUi() {
    const customEnabled = dom.useCustomScenario.checked;
    dom.customScenarioPanel.classList.toggle("hidden", !customEnabled);
    dom.customScenarioPanel.querySelectorAll("input, select").forEach((element) => {
      element.disabled = !customEnabled;
    });
    if (customEnabled) {
      const preset = getSelectedPreset();
      dom.customBaseScenario.value = preset.id;
      applyPresetValuesToCustomForm(dataApi.scenarioPresets.find((scenario) => scenario.id === dom.customBaseScenario.value), true);
    }
    renderScenarioCards();
    updateScenarioSummary();
  }

  function getSelectedPreset() {
    return dataApi.scenarioPresets.find((scenario) => scenario.id === dom.scenarioPreset.value) || dataApi.scenarioPresets[0];
  }

  function applyPresetValuesToCustomForm(preset, preserveName = false) {
    if (!preset) {
      return;
    }
    dom.customBaseScenario.value = preset.id;
    dom.customFieldTheme.value = preset.fieldTheme;
    dom.customStartLap.value = preset.startLap;
    dom.customPlayerPosition.value = preset.playerPosition;
    dom.customPlayerTyre.value = preset.playerTyre;
    dom.customPlayerWear.value = preset.playerWear;
    dom.customGapAhead.value = preset.playerPosition > 1 ? (preset.playerGapAhead || 2.0) : 0.6;
    dom.customGapBehind.value = preset.playerPosition < 20 ? (preset.playerGapBehind || 2.0) : 0.6;
    dom.customSafetyCarProbability.value = Math.round((preset.safetyCarProbability || 0) * 100);
    if (!preserveName || !dom.customScenarioName.value.trim()) {
      dom.customScenarioName.value = `${preset.name} Custom`;
    }
  }

  function readCustomScenarioOptions() {
    return {
      name: dom.customScenarioName.value.trim() || "Custom Condition",
      baseScenarioId: dom.customBaseScenario.value,
      fieldTheme: dom.customFieldTheme.value,
      startLap: Number(dom.customStartLap.value),
      playerPosition: Number(dom.customPlayerPosition.value),
      playerTyre: dom.customPlayerTyre.value,
      playerWear: Number(dom.customPlayerWear.value),
      playerGapAhead: Number(dom.customGapAhead.value),
      playerGapBehind: Number(dom.customGapBehind.value),
      safetyCarProbability: Number(dom.customSafetyCarProbability.value) / 100
    };
  }

  function buildSelectedScenarioBundle() {
    if (dom.useCustomScenario.checked) {
      const customOptions = readCustomScenarioOptions();
      state.scenarioSelection = {
        mode: "custom",
        customOptions
      };
      return dataApi.createCustomScenarioBundle(customOptions);
    }
    const scenarioId = dom.scenarioPreset.value;
    state.scenarioSelection = {
      mode: "preset",
      scenarioId
    };
    return dataApi.getScenarioBundle(scenarioId);
  }

  function loadScenarioBundle(bundle) {
    raceConfig = bundle.raceConfig;
    cars = bundle.cars;
    opponentStrategies = bundle.opponentStrategies;
    baselinePlan = bundle.baselinePlan;
    state.activeScenarioName = bundle.name;
    state.selectedScenarioId = bundle.id;
  }

  function renderScenarioCards() {
    const customEnabled = dom.useCustomScenario.checked;
    dom.scenarioCards.innerHTML = dataApi.scenarioPresets.map((scenario) => {
      const isSelected = dom.scenarioPreset.value === scenario.id;
      const safetyCarLabel = scenario.safetyCarProbability >= 1
        ? `SC in ${scenario.safetyCarEarliestOffset}-${scenario.safetyCarLatestOffset} laps`
        : `${Math.round(scenario.safetyCarProbability * 100)}% safety car`;
      return `
        <button
          class="scenario-card ${isSelected ? "active" : ""} ${customEnabled ? "muted" : ""}"
          type="button"
          data-scenario-id="${scenario.id}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          <span class="scenario-card-eyebrow">Lap ${scenario.startLap} start</span>
          <strong>${escapeHtml(scenario.name)}</strong>
          <p>${escapeHtml(scenario.description)}</p>
          <div class="scenario-card-meta">
            <span>P${scenario.playerPosition}</span>
            <span>${escapeHtml(tyreCompounds[scenario.playerTyre].label)} · ${scenario.playerWear}%</span>
            <span>${escapeHtml(safetyCarLabel)}</span>
          </div>
        </button>
      `;
    }).join("");
    dom.scenarioCards.querySelectorAll("[data-scenario-id]").forEach((button) => {
      button.addEventListener("click", () => {
        if (dom.useCustomScenario.checked) {
          dom.useCustomScenario.checked = false;
        }
        dom.scenarioPreset.value = button.dataset.scenarioId;
        handleScenarioPresetChange();
        syncScenarioBuilderUi();
      });
    });
  }

  function updateScenarioSummary() {
    const bundle = dom.useCustomScenario.checked
      ? dataApi.createCustomScenarioBundle(readCustomScenarioOptions())
      : dataApi.getScenarioBundle(dom.scenarioPreset.value);
    const player = bundle.cars.find((car) => car.isPlayer);
    const lapsToGo = bundle.raceConfig.totalLaps - bundle.raceConfig.startLap;
    const safetyCarSummary = bundle.raceConfig.safetyCarProbability >= 1
      ? `Safety car guaranteed on Lap ${bundle.raceConfig.safetyCarEarliestLap}-${bundle.raceConfig.safetyCarLatestLap}`
      : `Safety car chance ${Math.round(bundle.raceConfig.safetyCarProbability * 100)}%`;
    dom.scenarioSummary.innerHTML = `
      <strong>${escapeHtml(bundle.name)}</strong>
      <p>${escapeHtml(bundle.description)}</p>
      <p>Start: Lap ${bundle.raceConfig.startLap} of ${bundle.raceConfig.totalLaps} · ${lapsToGo} laps to go · Player P${player.position}</p>
      <p>Tyres: ${tyreCompounds[player.tyre].label} at ${player.tyreWear.toFixed(0)}% wear · ${escapeHtml(safetyCarSummary)}</p>
      <p>${dom.useCustomScenario.checked ? "Custom condition builder is active." : "Select a race brief card above, then launch the sim."}</p>
    `;
  }

  function startChallenge() {
    state.teamName = dom.teamName.value.trim() || "Guest Strategist";
    state.disableSafetyCar = dom.disableSafetyCar.checked;
    loadScenarioBundle(buildSelectedScenarioBundle());
    initialiseRace();
    showScreen("dashboardScreen");
    renderDashboard();
  }

  function initialiseRace() {
    clearTimer();
    state.cars = deepClone(cars);
    state.currentLap = raceConfig.startLap;
    state.currentSector = 0;
    state.positionDeltaSector = 0;
    state.racePaused = true;
    state.raceStarted = false;
    state.raceFinished = false;
    state.eventFeed = [];
    state.pendingPlayerPit = null;
    state.playerStopCount = 0;
    state.carHistories = {};
    state.playerHistory = [];
    state.result = null;
    state.automaticPauseReason = "Choose whether to stay out or schedule your stop.";
    state.pauseContext = null;
    state.safetyCar = buildSafetyCarPlan();
    state.cars.forEach((car) => {
      car.completedStops = [];
      car.tyreHistory = [car.tyre];
      car.trafficLapsRemaining = 0;
      car.outLapRemaining = 0;
      car.previousPosition = car.position;
      car.lapStartPosition = car.position;
      car.undercutGain = 0;
      car.paceDeltaLog = [];
      if (!car.isPlayer) {
        const plan = opponentStrategies[car.id];
        car.strategyPlan = plan ? { ...plan } : null;
      }
    });
    const player = getPlayerCar();
    pushEvent(
      `Lap ${raceConfig.startLap}: ${state.teamName} takes over the pit wall in P${player.position} for ${state.activeScenarioName}. ${
        state.safetyCar.willOccur ? "A safety car may change the picture later." : "This run is fully green-flag."
      }`
    );
    updateRaceOrder();
    recordLapHistory();
    syncDecisionFromForm();
    state.pauseContext = buildPauseContext("opening");
  }

  function buildSafetyCarPlan() {
    if (state.disableSafetyCar) {
      return { willOccur: false, triggerLap: null, active: false, remainingLaps: 0, occurred: false };
    }
    const willOccur = Math.random() < raceConfig.safetyCarProbability;
    const triggerLap = willOccur
      ? randomInteger(raceConfig.safetyCarEarliestLap, raceConfig.safetyCarLatestLap)
      : null;
    return {
      willOccur,
      triggerLap,
      active: false,
      remainingLaps: 0,
      occurred: false
    };
  }

  function syncDecisionFromForm() {
    const action = document.querySelector('input[name="decisionAction"]:checked').value;
    const compound = document.querySelector('input[name="compound"]:checked').value;
    const timingOffset = Number(document.getElementById("pitTiming").value);
    state.decision = { action, compound, timingOffset };
    renderDecisionPanel();
  }

  function renderDecisionPanel() {
    if (!state.cars.length) {
      return;
    }
    const player = getPlayerCar();
    const pitLap = getScheduledPitLap(state.decision.timingOffset);
    const projection = calculateProjectedPitExit(player, state.decision.compound, pitLap);
    const decisionMath = calculateDecisionMath(player, projection, pitLap, state.decision.compound);
    const trafficLabel = projection.trafficRisk ? "Likely to rejoin in traffic." : "Likely to rejoin in cleaner air.";
    const actionLabel = state.decision.action === "pit"
      ? `Pit planned for Lap ${pitLap} on ${tyreCompounds[state.decision.compound].label} tyres.`
      : "Stay out selected for now.";
    const cliffRisk = player.tyreWear >= tyreCompounds[player.tyre].cliffThreshold ? "Tyre cliff active now." :
      player.tyreWear >= tyreCompounds[player.tyre].cliffThreshold - 8 ? "Tyre cliff is approaching." :
      "Tyres are still in the usable window.";

    dom.decisionInsights.innerHTML = `
      <p><strong>${actionLabel}</strong></p>
      <p>If you pit, the model expects a rejoin near <strong>P${projection.projectedPosition}</strong>. ${trafficLabel}</p>
      <p>${tyreCompounds[state.decision.compound].label} tyres usually last <strong>${tyreCompounds[state.decision.compound].effectiveLife}</strong>.</p>
      <p>${cliffRisk}</p>
    `;
    dom.decisionSummaryCard.innerHTML = `
      <span class="summary-label">Current strategy</span>
      <span class="summary-main">${state.decision.action === "pit" ? `Pit Lap ${pitLap}` : "Stay out"}</span>
      <span class="summary-detail">
        ${state.decision.action === "pit"
          ? `${tyreCompounds[state.decision.compound].label} tyres, projected rejoin P${projection.projectedPosition}.`
          : `Hold P${player.position} for now and watch tyre wear and undercut risk.`}
      </span>
    `;
    dom.decisionMathCard.innerHTML = `
      <span class="summary-label">The maths decision</span>
      <span class="summary-main">Does tyre time gained beat pit time lost?</span>
      <div class="decision-math-grid">
        <div><strong>${decisionMath.lapGain.toFixed(2)}s/lap</strong><small>fresh tyre gain</small></div>
        <div><strong>${decisionMath.breakEvenLaps.toFixed(1)} laps</strong><small>needed to pay back stop</small></div>
        <div><strong>${decisionMath.netEstimate > 0 ? "+" : ""}${decisionMath.netEstimate.toFixed(1)}s</strong><small>rough net effect</small></div>
        <div><strong>${decisionMath.lapsToCliff}</strong><small>laps until tyre cliff</small></div>
      </div>
      <p class="decision-math-text">
        Compare <strong>${decisionMath.lapGain.toFixed(2)} × ${decisionMath.usefulLaps}</strong> seconds of likely tyre gain
        against <strong>${decisionMath.totalStopCost.toFixed(1)}s</strong> of pit loss and traffic. If the gain is bigger, the stop is more likely to pay off.
      </p>
    `;
    dom.decisionStatus.textContent = state.pendingPlayerPit
      ? `Scheduled stop: Lap ${state.pendingPlayerPit.lap} for ${tyreCompounds[state.pendingPlayerPit.compound].label}`
      : state.automaticPauseReason || "Choose your next call";
  }

  function renderDashboard() {
    const player = getPlayerCar();
    const projection = calculateProjectedPitExit(player, state.decision.compound, getScheduledPitLap(state.decision.timingOffset));
    const gapBehind = getGapBehind(player);
    dom.lapDisplay.textContent = `${state.currentSector > 0 ? state.currentLap + 1 : state.currentLap} / ${raceConfig.totalLaps}`;
    dom.playerPositionDisplay.textContent = `P${player.position}`;
    dom.gapDisplay.textContent = `${formatSeconds(player.gapToCarAhead)} / ${formatSeconds(gapBehind)}`;
    dom.raceStatusDisplay.textContent = getRaceStatusLabel();
    dom.tyreDisplay.textContent = `${tyreCompounds[player.tyre].label} · ${player.tyreWear.toFixed(0)}%`;
    dom.pitLossDisplay.textContent = `${currentPitLoss().toFixed(1)}s`;
    dom.raceMapCaption.textContent = state.raceMapMode === "leader" ? "Leader-relative spacing" : "Gap around your car";
    renderPlayerCommandCard(player, projection);
    renderRaceMap(player);
    renderRaceTable(player);
    renderDecisionPanel();
    setControlStates();
    renderLiveMaths(player, projection);
    renderPauseModal();
  }

  function setControlStates() {
    const disabled = !state.racePaused || state.raceFinished;
    document.querySelectorAll("#decisionForm input, #decisionForm select").forEach((element) => {
      element.disabled = disabled;
    });
    dom.commitButton.disabled = state.raceFinished;
    dom.pauseButton.disabled = state.raceFinished;
    dom.pauseButton.textContent = !state.raceStarted
      ? "Play Race"
      : state.racePaused
        ? "Resume Race"
        : "Pause Race";
  }

  function renderRaceTable(player = getPlayerCar()) {
    dom.raceTableBody.innerHTML = state.cars.map((car) => {
      const isLocalBattle = Math.abs(car.position - player.position) <= 3;
      const contextLabel = buildRaceTableContext(car, player, isLocalBattle);
      const deltaBadge = renderPositionDeltaBadge(car);
      return `
      <tr class="${car.isPlayer ? "player-row" : ""} ${isLocalBattle ? "local-row" : "minimal-row"}">
        <td>P${car.position}${deltaBadge}</td>
        <td>
          ${car.id}<br>
          <small>${escapeHtml(car.driver)}</small>
          ${isLocalBattle ? `<small class="team-line">${escapeHtml(car.team)}</small>` : ""}
        </td>
        <td>${contextLabel}</td>
        <td><span class="tyre-tag tyre-${car.tyre}">${tyreCompounds[car.tyre].label}</span></td>
        <td>${car.tyreWear.toFixed(0)}%</td>
        <td>${car.pitSoonConfidence}</td>
      </tr>`;
    }).join("");
  }

  function renderEventFeed() {
    if (!dom.eventFeed) {
      return;
    }
    dom.eventFeed.innerHTML = state.eventFeed.map((eventText) => `<li>${escapeHtml(eventText)}</li>`).join("");
    dom.eventFeed.scrollTop = dom.eventFeed.scrollHeight;
  }

  function commitStrategy() {
    if (state.raceFinished) {
      return;
    }
    const player = getPlayerCar();
    if (state.decision.action === "pit") {
      state.pendingPlayerPit = {
        lap: getScheduledPitLap(state.decision.timingOffset),
        compound: state.decision.compound
      };
      state.automaticPauseReason = `Pit scheduled for Lap ${state.pendingPlayerPit.lap}.`;
      state.pauseContext = null;
      pushEvent(
        `Strategy locked: ${state.teamName} plans to pit on Lap ${state.pendingPlayerPit.lap} for ${tyreCompounds[state.pendingPlayerPit.compound].label} tyres from P${player.position}.`
      );
    } else {
      state.pendingPlayerPit = null;
      state.automaticPauseReason = "Staying out for now.";
      state.pauseContext = null;
      pushEvent(`Strategy locked: ${state.teamName} stays out at the restart.`);
    }

    state.racePaused = false;
    state.raceStarted = true;
    renderDashboard();
    runRaceLoop();
  }

  function togglePause() {
    if (state.raceFinished) {
      return;
    }
    if (!state.raceStarted) {
      commitStrategy();
      return;
    }
    if (state.racePaused) {
      state.automaticPauseReason = "Manual pause cleared.";
      state.pauseContext = null;
      state.racePaused = false;
      renderDashboard();
      runRaceLoop();
    } else {
      pauseRace(buildPauseContext("manual"));
    }
  }

  function pauseRace(reason) {
    state.racePaused = true;
    state.pauseContext = normalizePauseContext(reason);
    state.automaticPauseReason = state.pauseContext.summary;
    clearTimer();
    renderDashboard();
  }

  function runRaceLoop() {
    clearTimer();
    if (state.racePaused || state.raceFinished) {
      return;
    }
    state.timerId = window.setTimeout(() => {
      advanceOneSector();
      if (!state.racePaused && !state.raceFinished) {
        runRaceLoop();
      }
    }, SECTOR_DURATION_MS);
  }

  function advanceOneSector() {
    if (state.racePaused || state.raceFinished) {
      return;
    }

    const lap = state.currentLap + 1;
    if (state.currentSector === 0) {
      state.positionDeltaSector = 0;
      state.cars.forEach((car) => {
        car.lapStartPosition = car.position;
      });
      deploySafetyCarIfNeeded(lap);
      if (state.racePaused) {
        return;
      }
      applyOpponentPitDecisions(lap);
      applyPlayerPitDecision(lap);
      state.cars.forEach((car) => {
        car.pendingLapTime = calculateLapTime(car);
      });
    }

    state.currentSector += 1;
    state.positionDeltaSector = state.currentSector;
    state.cars.forEach((car) => {
      const sectorTime = (car.pendingLapTime || calculateLapTime(car)) / SECTORS_PER_LAP;
      car.totalRaceTime += sectorTime;
    });
    updateRaceOrder();

    if (state.currentSector === SECTORS_PER_LAP) {
      state.cars.forEach((car) => {
        car.paceDeltaLog.push(car.pendingLapTime || calculateLapTime(car));
        updateTyreWear(car);
        if (car.trafficLapsRemaining > 0) {
          car.trafficLapsRemaining -= 1;
        }
        if (car.outLapRemaining > 0) {
          car.outLapRemaining -= 1;
        }
        delete car.pendingLapTime;
      });

      state.currentLap = lap;
      state.currentSector = 0;
      recordLapHistory();
      updateUndercutTracking();
      updateSafetyCarState(lap);
      pushTyreWarningIfNeeded();

      if (state.currentLap >= raceConfig.totalLaps) {
        completeRace();
        return;
      }

      const pauseReason = checkAutomaticPause();
      if (pauseReason) {
        pauseRace(pauseReason);
        return;
      }
    }

    renderDashboard();
  }

  function deploySafetyCarIfNeeded(lap) {
    if (
      state.safetyCar.willOccur &&
      !state.safetyCar.occurred &&
      lap === state.safetyCar.triggerLap
    ) {
      state.safetyCar.active = true;
      state.safetyCar.occurred = true;
      state.safetyCar.remainingLaps = raceConfig.safetyCarDurationLaps;
      pushEvent(`Lap ${lap}: Safety car deployed. Pit loss is reduced and the race is neutralised.`);
      pauseRace(buildPauseContext("safety-car"));
    }
  }

  function applyOpponentPitDecisions(lap) {
    state.cars.forEach((car) => {
      if (car.isPlayer || !car.strategyPlan) {
        return;
      }

      let shouldPit = false;
      let nextCompound = null;
      const plan = car.strategyPlan;

      if (state.safetyCar.active && plan.respondsToSafetyCar && car.completedStops.length === 0 && lap >= plan.firstPitLap - 2) {
        shouldPit = car.tyreWear > 42;
        nextCompound = plan.firstPitCompound;
      } else if (car.completedStops.length === 0 && lap >= plan.firstPitLap) {
        shouldPit = true;
        nextCompound = plan.firstPitCompound;
      } else if (
        car.completedStops.length === 1 &&
        plan.secondPitLap &&
        lap >= plan.secondPitLap &&
        car.tyreWear > 46
      ) {
        shouldPit = true;
        nextCompound = plan.secondPitCompound;
      } else if (car.tyreWear >= 90) {
        shouldPit = true;
        nextCompound = emergencyCompound(car.tyre);
      }

      if (shouldPit && nextCompound) {
        applyPitStop(car, nextCompound, lap, false);
      }
    });
  }

  function applyPlayerPitDecision(lap) {
    if (!state.pendingPlayerPit || state.pendingPlayerPit.lap !== lap) {
      return;
    }
    applyPitStop(getPlayerCar(), state.pendingPlayerPit.compound, lap, true);
    state.pendingPlayerPit = null;
  }

  function calculateLapTime(car) {
    const breakdown = calculateLapBreakdown(car);
    return breakdown.total;
  }

  function updateTyreWear(car) {
    const tyre = tyreCompounds[car.tyre];
    car.tyreAge += 1;
    car.tyreWear = Math.min(100, car.tyreWear + tyre.wearPerLap);
  }

  function applyPitStop(car, newCompound, lap, isPlayer) {
    const loss = currentPitLoss();
    car.totalRaceTime += loss;
    car.tyre = newCompound;
    car.tyreAge = 0;
    car.tyreWear = 3;
    car.outLapRemaining = 1;
    car.completedStops.push({ lap, compound: newCompound, underSafetyCar: state.safetyCar.active });
    car.tyreHistory.push(newCompound);
    if (isPlayer) {
      state.playerStopCount += 1;
      pushEvent(`Lap ${lap}: Player pits for ${tyreCompounds[newCompound].label} tyres. Pit loss ${loss.toFixed(1)}s.`);
    } else {
      pushEvent(`Lap ${lap}: ${car.id} pits for ${tyreCompounds[newCompound].label} tyres.`);
    }
  }

  function updateRaceOrder() {
    state.cars.forEach((car) => {
      car.previousPosition = car.position;
    });
    state.cars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
    const leaderTime = state.cars[0].totalRaceTime;
    state.cars.forEach((car, index) => {
      car.position = index + 1;
      car.gapToLeader = car.totalRaceTime - leaderTime;
      car.gapToCarAhead = index === 0 ? null : car.totalRaceTime - state.cars[index - 1].totalRaceTime;
    });
    assignTrafficAfterPits();
  }

  function assignTrafficAfterPits() {
    state.cars.forEach((car, index) => {
      if (index === 0) {
        return;
      }
      const gap = car.totalRaceTime - state.cars[index - 1].totalRaceTime;
      if (car.outLapRemaining > 0 && gap < raceConfig.trafficGap) {
        car.trafficLapsRemaining = Math.max(car.trafficLapsRemaining, 2);
      }
    });
  }

  function calculateProjectedPitExit(playerCar, targetCompound, pitLap) {
    const currentTime = playerCar.totalRaceTime;
    const pitLoss = currentPitLoss();
    const lapsUntilProjection = Math.max(1, pitLap - state.currentLap);
    const lapsBeforePit = Math.max(0, lapsUntilProjection - 1);
    const currentStintLap = estimateLapTimeForProjection(playerCar, playerCar.tyre, playerCar.tyreWear, false);
    const projectedOutLap = estimateLapTimeForProjection(playerCar, targetCompound, 3, true);
    const projectedTime = currentTime + (lapsBeforePit * currentStintLap) + pitLoss + projectedOutLap;
    const ordered = [...state.cars]
      .map((car) => ({
        id: car.id,
        projected: car.id === playerCar.id
          ? projectedTime
          : car.totalRaceTime + (lapsUntilProjection * estimateLapTimeForProjection(car, car.tyre, car.tyreWear, false))
      }))
      .sort((a, b) => a.projected - b.projected);
    let projectedPosition = ordered.findIndex((car) => projectedTime < car.projected) + 1;
    if (projectedPosition === 0) {
      projectedPosition = ordered.length;
    }
    const carAhead = ordered[Math.max(0, projectedPosition - 2)];
    const trafficRisk = !!carAhead && Math.abs(projectedTime - carAhead.projected) < raceConfig.trafficGap;
    return { projectedPosition, trafficRisk };
  }

  function getDisplayedLap() {
    return state.currentSector > 0 ? state.currentLap + 1 : state.currentLap;
  }

  function getScheduledPitLap(timingOffset = 0) {
    return Math.min(getDisplayedLap() + 1 + timingOffset, raceConfig.totalLaps);
  }

  function updateSafetyCarState(lap) {
    if (!state.safetyCar.active) {
      return;
    }
    state.safetyCar.remainingLaps -= 1;
    if (state.safetyCar.remainingLaps <= 0) {
      state.safetyCar.active = false;
      pushEvent(`Lap ${lap}: Safety car in this lap. Racing resumes.`);
    }
  }

  function pushTyreWarningIfNeeded() {
    const player = getPlayerCar();
    const cliff = tyreCompounds[player.tyre].cliffThreshold;
    if (Math.abs(player.tyreWear - 85) < 1.8) {
      pushEvent(`Lap ${state.currentLap}: Player tyre wear is ${player.tyreWear.toFixed(0)}%. Grip is falling sharply.`);
    } else if (player.tyreWear > cliff && Math.abs(player.tyreWear - cliff) < 3.6) {
      pushEvent(`Lap ${state.currentLap}: Player tyres have crossed the ${tyreCompounds[player.tyre].label.toLowerCase()} cliff threshold.`);
    }
  }

  function checkAutomaticPause() {
    const player = getPlayerCar();
    if (state.safetyCar.active) {
      return buildPauseContext("safety-car");
    }
    if (player.tyreWear >= 85) {
      return buildPauseContext("tyre-cliff");
    }
    if (raceConfig.automaticPauseLaps.includes(state.currentLap)) {
      return buildPauseContext("scheduled-review");
    }
    return "";
  }

  function updateUndercutTracking() {
    const player = getPlayerCar();
    const referenceCars = state.cars.filter((car) => !car.isPlayer && Math.abs(car.position - player.position) <= 3);
    referenceCars.forEach((car) => {
      if (car.completedStops.length === 0 && player.completedStops.length > 0) {
        player.undercutGain += (car.gapToLeader - player.gapToLeader);
      }
    });
  }

  function completeRace() {
    state.raceFinished = true;
    state.racePaused = true;
    state.pauseContext = null;
    clearTimer();
    updateRaceOrder();
    state.result = buildResult();
    saveLeaderboardEntry(state.result);
    renderResults();
    showScreen("resultsScreen");
  }

  function buildResult() {
    const player = getPlayerCar();
    const baseline = simulateBaseline();
    const baselineTime = baseline.time;
    const score = calculateScore(player, baselineTime);
    const optimalAnalysis = analyseOptimalPitWindow();
    const chartSubjects = buildChartSubjects(player);
    return {
      teamName: state.teamName,
      finalPosition: player.position,
      raceTime: player.totalRaceTime,
      gapToWinner: player.gapToLeader,
      stops: player.completedStops.length,
      tyreSequence: player.tyreHistory.map((key) => tyreCompounds[key].label),
      safetyCarOccurred: state.safetyCar.occurred,
      safetyCarLap: state.safetyCar.triggerLap,
      score,
      baselineDelta: player.totalRaceTime - baselineTime,
      optimalAnalysis,
      chartSubjects,
      explanation: generateExplanation(player, baselineTime, optimalAnalysis),
      comparison: buildStrategyComparison(player, baseline),
      timestamp: new Date().toISOString()
    };
  }

  function calculateScore(player, baselineTime) {
    const positionMap = {
      1: 50, 2: 46, 3: 43, 4: 40, 5: 37, 6: 34, 7: 31, 8: 28, 9: 25, 10: 22,
      11: 19, 12: 16, 13: 13, 14: 10, 15: 8, 16: 6, 17: 4, 18: 3, 19: 2, 20: 1
    };
    const positionScore = positionMap[player.position] || 1;
    const baselineDelta = player.totalRaceTime - baselineTime;
    const baselineScore = clamp(25 - baselineDelta * 1.8, 0, 25);
    const tyreManagementPenalty = Math.max(0, player.completedStops.length - 2) * 2.5 + Math.max(0, player.tyreWear - 88) * 0.15;
    const tyreManagementScore = clamp(15 - tyreManagementPenalty, 4, 15);
    const efficiencyScore = clamp(10 - Math.max(0, state.playerStopCount - 1) * 2 - Math.max(0, player.trafficLapsRemaining) * 1.5, 2, 10);
    return Math.round(positionScore + baselineScore + tyreManagementScore + efficiencyScore);
  }

  function generateExplanation(player, baselineTime, optimalAnalysis) {
    const delta = player.totalRaceTime - baselineTime;
    const finishedFaster = delta < 0;
    const firstStop = player.completedStops[0];
    let strategyLabel = "Conservative one-stop";

    if (state.safetyCar.occurred && firstStop && firstStop.underSafetyCar) {
      strategyLabel = "Safety car opportunist";
    } else if (player.completedStops.length >= 2) {
      strategyLabel = "Aggressive multi-stop";
    } else if (firstStop && firstStop.lap < baselinePlan.firstPitLap) {
      strategyLabel = player.position <= 7 ? "Successful undercut" : "Failed undercut due to traffic";
    } else if (firstStop && firstStop.lap > baselinePlan.firstPitLap) {
      strategyLabel = player.tyreWear < 85 ? "Successful overcut" : "Failed overcut due to tyre degradation";
    }

    const baselineLabel = `Lap ${baselinePlan.firstPitLap} to ${tyreCompounds[baselinePlan.firstPitCompound].label.toLowerCase()}`;
    const paceSummary = finishedFaster
      ? `Compared with the baseline ${baselineLabel} strategy, you gained ${Math.abs(delta).toFixed(1)} seconds.`
      : `Compared with the baseline ${baselineLabel} strategy, you lost ${Math.abs(delta).toFixed(1)} seconds.`;

    const pitSummary = firstStop
      ? `Your first stop came on Lap ${firstStop.lap} for ${tyreCompounds[firstStop.compound].label} tyres.`
      : "You chose not to pit, which left you exposed to the tyre cliff.";

    const safetySummary = state.safetyCar.occurred
      ? `A safety car appeared on Lap ${state.safetyCar.triggerLap}, reducing pit loss to ${raceConfig.safetyCarPitLoss.toFixed(0)} seconds for two laps.`
      : "This run stayed green, so every stop cost the full normal pit-loss value.";
    const optimalSummary = optimalAnalysis.actualStopLap === null
      ? `The strongest one-stop window in this run was Lap ${optimalAnalysis.bestLap} on ${tyreCompounds[optimalAnalysis.bestCompound].label}, so skipping the stop cost time.`
      : `The best one-stop window was Lap ${optimalAnalysis.bestLap} on ${tyreCompounds[optimalAnalysis.bestCompound].label}. You stopped on Lap ${optimalAnalysis.actualStopLap} for ${tyreCompounds[optimalAnalysis.actualCompound].label}, which was ${optimalAnalysis.actualDeltaToBest.toFixed(1)}s slower than that best window.`;
    const wrongDecision = describeDecisionMiss(optimalAnalysis);

    return { strategyLabel, paceSummary, pitSummary, safetySummary, optimalSummary, wrongDecision };
  }

  function renderResults() {
    const result = state.result;
    dom.resultsHeadline.textContent = `${result.teamName} finished P${result.finalPosition}.`;
    dom.resultsSummary.innerHTML = [
      metricCard("Score", `${result.score} / 100`),
      metricCard("Race time", `${result.raceTime.toFixed(1)}s`),
      metricCard("Gap to winner", `${result.gapToWinner.toFixed(1)}s`),
      metricCard("Stops", `${result.stops}`),
      metricCard("Tyres used", result.tyreSequence.join(" → ")),
      metricCard("Safety car", result.safetyCarOccurred ? `Yes, Lap ${result.safetyCarLap}` : "No")
    ].join("");

    dom.resultsExplanation.innerHTML = `
      <div class="explanation-block">
        <p><strong>${result.explanation.strategyLabel}</strong></p>
        <p>${result.explanation.pitSummary}</p>
        <p>${result.explanation.paceSummary}</p>
        <p>${result.explanation.safetySummary}</p>
        <p>${result.explanation.optimalSummary}</p>
        <p><strong>Decision audit:</strong> ${result.explanation.wrongDecision}</p>
      </div>
    `;
    dom.resultsChartDriver.innerHTML = result.chartSubjects.map((subject) => `
      <option value="${subject.id}">${escapeHtml(subject.label)}</option>
    `).join("");
    dom.resultsChartDriver.value = raceConfig.playerCarId;
    renderResultsCharts(result, raceConfig.playerCarId);

    dom.strategyComparison.innerHTML = renderStrategyComparison(result.comparison);

    renderLeaderboard("resultsLeaderboard");
  }

  function simulateBaseline() {
    const simCars = deepClone(cars);
    const safetyPlan = { ...state.safetyCar };
    let currentLap = raceConfig.startLap;
    const baselineHistory = [];

    simCars.forEach((car) => {
      car.completedStops = [];
      car.tyreHistory = [car.tyre];
      car.strategyPlan = car.isPlayer ? null : (opponentStrategies[car.id] ? { ...opponentStrategies[car.id] } : null);
      car.trafficLapsRemaining = 0;
      car.outLapRemaining = 0;
    });

    while (currentLap < raceConfig.totalLaps) {
      const lap = currentLap + 1;
      if (safetyPlan.willOccur && !safetyPlan.occurred && lap === safetyPlan.triggerLap) {
        safetyPlan.active = true;
        safetyPlan.occurred = true;
        safetyPlan.remainingLaps = raceConfig.safetyCarDurationLaps;
      }

      simCars.forEach((car) => {
        if (car.isPlayer) {
          if (
            car.completedStops.length === 0 &&
            (lap === baselinePlan.firstPitLap || (safetyPlan.active && lap >= baselinePlan.firstPitLap && car.tyreWear > 60))
          ) {
            const loss = safetyPlan.active ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = baselinePlan.firstPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: baselinePlan.firstPitCompound });
            car.tyreHistory.push(baselinePlan.firstPitCompound);
          }
        } else {
          const plan = car.strategyPlan;
          if (!plan) {
            return;
          }
          if (car.completedStops.length === 0 && lap >= plan.firstPitLap) {
            const loss = safetyPlan.active && plan.respondsToSafetyCar ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = plan.firstPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: plan.firstPitCompound });
          } else if (car.completedStops.length === 1 && plan.secondPitLap && lap >= plan.secondPitLap && car.tyreWear > 46) {
            const loss = safetyPlan.active && plan.respondsToSafetyCar ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = plan.secondPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: plan.secondPitCompound });
          }
        }
      });

      simCars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
      simCars.forEach((car, index) => {
        const gapAhead = index === 0 ? null : car.totalRaceTime - simCars[index - 1].totalRaceTime;
        const tyre = tyreCompounds[car.tyre];
        const wearPenalty = Math.pow(car.tyreWear / 100, 2) * tyre.wearMultiplier;
        const cliffPenalty = car.tyreWear > tyre.cliffThreshold ? (car.tyreWear - tyre.cliffThreshold) * 0.15 : 0;
        const dirtyAirPenalty = gapAhead !== null && gapAhead < raceConfig.dirtyAirGap ? raceConfig.dirtyAirPenalty : 0;
        const trafficPenalty = car.outLapRemaining > 0 && gapAhead !== null && gapAhead < raceConfig.trafficGap ? raceConfig.trafficPenalty : 0;
        const outLapPenalty = car.outLapRemaining > 0 ? 0.7 : 0;
        const safetyPenalty = safetyPlan.active ? 10.5 : 0;
        car.totalRaceTime += raceConfig.baseLapTime + tyre.compoundOffset + wearPenalty + cliffPenalty + dirtyAirPenalty + trafficPenalty + outLapPenalty + safetyPenalty;
        car.tyreAge += 1;
        car.tyreWear = Math.min(100, car.tyreWear + tyre.wearPerLap);
        if (car.outLapRemaining > 0) {
          car.outLapRemaining -= 1;
        }
      });

      if (safetyPlan.active) {
        safetyPlan.remainingLaps -= 1;
        if (safetyPlan.remainingLaps <= 0) {
          safetyPlan.active = false;
        }
      }

      simCars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
      const baselinePlayer = simCars.find((car) => car.id === raceConfig.playerCarId);
      baselineHistory.push({
        lap,
        totalRaceTime: baselinePlayer.totalRaceTime,
        tyreWear: baselinePlayer.tyreWear,
        position: simCars.findIndex((car) => car.id === raceConfig.playerCarId) + 1
      });

      currentLap = lap;
    }

    simCars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
    const baselinePlayer = simCars.find((car) => car.id === raceConfig.playerCarId);
    return {
      time: baselinePlayer.totalRaceTime,
      history: baselineHistory,
      finalPosition: simCars.findIndex((car) => car.id === raceConfig.playerCarId) + 1,
      completedStops: baselinePlayer.completedStops,
      tyreHistory: baselinePlayer.tyreHistory
    };
  }

  function simulateOutcomeForPlayerPlan(plan) {
    const simCars = deepClone(cars);
    const safetyPlan = { ...state.safetyCar };
    let currentLap = raceConfig.startLap;

    simCars.forEach((car) => {
      car.completedStops = [];
      car.tyreHistory = [car.tyre];
      car.strategyPlan = car.isPlayer ? null : (opponentStrategies[car.id] ? { ...opponentStrategies[car.id] } : null);
      car.trafficLapsRemaining = 0;
      car.outLapRemaining = 0;
    });

    while (currentLap < raceConfig.totalLaps) {
      const lap = currentLap + 1;
      if (safetyPlan.willOccur && !safetyPlan.occurred && lap === safetyPlan.triggerLap) {
        safetyPlan.active = true;
        safetyPlan.occurred = true;
        safetyPlan.remainingLaps = raceConfig.safetyCarDurationLaps;
      }

      simCars.forEach((car) => {
        if (car.isPlayer) {
          if (plan && car.completedStops.length === 0 && lap === plan.firstPitLap) {
            const loss = safetyPlan.active ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = plan.firstPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: plan.firstPitCompound });
            car.tyreHistory.push(plan.firstPitCompound);
          }
        } else {
          const planData = car.strategyPlan;
          if (!planData) {
            return;
          }
          if (car.completedStops.length === 0 && lap >= planData.firstPitLap) {
            const loss = safetyPlan.active && planData.respondsToSafetyCar ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = planData.firstPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: planData.firstPitCompound });
            car.tyreHistory.push(planData.firstPitCompound);
          } else if (car.completedStops.length === 1 && planData.secondPitLap && lap >= planData.secondPitLap && car.tyreWear > 46) {
            const loss = safetyPlan.active && planData.respondsToSafetyCar ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
            car.totalRaceTime += loss;
            car.tyre = planData.secondPitCompound;
            car.tyreAge = 0;
            car.tyreWear = 3;
            car.outLapRemaining = 1;
            car.completedStops.push({ lap, compound: planData.secondPitCompound });
            car.tyreHistory.push(planData.secondPitCompound);
          }
        }
      });

      simCars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
      simCars.forEach((car, index) => {
        const gapAhead = index === 0 ? null : car.totalRaceTime - simCars[index - 1].totalRaceTime;
        const tyre = tyreCompounds[car.tyre];
        const wearPenalty = Math.pow(car.tyreWear / 100, 2) * tyre.wearMultiplier;
        const cliffPenalty = car.tyreWear > tyre.cliffThreshold ? (car.tyreWear - tyre.cliffThreshold) * 0.15 : 0;
        const dirtyAirPenalty = gapAhead !== null && gapAhead < raceConfig.dirtyAirGap ? raceConfig.dirtyAirPenalty : 0;
        const trafficPenalty = car.outLapRemaining > 0 && gapAhead !== null && gapAhead < raceConfig.trafficGap ? raceConfig.trafficPenalty : 0;
        const outLapPenalty = car.outLapRemaining > 0 ? 0.7 : 0;
        const safetyPenalty = safetyPlan.active ? 10.5 : 0;
        car.totalRaceTime += raceConfig.baseLapTime + tyre.compoundOffset + wearPenalty + cliffPenalty + dirtyAirPenalty + trafficPenalty + outLapPenalty + safetyPenalty;
        car.tyreAge += 1;
        car.tyreWear = Math.min(100, car.tyreWear + tyre.wearPerLap);
        if (car.outLapRemaining > 0) {
          car.outLapRemaining -= 1;
        }
      });

      if (safetyPlan.active) {
        safetyPlan.remainingLaps -= 1;
        if (safetyPlan.remainingLaps <= 0) {
          safetyPlan.active = false;
        }
      }

      currentLap = lap;
    }

    simCars.sort((a, b) => a.totalRaceTime - b.totalRaceTime);
    const player = simCars.find((car) => car.id === raceConfig.playerCarId);
    return {
      time: player.totalRaceTime,
      position: simCars.findIndex((car) => car.id === raceConfig.playerCarId) + 1
    };
  }

  function saveLeaderboardEntry(result) {
    const entries = loadLeaderboard();
    entries.push({
      teamName: result.teamName,
      score: result.score,
      finalPosition: result.finalPosition,
      gapToWinner: Number(result.gapToWinner.toFixed(1)),
      stops: result.stops,
      tyreSequence: result.tyreSequence,
      safetyCarOccurred: result.safetyCarOccurred,
      timestamp: result.timestamp
    });
    entries.sort((a, b) => b.score - a.score || a.gapToWinner - b.gapToWinner);
    localStorage.setItem(raceConfig.leaderboardStorageKey, JSON.stringify(entries.slice(0, 10)));
  }

  function loadLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(raceConfig.leaderboardStorageKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  function clearLeaderboard() {
    if (!window.confirm("Are you sure you want to clear all local scores?")) {
      return;
    }
    localStorage.removeItem(raceConfig.leaderboardStorageKey);
    renderLeaderboard("startLeaderboard");
    renderLeaderboard("resultsLeaderboard");
  }

  function renderLeaderboard(targetId) {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }
    const entries = loadLeaderboard();
    if (!entries.length) {
      target.innerHTML = '<p class="leaderboard-empty">No local scores yet.</p>';
      return;
    }
    target.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Score</th>
            <th>Pos</th>
            <th>To Leader</th>
            <th>Stops</th>
            <th>SC</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr>
              <td>${escapeHtml(entry.teamName)}</td>
              <td>${entry.score}</td>
              <td>P${entry.finalPosition}</td>
              <td>${entry.gapToWinner !== undefined
                ? Number(entry.gapToWinner).toFixed(1)
                : (entry.raceTime !== undefined ? Number(entry.raceTime).toFixed(1) : "0.0")}s</td>
              <td>${entry.stops}</td>
              <td>${entry.safetyCarOccurred ? "Yes" : "No"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function restartScenario() {
    clearTimer();
    dom.teamName.value = state.teamName === "Guest Strategist" ? "" : state.teamName;
    if (state.scenarioSelection) {
      loadScenarioBundle(
        state.scenarioSelection.mode === "custom"
          ? dataApi.createCustomScenarioBundle(state.scenarioSelection.customOptions)
          : dataApi.getScenarioBundle(state.scenarioSelection.scenarioId)
      );
    }
    initialiseRace();
    showScreen("dashboardScreen");
    renderDashboard();
  }

  function showScreen(id) {
    ["startScreen", "dashboardScreen", "resultsScreen"].forEach((screenId) => {
      document.getElementById(screenId).classList.toggle("active", screenId === id);
    });
    if (id !== "dashboardScreen" && dom.pauseModal) {
      dom.pauseModal.classList.add("hidden");
      dom.pauseModal.setAttribute("aria-hidden", "true");
    }
  }

  function dismissPauseModal() {
    if (!state.pauseContext) {
      return;
    }
    state.pauseContext.dismissed = true;
    renderPauseModal();
  }

  function pushEvent(message) {
    state.eventFeed.push(message);
    state.eventFeed = state.eventFeed.slice(-18);
  }

  function getPlayerCar() {
    return state.cars.find((car) => car.isPlayer);
  }

  function getGapBehind(player) {
    const behind = state.cars.find((car) => car.position === player.position + 1);
    return behind ? behind.gapToCarAhead : 0;
  }

  function currentPitLoss() {
    return state.safetyCar.active ? raceConfig.safetyCarPitLoss : raceConfig.normalPitLoss;
  }

  function formatRaceDelta(delta) {
    if (Math.abs(delta) < 0.05) {
      return "Level";
    }
    return delta > 0 ? `+${delta.toFixed(1)}s` : `-${Math.abs(delta).toFixed(1)}s`;
  }

  function analyseOptimalPitWindow() {
    const player = getPlayerCar();
    const actualStop = player.completedStops[0] || null;
    const scan = [];
    let best = null;
    for (let lap = raceConfig.startLap + 1; lap <= raceConfig.totalLaps - 2; lap += 1) {
      ["soft", "medium", "hard"].forEach((compound) => {
        const outcome = simulateOutcomeForPlayerPlan({ firstPitLap: lap, firstPitCompound: compound });
        scan.push({ lap, compound, time: outcome.time, position: outcome.position });
        if (!best || outcome.time < best.time) {
          best = { lap, compound, time: outcome.time, position: outcome.position };
        }
      });
    }
    const bestByLap = [];
    for (let lap = raceConfig.startLap + 1; lap <= raceConfig.totalLaps - 2; lap += 1) {
      const lapOptions = scan.filter((entry) => entry.lap === lap).sort((a, b) => a.time - b.time);
      bestByLap.push({ lap, time: lapOptions[0].time, compound: lapOptions[0].compound });
    }
    return {
      bestLap: best.lap,
      bestCompound: best.compound,
      bestTime: best.time,
      bestPosition: best.position,
      actualStopLap: actualStop ? actualStop.lap : null,
      actualCompound: actualStop ? actualStop.compound : null,
      actualDeltaToBest: actualStop ? player.totalRaceTime - best.time : getPlayerCar().totalRaceTime - best.time,
      scan: bestByLap
    };
  }

  function metricCard(label, value) {
    return `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`;
  }

  function recordLapHistory() {
    state.cars.forEach((car) => {
      if (!state.carHistories[car.id]) {
        state.carHistories[car.id] = [];
      }
      state.carHistories[car.id].push({
        lap: state.currentLap,
        position: car.position,
        tyreWear: car.tyreWear,
        tyre: car.tyre,
        totalRaceTime: car.totalRaceTime,
        safetyCarActive: state.safetyCar.active
      });
    });
    state.playerHistory = state.carHistories[raceConfig.playerCarId] || [];
  }

  function estimateLapTimeForProjection(car, tyreKey, wear, outLap) {
    const tyre = tyreCompounds[tyreKey];
    const wearPenalty = Math.pow(wear / 100, 2) * tyre.wearMultiplier;
    const cliffPenalty = wear > tyre.cliffThreshold ? (wear - tyre.cliffThreshold) * 0.15 : 0;
    const outLapPenalty = outLap ? 0.7 : 0;
    const safetyPenalty = state.safetyCar.active ? 10.5 : 0;
    return raceConfig.baseLapTime + tyre.compoundOffset + wearPenalty + cliffPenalty + outLapPenalty + safetyPenalty;
  }

  function calculateLapBreakdown(car) {
    const tyre = tyreCompounds[car.tyre];
    const wearPenalty = Math.pow(car.tyreWear / 100, 2) * tyre.wearMultiplier;
    const cliffPenalty = car.tyreWear > tyre.cliffThreshold ? (car.tyreWear - tyre.cliffThreshold) * 0.15 : 0;
    const dirtyAirPenalty = car.gapToCarAhead !== null && car.gapToCarAhead < raceConfig.dirtyAirGap ? raceConfig.dirtyAirPenalty : 0;
    const trafficPenalty = car.trafficLapsRemaining > 0 ? raceConfig.trafficPenalty : 0;
    const outLapPenalty = car.outLapRemaining > 0 ? 0.7 : 0;
    const safetyPenalty = state.safetyCar.active ? 10.5 : 0;
    return {
      base: raceConfig.baseLapTime,
      compoundOffset: tyre.compoundOffset,
      wearPenalty,
      cliffPenalty,
      dirtyAirPenalty,
      trafficPenalty,
      outLapPenalty,
      safetyPenalty,
      total: raceConfig.baseLapTime
        + tyre.compoundOffset
        + wearPenalty
        + cliffPenalty
        + dirtyAirPenalty
        + trafficPenalty
        + outLapPenalty
        + safetyPenalty
    };
  }

  function renderLiveMaths(player, projection) {
    const currentBreakdown = calculateLapBreakdown(player);
    const chosenCompound = state.decision.compound;
    const projectedBreakdown = calculateProjectionBreakdown(player, chosenCompound);
    const cliffDelta = tyreCompounds[player.tyre].cliffThreshold - player.tyreWear;

    dom.mathsLiveGrid.innerHTML = [
      mathsCard("Stay out now", `${currentBreakdown.total.toFixed(2)}s`, [
        `Base lap: 90.00s`,
        signedLine(currentBreakdown.wearPenalty, "wear penalty"),
        signedLine(currentBreakdown.cliffPenalty, "cliff penalty"),
        signedLine(currentBreakdown.dirtyAirPenalty, "dirty air"),
        signedLine(currentBreakdown.trafficPenalty, "traffic")
      ]),
      mathsCard("Pit option", `Rejoin P${projection.projectedPosition}`, [
        `Pit loss: ${currentPitLoss().toFixed(1)}s`,
        `${tyreCompounds[chosenCompound].label} out-lap: ${projectedBreakdown.outLap.toFixed(2)}s`,
        projection.trafficRisk ? "Likely traffic on exit" : "Clearer exit expected"
      ]),
      mathsCard("Tyre trend", `${player.tyreWear.toFixed(0)}% -> ${Math.min(100, player.tyreWear + tyreCompounds[player.tyre].wearPerLap).toFixed(1)}%`, [
        `Wear rate: ${tyreCompounds[player.tyre].wearPerLap.toFixed(1)}% per lap`,
        `Cliff starts at ${tyreCompounds[player.tyre].cliffThreshold}%`,
        cliffDelta <= 0 ? "You are already past the cliff" : `${cliffDelta.toFixed(0)}% until the cliff`
      ]),
      mathsCard("Trade-off", projectedBreakdown.deltaText, [
        `Fresh tyre gain: ${projectedBreakdown.freshGain.toFixed(2)}s/lap`,
        player.gapToCarAhead !== null && player.gapToCarAhead < raceConfig.dirtyAirGap ? "Staying out means dirty air" : "Staying out keeps track position",
        state.safetyCar.active ? "Safety car makes the stop cheaper" : "Green-flag stop costs full time"
      ])
    ].join("");
  }

  function calculateProjectionBreakdown(player, targetCompound) {
    const current = calculateLapBreakdown(player);
    const outLap = estimateLapTimeForProjection(player, targetCompound, 3, true);
    const freshLap = estimateLapTimeForProjection(player, targetCompound, 8, false);
    const freshGain = current.total - freshLap;
    return {
      outLap,
      freshGain,
      deltaText: freshGain > 0
        ? `${freshGain.toFixed(2)}s/lap quicker on fresh ${tyreCompounds[targetCompound].label.toLowerCase()}s`
        : `${Math.abs(freshGain).toFixed(2)}s/lap slower even on fresh ${tyreCompounds[targetCompound].label.toLowerCase()}s`
    };
  }

  function calculateDecisionMath(player, projection, pitLap, targetCompound) {
    const currentLapTime = calculateLapBreakdown(player).total;
    const freshLapTime = estimateLapTimeForProjection(player, targetCompound, 8, false);
    const lapGain = Math.max(0.05, currentLapTime - freshLapTime);
    const trafficCost = projection.trafficRisk ? raceConfig.trafficPenalty * 2 : 0;
    const totalStopCost = currentPitLoss() + trafficCost;
    const remainingLaps = Math.max(1, raceConfig.totalLaps - pitLap + 1);
    const tyre = tyreCompounds[player.tyre];
    const wearToCliff = tyre.cliffThreshold - player.tyreWear;
    const lapsToCliff = wearToCliff <= 0 ? 0 : Math.max(1, Math.floor(wearToCliff / tyre.wearPerLap));
    const usefulLaps = Math.min(remainingLaps, 8);
    const grossGain = lapGain * usefulLaps;
    const netEstimate = grossGain - totalStopCost;
    const breakEvenLaps = totalStopCost / lapGain;
    return {
      lapGain,
      totalStopCost,
      usefulLaps,
      grossGain,
      netEstimate,
      breakEvenLaps,
      lapsToCliff
    };
  }

  function mathsCard(label, value, lines) {
    return `
      <article class="maths-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <ul>
          ${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </article>
    `;
  }

  function signedLine(value, label) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)} ${label}`;
  }

  function buildPauseContext(kind) {
    const player = getPlayerCar();
    const projection = player
      ? calculateProjectedPitExit(player, state.decision.compound, getScheduledPitLap(state.decision.timingOffset))
      : { projectedPosition: 7, trafficRisk: false };
    const decisionMath = player
      ? calculateDecisionMath(player, projection, getScheduledPitLap(state.decision.timingOffset), state.decision.compound)
      : null;
    const lapLabel = `Lap ${getDisplayedLap()}`;
    const stats = player ? [
      { label: "Race point", value: lapLabel },
      { label: "Tyres", value: `${tyreCompounds[player.tyre].label} · ${player.tyreWear.toFixed(0)}%` },
      { label: "Pit loss", value: `${currentPitLoss().toFixed(1)}s` },
      { label: "Pit rejoin", value: `P${projection.projectedPosition}` }
    ] : [];

    if (kind === "opening") {
      return {
        title: "Opening strategy decision",
        summary: "Race paused: choose and commit a strategy",
        reason: "The simulation is waiting for your first call. The race cannot start until you decide whether to stay out or schedule the first stop.",
        why: [
          "Your job is to compare track position against the time cost of a pit stop.",
          "An early stop may gain pace on fresh tyres, but it can drop you into traffic."
        ],
        action: [
          "Choose Stay out if you want more information before spending the pit loss.",
          "Choose Pit if you want to commit to the stop timing and compound now."
        ],
        stats,
        dismissed: false
      };
    }

    if (!player || !decisionMath) {
      return {
        title: "Race paused",
        summary: "Race paused",
        reason: "The race has stopped for a strategy review.",
        why: [],
        action: [],
        stats: [],
        dismissed: false
      };
    }

    if (kind === "manual") {
      return {
        title: "Manual pause",
        summary: "Race paused: manual review",
        reason: "You paused the race to inspect the situation. Use this stop to review tyre wear, projected rejoin position, and whether the current strategy still holds.",
        why: [
          `Fresh tyres are currently worth about ${decisionMath.lapGain.toFixed(2)}s per lap relative to the current stint.`,
          `A stop needs around ${decisionMath.breakEvenLaps.toFixed(1)} laps to earn back the ${currentPitLoss().toFixed(1)}s pit loss.`
        ],
        action: [
          "Check whether the tyre gain now outweighs the stop cost.",
          projection.trafficRisk ? "A pit stop is likely to rejoin into traffic, which reduces the undercut value." : "The projected rejoin is relatively clear if you choose to stop."
        ],
        stats,
        dismissed: false
      };
    }

    if (kind === "safety-car") {
      return {
        title: "Safety car pause",
        summary: `Race paused: safety car on Lap ${state.currentLap + 1}`,
        reason: "The race is paused because the safety car has changed the maths. Pitting now is cheaper than under green-flag running, so the optimal strategy may have moved.",
        why: [
          `Normal pit loss is ${raceConfig.normalPitLoss.toFixed(1)}s, but the safety car reduces it to ${raceConfig.safetyCarPitLoss.toFixed(1)}s.`,
          `That lowers the break-even point to about ${decisionMath.breakEvenLaps.toFixed(1)} laps of fresh-tyre gain.`,
          projection.trafficRisk ? "There is still a traffic risk on exit, so the cheaper stop is not automatically correct." : "The projected exit looks relatively clear, which makes the discounted stop more attractive."
        ],
        action: [
          "Decide whether to take the cheap stop now or keep track position for the restart.",
          `Compare staying out on worn ${tyreCompounds[player.tyre].label.toLowerCase()}s with switching to fresh ${tyreCompounds[state.decision.compound].label.toLowerCase()}s.`
        ],
        stats,
        dismissed: false
      };
    }

    if (kind === "tyre-cliff") {
      return {
        title: "Tyre cliff warning",
        summary: `Race paused: tyre wear critical on Lap ${state.currentLap}`,
        reason: "The race is paused because tyre wear has become severe enough that lap time can start deteriorating quickly. This is a forced strategy decision point.",
        why: [
          `Your current wear is ${player.tyreWear.toFixed(0)}%, and the ${tyreCompounds[player.tyre].label.toLowerCase()} cliff starts at ${tyreCompounds[player.tyre].cliffThreshold}%.`,
          `Fresh tyres are estimated to be worth about ${decisionMath.lapGain.toFixed(2)}s per lap right now.`,
          "If you stay out, both wear and cliff penalties are likely to keep increasing."
        ],
        action: [
          "Decide whether the current track position is still worth defending on these tyres.",
          `If you pit now, the model currently expects a rejoin around P${projection.projectedPosition}.`
        ],
        stats,
        dismissed: false
      };
    }

    return {
      title: `Strategy checkpoint on Lap ${state.currentLap}`,
      summary: `Race paused on Lap ${state.currentLap}: undercut review`,
      reason: "The race is paused because this lap is a key pit window. The app has flagged it as a point where the undercut can start to become mathematically viable.",
      why: [
        `Fresh tyres are estimated to gain about ${decisionMath.lapGain.toFixed(2)}s per lap over your current pace.`,
        `A stop still costs ${currentPitLoss().toFixed(1)}s, so you need around ${decisionMath.breakEvenLaps.toFixed(1)} laps to recover that.`,
        projection.trafficRisk ? "The projected rejoin is into traffic, which can erase some of the undercut gain." : "The projected rejoin is relatively clean, so the tyre gain has a better chance of paying back the stop."
      ],
      action: [
        "Decide whether tyre time gained now beats pit time lost.",
        "Use the Race Order and Gap View to judge whether staying out protects position or only delays the stop."
      ],
      stats,
      dismissed: false
    };
  }

  function normalizePauseContext(reason) {
    if (typeof reason === "string") {
      return {
        title: "Race paused",
        summary: reason,
        reason,
        why: [],
        action: [],
        stats: [],
        dismissed: false
      };
    }
    return {
      title: reason.title || "Race paused",
      summary: reason.summary || reason.reason || "Race paused",
      reason: reason.reason || "",
      why: reason.why || [],
      action: reason.action || [],
      stats: reason.stats || [],
      dismissed: !!reason.dismissed
    };
  }

  function renderPauseModal() {
    if (!dom.pauseModal) {
      return;
    }
    const context = state.pauseContext;
    const shouldShow = !!(context && state.racePaused && !state.raceFinished && !context.dismissed);
    dom.pauseModal.classList.toggle("hidden", !shouldShow);
    dom.pauseModal.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (!shouldShow) {
      return;
    }
    dom.pauseModalTitle.textContent = context.title;
    dom.pauseModalReason.textContent = context.reason;
    dom.pauseModalStats.innerHTML = context.stats.map((item) => `
      <article class="pause-modal-stat">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `).join("");
    dom.pauseModalWhy.innerHTML = context.why.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    dom.pauseModalAction.innerHTML = context.action.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  }

  function buildResultCharts(carId, baselineHistory, optimalAnalysis) {
    const subjectHistory = state.carHistories[carId] || [];
    const subjectCar = state.cars.find((car) => car.id === carId);
    const isPlayer = carId === raceConfig.playerCarId;
    const positionData = subjectHistory.map((item) => ({ x: item.lap, y: item.position }));
    const wearData = subjectHistory.map((item) => ({ x: item.lap, y: item.tyreWear }));
    const deltaData = subjectHistory.map((item) => {
      const baselineLap = baselineHistory.find((entry) => entry.lap === item.lap);
      return {
        x: item.lap,
        y: baselineLap ? item.totalRaceTime - baselineLap.totalRaceTime : 0
      };
    });
    const playerHistory = state.carHistories[raceConfig.playerCarId] || [];
    const gapToPlayerData = subjectHistory.map((item, index) => ({
      x: item.lap,
      y: item.totalRaceTime - (playerHistory[index] ? playerHistory[index].totalRaceTime : item.totalRaceTime)
    }));
    const worstWear = [...subjectHistory].sort((a, b) => b.tyreWear - a.tyreWear)[0];
    const biggestDelta = [...deltaData].sort((a, b) => Math.abs(b.y) - Math.abs(a.y))[0];
    const narrative = biggestDelta && worstWear
      ? `The charts show where the strategy moved. ${subjectCar.driver}'s tyre wear peaked at ${worstWear.tyreWear.toFixed(0)}% on Lap ${worstWear.lap}${isPlayer ? `, and the biggest swing against baseline was ${biggestDelta.y.toFixed(1)}s on Lap ${biggestDelta.x}` : ""}.`
      : "The charts show how pace, tyre wear and pit timing changed the race.";

    const charts = {
      positionChart: chartCard("Position By Lap", "Lower is better", lineChartSvg(positionData, {
        minY: 1,
        maxY: 20,
        invertY: true,
        stroke: "#1d8f7b",
        xLabel: "Lap",
        yLabel: "Pos"
      })),
      wearChart: chartCard("Tyre Wear By Lap", "Cliff risk over time", lineChartSvg(wearData, {
        minY: 0,
        maxY: 100,
        threshold: tyreCompounds[subjectCar.tyre].cliffThreshold,
        stroke: "#ff7b38",
        xLabel: "Lap",
        yLabel: "Wear %"
      })),
      stintChart: chartCard("Stint Timeline", "Stops and compound sequence", stintTimelineSvg(subjectHistory, subjectCar.completedStops)),
      narrative
    };
    if (isPlayer) {
      charts.deltaChart = chartCard("Time Vs Baseline", "Negative is better than baseline", lineChartSvg(deltaData, {
        minY: Math.min(-6, ...deltaData.map((d) => d.y)),
        maxY: Math.max(6, ...deltaData.map((d) => d.y)),
        zeroLine: true,
        stroke: "#204e7a",
        xLabel: "Lap",
        yLabel: "s"
      }));
      charts.optimalChart = chartCard("Pit Stop Timing Scan", "Best one-stop window versus your actual stop", pitWindowSvg(optimalAnalysis));
    } else {
      charts.deltaChart = chartCard("Gap To Player", "Negative means ahead of the player", lineChartSvg(gapToPlayerData, {
        minY: Math.min(-12, ...gapToPlayerData.map((d) => d.y)),
        maxY: Math.max(12, ...gapToPlayerData.map((d) => d.y)),
        zeroLine: true,
        stroke: "#6f42c1",
        xLabel: "Lap",
        yLabel: "s"
      }));
    }
    return charts;
  }

  function buildChartSubjects(player) {
    const rivals = state.cars
      .filter((car) => Math.abs(car.position - player.position) <= 2)
      .sort((a, b) => a.position - b.position);
    return rivals.map((car) => ({
      id: car.id,
      label: car.isPlayer ? `${state.teamName} (You)` : `${car.id} ${car.driver}`
    }));
  }

  function renderResultsCharts(result, carId) {
    const charts = buildResultCharts(carId, result.comparison.baselineHistory, result.optimalAnalysis);
    dom.resultsCharts.innerHTML = `
      <div class="results-chart-grid">
        ${charts.positionChart}
        ${charts.wearChart}
        ${charts.deltaChart}
        ${carId === raceConfig.playerCarId ? charts.optimalChart : charts.stintChart}
      </div>
      <p class="chart-narrative">${escapeHtml(charts.narrative)}</p>
    `;
  }

  function describeDecisionMiss(optimalAnalysis) {
    if (optimalAnalysis.actualStopLap === null) {
      return "You never took the stop, even though the one-stop scan shows a clear faster pit window.";
    }
    if (optimalAnalysis.actualStopLap > optimalAnalysis.bestLap + 1) {
      return "You stayed out too long. The tyres lost more time before the stop than the later pit timing recovered.";
    }
    if (optimalAnalysis.actualStopLap < optimalAnalysis.bestLap - 1) {
      return "You pitted too early. Fresh tyres were offset by giving away track position and serving the pit loss too soon.";
    }
    if (optimalAnalysis.actualCompound !== optimalAnalysis.bestCompound) {
      return `The timing was close, but the compound choice was weaker. ${tyreCompounds[optimalAnalysis.bestCompound].label} was the better one-stop tyre for this window.`;
    }
    return "Your stop was close to the best one-stop window, so the remaining loss likely came from traffic or race pace rather than the basic call.";
  }

  function buildStrategyComparison(player, baseline) {
    const comparisonCars = state.cars
      .filter((car) => !car.isPlayer && Math.abs(car.position - player.position) <= 2)
      .sort((a, b) => a.position - b.position);
    const rows = comparisonCars.map((car) => ({
      label: `${car.id} ${car.driver}`,
      finish: `P${car.position}`,
      gap: formatRaceDelta(car.totalRaceTime - player.totalRaceTime),
      firstStop: car.completedStops[0] ? `Lap ${car.completedStops[0].lap}` : "No stop",
      tyres: car.tyreHistory.map((key) => tyreCompounds[key].label).join(" -> ")
    }));
    rows.unshift({
      label: state.teamName,
      finish: `P${player.position}`,
      gap: "Reference",
      firstStop: player.completedStops[0] ? `Lap ${player.completedStops[0].lap}` : "No stop",
      tyres: player.tyreHistory.map((key) => tyreCompounds[key].label).join(" -> "),
      isPlayer: true
    });
    rows.push({
      label: "Baseline strategy",
      finish: `P${baseline.finalPosition}`,
      gap: formatRaceDelta(baseline.time - player.totalRaceTime),
      firstStop: baseline.completedStops[0] ? `Lap ${baseline.completedStops[0].lap}` : "No stop",
      tyres: baseline.tyreHistory.map((key) => tyreCompounds[key].label).join(" -> "),
      isBaseline: true
    });

    const ahead = comparisonCars.filter((car) => car.position < player.position)[0];
    const behind = comparisonCars.filter((car) => car.position > player.position)[0];
    const summary = [
      ahead ? `The next car ahead finished ${formatSeconds(player.totalRaceTime - ahead.totalRaceTime)} in front with a first stop on ${ahead.completedStops[0] ? `Lap ${ahead.completedStops[0].lap}` : "no stop"}.` : "You finished at the front of your local comparison group.",
      behind ? `The nearest car behind was ${formatSeconds(behind.totalRaceTime - player.totalRaceTime)} back.` : "No nearby finisher behind you in the comparison set.",
      `Against the baseline, you ${baseline.time < player.totalRaceTime ? `lost ${Math.abs(baseline.time - player.totalRaceTime).toFixed(1)}s` : `gained ${Math.abs(baseline.time - player.totalRaceTime).toFixed(1)}s`}.`
    ];

    return { rows, summary, baselineHistory: baseline.history };
  }

  function renderStrategyComparison(comparison) {
    return `
      <div class="comparison-block">
        <div class="comparison-summary">
          ${comparison.summary.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Finish</th>
              <th>Gap to you</th>
              <th>First stop</th>
              <th>Tyres used</th>
            </tr>
          </thead>
          <tbody>
            ${comparison.rows.map((row) => `
              <tr class="${row.isPlayer ? "comparison-player" : row.isBaseline ? "comparison-baseline" : ""}">
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(row.finish)}</td>
                <td>${escapeHtml(row.gap)}</td>
                <td>${escapeHtml(row.firstStop)}</td>
                <td>${escapeHtml(row.tyres)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function chartCard(title, caption, svg) {
    return `
      <article class="chart-card">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(caption)}</p>
        ${svg}
      </article>
    `;
  }

  function lineChartSvg(data, options) {
    const width = 420;
    const height = 190;
    const pad = { top: 12, right: 14, bottom: 28, left: 40 };
    const minX = Math.min(...data.map((d) => d.x));
    const maxX = Math.max(...data.map((d) => d.x));
    const minY = options.minY;
    const maxY = options.maxY;
    const usableW = width - pad.left - pad.right;
    const usableH = height - pad.top - pad.bottom;
    const scaleX = (x) => pad.left + ((x - minX) / Math.max(1, maxX - minX)) * usableW;
    const scaleY = (y) => {
      const ratio = (y - minY) / Math.max(1, maxY - minY);
      const plotted = options.invertY ? ratio : 1 - ratio;
      return pad.top + plotted * usableH;
    };
    const points = data.map((d) => `${scaleX(d.x).toFixed(1)},${scaleY(d.y).toFixed(1)}`).join(" ");
    const thresholdLine = options.threshold !== undefined
      ? `<line x1="${pad.left}" y1="${scaleY(options.threshold).toFixed(1)}" x2="${width - pad.right}" y2="${scaleY(options.threshold).toFixed(1)}" stroke="#ffcd57" stroke-dasharray="4 4" />`
      : "";
    const zeroLine = options.zeroLine
      ? `<line x1="${pad.left}" y1="${scaleY(0).toFixed(1)}" x2="${width - pad.right}" y2="${scaleY(0).toFixed(1)}" stroke="#94a3b8" stroke-dasharray="4 4" />`
      : "";
    return `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(options.yLabel)} by ${escapeHtml(options.xLabel)}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
        <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="#c7d2e1" />
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="#c7d2e1" />
        ${thresholdLine}
        ${zeroLine}
        <polyline fill="none" stroke="${options.stroke}" stroke-width="3" points="${points}" />
        <text x="${pad.left}" y="${height - 8}" font-size="11" fill="#60738f">Lap ${minX}</text>
        <text x="${width - pad.right - 24}" y="${height - 8}" font-size="11" fill="#60738f">Lap ${maxX}</text>
        <text x="4" y="${pad.top + 8}" font-size="11" fill="#60738f">${maxY.toFixed(0)}</text>
        <text x="4" y="${height - pad.bottom + 4}" font-size="11" fill="#60738f">${minY.toFixed(0)}</text>
      </svg>
    `;
  }

  function pitWindowSvg(optimalAnalysis) {
    const width = 420;
    const height = 190;
    const pad = { top: 12, right: 14, bottom: 28, left: 40 };
    const minX = optimalAnalysis.scan[0].lap;
    const maxX = optimalAnalysis.scan[optimalAnalysis.scan.length - 1].lap;
    const deltas = optimalAnalysis.scan.map((entry) => entry.time - optimalAnalysis.bestTime);
    const minY = 0;
    const maxY = Math.max(3, ...deltas);
    const usableW = width - pad.left - pad.right;
    const usableH = height - pad.top - pad.bottom;
    const scaleX = (x) => pad.left + ((x - minX) / Math.max(1, maxX - minX)) * usableW;
    const scaleY = (y) => pad.top + (1 - ((y - minY) / Math.max(1, maxY - minY))) * usableH;
    const points = optimalAnalysis.scan.map((entry) => `${scaleX(entry.lap).toFixed(1)},${scaleY(entry.time - optimalAnalysis.bestTime).toFixed(1)}`).join(" ");
    const bestX = scaleX(optimalAnalysis.bestLap).toFixed(1);
    const actualMarker = optimalAnalysis.actualStopLap !== null
      ? `<line x1="${scaleX(optimalAnalysis.actualStopLap).toFixed(1)}" y1="${pad.top}" x2="${scaleX(optimalAnalysis.actualStopLap).toFixed(1)}" y2="${height - pad.bottom}" stroke="#ff7b38" stroke-dasharray="5 4" />
         <text x="${scaleX(optimalAnalysis.actualStopLap).toFixed(1)}" y="${pad.top + 10}" text-anchor="middle" font-size="10" fill="#ff7b38">Actual</text>`
      : "";
    return `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Pit stop timing scan">
        <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
        <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="#c7d2e1" />
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="#c7d2e1" />
        <polyline fill="none" stroke="#1d8f7b" stroke-width="3" points="${points}" />
        <line x1="${bestX}" y1="${pad.top}" x2="${bestX}" y2="${height - pad.bottom}" stroke="#1d8f7b" stroke-dasharray="5 4" />
        <text x="${bestX}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#1d8f7b">Best Lap ${optimalAnalysis.bestLap}</text>
        ${actualMarker}
        <text x="4" y="${pad.top + 8}" font-size="11" fill="#60738f">+${maxY.toFixed(1)}s</text>
        <text x="4" y="${height - pad.bottom + 4}" font-size="11" fill="#60738f">Best</text>
      </svg>
    `;
  }

  function stintTimelineSvg(history, stops) {
    const width = 420;
    const height = 84;
    const pad = 12;
    const minLap = history[0].lap;
    const maxLap = history[history.length - 1].lap;
    const usableW = width - pad * 2;
    const scaleX = (lap) => pad + ((lap - minLap) / Math.max(1, maxLap - minLap)) * usableW;
    const blocks = [];
    let startIndex = 0;
    for (let i = 1; i <= history.length; i += 1) {
      if (i === history.length || history[i].tyre !== history[startIndex].tyre) {
        const startLap = history[startIndex].lap;
        const endLap = history[i - 1].lap;
        const x = scaleX(startLap);
        const w = Math.max(6, scaleX(endLap) - x + 8);
        const tyre = history[startIndex].tyre;
        const fill = tyre === "soft" ? "#ff8c69" : tyre === "medium" ? "#f4c95d" : "#69bff8";
        blocks.push(`<rect x="${x.toFixed(1)}" y="24" width="${w.toFixed(1)}" height="20" fill="${fill}" />`);
        blocks.push(`<text x="${(x + 4).toFixed(1)}" y="38" font-size="11" fill="#112033">${tyreCompounds[tyre].label}</text>`);
        startIndex = i;
      }
    }
    const stopMarkers = stops.map((stop) => {
      const x = scaleX(stop.lap).toFixed(1);
      return `<line x1="${x}" y1="18" x2="${x}" y2="52" stroke="#112033" stroke-width="2" /><text x="${x}" y="14" text-anchor="middle" font-size="10" fill="#60738f">Lap ${stop.lap}</text>`;
    }).join("");
    return `
      <svg class="chart-svg stint-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Stint timeline">
        <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
        ${blocks.join("")}
        ${stopMarkers}
      </svg>
    `;
  }

  function buildRaceTableContext(car, player, isLocalBattle) {
    if (car.position === player.position) {
      return `Gap to leader ${formatSeconds(car.gapToLeader)}<br><small>Your car · ${escapeHtml(car.strategyType)}</small>`;
    }
    const delta = car.totalRaceTime - player.totalRaceTime;
    if (isLocalBattle) {
      const relative = delta < 0
        ? `${formatSeconds(Math.abs(delta))} ahead of you`
        : `${formatSeconds(delta)} behind you`;
      return `${relative}<br><small>${escapeHtml(car.strategyType)} · ${escapeHtml(car.notes)}</small>`;
    }
    return `${formatSeconds(car.gapToLeader)} to leader<br><small>${escapeHtml(car.strategyType)}</small>`;
  }

  function renderPlayerCommandCard(player, projection) {
    const tyre = tyreCompounds[player.tyre];
    const raceStatus = getRaceStatusLabel();
    const riskLine = player.tyreWear >= tyre.cliffThreshold
      ? "Tyre cliff active"
      : player.gapToCarAhead !== null && player.gapToCarAhead < raceConfig.dirtyAirGap
        ? "Dirty air is costing time"
        : projection.trafficRisk
          ? "Pit now risks rejoining in traffic"
          : "Track is relatively stable";
    const nextCall = state.decision.action === "pit"
      ? `Current plan: pit Lap ${getScheduledPitLap(state.decision.timingOffset)} for ${tyreCompounds[state.decision.compound].label}.`
      : "Current plan: stay out and defend track position.";

    dom.playerCommandCard.innerHTML = `
      <span class="eyebrow">Your strategy position</span>
      <div class="support-line"><strong>Status:</strong> ${escapeHtml(raceStatus)}</div>
      <div class="major-callout">P${player.position}</div>
      <div class="support-line">Ahead ${escapeHtml(formatSeconds(player.gapToCarAhead))} · Behind ${escapeHtml(formatSeconds(getGapBehind(player)))} · Exit if pit P${projection.projectedPosition}</div>
      <div class="support-line">${escapeHtml(nextCall)}</div>
      <div class="risk-line">${escapeHtml(riskLine)}</div>
    `;
  }

  function renderRaceMap(player) {
    const width = 980;
    const height = 58;
    const left = 44;
    const right = width - 28;
    const laneY = 30;
    const leaderMode = state.raceMapMode === "leader";
    const gaps = leaderMode
      ? state.cars.map((car) => car.gapToLeader)
      : state.cars.map((car) => car.totalRaceTime - player.totalRaceTime);
    const maxAbsGap = leaderMode ? Math.max(...gaps, 1) : Math.max(...gaps.map((gap) => Math.abs(gap)), 1);
    const scaleX = (gap) => {
      if (leaderMode) {
        return left + (gap / maxAbsGap) * (right - left);
      }
      return (left + right) / 2 + (gap / maxAbsGap) * ((right - left) / 2);
    };
    const pitMarkers = [];
    const hotspots = [];
    const markers = state.cars.map((car, index) => {
      const gap = leaderMode ? car.gapToLeader : car.totalRaceTime - player.totalRaceTime;
      const xNum = scaleX(gap);
      const x = xNum.toFixed(1);
      const y = index % 2 === 0 ? 18 : 42;
      const isPlayer = car.isPlayer;
      const radius = isPlayer ? 6.2 : 4.2;
      const fill = car.tyre === "soft" ? "#ff8c69" : car.tyre === "medium" ? "#f4c95d" : "#69bff8";
      const stroke = isPlayer ? "#112033" : "none";
      const label = isPlayer || Math.abs(car.position - player.position) <= 1 || car.position <= 3
        ? `<text x="${x}" y="${y === 18 ? 11 : 55}" text-anchor="middle" font-size="9" fill="#112033">${escapeHtml(car.id)}</text>`
        : "";
      if (car.completedStops.length > 0) {
        pitMarkers.push(`<polygon points="${xNum},${laneY - 8} ${xNum - 4},${laneY - 13} ${xNum + 4},${laneY - 13}" fill="#112033" />`);
      }
      hotspots.push(renderRaceMapHotspot(car, player, xNum, laneY, width, height, leaderMode));
      return `
        <line x1="${x}" y1="${laneY}" x2="${x}" y2="${y}" stroke="#d6deea" />
        <circle cx="${x}" cy="${laneY}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
        ${label}
      `;
    }).join("");

    dom.raceMap.innerHTML = `
      <svg class="race-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${leaderMode ? "Leader-relative" : "Player-relative"} race gaps">
        <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
        <line x1="${left}" y1="${laneY}" x2="${right}" y2="${laneY}" stroke="#c7d2e1" stroke-width="2" />
        ${leaderMode
          ? `<text x="${left}" y="12" font-size="10" fill="#60738f">Leader</text>
             <text x="${right - 54}" y="12" font-size="10" fill="#60738f">Backmarkers</text>`
          : `<text x="${left}" y="12" font-size="10" fill="#60738f">Ahead</text>
             <text x="${(left + right) / 2}" y="12" text-anchor="middle" font-size="10" fill="#60738f">You</text>
             <text x="${right - 26}" y="12" font-size="10" fill="#60738f">Behind</text>
             <line x1="${(left + right) / 2}" y1="${laneY - 10}" x2="${(left + right) / 2}" y2="${laneY + 10}" stroke="#112033" stroke-dasharray="3 3" />`}
        ${pitMarkers.join("")}
        ${markers}
      </svg>
      <div class="race-map-hotspots">
        ${hotspots.join("")}
      </div>
    `;
  }

  function renderRaceMapHotspot(car, player, xNum, yNum, width, height, leaderMode) {
    const latestLapTime = car.pendingLapTime || car.paceDeltaLog[car.paceDeltaLog.length - 1] || calculateLapTime(car);
    const playerLapTime = player.pendingLapTime || player.paceDeltaLog[player.paceDeltaLog.length - 1] || calculateLapTime(player);
    const relativeGap = leaderMode ? car.gapToLeader : car.totalRaceTime - player.totalRaceTime;
    const paceDelta = latestLapTime - playerLapTime;
    const speedDiff = -paceDelta;
    const lapsToCatch = estimateLapsToCatch(relativeGap, speedDiff, car.isPlayer);
    const gapLabel = leaderMode
      ? `Gap to leader: ${formatSeconds(car.gapToLeader)}`
      : car.isPlayer
        ? "Reference car"
        : relativeGap < 0
          ? `${formatSeconds(Math.abs(relativeGap))} ahead of you`
          : `${formatSeconds(relativeGap)} behind you`;
    const leftPercent = (xNum / width) * 100;
    const topPercent = (yNum / height) * 100;
    return `
      <div class="race-map-hotspot" style="left:${leftPercent.toFixed(2)}%; top:${topPercent.toFixed(2)}%;">
        <button class="race-map-hitbox" type="button" aria-label="${escapeHtml(car.id)} ${escapeHtml(car.driver)}"></button>
        <div class="race-map-toast">
          <strong>${escapeHtml(car.id)} · P${car.position}</strong>
          <span>${escapeHtml(car.driver)} · ${escapeHtml(tyreCompounds[car.tyre].label)} ${car.tyreWear.toFixed(0)}%</span>
          <span>Lap time: ${latestLapTime.toFixed(2)}s</span>
          <span>${escapeHtml(gapLabel)}</span>
          <span>Speed diff: ${formatSignedSeconds(speedDiff)} / lap</span>
          <span>Laps to catch: ${escapeHtml(lapsToCatch)}</span>
        </div>
      </div>
    `;
  }

  function estimateLapsToCatch(gapSeconds, speedDiffPerLap, isReferenceCar) {
    if (isReferenceCar || Math.abs(gapSeconds) < 0.05) {
      return "0.0";
    }
    if (gapSeconds < 0) {
      return speedDiffPerLap < -0.05 ? `${(Math.abs(gapSeconds) / Math.abs(speedDiffPerLap)).toFixed(1)}` : "Holding";
    }
    if (speedDiffPerLap <= 0.05) {
      return "Not closing";
    }
    return `${(gapSeconds / speedDiffPerLap).toFixed(1)}`;
  }

  function emergencyCompound(currentTyre) {
    if (currentTyre === "soft") {
      return "hard";
    }
    return "medium";
  }

  function formatSeconds(value) {
    if (value === null || value === undefined) {
      return "-";
    }
    return `${Number(value).toFixed(1)}s`;
  }

  function formatSignedSeconds(value) {
    if (value === null || value === undefined) {
      return "-";
    }
    const numeric = Number(value);
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}s`;
  }

  function getRaceStatusLabel() {
    if (state.raceFinished) {
      return "Race complete";
    }
    if (state.safetyCar.active) {
      return state.racePaused
        ? `Race paused: safety car on Lap ${state.currentLap + 1}`
        : `Race running under safety car on Lap ${state.currentLap + 1}`;
    }
    if (!state.raceStarted) {
      return "Race paused: choose and commit a strategy";
    }
    if (state.racePaused) {
      return `Race paused on Lap ${state.currentSector > 0 ? state.currentLap + 1 : state.currentLap}`;
    }
    return `Race running on Lap ${state.currentLap + 1}`;
  }

  function renderPositionDeltaBadge(car) {
    if (state.positionDeltaSector <= 0 || car.lapStartPosition === undefined) {
      return "";
    }
    if (state.positionDeltaSector > 3) {
      return "";
    }
    const delta = car.lapStartPosition - car.position;
    if (delta > 0) {
      return ` <span class="position-delta gain" title="Gained ${delta} place${delta === 1 ? "" : "s"} this lap so far">▲${delta}</span>`;
    }
    if (delta < 0) {
      return ` <span class="position-delta loss" title="Lost ${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"} this lap so far">▼${Math.abs(delta)}</span>`;
    }
    return ` <span class="position-delta flat" title="No position change this lap so far">•</span>`;
  }

  function clearTimer() {
    if (state.timerId) {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
