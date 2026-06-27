/* eslint-disable max-len */
import {Generations, calculateMulti, Pokemon, Move, Field} from '../index';

describe('Stamina combined damage', () => {
  const gen = Generations.get(9);
  const field = () => new Field({gameType: 'Doubles'});

  const garchomp = () =>
    new Pokemon(gen, 'Garchomp', {level: 50, nature: 'Adamant', evs: {atk: 252, spe: 252}});
  const arcanine = () =>
    new Pokemon(gen, 'Arcanine', {level: 50, nature: 'Adamant', evs: {atk: 252, spe: 252}});

  const earthquakeAndRockSlide = () => [new Move(gen, 'Earthquake'), new Move(gen, 'Rock Slide')];

  test('second attacker hits the Stamina defender at Def +1 in a single turn', () => {
    const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina'});

    const multiResult = calculateMulti(gen, [garchomp(), arcanine()], archaludon, earthquakeAndRockSlide(), field());

    expect(multiResult.results[0].damage).toEqual([114, 114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132, 134]);
    expect(multiResult.results[1].damage).toEqual([8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10]);
    expect(multiResult.desc()).toBe('252+ Atk Garchomp Earthquake AND 252+ Atk Arcanine Rock Slide vs. 0 HP / 0 Def Archaludon (Stamina considered): 122-144 (73.9 - 87.2%) -- guaranteed 2HKO');
  });

  test('does not add the Stamina note when the defender does not have Stamina', () => {
    const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Sturdy'});

    const multiResult = calculateMulti(gen, [garchomp(), arcanine()], archaludon, earthquakeAndRockSlide(), field());

    expect(multiResult.desc()).not.toContain('Stamina considered');
  });

  test('does not raise Def beyond +6', () => {
    const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina'});
    archaludon.boosts.def = 6;

    const multiResult = calculateMulti(gen, [garchomp(), arcanine()], archaludon, earthquakeAndRockSlide(), field());

    expect(multiResult.results[0].damage).toEqual([30, 30, 30, 30, 30, 30, 30, 32, 32, 32, 32, 32, 32, 32, 32, 36]);
    expect(multiResult.results[1].damage).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4]);
  });

  test('Unaware attacker ignores the boost for its own hit but still raises it for the next attacker', () => {
    const clodsire = new Pokemon(gen, 'Clodsire', {level: 50, ability: 'Unaware', nature: 'Adamant', evs: {atk: 252}});

    const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina'});
    archaludon.boosts.def = 3;

    const multiResult = calculateMulti(gen, [clodsire, arcanine()], archaludon, [new Move(gen, 'Earthquake'), new Move(gen, 'Rock Slide')], field());

    expect(multiResult.results[0].damage).toEqual([78, 78, 78, 80, 80, 80, 84, 84, 84, 86, 86, 86, 90, 90, 90, 92]);
    expect(multiResult.results[1].damage).toEqual([4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
  });

  test('a non-Unaware first attacker is reduced by the pre-existing boost (control for the Unaware case)', () => {
    const clodsire = new Pokemon(gen, 'Clodsire', {level: 50, ability: 'Water Absorb', nature: 'Adamant', evs: {atk: 252}});

    const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina'});
    archaludon.boosts.def = 3;

    const multiResult = calculateMulti(gen, [clodsire, arcanine()], archaludon, [new Move(gen, 'Earthquake'), new Move(gen, 'Rock Slide')], field());

    expect(multiResult.results[0].damage).toEqual([32, 32, 32, 32, 32, 32, 32, 32, 36, 36, 36, 36, 36, 36, 36, 38]);
    expect(multiResult.results[1].damage).toEqual([4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
  });

  describe('KO chance accounts for the rising boost across turns', () => {
    const bulkyEvs = {hp: 252, def: 252, spd: 4};

    test('Stamina survives longer than the same bulk without Stamina', () => {
      const stamina = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', evs: bulkyEvs});
      const sturdy = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Sturdy', evs: bulkyEvs});

      const withStamina = calculateMulti(gen, [garchomp(), arcanine()], stamina, earthquakeAndRockSlide(), field());
      const withoutStamina = calculateMulti(gen, [garchomp(), arcanine()], sturdy, earthquakeAndRockSlide(), field());

      expect(withStamina.getHKO()).toBe('70.8% chance to 3HKO');
      expect(withoutStamina.getHKO()).toBe('guaranteed 2HKO');
    });

    test('cumulative damage per turn decreases as the boost rises', () => {
      const stamina = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', evs: bulkyEvs});

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], stamina, earthquakeAndRockSlide(), field());

      const cumulative = [1, 2, 3, 4].map(turn => multiResult.damageWithRemainingUntilTurn(turn, 15));

      expect(cumulative).toEqual([118, 179, 197, 197]);
    });

    test('a pre-existing Def boost shifts the whole Stamina sequence upward', () => {
      const at1 = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', evs: bulkyEvs});
      at1.boosts.def = 1;

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], at1, earthquakeAndRockSlide(), field());

      expect(multiResult.getHKO()).toBe('0.1% chance to 4HKO');
      expect([1, 2, 3, 4].map(turn => multiResult.damageWithRemainingUntilTurn(turn, 15))).toEqual([80, 132, 167, 197]);
    });

    test('a pre-existing Def debuff makes the defender frailer', () => {
      const atNeg = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', evs: bulkyEvs});
      atNeg.boosts.def = -1;

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], atNeg, earthquakeAndRockSlide(), field());

      expect(multiResult.getHKO()).toBe('guaranteed 2HKO');
    });

    test('the simulated turn-1 damage matches the single-turn combined calc when starting boosted', () => {
      const at1 = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', evs: bulkyEvs});
      at1.boosts.def = 1;

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], at1, earthquakeAndRockSlide(), field());

      const singleTurnMax =
        (multiResult.results[0].damage as number[])[15] +
        (multiResult.results[1].damage as number[])[15];

      expect(multiResult.damageWithRemainingUntilTurn(1, 15)).toBe(singleTurnMax);
    });
  });

  describe('type-resist berry is only consumed on the first matching hit', () => {
    const bulkyEvs = {hp: 252, def: 252, spd: 4};

    test('Shuca Berry halves the Ground hit only on turn 1, full damage afterward', () => {
      const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', item: 'Shuca Berry', evs: bulkyEvs});

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], archaludon, earthquakeAndRockSlide(), field());

      expect([1, 2, 3, 4].map(turn => multiResult.damageWithRemainingUntilTurn(turn, 15))).toEqual([63, 124, 166, 197]);
      expect(multiResult.getHKO()).toBe('0.1% chance to 4HKO');
    });

    test('Shuca Berry deals more cumulative damage than if it kept resisting every turn', () => {
      const archaludon = new Pokemon(gen, 'Archaludon', {level: 50, ability: 'Stamina', item: 'Shuca Berry', evs: bulkyEvs});

      const multiResult = calculateMulti(gen, [garchomp(), arcanine()], archaludon, earthquakeAndRockSlide(), field());

      const turn2 = multiResult.damageWithRemainingUntilTurn(2, 15) - multiResult.damageWithRemainingUntilTurn(1, 15);
      const turn1Ground = (multiResult.results[0].damage as number[])[15];

      expect(turn2).toBeGreaterThan(turn1Ground);
    });
  });
});
