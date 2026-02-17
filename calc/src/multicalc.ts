
import {calculate} from './calc';
import type {Pokemon} from './pokemon';
import type {Move} from './move';
import type {Field} from './field';
import type {Result} from './result';
import type {Generation} from './data/interface';
import {computeMultiHitKOChance, getBerryRecovery} from './desc';

import { MultiResult } from './multi-result';

export function calculateMulti(
  gen: Generation,
  attackers: Pokemon[],
  defender: Pokemon,
  moves: Move[],
  field: Field
): MultiResult {
  const results: Result[] = [];
  const currentDefender = defender.clone();
  let berryConsumed = false;

  const damageArrays: number[][] = [];
  const berryRecoveries: number[] = [];
  const berryThresholds: number[] = [];

  for (let i = 0; i < attackers.length; i++) {
    const attacker = attackers[i];
    const move = moves[i];

    const result = calculate(gen, attacker, currentDefender, move, field);
    results.push(result);

    if (typeof result.damage === 'number') {
      damageArrays.push(Array(16).fill(result.damage));
    } else if (Array.isArray(result.damage)) {
      if (result.damage.length > 0 && Array.isArray(result.damage[0])) {
        (result.damage as number[][]).forEach(r => damageArrays.push(r));
      } else {
        damageArrays.push(result.damage as number[]);
      }
    } else {
      damageArrays.push(Array(16).fill(0));
    }

    let recovery = 0;
    let threshold = 0;

    const berryData = getBerryRecovery(attacker, currentDefender, gen, move);
    recovery = berryData.recovery;
    threshold = berryData.threshold;

    let maxDamage = 0;
    if (typeof result.damage === 'number') {
      maxDamage = result.damage;
    } else if (
      Array.isArray(result.damage) &&
      result.damage.length > 0 &&
      Array.isArray(result.damage[0])
    ) {
      maxDamage = (result.damage as number[][]).reduce((sum, rolls) => sum + rolls[15], 0);
    } else if (Array.isArray(result.damage)) {
      maxDamage = (result.damage as number[])[15];
    }

    const hitsAdded =
      result.damage &&
      Array.isArray(result.damage) &&
      Array.isArray(result.damage[0])
        ? result.damage.length
        : 1;

    if (!berryConsumed && recovery > 0) {
      const currentHP = currentDefender.curHP();
      const maxHP = currentDefender.maxHP();

      if (currentHP - maxDamage <= threshold) {
        berryConsumed = true;
        currentDefender.item = undefined;
        currentDefender.originalCurHP = Math.min(maxHP, currentHP - maxDamage + recovery);
        result.berryHP = recovery;
      } else {
        currentDefender.originalCurHP = Math.max(0, currentHP - maxDamage);
      }
    } else {
      currentDefender.originalCurHP = Math.max(0, currentDefender.curHP() - maxDamage);
    }

    for (let k = 0; k < hitsAdded; k++) {
      const initialBerryData = getBerryRecovery(attacker, defender, gen, move);
      berryRecoveries.push(initialBerryData.recovery);
      berryThresholds.push(initialBerryData.threshold);
    }
  }

  let koChance = {chance: 0, n: 0, text: '', berryConsumed: false};

  for (let i = 1; i <= attackers.length; i++) {
    const currentDamageArrays: number[][] = [];
    const currentBerryRecoveries: number[] = [];
    const currentBerryThresholds: number[] = [];

    let idx = 0;
    for (let j = 0; j < i; j++) {
      const result = results[j];
      let hits = 1;
      if (
        Array.isArray(result.damage) &&
        result.damage.length > 0 &&
        Array.isArray(result.damage[0])
      ) {
        hits = result.damage.length;
      }

      for (let k = 0; k < hits; k++) {
        currentDamageArrays.push(damageArrays[idx]);
        currentBerryRecoveries.push(berryRecoveries[idx]);
        currentBerryThresholds.push(berryThresholds[idx]);
        idx++;
      }
    }

    const result = computeMultiHitKOChance(
      currentDamageArrays,
      defender.maxHP(),
      0,
      defender.curHP(),
      currentBerryRecoveries,
      currentBerryThresholds
    );

    if (result.chance === 1) {
      koChance = {chance: 1, n: i, text: '', berryConsumed: result.berryConsumed};
      const hkoText = i === 1 ? 'OHKO' : `${i}HKO`;
      const berryText = result.berryConsumed ? ` after ${defender.item} recovery` : '';
      koChance.text = `guaranteed ${hkoText}${berryText}`;
      break;
    }

    if (i === attackers.length) {
      koChance = {chance: result.chance, n: i, text: '', berryConsumed: result.berryConsumed};
      if (result.chance > 0) {
        const hkoText = i === 1 ? 'OHKO' : `${i}HKO`;
        const berryText = result.berryConsumed ? ` after ${defender.item} recovery` : '';
        const percentage = Math.max(Math.min(Math.round(result.chance * 1000), 999), 1) / 10;
        koChance.text = `${percentage}% chance to ${hkoText}${berryText}`;
      } else {
        koChance.text = 'possibly the worst move ever';
      }
    }
  }

  return new MultiResult(results, koChance);
}
