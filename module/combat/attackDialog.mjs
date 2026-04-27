/**
 * Attack Dialog — opens when player clicks attack button
 */
import { ABFRoll } from '../rolls/ABFRoll.mjs';

export async function openAttackDialog(actor, { weaponName = '', weaponAttack = 0, weaponDamage = 0, weaponCrit = '' } = {}) {
  const settings = actor.system.general?.settings ?? {};

  const content = `
    <form class="abf-attack-dialog">
      <div class="form-group">
        <label>Arma</label>
        <input type="text" name="weapon" value="${weaponName}" readonly />
      </div>
      <div class="form-group">
        <label>H. Ataque</label>
        <input type="number" name="attackBase" value="${weaponAttack}" />
      </div>
      <div class="form-group">
        <label>Modificador</label>
        <input type="number" name="modifier" value="0" />
      </div>
      <div class="form-group">
        <label>Daño base</label>
        <input type="number" name="damage" value="${weaponDamage}" />
      </div>
      <div class="form-group">
        <label>Crítico</label>
        <input type="text" name="crit" value="${weaponCrit}" readonly />
      </div>
    </form>
  `;

  return new Promise(resolve => {
    new Dialog({
      title: `⚔ Ataque — ${actor.name}`,
      content,
      buttons: {
        attack: {
          label: '⚔ Atacar',
          callback: async html => {
            const form = html instanceof HTMLElement ? html.querySelector('form') : html[0]?.querySelector('form');
            const base = Number(form?.querySelector('[name=attackBase]')?.value) || 0;
            const modifier = Number(form?.querySelector('[name=modifier]')?.value) || 0;
            const damage = Number(form?.querySelector('[name=damage]')?.value) || 0;

            const result = await ABFRoll.roll({
              base,
              modifier,
              openThreshold: settings.openRolls?.value ?? 90,
              fumbleRange: settings.fumbles?.value ?? 3,
              openOnDoubles: settings.openOnDoubles?.value ?? false,
              mastery: base >= 200
            });

            resolve({
              total: result.total,
              rollResult: result,
              damage,
              weapon: weaponName,
              critBonus: 0,
              cancelled: false
            });
          }
        },
        cancel: {
          label: 'Cancelar',
          callback: () => resolve({ cancelled: true })
        }
      },
      default: 'attack'
    }).render(true);
  });
}
