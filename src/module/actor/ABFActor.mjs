/**
 * ABFActor — Actor Document for Anima Beyond Fantasy
 */
import { runCalculationPipeline } from './calculations/pipeline.mjs';

export class ABFActor extends Actor {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type !== 'character') return;
    if (!this.system?.config?.autoCalculate && this.system?.config?.autoCalculate !== undefined) return;

    try {
      runCalculationPipeline(this.system);
    } catch (err) {
      console.error('ABF | Calculation pipeline error:', err);
    }
  }

  /**
   * Apply damage to life points
   * @param {number} damage
   */
  applyDamage(damage) {
    const current = this.system.characteristics.secondaries.lifePoints.value;
    this.update({ 'system.characteristics.secondaries.lifePoints.value': current - damage });
  }

  /**
   * Apply fatigue
   * @param {number} fatigue
   */
  applyFatigue(fatigue) {
    const current = this.system.characteristics.secondaries.fatigue.value;
    this.update({ 'system.characteristics.secondaries.fatigue.value': current - fatigue });
  }

  /**
   * Consume maintained zeon (called each round)
   * @param {boolean} revert - If true, restore instead of consume
   */
  consumeMaintainedZeon(revert = false) {
    const { zeon, zeonMaintained } = this.system.mystic;
    const updated = revert ? zeon.value + zeonMaintained.value : zeon.value - zeonMaintained.value;
    this.update({ 'system.mystic.zeon.value': updated });
  }
}
