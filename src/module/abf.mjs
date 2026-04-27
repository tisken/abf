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

  console.log('ABF | System initialized');
});

Hooks.once('ready', () => {
  console.log('ABF | System ready');
});
