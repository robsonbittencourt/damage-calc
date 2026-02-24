import {Field} from './field';
import type {Generation} from './data/interface';
import type {Move} from './move';
import type {Pokemon} from './pokemon';
import type {Result} from './result';

import {calculateRBYGSC} from './mechanics/gen12';
import {calculateADV} from './mechanics/gen3';
import {calculateDPP} from './mechanics/gen4';
import {calculateBWXY} from './mechanics/gen56';
import {calculateSMSSSV} from './mechanics/gen789';

const MECHANICS = [
  () => {},
  calculateRBYGSC,
  calculateRBYGSC,
  calculateADV,
  calculateDPP,
  calculateBWXY,
  calculateBWXY,
  calculateSMSSSV,
  calculateSMSSSV,
  calculateSMSSSV,
];

export function calculate(
  gen: Generation,
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  field?: Field,
) {
  attacker = attacker.clone();
  defender = defender.clone();
  move = move.clone();
  field = field ? field.clone() : new Field();

  const result = MECHANICS[gen.num](
    gen,
    attacker,
    defender,
    move,
    field,
  ) as Result;

  return result;
}
