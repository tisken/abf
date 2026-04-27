const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class ABFItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['abf', 'sheet', 'item'],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: 'systems/abf/templates/items/item-sheet.hbs' }
  };

  get title() {
    return `${this.document.name} (${this.document.type})`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.system = this.document.system;
    context.type = this.document.type;
    context.editable = this.isEditable;

    // Type-specific flags
    context.isWeapon = this.document.type === 'weapon';
    context.isArmor = this.document.type === 'armor';
    context.isSpell = this.document.type === 'spell';
    context.isPsychicPower = this.document.type === 'psychicPower';
    context.isTechnique = this.document.type === 'technique';
    context.isAdvantage = this.document.type === 'advantage';
    context.isDisadvantage = this.document.type === 'disadvantage';
    context.isSummon = this.document.type === 'summon';
    context.isKiSkill = this.document.type === 'kiSkill';
    context.isMartialArt = this.document.type === 'martialArt';
    context.isMetamagic = this.document.type === 'metamagic';
    context.isAmmo = this.document.type === 'ammo';
    context.isInventoryItem = this.document.type === 'inventoryItem';
    context.isSupernaturalShield = this.document.type === 'supernaturalShield';
    context.isMentalPattern = this.document.type === 'mentalPattern';

    return context;
  }
}
