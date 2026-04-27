/**
 * Race data table.
 * Source: Excel (Ficha Anima v8.7.0) — Tabla general de Características Raciales.
 * 21 races with stat modifiers, resistance bonuses, level adjustment, and gnosis.
 *
 * Gnosis is 0 for all playable races (manual field for supernatural beings).
 */
export const RACE_DATA = {
  "Nephilim Sylvain": {
    "statMods": {},
    "resistances": { "physical": 5, "disease": 20, "poison": 5, "magic": 10, "psychic": 10 },
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Jayán": {
    "statMods": { "strength": 1 },
    "resistances": { "physical": 15, "magic": -10 },
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim D'Anjayni": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Ebudan": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Daimah": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Duk'zarist": {
    "statMods": {},
    "resistances": { "physical": 20, "disease": 15, "poison": 15, "magic": 15, "psychic": 15 },
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Devah": {
    "statMods": {},
    "resistances": { "physical": -10, "disease": -10, "magic": 10, "psychic": 10 },
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Vetala": {
    "statMods": {},
    "resistances": { "disease": -20 },
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Nephilim Turak": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Humano": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  },
  "Sylvain": {
    "statMods": { "agility": 1, "constitution": -1, "dexterity": 1, "strength": -1, "intelligence": 1, "power": 1 },
    "resistances": { "disease": 20, "poison": 10, "magic": 30, "psychic": 30 },
    "levelAdjust": 2,
    "gnosis": 0
  },
  "Jayán": {
    "statMods": { "constitution": 1, "strength": 2, "power": -1 },
    "resistances": { "physical": 20, "magic": -20 },
    "levelAdjust": 1,
    "gnosis": 0
  },
  "D'Anjayni": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 1,
    "gnosis": 0
  },
  "Ebudan": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 1,
    "gnosis": 0
  },
  "Daimah": {
    "statMods": { "agility": 1, "constitution": -1, "dexterity": 1, "willPower": -1 },
    "resistances": {},
    "levelAdjust": 1,
    "gnosis": 0
  },
  "Duk'zarist": {
    "statMods": { "agility": 1, "constitution": 1, "dexterity": 1, "strength": 1, "intelligence": 1, "perception": 1, "power": 1, "willPower": 1 },
    "resistances": { "physical": 20, "disease": 15, "poison": 15, "magic": 15, "psychic": 15 },
    "levelAdjust": 3,
    "gnosis": 0
  },
  "Devah": {
    "statMods": { "constitution": -2, "strength": -1, "intelligence": 1, "power": 1, "willPower": 1 },
    "resistances": { "physical": -10, "disease": -10, "magic": 15, "psychic": 15 },
    "levelAdjust": 2,
    "gnosis": 0
  },
  "Vetala": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 2,
    "gnosis": 0
  },
  "Tuan Dalyr": {
    "statMods": { "perception": 1 },
    "resistances": {},
    "levelAdjust": 2,
    "gnosis": 0
  },
  "Turak": {
    "statMods": { "constitution": 1, "strength": 1, "intelligence": -1 },
    "resistances": {},
    "levelAdjust": 1,
    "gnosis": 0
  },
  "Criatura": {
    "statMods": {},
    "resistances": {},
    "levelAdjust": 0,
    "gnosis": 0
  }
};
