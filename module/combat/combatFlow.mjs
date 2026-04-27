/**
 * ABF Combat Flow
 * Orchestrates: attack → defense → result → chat → damage
 */
import { openAttackDialog } from './attackDialog.mjs';
import { openDefenseDialog } from './defenseDialog.mjs';
import { computeCombatResult } from './combatResult.mjs';

/**
 * Execute a full combat round between attacker and defender
 * @param {Actor} attacker
 * @param {Actor} defender
 * @param {object} [weaponData] - Pre-filled weapon data
 */
export async function executeCombat(attacker, defender, weaponData = {}) {
  // 1. Attack dialog
  const attack = await openAttackDialog(attacker, weaponData);
  if (attack.cancelled) return;

  // Send attack roll to chat
  await attack.rollResult.toChat({
    label: `⚔ ${attacker.name} ataca${weaponData.weaponName ? ` con ${weaponData.weaponName}` : ''}`,
    actor: attacker
  });

  // 2. Defense dialog
  const defense = await openDefenseDialog(defender, {
    attackerName: attacker.name,
    attackTotal: attack.total
  });
  if (defense.cancelled) return;

  // Send defense roll to chat
  await defense.rollResult.toChat({
    label: `🛡 ${defender.name} defiende (${defense.defenseType === 'dodge' ? 'Esquiva' : 'Parada'})`,
    actor: defender
  });

  // 3. Compute result
  const result = computeCombatResult(
    {
      total: attack.total,
      damage: attack.damage,
      critBonus: attack.critBonus ?? 0,
      ignoreArmor: false,
      reducedArmor: 0
    },
    {
      total: defense.total,
      armor: defense.armor,
      damageReduction: defense.damageReduction,
      lifePoints: defense.lifePoints
    }
  );

  // 4. Send result to chat
  const resultContent = buildResultMessage(attacker, defender, attack, defense, result);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: resultContent
  });

  // 5. Apply damage if any
  if (result.finalDamage > 0) {
    await defender.applyDamage(result.finalDamage);
  }
}

function buildResultMessage(attacker, defender, attack, defense, result) {
  let html = `<div class="abf-combat-result">`;
  html += `<div class="combat-result-header">⚔ ${attacker.name} vs 🛡 ${defender.name}</div>`;
  html += `<table class="combat-result-table">`;
  html += `<tr><td>Ataque</td><td><strong>${attack.total}</strong></td></tr>`;
  html += `<tr><td>Defensa</td><td><strong>${defense.total}</strong></td></tr>`;
  html += `<tr><td>Diferencia</td><td><strong>${result.difference}</strong></td></tr>`;

  if (result.hasCounterAttack) {
    html += `<tr><td>Contraataque</td><td><strong>+${result.counterAttackValue}</strong></td></tr>`;
  }

  if (result.finalDamage > 0) {
    html += `<tr><td>TA</td><td>${result.finalArmor}</td></tr>`;
    html += `<tr><td>% Daño</td><td>${result.damagePercentage}%</td></tr>`;
    html += `<tr><td>Daño base</td><td>${result.baseDamage}</td></tr>`;
    html += `<tr><td><strong>Daño final</strong></td><td><strong>${result.finalDamage}</strong></td></tr>`;
    html += `<tr><td>% Vida perdida</td><td>${result.lifePercentRemoved}%</td></tr>`;
  }

  if (result.isCritical && result.critical) {
    html += `<tr class="critical-row"><td colspan="2">`;
    html += `💀 CRÍTICO Nivel ${result.critical.level}`;
    if (result.critical.location) html += ` — ${result.critical.location}`;
    html += `<br/><small>${result.critical.effect}</small>`;
    html += `</td></tr>`;
  }

  html += `</table></div>`;
  return html;
}
