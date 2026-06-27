import {
  type Result,
  AfterTurnResult,
  type AfterTurnData,
  extractDamageSubArrays,
  DEFAULT_ROLL_INDEX,
} from './result';
import type {Pokemon} from './pokemon';
import type {StatID} from './data/interface';
import {
  computeMultiHitKOChance,
  getBerryRecovery,
  getDamageWithoutBerry,
  getEndOfTurn,
  serializeEndOfTurnTexts,
} from './desc';
import {Move} from './move';
import {calculate} from './calc';
import {getModifiedStat} from './mechanics/util';
import {getBerryResistType} from './items';

export class MultiResult {
  defender: Pokemon;
  results: Result[];
  koChance: {
    chance: number;
    n: number;
    text: string;
    berryConsumed: boolean;
  };
  eot: { damage: number; texts: string[] };

  constructor(
    defender: Pokemon,
    results: Result[],
    koChance: {
      chance: number;
      n: number;
      text: string;
      berryConsumed: boolean;
    },
    eot: { damage: number; texts: string[] },
  ) {
    this.defender = defender;
    this.results = results;
    this.koChance = koChance;
    this.eot = eot;
  }

  afterTurn(rollIndex = DEFAULT_ROLL_INDEX): AfterTurnResult {
    const gen = this.results[0].gen;
    const defender = this.results[0].defender;
    const field = this.results[0].field;
    const hp = defender.curHP();

    const splash = new Move(gen, 'Splash');
    const baseEot = getEndOfTurn(
      gen,
      this.results[0].attacker,
      defender,
      splash,
      field,
    );

    let totalEotDamage = baseEot.damage;

    for (const result of this.results) {
      const resultEot = getEndOfTurn(
        gen,
        result.attacker,
        defender,
        result.move,
        field,
      );
      const moveSpecific = Math.min(0, resultEot.damage - baseEot.damage);
      totalEotDamage += moveSpecific;
    }

    const berry = getBerryRecovery(
      this.results[0].attacker,
      defender,
      gen,
      this.results[0].move,
    );

    const data: AfterTurnData[] = [];
    let currentHP = hp;
    let berryConsumed = false;

    const sumDamage = (damage: typeof this.results[0]['damage']): number => {
      const subArrays = extractDamageSubArrays(damage);
      if (subArrays.length === 0) return 0;
      const flat = subArrays.map(arr => arr[Math.min(rollIndex, arr.length - 1)]);
      return flat.reduce((a, b) => a + b, 0);
    };

    const damagesAtIndex = this.results.map(r => sumDamage(r.damage));
    const damagesWithoutBerryAtIndex = this.results.map(r => {
      const withoutBerry = getDamageWithoutBerry(r.damage, r.rawDesc, r.move, defender);
      return withoutBerry !== undefined ? sumDamage(withoutBerry) : null;
    });
    const hasTypeBerry = damagesWithoutBerryAtIndex.some(d => d !== null);
    const hasStamina = this.hasStaminaDefender();
    let staminaBoost = hasStamina ? this.initialDefBoost() : 0;
    let staminaTypeBerryAvailable = true;

    for (let i = 1; i <= 10; i++) {
      let turnValue = 0;
      let turnDamages: number[];

      if (hasStamina) {
        const turn = this.staminaTurnDamages(staminaBoost, rollIndex, staminaTypeBerryAvailable);
        turnDamages = turn.damages;
        staminaBoost = turn.nextBoost;
        staminaTypeBerryAvailable = turn.typeBerryAvailable;
      } else {
        turnDamages = i === 1 || !hasTypeBerry
          ? damagesAtIndex
          : damagesWithoutBerryAtIndex.map((d, idx) => d ?? damagesAtIndex[idx]);
      }

      for (const dmg of turnDamages) {
        currentHP -= dmg;

        if (
          !berryConsumed &&
          berry.recovery > 0 &&
          currentHP <= berry.threshold &&
          currentHP > 0
        ) {
          turnValue += berry.recovery;
          currentHP += berry.recovery;
          if (currentHP > defender.maxHP()) currentHP = defender.maxHP();
          berryConsumed = true;
        }
      }

      if (currentHP <= 0) {
        data.push({turn: i, residualDelta: turnValue, hp: 0});
        break;
      }

      currentHP += totalEotDamage;
      turnValue += totalEotDamage;
      if (currentHP > defender.maxHP()) currentHP = defender.maxHP();
      data.push({turn: i, residualDelta: turnValue, hp: currentHP});

      if (currentHP <= 0) {
        break;
      }
    }

    return new AfterTurnResult(data);
  }

  getHKO(): string {
    if (this.koChance.chance === 1 || this.koChance.n === 1) {
      return this.koChance.text;
    }

    const target = this.results[0].defender;
    const gen = this.results[0].gen;

    const baseDamages: number[][] = [];
    const baseBerryRecovery: number[] = [];
    const baseBerryThreshold: number[] = [];

    for (const result of this.results) {
      const damage = extractDamageSubArrays(result.damage);
      const berry = getBerryRecovery(result.attacker, target, gen, result.move);

      baseDamages.push(...damage);
      for (let k = 0; k < damage.length; k++) {
        baseBerryRecovery.push(berry.recovery);
        baseBerryThreshold.push(berry.threshold);
      }
    }

    const rowsPerTurn = baseDamages.length;
    const toxicCounter = target.status === 'tox' ? target.toxicCounter : 0;
    const hasStamina = this.hasStaminaDefender();
    const allStaminaDamages = hasStamina ? this.staminaHitDamages(9) : [];

    for (let i = 1; i <= 9; i++) {
      const currentBerryRecovery: number[] = [];
      const currentBerryThreshold: number[] = [];

      for (let j = 0; j < i; j++) {
        currentBerryRecovery.push(...baseBerryRecovery);
        currentBerryThreshold.push(...baseBerryThreshold);
      }

      const currentDamages: number[][] = hasStamina
        ? allStaminaDamages.slice(0, i * rowsPerTurn)
        : [];

      if (!hasStamina) {
        for (let j = 0; j < i; j++) {
          currentDamages.push(...baseDamages);
        }
      }

      const result = computeMultiHitKOChance(
        currentDamages,
        target.curHP(),
        this.eot.damage,
        target.maxHP(),
        currentBerryRecovery,
        currentBerryThreshold,
        rowsPerTurn,
        toxicCounter,
      );

      if (result.chance > 0) {
        const hkoText = i === 1 ? 'OHKO' : `${i}HKO`;
        const berryText = result.berryConsumed
          ? ` after ${target.item} recovery`
          : '';
        const eotText =
          this.eot.texts.length > 0
            ? ` after ${serializeEndOfTurnTexts(this.eot.texts)}`
            : '';

        if (result.chance === 1) {
          return `guaranteed ${hkoText}${berryText}${eotText}`;
        }

        const percentage =
          Math.max(Math.min(Math.round(result.chance * 1000), 999), 1) / 10;
        return `${percentage}% chance to ${hkoText}${berryText}${eotText}`;
      }
    }

    return '10HKO or more';
  }

  range(): { min: number; max: number } {
    let min = 0;
    let max = 0;

    for (const result of this.results) {
      const damage = extractDamageSubArrays(result.damage);
      const r = this.getMinMaxDamageFromRolls(damage);
      min += r.min;
      max += r.max;
    }

    return {min, max};
  }

  rangePercentage(): { min: number; max: number } {
    const {min, max} = this.range();
    const defender = this.results[0].defender;

    return {
      min: Math.floor((min / defender.originalCurHP) * 1000) / 10,
      max: Math.floor((max / defender.originalCurHP) * 1000) / 10,
    };
  }

  resultString(): string {
    const {min, max} = this.rangePercentage();
    return `${min} - ${max}%`;
  }

  desc(): string {
    if (this.results.length < 2) {
      return this.results[0]?.desc() || 'No result';
    }

    const resultOne = this.results[0];
    const resultTwo = this.results[1];
    const defender = resultOne.defender;

    try {
      const attackerDescription = resultOne
        .desc()
        .substring(0, resultOne.desc().indexOf(' vs.'));
      const secondAttackerDescritption = resultTwo
        .desc()
        .substring(0, resultTwo.desc().indexOf(' vs.'));
      const defenderDescription = resultOne
        .desc()
        .substring(resultOne.desc().indexOf(' vs.') + 5);

      const defenderBulk = this.mergeBulkStats(resultOne, resultTwo, defender);
      const tera = resultOne.defender.teraType
        ? `Tera ${resultOne.defender.teraType} `
        : '';
      const defenderNameAndDamageString = defenderDescription.substring(
        defenderDescription.indexOf(resultOne.defender.name),
      );

      const {min: totalMin, max: totalMax} = this.range();
      const {min: minPercent, max: maxPercent} = this.rangePercentage();

      const staminaText = this.hasStaminaDefender()
        ? ' (Stamina considered)'
        : '';
      const defenderNameAndDamageWithNote = defenderNameAndDamageString.replace(
        `${resultOne.defender.name}:`,
        `${resultOne.defender.name}${staminaText}:`,
      );

      const defenderNameAndDamage = this.updateDefenderDamageText(
        defenderNameAndDamageWithNote,
        totalMin,
        totalMax,
        minPercent,
        maxPercent,
      );

      const koChanceText = this.getHKO();

      if (koChanceText) {
        const baseText = defenderNameAndDamage.includes(' -- ')
          ? defenderNameAndDamage.substring(
            0,
            defenderNameAndDamage.indexOf(' -- '),
          )
          : defenderNameAndDamage;

        return (
          `${attackerDescription} AND ${secondAttackerDescritption}` +
          ` vs. ${defenderBulk} ${tera}${baseText} -- ${koChanceText}`
        );
      }

      return (
        `${attackerDescription} AND ${secondAttackerDescritption}` +
        ` vs. ${defenderBulk} ${tera}${defenderNameAndDamage}${staminaText}`
      );
    } catch (e) {
      return (
        `${resultOne.attacker.name} ${resultOne.move.name}` +
        ` AND ${resultTwo.attacker.name} ${resultTwo.move.name}` +
        ` vs. ${resultOne.defender.name}: 0-0 (0 - 0%) -- possibly the worst move ever`
      );
    }
  }

  maxDamage(): number {
    return this.range().max;
  }

  damageWithRemainingUntilTurn(turn: number, rollIndex = DEFAULT_ROLL_INDEX): number {
    const hp = this.defender.curHP();
    const remainingHp = this.afterTurn(rollIndex).remainingHpUntilTurn(turn);

    return hp - remainingHp;
  }

  private hasStaminaDefender(): boolean {
    return this.defender.hasAbility('Stamina');
  }

  private initialDefBoost(): number {
    return this.defender.boosts.def ?? 0;
  }

  private recomputeDamageCache = new Map<string, number[][]>();

  private consumesTypeBerry(result: Result): boolean {
    const berryType = getBerryResistType(this.defender.item);

    return berryType !== undefined && result.move.hasType(berryType);
  }

  private recomputeDamageAtBoost(
    resultIndex: number,
    defBoost: number,
    typeBerryAvailable = true,
  ): number[][] {
    const result = this.results[resultIndex];
    const boost = Math.max(-6, Math.min(defBoost, 6));
    const cacheKey = `${resultIndex}:${boost}:${typeBerryAvailable ? 1 : 0}`;
    const cached = this.recomputeDamageCache.get(cacheKey);

    if (cached) return cached;

    const defender = this.defender.clone();
    defender.boosts.def = boost;
    defender.stats.def = getModifiedStat(
      defender.rawStats.def,
      defender.boosts.def,
      result.gen,
    );

    if (!typeBerryAvailable) {
      defender.item = undefined;
    }

    const recomputed = calculate(
      result.gen,
      result.attacker,
      defender,
      result.move,
      result.field,
    );

    const subArrays = extractDamageSubArrays(recomputed.damage);
    this.recomputeDamageCache.set(cacheKey, subArrays);

    return subArrays;
  }

  private staminaTurnDamages(
    startBoost: number,
    rollIndex: number,
    typeBerryAvailable: boolean,
  ): {damages: number[]; nextBoost: number; typeBerryAvailable: boolean} {
    const damages: number[] = [];
    let boost = startBoost;
    let berryAvailable = typeBerryAvailable;

    for (let idx = 0; idx < this.results.length; idx++) {
      const subArrays = this.recomputeDamageAtBoost(idx, boost, berryAvailable);

      const summed = subArrays.reduce(
        (acc, sub) => acc + sub[Math.min(rollIndex, sub.length - 1)],
        0,
      );
      damages.push(summed);
      boost = Math.min(boost + subArrays.length, 6);

      if (berryAvailable && this.consumesTypeBerry(this.results[idx])) {
        berryAvailable = false;
      }
    }

    return {damages, nextBoost: boost, typeBerryAvailable: berryAvailable};
  }

  private staminaHitDamages(turns: number): number[][] {
    const damages: number[][] = [];
    let boost = this.initialDefBoost();
    let berryAvailable = true;

    for (let turn = 0; turn < turns; turn++) {
      for (let idx = 0; idx < this.results.length; idx++) {
        const subArrays = this.recomputeDamageAtBoost(idx, boost, berryAvailable);
        const consumesBerry = berryAvailable && this.consumesTypeBerry(this.results[idx]);

        subArrays.forEach((sub) => {
          damages.push(sub);
          boost = Math.min(boost + 1, 6);
        });

        if (consumesBerry) {
          berryAvailable = false;
        }
      }
    }

    return damages;
  }

  private mergeBulkStats(
    resultOne: Result,
    resultTwo: Result,
    defender: Pokemon,
  ): string {
    const resultOneDefenderDesc = resultOne
      .desc()
      .substring(resultOne.desc().indexOf(' vs.') + 5);
    const resultTwoDefenderDesc = resultTwo
      .desc()
      .substring(resultTwo.desc().indexOf(' vs.') + 5);

    let output = `${resultOne.defender.evs.hp} HP`;

    output += this.modifyStat(
      defender,
      resultOneDefenderDesc,
      resultTwoDefenderDesc,
      'def',
      'Def',
    );
    output += this.modifyStat(
      defender,
      resultOneDefenderDesc,
      resultTwoDefenderDesc,
      'spd',
      'SpD',
    );

    if (
      resultOneDefenderDesc.includes(resultOne.defender.item!) ||
      resultTwoDefenderDesc.includes(resultTwo.defender.item!)
    ) {
      output += ` ${resultOne.defender.item}`;
    }

    return output;
  }

  private modifyStat(
    defender: Pokemon,
    resultOneDefenderDesc: string,
    resultTwoDefenderDesc: string,
    stat: StatID,
    statText: string,
  ) {
    let output = '';

    if (
      resultOneDefenderDesc.includes(statText) ||
      resultTwoDefenderDesc.includes(statText)
    ) {
      output += ' /';
      output += this.boostByStat(defender, stat);
      output += ` ${defender.evs[stat]}`;
      output += this.natureModifier(defender, stat);
      output += ` ${statText}`;
    }

    return output;
  }

  private boostByStat(pokemon: Pokemon, stat: StatID): string {
    if (pokemon.boosts[stat] && pokemon.boosts[stat] > 0) {
      return ` +${pokemon.boosts[stat]}`;
    }

    if (pokemon.boosts[stat] && pokemon.boosts[stat] < 0) {
      return ` ${pokemon.boosts[stat]}`;
    }

    return '';
  }

  private natureModifier(pokemon: Pokemon, stat: StatID) {
    if (
      stat === 'def' &&
      ['Bold', 'Impish', 'Lax', 'Relaxed'].includes(pokemon.nature)
    ) { return '+'; }
    if (
      stat === 'def' &&
      ['Lonely', 'Mild', 'Gentle', 'Hasty'].includes(pokemon.nature)
    ) { return '-'; }

    if (
      stat === 'spd' &&
      ['Calm', 'Gentle', 'Careful', 'Sassy'].includes(pokemon.nature)
    ) { return '+'; }
    if (
      stat === 'spd' &&
      ['Naughty', 'Lax', 'Rash', 'Naive'].includes(pokemon.nature)
    ) { return '-'; }

    return '';
  }

  private getMinMaxDamageFromRolls(rolls: number[][]): {
    min: number;
    max: number;
  } {
    let min = 0;
    let max = 0;

    for (const sub of rolls) {
      if (sub.length > 0) {
        min += sub[0];
        max += sub[sub.length - 1];
      }
    }

    return {min, max};
  }

  private updateDefenderDamageText(
    text: string,
    totalMin: number,
    totalMax: number,
    minPercent: number,
    maxPercent: number,
  ): string {
    const lastColonIndex = text.lastIndexOf(':');

    if (lastColonIndex !== -1) {
      const prefix = text.substring(0, lastColonIndex);
      return `${prefix}: ${totalMin}-${totalMax} (${minPercent} - ${maxPercent}%)`;
    }

    const regex = /: \d+-\d+ \(\d+(\.\d+)? - \d+(\.\d+)?%\)/;

    if (regex.test(text)) {
      return text.replace(
        regex,
        `: ${totalMin}-${totalMax} (${minPercent} - ${maxPercent}%)`,
      );
    }

    return text;
  }
}
