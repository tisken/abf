/**
 * ABF Combat Resolution
 *
 * Computes combat result from attack and defense totals.
 * Source: Core Exxet p.82-98, verified against AnimaBeyondFoundry.
 */

/**
 * @param {object} attack
 * @param {number} attack.total - Attack roll total
 * @param {number} attack.damage - Base weapon damage
 * @param {number} attack.critBonus - Critical bonus
 * @param {boolean} [attack.ignoreArmor=false]
 * @param {number} [attack.reducedArmor=0]
 * @param {object} defense
 * @param {number} defense.total - Defense roll total
 * @param {number} defense.armor - AT value for damage type
 * @param {number} [defense.damageReduction=0]
 * @param {number} [defense.lifePoints] - Current LP for critical check
 * @returns {CombatResult}
 */
export function computeCombatResult(attack, defense) {
  const difference = attack.total - defense.total;

  // Counterattack: if defense wins
  const hasCounterAttack = difference < 0;
  const counterAttackValue = hasCounterAttack
    ? Math.min(Math.floor(Math.abs(difference) * 0.5 / 5) * 5, 150)
    : 0;

  // Armor calculation
  let finalArmor;
  if (attack.ignoreArmor) {
    finalArmor = 0;
  } else {
    finalArmor = Math.max(0, (defense.armor ?? 0) - (attack.reducedArmor ?? 0));
  }

  // Damage percentage: (difference - absorption) / 10 × 10
  const absorption = finalArmor * 10 + 20;
  const damagePercentage = Math.max(0, Math.floor((difference - absorption) / 10) * 10);

  // Base damage after reduction
  const baseDamage = Math.max(0, Math.round(((attack.damage ?? 0) - (defense.damageReduction ?? 0)) / 10) * 10);

  // Final damage
  const finalDamage = Math.max(0, (baseDamage * damagePercentage) / 100);

  // Critical check: >= 50% of current LP
  const lifePercentRemoved = defense.lifePoints > 0
    ? Math.min(100, Math.floor((finalDamage / defense.lifePoints) * 100))
    : 100;
  const isCritical = lifePercentRemoved >= 50;

  // Critical value
  const critValue = isCritical ? finalDamage + (attack.critBonus ?? 0) : 0;

  // Resolve critical details
  let critical = null;
  if (isCritical && critValue > 0) {
    const locationRoll = Math.floor(Math.random() * 100) + 1;
    critical = resolveCritical(critValue, locationRoll);
  }

  return {
    difference,
    hasCounterAttack,
    counterAttackValue,
    finalArmor,
    absorption,
    damagePercentage,
    baseDamage,
    finalDamage,
    lifePercentRemoved,
    isCritical,
    critValue,
    critical
  };
}

/**
 * Resolve critical hit: severity + location
 * Source: Core Exxet p.98
 */
export function resolveCritical(critValue, locationRoll) {
  let level, effect;
  if (critValue <= 50) {
    level = 1;
    effect = `Penalizador -${critValue} a toda acción (dolor)`;
  } else if (critValue <= 100) {
    level = 2;
    effect = `Penalizador -${Math.floor(critValue / 2)} dolor + -${critValue - Math.floor(critValue / 2)} físico permanente`;
  } else if (critValue <= 150) {
    level = 3;
    effect = `Destrucción parcial. Penalizador -${critValue}`;
  } else {
    level = 4;
    effect = `Destrucción total. Penalizador -${critValue}. Posible muerte`;
  }

  let location = null;
  if (locationRoll !== null && critValue > 50) {
    if (locationRoll <= 10) location = 'Costillas';
    else if (locationRoll <= 20) location = 'Hombro';
    else if (locationRoll <= 25) location = 'Estómago';
    else if (locationRoll <= 30) location = 'Riñones';
    else if (locationRoll <= 35) location = 'Pecho';
    else if (locationRoll <= 36) location = 'Corazón';
    else if (locationRoll <= 44) location = 'Brazo derecho';
    else if (locationRoll <= 52) location = 'Brazo izquierdo';
    else if (locationRoll <= 64) location = 'Pierna derecha';
    else if (locationRoll <= 76) location = 'Pierna izquierda';
    else if (locationRoll <= 84) location = 'Cabeza';
    else location = 'General';
  }

  return { level, effect, location, critValue };
}
