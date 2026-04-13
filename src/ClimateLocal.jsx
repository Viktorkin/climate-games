import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design: warm bulletin-board / community newspaper aesthetic ─────────────
// Cream + forest green + terracotta, Lora + DM Serif Display, hand-crafted feel

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');`;

// ─── Local Impact Metrics ────────────────────────────────────────────────────
// These represent YOUR household + ripple effects in a community of ~2,000 homes
const BASELINE = {
  year: 2026,
  householdEmissions: 14.8, // metric tons CO2e/year (US suburban avg, EPA 2024)
  neighborhoodAdoption: 0,  // % of neighbors influenced by your actions (0–100)
  localTreeCanopy: 22,      // % tree canopy cover in your zip code (US suburban avg)
  schoolEngagement: 0,      // climate curriculum/action score (0–100)
  communityResilience: 30,  // neighborhood preparedness & cohesion score (0–100)
  wellbeing: 60,            // personal + family wellbeing score (0–100)
};

const YEARS = [
  {
    id: "home_energy",
    year: 1,
    label: "Year One",
    title: "The House You Live In",
    context: "It's spring 2026. Your utility bill arrived again — $240, higher than last month. Your 10-year-old asked why the winters feel shorter than when you were a kid. You've been meaning to do something. A neighbor mentions a new solar co-op program in town, and the school district is hosting a meeting about its aging HVAC system. You have energy, limited money, and one free Saturday a month.",
    question: "Where do you focus your first year of action?",
    choices: [
      {
        id: "solar_insulation",
        label: "Join the neighborhood solar co-op & weatherize",
        detail: "Sign onto the group solar purchase program (30% cheaper than going solo) and add attic insulation. Upfront cost ~$3,000 after federal tax credit.",
        science: "The US Inflation Reduction Act (2022) provides a 30% tax credit on home solar and insulation upgrades. A typical suburban home solar install offsets 3–4 tons CO2/year. Weatherization reduces heating/cooling energy use by 15–30% (DOE, 2023).",
        ripple: "Your yard sign and visible panels prompt 4 neighbors to ask questions. Group purchases cut costs further for the next round.",
        effects: { emissionsDelta: -3.8, adoptionDelta: 6, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 4, wellbeingDelta: 5 }
      },
      {
        id: "school_hvac",
        label: "Organize parents to push for school HVAC & solar",
        detail: "Lead a parent coalition to pressure the school board to replace the 25-year-old gas boilers with heat pumps and add rooftop solar at the elementary school.",
        science: "K-12 schools account for 8% of US commercial building energy use. EPA's ENERGY STAR program finds school efficiency upgrades typically reduce energy costs 25–30%. Heat pumps are 2–3x more efficient than gas furnaces (IPCC AR6, Ch. 9).",
        ripple: "Other parents get activated. The school becomes a visible community anchor for climate action. Kids bring energy home.",
        effects: { emissionsDelta: -0.8, adoptionDelta: 12, canopyDelta: 0, schoolDelta: 22, resilienceDelta: 8, wellbeingDelta: 7 }
      },
      {
        id: "ev_ebike",
        label: "Replace one car trip with an e-bike, advocate for bike lanes",
        detail: "Buy a family e-bike for school runs and errands under 5 miles. Attend one city council meeting to advocate for a protected bike lane on your main street.",
        science: "Transportation is the largest source of US household emissions at ~28% (EPA, 2023). E-bikes replace car trips 46–76% of the time when used for commuting (Transport & Environment, 2023). A single protected bike lane can reduce local car trips by 8–12%.",
        ripple: "Your kids ride with you. Neighbors notice. Local news covers the bike lane push. Three families buy e-bikes within the year.",
        effects: { emissionsDelta: -1.4, adoptionDelta: 8, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 3, wellbeingDelta: 9 }
      },
      {
        id: "diet_garden",
        label: "Start a backyard garden & shift toward plant-forward eating",
        detail: "Convert your lawn section to a kitchen garden. Reduce household meat consumption to 2x/week. Join a local CSA farm share.",
        science: "Food production accounts for ~10–12% of US household carbon footprints. Shifting to a plant-rich diet is the single highest-impact individual food action, reducing food emissions 50–73% (Poore & Nemecek, Science 2018). Home gardens also support local pollinators.",
        ripple: "You share extra produce with neighbors. A block garden swap starts. Your kids learn where food comes from.",
        effects: { emissionsDelta: -1.6, adoptionDelta: 5, canopyDelta: 1, schoolDelta: 0, resilienceDelta: 5, wellbeingDelta: 10 }
      }
    ]
  },
  {
    id: "community_organizing",
    year: 2,
    label: "Year Two",
    title: "Your Street, Your Town",
    context: "It's 2027. You've got momentum — and a few allies. A heat wave last August kept your kids inside for a week. Your neighborhood's only park lost two old oaks to storm damage. Meanwhile, your town's comprehensive plan is up for revision — a once-every-ten-years opportunity. The local Sunrise Movement chapter reached out asking if you'd co-host a community meeting.",
    question: "Where do you direct your growing community energy?",
    choices: [
      {
        id: "comp_plan",
        label: "Mobilize neighbors to shape the town's comprehensive plan",
        detail: "Organize residents to show up at planning meetings and push for walkable zoning, tree canopy requirements, and a ban on new gas infrastructure in commercial buildings.",
        science: "Local zoning is one of the most powerful but underused climate levers. Cities that adopted 'complete streets' policies reduced VMT (vehicle miles traveled) by 15–30% over a decade (Smart Growth America, 2022). Building codes that ban new gas hookups have been adopted in 100+ US cities.",
        ripple: "Your organized bloc becomes a known political force. The planning commission starts treating climate as infrastructure, not ideology.",
        effects: { emissionsDelta: -0.9, adoptionDelta: 18, canopyDelta: 3, schoolDelta: 5, resilienceDelta: 14, wellbeingDelta: 6 }
      },
      {
        id: "tree_planting",
        label: "Launch a neighborhood tree planting and urban heat island campaign",
        detail: "Partner with your local parks department and Arbor Day Foundation to plant 80 native trees across your neighborhood over two weekends.",
        science: "Urban trees reduce local air temperatures by 2–8°C through evapotranspiration (EPA Heat Island Effect data). A 10% increase in urban tree canopy reduces stormwater runoff by ~7% and lowers household cooling costs by up to 15%. Native species support 35x more local wildlife than non-native ornamentals (Tallamy, 2007).",
        ripple: "The planting days become a neighborhood tradition. Kids name their trees. Local media covers it. The parks dept doubles its tree budget.",
        effects: { emissionsDelta: -0.3, adoptionDelta: 14, canopyDelta: 6, schoolDelta: 3, resilienceDelta: 10, wellbeingDelta: 12 }
      },
      {
        id: "local_election",
        label: "Run for — or campaign hard for — your local school board or city council",
        detail: "Get directly involved in local governance. Either run yourself or become a core volunteer for a climate-aligned candidate in a down-ballot race most people ignore.",
        science: "Voter turnout in local US elections averages just 15–27% (Portland State University, 2019). A motivated 5% bloc can swing most school board and city council races. Local elected officials control zoning, building codes, fleet electrification, and school curriculum.",
        ripple: "Even if you lose, you shift the conversation. If you win, you have real power. Either way, you've built a durable local network.",
        effects: { emissionsDelta: -0.5, adoptionDelta: 22, canopyDelta: 0, schoolDelta: 15, resilienceDelta: 18, wellbeingDelta: 4 }
      },
      {
        id: "community_resilience",
        label: "Build a neighborhood emergency preparedness and resilience network",
        detail: "Create a block-by-block mutual aid network focused on extreme heat and storm preparedness — shared generators, cooling centers, vulnerable neighbor check-ins.",
        science: "During the 2021 Pacific Northwest heat dome, death rates were 3x higher in neighborhoods with low social cohesion (CDC, 2022). FEMA data shows communities with existing mutual aid networks recover 40% faster after climate disasters. Social trust is a climate adaptation tool.",
        ripple: "Neighbors who barely spoke now have each other's numbers. Your block becomes the model for three others. The city adopts it as a pilot program.",
        effects: { emissionsDelta: 0, adoptionDelta: 16, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 22, wellbeingDelta: 14 }
      }
    ]
  },
  {
    id: "kids_schools",
    year: 3,
    label: "Year Three",
    title: "The Next Generation",
    context: "It's 2028. Your kid comes home from school talking about a science project on local watersheds — their teacher is remarkable. But the district's curriculum coordinator just announced that climate science will be 'deemphasized' in the new standards. Simultaneously, a developer has proposed converting the last green field near your school into a parking lot for a strip mall. A state grant for school garden programs just opened.",
    question: "How do you invest in the generation growing up through this?",
    choices: [
      {
        id: "defend_curriculum",
        label: "Fight to protect and expand climate science curriculum",
        detail: "Organize parents, teachers, and students to push back against curriculum watering-down. Propose a community-designed climate literacy module for grades 4–8.",
        science: "Climate education increases pro-environmental behaviors in children AND their parents — a documented 'intergenerational learning' effect (Lawson et al., Nature Climate Change, 2019). Students who receive climate education are significantly more likely to vote, volunteer, and take local action as adults.",
        ripple: "Teachers feel supported. Students become ambassadors at home. The curriculum coordinator reverses course after 200 parents show up.",
        effects: { emissionsDelta: -0.2, adoptionDelta: 14, canopyDelta: 0, schoolDelta: 28, resilienceDelta: 6, wellbeingDelta: 8 }
      },
      {
        id: "school_garden",
        label: "Apply for the school garden grant and lead the build",
        detail: "Write the grant application, recruit parent volunteers, and build a 2,000 sq ft native plant and food garden at the school with student involvement.",
        science: "School gardens increase fruit and vegetable consumption in children by 20–30% and improve science literacy scores (Journal of Nutrition Education, 2021). Native plant gardens in schools have been shown to increase local pollinator populations by 40–70% within 3 years (Xerces Society, 2022).",
        ripple: "The garden becomes an outdoor classroom. Kids tend it year-round. Three nearby schools ask how to replicate it.",
        effects: { emissionsDelta: -0.1, adoptionDelta: 10, canopyDelta: 2, schoolDelta: 20, resilienceDelta: 8, wellbeingDelta: 13 }
      },
      {
        id: "fight_development",
        label: "Oppose the parking lot development, advocate for a community green space",
        detail: "Organize opposition to the strip mall and propose the land be purchased as a community nature preserve and stormwater park instead.",
        science: "Green spaces in urban areas reduce local stormwater runoff by 30–50% and lower surrounding property heat by 3–5°C (EPA, 2022). Parks within a half-mile reduce children's stress hormones and improve attention span — documented mental health benefits linked to climate resilience.",
        ripple: "The developer backs down after public pressure. The land is placed in a community land trust. It becomes the neighborhood's anchor green space.",
        effects: { emissionsDelta: -0.2, adoptionDelta: 12, canopyDelta: 5, schoolDelta: 8, resilienceDelta: 12, wellbeingDelta: 10 }
      },
      {
        id: "youth_council",
        label: "Help found a youth climate council at your school",
        detail: "Work with students to establish a student-led climate action council with a real budget, real projects, and a direct line to the school board.",
        science: "Youth-led climate organizations have demonstrated measurable local outcomes — from food waste reduction programs cutting school emissions 10–15%, to student-led energy audits saving districts $50–200K annually (Green Schools National Network, 2023).",
        ripple: "Students lead their first school energy audit. They present findings to the school board. Three members vote to accelerate the HVAC replacement timeline.",
        effects: { emissionsDelta: -0.3, adoptionDelta: 16, canopyDelta: 0, schoolDelta: 32, resilienceDelta: 10, wellbeingDelta: 11 }
      }
    ]
  },
  {
    id: "local_economy",
    year: 4,
    label: "Year Four",
    title: "How Your Town Spends Its Money",
    context: "It's 2029. The community you've been building has real weight now. A local credit union approaches your network about a green home loan program. The town's municipal fleet — 40 vehicles — is up for replacement. A beloved local hardware store owner wants to retire and has offered the community first right of purchase to convert it into a worker cooperative. Your neighborhood association now has 300 members.",
    question: "How do you direct your community's growing economic power?",
    choices: [
      {
        id: "green_loans",
        label: "Partner with the credit union on a community green loan fund",
        detail: "Help design and promote a low-interest loan program for solar, heat pumps, and e-bikes — specifically targeting renters and lower-income homeowners who can't access federal tax credits.",
        science: "Federal clean energy tax credits predominantly benefit higher-income households who can afford upfront costs. Low-income households spend 8.6% of income on energy vs. 3% for higher-income (ACEEE, 2023) — making efficiency upgrades the most high-impact financial relief available. Green revolving loan funds have achieved 95%+ repayment rates in peer programs.",
        ripple: "40 more households upgrade in the first year. The credit union reports it's their most subscribed product ever. Neighboring towns replicate it.",
        effects: { emissionsDelta: -2.1, adoptionDelta: 20, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 12, wellbeingDelta: 8 }
      },
      {
        id: "fleet_electrification",
        label: "Campaign for full electrification of the town's municipal fleet",
        detail: "Present data to the town council showing the 10-year cost savings of electric vehicles and negotiate a deal with a regional charging infrastructure provider.",
        science: "Municipal fleet electrification delivers 50–70% lower lifetime operating costs than equivalent ICE vehicles (Rocky Mountain Institute, 2023). A 40-vehicle electric fleet reduces municipal emissions by ~120 tons CO2/year and eliminates ~$180,000 in annual fuel costs at average US prices.",
        ripple: "The town council votes 5-2 to electrify. The public works director becomes a vocal local champion. Your work gets written up in the state municipal league newsletter.",
        effects: { emissionsDelta: -0.6, adoptionDelta: 15, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 8, wellbeingDelta: 6 }
      },
      {
        id: "worker_coop",
        label: "Help convert the hardware store into a worker-owned green co-op",
        detail: "Organize a community buy-in fund and work with the owner to transition the store to worker ownership, refocusing it on sustainable home products and repair services.",
        science: "Worker cooperatives have a 3x lower failure rate than conventional small businesses over 5 years (University of Wisconsin, 2020). Repair cafes and tool libraries reduce household consumption emissions by 10–20% per participating household. Local ownership keeps 3x more dollars circulating in the local economy vs. chain retail.",
        ripple: "The store becomes a community hub. A repair café runs every Saturday. The 'buy less, fix more' ethos spreads visibly through your neighborhood.",
        effects: { emissionsDelta: -0.8, adoptionDelta: 18, canopyDelta: 0, schoolDelta: 4, resilienceDelta: 16, wellbeingDelta: 12 }
      },
      {
        id: "community_energy",
        label: "Organize a community energy cooperative",
        detail: "Establish a neighborhood-scale community solar garden that provides clean energy access to renters, apartment dwellers, and households without suitable roofs.",
        science: "Community solar allows households without rooftop access — about 50% of US households — to access solar savings. Shared solar programs reduce participant electricity bills by 10–15% on average. Community-owned energy projects return 50–80% more value locally than utility-owned equivalents (ILSR, 2022).",
        ripple: "80 households join in year one. The coop structure means every member has a vote and a stake. Local ownership transforms how people think about energy.",
        effects: { emissionsDelta: -2.8, adoptionDelta: 24, canopyDelta: 0, schoolDelta: 0, resilienceDelta: 14, wellbeingDelta: 9 }
      }
    ]
  },
  {
    id: "scaling_up",
    year: 5,
    label: "Year Five",
    title: "What You Leave Behind",
    context: "It's 2030. You've been at this for five years, since 2026. The neighborhood looks different — more solar panels, more trees, a real sense of collective ownership. Your kid is now 16 and leads the youth climate council. A state senator's office has called asking if your model can be replicated in 20 communities. You have a choice about how to spend your energy now: go deep locally, or help other communities find what yours found.",
    question: "What is your lasting contribution?",
    choices: [
      {
        id: "document_replicate",
        label: "Document your model and help 5 neighboring communities replicate it",
        detail: "Write the playbook. Host trainings. Mentor leaders in five nearby towns through their first year of organizing. Accept the state senator's offer.",
        science: "Social diffusion of climate action is documented: communities adjacent to early-adopter neighborhoods adopt rooftop solar at 3–4x the rate of non-adjacent areas (Bollinger & Gillingham, Marketing Science, 2012). Peer-to-peer organizing is 4x more effective at changing behavior than information campaigns (Goldstein et al., 2008).",
        ripple: "Your model is adapted in 5 towns within 18 months. The state passes a community climate resilience grant program inspired by your work.",
        effects: { emissionsDelta: -0.4, adoptionDelta: 30, canopyDelta: 1, schoolDelta: 8, resilienceDelta: 20, wellbeingDelta: 8 }
      },
      {
        id: "policy_pipeline",
        label: "Build a pipeline of climate-ready candidates for local office",
        detail: "Launch a 'community leadership school' — a 6-week program to train neighbors to run for school board, planning commission, and city council.",
        science: "There are over 500,000 elected offices in the US, most at the local level, where turnout and candidate quality determine outcomes. Research shows trained candidate pipelines increase the probability of local electoral success by 60% (DLCC, 2022). Local elected officials control policies affecting 70–80% of a household's carbon footprint.",
        ripple: "8 graduates run for local office in the first two years. 5 win. The planning commission shifts. The school board shifts. The work continues without you needing to carry it.",
        effects: { emissionsDelta: -0.6, adoptionDelta: 28, canopyDelta: 0, schoolDelta: 18, resilienceDelta: 24, wellbeingDelta: 7 }
      },
      {
        id: "deepen_roots",
        label: "Deepen your neighborhood's own resilience — go further locally",
        detail: "Decline the scaling requests for now. Focus on completing your neighborhood's transformation: 100% renewable energy access, full tree canopy restoration, a community land trust to protect affordable housing.",
        science: "Deep local transformation creates durable anchor communities that survive political cycles. Community land trusts have preserved affordable housing for 40+ years in US cities despite gentrification (Lincoln Institute, 2020). Neighborhoods with 40%+ solar adoption show continued organic growth without external organizing (Lawrence Berkeley National Lab, 2021).",
        ripple: "Your neighborhood becomes a living demonstration. Journalists, city planners, and organizers visit. You don't need to go to them — they come to you.",
        effects: { emissionsDelta: -1.8, adoptionDelta: 22, canopyDelta: 4, schoolDelta: 10, resilienceDelta: 28, wellbeingDelta: 14 }
      },
      {
        id: "youth_handoff",
        label: "Hand leadership to the youth council — step back and support",
        detail: "Formally transfer leadership of your neighborhood network to the youth climate council your kid helped build. Become the advisor, not the leader.",
        science: "Intergenerational leadership transfer is a documented success factor in long-lived community organizations (Putnam, Bowling Alone, 2000). Youth-led organizations sustain action 2x longer than adult-led organizations in environmental contexts (EPA Community Action study, 2021). The most durable climate movements are the ones that outlast their founders.",
        ripple: "Your kid's generation takes the wheel. They have ideas you never thought of. The network grows faster, stranger, and more creative than it ever did under your leadership.",
        effects: { emissionsDelta: -0.5, adoptionDelta: 26, canopyDelta: 2, schoolDelta: 22, resilienceDelta: 18, wellbeingDelta: 16 }
      }
    ]
  }
];

function getOutcome(state) {
  const score = (
    (100 - Math.max(0, state.householdEmissions) / 14.8 * 100) * 0.2 +
    state.neighborhoodAdoption * 0.25 +
    (state.localTreeCanopy - 22) / 30 * 100 * 0.1 +
    state.schoolEngagement * 0.2 +
    state.communityResilience * 0.15 +
    state.wellbeing * 0.1
  );

  if (score >= 72) return {
    grade: "A",
    title: "A Neighborhood Transformed",
    color: "#4a7c3f",
    summary: "Five years of showing up. The change is visible — in the tree canopy, the solar panels, the kids who grew up knowing they had a role in this. Your neighborhood didn't solve the climate crisis. But it became the kind of place that makes solving it imaginable."
  };
  if (score >= 52) return {
    grade: "B",
    title: "Real Roots, Real Progress",
    color: "#5a8a3a",
    summary: "You built something that will outlast your most intense years of involvement. The emissions reductions are modest at the household scale — but the network, the trust, and the political relationships you built are multipliers that compound over decades."
  };
  if (score >= 35) return {
    grade: "C",
    title: "Seeds Planted",
    color: "#c8821a",
    summary: "Progress, but scattered. Some strong wins, some directions that didn't take root. The most important thing: you stayed engaged. The people you connected with will carry pieces of this forward in ways you won't always see."
  };
  return {
    grade: "D",
    title: "The Hardest Lesson",
    color: "#b86030",
    summary: "Five years is long enough to learn that this work is hard and that not every effort lands. But you tried, which most people don't. The question isn't whether you failed — it's what you do with what you learned."
  };
}

async function generateNarrative(yearData, choice, state) {
  const prompt = `You are the narrator of a hopeful, grounded educational game about local climate action. The player is a suburban parent who is discovering the real, meaningful impact of community-level action on climate change. Your tone is warm, specific, and honest — like a really good piece of community journalism. Hopeful but never saccharine. Grounded in real science but told at a human scale.

The player just made this choice in Year ${yearData.year} of 5:
Scenario: "${yearData.title}"
Choice: "${choice.label}" — ${choice.detail}

The science behind this choice: ${choice.science}
The ripple effect: ${choice.ripple}

Current local state after this year:
- Household emissions: ${state.householdEmissions.toFixed(1)} metric tons CO2e/year (US suburban avg is 14.8)
- Neighbor adoption influence: ${state.neighborhoodAdoption.toFixed(0)}% of local households touched by your actions
- Local tree canopy: ${state.localTreeCanopy.toFixed(0)}% (started at 22%)
- School climate engagement score: ${state.schoolEngagement.toFixed(0)}/100
- Community resilience score: ${state.communityResilience.toFixed(0)}/100
- Personal wellbeing: ${state.wellbeing.toFixed(0)}/100

Write exactly 3 short paragraphs (total 150–175 words):

Paragraph 1: What actually happened this year as a direct result of this choice — specific, grounded, one real scene in the neighborhood. Name a neighbor, a moment, a meeting. Make it feel lived-in.

Paragraph 2: The ripple effect — what did this choice set in motion beyond your household? Who else is now doing something they weren't doing before? Be concrete and science-grounded.

Paragraph 3: A brief honest accounting — what this means for the five-year arc. What's working? What gap remains? What does your kid notice about the neighborhood that they didn't notice before?

Be warm but specific. No clichés. No "every little bit counts." Reference the actual mechanism of change. Write as if you're narrating a documentary about one real family in one real suburb.`;

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
  return data.content?.[0]?.text || "The year passed with quiet momentum. Small changes accumulated. The neighborhood felt, almost imperceptibly, more like the place you'd always hoped it could be.";
}

function ImpactBar({ label, value, min, max, goodDirection, unit = "", decimals = 0, icon }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const good = goodDirection === "high" ? pct > 45 : pct < 55;
  const color = good ? "#4a7c3f" : "#c8821a";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "#6b5e4a", letterSpacing: "0.04em", fontFamily: "'Lora', serif" }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: 12, fontFamily: "'DM Serif Display', serif", color: "#2d3d1e" }}>
          {value.toFixed(decimals)}{unit}
        </span>
      </div>
      <div style={{ height: 5, background: "#e8dfc8", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export default function ClimateLocal() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro");
  const [yearIndex, setYearIndex] = useState(0);
  const [state, setState] = useState({ ...BASELINE });
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [showScience, setShowScience] = useState(null);
  const [rewindConfirm, setRewindConfirm] = useState(null);
  const narrativeRef = useRef(null);

  const currentYear = YEARS[yearIndex];
  const outcome = getOutcome(state);

  const applyEffects = useCallback((s, effects) => ({
    ...s,
    year: s.year + 1,
    householdEmissions: Math.max(2, s.householdEmissions + (effects.emissionsDelta || 0)),
    neighborhoodAdoption: Math.min(100, s.neighborhoodAdoption + (effects.adoptionDelta || 0) + 1.5),
    localTreeCanopy: Math.min(55, s.localTreeCanopy + (effects.canopyDelta || 0) + 0.1),
    schoolEngagement: Math.min(100, s.schoolEngagement + (effects.schoolDelta || 0)),
    communityResilience: Math.min(100, s.communityResilience + (effects.resilienceDelta || 0) + 1),
    wellbeing: Math.min(100, Math.max(10, s.wellbeing + (effects.wellbeingDelta || 0))),
  }), []);

  const handleChoiceSelect = async (choice) => {
    if (phase === "narrative") return;
    setSnapshots(snaps => {
      const next = [...snaps];
      next[yearIndex] = { state: { ...state }, history: [...history] };
      return next;
    });
    setSelectedChoice(choice);
    setIsLoading(true);
    setPhase("narrative");
    const newState = applyEffects(state, choice.effects);
    try {
      const text = await generateNarrative(currentYear, choice, newState);
      setNarrative(text);
    } catch {
      setNarrative("The year passed with quiet momentum. Small changes accumulated in ways that would only become visible later.");
    }
    setState(newState);
    setHistory(h => [...h, { year: currentYear.label, title: currentYear.title, choice: choice.label }]);
    setIsLoading(false);
    setTimeout(() => narrativeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleNext = () => {
    if (yearIndex >= YEARS.length - 1) {
      setPhase("result");
    } else {
      setYearIndex(i => i + 1);
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
    setState({ ...snap.state });
    setHistory([...snap.history]);
    setYearIndex(snapIndex);
    setSnapshots(s => s.slice(0, snapIndex));
    setSelectedChoice(null);
    setNarrative("");
    setPhase("decision");
    setShowScience(null);
    setRewindConfirm(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setPhase("intro");
    setYearIndex(0);
    setState({ ...BASELINE });
    setHistory([]);
    setSnapshots([]);
    setSelectedChoice(null);
    setNarrative("");
    setShowScience(null);
    setRewindConfirm(null);
    window.scrollTo({ top: 0 });
  };

  const c = {
    page: { background: "#f5f0e4", minHeight: "100vh", fontFamily: "'Lora', serif", color: "#2d2416" },
    shell: { maxWidth: 780, margin: "0 auto", padding: "0 16px 80px" },
    header: {
      textAlign: "center",
      padding: "44px 0 28px",
      borderBottom: "2px solid #d4c9a4",
      marginBottom: 28,
      position: "relative",
    },
    leafAccent: { color: "#4a7c3f", fontSize: 22, marginBottom: 8, display: "block" },
    eyebrow: { fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#8a7a5a", display: "block", marginBottom: 10 },
    h1: { fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px,4.5vw,38px)", color: "#1e2d14", lineHeight: 1.2 },
    sub: { fontStyle: "italic", color: "#8a7a5a", fontSize: 13, marginTop: 8 },
    dashboard: {
      background: "#fff8ec",
      border: "1.5px solid #d4c9a4",
      borderRadius: 8,
      padding: "18px 22px",
      marginBottom: 22,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    dashTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
    dashLabel: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8a7a5a", fontFamily: "'Lora', serif" },
    yearBadge: { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1e2d14" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" },
    card: {
      background: "#fff8ec",
      border: "1.5px solid #d4c9a4",
      borderRadius: 8,
      padding: "22px 24px 20px",
      marginBottom: 18,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    cardEye: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8a7a5a", marginBottom: 7 },
    cardTitle: { fontFamily: "'DM Serif Display', serif", fontSize: "clamp(18px,3vw,25px)", color: "#1e2d14", marginBottom: 12, lineHeight: 1.2 },
    ctx: { color: "#5a4a30", fontSize: 14, lineHeight: 1.82, marginBottom: 14 },
    question: { color: "#2d3d1e", fontSize: 14, fontStyle: "italic", borderLeft: "3px solid #4a7c3f", paddingLeft: 13, lineHeight: 1.6 },
    choicesWrap: { marginTop: 20, display: "grid", gap: 10 },
    choiceBtn: (hov, sel) => ({
      background: sel ? "#eaf4e4" : hov ? "#f5f0e0" : "#fff8ec",
      border: `1.5px solid ${sel ? "#4a7c3f" : hov ? "#a0904a" : "#d4c9a4"}`,
      borderRadius: 6,
      padding: "14px 16px",
      cursor: "pointer",
      textAlign: "left",
      color: "#2d2416",
      transition: "all 0.15s",
      width: "100%",
      boxShadow: hov ? "0 2px 8px rgba(74,124,63,0.08)" : "none",
    }),
    cLabel: { fontFamily: "'DM Serif Display', serif", fontSize: 14, fontWeight: 400, marginBottom: 4, display: "block", color: "#1e2d14" },
    cDetail: { fontSize: 12.5, color: "#6b5e4a", lineHeight: 1.68, display: "block" },
    sciBtn: { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4a7c3f", marginTop: 8, cursor: "pointer", display: "inline-block", background: "none", border: "none", borderBottom: "1px dotted #4a7c3f", padding: 0, fontFamily: "'Lora', serif" },
    sciBox: { background: "#f0f7ec", border: "1px solid #c4dab8", borderRadius: 4, padding: "11px 13px", marginTop: 8, fontSize: 12.5, color: "#2d4a22", lineHeight: 1.7 },
    rippleBox: { background: "#fef9ec", border: "1px solid #e8d898", borderRadius: 4, padding: "10px 13px", marginTop: 6, fontSize: 12, color: "#6b5a20", lineHeight: 1.65, fontStyle: "italic" },
    narCard: {
      background: "#fff8ec",
      border: "1.5px solid #d4c9a4",
      borderRadius: 8,
      padding: "24px 26px 20px",
      marginTop: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    narEye: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8a7a5a", marginBottom: 12 },
    narText: { color: "#3d2f1a", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" },
    btn: { marginTop: 20, background: "#4a7c3f", color: "#f5f0e4", border: "none", borderRadius: 5, padding: "12px 26px", fontFamily: "'DM Serif Display', serif", fontSize: 14, cursor: "pointer", letterSpacing: "0.02em" },
    btnGhost: { background: "transparent", color: "#4a7c3f", border: "1.5px solid #4a7c3f", borderRadius: 5, padding: "10px 20px", fontFamily: "'DM Serif Display', serif", fontSize: 13, cursor: "pointer" },
    histWrap: { marginTop: 18, padding: "14px 18px", background: "#faf6e8", border: "1px solid #d4c9a4", borderRadius: 6 },
    histEye: { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a09060", marginBottom: 10, fontFamily: "'Lora', serif" },
    histItem: { fontSize: 12, color: "#8a7a5a", paddingLeft: 12, borderLeft: "2px solid #d4c9a4", marginBottom: 5, lineHeight: 1.55, cursor: "pointer" },
    resultWrap: {
      background: "#fff8ec",
      border: `2px solid ${outcome.color}55`,
      borderRadius: 10,
      padding: "36px 28px",
      marginTop: 24,
      textAlign: "center",
      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    },
    gradeCircle: {
      width: 72, height: 72, borderRadius: "50%",
      border: `2px solid ${outcome.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px",
      fontFamily: "'DM Serif Display', serif", fontSize: 32, color: outcome.color,
      background: outcome.color + "11",
    },
    introCard: { maxWidth: 620, margin: "0 auto 28px", padding: "24px 26px", background: "#fff8ec", border: "1.5px solid #d4c9a4", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  };

  return (
    <div style={c.page}>
      <style>{FONTS}</style>
      <div style={c.shell}>

        {/* HEADER */}
        <div style={c.header}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#8a7a5a", fontSize: 12, cursor: "pointer", marginBottom: 8, display: "block", margin: "0 auto 8px", fontFamily: "inherit" }}>← All Games</button>
          <span style={c.leafAccent}>🌿</span>
          <span style={c.eyebrow}>Local Climate Action · Community Simulation</span>
          <h1 style={c.h1}>What You Can Actually Do</h1>
          <p style={c.sub}>Five years. One suburban family. Real ripple effects. Grounded in actual research.</p>
        </div>

        {/* INTRO */}
        {phase === "intro" && (
          <>
            <div style={c.introCard}>
              <p style={{ ...c.ctx, marginBottom: 14 }}>
                You're a suburban homeowner and parent. You care about climate change. You've signed petitions, changed your lightbulbs, and felt the gap between those actions and the scale of what's needed.
              </p>
              <p style={{ ...c.ctx, marginBottom: 14 }}>
                This simulation puts you at the local level — where decisions about your school board, your neighborhood association, your block, and your household intersect with real, documented climate outcomes. Over five years, you'll make one major choice per year. Each is grounded in peer-reviewed research.
              </p>
              <p style={{ fontSize: 13, color: "#8a7a5a", fontStyle: "italic", lineHeight: 1.7 }}>
                The goal isn't to save the world alone. It's to understand the specific, surprising leverage that ordinary people actually have — and to feel what it's like to use it.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setPhase("decision")} style={c.btn}>Begin — Spring 2026 →</button>
            </div>
          </>
        )}

        {/* DASHBOARD */}
        {phase !== "intro" && (
          <div style={c.dashboard}>
            <div style={c.dashTop}>
              <span style={c.dashLabel}>Your Impact Dashboard</span>
              <span style={c.yearBadge}>{state.year}</span>
            </div>
            <div style={c.grid2}>
              <ImpactBar icon="🏠" label="Household Emissions" value={state.householdEmissions} min={2} max={15} goodDirection="low" unit=" t CO₂e" decimals={1} />
              <ImpactBar icon="👥" label="Neighbors Influenced" value={state.neighborhoodAdoption} min={0} max={80} goodDirection="high" unit="%" />
              <ImpactBar icon="🌳" label="Local Tree Canopy" value={state.localTreeCanopy} min={20} max={45} goodDirection="high" unit="%" decimals={1} />
              <ImpactBar icon="📚" label="School Climate Action" value={state.schoolEngagement} min={0} max={100} goodDirection="high" />
              <ImpactBar icon="🤝" label="Community Resilience" value={state.communityResilience} min={20} max={100} goodDirection="high" />
              <ImpactBar icon="✨" label="Personal Wellbeing" value={state.wellbeing} min={30} max={100} goodDirection="high" />
            </div>
          </div>
        )}

        {/* DECISION + NARRATIVE */}
        {(phase === "decision" || phase === "narrative") && (
          <>
            <div style={c.card}>
              <div style={c.cardEye}>{currentYear.label} of 5 · {currentYear.label === "Year One" ? "2026" : currentYear.label === "Year Two" ? "2027" : currentYear.label === "Year Three" ? "2028" : currentYear.label === "Year Four" ? "2029" : "2030"}</div>
              <h2 style={c.cardTitle}>{currentYear.title}</h2>
              <p style={c.ctx}>{currentYear.context}</p>
              <p style={c.question}>{currentYear.question}</p>
              <div style={c.choicesWrap}>
                {currentYear.choices.map(choice => (
                  <div key={choice.id}>
                    <button
                      style={c.choiceBtn(hoveredChoice === choice.id, selectedChoice?.id === choice.id)}
                      onMouseEnter={() => setHoveredChoice(choice.id)}
                      onMouseLeave={() => setHoveredChoice(null)}
                      onClick={() => handleChoiceSelect(choice)}
                      disabled={phase === "narrative"}
                    >
                      <span style={c.cLabel}>{choice.label}</span>
                      <span style={c.cDetail}>{choice.detail}</span>
                      <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button style={c.sciBtn} onClick={e => { e.stopPropagation(); setShowScience(showScience === choice.id + "_sci" ? null : choice.id + "_sci"); }}>
                          {showScience === choice.id + "_sci" ? "▲ hide research" : "▼ the research"}
                        </button>
                        <button style={{ ...c.sciBtn, color: "#a07030", borderBottomColor: "#a07030" }} onClick={e => { e.stopPropagation(); setShowScience(showScience === choice.id + "_rip" ? null : choice.id + "_rip"); }}>
                          {showScience === choice.id + "_rip" ? "▲ hide ripple" : "↗ ripple effect"}
                        </button>
                      </div>
                      {showScience === choice.id + "_sci" && <div style={c.sciBox}>{choice.science}</div>}
                      {showScience === choice.id + "_rip" && <div style={c.rippleBox}>↗ {choice.ripple}</div>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {phase === "narrative" && (
              <div ref={narrativeRef} style={c.narCard}>
                <div style={c.narEye}>
                  {isLoading ? "Writing your year..." : `Year in Review · ${selectedChoice?.label}`}
                </div>
                {isLoading
                  ? <p style={{ color: "#a09060", fontSize: 13, fontStyle: "italic" }}>Generating your story based on real local climate research...</p>
                  : <>
                    <div style={c.narText}>{narrative}</div>
                    <button onClick={handleNext} style={c.btn}>
                      {yearIndex >= YEARS.length - 1 ? "See Your Five-Year Legacy →" : `Advance to ${state.year} →`}
                    </button>
                  </>
                }
              </div>
            )}
          </>
        )}

        {/* TIMELINE / REWIND */}
        {history.length > 0 && phase !== "result" && (
          <div style={c.histWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={c.histEye}>Your Story So Far — click any year to rewind</div>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ marginBottom: 7 }}>
                {rewindConfirm === i ? (
                  <div style={{ background: "#fff8ec", border: "1px solid #c8a86a", borderRadius: 4, padding: "10px 13px" }}>
                    <p style={{ fontSize: 12, color: "#8a6020", marginBottom: 8, lineHeight: 1.5 }}>
                      Rewind to <strong>{h.year}</strong> and choose differently? Everything after this will be rewritten.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleRewindTo(i)} style={{ background: "#4a7c3f", color: "#f5f0e4", border: "none", borderRadius: 3, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Serif Display', serif" }}>
                        ↩ Rewind
                      </button>
                      <button onClick={() => setRewindConfirm(null)} style={{ background: "transparent", color: "#8a7a5a", border: "1px solid #d4c9a4", borderRadius: 3, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ ...c.histItem, display: "flex", justifyContent: "space-between", paddingRight: 6, borderLeftColor: "#c4d4a8" }}
                    onMouseEnter={e => e.currentTarget.style.borderLeftColor = "#4a7c3f"}
                    onMouseLeave={e => e.currentTarget.style.borderLeftColor = "#c4d4a8"}
                    onClick={() => setRewindConfirm(i)}
                  >
                    <span><strong style={{ color: "#6b8a4a" }}>{h.year} · {h.title}:</strong> {h.choice}</span>
                    <span style={{ fontSize: 10, color: "#a09060", flexShrink: 0, marginLeft: 10 }}>↩ rewind</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <div style={c.resultWrap}>
            <div style={c.gradeCircle}>{outcome.grade}</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px,3.5vw,28px)", color: outcome.color, marginBottom: 14 }}>
              {outcome.title}
            </h2>
            <p style={{ color: "#4a3820", fontSize: 14, lineHeight: 1.85, maxWidth: 520, margin: "0 auto 26px" }}>{outcome.summary}</p>

            <div style={{ background: "#f5f0e4", borderRadius: 6, padding: "18px 22px", textAlign: "left", maxWidth: 500, margin: "0 auto 22px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a5a", marginBottom: 14, fontFamily: "'Lora', serif" }}>Final State — 2030</div>
              <ImpactBar icon="🏠" label="Household Emissions" value={state.householdEmissions} min={2} max={15} goodDirection="low" unit=" t CO₂e" decimals={1} />
              <ImpactBar icon="👥" label="Neighbors Influenced" value={state.neighborhoodAdoption} min={0} max={80} goodDirection="high" unit="%" />
              <ImpactBar icon="🌳" label="Tree Canopy" value={state.localTreeCanopy} min={20} max={45} goodDirection="high" unit="%" decimals={1} />
              <ImpactBar icon="🤝" label="Community Resilience" value={state.communityResilience} min={20} max={100} goodDirection="high" />
            </div>

            <div style={{ textAlign: "left", maxWidth: 500, margin: "0 auto 24px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a5a", marginBottom: 12, fontFamily: "'Lora', serif" }}>Your Five-Year Story</div>
              {history.map((h, i) => (
                <div key={i} style={{ ...c.histItem, borderLeftColor: "#4a7c3f55", cursor: "default", marginBottom: 7 }}>
                  <strong style={{ color: "#4a7c3f" }}>{h.year}:</strong> {h.choice}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {history.map((h, i) => (
                <button key={i} onClick={() => handleRewindTo(i)} style={{ ...c.btnGhost, fontSize: 12, padding: "7px 14px" }}>
                  ↩ Rewind to {h.year}
                </button>
              ))}
              <button onClick={handleRestart} style={{ ...c.btnGhost, borderColor: "#c4b890", color: "#8a7a5a" }}>↺ Start Over</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
