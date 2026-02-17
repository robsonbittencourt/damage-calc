import {Field} from '../field';
import {inGens} from './helper';

describe('Berry Tests', () => {
  inGens(9, 9, ({gen, calculate, Pokemon, Move}) => {
    describe('Sitrus Berry', () => {
      test('should calculate damage and chance to ko considering Sitrus Berry', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 156},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          nature: 'Impish',
          evs: {hp: 0, def: 252},
          boosts: {def: 1},
          level: 50,
        });

        const move = Move('Rock Slide');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).toContain('99.5% chance to 3HKO after Sitrus Berry recovery');
      });

      test('should consider grass terrain recovery in berry trigger recover logic', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 156},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          nature: 'Impish',
          evs: {hp: 0, def: 188},
          boosts: {def: 1},
          level: 50,
        });

        const move = Move('Rock Slide');

        const field = new Field();
        field.gameType = 'Doubles';
        field.terrain = 'Grassy';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).toContain(
          '96.4% chance to 3HKO after Grassy Terrain and Sitrus Berry recovery'
        );
      });

      test('should calculate damage and chance to ko in multihit (3 hits) ' +
        'move with Sitrus Berry', () => {
        const attacker = Pokemon('Urshifu-Rapid-Strike', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          nature: 'Careful',
          evs: {hp: 236, def: 156},
          level: 50,
        });

        const move = Move('Surging Strikes');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).toContain('guaranteed 2HKO');
      });

      test('should calculate damage and chance to ko in multihit (10 hits) ' +
        'move with Sitrus Berry', () => {
        const attacker = Pokemon('Maushold', {
          nature: 'Impish',
          ability: 'Technician',
          evs: {atk: 220},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          nature: 'Careful',
          evs: {hp: 172},
          level: 50,
        });

        const move = Move('Population Bomb');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).toContain('190-240 (98.9 - 125%) -- approx. 0.1% chance to OHKO');
      });

      test('should not show berry message if is 2HKO without berry activation', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 156},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          nature: 'Impish',
          evs: {hp: 0, def: 188},
          boosts: {def: 1},
          level: 50,
        });

        const move = Move('Rock Slide');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).toContain('6.3% chance to 2HKO');
        expect(result.desc()).not.toContain('after Sitrus Berry recovery');
      });

      test('should NOT show Sitrus Berry recovery if attacker has Unnerve', () => {
        const attacker = Pokemon('Calyrex-Shadow', {
          ability: 'As One (Spectrier)',
          item: 'Choice Specs',
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Sitrus Berry',
          level: 50,
        });

        const move = Move('Astral Barrage');

        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).not.toContain('after Sitrus Berry recovery');
      });

      test('should show Sitrus Berry recovery with Ripen (50% recovery)', () => {
        const attacker = Pokemon('Incineroar', {
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Flapple', {
          ability: 'Ripen',
          item: 'Sitrus Berry',
          evs: {hp: 4},
          level: 50,
        });

        const move = Move('Darkest Lariat');

        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          '81-96 (55.4 - 65.7%) -- guaranteed 3HKO after Sitrus Berry recovery'
        );
      });
    });

    describe('33% Recovery Berries', () => {
      const berries33Percent = [
        'Figy Berry', 'Wiki Berry', 'Mago Berry', 'Aguav Berry', 'Iapapa Berry',
      ];

      berries33Percent.forEach(berry => {
        test(
          `should calculate damage and chance to ko considering ${berry} ` +
          '(25% threshold, 33% recovery)',
          () => {
            const attacker = Pokemon('Arcanine-Hisui', {
              item: 'Choice Band',
              nature: 'Adamant',
              evs: {atk: 156},
              level: 50,
            });

            const defender = Pokemon('Incineroar', {
              item: berry as any,
              nature: 'Impish',
              evs: {hp: 0, def: 252},
              boosts: {def: 1},
              level: 50,
            });

            const move = Move('Rock Slide');

            const field = new Field();
            field.gameType = 'Doubles';

            const result = calculate(attacker, defender, move, field);

            expect(result.desc()).toContain(
              `62.7% chance to 3HKO after ${berry} recovery`
            );
          }
        );

        test(
          `should calculate damage and chance to ko considering ${berry} with Ripen (66% recovery)`,
          () => {
            const attacker = Pokemon('Urshifu', {
              evs: {atk: 220},
              level: 50,
            });

            const defender = Pokemon('Flapple', {
              ability: 'Ripen',
              item: berry as any,
              level: 50,
            });

            const move = Move('Close Combat');

            const result = calculate(attacker, defender, move, new Field());
            expect(result.desc()).toContain(
              '120-142 (82.7 - 97.9%) -- 99.6% chance to 2HKO after ' + berry + ' recovery'
            );
          }
        );

        test(`should NOT show ${berry} recovery if attacker has Unnerve`, () => {
          const attacker = Pokemon('Calyrex-Ice', {
            ability: 'As One (Glastrier)',
            nature: 'Adamant',
            evs: {atk: 252},
            level: 50,
          });

          const defender = Pokemon('Farigiraf', {
            item: berry as any,
            level: 50,
          });

          const move = Move('Body Slam');

          const result = calculate(attacker, defender, move, new Field());
          expect(result.desc()).toContain('85-100 (43.5 - 51.2%) -- 8.2% chance to 2HKO');
          expect(result.desc()).not.toContain('after ' + berry + ' recovery');
        });
      });
    });

    describe('Oran Berry', () => {
      test('should show Oran Berry recovery with Ripen (20 HP recovery)', () => {
        const attacker = Pokemon('Pichu', {
          level: 5,
        });
        const defender = Pokemon('Pikachu', {
          ability: 'Ripen',
          item: 'Oran Berry',
          level: 5,
        });
        const move = Move('Quick Attack');

        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain('possible 8HKO after Oran Berry recovery');
      });
    });

    describe('Enigma Berry', () => {
      test('should activate Enigma Berry on super-effective hit', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 156},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Enigma Berry',
          nature: 'Impish',
          evs: {hp: 0, def: 252},
          boosts: {def: 1},
          level: 50,
        });

        const move = Move('Rock Slide');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);
        expect(result.desc()).toContain('99.5% chance to 3HKO after Enigma Berry recovery');
      });

      test('should consider tera type to activate Enigma Berry on super-effective hit', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 156},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          item: 'Enigma Berry',
          nature: 'Impish',
          evs: {hp: 0, def: 252},
          boosts: {def: 1},
          level: 50,
          teraType: 'Flying',
        });

        const move = Move('Rock Slide');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);
        expect(result.desc()).toContain('99.5% chance to 3HKO after Enigma Berry recovery');
      });

      test('should NOT activate Enigma Berry on neutral hit', () => {
        const attacker = Pokemon('Rillaboom', {
          item: 'Choice Band',
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Rillaboom', {
          item: 'Enigma Berry',
          nature: 'Adamant',
          evs: {hp: 252, def: 0},
          level: 50,
        });

        const move = Move('Wood Hammer');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).not.toContain('after Enigma Berry recovery');
      });

      test('should NOT activate Enigma Berry on not-very-effective hit', () => {
        const attacker = Pokemon('Urshifu-Rapid-Strike', {
          item: 'Choice Band',
          nature: 'Jolly',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Toxapex', {
          item: 'Enigma Berry',
          nature: 'Bold',
          evs: {hp: 252, def: 252},
          level: 50,
        });

        const move = Move('Surging Strikes');

        const field = new Field();
        field.gameType = 'Doubles';

        const result = calculate(attacker, defender, move, field);

        expect(result.desc()).not.toContain('after Enigma Berry recovery');
      });
    });

    describe('Type-Resist Berries', () => {
      test(
        'should show Occa Berry (Fire) in description and reduce damage from OHKO to 2HKO',
        () => {
          const attacker = Pokemon('Arcanine-Hisui', {
            item: 'Choice Band',
            nature: 'Adamant',
            evs: {atk: 252},
            level: 50,
          });

          const defender = Pokemon('Gholdengo', {
            nature: 'Modest',
            evs: {hp: 252},
            level: 50,
          });

          const move = Move('Flare Blitz');

          const resultBaseline = calculate(attacker, defender, move, new Field());
          expect(resultBaseline.desc()).toContain(
            '320-380 (164.9 - 195.8%) -- guaranteed OHKO'
          );

          (defender as any).item = 'Occa Berry';
          const result = calculate(attacker, defender, move, new Field());
          expect(result.desc()).toContain(
            'Occa Berry Gholdengo: 160-190 (82.4 - 97.9%) -- guaranteed 2HKO'
          );
        }
      );

      test(
        'should show Passho Berry (Water) in description and reduce damage from OHKO to 2HKO',
        () => {
          const attacker = Pokemon('Urshifu-Rapid-Strike', {
            nature: 'Adamant',
            evs: {atk: 252},
            level: 50,
          });

          const defender = Pokemon('Incineroar', {
            nature: 'Impish',
            evs: {hp: 244, def: 188},
            level: 50,
          });

          const move = Move('Surging Strikes');

          const resultBaseline = calculate(attacker, defender, move, new Field());
          expect(resultBaseline.desc()).toContain(
            '180-216 (89.5 - 107.4%) -- 14.4% chance to OHKO'
          );

          (defender as any).item = 'Passho Berry';
          const result = calculate(attacker, defender, move, new Field());
          expect(result.desc()).toContain(
            'Passho Berry Incineroar on a critical hit: 150-180 (74.6 - 89.5%) -- guaranteed 2HKO'
          );
        }
      );

      test('should show Wacan Berry (Electric) in description and reduce damage', () => {
        const attacker = Pokemon('Raging Bolt', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Urshifu-Rapid-Strike', {
          nature: 'Adamant',
          evs: {hp: 0, spd: 0},
          level: 50,
        });

        const move = Move('Thunderbolt');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('264-312 (150.8 - 178.2%) -- guaranteed OHKO');

        (defender as any).item = 'Wacan Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Wacan Berry Urshifu-Rapid-Strike: 132-156 (75.4 - 89.1%) -- guaranteed 2HKO'
        );
      });

      test('should show Rindo Berry (Grass) in description and reduce damage', () => {
        const attacker = Pokemon('Raging Bolt', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Urshifu-Rapid-Strike', {
          nature: 'Adamant',
          evs: {hp: 0, spd: 0},
          level: 50,
        });

        const move = Move('Leaf Storm');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('254-300 (145.1 - 171.4%) -- guaranteed OHKO');

        (defender as any).item = 'Rindo Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Rindo Berry Urshifu-Rapid-Strike: 127-150 (72.5 - 85.7%) -- guaranteed 2HKO'
        );
      });

      test('should show Yache Berry (Ice) in description and reduce damage', () => {
        const attacker = Pokemon('Kyurem-Black', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Landorus-Therian', {
          nature: 'Adamant',
          evs: {hp: 252},
          level: 50,
        });

        const move = Move('Icicle Spear');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('396-468 (202 - 238.7%) -- guaranteed OHKO');

        (defender as any).item = 'Yache Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Yache Berry Landorus-Therian: 330-390 (168.3 - 198.9%) -- guaranteed OHKO'
        );
      });

      test(
        'should show Chople Berry (Fighting) in description and reduce damage from OHKO to 2HKO',
        () => {
          const attacker = Pokemon('Urshifu-Rapid-Strike', {
            nature: 'Adamant',
            evs: {atk: 252},
            level: 50,
          });

          const defender = Pokemon('Incineroar', {
            nature: 'Impish',
            evs: {hp: 244, def: 188},
            level: 50,
          });

          const move = Move('Close Combat');

          const resultBaseline = calculate(attacker, defender, move, new Field());
          expect(resultBaseline.desc()).toContain(
            '186-218 (92.5 - 108.4%) -- 43.8% chance to OHKO'
          );

          (defender as any).item = 'Chople Berry';
          const result = calculate(attacker, defender, move, new Field());
          expect(result.desc()).toContain(
            'Chople Berry Incineroar: 93-109 (46.2 - 54.2%) -- guaranteed 2HKO'
          );
        }
      );

      test('should show Kebia Berry (Poison) in description and reduce damage', () => {
        const attacker = Pokemon('Glimmora', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Rillaboom', {
          nature: 'Adamant',
          evs: {hp: 252, spd: 4},
          level: 50,
        });

        const move = Move('Sludge Bomb');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('224-266 (108.2 - 128.5%) -- guaranteed OHKO');

        (defender as any).item = 'Kebia Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Kebia Berry Rillaboom: 112-133 (54.1 - 64.2%) -- guaranteed 2HKO'
        );
      });

      test('should show Shuca Berry (Ground) in description and reduce damage', () => {
        const attacker = Pokemon('Landorus-Therian', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Incineroar', {
          nature: 'Impish',
          evs: {hp: 244, def: 188, spd: 0},
          level: 50,
        });

        const move = Move('Earthquake');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('168-198 (83.5 - 98.5%) -- guaranteed 2HKO');

        (defender as any).item = 'Shuca Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Shuca Berry Incineroar: 84-99 (41.7 - 49.2%) -- guaranteed 2HKO'
        );
      });

      test('should show Coba Berry (Flying) in description and reduce damage', () => {
        const attacker = Pokemon('Dragonite', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Amoonguss', {
          nature: 'Bold',
          evs: {hp: 252, def: 156},
          level: 50,
        });

        const move = Move('Brave Bird');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('230-272 (104 - 123%) -- guaranteed OHKO');

        (defender as any).item = 'Coba Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Coba Berry Amoonguss: 115-136 (52 - 61.5%) -- guaranteed 2HKO'
        );
      });

      test('should show Payapa Berry (Psychic) in description and reduce damage', () => {
        const attacker = Pokemon('Mewtwo', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Hawlucha', {
          nature: 'Adamant',
          evs: {hp: 0, spd: 0},
          level: 50,
        });

        const move = Move('Psystrike');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('270-318 (176.4 - 207.8%) -- guaranteed OHKO');

        (defender as any).item = 'Payapa Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Payapa Berry Hawlucha: 135-159 (88.2 - 103.9%) -- 25% chance to OHKO'
        );
      });

      test('should show Tanga Berry (Bug) in description and reduce damage', () => {
        const attacker = Pokemon('Rillaboom', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Meowscarada', {
          nature: 'Jolly',
          evs: {hp: 0, def: 0},
          level: 50,
        });

        const move = Move('U-turn');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('228-272 (150.9 - 180.1%) -- guaranteed OHKO');

        (defender as any).item = 'Tanga Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Tanga Berry Meowscarada: 114-136 (75.4 - 90%) -- guaranteed 2HKO'
        );
      });

      test('should show Charti Berry (Rock) in description and reduce damage', () => {
        const attacker = Pokemon('Arcanine-Hisui', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Talonflame', {
          nature: 'Jolly',
          evs: {hp: 0, def: 0},
          level: 50,
        });

        const move = Move('Rock Slide');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('340-408 (222.2 - 266.6%) -- guaranteed OHKO');

        (defender as any).item = 'Charti Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Charti Berry Talonflame: 170-204 (111.1 - 133.3%) -- guaranteed OHKO'
        );
      });

      test('should show Kasib Berry (Ghost) in description and reduce damage', () => {
        const attacker = Pokemon('Flutter Mane', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Gholdengo', {
          nature: 'Modest',
          evs: {hp: 252, spd: 4},
          level: 50,
        });

        const move = Move('Shadow Ball');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('168-198 (86.5 - 102%) -- 12.5% chance to OHKO');

        (defender as any).item = 'Kasib Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Kasib Berry Gholdengo: 84-99 (43.2 - 51%) -- guaranteed 2HKO'
        );
      });

      test('should show Haban Berry (Dragon) in description and reduce damage', () => {
        const attacker = Pokemon('Dragonite', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Dragonite', {
          nature: 'Adamant',
          evs: {hp: 252, def: 4},
          level: 50,
        });

        const move = Move('Dragon Claw');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('158-188 (79.7 - 94.9%) -- guaranteed 2HKO');

        (defender as any).item = 'Haban Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Haban Berry Dragonite: 79-94 (39.8 - 47.4%) -- guaranteed 2HKO'
        );
      });

      test('should show Colbur Berry (Dark) in description and reduce damage', () => {
        const attacker = Pokemon('Incineroar', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Gholdengo', {
          nature: 'Modest',
          evs: {hp: 252, def: 4},
          level: 50,
        });

        const move = Move('Knock Off');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('116-140 (59.7 - 72.1%) -- guaranteed 2HKO');

        (defender as any).item = 'Colbur Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Colbur Berry Gholdengo: 87-103 (44.8 - 53%) -- guaranteed 2HKO'
        );
      });

      test('should show Babiri Berry (Steel) in description and reduce damage', () => {
        const attacker = Pokemon('Gholdengo', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Flutter Mane', {
          nature: 'Timid',
          evs: {hp: 252, def: 4},
          level: 50,
        });

        const move = Move('Make It Rain');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('180-212 (111.1 - 130.8%) -- guaranteed OHKO');

        (defender as any).item = 'Babiri Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Babiri Berry Flutter Mane: 90-106 (55.5 - 65.4%) -- guaranteed 2HKO'
        );
      });

      test('should show Roseli Berry (Fairy) in description and reduce damage', () => {
        const attacker = Pokemon('Flutter Mane', {
          nature: 'Modest',
          evs: {spa: 252},
          level: 50,
        });

        const defender = Pokemon('Urshifu-Rapid-Strike', {
          nature: 'Jolly',
          evs: {hp: 0, spd: 0},
          level: 50,
        });

        const move = Move('Moonblast');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('276-326 (157.7 - 186.2%) -- guaranteed OHKO');

        (defender as any).item = 'Roseli Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Roseli Berry Urshifu-Rapid-Strike: 138-163 (78.8 - 93.1%) -- guaranteed 2HKO'
        );
      });

      test(
        'should show Chilan Berry for Normal-type moves in description and reduce damage',
        () => {
          const attacker = Pokemon('Ursaluna-Bloodmoon', {
            nature: 'Modest',
            evs: {spa: 252},
            level: 50,
          });

          const defender = Pokemon('Cresselia', {
            nature: 'Bold',
            evs: {hp: 252},
            level: 50,
          });

          const move = Move('Blood Moon');

          const resultBaseline = calculate(attacker, defender, move, new Field());
          expect(resultBaseline.desc()).toContain('117-138 (51.5 - 60.7%) -- guaranteed 2HKO');

          (defender as any).item = 'Chilan Berry';
          const result = calculate(attacker, defender, move, new Field());
          expect(result.desc()).toContain(
            'Chilan Berry Cresselia: 58-69 (25.5 - 30.3%) -- guaranteed 3HKO'
          );
        }
      );

      test('should consider tera when activate halve damage berries with Ripen', () => {
        const attacker = Pokemon('Urshifu-Rapid-Strike', {
          evs: {atk: 0},
          level: 50,
        });

        const defender = Pokemon('Flapple', {
          item: 'Chople Berry',
          evs: {hp: 4},
          level: 50,
        });

        const move = Move('Brick Break');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('64-76 (43.8 - 52%) -- 10.9% chance to 2HKO');

        (defender as any).teraType = 'Ice';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain('32-38 (21.9 - 26%) -- guaranteed 2HKO');
      });

      test('should work with Ripen for 75% reduction', () => {
        const attacker = Pokemon('Kyurem-Black', {
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Appletun', {
          ability: 'Ripen',
          nature: 'Modest',
          evs: {hp: 252},
          level: 50,
        });

        const move = Move('Icicle Crash');

        const resultBaseline = calculate(attacker, defender, move, new Field());
        expect(resultBaseline.desc()).toContain('472-556 (217.5 - 256.2%) -- guaranteed OHKO');

        (defender as any).item = 'Yache Berry';
        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).toContain(
          'Yache Berry Appletun: 118-139 (54.3 - 64%) -- guaranteed 2HKO'
        );
      });

      test('should NOT show berry description if attacker has Unnerve', () => {
        const attacker = Pokemon('Calyrex-Ice', {
          ability: 'As One (Glastrier)',
          nature: 'Adamant',
          evs: {atk: 252},
          level: 50,
        });

        const defender = Pokemon('Landorus-Therian', {
          item: 'Yache Berry',
          nature: 'Adamant',
          evs: {hp: 252, def: 0},
          level: 50,
        });

        const move = Move('Glacial Lance');

        const result = calculate(attacker, defender, move, new Field());
        expect(result.desc()).not.toContain('Yache Berry');
        expect(result.desc()).toContain('588-696 (300 - 355.1%) -- guaranteed OHKO');
      });
    });
  });
});
