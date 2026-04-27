import { ABFRoll } from '../rolls/ABFRoll.mjs';
import { openModDialog } from '../rolls/modDialog.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class ABFActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['abf', 'sheet', 'actor'],
    position: { width: 1100, height: 850 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      addLevel: ABFActorSheet.#onAddLevel,
      deleteLevel: ABFActorSheet.#onDeleteLevel
    }
  };

  static PARTS = {
    sheet: {
      template: 'systems/abf/templates/actor/actor-sheet.hbs',
      scrollable: ['.sheet-body']
    }
  };

  /** Remember active tabs across re-renders */
  _activeTabs = {};

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const a = this.document;
    const cfg = a.system.config ?? {};

    Object.assign(context, {
      actor: a, system: a.system, editable: this.isEditable, config: cfg,
      hasKi: cfg.hasKi, hasMagic: cfg.hasMagic, hasPsychic: cfg.hasPsychic,
      hasElan: cfg.hasElan, hasGrimoires: cfg.hasGrimoires, hasTechniques: cfg.hasTechniques,
      weapons: a.items.filter(i => i.type === 'weapon'),
      armors: a.items.filter(i => i.type === 'armor'),
      advantages: a.items.filter(i => i.type === 'advantage'),
      disadvantages: a.items.filter(i => i.type === 'disadvantage'),
      kiSkills: a.items.filter(i => i.type === 'kiSkill'),
      martialArts: a.items.filter(i => i.type === 'martialArt'),
      techniques: a.items.filter(i => i.type === 'technique'),
      spells: a.items.filter(i => i.type === 'spell'),
      metamagics: a.items.filter(i => i.type === 'metamagic'),
      psychicPowers: a.items.filter(i => i.type === 'psychicPower'),
      psychicDisciplines: a.items.filter(i => i.type === 'psychicDiscipline')
    });
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const el = this.element;

    // Tab clicks — works for both primary and secondary navs (a or button)
    el.querySelectorAll('nav[data-group] [data-tab]').forEach(a => {
      a.addEventListener('click', ev => {
        ev.preventDefault();
        const group = ev.currentTarget.closest('nav').dataset.group;
        const tab = ev.currentTarget.dataset.tab;
        this._activeTabs[group] = tab;
        this.#setActiveTab(el, group, tab);
      });
    });

    // Restore remembered tabs (or defaults)
    this.#setActiveTab(el, 'primary', this._activeTabs.primary ?? 'resumen');
    for (const nav of el.querySelectorAll('nav.secondary-tab[data-group]')) {
      const group = nav.dataset.group;
      const defaultTab = nav.querySelector('[data-tab]')?.dataset.tab;
      this.#setActiveTab(el, group, this._activeTabs[group] ?? defaultTab);
    }

    // Rollables
    el.querySelectorAll('.rollable[data-formula]').forEach(r =>
      r.addEventListener('click', ev => this.#handleRoll(ev))
    );
  }

  #setActiveTab(el, group, tabId) {
    if (!tabId) return;
    // Nav links
    el.querySelectorAll(`nav[data-group="${group}"] [data-tab]`).forEach(a =>
      a.classList.toggle('active', a.dataset.tab === tabId)
    );
    // Tab content
    el.querySelectorAll(`.tab[data-group="${group}"]`).forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabId)
    );
  }

  async #handleRoll(event) {
    event.preventDefault();
    const { formula, label = '' } = event.currentTarget.dataset;
    if (!formula) return;
    const actor = this.document;
    const s = actor.system.general?.settings ?? {};
    const m = formula.match(/(\d+)d(\d+)\s*\+\s*(-?\d+)/);
    if (!m) return;
    const [, , die, base] = m.map(Number);
    const mod = await openModDialog();
    let result;
    if (die === 10) result = await ABFRoll.rollCharacteristic({ base, modifier: mod });
    else if (die === 100) {
      if (label.toLowerCase().includes('res'))
        result = await ABFRoll.rollResistance({ base, modifier: mod });
      else
        result = await ABFRoll.roll({ base, modifier: mod, openThreshold: s.openRolls?.value ?? 90, fumbleRange: s.fumbles?.value ?? 3, openOnDoubles: s.openOnDoubles?.value ?? false, mastery: base >= 200 });
    } else return;
    await result.toChat({ label, actor });
  }

  static async #onAddLevel(event, target) {
    const actor = this.document;
    const cats = ['Guerrero','Guerrero Acróbata','Paladín','Paladín Oscuro','Maestro en Armas','Tecnicista','Tao','Explorador','Sombra','Ladrón','Asesino','Hechicero','Warlock','Ilusionista','Hechicero Mentalista','Conjurador','Guerrero Conjurador','Mentalista','Guerrero Mentalista','Novel'];
    const r = await Dialog.prompt({
      title: game.i18n.localize('ABF.PDs.AnadirNivel'),
      content: `<form><div class="form-group"><label>${game.i18n.localize('ABF.PDs.SeleccionarCategoria')}</label><select name="c">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-group"><label>${game.i18n.localize('ABF.PDs.CuantosNiveles')}</label><input type="number" name="n" value="1" min="1"/></div></form>`,
      callback: h => { const f = (h.querySelector?.('form') ?? h[0]?.querySelector('form')); return { c: f?.querySelector('[name=c]')?.value, n: +f?.querySelector('[name=n]')?.value || 1 }; },
      rejectClose: false
    });
    if (!r) return;
    const raw = actor.system.general.levels;
    const ex = Array.isArray(raw) ? raw : [];
    const pd = {}; for (const k of 'attack,block,dodge,wearArmor,zeon,act,magicProjection,summon,control,bind,banish,cv,psychicProjection,ki,kiAccum,athletic,social,perceptive,intellectual,vigor,subterfuge,creative,lifeMultiples'.split(',')) pd[k] = { value: 0 };
    await actor.update({ 'system.general.levels': [...ex, { _id: foundry.utils.randomID(), name: r.c, system: { level: r.n, order: ex.length + 1, pd } }] });
  }

  static async #onDeleteLevel(event, target) {
    const actor = this.document;
    const idx = +target.dataset.levelIdx;
    const rawLvl = actor.system.general.levels;
    const levels = Array.isArray(rawLvl) ? [...rawLvl] : [];
    if (idx >= 0 && idx < levels.length) { levels.splice(idx, 1); levels.forEach((l, i) => l.system && (l.system.order = i + 1)); await actor.update({ 'system.general.levels': levels }); }
  }
}
