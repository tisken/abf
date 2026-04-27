/**
 * ABF — Anima Beyond Fantasy for Foundry VTT v14
 * Entry point
 */
import { ABFActor } from './actor/ABFActor.mjs';
import { ABFItem } from './items/ABFItem.mjs';
import { ABFActorSheet } from './actor/ABFActorSheet.mjs';
import { ABFItemSheet } from './items/ABFItemSheet.mjs';
import { registerSettings } from './utils/settings.mjs';

Hooks.once('init', () => {
  console.log('ABF | Initializing Anima Beyond Fantasy');

  game.abf = { id: 'abf' };

  // Settings
  registerSettings();

  // Document classes
  CONFIG.Actor.documentClass = ABFActor;
  CONFIG.Item.documentClass = ABFItem;

  // Actor sheets
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('abf', ABFActorSheet, {
    types: ['character'],
    makeDefault: true,
    label: 'ABF.SheetActor'
  });

  // Item sheets
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('abf', ABFItemSheet, {
    makeDefault: true,
    label: 'ABF.SheetItem'
  });

  // Preload partials
  const partials = [
    'systems/abf/templates/actor/parts/header/header.hbs',
    'systems/abf/templates/actor/parts/resumen/resumen.hbs',
    'systems/abf/templates/actor/parts/general/general.hbs',
    'systems/abf/templates/actor/parts/principal/principal.hbs',
    'systems/abf/templates/actor/parts/pds/pds.hbs',
    'systems/abf/templates/actor/parts/combat/combat.hbs',
    'systems/abf/templates/actor/parts/personalizacion/personalizacion.hbs',
    'systems/abf/templates/actor/parts/ki/ki.hbs',
    'systems/abf/templates/actor/parts/tecnicasKi/tecnicasKi.hbs',
    'systems/abf/templates/actor/parts/misticos/misticos.hbs',
    'systems/abf/templates/actor/parts/psiquicos/psiquicos.hbs',
    'systems/abf/templates/actor/parts/elan/elan.hbs',
    'systems/abf/templates/actor/parts/grimorioMagia/grimorioMagia.hbs',
    'systems/abf/templates/actor/parts/grimorioPsiquica/grimorioPsiquica.hbs'
  ];
  loadTemplates(partials);

  console.log('ABF | System initialized');
});

Hooks.once('ready', () => {
  console.log('ABF | System ready');
});
