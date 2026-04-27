/**
 * ABFRoll — Anima Beyond Fantasy Open Roll System
 *
 * Mechanics:
 * - Roll 1d100
 * - If result >= openThreshold (default 90): roll again and ADD
 * - Each explosion raises threshold by +1 (90→91→92...)
 * - If openOnDoubles and result is 11/22/33.../99: roll 1d10, if matches → counts as 100
 * - If result <= fumbleRange (default 3): fumble (subtract from total)
 * - Mastery: fumbleRange -= 1
 *
 * Usage:
 *   const result = await ABFRoll.roll({ base: 120, openThreshold: 90, fumbleRange: 3 });
 *   result.total    → final number
 *   result.rolls    → array of individual d100 results
 *   result.fumbled  → boolean
 *   result.exploded → boolean
 */

export class ABFRoll {

  /**
   * Perform an open d100 roll
   * @param {object} options
   * @param {number} options.base - Base value to add to roll
   * @param {number} [options.modifier=0] - Additional modifier
   * @param {number} [options.openThreshold=90] - Threshold for open roll
   * @param {number} [options.fumbleRange=3] - Fumble range (1-N)
   * @param {boolean} [options.openOnDoubles=false] - Open on doubles (11,22,33...)
   * @param {boolean} [options.mastery=false] - Mastery mode (fumble -1)
   * @returns {Promise<ABFRollResult>}
   */
  static async roll({
    base = 0,
    modifier = 0,
    openThreshold = 90,
    fumbleRange = 3,
    openOnDoubles = false,
    mastery = false
  } = {}) {
    const effectiveFumble = mastery ? Math.max(1, fumbleRange - 1) : fumbleRange;
    const rolls = [];
    let diceTotal = 0;
    let fumbled = false;
    let exploded = false;

    // First roll
    const first = await ABFRoll.#rollD100();
    rolls.push({ value: first, type: 'base' });

    // Check fumble
    if (first <= effectiveFumble) {
      fumbled = true;
      diceTotal = -first; // Fumble subtracts
    } else {
      diceTotal = first;

      // Check doubles
      let effectiveFirst = first;
      if (openOnDoubles && first > 10 && first < 100 && first % 11 === 0) {
        const confirm = await ABFRoll.#rollD10();
        rolls.push({ value: confirm, type: 'doubles-confirm' });
        if (confirm === first / 11) {
          effectiveFirst = 100;
          diceTotal = 100;
          rolls[0].doublesAs100 = true;
        }
      }

      // Explosion chain
      let threshold = openThreshold;
      let current = effectiveFirst;

      while (current >= threshold && threshold <= 100) {
        exploded = true;
        const extra = await ABFRoll.#rollD100();
        rolls.push({ value: extra, type: 'explosion' });
        diceTotal += extra;
        threshold += 1;
        current = extra;
      }
    }

    const total = diceTotal + base + modifier;

    return new ABFRollResult({
      total,
      diceTotal,
      base,
      modifier,
      rolls,
      fumbled,
      exploded,
      openThreshold,
      fumbleRange: effectiveFumble
    });
  }

  /**
   * Roll for initiative (d100 open + base)
   */
  static async rollInitiative({ base = 0, modifier = 0, openThreshold = 90, fumbleRange = 3 } = {}) {
    return ABFRoll.roll({ base, modifier, openThreshold, fumbleRange });
  }

  /**
   * Roll a characteristic check (1d10, no explosion)
   */
  static async rollCharacteristic({ base = 0, modifier = 0 } = {}) {
    const value = await ABFRoll.#rollD10();
    const total = value + base + modifier;
    return new ABFRollResult({
      total,
      diceTotal: value,
      base,
      modifier,
      rolls: [{ value, type: 'base' }],
      fumbled: false,
      exploded: false,
      openThreshold: 999,
      fumbleRange: 0
    });
  }

  /**
   * Roll a resistance check (d100, no explosion)
   */
  static async rollResistance({ base = 0, modifier = 0 } = {}) {
    const value = await ABFRoll.#rollD100();
    const total = value + base + modifier;
    return new ABFRollResult({
      total,
      diceTotal: value,
      base,
      modifier,
      rolls: [{ value, type: 'base' }],
      fumbled: false,
      exploded: false,
      openThreshold: 999,
      fumbleRange: 0
    });
  }

  // ─── Private helpers ───

  static async #rollD100() {
    const r = new Roll('1d100');
    await r.evaluate();
    return r.total;
  }

  static async #rollD10() {
    const r = new Roll('1d10');
    await r.evaluate();
    return r.total;
  }
}

/**
 * Result of an ABF roll
 */
export class ABFRollResult {
  constructor({ total, diceTotal, base, modifier, rolls, fumbled, exploded, openThreshold, fumbleRange }) {
    this.total = total;
    this.diceTotal = diceTotal;
    this.base = base;
    this.modifier = modifier;
    this.rolls = rolls;
    this.fumbled = fumbled;
    this.exploded = exploded;
    this.openThreshold = openThreshold;
    this.fumbleRange = fumbleRange;
  }

  /** Format for chat display */
  get flavor() {
    const parts = [];
    if (this.fumbled) parts.push('💀 PIFIA');
    if (this.exploded) parts.push('🔥 ABIERTA');
    const diceStr = this.rolls.map(r => {
      if (r.doublesAs100) return `[${r.value}→100]`;
      if (r.type === 'explosion') return `+[${r.value}]`;
      if (r.type === 'doubles-confirm') return `(d10:${r.value})`;
      return `[${r.value}]`;
    }).join(' ');
    return `${diceStr} ${parts.join(' ')}`;
  }

  /**
   * Send result to chat
   * @param {object} options
   * @param {string} options.label - Roll label
   * @param {Actor} options.actor - Actor making the roll
   */
  async toChat({ label = '', actor = null } = {}) {
    const content = `
      <div class="abf-roll-result">
        <div class="roll-label">${label}</div>
        <div class="roll-dice">${this.flavor}</div>
        <div class="roll-total">
          <strong>${this.total}</strong>
          <small>(${this.diceTotal} + ${this.base}${this.modifier ? ` + ${this.modifier}` : ''})</small>
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      flavor: label
    });
  }
}
