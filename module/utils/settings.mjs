/**
 * ABF System Settings
 */
export const ABF_SETTINGS = {
  AUTO_ACCEPT_COMBAT: 'autoAcceptCombat',
  ROUND_DAMAGE_5: 'roundDamage5',
  USE_DAMAGE_TABLE: 'useDamageTable',
  SEND_ROLL_MESSAGES: 'sendRollMessages',
  AUTOMATE_DISTANCE: 'automateDistance',
  DEVELOP_MODE: 'developMode'
};

export function registerSettings() {
  const id = 'abf';

  game.settings.register(id, ABF_SETTINGS.AUTO_ACCEPT_COMBAT, {
    name: 'ABF.Settings.AutoAcceptCombat',
    hint: 'ABF.Settings.AutoAcceptCombatHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(id, ABF_SETTINGS.ROUND_DAMAGE_5, {
    name: 'ABF.Settings.RoundDamage5',
    hint: 'ABF.Settings.RoundDamage5Hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(id, ABF_SETTINGS.USE_DAMAGE_TABLE, {
    name: 'ABF.Settings.UseDamageTable',
    hint: 'ABF.Settings.UseDamageTableHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(id, ABF_SETTINGS.SEND_ROLL_MESSAGES, {
    name: 'ABF.Settings.SendRollMessages',
    hint: 'ABF.Settings.SendRollMessagesHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(id, ABF_SETTINGS.AUTOMATE_DISTANCE, {
    name: 'ABF.Settings.AutomateDistance',
    hint: 'ABF.Settings.AutomateDistanceHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(id, ABF_SETTINGS.DEVELOP_MODE, {
    name: 'ABF.Settings.DevelopMode',
    hint: 'ABF.Settings.DevelopModeHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });
}
