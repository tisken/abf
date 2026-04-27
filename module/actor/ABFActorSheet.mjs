import { ABFRoll } from '../rolls/ABFRoll.mjs';
import { openModDialog } from '../rolls/modDialog.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * ABFActorSheet — Actor Sheet for Anima Beyond Fantasy
 * Foundry v14 ApplicationV2
 */
export class ABFActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['abf', 'sheet', 'actor'],
    position: { width: 1100, height: 850 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      roll: ABFActorSheet.#onRoll,
      addLevel: ABFActorSheet.#onAddLevel,
      deleteLevel: ABFActorSheet.#onDeleteLevel
    }
  };

  static TABS = {
    primary: {
      initial: 'resumen',
      tabs: [
        // Fijas
        { id: 'resumen', label: 'ABF.Tabs.Resumen', icon: '' },
        { id: 'general', label: 'ABF.Tabs.General', icon: '' },
        { id: 'principal', label: 'ABF.Tabs.Principal', icon: '' },
        { id: 'pds', label: 'ABF.Tabs.PDs', icon: '' },
        { id: 'combat', label: 'ABF.Tabs.Combate', icon: '' },
        { id: 'personalizacion', label: 'ABF.Tabs.Personalizacion', icon: '' },
        // Dinámicas
        { id: 'ki', label: 'ABF.Tabs.Ki', icon: '' },
        { id: 'tecnicas', label: 'ABF.Tabs.Tecnicas', icon: '' },
        { id: 'mistico', label: 'ABF.Tabs.Mistico', icon: '' },
        { id: 'psiquicos', label: 'ABF.Tabs.Psiquicos', icon: '' },
        { id: 'elan', label: 'ABF.Tabs.Elan', icon: '' },
        { id: 'grimorioMagia', label: 'ABF.Tabs.GrimorioMagia', icon: '' },
        { id: 'grimorioPsiquica', label: 'ABF.Tabs.GrimorioPsiquica', icon: '' }
      ]
    }
  };

  static PARTS = {
    header:            { template: 'systems/abf/templates/actor/parts/header/header.hbs' },
    tabs:              { template: 'systems/abf/templates/actor/parts/tabs-nav/tabs-nav.hbs' },
    resumen:           { template: 'systems/abf/templates/actor/parts/resumen/resumen.hbs', scrollable: [''], tab: 'resumen' },
    general:           { template: 'systems/abf/templates/actor/parts/general/general.hbs', scrollable: [''], tab: 'general' },
    principal:         { template: 'systems/abf/templates/actor/parts/principal/principal.hbs', scrollable: [''], tab: 'principal' },
    pds:               { template: 'systems/abf/templates/actor/parts/pds/pds.hbs', scrollable: [''], tab: 'pds' },
    combat:            { template: 'systems/abf/templates/actor/parts/combat/combat.hbs', scrollable: [''], tab: 'combat' },
    personalizacion:   { template: 'systems/abf/templates/actor/parts/personalizacion/personalizacion.hbs', scrollable: [''], tab: 'personalizacion' },
    ki:                { template: 'systems/abf/templates/actor/parts/ki/ki.hbs', scrollable: [''], tab: 'ki' },
    tecnicas:          { template: 'systems/abf/templates/actor/parts/tecnicasKi/tecnicasKi.hbs', scrollable: [''], tab: 'tecnicas' },
    mistico:           { template: 'systems/abf/templates/actor/parts/misticos/misticos.hbs', scrollable: [''], tab: 'mistico' },
    psiquicos:         { template: 'systems/abf/templates/actor/parts/psiquicos/psiquicos.hbs', scrollable: [''], tab: 'psiquicos' },
    elan:              { template: 'systems/abf/templates/actor/parts/elan/elan.hbs', scrollable: [''], tab: 'elan' },
    grimorioMagia:     { template: 'systems/abf/templates/actor/parts/grimorioMagia/grimorioMagia.hbs', scrollable: [''], tab: 'grimorioMagia' },
    grimorioPsiquica:  { template: 'systems/abf/templates/actor/parts/grimorioPsiquica/grimorioPsiquica.hbs', scrollable: [''], tab: 'grimorioPsiquica' }
  };

  /** @override */
  get title() {
    return this.document.name;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor = actor;
    context.system = actor.system;
    context.editable = this.isEditable;
    context.config = actor.system.config ?? {};

    // Tab visibility flags for templates
    context.hasKi = actor.system.config?.hasKi ?? false;
    context.hasMagic = actor.system.config?.hasMagic ?? false;
    context.hasPsychic = actor.system.config?.hasPsychic ?? false;
    context.hasElan = actor.system.config?.hasElan ?? false;
    context.hasGrimoires = actor.system.config?.hasGrimoires ?? false;
    context.hasTechniques = actor.system.config?.hasTechniques ?? false;

    // Items by type for templates
    context.weapons = actor.items.filter(i => i.type === 'weapon');

    // Tabs for the nav template
    const tabs = this._prepareTabs('primary');
    context.tabs = Array.isArray(tabs) ? tabs : Object.values(tabs ?? {});
    context.armors = actor.items.filter(i => i.type === 'armor');
    context.combatSpecialSkills = actor.items.filter(i => i.type === 'combatSpecialSkill');
    context.advantages = actor.items.filter(i => i.type === 'advantage');
    context.disadvantages = actor.items.filter(i => i.type === 'disadvantage');
    context.effects = actor.items.filter(i => i.type === 'effect');

    // Dynamic tab items
    context.kiSkills = actor.items.filter(i => i.type === 'kiSkill');
    context.martialArts = actor.items.filter(i => i.type === 'martialArt');
    context.techniques = actor.items.filter(i => i.type === 'technique');
    context.spells = actor.items.filter(i => i.type === 'spell');
    context.metamagics = actor.items.filter(i => i.type === 'metamagic');
    context.summons = actor.items.filter(i => i.type === 'summon');
    context.psychicPowers = actor.items.filter(i => i.type === 'psychicPower');
    context.psychicDisciplines = actor.items.filter(i => i.type === 'psychicDiscipline');

    return context;
  }

  /** @override */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (group !== 'primary' || !tabs) return tabs;

    const cfg = this.document.system.config ?? {};
    const alwaysVisible = new Set(['resumen', 'general', 'principal', 'pds', 'combat', 'personalizacion']);

    const dynamicMap = {
      ki: cfg.hasKi,
      tecnicas: cfg.hasTechniques || cfg.hasKi,
      mistico: cfg.hasMagic,
      psiquicos: cfg.hasPsychic,
      elan: cfg.hasElan,
      grimorioMagia: cfg.hasGrimoires && cfg.hasMagic,
      grimorioPsiquica: cfg.hasGrimoires && cfg.hasPsychic
    };

    const tabList = Array.isArray(tabs) ? tabs : Object.values(tabs);
    for (const tab of tabList) {
      if (!tab?.id) continue;
      if (alwaysVisible.has(tab.id)) continue;
      const visible = dynamicMap[tab.id] ?? false;
      tab.hidden = !visible;
    }

    return tabs;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Activate rollable elements
    this.element.querySelectorAll('[data-action="roll"]').forEach(el => {
      el.addEventListener('click', ev => this.#handleRoll(ev));
    });

    // Activate sub-tab switching
    this.element.querySelectorAll('.sub-tabs button').forEach(btn => {
      btn.addEventListener('click', ev => this.#handleSubTab(ev));
    });
  }

  /**
   * Handle sub-tab switching within a PART
   */
  #handleSubTab(event) {
    const btn = event.currentTarget;
    const targetId = btn.dataset.subtab;
    const group = btn.closest('.sub-tabs').dataset.subtabGroup;
    if (!targetId || !group) return;

    // Deactivate all buttons and sections in this group
    const container = btn.closest('section') || btn.closest('[class^="tab-"]');
    container.querySelectorAll(`.sub-tabs[data-subtab-group="${group}"] button`).forEach(b => b.classList.remove('active'));
    container.querySelectorAll(`.subtab-section`).forEach(s => s.classList.remove('active'));

    // Activate target
    btn.classList.add('active');
    container.querySelector(`[data-subtab-content="${targetId}"]`)?.classList.add('active');
  }

  /**
   * Handle a roll click
   */
  async #handleRoll(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const formula = el.dataset.formula;
    const label = el.dataset.label ?? '';
    if (!formula) return;

    const actor = this.document;
    const settings = actor.system.general?.settings ?? {};
    const openThreshold = settings.openRolls?.value ?? 90;
    const fumbleRange = settings.fumbles?.value ?? 3;
    const openOnDoubles = settings.openOnDoubles?.value ?? false;

    // Parse base value from formula ("1d100 + 45" → base=45, "1d10 + 5" → characteristic)
    const match = formula.match(/(\d+)d(\d+)\s*\+\s*(-?\d+)/);
    if (!match) return;

    const dieSize = parseInt(match[2]);
    const base = parseInt(match[3]);

    // Ask for modifier
    const modifier = await openModDialog();

    let result;
    if (dieSize === 10) {
      // Characteristic roll (1d10)
      result = await ABFRoll.rollCharacteristic({ base, modifier });
    } else if (dieSize === 100) {
      // Check if this is a resistance (no explosion) or ability (explosion)
      const isResistance = el.closest('.section-box')?.querySelector('.section-title')?.textContent?.includes?.('Resist');
      if (isResistance) {
        result = await ABFRoll.rollResistance({ base, modifier });
      } else {
        // Open d100 roll
        const mastery = base >= 200;
        result = await ABFRoll.roll({ base, modifier, openThreshold, fumbleRange, openOnDoubles, mastery });
      }
    } else {
      // Fallback: simple roll
      const r = new Roll(formula);
      await r.evaluate();
      r.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: label });
      return;
    }

    await result.toChat({ label, actor });
  }

  /**
   * Static action handler for rolls
   */
  static #onRoll(event, target) {
    // Handled by instance method via _onRender listener
  }

  /**
   * Add a new level block
   */
  static async #onAddLevel(event, target) {
    const sheet = this;
    const actor = sheet.document;

    // Simple prompt for category name
    const categories = [
      'Guerrero', 'Guerrero Acróbata', 'Paladín', 'Paladín Oscuro',
      'Maestro en Armas', 'Tecnicista', 'Tao', 'Explorador', 'Sombra',
      'Ladrón', 'Asesino', 'Hechicero', 'Warlock', 'Ilusionista',
      'Hechicero Mentalista', 'Conjurador', 'Guerrero Conjurador',
      'Mentalista', 'Guerrero Mentalista', 'Novel'
    ];

    const options = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    const content = `
      <form>
        <div class="form-group">
          <label>${game.i18n.localize('ABF.PDs.SeleccionarCategoria')}</label>
          <select name="category">${options}</select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('ABF.PDs.CuantosNiveles')}</label>
          <input type="number" name="levels" value="1" min="1" max="20" />
        </div>
      </form>
    `;

    const result = await Dialog.prompt({
      title: game.i18n.localize('ABF.PDs.AnadirNivel'),
      content,
      callback: html => {
        const form = html.querySelector ? html.querySelector('form') : html[0]?.querySelector('form');
        return {
          category: form?.querySelector('[name=category]')?.value ?? 'Guerrero',
          levels: Number(form?.querySelector('[name=levels]')?.value) || 1
        };
      },
      rejectClose: false
    });

    if (!result) return;

    const existing = actor.system.general.levels ?? [];
    const newBlock = {
      _id: foundry.utils.randomID(),
      name: result.category,
      system: {
        level: result.levels,
        order: existing.length + 1,
        pd: {
          attack: { value: 0 }, block: { value: 0 }, dodge: { value: 0 }, wearArmor: { value: 0 },
          zeon: { value: 0 }, act: { value: 0 }, magicProjection: { value: 0 },
          summon: { value: 0 }, control: { value: 0 }, bind: { value: 0 }, banish: { value: 0 },
          cv: { value: 0 }, psychicProjection: { value: 0 },
          ki: { value: 0 }, kiAccum: { value: 0 },
          athletic: { value: 0 }, social: { value: 0 }, perceptive: { value: 0 },
          intellectual: { value: 0 }, vigor: { value: 0 }, subterfuge: { value: 0 }, creative: { value: 0 },
          lifeMultiples: { value: 0 }
        }
      }
    };

    await actor.update({ 'system.general.levels': [...existing, newBlock] });
  }

  /**
   * Delete a level block
   */
  static async #onDeleteLevel(event, target) {
    const sheet = this;
    const actor = sheet.document;
    const idx = Number(target.dataset.levelIdx);
    const levels = [...(actor.system.general.levels ?? [])];

    if (idx >= 0 && idx < levels.length) {
      levels.splice(idx, 1);
      levels.forEach((l, i) => { if (l.system) l.system.order = i + 1; });
      await actor.update({ 'system.general.levels': levels });
    }
  }
}
