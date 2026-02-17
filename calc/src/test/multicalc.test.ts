import {Generations, calculateMulti, Pokemon, Move, Field} from '../index';

describe('multicalc', () => {
  test('Urshifu-Rapid-Strike and Landorus-Therian vs Gholdengo', () => {
    const gen = Generations.get(9);
    
    const gholdengo = new Pokemon(gen, 'Gholdengo', {
      level: 50,
      item: 'Leftovers',
      ability: 'Good as Gold',
      nature: 'Modest',
      evs: {hp: 100, def: 252},
      teraType: 'Fairy'
    });

    const urshifu = new Pokemon(gen, 'Urshifu-Rapid-Strike', {
      level: 50,
      item: 'Choice Scarf',
      ability: 'Unseen Fist',
      nature: 'Adamant',
      evs: {hp: 4, atk: 252, spe: 12}
    });

    const landorus = new Pokemon(gen, 'Landorus-Therian', {
      level: 50,
      item: 'Choice Band',
      ability: 'Intimidate',
      nature: 'Adamant',
      evs: {atk: 252, spe: 116}
    });

    const multiResult = calculateMulti(
      gen,
      [urshifu, landorus],
      gholdengo,
      [new Move(gen, 'Aqua Jet'), new Move(gen, 'Rock Slide')],
      new Field({gameType: 'Doubles'})
    );

    expect(multiResult.desc()).toBe(
      '252+ Atk Urshifu-Rapid-Strike Aqua Jet AND 252+ Atk Choice Band Landorus-Therian Rock Slide vs. 100 HP / 252 Def Leftovers Tera Fairy Gholdengo: 77-92 (44 - 52.5%) -- guaranteed 3HKO after Leftovers recovery'
    );
  });

  test('0 SpA Jumpluff x2 vs 76 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
    const gen = Generations.get(9);
    const jumpluff = new Pokemon(gen, 'Jumpluff', {
      level: 50,
      nature: 'Timid',
      evs: { hp: 164, def: 92, spe: 252 }
    });

    const tingLu = new Pokemon(gen, 'Ting-Lu', {
      level: 50,
      item: 'Sitrus Berry',
      ability: 'Vessel of Ruin',
      nature: 'Adamant',
      evs: { hp: 76 },
      teraType: 'Fairy'
    });

    const multiResult = calculateMulti(
      gen,
      [jumpluff, jumpluff],
      tingLu,
      [new Move(gen, 'Giga Drain'), new Move(gen, 'Giga Drain')],
      new Field({ gameType: 'Doubles' })
    );

    expect(multiResult.desc()).toBe(
      '0 SpA Jumpluff Giga Drain AND 0 SpA Jumpluff Giga Drain vs. 76 HP / 0 SpD Sitrus Berry Tera Fairy Ting-Lu: 50-60 (20.8 - 25%) -- 0.1% chance to 5HKO after Sitrus Berry recovery'
    );
  });

  test('0 SpA Jumpluff x2 vs 84 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
    const gen = Generations.get(9);
    const jumpluff = new Pokemon(gen, 'Jumpluff', {
      level: 50,
      nature: 'Timid',
      evs: { hp: 164, def: 92, spe: 252 }
    });

    const tingLu = new Pokemon(gen, 'Ting-Lu', {
      level: 50,
      item: 'Sitrus Berry',
      ability: 'Vessel of Ruin',
      nature: 'Adamant',
      evs: { hp: 84 },
      teraType: 'Fairy'
    });

    const multiResult = calculateMulti(
      gen,
      [jumpluff, jumpluff],
      tingLu,
      [new Move(gen, 'Giga Drain'), new Move(gen, 'Giga Drain')],
      new Field({ gameType: 'Doubles' })
    );

    expect(multiResult.desc()).toBe(
      '0 SpA Jumpluff Giga Drain AND 0 SpA Jumpluff Giga Drain vs. 84 HP / 0 SpD Tera Fairy Ting-Lu: 50-60 (20.7 - 24.8%) -- 99.9% chance to 6HKO after Sitrus Berry recovery'
    );
  });

  test('Urshifu-Rapid-Strike and Maushold vs 4 HP Sitrus Berry Tera Fairy Ting-Lu', () => {
    const gen = Generations.get(9);

    const urshifu = new Pokemon(gen, 'Urshifu-Rapid-Strike', {
      level: 50,
      item: 'Mystic Water',
      ability: 'Unseen Fist',
      nature: 'Adamant',
      evs: { hp: 4, atk: 252, spe: 252 }
    });

    const maushold = new Pokemon(gen, 'Maushold', {
      level: 50,
      item: 'Rocky Helmet',
      ability: 'Technician',
      nature: 'Impish',
      evs: { atk: 252, spd: 28, spe: 28 }
    });

    const tingLu = new Pokemon(gen, 'Ting-Lu', {
      level: 50,
      item: 'Sitrus Berry',
      ability: 'Vessel of Ruin',
      nature: 'Adamant',
      evs: { hp: 4 },
      teraType: 'Fairy'
    });

    const multiResult = calculateMulti(
      gen,
      [urshifu, maushold],
      tingLu,
      [new Move(gen, 'Surging Strikes'), new Move(gen, 'Population Bomb')],
      new Field({ gameType: 'Doubles' })
    );

    expect(multiResult.desc()).toBe(
      '252+ Atk Mystic Water Urshifu-Rapid-Strike Surging Strikes (3 hits) AND 252 Atk Technician Maushold Population Bomb (10 hits) vs. 4 HP / 0 Def Sitrus Berry Tera Fairy Ting-Lu on a critical hit: 271-325 (117.3 - 140.6%) -- 84.2% chance to OHKO after Sitrus Berry recovery'
    );
  });
});
