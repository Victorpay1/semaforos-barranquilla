# Validating the traffic-signal analysis for Barranquilla

*[Versión en español](validation.md) (the Spanish text is the reference version).*

Data cut-off: 20 September 2026. This document explains, in plain language, where the map's data comes from, how it
was checked, and how far it can be trusted. The map's figures can be reproduced offline with `pnpm data`; the
evaluation and the test in section 4 are re-run with `scorer-jev/` (see "Reproduce the numbers" in the
[README](../README.en.md#reproduce-the-numbers)). Details are in `data/out/summary.json` (the `validation` block),
`data/out/reports/` and `scorer-jev/backtest-log.json`.

**What it is and what it isn't.** Colombia's Manual de Señalización Vial 2024 (chapter 4) requires traffic counts to
justify a traffic signal. This project has no traffic counts. The result is a **short, ranked list of junctions for
technical study**, each with evidence anyone can check. It is not a finding that a signal is warranted.

**What "the evaluation" is.** In this document, "the evaluation" is an AI decision model (Jev, by the company
TypeSafe, version `jev-1.13.0`, called through its paid API). Every junction gets the same three questions, filled in
with that junction's data; the exact questions are in `scorer-jev/src/questions.ts`. The answers are combined with
the project's own rules and with recorded crashes (section 5). It is a statistical model, not a traffic engineer.

## 1. Sources and dates

| Data | Source | Date |
| --- | --- | --- |
| Mapped streets, junctions and signals | OpenStreetMap (9,272 ways, 9,658 junctions, 1,223 signal nodes) | downloaded Sep 2026 |
| Official inventory of signalized junctions | Secretaría de Tránsito, datos.gov.co `svyb-d6ts` (342 points) | Sep/Oct 2023 version published by the Secretaría (datos.gov.co lists the rows as updated in Sep 2022; the content matches) |
| Road crashes | datos.gov.co `yb9r-2dsi`, police reports (IPAT; 28,523 records) | 2018 to Jun 2026 |
| Schools, health centres, markets, bus stops | OpenStreetMap, within 200 m of the junction | Sep 2026 |

## 2. Signals: checking against the official inventory

OpenStreetMap signal nodes less than 40 m apart are grouped into one "site" (a dual-carriageway junction has 2 to 8
nodes), and each official point is joined to the nearest site (up to 80 m). Each site marks **one junction** as
signalized; small junctions right next to it (67) are marked *covered*: they are not counted separately and are never
proposed for a signal. This fixed an earlier over-count (422).

- **361 signalized junctions** on the map, against 342 in the inventory (341 inside OSM's municipal boundary;
  Circunvalar × Ventana al Mundo falls outside).
- **339 of 341 official points (99 %)** have an OSM signal within 80 m. For 315 of the 317 points whose official name
  could be read as "calle × carrera", the name matches the streets of the assigned junction.
- In the inventory but not in OSM (2): Calle 30 × Carrera 21B and Calle 106 × Carrera 65A (preventive, 2023). They
  are treated as signalized.
- In OSM but not in the inventory: 31 sites, 25 of them on a road junction. They include three of the four signals the
  city installed in April 2026 (Calle 98 × Cra 57, Calle 99 × Cra 57, Calle 41 × Cra 8); the fourth
  (Cordialidad × Cra 27) could not be located on the map. The rest are installations after 2023, signalized mid-block
  pedestrian crossings, or parts of a large junction (e.g. Calle 30/34 × Carrera 46) that the inventory counts
  differently. They were not checked in the field.
- The difference 361 − 341 = +25 (OSM only) − 5 (official points with no junction of their own on the map, or sharing
  one).

## 3. Crashes: how they were assigned to junctions

The dataset has **no coordinates, only a written address**. Street naming was normalised (CL/CLL/CALLE,
CR/CRA/KR/CARRERA, suffixes such as 21B or "SUR", Murillo = Calle 45, Olaya Herrera = Carrera 46, Calle 110 =
Circunvalar, Vía 40, Cordialidad, Av. del Río), and a record is assigned only when the address names **exactly two
streets** and the map has **exactly one junction** of those two streets (both carriageways of an avenue count as the
same junction). Door addresses ("CL 87 9H 24"), stretches ("between… and…", "in front of…") and ambiguous cases are
discarded: an unassigned record is better than a misassigned one.

- **18,798 of 28,523 records assigned (65.9 %)**; among those written as a junction, 82.1 %.
- Unassigned: 3,676 door addresses, 1,047 stretches, 3,243 junctions that don't exist on the map under that name
  (mostly Circunvalar interchanges), 841 ambiguous, 918 unreadable. A random sample of 30 assignments from v0.1.0 was checked by
  hand: all 30 are consistent; one relies on an alias taken from OSM (Carrera 6 = Cordialidad).
  The reproducible sample in `data/out/reports/crash-match.json` is regenerated when assignments change.
- **Period used: 2018–2022.** From 2023 the records stopped including damage-only crashes (4,128 in 2018, 6 in 2023),
  while crashes with victims held steady (1,100–1,800 a year). To avoid mixing two recording rules, counts and
  rankings use 2018–2022 (15,094 assigned records); crashes with victims in 2023–2025 are shown separately.
- Junctions that **already have a signal** have many more crashes (median 10) than those without (median 0), because
  more traffic goes through them. That is why crashes are read as **a sign of conflict and exposure, not as proof that
  a signal is missing**.

## 4. The key test: would the analysis have flagged the junctions the city already signalized?

**Design.** The 334 signalized junctions confirmed by both sources were each described *as if their own signal did not
exist* (distance to the nearest other signal; everything else unchanged), and evaluated with the same three questions
as the rest of the city. For contrast, 400 quiet junctions (local street × local street, at random) and 300 unsignalized
junctions on collector or arterial roads were evaluated too. The signalized junctions were split into two fixed
halves: one to tune questions and thresholds (161), and the other, **never used for tuning, to report results (173)**.

**Results on the reporting half** (threshold 0.7, chosen on the tuning half with a rule fixed in advance: the lowest
threshold that flags no quiet junction and best separates signalized from unsignalized junctions):

| Evaluation threshold | Already-signalized junctions flagged | Quiet junctions flagged | Unsignalized junctions on main roads flagged |
| --- | --- | --- | --- |
| 0.5 | 79 % | 1.1 % | 19 % |
| 0.6 | 75 % | 0.5 % | 19 % |
| **0.7 (chosen)** | **69 %** | **0 %** | **18 %** |
| 0.8 | 56 % | 0 % | 10 % |

- The evaluation rates the need as high or critical for 77 % of already-signalized junctions and 1 % of quiet ones; it
  recommends a signal for 83 % and 2 %, respectively.
- **In plain words: of every 10 junctions the city already signalized, the evaluation would have flagged 7, and of
  every 100 quiet junctions, none.** With the full shortlist rules (section 5), which are stricter, 5 in 10 would have
  ended up *priority* or *recommended* and 7 in 10 with some alert; of 189 quiet junctions, none made the shortlist.
- An extra check, outside any tuning: of the 25 signalized junctions missing from the 2023 inventory, the evaluation
  flags 60 %, including the three installed in 2026 (whose 2018–2022 crashes predate the signal).

**What had to be fixed.** The first version of the questions flagged only 1 % to 3 % of already-signalized junctions,
because it assumed signals should not be less than 300 m apart; in Barranquilla, 58 % of signalized junctions have
another one within 150 m (that rule in the Manual only applies to signals justified by coordination). That premise
was corrected, the main road and the crossing street were described separately, and the distance to the next signal
along the same road and the crash level were added. Three variants were tried; all are logged.

**Independence warning.** The evaluation that sees crashes almost always agrees with "5 or more crashes on a collector
road". So that agreement between signals means something, a second evaluation was run **without showing it the
crashes** (it flags 51 % of signalized junctions and 0 % of quiet ones), and the top tiers require both to agree.

## 5. How the tiers are defined

| Tier | Junctions | Conditions |
| --- | --- | --- |
| **Priority** (*prioritario*) | 51 | The evaluation recommends a signal above the threshold, **also without seeing the crashes**; there is a collector or arterial road; the junction is at grade (not a roundabout, ramp, bridge or fork) and has no signal on the same block (< 80 m); and 2018–2022 crashes are ≥ 15 (more than three in four already-signalized junctions) or ≥ 9 (their median) with a school or health centre within 200 m or more than 600 m without a signal along the main road. Also: at least 94 m from another signal, a crossing street that is not a minor or industrial access, and only one junction per 120 m. |
| **Recommended** (*recomendado*) | 131 | The evaluation and the road-hierarchy rules agree, and either the crash-blind evaluation also agrees or there are ≥ 15 crashes. |
| **Under observation** (*observación*) | 293 | Only one signal: the evaluation depends only on crashes, or there is no collector road, or there are many crashes but a cheaper measure is suggested (stop sign, speed humps, roundabout), which is shown as the recommendation. |
| No action | 8,822 | Everything else, including the 67 junctions covered by an adjacent signal. |
| Signalized | 361 | Official inventory and/or OSM. |

The two carriageways of one junction never appear twice. The priority list was reviewed by hand: none carries the name
of a junction in the official inventory, and none is on a roundabout, ramp or grade separation. The evidence shown for
each junction is checkable fact (crashes, road hierarchy, distances, nearby facilities).

## 6. Limitations

- **There are no traffic counts.** The Manual requires 8-hour volumes averaged over three days. Nothing shown here
  replaces them: it is a list for deciding **where to count first**.
- **Crashes.** Under-reporting (especially minor crashes, and since 2023 they are not recorded); written address only,
  no coordinates; a third of the records could not be assigned, and Circunvalar junctions and interchanges are
  under-represented. A high count may simply reflect heavy traffic. Some very repeated addresses might be a "default"
  address (e.g. Calle 31 × Carrera 24, 62 records at a local junction): not verified.
- **The test measures similarity to what is already signalized**, not engineering justification: if the city
  installed signals where they weren't needed, the analysis inherits that practice. Crashes at signalized junctions
  happened with the signal in place, which can help or hurt the comparison.
- **OpenStreetMap.** Road classes are an approximation (almost half of signalized junctions have a crossing street
  tagged "residential"); lanes are mapped at 99.6 % of junctions on main roads but only 73 % overall; schools and
  health centres may be missing. Recent signals may not be mapped yet: every candidate must be confirmed in the field.
- **The official inventory dates from Sep/Oct 2023**; the figure of 351 (Feb 2026) could not be read at the source.
- **The simulation of each junction is illustrative.** The geometry (approaches, lanes, directions) is real, but
  traffic volumes are typical values per road class and stop-sign behaviour is calibrated on studies from other
  countries, not measured in Barranquilla. See [`simulation.md`](simulation.md).
- **Type of control.** The evaluation almost never distinguishes a pedestrian signal from a vehicle signal; that is
  for the study to decide. The evaluation is a statistical decision model, not an engineer: it gets it right 7 times
  out of 10 in the test, not 10 out of 10.
