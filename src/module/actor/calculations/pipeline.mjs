/**
 * ABF Calculation Pipeline
 * Executes all derived calculations in the correct order.
 * Source: 68 mutators from AnimaBeyondFoundry, verified against Excel.
 *
 * No toposort, no effect flow — just sequential execution.
 * Active Effects are applied by Foundry BEFORE prepareDerivedData().
 */

import { CATEGORY_DATA } from './tables/categoryData.mjs';
import { RACE_DATA } from './tables/raceData.mjs';
import { calculateAttributeModifier } from './tables/attributeModifier.mjs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function getPDForLevel(absoluteLevel) {
  if (absoluteLevel <= 0) return 400;
  if (absoluteLevel === 1) return 600;
  return 600 + (absoluteLevel - 1) * 100;
}

// Ki table: stat value → Ki points
const KI_TABLE = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,19,21,23,25];
function kiFromStat(v) {
  if (v <= 0) return 0;
  if (v >= KI_TABLE.length) return KI_TABLE[KI_TABLE.length - 1] + (v - 20) * 2;
  return KI_TABLE[v] || 0;
}

// Ki accumulation table: stat value → accumulation per turn
const KI_ACCUM_TABLE = [0,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,4];
function accumFromStat(v) {
  if (v <= 0) return 0;
  if (v >= KI_ACCUM_TABLE.length) return KI_ACCUM_TABLE[KI_ACCUM_TABLE.length - 1];
  return KI_ACCUM_TABLE[v] || 0;
}

// Zeon/LP base table: POD/CON → value
const ZEON_TABLE = [0,5,20,40,55,70,85,95,110,120,135,150,160,175,185,200,215,225,240,250,265];
function zeonFromStat(v) {
  if (v <= 0) return 0;
  if (v >= ZEON_TABLE.length) return ZEON_TABLE[ZEON_TABLE.length - 1] + (v - 20) * 15;
  return ZEON_TABLE[v] || 0;
}

// Zeon regen table
const REGEN_TABLE = [0,0,0,0,0,5,5,5,10,10,10,15,15,20,20,25,25,30,30,35,35];
function regenFromPod(v) {
  if (v <= 0) return 0;
  if (v >= REGEN_TABLE.length) return REGEN_TABLE[REGEN_TABLE.length - 1];
  return REGEN_TABLE[v] || 0;
}

// ACT base table
const ACT_TABLE = [0,0,0,0,0,5,5,5,10,10,10,10,15,15,15,20,25,25,30,30,35];
function actFromPod(v) {
  if (v <= 0) return 0;
  if (v >= ACT_TABLE.length) return ACT_TABLE[ACT_TABLE.length - 1];
  return ACT_TABLE[v] || 0;
}

// XP for next level
function xpForLevel(level) {
  if (level <= 0) return 0;
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 750;
  if (level === 5) return 1000;
  return 1000 + (level - 5) * 500;
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

export function runCalculationPipeline(system) {
  const d = system; // shorthand
  const p = d.characteristics.primaries;
  const s = d.characteristics.secondaries;

  // 1. Total level from level blocks
  let totalLevel = 0;
  for (const lvl of d.general.levels ?? []) {
    totalLevel += safeNum(lvl.system?.level);
  }
  d.general.level.value = totalLevel;

  // 2. Race bonuses (stats + resistances)
  const raceName = d.general.aspect?.race?.value;
  const raceInfo = raceName ? RACE_DATA[raceName] : null;
  if (raceInfo?.statMods) {
    for (const [stat, mod] of Object.entries(raceInfo.statMods)) {
      if (p[stat]) p[stat].value = safeNum(p[stat].value) + mod;
    }
  }
  if (raceInfo?.resistances) {
    for (const [key, bonus] of Object.entries(raceInfo.resistances)) {
      if (s.resistances[key]) s.resistances[key].special.value += bonus;
    }
  }

  // 3. Characteristic minimums (no stat below 1)
  for (const stat of Object.values(p)) {
    if (stat && typeof stat.value === 'number' && stat.value < 1) stat.value = 1;
  }

  // 4. Calculate final + mod for each characteristic
  for (const stat of Object.values(p)) {
    if (!stat) continue;
    stat.final = stat.final || { value: 0 };
    stat.mod = stat.mod || { value: 0 };
    stat.final.value = safeNum(stat.base?.value ?? stat.value) + safeNum(stat.special?.value);
    stat.value = stat.final.value; // keep .value in sync
    stat.mod.value = calculateAttributeModifier(stat.final.value);
  }

  // 5. Presence
  d.general.presence.base.value = totalLevel <= 0 ? 20 : 25 + totalLevel * 5;
  d.general.presence.final.value = d.general.presence.base.value + safeNum(d.general.presence.special.value);

  // 6. Resistances (base = presence + stat mod, final = base + special)
  const resMap = { physical: 'constitution', disease: 'constitution', poison: 'constitution', magic: 'power', psychic: 'willPower' };
  for (const [key, attr] of Object.entries(resMap)) {
    const res = s.resistances[key];
    if (!res) continue;
    res.base.value = d.general.presence.final.value + safeNum(p[attr]?.mod?.value);
    res.final.value = res.base.value + safeNum(res.special.value);
  }

  // 7. Innate bonuses from category
  for (const lvl of d.general.levels ?? []) {
    const catData = CATEGORY_DATA[lvl.name];
    const catLevel = safeNum(lvl.system?.level);
    if (!catData || catLevel <= 0) continue;
    const inn = catData.innateBonus || {};
    d.combat.attack.special.value += (inn.attack || 0) * catLevel;
    d.combat.block.special.value += (inn.block || 0) * catLevel;
    d.combat.dodge.special.value += (inn.dodge || 0) * catLevel;
    d.combat.wearArmor.special.value += (inn.wearArmor || 0) * catLevel;
    d.mystic.zeon.max += (inn.zeon || 0) * catLevel;
  }

  // 8. PD Validation + Category Progression
  let cumulativeLevel = 0;
  let totalPDAvailable = 0;
  let totalPDSpent = 0;
  const COMBAT_SKILLS = ['attack', 'block', 'dodge', 'wearArmor'];
  const SUPERNATURAL_SKILLS = ['zeon', 'act', 'magicProjection', 'summon', 'control', 'bind', 'banish'];
  const PSYCHIC_SKILLS = ['cv', 'psychicProjection'];
  const KI_SKILLS = ['ki', 'kiAccum'];
  const SECONDARY_SKILLS = ['athletic', 'social', 'perceptive', 'intellectual', 'vigor', 'subterfuge', 'creative'];
  const ALL_PD_SKILLS = [...COMBAT_SKILLS, ...SUPERNATURAL_SKILLS, ...PSYCHIC_SKILLS, ...KI_SKILLS, ...SECONDARY_SKILLS];

  let totalTurnBonus = 0, totalMK = 0, totalCV = 0;
  let pdAttack = 0, pdBlock = 0, pdDodge = 0, pdWearArmor = 0;
  let pdZeon = 0, pdAct = 0, pdMagicProj = 0, pdSummon = 0, pdControl = 0, pdBind = 0, pdBanish = 0;
  let pdCV = 0, pdPsychicProj = 0, pdKi = 0, pdKiAccum = 0;
  let pdLifeMultiples = 0;

  for (const lvl of d.general.levels ?? []) {
    const catName = lvl.name;
    const catLevel = safeNum(lvl.system?.level);
    const catData = CATEGORY_DATA[catName];
    const costs = catData?.costs || {};

    if (!lvl.system) lvl.system = {};
    if (!lvl.system.pd) lvl.system.pd = {};

    // PD available for this block
    let blockPD = 0;
    for (let i = 0; i < catLevel; i++) blockPD += getPDForLevel(cumulativeLevel + i + 1);
    lvl.system.pd._available = blockPD;

    // Category costs
    const catCosts = {};
    for (const skill of ALL_PD_SKILLS) catCosts[skill] = costs[skill] || 0;
    catCosts.lifeMultiple = catData?.lifeMultipleCost || 20;
    lvl.system._catCosts = catCosts;

    // PD spent per skill
    let blockSpent = 0, combatSpent = 0, supernaturalSpent = 0, psychicSpent = 0;
    const pdSpent = {};
    for (const skill of ALL_PD_SKILLS) {
      const invested = safeNum(lvl.system.pd[skill]?.value);
      const cost = invested * (catCosts[skill] || 0);
      pdSpent[skill] = cost;
      blockSpent += cost;
      if (COMBAT_SKILLS.includes(skill)) combatSpent += cost;
      if (SUPERNATURAL_SKILLS.includes(skill)) supernaturalSpent += cost;
      if (PSYCHIC_SKILLS.includes(skill)) psychicSpent += cost;
    }
    const lifeMultInvested = safeNum(lvl.system.pd.lifeMultiples?.value);
    pdSpent.lifeMultiples = lifeMultInvested * catCosts.lifeMultiple;
    blockSpent += pdSpent.lifeMultiples;

    lvl.system._pdSpent = pdSpent;
    lvl.system._pdSpentTotal = blockSpent;

    // Limits
    if (catData) {
      const combatLimit = Math.floor(blockPD * (catData.limitCombat || 0.5));
      const supernaturalLimit = Math.floor(blockPD * (catData.limitMagic || 0.5));
      const psychicLimit = Math.floor(blockPD * (catData.limitPsychic || 0.5));
      lvl.system._pdLimits = {
        combat: combatLimit, supernatural: supernaturalLimit, psychic: psychicLimit,
        combatOver: combatSpent > combatLimit,
        supernaturalOver: supernaturalSpent > supernaturalLimit,
        psychicOver: psychicSpent > psychicLimit
      };
    }

    totalPDAvailable += blockPD;
    totalPDSpent += blockSpent;
    cumulativeLevel += catLevel;

    // Category progression
    totalTurnBonus += (catData?.turnPerLevel || 0) * catLevel;
    totalMK += (catData?.mkPerLevel || 0) * catLevel;
    const cvEvery = catData?.cvPerLevels || 3;
    totalCV += Math.floor(catLevel / cvEvery);

    // Sum PD investments
    pdAttack += safeNum(lvl.system.pd.attack?.value);
    pdBlock += safeNum(lvl.system.pd.block?.value);
    pdDodge += safeNum(lvl.system.pd.dodge?.value);
    pdWearArmor += safeNum(lvl.system.pd.wearArmor?.value);
    pdZeon += safeNum(lvl.system.pd.zeon?.value);
    pdAct += safeNum(lvl.system.pd.act?.value);
    pdMagicProj += safeNum(lvl.system.pd.magicProjection?.value);
    pdSummon += safeNum(lvl.system.pd.summon?.value);
    pdControl += safeNum(lvl.system.pd.control?.value);
    pdBind += safeNum(lvl.system.pd.bind?.value);
    pdBanish += safeNum(lvl.system.pd.banish?.value);
    pdCV += safeNum(lvl.system.pd.cv?.value);
    pdPsychicProj += safeNum(lvl.system.pd.psychicProjection?.value);
    pdKi += safeNum(lvl.system.pd.ki?.value);
    pdKiAccum += safeNum(lvl.system.pd.kiAccum?.value);
    pdLifeMultiples += safeNum(lvl.system.pd.lifeMultiples?.value);
  }

  d.general._pdTotals = { available: totalPDAvailable, spent: totalPDSpent, remaining: totalPDAvailable - totalPDSpent };

  // 9. Apply PD investments to base values
  d.combat.attack.base.value += pdAttack;
  d.combat.block.base.value += pdBlock;
  d.combat.dodge.base.value += pdDodge;
  d.combat.wearArmor.base.value += pdWearArmor;
  d.mystic.zeon.max += pdZeon;
  d.mystic.act.main.base.value += pdAct;
  d.mystic.magicProjection.base.value += pdMagicProj;
  d.mystic.summoning.summon.base.value += pdSummon;
  d.mystic.summoning.control.base.value += pdControl;
  d.mystic.summoning.bind.base.value += pdBind;
  d.mystic.summoning.banish.base.value += pdBanish;
  d.psychic.psychicPoints.max += pdCV + totalCV;
  d.psychic.psychicProjection.base.value += pdPsychicProj;

  // Category progression
  s.initiative.base.value += totalTurnBonus;
  d.domine.martialKnowledge.max.value += totalMK;

  // 10. Combat finals
  const allActionsMod = safeNum(d.general.modifiers.allActions.final.value);
  const physicalMod = safeNum(d.general.modifiers.physicalActions.final.value);
  d.combat.attack.final.value = safeNum(d.combat.attack.base.value) + safeNum(d.combat.attack.special.value) + allActionsMod + physicalMod;
  d.combat.block.final.value = safeNum(d.combat.block.base.value) + safeNum(d.combat.block.special.value) + allActionsMod + physicalMod;
  d.combat.dodge.final.value = safeNum(d.combat.dodge.base.value) + safeNum(d.combat.dodge.special.value) + allActionsMod + physicalMod;
  d.combat.wearArmor.final.value = safeNum(d.combat.wearArmor.base.value) + safeNum(d.combat.wearArmor.special.value);

  // 11. Initiative
  s.initiative.final.value = safeNum(s.initiative.base.value) + safeNum(s.initiative.special.value);

  // 12. Mystic bases from POD
  const podVal = safeNum(p.power?.value);
  d.mystic.zeon.max += zeonFromStat(podVal);
  d.mystic.zeonRegeneration.base.value += regenFromPod(podVal);
  d.mystic.zeonRegeneration.final.value = safeNum(d.mystic.zeonRegeneration.base.value);
  d.mystic.act.main.base.value += actFromPod(podVal);
  d.mystic.act.main.final.value = Math.max(0, safeNum(d.mystic.act.main.base.value));

  // Mystic projection finals
  d.mystic.magicProjection.final.value = Math.max(0, safeNum(d.mystic.magicProjection.base.value) + allActionsMod);
  d.mystic.magicProjection.imbalance.offensive.final.value = Math.max(0, safeNum(d.mystic.magicProjection.imbalance.offensive.base.value) + allActionsMod);
  d.mystic.magicProjection.imbalance.defensive.final.value = Math.max(0, safeNum(d.mystic.magicProjection.imbalance.defensive.base.value) + allActionsMod);

  // Summoning finals
  for (const key of ['summon', 'banish', 'bind', 'control']) {
    d.mystic.summoning[key].final.value = Math.max(0, safeNum(d.mystic.summoning[key].base.value) + allActionsMod);
  }

  // 13. Psychic bases from WP
  const wpVal = safeNum(p.willPower?.value);
  d.psychic.psychicPotential.base.value += wpVal * 10 + 20;
  d.psychic.psychicPotential.final.value = Math.max(0, safeNum(d.psychic.psychicPotential.base.value));
  d.psychic.psychicProjection.final.value = Math.max(0, safeNum(d.psychic.psychicProjection.base.value) + allActionsMod);
  d.psychic.psychicProjection.imbalance.offensive.final.value = Math.max(0, safeNum(d.psychic.psychicProjection.imbalance.offensive.base.value) + allActionsMod);
  d.psychic.psychicProjection.imbalance.defensive.final.value = Math.max(0, safeNum(d.psychic.psychicProjection.imbalance.defensive.base.value) + allActionsMod);

  // 14. Ki bases from stats
  const KI_STATS = ['strength', 'dexterity', 'agility', 'constitution', 'power', 'willPower'];
  let kiTotal = 0;
  for (const stat of KI_STATS) {
    const val = safeNum(p[stat]?.value);
    d.domine.kiAccumulation[stat].base.value += accumFromStat(val);
    d.domine.kiAccumulation[stat].final.value = Math.max(0, safeNum(d.domine.kiAccumulation[stat].base.value));
    kiTotal += kiFromStat(val);
  }
  d.domine.kiAccumulation.generic.max = kiTotal;

  // 15. Life points
  const conVal = safeNum(p.constitution?.value);
  const conMod = safeNum(p.constitution?.mod?.value);
  const primaryCat = d.general.levels?.[0]?.name ?? '';
  const lpPerLevel = CATEGORY_DATA[primaryCat]?.lpPerLevel ?? 5;
  s.lifePoints.max = (20 + conVal * 10 + conMod) + (lpPerLevel * totalLevel) + (pdLifeMultiples * conVal);

  // 16. Fatigue max = CON
  if (conVal > 0) s.fatigue.max = conVal;

  // 17. Experience next level
  if (d.general.experience?.next) {
    const nextXP = xpForLevel(totalLevel + 1);
    if (!d.general.experience.next.value) d.general.experience.next.value = nextXP;
  }

  // 18. Size from STR+CON
  if (d.general.aspect?.size && safeNum(d.general.aspect.size.value) === 0) {
    const sum = safeNum(p.strength?.value) + conVal;
    if (sum <= 3) d.general.aspect.size.value = -2;
    else if (sum <= 8) d.general.aspect.size.value = -1;
    else if (sum <= 22) d.general.aspect.size.value = 0;
    else if (sum <= 24) d.general.aspect.size.value = 1;
    else if (sum <= 28) d.general.aspect.size.value = 2;
    else if (sum <= 33) d.general.aspect.size.value = 3;
    else d.general.aspect.size.value = 4;
  }

  // 19. Actions from DEX+AGI
  if (d.general.settings?.actions) {
    const dexAgi = safeNum(p.dexterity?.value) + safeNum(p.agility?.value);
    let actions;
    if (dexAgi < 11) actions = 1;
    else if (dexAgi < 15) actions = 2;
    else if (dexAgi < 20) actions = 3;
    else if (dexAgi < 23) actions = 4;
    else if (dexAgi < 26) actions = 5;
    else if (dexAgi < 29) actions = 6;
    else if (dexAgi < 32) actions = 8;
    else actions = 10;
    d.general.settings.actions.value = actions;
  }

  // 20. Modifiers finals
  d.general.modifiers.extraDamage.final.value = safeNum(d.general.modifiers.extraDamage.base.value) + safeNum(d.general.modifiers.extraDamage.special.value);
  d.general.modifiers.critDamageBonus.final.value = safeNum(d.general.modifiers.critDamageBonus.base.value) + safeNum(d.general.modifiers.critDamageBonus.special.value);
  d.combat.damageReduction.final.value = safeNum(d.combat.damageReduction.base.value) + safeNum(d.combat.damageReduction.special.value);
  d.general.destinyPoints.final.value = safeNum(d.general.destinyPoints.base.value);
}
