/**
 * Defense Dialog — opens when defender needs to respond to an attack
 */
import { ABFRoll } from '../rolls/ABFRoll.mjs';

export async function openDefenseDialog(actor, { attackerName = '', attackTotal = 0 } = {}) {
  const settings = actor.system.general?.settings ?? {};
  const blockFinal = actor.system.combat?.block?.final?.value ?? 0;
  const dodgeFinal = actor.system.combat?.dodge?.final?.value ?? 0;

  const content = `
    <form class="abf-defense-dialog">
      <div class="form-group">
        <label>Atacante</label>
        <span>${attackerName} (${attackTotal})</span>
      </div>
      <div class="form-group">
        <label>Tipo de defensa</label>
        <select name="defenseType">
          <option value="block">Parada (${blockFinal})</option>
          <option value="dodge">Esquiva (${dodgeFinal})</option>
        </select>
      </div>
      <div class="form-group">
        <label>TA (tipo de daño)</label>
        <input type="number" name="armor" value="0" />
      </div>
      <div class="form-group">
        <label>Modificador</label>
        <input type="number" name="modifier" value="0" />
      </div>
      <div class="form-group">
        <label>Res. Daño</label>
        <input type="number" name="damageReduction" value="${actor.system.combat?.damageReduction?.final?.value ?? 0}" />
      </div>
    </form>
  `;

  return new Promise(resolve => {
    new Dialog({
      title: `🛡 Defensa — ${actor.name}`,
      content,
      buttons: {
        defend: {
          label: '🛡 Defender',
          callback: async html => {
            const form = html instanceof HTMLElement ? html.querySelector('form') : html[0]?.querySelector('form');
            const defenseType = form?.querySelector('[name=defenseType]')?.value ?? 'block';
            const armor = Number(form?.querySelector('[name=armor]')?.value) || 0;
            const modifier = Number(form?.querySelector('[name=modifier]')?.value) || 0;
            const damageReduction = Number(form?.querySelector('[name=damageReduction]')?.value) || 0;

            const base = defenseType === 'dodge' ? dodgeFinal : blockFinal;

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
              defenseType,
              armor,
              damageReduction,
              lifePoints: actor.system.characteristics?.secondaries?.lifePoints?.value ?? 0,
              cancelled: false
            });
          }
        },
        cancel: {
          label: 'Cancelar',
          callback: () => resolve({ cancelled: true })
        }
      },
      default: 'defend'
    }).render(true);
  });
}
