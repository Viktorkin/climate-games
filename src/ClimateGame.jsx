import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Climate Science Constants (IPCC AR6-aligned) ────────────────────────────
const BASELINE = {
  year: 2026,
  co2: 428,
  tempAnomaly: 1.55,
  seaLevel: 0,
  arcticIce: 4.5,
  biodiversity: 100,
  globalEmissions: 37.4,
};

// ─── Dynamic context generator ───────────────────────────────────────────────
// Takes the decision index + full history and returns a context paragraph that
// references what the player actually chose before.
function buildContext(decisionIndex, history, climate) {
  const base = [
    // Decision 1 — no history yet, always static
    () => `It is 2026. Global CO₂ concentration has reached 428 ppm — higher than at any point in the last 3 million years. The energy sector accounts for 73% of all greenhouse gas emissions. As a newly appointed UN Climate Coordinator, your first briefing lands on your desk.`,

    // Decision 2 — references energy choice
    () => {
      const e = history[0];
      if (!e) return `A decade has passed. Deforestation continues at 10 million hectares per year. Land use change accounts for 11% of global emissions. The Amazon's eastern sectors have crossed a regional tipping point.`;
      const outcomes = {
        aggressive_renewables: `A decade has passed. The renewable mandate you championed has reshaped power grids across 40 nations — but the transition has been turbulent. Grid instability, political backlash, and supply chain bottlenecks slowed deployment. CO₂ now sits at ${climate.co2.toFixed(0)} ppm. The energy sector is changing. But land is burning.`,
        gas_bridge: `A decade has passed. The gas bridge you endorsed kept the lights on and the politics manageable — but atmospheric methane has spiked, and the infrastructure lock-in is becoming visible. CO₂ sits at ${climate.co2.toFixed(0)} ppm, higher than hoped. The fossil fuel lobby is emboldened. And the forests are still falling.`,
        nuclear_expansion: `A decade has passed. The nuclear renaissance you championed is underway in 12 nations, but construction timelines have slipped and public opposition has stalled projects in 6 others. CO₂ sits at ${climate.co2.toFixed(0)} ppm. The grid is cleaner where it worked. But land use emissions have gone largely unaddressed.`,
        status_quo: `A decade has passed. Markets moved slowly. Voluntary pledges underdelivered by 28%. CO₂ now sits at ${climate.co2.toFixed(0)} ppm — tracking above the worst-case scenario from your first briefing. The energy sector is your legacy so far. Now the forests demand your attention.`,
      };
      return outcomes[e.choiceId] || outcomes.status_quo;
    },

    // Decision 3 — references energy + land choices
    () => {
      const e = history[0];
      const l = history[1];
      const tempStr = `+${climate.tempAnomaly.toFixed(2)}°C above pre-industrial`;
      let opening = `Two decades in. The world is ${tempStr}. `;
      if (l?.choiceId === "halt_deforestation") opening += `The zero-deforestation treaty you forged is holding — forest loss dropped 60% in signatory nations. But a new threat has emerged from below: `;
      else if (l?.choiceId === "reforestation") opening += `The trillion-tree program has planted 180 billion trees, though scientists warn half are in the wrong climate zones. Meanwhile: `;
      else if (l?.choiceId === "regen_agriculture") opening += `Regenerative agriculture is spreading, quietly rebuilding soil carbon across three continents. But the atmosphere doesn't wait for quiet progress: `;
      else opening += `Forests continued to fall while other priorities dominated. Now a compounding threat arrives: `;
      return opening + `methane concentrations have reached 1,950 ppb — more than double pre-industrial levels. Satellite data reveals massive unreported leaks from oil & gas infrastructure and thawing permafrost across Siberia and Alaska.`;
    },

    // Decision 4 — references all three prior choices
    () => {
      const e = history[0];
      const l = history[1];
      const m = history[2];
      const tempStr = `+${climate.tempAnomaly.toFixed(2)}°C`;
      let para = `Three decades of decisions. The world is now ${tempStr} above pre-industrial levels. `;
      if (climate.seaLevel > 15) para += `Sea levels have risen ${climate.seaLevel.toFixed(0)} cm — coastal flooding that was once a 1-in-50-year event now comes annually to Miami, Jakarta, and Dhaka. `;
      else para += `Sea level rise of ${climate.seaLevel.toFixed(0)} cm has been felt at the margins — low-lying islands, delta cities, storm-surge zones. `;
      if (m?.choiceId === "co2_only") para += `The methane crisis you deferred has compounded the warming trajectory significantly. `;
      else if (m?.choiceId === "fossil_methane") para += `The methane capture mandate you enforced bought measurable time — near-term warming is slower than models feared. `;
      if (e?.choiceId === "status_quo" && l?.choiceId === "beccs") para += `Early decisions that prioritized economic stability over aggressive action are now visible in the data. `;
      para += `The question is no longer only mitigation. It is survival.`;
      return para;
    },

    // Decision 5 — references all four prior choices, stakes maximized
    () => {
      const e = history[0];
      const m = history[2];
      const a = history[3];
      const tempStr = `+${climate.tempAnomaly.toFixed(2)}°C`;
      let para = `It is 2066. Four decades of choices have brought the world to ${tempStr}. `;
      if (a?.choiceId === "sai") para += `The stratospheric aerosol program you authorized has masked warming — but CO₂ keeps accumulating, and the termination risk grows with every year of dependency. `;
      else if (a?.choiceId === "managed_retreat") para += `The managed retreat program you funded has relocated 40 million people — painful, but those communities survived. Others did not. `;
      else if (a?.choiceId === "climate_finance") para += `The climate finance you delivered has built resilience in the Global South — but adaptation has limits. Mitigation still determines the final temperature. `;
      if (e?.choiceId === "aggressive_renewables" && m?.choiceId === "fossil_methane") para += `Your early aggressive action on energy and methane is the reason this window still exists. `;
      else if (e?.choiceId === "status_quo") para += `The early years of market-led inaction left a carbon debt that every subsequent coordinator has been paying down. `;
      para += `Scientists confirm this is humanity's final clear window before irreversible tipping points — West Antarctic Ice Sheet destabilization, full Amazon dieback, Atlantic circulation collapse — become locked in. History will be defined by what happens next.`;
      return para;
    },
  ];

  return base[decisionIndex] ? base[decisionIndex]() : "";
}

// ─── Choice unlock system ─────────────────────────────────────────────────────
// Returns extra choices unlocked by prior decisions, keyed by decision id
function getUnlockedChoices(decisionId, history) {
  const choiceIds = history.map(h => h.choiceId);

  if (decisionId === "land_use" && choiceIds.includes("aggressive_renewables")) {
    return [{
      id: "green_finance_forests",
      label: "⚡ Leverage renewable energy revenues to fund forest bonds",
      detail: "Use revenues from your renewable energy agreements to back $500B in sovereign forest protection bonds — tying clean energy success directly to land use.",
      science: "This approach mirrors Costa Rica's PES (Payments for Ecosystem Services) program, which reduced deforestation 75% over 20 years by making forests economically competitive with cleared land. Scaling this via energy revenues is a documented policy pathway (Nature Finance, 2023).",
      unlocked: true,
      effects: { co2Delta: -5.5, tempDelta: -0.08, seaDelta: -0.4, iceDelta: 0.06, bioDelta: 10, emisDelta: -5.0 }
    }];
  }

  if (decisionId === "methane" && choiceIds.includes("halt_deforestation")) {
    return [{
      id: "forest_methane_combined",
      label: "🌿 Combine forest protection with methane monitoring network",
      detail: "Build on your deforestation treaty infrastructure to deploy a global methane monitoring network — using forest rangers and indigenous communities as ground-truth sensors alongside satellites.",
      science: "Indigenous-managed territories have 50% lower deforestation rates and are now being studied as methane monitoring anchors. Combined land-atmosphere monitoring reduces measurement uncertainty by ~40% (Nature Climate Change, 2022).",
      unlocked: true,
      effects: { co2Delta: -3.5, tempDelta: -0.09, seaDelta: -0.25, iceDelta: 0.1, bioDelta: 4, emisDelta: -4.5 }
    }];
  }

  if (decisionId === "adaptation" && choiceIds.includes("fossil_methane") && choiceIds.includes("aggressive_renewables")) {
    return [{
      id: "clean_energy_adaptation",
      label: "⚡🌊 Deploy clean energy microgrids as climate adaptation infrastructure",
      detail: "Your early energy and methane wins created political capital and technology. Now deploy resilient clean energy microgrids in the world's most climate-vulnerable communities — combining adaptation with continued decarbonization.",
      science: "Resilient microgrids in vulnerable regions serve dual purposes: cutting emissions and providing disaster-proof power during climate events. Post-Hurricane Maria, Puerto Rico's microgrid communities recovered 3x faster (Rocky Mountain Institute, 2022).",
      unlocked: true,
      effects: { co2Delta: -2.0, tempDelta: -0.04, seaDelta: -0.2, iceDelta: 0.05, bioDelta: 3, emisDelta: -3.0 }
    }];
  }

  if (decisionId === "final_push" && choiceIds.includes("binding_treaty") === false && choiceIds.includes("status_quo")) {
    return [{
      id: "emergency_protocol",
      label: "🚨 Invoke UN Climate Emergency Protocol",
      detail: "After decades of inadequate voluntary action, invoke an emergency UN framework that bypasses normal treaty ratification — a last-resort legal mechanism that has never been used.",
      science: "International law scholars have outlined pathways for emergency climate governance under existing UN Charter provisions. The legal basis is contested but the scientific necessity — given remaining carbon budgets — is not (Columbia Law School Climate Change Initiative, 2023).",
      unlocked: true,
      effects: { co2Delta: -10, tempDelta: -0.11, seaDelta: -0.55, iceDelta: 0.2, bioDelta: 5, emisDelta: -7.0 }
    }];
  }

  return [];
}

const DECISIONS = [
  {
    id: "energy_transition",
    decade: 1,
    range: "2026–2036",
    title: "The Energy Crossroads",
    question: "How do you prioritize the global energy transition?",
    choices: [
      {
        id: "aggressive_renewables",
        label: "Mandate accelerated renewables",
        detail: "Push for 80% renewable electricity by 2036 via binding international agreements. High political cost, major grid investment required.",
        science: "IEA Net Zero 2050 pathway requires 1,000 GW of solar/wind added annually. Feasible but demands clean energy investment scale to $4T/year by 2030 — nearly double today's $2T (IEA, 2024).",
        effects: { co2Delta: -3.5, tempDelta: -0.08, seaDelta: -0.4, iceDelta: 0.1, bioDelta: 2, emisDelta: -8.0 }
      },
      {
        id: "gas_bridge",
        label: "Phased transition with gas bridge",
        detail: "Allow natural gas as a 'bridge fuel' while scaling renewables over 20 years. More politically viable.",
        science: "Natural gas emits 50% less CO₂ than coal per kWh, but methane leakage (80x more potent GHG over 20 yrs) often negates the benefit. IPCC warns bridge fuel strategies risk locking in infrastructure past safe carbon budgets.",
        effects: { co2Delta: 8, tempDelta: 0.02, seaDelta: 0.8, iceDelta: -0.05, bioDelta: -1, emisDelta: -2.0 }
      },
      {
        id: "nuclear_expansion",
        label: "Global nuclear renaissance",
        detail: "Fast-track new-generation nuclear (SMRs) alongside renewables. Requires massive public investment and overcoming political resistance.",
        science: "Nuclear produces 12g CO₂/kWh lifecycle — comparable to wind. France's 70% nuclear grid has one of Europe's lowest per-capita electricity emissions. SMRs are unproven at scale.",
        effects: { co2Delta: -1.5, tempDelta: -0.05, seaDelta: -0.2, iceDelta: 0.07, bioDelta: 1, emisDelta: -5.0 }
      },
      {
        id: "status_quo",
        label: "Let market forces lead",
        detail: "Avoid binding targets. Rely on carbon pricing signals and voluntary commitments.",
        science: "Current NDCs under Paris Agreement put world on track for 2.5–2.9°C by 2100 (UNEP Emissions Gap Report 2024). Voluntary pledges historically underperform by 20–30%.",
        effects: { co2Delta: 18, tempDelta: 0.06, seaDelta: 2.5, iceDelta: -0.2, bioDelta: -4, emisDelta: 2.5 }
      }
    ]
  },
  {
    id: "land_use",
    decade: 2,
    range: "2036–2046",
    title: "The Forest Covenant",
    question: "How do you address global land use and forest protection?",
    choices: [
      {
        id: "halt_deforestation",
        label: "Global zero-deforestation treaty",
        detail: "Binding international treaty with trade sanctions for non-compliance. Directly fund forest-dependent communities.",
        science: "Tropical forests store ~250 billion tons of carbon. Protecting them is equivalent to halting all global fossil fuel emissions for 25+ years (Nature, 2023). The Amazon alone stores ~150–200 Gt C.",
        effects: { co2Delta: -4.0, tempDelta: -0.06, seaDelta: -0.3, iceDelta: 0.05, bioDelta: 8, emisDelta: -4.0 }
      },
      {
        id: "reforestation",
        label: "Trillion tree restoration program",
        detail: "Prioritize reforestation of degraded lands using native species. Voluntary with financial incentives.",
        science: "Restoring 0.9 billion hectares of forest could capture ~205 Gt CO₂ over decades (Science, 2019) — but takes 50–100 years to fully mature. Wrong species in wrong climate zones can reduce surface albedo and backfire.",
        effects: { co2Delta: -1.5, tempDelta: -0.03, seaDelta: -0.1, iceDelta: 0.03, bioDelta: 5, emisDelta: -1.5 }
      },
      {
        id: "regen_agriculture",
        label: "Regenerative agriculture mandate",
        detail: "Shift global agriculture toward no-till, cover crops, and agroforestry. Reduces land clearing pressure.",
        science: "Soil holds ~2,500 Gt of carbon globally — more than the atmosphere and all vegetation combined. Regenerative practices could sequester 1.85 Gt CO₂/year, while improving food security.",
        effects: { co2Delta: -1.0, tempDelta: -0.02, seaDelta: -0.05, iceDelta: 0.01, bioDelta: 4, emisDelta: -2.0 }
      },
      {
        id: "beccs",
        label: "Expand bioenergy croplands (BECCS)",
        detail: "Convert former forest land to bioenergy crops to offset emissions from other sectors via carbon capture.",
        science: "BECCS land demands could require 0.4–1.2 billion hectares — competing directly with food production and natural ecosystems. Called 'a dangerous distraction' by prominent ecologists due to land-use conflicts and biodiversity loss.",
        effects: { co2Delta: 2, tempDelta: 0.01, seaDelta: 0.5, iceDelta: -0.05, bioDelta: -7, emisDelta: -1.0 }
      }
    ]
  },
  {
    id: "methane",
    decade: 3,
    range: "2046–2056",
    title: "The Invisible Threat",
    question: "How do you tackle the methane crisis?",
    choices: [
      {
        id: "fossil_methane",
        label: "Mandate fossil fuel methane capture",
        detail: "Require 75% reduction in oil & gas methane leaks within 5 years. Technology exists; enforcement is the problem.",
        science: "Oil & gas methane emissions could be cut 75% with existing technology, often at zero net cost due to captured gas value (IEA, 2023). The IEA notes this would have a greater near-term climate impact than immediately taking all cars and trucks in the world off the road.",
        effects: { co2Delta: -2.5, tempDelta: -0.07, seaDelta: -0.2, iceDelta: 0.08, bioDelta: 2, emisDelta: -3.5 }
      },
      {
        id: "ag_methane",
        label: "Transform livestock and rice agriculture",
        detail: "Fund low-methane feed additives, wetland rice management reform, and dietary shift incentives globally.",
        science: "Livestock accounts for 14.5% of global GHG emissions (FAO). Seaweed feed additives (Asparagopsis) can reduce cattle enteric methane by up to 80% in controlled trials. Broad adoption is the challenge.",
        effects: { co2Delta: -1.5, tempDelta: -0.04, seaDelta: -0.15, iceDelta: 0.04, bioDelta: 1, emisDelta: -2.0 }
      },
      {
        id: "permafrost",
        label: "Emergency permafrost monitoring and intervention",
        detail: "Deploy global permafrost monitoring network and pilot reflective surface interventions in Arctic regions.",
        science: "Permafrost holds ~1.5 trillion tons of organic carbon — nearly twice what is currently in the atmosphere. Even a 10% release would add ~0.3°C of warming regardless of other mitigation efforts (Nature Geoscience, 2022).",
        effects: { co2Delta: -0.5, tempDelta: -0.03, seaDelta: -0.1, iceDelta: 0.12, bioDelta: 1, emisDelta: -0.5 }
      },
      {
        id: "co2_only",
        label: "Focus all resources on CO₂ only",
        detail: "Argue that CO₂ is the long-term climate driver. Defer methane action to a second negotiation phase.",
        science: "Reducing methane is the fastest lever to slow near-term warming. Ignoring it foregoes ~0.3°C of avoided warming by 2050 (CCAC, 2021). CO₂ and methane must be addressed in parallel to stay below 1.5–2°C.",
        effects: { co2Delta: -1.0, tempDelta: 0.06, seaDelta: 1.0, iceDelta: -0.18, bioDelta: -2, emisDelta: 0.5 }
      }
    ]
  },
  {
    id: "adaptation",
    decade: 4,
    range: "2056–2066",
    title: "When the Waters Rise",
    question: "How do you lead global climate adaptation?",
    choices: [
      {
        id: "managed_retreat",
        label: "Fund managed retreat and relocation",
        detail: "Finance the planned relocation of the world's most at-risk coastal and climate-vulnerable communities before crisis forces unmanaged displacement.",
        science: "Proactive relocation is 4–10x cheaper than reactive disaster response (World Bank, 2021). Tuvalu has already begun national relocation to Australia. Managed retreat is politically painful but scientifically necessary.",
        effects: { co2Delta: 0, tempDelta: 0, seaDelta: 0, iceDelta: 0, bioDelta: 1, emisDelta: 0 }
      },
      {
        id: "seawalls",
        label: "Global coastal defense infrastructure",
        detail: "Invest $1 trillion in seawalls, surge barriers, and urban flood defenses for the world's most populated coastal zones.",
        science: "The Netherlands Delta Works protect 10 million people at ~$5B/year in maintenance. However, hard infrastructure can accelerate beach erosion, disrupt coastal ecosystems, and create false security against increasingly extreme storm surges.",
        effects: { co2Delta: 2, tempDelta: 0, seaDelta: 0, iceDelta: 0, bioDelta: -3, emisDelta: 0.5 }
      },
      {
        id: "climate_finance",
        label: "Deliver $500B/year climate finance for Global South",
        detail: "Fulfill and dramatically expand climate finance commitments from wealthy nations to the developing nations bearing the heaviest burden.",
        science: "African nations contribute under 4% of global cumulative emissions but face 50% higher economic losses from climate impacts per capita than the global average (IPCC AR6, 2022). Finance is a justice and stability imperative.",
        effects: { co2Delta: -1.0, tempDelta: -0.02, seaDelta: -0.1, iceDelta: 0.01, bioDelta: 3, emisDelta: -2.0 }
      },
      {
        id: "sai",
        label: "Authorize stratospheric aerosol injection",
        detail: "Deploy solar geoengineering — injecting reflective sulfate particles into the stratosphere — to buy time while emissions are reduced.",
        science: "SAI could reduce global mean temperatures by 1–2°C relatively rapidly. But termination shock — stopping suddenly — could cause catastrophic rebound warming. SAI also alters monsoon patterns, threatening food security for 2+ billion people. No international governance framework exists.",
        effects: { co2Delta: 0, tempDelta: -0.12, seaDelta: -0.4, iceDelta: 0.15, bioDelta: -5, emisDelta: 0 }
      }
    ]
  },
  {
    id: "final_push",
    decade: 5,
    range: "2066–2076",
    title: "The Last Window",
    question: "What is your final legacy decision?",
    choices: [
      {
        id: "dac",
        label: "Deploy direct air carbon capture at scale",
        detail: "Mobilize a global Manhattan Project for mechanical direct air capture — actively removing CO₂ already accumulated in the atmosphere.",
        science: "Current DAC costs ~$300–1,000/ton CO₂ (2024). Climeworks' Mammoth facility captures 36,000 tons/year at nameplate capacity. We need gigatons. Massive cost reduction is achievable but demands unprecedented industrial mobilization.",
        effects: { co2Delta: -12, tempDelta: -0.10, seaDelta: -0.6, iceDelta: 0.2, bioDelta: 3, emisDelta: -5.0 }
      },
      {
        id: "degrowth",
        label: "Champion post-growth economic models",
        detail: "Lead a global transition away from GDP-growth as the primary measure of prosperity toward wellbeing economics and radical efficiency.",
        science: "High-income nations could cut emissions 40–70% through demand-side measures alone — dietary shifts, reduced aviation, smaller homes — with minimal wellbeing loss (IPCC AR6, Chapter 5).",
        effects: { co2Delta: -7, tempDelta: -0.07, seaDelta: -0.4, iceDelta: 0.12, bioDelta: 5, emisDelta: -8.0 }
      },
      {
        id: "fusion",
        label: "Bet on breakthrough clean technology",
        detail: "Massively fund fusion energy, advanced geothermal, green hydrogen, and next-generation nuclear as the ultimate long-term solution.",
        science: "Fusion has been '30 years away' for 70 years, but NIF achieved ignition in December 2022. Advanced geothermal is commercially closer. High-risk, high-reward — breakthroughs cannot be scheduled.",
        effects: { co2Delta: -4, tempDelta: -0.04, seaDelta: -0.2, iceDelta: 0.08, bioDelta: 1, emisDelta: -4.0 }
      },
      {
        id: "binding_treaty",
        label: "Forge a binding global climate constitution",
        detail: "Use your platform to establish a legally binding, enforcement-backed international climate framework that cannot be walked away from.",
        science: "The 1987 Montreal Protocol — a binding treaty — successfully reduced ozone-depleting substances by 99% and remains the only international environmental treaty considered fully successful.",
        effects: { co2Delta: -9, tempDelta: -0.09, seaDelta: -0.5, iceDelta: 0.18, bioDelta: 6, emisDelta: -6.0 }
      }
    ]
  }
];

function getOutcome(state) {
  const t = state.tempAnomaly;
  if (t < 1.8) return { grade: "A", title: "Holding the Line", color: "#4a9e4a", summary: "2024 was already the first calendar year above 1.5°C. But you held the multi-decade average near that threshold — which is what the Paris Agreement actually measures. Coral reefs are diminished, coastal communities displaced. But cascading tipping points were avoided. A hard, honest victory." };
  if (t < 2.2) return { grade: "B", title: "Below 2°C — Narrowly", color: "#8aaa3a", summary: "The Paris Agreement's upper limit, barely held. Significant coral reef loss and permanent coastal displacement occurred. But the worst feedback loops were avoided. The window was narrow, and you found it." };
  if (t < 2.5) return { grade: "C", title: "A Damaged World", color: "#c8821a", summary: "2–2.5°C of warming. Frequent extreme weather is the new normal. The Maldives and many Pacific islands are submerged. Hundreds of millions are displaced. Civilization continues — diminished, stressed, but intact." };
  if (t < 3.0) return { grade: "D", title: "The 3°C Threshold", color: "#c05020", summary: "Catastrophic and cascading. Major tipping points have been triggered. Mass extinction is underway in tropical ecosystems. Civilizations in the Sahel, South Asia, and coastal zones are collapsing. Future generations face a profoundly diminished inheritance." };
  return { grade: "F", title: "Uncharted Territory", color: "#b83a2a", summary: "Beyond 3.5°C. Earth is in a state with no analog in recorded human civilization. The IPCC warned of this. The scientific literature predicted it in detail. The decisions were made anyway." };
}

function MetricBar({ label, value, min, max, goodDirection, unit = "", decimals = 1 }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const bad = goodDirection === "low" ? pct > 60 : pct < 40;
  const severe = goodDirection === "low" ? pct > 80 : pct < 20;
  const color = severe ? "#b83a2a" : bad ? "#c8821a" : "#4a9e4a";
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7a60" }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "'Playfair Display', serif", color: "#f4efe4" }}>{value.toFixed(decimals)}{unit}</span>
      </div>
      <div style={{ height: 3, background: "#2a2a20", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 1s ease, background 1s ease" }} />
      </div>
    </div>
  );
}

async function generateNarrative(decision, choice, climateState, history) {
  const historyStr = history.length > 0
    ? history.map((h, i) => `Decision ${i + 1} (${h.range}): Chose "${h.choiceLabel}"`).join("\n")
    : "This is the first decision.";

  const prompt = `You are the narrator of a hyper-realistic educational climate change simulation used in universities and policy institutes. Your tone is that of a grave, precise documentary journalist. No melodrama. No moralizing. Just honest, evidence-grounded consequence.

The player is a UN Climate Coordinator. Here is their COMPLETE decision history so far:
${historyStr}

They just made this new decision:
Decision era: "${decision.range}"
Decision: "${decision.title}"
Choice made: "${choice.label}" — ${choice.detail}

Current projected climate state after this decision (${climateState.year}):
- Atmospheric CO₂: ${climateState.co2.toFixed(1)} ppm
- Global mean temperature anomaly: +${climateState.tempAnomaly.toFixed(2)}°C above pre-industrial baseline
- Sea level rise: +${climateState.seaLevel.toFixed(1)} cm from 2026 baseline
- September Arctic sea ice extent: ${climateState.arcticIce.toFixed(2)} million km²
- Biodiversity index: ${climateState.biodiversity.toFixed(0)}/100

Write exactly 3 paragraphs (160–190 words total):
Paragraph 1: The immediate real-world consequences of this decision — grounded in actual climate science. Where relevant, reference how this decision interacts with or builds on the player's PREVIOUS choices. If they chose well before, acknowledge the foundation. If they made poor choices earlier, show the compounding consequences.
Paragraph 2: A vivid human-scale scene from somewhere on Earth, 10 years after this decision. Show what daily life looks like — for better or worse — as a direct result of the cumulative path taken.
Paragraph 3: An honest scientific assessment of the cumulative trajectory. What do models now show given ALL decisions made so far? Are we on track for 1.5°C, 2°C, 3°C or worse? What does the full arc of choices mean?

Be scientifically accurate. Reference the actual decision history when relevant. Do not use bullet points. Do not say "it's not too late."`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-iab": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text || "The consequences of this decision ripple forward through time. The data arrives slowly, then all at once.";
}

export default function ClimateGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro");
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [climate, setClimate] = useState({ ...BASELINE });
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [showScience, setShowScience] = useState(null);
  const [rewindConfirm, setRewindConfirm] = useState(null);
  const narrativeRef = useRef(null);

  const currentDecision = DECISIONS[decisionIndex];
  const dynamicContext = buildContext(decisionIndex, history, climate);
  const unlockedChoices = getUnlockedChoices(currentDecision.id, history);
  const allChoices = [...currentDecision.choices, ...unlockedChoices];

  const applyEffects = useCallback((state, effects) => ({
    ...state,
    year: state.year + 10,
    co2: Math.max(300, state.co2 + (effects.co2Delta || 0) + 2.8),
    tempAnomaly: Math.max(1.1, state.tempAnomaly + (effects.tempDelta || 0) + 0.018),
    seaLevel: state.seaLevel + Math.max(0.5, (effects.seaDelta || 0) + 2.0),
    arcticIce: Math.max(0.1, Math.min(5.5, state.arcticIce + (effects.iceDelta || 0) - 0.12)),
    biodiversity: Math.max(15, Math.min(100, state.biodiversity + (effects.bioDelta || 0) - 1.8)),
    globalEmissions: Math.max(4, state.globalEmissions + (effects.emisDelta || 0)),
  }), []);

  const handleChoiceSelect = async (choice) => {
    if (phase === "narrative") return;
    setSnapshots(snaps => {
      const next = [...snaps];
      next[decisionIndex] = { climate: { ...climate }, history: [...history] };
      return next;
    });
    setSelectedChoice(choice);
    setIsLoading(true);
    setPhase("narrative");
    const newClimate = applyEffects(climate, choice.effects);
    const newHistory = [...history, {
      choiceId: choice.id,
      choiceLabel: choice.label,
      range: currentDecision.range,
      decision: currentDecision.title,
    }];
    try {
      const text = await generateNarrative(currentDecision, choice, newClimate, history);
      setNarrative(text);
    } catch {
      setNarrative("The data arrives over the following months. Climate models are updated. Governments adjust projections. The consequences, as always, are felt unevenly across the planet.");
    }
    setClimate(newClimate);
    setHistory(newHistory);
    setIsLoading(false);
    setTimeout(() => narrativeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleNext = () => {
    if (decisionIndex >= DECISIONS.length - 1) {
      setPhase("result");
    } else {
      setDecisionIndex(i => i + 1);
      setSelectedChoice(null);
      setNarrative("");
      setPhase("decision");
      setShowScience(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRewindTo = (snapIndex) => {
    const snap = snapshots[snapIndex];
    if (!snap) return;
    setClimate({ ...snap.climate });
    setHistory([...snap.history]);
    setDecisionIndex(snapIndex);
    setSnapshots(s => s.slice(0, snapIndex));
    setSelectedChoice(null);
    setNarrative("");
    setPhase("decision");
    setShowScience(null);
    setRewindConfirm(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setPhase("intro"); setDecisionIndex(0); setClimate({ ...BASELINE });
    setHistory([]); setSnapshots([]); setSelectedChoice(null);
    setNarrative(""); setShowScience(null); setRewindConfirm(null);
    window.scrollTo({ top: 0 });
  };

  const outcome = getOutcome(climate);

  const s = {
    shell: { maxWidth: 820, margin: "0 auto", padding: "0 16px 80px" },
    header: { textAlign: "center", padding: "40px 0 22px", borderBottom: "1px solid #252518", marginBottom: 28 },
    eyebrow: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c8821a", display: "block", marginBottom: 10 },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 4.5vw, 40px)", color: "#f4efe4", lineHeight: 1.15, fontWeight: 700 },
    sub: { fontStyle: "italic", color: "#6a6050", fontSize: 13, marginTop: 7 },
    panel: { background: "#13130d", border: "1px solid #252518", borderRadius: 6 },
    dashWrap: { padding: "18px 22px", marginBottom: 22 },
    dashTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
    dashLabel: { fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8821a" },
    yearNum: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#f4efe4" },
    metricsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 32px" },
    decPanel: { padding: "26px 26px 22px", marginBottom: 18 },
    decEye: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6a6050", marginBottom: 8 },
    decTitle: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(19px, 3vw, 27px)", color: "#f4efe4", marginBottom: 14, lineHeight: 1.2 },
    ctx: { color: "#c4b898", fontSize: 14, lineHeight: 1.8, marginBottom: 16 },
    q: { color: "#e8d8b8", fontSize: 14, fontStyle: "italic", borderLeft: "3px solid #c8821a", paddingLeft: 14 },
    choicesWrap: { marginTop: 22, display: "grid", gap: 10 },
    choice: (hov, sel, unlocked) => ({
      background: unlocked ? "#0e1a0e" : sel ? "#192219" : hov ? "#191910" : "#13130d",
      border: `1px solid ${unlocked ? "#4a9e4a88" : sel ? "#4a9e4a" : hov ? "#c8821a44" : "#252518"}`,
      borderRadius: 5, padding: "15px 17px", cursor: "pointer", textAlign: "left",
      color: "#f4efe4", transition: "border 0.15s, background 0.15s", width: "100%",
    }),
    cLabel: { fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#f4efe4", display: "block" },
    cDetail: { fontSize: 13, color: "#a09070", lineHeight: 1.65, display: "block" },
    sciBtn: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8821a", marginTop: 8, cursor: "pointer", background: "none", border: "none", borderBottom: "1px dotted #c8821a", padding: 0, fontFamily: "inherit" },
    sciBox: { background: "#0e170e", border: "1px solid #1e3a1e", borderRadius: 4, padding: "12px 15px", marginTop: 10, fontSize: 13, color: "#7ab87a", lineHeight: 1.7 },
    unlockedBadge: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a9e4a", marginBottom: 6, display: "block" },
    narPanel: { padding: "26px 28px 22px", marginTop: 22 },
    narEye: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c8821a", marginBottom: 14 },
    narText: { color: "#d4c9a8", fontSize: 14.5, lineHeight: 1.88, whiteSpace: "pre-wrap" },
    btn: { marginTop: 22, background: "#c8821a", color: "#0e0e0a", border: "none", borderRadius: 4, padding: "12px 26px", fontFamily: "'Playfair Display', serif", fontSize: 14, cursor: "pointer", fontWeight: 700 },
    btnGhost: { background: "transparent", color: "#7ab87a", border: "1px solid #2a4a2a", borderRadius: 4, padding: "12px 26px", fontFamily: "'Playfair Display', serif", fontSize: 14, cursor: "pointer", fontWeight: 700 },
    hist: { marginTop: 20, padding: "14px 18px", background: "#0e0e09", border: "1px solid #1a1a12", borderRadius: 5 },
    histEye: { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a5040", marginBottom: 10 },
    histItem: { fontSize: 12, color: "#6a6050", paddingLeft: 12, borderLeft: "2px solid #1e1e12", marginBottom: 5, lineHeight: 1.55 },
    resultWrap: { textAlign: "center", marginTop: 24, padding: "36px 24px", background: "#13130d", border: `1px solid ${outcome.color}33`, borderRadius: 8 },
    circle: { width: 76, height: 76, borderRadius: "50%", border: `2px solid ${outcome.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontFamily: "'Playfair Display', serif", fontSize: 34, color: outcome.color, fontWeight: 700 },
    intro: { maxWidth: 620, margin: "0 auto 28px", padding: "24px 26px", background: "#13130d", border: "1px solid #252518", borderRadius: 6 },
  };

  return (
    <div style={{ background: "#0e0e0a", minHeight: "100vh", color: "#f4efe4", fontFamily: "'Source Serif 4', serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,300&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } button { font-family: inherit; }`}</style>
      <div style={s.shell}>
        <div style={s.header}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6a6050", fontSize: 12, cursor: "pointer", marginBottom: 12, display: "block", margin: "0 auto 12px", fontFamily: "inherit", letterSpacing: "0.05em" }}>← All Games</button>
          <span style={s.eyebrow}>UN Climate Coordination Simulation · Educational Edition</span>
          <h1 style={s.h1}>A Degree of Consequence</h1>
          <p style={s.sub}>Five decisions. Fifty years. One planet. Grounded in IPCC AR6 science.</p>
        </div>

        {phase === "intro" && (
          <>
            <div style={s.intro}>
              <p style={{ ...s.ctx, marginBottom: 16 }}>You are humanity's newly appointed UN Climate Coordinator. Over five turns — each representing a decade from 2026 to 2076 — you will face the defining decisions of the climate crisis.</p>
              <p style={{ ...s.ctx, marginBottom: 16 }}>Every decision is grounded in real science: the IPCC Sixth Assessment Report, IEA Net Zero pathway, UNEP Emissions Gap Reports, and peer-reviewed research. Your choices compound — earlier decisions shape the context of later ones, unlock new options, and are woven into every AI-generated narrative.</p>
              <p style={{ fontSize: 13, color: "#6a6050", fontStyle: "italic", lineHeight: 1.7 }}>There are no easy answers. There are only trade-offs, time horizons, and the weight of billions of lives.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setPhase("decision")} style={s.btn}>Begin Simulation — Year 2026 →</button>
            </div>
          </>
        )}

        {phase !== "intro" && (
          <div style={{ ...s.panel, ...s.dashWrap }}>
            <div style={s.dashTop}>
              <span style={s.dashLabel}>Global Climate Monitor</span>
              <span style={s.yearNum}>{climate.year}</span>
            </div>
            <div style={s.metricsGrid}>
              <MetricBar label="CO₂ Concentration" value={climate.co2} min={350} max={580} goodDirection="low" unit=" ppm" decimals={0} />
              <MetricBar label="Temp. Anomaly" value={climate.tempAnomaly} min={1.5} max={4.0} goodDirection="low" unit="°C" decimals={2} />
              <MetricBar label="Sea Level Rise" value={climate.seaLevel} min={0} max={80} goodDirection="low" unit=" cm" decimals={1} />
              <MetricBar label="Arctic Sea Ice" value={climate.arcticIce} min={0} max={5.5} goodDirection="high" unit=" M km²" decimals={2} />
              <MetricBar label="Biodiversity Index" value={climate.biodiversity} min={20} max={100} goodDirection="high" decimals={0} />
              <MetricBar label="Annual Emissions" value={climate.globalEmissions} min={5} max={50} goodDirection="low" unit=" GtCO₂" decimals={1} />
            </div>
          </div>
        )}

        {(phase === "decision" || phase === "narrative") && (
          <>
            <div style={{ ...s.panel, ...s.decPanel }}>
              <div style={s.decEye}>Decision {decisionIndex + 1} of {DECISIONS.length} · {currentDecision.range}</div>
              <h2 style={s.decTitle}>{currentDecision.title}</h2>
              <p style={s.ctx}>{dynamicContext}</p>
              {unlockedChoices.length > 0 && (
                <div style={{ background: "#0a180a", border: "1px solid #2a4a2a", borderRadius: 4, padding: "8px 13px", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: "#4a9e4a", letterSpacing: "0.1em", textTransform: "uppercase" }}>⚡ Your earlier decisions have unlocked a new option below</span>
                </div>
              )}
              <p style={s.q}>{currentDecision.question}</p>
              <div style={s.choicesWrap}>
                {allChoices.map(choice => (
                  <div key={choice.id}>
                    <button
                      style={s.choice(hoveredChoice === choice.id, selectedChoice?.id === choice.id, choice.unlocked)}
                      onMouseEnter={() => setHoveredChoice(choice.id)}
                      onMouseLeave={() => setHoveredChoice(null)}
                      onClick={() => handleChoiceSelect(choice)}
                      disabled={phase === "narrative"}
                    >
                      {choice.unlocked && <span style={s.unlockedBadge}>⚡ Unlocked by your previous decisions</span>}
                      <span style={s.cLabel}>{choice.label}</span>
                      <span style={s.cDetail}>{choice.detail}</span>
                      <button style={s.sciBtn} onClick={e => { e.stopPropagation(); setShowScience(showScience === choice.id ? null : choice.id); }}>
                        {showScience === choice.id ? "▲ hide the science" : "▼ the science"}
                      </button>
                      {showScience === choice.id && <div style={s.sciBox}>{choice.science}</div>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {phase === "narrative" && (
              <div ref={narrativeRef} style={{ ...s.panel, ...s.narPanel }}>
                <div style={s.narEye}>
                  {isLoading ? "Modeling decade-scale consequences..." : `Consequence · ${selectedChoice?.label}`}
                </div>
                {isLoading
                  ? <p style={{ color: "#5a5040", fontSize: 14, fontStyle: "italic" }}>Running climate projections based on your full decision history...</p>
                  : <>
                    <div style={s.narText}>{narrative}</div>
                    <button onClick={handleNext} style={s.btn}>
                      {decisionIndex >= DECISIONS.length - 1 ? "See Final Outcome →" : `Advance to ${climate.year} →`}
                    </button>
                  </>
                }
              </div>
            )}
          </>
        )}

        {history.length > 0 && phase !== "result" && (
          <div style={s.hist}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={s.histEye}>Timeline — click any decision to rewind</div>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                {rewindConfirm === i ? (
                  <div style={{ background: "#1a0e0a", border: "1px solid #c8821a44", borderRadius: 4, padding: "10px 13px" }}>
                    <p style={{ fontSize: 12, color: "#c8821a", marginBottom: 8, lineHeight: 1.5 }}>
                      Rewind to <strong>{h.range}</strong> and choose differently? Everything after this point will be erased.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleRewindTo(i)} style={{ background: "#c8821a", color: "#0e0e0a", border: "none", borderRadius: 3, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>↩ Rewind here</button>
                      <button onClick={() => setRewindConfirm(null)} style={{ background: "transparent", color: "#6a6050", border: "1px solid #252518", borderRadius: 3, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ ...s.histItem, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeftColor: "#c8821a44", paddingRight: 6 }}
                    onMouseEnter={e => e.currentTarget.style.borderLeftColor = "#c8821a"}
                    onMouseLeave={e => e.currentTarget.style.borderLeftColor = "#c8821a44"}
                    onClick={() => setRewindConfirm(i)}
                  >
                    <span><strong style={{ color: "#8a7058" }}>{h.range} · {h.decision}:</strong> {h.choiceLabel}</span>
                    <span style={{ fontSize: 10, color: "#5a5040", flexShrink: 0, marginLeft: 10 }}>↩ rewind</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {phase === "result" && (
          <div style={s.resultWrap}>
            <div style={s.circle}>{outcome.grade}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,3.5vw,30px)", color: outcome.color, marginBottom: 14 }}>{outcome.title}</h2>
            <p style={{ color: "#d4c9a8", fontSize: 14, lineHeight: 1.85, maxWidth: 560, margin: "0 auto 28px" }}>{outcome.summary}</p>
            <div style={{ background: "#0e0e09", borderRadius: 5, padding: "18px 22px", textAlign: "left", maxWidth: 520, margin: "0 auto 24px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a5040", marginBottom: 14 }}>Final State — Year 2076</div>
              <MetricBar label="CO₂" value={climate.co2} min={350} max={580} goodDirection="low" unit=" ppm" decimals={0} />
              <MetricBar label="Temperature Anomaly" value={climate.tempAnomaly} min={1.5} max={4.0} goodDirection="low" unit="°C" decimals={2} />
              <MetricBar label="Sea Level Rise" value={climate.seaLevel} min={0} max={80} goodDirection="low" unit=" cm" decimals={1} />
              <MetricBar label="Biodiversity Index" value={climate.biodiversity} min={20} max={100} goodDirection="high" decimals={0} />
            </div>
            <div style={{ textAlign: "left", maxWidth: 520, margin: "0 auto 24px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a5040", marginBottom: 12 }}>Your Decision Record</div>
              {history.map((h, i) => (
                <div key={i} style={{ ...s.histItem, borderLeftColor: "#c8821a44" }}>
                  <strong style={{ color: "#c8821a" }}>{h.range}:</strong> {h.choiceLabel}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {history.map((h, i) => (
                <button key={i} onClick={() => handleRewindTo(i)} style={{ ...s.btnGhost, fontSize: 12, padding: "8px 16px" }}>↩ Rewind to {h.range}</button>
              ))}
              <button onClick={handleRestart} style={{ ...s.btnGhost, borderColor: "#5a5040", color: "#5a5040" }}>↺ Start Over</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
