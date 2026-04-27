/**
 * Opens a simple dialog asking for a roll modifier.
 * @returns {Promise<number>} The modifier value (0 if cancelled)
 */
export async function openModDialog() {
  return new Promise(resolve => {
    new Dialog({
      title: game.i18n.localize('ABF.Roll.Modificador'),
      content: `
        <form>
          <div class="form-group">
            <label>${game.i18n.localize('ABF.Roll.Modificador')}</label>
            <input type="number" name="mod" value="0" autofocus />
          </div>
        </form>
      `,
      buttons: {
        ok: {
          label: 'OK',
          callback: html => {
            const form = html instanceof HTMLElement ? html.querySelector('form') : html[0]?.querySelector('form');
            resolve(Number(form?.querySelector('[name=mod]')?.value) || 0);
          }
        },
        cancel: {
          label: 'Cancel',
          callback: () => resolve(0)
        }
      },
      default: 'ok',
      close: () => resolve(0)
    }).render(true);
  });
}
