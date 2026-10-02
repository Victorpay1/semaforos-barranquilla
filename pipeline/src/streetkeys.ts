/**
 * Street-name normalisation shared by the OSM side (way names / alt names) and the crash-record side
 * (free-text addresses from datos.gov.co yb9r-2dsi). Both are reduced to compact keys:
 *
 *   "Calle 72" / "CL 72" / "CLLE 72"            → CL72
 *   "Carrera 21B" / "CRA 21 B" / "KR 21B"       → CR21B
 *   "Carrera 9 Sur" / "CR 9 SUR"                → CR9S
 *   "Diagonal 83" → DG83, "Transversal 44" → TV44
 *   "Vía 40" → VIA40, "Avenida Circunvalar" = "Calle 110" (its nomenclature number, which is how crash reports
 *   usually call it) → CIRCUNVALAR, "Avenida Murillo" → CL45, "Avenida Olaya Herrera" → CR46,
 *   "Cordialidad" → CORDIALIDAD, "Avenida del Río" → AVRIO
 *
 * Conservative by design: anything that does not parse cleanly yields no key and therefore never matches.
 */

export const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export const normText = (s: string) =>
  stripAccents(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TYPE: Record<string, string> = {};
for (const w of ["CL", "CLL", "CLLE", "CALLE", "CALL", "CALE", "CLE", "CLL"]) TYPE[w] = "CL";
for (const w of ["CR", "CRA", "KR", "KRA", "CARRERA", "CARERRA", "CARERA", "CARREA", "CARRER", "CRR", "KRR", "K", "KRA"]) TYPE[w] = "CR";
for (const w of ["DG", "DIAG", "DIAGONAL"]) TYPE[w] = "DG";
for (const w of ["TV", "TR", "TRANSV", "TRANSVERSAL", "TRANS"]) TYPE[w] = "TV";

const NUM = /^(\d{1,3})([A-Z]{0,2}|[A-Z]{1,2}\d)$/;
const NUM_SUR = /^(\d{1,3})([A-Z]?)SUR$/;
/** Letters that may appear as a detached suffix ("CALLE 70 B"). N (= número) and Y (= "and") are excluded. */
const SUFFIX_LETTER = /^[A-MO-X]$/;

/** Named roads → key(s). Order matters: first match wins. */
const NAMED: Array<{ re: RegExp; keys: string[] }> = [
  { re: /CIRCUNVALAR DE LA PROSPERIDAD|AUTOPISTA CIRCUNVALAR/, keys: ["PROSPERIDAD"] },
  { re: /CIRCUN?A?VALAR|CIRCUNVALACION/, keys: ["CIRCUNVALAR"] },
  { re: /MURILLO/, keys: ["CL45"] },
  { re: /OLAYA HERRERA/, keys: ["CR46"] },
  { re: /CORDIALIDAD/, keys: ["CORDIALIDAD"] },
  { re: /^(AV|AVENIDA|AVDA) DEL RIO|^GRAN MALECON|^MALECON/, keys: ["AVRIO"] },
  { re: /^VIA 40$|^VIA40$/, keys: ["VIA40"] },
];

/** Parse "<TYPE> <num>[letters] [letter] [BIS] [SUR]" at tokens[i]. Returns key and next index, or null. */
function parseNumbered(tokens: string[], i: number, osmSide = false): { key: string; next: number } | null {
  const t = TYPE[tokens[i]];
  if (!t) return null;
  const ms = NUM_SUR.exec(tokens[i + 1] ?? "");
  if (ms) return { key: `${t}${Number(ms[1])}${ms[2]}S`, next: i + 2 };
  const m = NUM.exec(tokens[i + 1] ?? "");
  if (!m) return null;
  let j = i + 2;
  let letters = m[2];
  // In addresses, X before another road is a crossing connector. Keep real X suffixes
  // in OSM names, before an explicit CON, or before a door number.
  const next = tokens[j + 1] ?? "";
  const xConnector = !osmSide && tokens[j] === "X" && (
    Boolean(TYPE[next]) || /^(AV|AVENIDA|AVDA|AVENIDAD|VIA|VIA40)$/.test(next) || NAMED.some((n) => n.re.test(next))
  );
  if (!letters && !xConnector && SUFFIX_LETTER.test(tokens[j] ?? "")) letters = tokens[j++];
  // OSM sub-numbered streets: "Carrera 26B 2" (crash side writes "CR 26B2"; a detached digit there is a door number)
  if (osmSide && /^[A-Z]{1,2}$/.test(letters) && /^\d$/.test(tokens[j] ?? "") && j === tokens.length - 1) letters += tokens[j++];
  if (tokens[j] === "BIS") j++; // ignored: OSM rarely carries it
  let sur = "";
  if (tokens[j] === "SUR") { sur = "S"; j++; }
  return { key: canon(`${t}${Number(m[1])}${letters}${sur}`), next: j };
}

/** "Calle 110" is the nomenclature number of the Avenida Circunvalar (crash reports use it for the whole avenue, and
 *  OSM also maps its service road as "Calle 110"): one road, one key. */
function canon(key: string): string {
  return key === "CL110" ? "CIRCUNVALAR" : key;
}

/** Keys for one OSM name or alt_name value (may contain several names separated by ';'). */
export function keysFromOsmName(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const out = new Set<string>();
  for (const part of raw.split(";")) {
    const s = normText(part);
    if (!s) continue;
    const named = NAMED.find((n) => n.re.test(s));
    if (named) named.keys.forEach((k) => out.add(k));
    const tokens = s.replace(/^(AVENIDA|AV|AVDA|BOULEVARD) (?=(CALLE|CARRERA|DIAGONAL|TRANSVERSAL) )/, "").split(" ");
    const p = parseNumbered(tokens, 0, true);
    if (p && p.next === tokens.length) out.add(p.key);
  }
  return [...out];
}

export type AddressParse =
  | { kind: "junction"; a: string; b: string }
  | { kind: "door" | "between" | "single" | "other"; a?: string };

const CONNECTORS = new Set(["CON", "X", "ESQUINA", "ESQ", "CRUCE", "BARRANQUILLA", "CON LA", "LA", "DE", "INTERSECCION"]);
const BETWEEN = new Set(["Y", "ENTRE", "FRENTE", "KM", "KILOMETRO", "MTS", "METROS", "AL", "DIAGONAL A", "CERCA", "ANTES", "DESPUES"]);

/** Parse a crash-record address. Only an address that names exactly two streets and nothing else is a junction. */
export function parseCrashAddress(raw: string): AddressParse {
  const s = normText(raw);
  if (!s) return { kind: "other" };
  const tokens = s.split(" ");
  const refs: string[] = [];
  let leftoverNum = false, leftoverWord = false, between = false;
  let i = 0;
  while (i < tokens.length) {
    const tk = tokens[i];
    const p = parseNumbered(tokens, i);
    if (p) { refs.push(p.key); i = p.next; continue; }
    if (tk === "VIA" && tokens[i + 1] === "40") { refs.push("VIA40"); i += 2; continue; }
    if (tk === "VIA40") { refs.push("VIA40"); i++; continue; }
    // named avenues: consume "AV|AVENIDA" + known word(s)
    if (tk === "AV" || tk === "AVENIDA" || tk === "AVDA" || tk === "AVENIDAD") {
      const rest = tokens.slice(i + 1, i + 4).join(" ");
      if (/^CIRCUN?A?VALAR|^CIRCUNVALACION/.test(rest)) { refs.push("CIRCUNVALAR"); i += 2; continue; }
      if (/^MURILLO/.test(rest)) { refs.push("CL45"); i += 2; continue; }
      if (/^(DE )?LA CORDIALIDAD/.test(rest)) { refs.push("CORDIALIDAD"); i += rest.startsWith("DE") ? 4 : 3; continue; }
      if (/^CORDIALIDAD/.test(rest)) { refs.push("CORDIALIDAD"); i += 2; continue; }
      if (/^OLAYA HERRERA/.test(rest)) { refs.push("CR46"); i += 3; continue; }
      if (/^DEL RIO/.test(rest)) { refs.push("AVRIO"); i += 3; continue; }
      if (TYPE[tokens[i + 1] ?? ""]) { i++; continue; } // "AVENIDA CALLE 30"
      if (tokens[i + 1] === "110") { refs.push("CIRCUNVALAR"); i += 2; continue; } // "AV 110" = Circunvalar
      if (tokens[i + 1] === "VIA" && tokens[i + 2] === "40") { i++; continue; }
      leftoverWord = true; i++; continue;
    }
    if (/^CIRCUN?A?VALAR$|^CIRCUNVALACION$/.test(tk)) { refs.push("CIRCUNVALAR"); i++; continue; }
    if (tk === "MURILLO") { refs.push("CL45"); i++; continue; }
    if (tk === "CORDIALIDAD") { refs.push("CORDIALIDAD"); i++; continue; }
    if (BETWEEN.has(tk)) { between = true; i++; continue; }
    if (CONNECTORS.has(tk)) { i++; continue; }
    if (/^\d/.test(tk)) leftoverNum = true; else leftoverWord = true;
    i++;
  }
  if (between) return { kind: "between", a: refs[0] };
  if (refs.length === 2 && !leftoverNum && !leftoverWord && refs[0] !== refs[1]) {
    return { kind: "junction", a: refs[0], b: refs[1] };
  }
  if (refs.length >= 1 && leftoverNum && !leftoverWord) return { kind: "door", a: refs[0] };
  if (refs.length === 1 && !leftoverNum && !leftoverWord) return { kind: "single", a: refs[0] };
  return { kind: "other", a: refs[0] };
}

/** Display form of a key, for reports. */
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
