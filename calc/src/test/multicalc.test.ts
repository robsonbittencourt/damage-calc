/* eslint-disable max-len */
import {Generations, calculateMulti, Pokemon, Move, Field} from '../index';

describe('multicalc', () => {
  const gen = Generations.get(9);

  describe('desc', () => {
    test('Urshifu-Rapid-Strike and Landorus-Therian vs Gholdengo', () => {
      const gholdengo = new Pokemon(gen, 'Gholdengo', {
        level: 50,
        item: 'Leftovers',
        ability: 'Good as Gold',
        nature: 'Modest',
        evs: {hp: 100, def: 252},
        teraType: 'Fairy',
      });

      const urshifu = new Pokemon(gen, 'Urshifu-Rapid-Strike', {
        level: 50,
        item: 'Choice Scarf',
        ability: 'Unseen Fist',
        nature: 'Adamant',
        evs: {hp: 4, atk: 252, spe: 12},
      });

      const landorus = new Pokemon(gen, 'Landorus-Therian', {
        level: 50,
        item: 'Choice Band',
        ability: 'Intimidate',
        nature: 'Adamant',
        evs: {atk: 252, spe: 116},
      });

      const multiResult = calculateMulti(
        gen,
        [urshifu, landorus],
        gholdengo,
        [new Move(gen, 'Aqua Jet'), new Move(gen, 'Rock Slide')],
        new Field({gameType: 'Doubles'})
      );

      const expected = '252+ Atk Urshifu-Rapid-Strike Aqua Jet AND 252+ Atk Choice Band Landorus-Therian Rock Slide vs. 100 HP / 252 Def Leftovers Tera Fairy Gholdengo: 77-92 (44 - 52.5%) -- guaranteed 3HKO after Leftovers recovery';

      expect(multiResult.desc()).toBe(expected);
    });

    test('0 SpA Jumpluff x2 vs 76 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
      const jumpluff = new Pokemon(gen, 'Jumpluff', {
        level: 50,
        nature: 'Timid',
        evs: {hp: 164, def: 92, spe: 252},
      });

      const tingLu = new Pokemon(gen, 'Ting-Lu', {
        level: 50,
        item: 'Sitrus Berry',
        ability: 'Vessel of Ruin',
        nature: 'Adamant',
        evs: {hp: 76},
        teraType: 'Fairy',
      });

      const multiResult = calculateMulti(
        gen,
        [jumpluff, jumpluff],
        tingLu,
        [new Move(gen, 'Giga Drain'), new Move(gen, 'Giga Drain')],
        new Field({gameType: 'Doubles'})
      );

      const expected = '0 SpA Jumpluff Giga Drain AND 0 SpA Jumpluff Giga Drain vs. 76 HP / 0 SpD Sitrus Berry Tera Fairy Ting-Lu: 50-60 (20.8 - 25%) -- 0.1% chance to 5HKO after Sitrus Berry recovery';

      expect(multiResult.desc()).toBe(expected);
    });

    test('0 SpA Jumpluff x2 vs 84 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
      const jumpluff = new Pokemon(gen, 'Jumpluff', {
        level: 50,
        nature: 'Timid',
        evs: {hp: 164, def: 92, spe: 252},
      });

      const tingLu = new Pokemon(gen, 'Ting-Lu', {
        level: 50,
        item: 'Sitrus Berry',
        ability: 'Vessel of Ruin',
        nature: 'Adamant',
        evs: {hp: 84},
        teraType: 'Fairy',
      });

      const multiResult = calculateMulti(
        gen,
        [jumpluff, jumpluff],
        tingLu,
        [new Move(gen, 'Giga Drain'), new Move(gen, 'Giga Drain')],
        new Field({gameType: 'Doubles'})
      );

      const expected = '0 SpA Jumpluff Giga Drain AND 0 SpA Jumpluff Giga Drain vs. 84 HP / 0 SpD Tera Fairy Ting-Lu: 50-60 (20.7 - 24.8%) -- 99.9% chance to 6HKO after Sitrus Berry recovery';

      expect(multiResult.desc()).toBe(expected);
    });

    test('Urshifu-Rapid-Strike and Maushold vs 4 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
      const urshifu = new Pokemon(gen, 'Urshifu-Rapid-Strike', {
        level: 50,
        item: 'Mystic Water',
        ability: 'Unseen Fist',
        nature: 'Adamant',
        evs: {hp: 4, atk: 252, spe: 252},
      });

      const maushold = new Pokemon(gen, 'Maushold', {
        level: 50,
        item: 'Rocky Helmet',
        ability: 'Technician',
        nature: 'Impish',
        evs: {atk: 252, spd: 28, spe: 28},
      });

      const tingLu = new Pokemon(gen, 'Ting-Lu', {
        level: 50,
        item: 'Sitrus Berry',
        ability: 'Vessel of Ruin',
        nature: 'Adamant',
        evs: {hp: 4},
        teraType: 'Fairy',
      });

      const multiResult = calculateMulti(
        gen,
        [urshifu, maushold],
        tingLu,
        [new Move(gen, 'Surging Strikes'), new Move(gen, 'Population Bomb')],
        new Field({gameType: 'Doubles'})
      );

      const expected = '252+ Atk Mystic Water Urshifu-Rapid-Strike Surging Strikes (3 hits) AND 252 Atk Technician Maushold Population Bomb (10 hits) vs. 4 HP / 0 Def Tera Fairy Ting-Lu on a critical hit: 271-325 (117.3 - 140.6%) -- 84.2% chance to OHKO after Sitrus Berry recovery';

      expect(multiResult.desc()).toBe(expected);
    });

    test('Koraidon and Miraidon vs Dragonite', () => {
      const koraidon = new Pokemon(gen, 'Koraidon', {
        level: 50,
        ability: 'Orichalcum Pulse',
        nature: 'Adamant',
        evs: {atk: 220},
        boosts: {spe: 2},
      });

      const miraidon = new Pokemon(gen, 'Miraidon', {
        level: 50,
        ability: 'Hadron Engine',
        item: 'Choice Specs',
        evs: {spa: 252},
      });

      const dragonite = new Pokemon(gen, 'Dragonite', {
        level: 50,
        ability: 'Multiscale',
        evs: {hp: 4},
      });

      const multiResult = calculateMulti(
        gen,
        [koraidon, miraidon],
        dragonite,
        [new Move(gen, 'Flare Blitz'), new Move(gen, 'Draco Meteor')],
        new Field({gameType: 'Doubles', weather: 'Sun', terrain: 'Electric'})
      );

      const expected = '220+ Atk Orichalcum Pulse Koraidon Flare Blitz AND 252 SpA Choice Specs Hadron Engine Miraidon Draco Meteor vs. 4 HP / 0 Def / 0 SpD Dragonite in Sun: 497-586 (297.6 - 350.8%) -- guaranteed OHKO';

      expect(multiResult.desc()).toBe(expected);
    });

    test('Miraidon and Koraidon vs Multiscale Dragonite', () => {
      const miraidon = new Pokemon(gen, 'Miraidon', {
        level: 50,
        item: 'Choice Specs',
        ability: 'Hadron Engine',
        nature: 'Timid',
        evs: {hp: 4, spa: 252, spe: 252},
      });

      const koraidon = new Pokemon(gen, 'Koraidon', {
        level: 50,
        item: 'Clear Amulet',
        ability: 'Orichalcum Pulse',
        nature: 'Adamant',
        evs: {hp: 36, atk: 220, spe: 252},
      });

      const dragonite = new Pokemon(gen, 'Dragonite', {
        level: 50,
        item: 'Loaded Dice',
        ability: 'Multiscale',
        nature: 'Adamant',
        evs: {hp: 4, atk: 252, spe: 252},
      });

      const multiResult = calculateMulti(
        gen,
        [miraidon, koraidon],
        dragonite,
        [new Move(gen, 'Electro Drift'), new Move(gen, 'Flame Charge')],
        new Field({gameType: 'Doubles', weather: 'Sun', terrain: 'Electric'})
      );

      const expected = '252 SpA Choice Specs Hadron Engine Miraidon Electro Drift AND 220+ Atk Orichalcum Pulse Koraidon Flame Charge vs. 4 HP / 0 Def / 0 SpD Dragonite in Electric Terrain: 147-174 (88 - 104.1%) -- 21.5% chance to OHKO';

      expect(multiResult.desc()).toBe(expected);
    });
  });

  describe('MultiResult.afterTurn', () => {
    test('Double Damage + Sandstorm', () => {
      const attacker1 = new Pokemon(gen, 'Urshifu-Rapid-Strike', {level: 50, evs: {atk: 252}});
      const attacker2 = new Pokemon(gen, 'Landorus-Therian', {level: 50, evs: {atk: 252}});

      const defender = new Pokemon(gen, 'Gholdengo', {level: 50, evs: {hp: 252, def: 252}});

      const field = new Field({weather: 'Sand'});
      const multiResult = calculateMulti(
        gen,
        [attacker1, attacker2],
        defender,
        [new Move(gen, 'Aqua Jet'), new Move(gen, 'Rock Slide')],
        field
      );

      const afterTurn = multiResult.afterTurn();

      expect(afterTurn.remainingHpUntilTurn(1)).toBe(137);
      expect(afterTurn.residualHpInTurn(1)).toBe(0);
    });

    test('Berry Consumption', () => {
      const attacker1 = new Pokemon(gen, 'Urshifu-Rapid-Strike', {level: 50, evs: {atk: 252}});
      const attacker2 = new Pokemon(gen, 'Landorus-Therian', {level: 50, evs: {atk: 252}});

      const defender = new Pokemon(gen, 'Gholdengo', {
        level: 50,
        item: 'Sitrus Berry',
        evs: {hp: 252, def: 252, spd: 252},
      });

      const multiResult = calculateMulti(
        gen,
        [attacker1, attacker2],
        defender,
        [new Move(gen, 'Surging Strikes'), new Move(gen, 'Stomping Tantrum')],
        new Field()
      );

      const afterTurn = multiResult.afterTurn();

      expect(afterTurn.remainingHpUntilTurn(1)).toBe(5);
      expect(afterTurn.residualHpInTurn(1)).toBe(48);
    });

    test('Trapping from Second Attacker', () => {
      const attacker1 = new Pokemon(gen, 'Urshifu-Rapid-Strike', {level: 50, evs: {atk: 252}});
      const attacker2 = new Pokemon(gen, 'Heatran', {level: 50, evs: {spa: 252}});

      const defender = new Pokemon(gen, 'Gholdengo', {
        level: 50,
        evs: {hp: 252, def: 252, spd: 252},
        boosts: {def: 6, spd: 6},
      });

      const multiResult = calculateMulti(
        gen,
        [attacker1, attacker2],
        defender,
        [new Move(gen, 'Aqua Jet'), new Move(gen, 'Magma Storm')],
        new Field()
      );

      const afterTurn = multiResult.afterTurn();

      expect(afterTurn.residualHpInTurn(1)).toBe(-24);
      expect(afterTurn.remainingHpUntilTurn(1)).toBe(112);
    });

    test('Leftovers (Non-stacking recovery)', () => {
      const attacker = new Pokemon(gen, 'Urshifu-Rapid-Strike', {level: 50, evs: {atk: 252}});

      const defender = new Pokemon(gen, 'Gholdengo', {
        level: 50,
        item: 'Leftovers',
        evs: {hp: 252, def: 252, spd: 252},
        boosts: {def: 6, spd: 6},
      });

      const singleAttack = calculateMulti(
        gen,
        [attacker, attacker],
        defender,
        [new Move(gen, 'Aqua Jet'), new Move(gen, 'Aqua Jet')],
        new Field()
      );

      const afterTurn = singleAttack.afterTurn();

      expect(afterTurn.residualHpInTurn(1)).toBe(12);
      expect(afterTurn.remainingHpUntilTurn(1)).toBe(186);
    });

    test('should not apply residual recovery on the death turn', () => {
      const attacker1 = new Pokemon(gen, 'Blissey', {level: 40});
      const attacker2 = new Pokemon(gen, 'Blissey', {level: 40});

      const defender = new Pokemon(gen, 'Rillaboom', {
        level: 50,
        evs: {hp: 4},
        item: 'Leftovers',
      });

      const move = new Move(gen, 'Seismic Toss');
      const field = new Field({terrain: 'Grassy'});

      const multiResult = calculateMulti(
        gen,
        [attacker1, attacker2],
        defender,
        [move, move],
        field
      );

      const afterTurn = multiResult.afterTurn();

      expect(afterTurn.remainingHpUntilTurn(1)).toBe(118);
      expect(afterTurn.remainingHpUntilTurn(2)).toBe(60);
      expect(afterTurn.remainingHpUntilTurn(3)).toBe(0);
      expect(afterTurn.residualHpInTurn(3)).toBe(0);
      expect(multiResult.damageWithRemainingUntilTurn(3)).toBe(176);
    });
  });
});
