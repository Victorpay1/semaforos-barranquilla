# Semáforos de Barranquilla

[Español](README.md) · **English**

An open map of the streets and traffic signals of Barranquilla, Colombia, with the junctions worth studying first for
a possible new signal.

### [Open the map → semaforos-baq.vercel.app](https://semaforos-baq.vercel.app)

<p align="center">
  <img src="docs/assets/screenshot-desktop.png" alt="The Barranquilla map on a computer: red, orange and green dots over the streets, with the junction list on the left" width="720">
  &nbsp;
  <img src="docs/assets/screenshot-mobile.png" alt="The same map on a phone" width="200">
</p>

> **An independent, citizen-made project.** It is not run by the Alcaldía de Barranquilla (the city government) or
> its Secretaría de Tránsito (transit department). The junction list was produced with the help of artificial
> intelligence. It is a signal for prioritizing technical studies, not an engineering verdict.

The site and most of the docs are in Spanish. This page summarizes everything in English; the methodology is also
available in English in [`docs/validation.en.md`](docs/validation.en.md).

## Why it exists

I spent my childhood in Barranquilla, and recently came back for a few weeks with my family. I stayed near the
Malecón, the riverfront promenade, and went out walking a lot, which meant crossing the Vía 40. Even with road-safety
staff directing traffic, crossing it on foot is really hard. And driving around the city, I kept finding junctions
where you'd expect a traffic light.

So I built this map with artificial intelligence and public data, and talked about it in
[a video on Instagram](https://www.instagram.com/victorpay/reel/Dd7fbzqg02_/) (in Spanish). I said I would share it so
people could contribute to it or use it as a base to build something better. This repository is that: the code, the
data and the method, in the open.

I'm not a politician, and the point isn't to sell this project to the city. It's to show what open data and AI make
possible, and to let anyone with better data improve it.

— Victor Pay ([@victorpay](https://www.instagram.com/victorpay/))

## What it is and what it isn't

- **It is** a map of Barranquilla's 9,658 junctions, showing the 361 that already have a signal and a ranked list of
  junctions worth studying first.
- **It is not** a finding that a signal is needed. Colombia's Manual de Señalización Vial 2024 (chapter 4) requires
  traffic counts to justify a signal, and this project has none. What it offers is a way to decide **where to do
  those studies first**.
- **It is not** official, and no public body endorses it.

In the video I said the red dots are where a signal "is needed". The precise version: they are the junctions where
the most indicators agree, and where the technical study is worth doing first.

## In numbers

Data cut-off: **20 September 2026**.

| On the map | Tier | Junctions |
| --- | --- | ---: |
| 🔴 Study first (*Estudiar primero*) | Priority (*Prioritario*) | **51** |
| 🟠 Study later (*Estudiar después*) | Recommended (*Recomendado*) | **131** |
| 🟡 Keep an eye on (*Hacer seguimiento*) | Under observation (*En observación*) | **293** |
| 🟢 Already signalized (*Ya tiene semáforo*) | With signal (*Con semáforo*) | **361** |

Base: 9,272 streets and 9,658 junctions from OpenStreetMap; 28,523 crashes recorded by the police between 2018 and
June 2026, of which 18,798 could be placed at a junction.

## How to read the map

- Colors are the tiers in the table above. Yellow dots (under observation) start hidden: tap "En observación" in the
  list to show them. On a phone, the list and legend sit behind the "☰ Cruces" button.
- Tap a dot to open the junction card: the streets, the measure suggested for study (e.g. *Semáforo vehicular*,
  a vehicle signal), whether all indicators agree, and the **evidence**: facts you can check, such as "24 crashes
  recorded 2018–2022, 6 with injuries" or "nearest signal 605 m away along the Vía 40".
- The card also has Google's Street View, satellite and map views, so you can look at the junction without going
  there.
- "Ver simulación" opens an animation of the junction today, with a stop sign, and with a signal. It is
  **illustrative**: the junction's layout is real, but the traffic volumes are assumed, because there are no traffic
  counts ([details](docs/simulation.md)).

**Spotted a mistake?** If a signal is missing or shouldn't be there, or a candidate makes no sense once you see it on
the street, tell us with the [data correction form](https://github.com/Victorpay1/semaforos-barranquilla/issues/new/choose).
A photo you took or a Street View link helps a lot.

## How it was made, in plain words

1. **Streets and signals** come from [OpenStreetMap](https://www.openstreetmap.org), the free map built by
   volunteers. Junctions were built from them (both carriageways of an avenue count as one junction).
2. **Checked against the official inventory.** Of the 341 signals in the transit department's inventory, 339 were
   already in OpenStreetMap.
3. **Crashes.** The police records the city publishes have a written address ("CL 72 CR 46"), not coordinates. A
   record was placed at a junction only when the address names exactly two streets and only one junction has those
   names: 66 % of records.
4. **AI evaluation.** Each junction without a signal is described to an AI decision model (Jev, by TypeSafe): which
   streets cross, how many lanes they have, how far the nearest signal is, how many crashes there were, whether
   schools or hospitals are nearby. The model answers three questions: how much the junction needs an intervention,
   how likely a signal is to be justified, and which measure it would choose. Then it is asked again **without seeing
   the crashes**, for an independent second opinion.
5. **The project's own rules.** A junction is *priority* only if the model recommends a signal even without seeing the
   crashes, a collector or arterial road is involved, it is an at-grade junction (not a roundabout or a bridge), there
   is no signal on the same block, and on top of that it has many crashes, or a school or health centre nearby, or a
   long stretch without a signal.

**How reliable is it?** It was tested on junctions the city has already signalized, describing them to the model as if
they had no signal. **Of every 10, the evaluation would have flagged 7; of every 100 quiet junctions, none.** (That is
173 signalized and 189 quiet junctions that were never used for tuning; the threshold was chosen on the other half.)

This measures how closely the evaluation matches what the city has already done, not whether each signal is
technically justified. The full methodology, with every number, is in
[`docs/validation.en.md`](docs/validation.en.md).

## Artificial intelligence: what was used, and for what

- **To write the code.** Much of the code was written by AI coding agents following Victor's instructions. The brief
  they worked from is published in [`docs/history/agent-contract.md`](docs/history/agent-contract.md).
- **To evaluate junctions.** The project uses **Jev**, a decision model from the company **TypeSafe** (version
  `jev-1.13.0`), through its paid API. Its answers are combined with the project's own rules and with crash records;
  the model does not decide on its own. The exact questions are in
  [`scorer-jev/src/questions.ts`](scorer-jev/src/questions.ts), and how they are used in
  [`scorer-jev/README.md`](scorer-jev/README.md). TypeSafe does not endorse this project.
- **You don't need a key for anything else.** The evaluation results are committed, so the map and the data rebuild
  work without paying anything. Only re-scoring junctions needs a TypeSafe key.
- **The model's full answers** (about 23,000, with their probabilities) are not published yet, until TypeSafe confirms
  they can be redistributed.

## Limitations

- **No traffic counts.** Without them, none of the Manual 2024 conditions can be demonstrated. This is a list for
  deciding where to count first.
- **Crash data is incomplete.** There is under-reporting; since 2023, damage-only crashes are no longer recorded; a
  third of the records could not be placed, especially on the Circunvalar ring road and at interchanges. Many crashes
  can also simply mean a lot of traffic.
- **OpenStreetMap is an approximation.** Each road's class is the mappers' estimate; schools, health centres or recent
  signals may be missing. Every candidate needs to be confirmed on the street.
- **The official inventory dates from Sep/Oct 2023.** Signals installed later only show up if they are already in
  OpenStreetMap.
- **The model is statistical.** In the test it flags 7 out of 10 junctions that already have a signal, not 10 out of 10, and it almost never tells a
  pedestrian signal from a vehicle signal; that call belongs to the technical study.
- **The simulation is illustrative.** Its traffic volumes are assumed, so its figures are good for comparing the two
  views, but they don't describe what happens at that junction today.

Details in [`docs/validation.en.md`, section 6](docs/validation.en.md#6-limitations).

## Data, sources and licenses

| Source | What it provides | License |
| --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Streets, junctions, signals, schools, health centres, bus stops | ODbL 1.0 |
| Alcaldía Distrital de Barranquilla, "Accidentalidad en Barranquilla", [datos.gov.co `yb9r-2dsi`](https://www.datos.gov.co/d/yb9r-2dsi) | Road crashes 2018–2026 | CC BY-SA 4.0 |
| Alcaldía Distrital de Barranquilla, "Semaforización en Barranquilla", [datos.gov.co `svyb-d6ts`](https://www.datos.gov.co/d/svyb-d6ts) | Official signal inventory | CC BY-SA 4.0 |
| Jev, by [TypeSafe](https://typesafe.ai) | Evaluation of each junction (AI-generated) | published under the ODbL with the database |
| [OpenFreeMap](https://openfreemap.org) © [OpenMapTiles](https://openmaptiles.org) | Basemap | OpenStreetMap data |
| Manual de Señalización Vial 2024, Colombian Ministry of Transport | Criteria for installing signals | reference |

Derived data is published under the **ODbL 1.0**; files that re-publish the Alcaldía's data keep their **CC BY-SA
4.0** license. Google Maps views are only linked and embedded: no Google data is copied. What each file contains, where
it comes from and how current it is: [`data/README.md`](data/README.md). Licenses per file:
[`data/LICENSE.md`](data/LICENSE.md). On the site, the
[Licencias y créditos](https://semaforos-baq.vercel.app/licencias) page sums it up (in Spanish).

The Alcaldía de Barranquilla, the OpenStreetMap Foundation and TypeSafe do not endorse this project.

## Quick start

You need [Node 24 LTS](https://nodejs.org) and Git.

```sh
git clone https://github.com/Victorpay1/semaforos-barranquilla.git
cd semaforos-barranquilla
nvm use              # or install Node 24 yourself
corepack enable      # turns on the project's pnpm version
pnpm install
pnpm dev             # opens http://localhost:3000
```

No key or account needed.

| Command | What it does | Network | Cost |
| --- | --- | --- | --- |
| `pnpm dev` | The site in development mode | basemap only | — |
| `pnpm build` | Builds the site | — | — |
| `pnpm test` / `pnpm lint` / `pnpm typecheck` | Checks | — | — |
| `pnpm data` | Rebuilds the map data from `data/raw/` | — | — |
| `pnpm run fetch --force` | Downloads OpenStreetMap and the crash records again | yes | — |
| `pnpm score` | Re-scores junctions with Jev (`TYPESAFE_API_KEY` in `scorer-jev/.env`) | yes | **paid** |

## How it's built

Three packages in one repository:

```
OpenStreetMap ─┐
datos.gov.co ──┴─► pipeline/ ──► data/out/ ──► web/public/data/ ──► web/ (the map)
                       ▲             │
                       └─ scorer-jev/ ◄┘   (Jev evaluation: optional, paid)
```

- [`pipeline/`](pipeline/): downloads the data, builds junctions, applies the rules and produces the map files.
- [`scorer-jev/`](scorer-jev/): asks the Jev model its questions and runs the test against already-signalized
  junctions.
- [`web/`](web/): the site, built with Next.js and MapLibre GL. It is static: no server of its own, no accounts, no
  first-party cookies.

More in [`docs/architecture.md`](docs/architecture.md); field definitions in
[`docs/data-schema.md`](docs/data-schema.md).

## Reproduce the numbers

```sh
pnpm data
```

Rebuilds everything from the download stored in `data/raw/`, offline, in seconds. At the end, the check prints the
count per tier: you should see `prioritario=51`, `recomendado=131`, `observacion=293` and `semaforizado=361`. If you
change anything in the pipeline, those numbers tell you what changed.

```sh
pnpm run fetch --force    # download OpenStreetMap and the crash records again
```

Without `--force`, the script only downloads what's missing from `data/raw/`. A fresh download gives different
results, because OpenStreetMap changes every day.

Re-scoring with the model is optional and costs money (for Barranquilla, around one US dollar from scratch). Put your
`TYPESAFE_API_KEY` in `scorer-jev/.env`, plus `JEV_MODEL=jev-1.13.0` if you want the same model version that produced
the published results. Start with the estimate, which makes no network call:

```sh
pnpm --filter @semaforos/scorer-jev dry-run   # what would be sent and what it would cost, offline
pnpm score                                    # main evaluation
pnpm score --variant nocrash --collector-only # second opinion, without crashes
pnpm --filter @semaforos/scorer-jev backtest --variant v3 --choose --role main
pnpm --filter @semaforos/scorer-jev backtest --variant v3nc --choose --role blind
pnpm data
```

Never run `pnpm score` in CI. Details and costs in [`scorer-jev/README.md`](scorer-jev/README.md).

## Bring better data

As I said in the video: surely an official, or whoever is in charge of traffic signals, has far more complete data
than what can be found online. This is what would improve the map most:

- **Traffic counts** (*aforos*) with the junction's location. They are what the Manual requires.
- **An updated signal inventory.** The one in the open-data portal dates from 2023.
- **Crash records with coordinates** instead of written addresses.
- **Signals installed or under study** since 2023.
- **Transmetro (bus rapid transit) routes and stops** in an open format (GTFS).

If you work for a public body and want to use the list to decide where to count traffic first, or if you have any of
this data, open an issue or send a direct message to [@victorpay](https://www.instagram.com/victorpay/). We can only
publish data that has an open license or written permission to publish it.

## Adapt it to your city

Not just Barranquilla: any city whose streets are in OpenStreetMap can have its own version. You change the study
area, the municipal boundary, the signal inventory, the crash data source and how its addresses are read, and the
city description the model receives. Today, without the AI evaluation, the candidate list comes out empty; an open
scorer that needs no key is on the roadmap.

The step-by-step guide (in Spanish, with an English summary) is in
[`docs/adapta-tu-ciudad.md`](docs/adapta-tu-ciudad.md). Give your version a different name (see
[`TRADEMARKS.md`](TRADEMARKS.md)), and if you like, tell us with the
[adapt-to-my-city form](https://github.com/Victorpay1/semaforos-barranquilla/issues/new/choose).

## How to contribute

You don't need to code. You can report wrong data, add a missing signal to OpenStreetMap, check candidates in Street
View or translate the docs. If you code, look for issues labelled `good first issue`.

Two open challenges for anyone who wants something bigger:

- **An open scorer** that doesn't depend on a paid model and beats the current test: flag more than 7 in 10
  already-signalized junctions while flagging no quiet junction.
- **Joining the transit department's traffic counts** (Excel files per junction, without coordinates) to the map's
  junctions.

Everything is in [`CONTRIBUTING.md`](CONTRIBUTING.md#english). Every commit is signed off with `git commit -s` (DCO).
By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md) (the official Spanish translation of the
Contributor Covenant 2.1). For security issues, see [`SECURITY.md`](SECURITY.md#english).

## Roadmap

These are ideas, with no committed dates; anyone can pick one up.

Next:

- An open scorer (no key) for other cities and for comparison with Jev.
- A "report an error at this junction" button on each junction card.
- Download the candidate list as CSV.
- Direct links to a junction, for sharing.

Later:

- Bring in traffic counts and an updated signal inventory.
- Refresh the data regularly, logging every change in [`CHANGELOG.md`](CHANGELOG.md).
- Neighbouring municipalities in the metro area (Soledad, Puerto Colombia) and other cities.
- Publish the model's full answers, if TypeSafe allows it.

## Credits

- Idea, direction and maintenance: Victor Pay ([@victorpay](https://www.instagram.com/victorpay/)).
- Street and signal data: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Crash records and signal inventory: Alcaldía Distrital de Barranquilla and its Secretaría de Tránsito y Seguridad
  Vial, on the open-data portal [datos.gov.co](https://www.datos.gov.co).
- Basemap: [OpenFreeMap](https://openfreemap.org) © [OpenMapTiles](https://openmaptiles.org).
- Evaluation: the Jev model by [TypeSafe](https://typesafe.ai), used through its API.
- Built with [MapLibre GL JS](https://maplibre.org) and [Next.js](https://nextjs.org).
- Research sources (Manual de Señalización Vial 2024, MUTCD, studies of driver behaviour at junctions) are cited in
  [`docs/research/`](docs/research/) (in Spanish).

## License

*Semáforos de Barranquilla was created by Victor Pay. The code is open source under Apache 2.0, the data is under ODbL
1.0 (© OpenStreetMap contributors; includes Alcaldía de Barranquilla data via datos.gov.co) and the docs are under CC
BY 4.0. You may use, improve and build on it, commercially too, as long as you credit the original project. The name
and logo are not covered by these licenses (see [`TRADEMARKS.md`](TRADEMARKS.md)), and the only official site is
https://semaforos-baq.vercel.app.*

| What | License | File |
| --- | --- | --- |
| Code | Apache-2.0 | [`LICENSE`](LICENSE), [`NOTICE`](NOTICE) |
| Data derived from OpenStreetMap | ODbL 1.0 | [`data/LICENSE.md`](data/LICENSE.md) |
| Re-published Alcaldía data (crashes per junction, official inventory) | CC BY-SA 4.0 | [`data/LICENSE.md`](data/LICENSE.md) |
| Documentation | CC BY 4.0 | [`docs/LICENSE.md`](docs/LICENSE.md) |
| Name and logo | not licensed | [`TRADEMARKS.md`](TRADEMARKS.md) |

## How to cite

GitHub shows "Cite this repository" from [`CITATION.cff`](CITATION.cff). In text:

> Pay, V. (2026). *Semáforos de Barranquilla* (version 0.1.0) [Software and database].
> https://github.com/Victorpay1/semaforos-barranquilla

For the press: you may use screenshots of the map with the credit "Semáforos de Barranquilla / Victor Pay · ©
OpenStreetMap contributors". How to cite the data alone: [`data/README.md`](data/README.md#english-summary).
