import {
  type RawDesc,
  display,
  displayMove,
  getRecovery,
  getRecoil,
  getKOChance,
  getBerryRecovery,
  getEndOfTurn,
} from './desc';
import type {Generation} from './data/interface';
import type {Field} from './field';
import type {Move} from './move';
import type {Pokemon} from './pokemon';

export type Damage = number | number[] | [number, number] | number[][];
export interface AfterTurnData {
  turn: number;
  residualDelta: number;
  hp: number;
}
export class AfterTurnResult {
  afterTurnData: AfterTurnData[];

  constructor(afterTurnData: AfterTurnData[]) {
    this.afterTurnData = afterTurnData;
  }

  totalResidualHpUntilKO(): number {
    return this.afterTurnData.reduce(
      (sum, turn) => sum + turn.residualDelta,
      0,
    );
  }

  residualHpInTurn(turn: number): number {
    return this.afterTurnData[turn - 1]?.residualDelta ?? 0;
  }

  remainingHpUntilTurn(turn: number): number {
    return this.afterTurnData[turn - 1]?.hp ?? 0;
  }
}

export class Result {
  gen: Generation;
  attacker: Pokemon;
  defender: Pokemon;
  move: Move;
  field: Field;
  damage: number | number[] | number[][];
  rawDesc: RawDesc;

  private _turnEot?: number;
  private _berryHP?: number;

  constructor(
    gen: Generation,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    field: Field,
    damage: Damage,
    rawDesc: RawDesc,
    berryHP?: number,
  ) {
    this.gen = gen;
    this.attacker = attacker;
    this.defender = defender;
    this.move = move;
    this.field = field;
    this.damage = damage;
    this.rawDesc = rawDesc;
    this._berryHP = berryHP;
  }

  afterTurn(): AfterTurnResult {
    const range = multiDamageRange(this.damage);
    const hitsMax =
      typeof range[0] === 'number'
        ? [range[1] as number]
        : (range[1] as number[]);
    const minDamageTotal = damageRange(this.damage)[0];
    const hp = this.defender.curHP();

    if (this._turnEot === undefined) {
      this._turnEot = getEndOfTurn(
        this.gen,
        this.attacker,
        this.defender,
        this.move,
        this.field,
      ).damage;
    }

    const eot = this._turnEot;
    const berry = getBerryRecovery(
      this.attacker,
      this.defender,
      this.gen,
      this.move,
    );
    const berryHP = this._berryHP ?? berry.recovery;

    const data: AfterTurnData[] = [];
    let currentHP = hp;
    let firstBerryTurn = 0;

    if (hitsMax.some((h) => h > 0)) {
      for (let i = 1; i <= 10; i++) {
        let turnValue = 0;

        for (const hitDamage of hitsMax) {
          currentHP -= hitDamage;

          if (
            firstBerryTurn === 0 &&
            berryHP > 0 &&
            currentHP <= berry.threshold &&
            currentHP > 0
          ) {
            turnValue += berryHP;
            currentHP += berryHP;
            if (currentHP > this.defender.maxHP()) { currentHP = this.defender.maxHP(); }
            firstBerryTurn = i;
          }
        }

        if (currentHP <= 0) {
          data.push({turn: i, residualDelta: turnValue, hp: 0});
          break;
        }

        const minHPAfterMove =
          hp - minDamageTotal * i + (eot > 0 ? eot : 0) * (i - 1);
        if (minHPAfterMove <= 0) {
          data.push({
            turn: i,
            residualDelta: turnValue,
            hp: Math.max(0, currentHP),
          });
          break;
        }

        currentHP += eot;
        turnValue += eot;
        if (currentHP > this.defender.maxHP()) { currentHP = this.defender.maxHP(); }
        data.push({
          turn: i,
          residualDelta: turnValue,
          hp: Math.max(0, currentHP),
        });

        if (currentHP <= 0 || minHPAfterMove + eot <= 0) {
          break;
        }
      }
    }

    return new AfterTurnResult(data);
  }

  /* get */ desc() {
    return this.fullDesc();
  }

  range(): [number, number] {
    const [min, max] = damageRange(this.damage);
    return [min, max];
  }

  fullDesc(notation = '%', err = true) {
    return display(
      this.gen,
      this.attacker,
      this.defender,
      this.move,
      this.field,
      this.damage,
      this.rawDesc,
      notation,
      err,
    );
  }

  moveDesc(notation = '%') {
    return displayMove(
      this.gen,
      this.attacker,
      this.defender,
      this.move,
      this.damage,
      notation,
    );
  }

  recovery(notation = '%') {
    return getRecovery(
      this.gen,
      this.attacker,
      this.defender,
      this.move,
      this.damage,
      notation,
    );
  }

  recoil(notation = '%') {
    return getRecoil(
      this.gen,
      this.attacker,
      this.defender,
      this.move,
      this.damage,
      notation,
    );
  }

  kochance(err = true) {
    return getKOChance(
      this.gen,
      this.attacker,
      this.defender,
      this.move,
      this.field,
      this.damage,
      this.rawDesc,
      err,
    );
  }

  maxDamage() {
    return this.range()[1];
  }

  maxDamageWithRemainingUntilTurn(turn: number): number {
    const hp = this.defender.curHP();
    const remainingHp = this.afterTurn().remainingHpUntilTurn(turn);

    return hp - remainingHp;
  }
}

export function extractDamageSubArrays(damage: Damage): number[][] {
  if (typeof damage === 'number') return [[damage]];
  if (Array.isArray(damage)) {
    if (damage.length === 0) return [];
    if (Array.isArray(damage[0])) return damage as number[][];
    return [damage as number[]];
  }
  return [];
}

export function damageRange(damage: Damage): [number, number] {
  const range = multiDamageRange(damage);
  if (typeof range[0] === 'number') return range as [number, number];
  const d = range as [number[], number[]];
  const summedRange: [number, number] = [0, 0];
  for (let i = 0; i < d[0].length; i++) {
    summedRange[0] += d[0][i];
    summedRange[1] += d[1][i];
  }
  return summedRange;
}

export function multiDamageRange(
  damage: Damage,
): [number, number] | [number[], number[]] {
  // Fixed Damage
  if (typeof damage === 'number') return [damage, damage];
  // Multihit Damage
  if (typeof damage[0] !== 'number') {
    damage = damage as number[][];
    const ranges: [number[], number[]] = [[], []];
    for (const damageList of damage) {
      ranges[0].push(damageList[0]);
      ranges[1].push(damageList[damageList.length - 1]);
    }
    return ranges;
  }
  const d = damage as number[];
  // Fixed Multihit
  if (d.length < 16) {
    return [d, d];
  }
  // Standard Damage
  return [d[0], d[d.length - 1]];
}
