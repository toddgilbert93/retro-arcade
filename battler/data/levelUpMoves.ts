import type { PokemonGrowth } from './types';

export const POKEMON_GROWTH: PokemonGrowth[] = [
  {
    id: 'RHYDON',
    evolutions: [],
    levelUpMoves: [
      { level: 30, move: 'STOMP' },
      { level: 35, move: 'TAIL_WHIP' },
      { level: 40, move: 'FURY_ATTACK' },
      { level: 48, move: 'HORN_DRILL' },
      { level: 55, move: 'LEER' },
      { level: 64, move: 'TAKE_DOWN' },
    ],
  },
  {
    id: 'KANGASKHAN',
    evolutions: [],
    levelUpMoves: [
      { level: 26, move: 'BITE' },
      { level: 31, move: 'TAIL_WHIP' },
      { level: 36, move: 'MEGA_PUNCH' },
      { level: 41, move: 'LEER' },
      { level: 46, move: 'DIZZY_PUNCH' },
    ],
  },
  {
    id: 'NIDORAN_M',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'NIDORINO' },
    ],
    levelUpMoves: [
      { level: 8, move: 'HORN_ATTACK' },
      { level: 14, move: 'POISON_STING' },
      { level: 21, move: 'FOCUS_ENERGY' },
      { level: 29, move: 'FURY_ATTACK' },
      { level: 36, move: 'HORN_DRILL' },
      { level: 43, move: 'DOUBLE_KICK' },
    ],
  },
  {
    id: 'CLEFAIRY',
    evolutions: [
      { method: 'ITEM', condition: 'MOON_STONE', into: 'CLEFABLE' },
    ],
    levelUpMoves: [
      { level: 13, move: 'SING' },
      { level: 18, move: 'DOUBLESLAP' },
      { level: 24, move: 'MINIMIZE' },
      { level: 31, move: 'METRONOME' },
      { level: 39, move: 'DEFENSE_CURL' },
      { level: 48, move: 'LIGHT_SCREEN' },
    ],
  },
  {
    id: 'SPEAROW',
    evolutions: [
      { method: 'LEVEL', condition: 20, into: 'FEAROW' },
    ],
    levelUpMoves: [
      { level: 9, move: 'LEER' },
      { level: 15, move: 'FURY_ATTACK' },
      { level: 22, move: 'MIRROR_MOVE' },
      { level: 29, move: 'DRILL_PECK' },
      { level: 36, move: 'AGILITY' },
    ],
  },
  {
    id: 'VOLTORB',
    evolutions: [
      { method: 'LEVEL', condition: 30, into: 'ELECTRODE' },
    ],
    levelUpMoves: [
      { level: 17, move: 'SONICBOOM' },
      { level: 22, move: 'SELFDESTRUCT' },
      { level: 29, move: 'LIGHT_SCREEN' },
      { level: 36, move: 'SWIFT' },
      { level: 43, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'NIDOKING',
    evolutions: [],
    levelUpMoves: [
      { level: 8, move: 'HORN_ATTACK' },
      { level: 14, move: 'POISON_STING' },
      { level: 23, move: 'THRASH' },
    ],
  },
  {
    id: 'SLOWBRO',
    evolutions: [],
    levelUpMoves: [
      { level: 18, move: 'DISABLE' },
      { level: 22, move: 'HEADBUTT' },
      { level: 27, move: 'GROWL' },
      { level: 33, move: 'WATER_GUN' },
      { level: 37, move: 'WITHDRAW' },
      { level: 44, move: 'AMNESIA' },
      { level: 55, move: 'PSYCHIC_M' },
    ],
  },
  {
    id: 'IVYSAUR',
    evolutions: [
      { method: 'LEVEL', condition: 32, into: 'VENUSAUR' },
    ],
    levelUpMoves: [
      { level: 7, move: 'LEECH_SEED' },
      { level: 13, move: 'VINE_WHIP' },
      { level: 22, move: 'POISONPOWDER' },
      { level: 30, move: 'RAZOR_LEAF' },
      { level: 38, move: 'GROWTH' },
      { level: 46, move: 'SLEEP_POWDER' },
      { level: 54, move: 'SOLARBEAM' },
    ],
  },
  {
    id: 'EXEGGUTOR',
    evolutions: [],
    levelUpMoves: [
      { level: 28, move: 'STOMP' },
    ],
  },
  {
    id: 'LICKITUNG',
    evolutions: [],
    levelUpMoves: [
      { level: 7, move: 'STOMP' },
      { level: 15, move: 'DISABLE' },
      { level: 23, move: 'DEFENSE_CURL' },
      { level: 31, move: 'SLAM' },
      { level: 39, move: 'SCREECH' },
    ],
  },
  {
    id: 'EXEGGCUTE',
    evolutions: [
      { method: 'ITEM', condition: 'LEAF_STONE', into: 'EXEGGUTOR' },
    ],
    levelUpMoves: [
      { level: 25, move: 'REFLECT' },
      { level: 28, move: 'LEECH_SEED' },
      { level: 32, move: 'STUN_SPORE' },
      { level: 37, move: 'POISONPOWDER' },
      { level: 42, move: 'SOLARBEAM' },
      { level: 48, move: 'SLEEP_POWDER' },
    ],
  },
  {
    id: 'GRIMER',
    evolutions: [
      { method: 'LEVEL', condition: 38, into: 'MUK' },
    ],
    levelUpMoves: [
      { level: 30, move: 'POISON_GAS' },
      { level: 33, move: 'MINIMIZE' },
      { level: 37, move: 'SLUDGE' },
      { level: 42, move: 'HARDEN' },
      { level: 48, move: 'SCREECH' },
      { level: 55, move: 'ACID_ARMOR' },
    ],
  },
  {
    id: 'GENGAR',
    evolutions: [],
    levelUpMoves: [
      { level: 29, move: 'HYPNOSIS' },
      { level: 38, move: 'DREAM_EATER' },
    ],
  },
  {
    id: 'NIDORAN_F',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'NIDORINA' },
    ],
    levelUpMoves: [
      { level: 8, move: 'SCRATCH' },
      { level: 14, move: 'POISON_STING' },
      { level: 21, move: 'TAIL_WHIP' },
      { level: 29, move: 'BITE' },
      { level: 36, move: 'FURY_SWIPES' },
      { level: 43, move: 'DOUBLE_KICK' },
    ],
  },
  {
    id: 'NIDOQUEEN',
    evolutions: [],
    levelUpMoves: [
      { level: 8, move: 'SCRATCH' },
      { level: 14, move: 'POISON_STING' },
      { level: 23, move: 'BODY_SLAM' },
    ],
  },
  {
    id: 'CUBONE',
    evolutions: [
      { method: 'LEVEL', condition: 28, into: 'MAROWAK' },
    ],
    levelUpMoves: [
      { level: 25, move: 'LEER' },
      { level: 31, move: 'FOCUS_ENERGY' },
      { level: 38, move: 'THRASH' },
      { level: 43, move: 'BONEMERANG' },
      { level: 46, move: 'RAGE' },
    ],
  },
  {
    id: 'RHYHORN',
    evolutions: [
      { method: 'LEVEL', condition: 42, into: 'RHYDON' },
    ],
    levelUpMoves: [
      { level: 30, move: 'STOMP' },
      { level: 35, move: 'TAIL_WHIP' },
      { level: 40, move: 'FURY_ATTACK' },
      { level: 45, move: 'HORN_DRILL' },
      { level: 50, move: 'LEER' },
      { level: 55, move: 'TAKE_DOWN' },
    ],
  },
  {
    id: 'LAPRAS',
    evolutions: [],
    levelUpMoves: [
      { level: 16, move: 'SING' },
      { level: 20, move: 'MIST' },
      { level: 25, move: 'BODY_SLAM' },
      { level: 31, move: 'CONFUSE_RAY' },
      { level: 38, move: 'ICE_BEAM' },
      { level: 46, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'ARCANINE',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'MEW',
    evolutions: [],
    levelUpMoves: [
      { level: 10, move: 'TRANSFORM' },
      { level: 20, move: 'MEGA_PUNCH' },
      { level: 30, move: 'METRONOME' },
      { level: 40, move: 'PSYCHIC_M' },
    ],
  },
  {
    id: 'GYARADOS',
    evolutions: [],
    levelUpMoves: [
      { level: 20, move: 'BITE' },
      { level: 25, move: 'DRAGON_RAGE' },
      { level: 32, move: 'LEER' },
      { level: 41, move: 'HYDRO_PUMP' },
      { level: 52, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'SHELLDER',
    evolutions: [
      { method: 'ITEM', condition: 'WATER_STONE', into: 'CLOYSTER' },
    ],
    levelUpMoves: [
      { level: 18, move: 'SUPERSONIC' },
      { level: 23, move: 'CLAMP' },
      { level: 30, move: 'AURORA_BEAM' },
      { level: 39, move: 'LEER' },
      { level: 50, move: 'ICE_BEAM' },
    ],
  },
  {
    id: 'TENTACOOL',
    evolutions: [
      { method: 'LEVEL', condition: 30, into: 'TENTACRUEL' },
    ],
    levelUpMoves: [
      { level: 7, move: 'SUPERSONIC' },
      { level: 13, move: 'WRAP' },
      { level: 18, move: 'POISON_STING' },
      { level: 22, move: 'WATER_GUN' },
      { level: 27, move: 'CONSTRICT' },
      { level: 33, move: 'BARRIER' },
      { level: 40, move: 'SCREECH' },
      { level: 48, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'GASTLY',
    evolutions: [
      { method: 'LEVEL', condition: 25, into: 'HAUNTER' },
    ],
    levelUpMoves: [
      { level: 27, move: 'HYPNOSIS' },
      { level: 35, move: 'DREAM_EATER' },
    ],
  },
  {
    id: 'SCYTHER',
    evolutions: [],
    levelUpMoves: [
      { level: 17, move: 'LEER' },
      { level: 20, move: 'FOCUS_ENERGY' },
      { level: 24, move: 'DOUBLE_TEAM' },
      { level: 29, move: 'SLASH' },
      { level: 35, move: 'SWORDS_DANCE' },
      { level: 42, move: 'AGILITY' },
    ],
  },
  {
    id: 'STARYU',
    evolutions: [
      { method: 'ITEM', condition: 'WATER_STONE', into: 'STARMIE' },
    ],
    levelUpMoves: [
      { level: 17, move: 'WATER_GUN' },
      { level: 22, move: 'HARDEN' },
      { level: 27, move: 'RECOVER' },
      { level: 32, move: 'SWIFT' },
      { level: 37, move: 'MINIMIZE' },
      { level: 42, move: 'LIGHT_SCREEN' },
      { level: 47, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'BLASTOISE',
    evolutions: [],
    levelUpMoves: [
      { level: 8, move: 'BUBBLE' },
      { level: 15, move: 'WATER_GUN' },
      { level: 24, move: 'BITE' },
      { level: 31, move: 'WITHDRAW' },
      { level: 42, move: 'SKULL_BASH' },
      { level: 52, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'PINSIR',
    evolutions: [],
    levelUpMoves: [
      { level: 25, move: 'SEISMIC_TOSS' },
      { level: 30, move: 'GUILLOTINE' },
      { level: 36, move: 'FOCUS_ENERGY' },
      { level: 43, move: 'HARDEN' },
      { level: 49, move: 'SLASH' },
      { level: 54, move: 'SWORDS_DANCE' },
    ],
  },
  {
    id: 'TANGELA',
    evolutions: [],
    levelUpMoves: [
      { level: 29, move: 'ABSORB' },
      { level: 32, move: 'POISONPOWDER' },
      { level: 36, move: 'STUN_SPORE' },
      { level: 39, move: 'SLEEP_POWDER' },
      { level: 45, move: 'SLAM' },
      { level: 49, move: 'GROWTH' },
    ],
  },
  {
    id: 'GROWLITHE',
    evolutions: [
      { method: 'ITEM', condition: 'FIRE_STONE', into: 'ARCANINE' },
    ],
    levelUpMoves: [
      { level: 18, move: 'EMBER' },
      { level: 23, move: 'LEER' },
      { level: 30, move: 'TAKE_DOWN' },
      { level: 39, move: 'AGILITY' },
      { level: 50, move: 'FLAMETHROWER' },
    ],
  },
  {
    id: 'ONIX',
    evolutions: [],
    levelUpMoves: [
      { level: 15, move: 'BIND' },
      { level: 19, move: 'ROCK_THROW' },
      { level: 25, move: 'RAGE' },
      { level: 33, move: 'SLAM' },
      { level: 43, move: 'HARDEN' },
    ],
  },
  {
    id: 'FEAROW',
    evolutions: [],
    levelUpMoves: [
      { level: 9, move: 'LEER' },
      { level: 15, move: 'FURY_ATTACK' },
      { level: 25, move: 'MIRROR_MOVE' },
      { level: 34, move: 'DRILL_PECK' },
      { level: 43, move: 'AGILITY' },
    ],
  },
  {
    id: 'PIDGEY',
    evolutions: [
      { method: 'LEVEL', condition: 18, into: 'PIDGEOTTO' },
    ],
    levelUpMoves: [
      { level: 5, move: 'SAND_ATTACK' },
      { level: 12, move: 'QUICK_ATTACK' },
      { level: 19, move: 'WHIRLWIND' },
      { level: 28, move: 'WING_ATTACK' },
      { level: 36, move: 'AGILITY' },
      { level: 44, move: 'MIRROR_MOVE' },
    ],
  },
  {
    id: 'SLOWPOKE',
    evolutions: [
      { method: 'LEVEL', condition: 37, into: 'SLOWBRO' },
    ],
    levelUpMoves: [
      { level: 18, move: 'DISABLE' },
      { level: 22, move: 'HEADBUTT' },
      { level: 27, move: 'GROWL' },
      { level: 33, move: 'WATER_GUN' },
      { level: 40, move: 'AMNESIA' },
      { level: 48, move: 'PSYCHIC_M' },
    ],
  },
  {
    id: 'KADABRA',
    evolutions: [
      { method: 'TRADE', condition: 0, into: 'ALAKAZAM' },
    ],
    levelUpMoves: [
      { level: 16, move: 'CONFUSION' },
      { level: 20, move: 'DISABLE' },
      { level: 27, move: 'PSYBEAM' },
      { level: 31, move: 'RECOVER' },
      { level: 38, move: 'PSYCHIC_M' },
      { level: 42, move: 'REFLECT' },
    ],
  },
  {
    id: 'GRAVELER',
    evolutions: [
      { method: 'TRADE', condition: 0, into: 'GOLEM' },
    ],
    levelUpMoves: [
      { level: 11, move: 'DEFENSE_CURL' },
      { level: 16, move: 'ROCK_THROW' },
      { level: 21, move: 'SELFDESTRUCT' },
      { level: 29, move: 'HARDEN' },
      { level: 36, move: 'EARTHQUAKE' },
      { level: 43, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'CHANSEY',
    evolutions: [],
    levelUpMoves: [
      { level: 24, move: 'SING' },
      { level: 30, move: 'GROWL' },
      { level: 38, move: 'MINIMIZE' },
      { level: 44, move: 'DEFENSE_CURL' },
      { level: 48, move: 'LIGHT_SCREEN' },
      { level: 54, move: 'DOUBLE_EDGE' },
    ],
  },
  {
    id: 'MACHOKE',
    evolutions: [
      { method: 'TRADE', condition: 0, into: 'MACHAMP' },
    ],
    levelUpMoves: [
      { level: 20, move: 'LOW_KICK' },
      { level: 25, move: 'LEER' },
      { level: 36, move: 'FOCUS_ENERGY' },
      { level: 44, move: 'SEISMIC_TOSS' },
      { level: 52, move: 'SUBMISSION' },
    ],
  },
  {
    id: 'MR_MIME',
    evolutions: [],
    levelUpMoves: [
      { level: 15, move: 'CONFUSION' },
      { level: 23, move: 'LIGHT_SCREEN' },
      { level: 31, move: 'DOUBLESLAP' },
      { level: 39, move: 'MEDITATE' },
      { level: 47, move: 'SUBSTITUTE' },
    ],
  },
  {
    id: 'HITMONLEE',
    evolutions: [],
    levelUpMoves: [
      { level: 33, move: 'ROLLING_KICK' },
      { level: 38, move: 'JUMP_KICK' },
      { level: 43, move: 'FOCUS_ENERGY' },
      { level: 48, move: 'HI_JUMP_KICK' },
      { level: 53, move: 'MEGA_KICK' },
    ],
  },
  {
    id: 'HITMONCHAN',
    evolutions: [],
    levelUpMoves: [
      { level: 33, move: 'FIRE_PUNCH' },
      { level: 38, move: 'ICE_PUNCH' },
      { level: 43, move: 'THUNDERPUNCH' },
      { level: 48, move: 'MEGA_PUNCH' },
      { level: 53, move: 'COUNTER' },
    ],
  },
  {
    id: 'ARBOK',
    evolutions: [],
    levelUpMoves: [
      { level: 10, move: 'POISON_STING' },
      { level: 17, move: 'BITE' },
      { level: 27, move: 'GLARE' },
      { level: 36, move: 'SCREECH' },
      { level: 47, move: 'ACID' },
    ],
  },
  {
    id: 'PARASECT',
    evolutions: [],
    levelUpMoves: [
      { level: 13, move: 'STUN_SPORE' },
      { level: 20, move: 'LEECH_LIFE' },
      { level: 30, move: 'SPORE' },
      { level: 39, move: 'SLASH' },
      { level: 48, move: 'GROWTH' },
    ],
  },
  {
    id: 'PSYDUCK',
    evolutions: [
      { method: 'LEVEL', condition: 33, into: 'GOLDUCK' },
    ],
    levelUpMoves: [
      { level: 28, move: 'TAIL_WHIP' },
      { level: 31, move: 'DISABLE' },
      { level: 36, move: 'CONFUSION' },
      { level: 43, move: 'FURY_SWIPES' },
      { level: 52, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'DROWZEE',
    evolutions: [
      { method: 'LEVEL', condition: 26, into: 'HYPNO' },
    ],
    levelUpMoves: [
      { level: 12, move: 'DISABLE' },
      { level: 17, move: 'CONFUSION' },
      { level: 24, move: 'HEADBUTT' },
      { level: 29, move: 'POISON_GAS' },
      { level: 32, move: 'PSYCHIC_M' },
      { level: 37, move: 'MEDITATE' },
    ],
  },
  {
    id: 'GOLEM',
    evolutions: [],
    levelUpMoves: [
      { level: 11, move: 'DEFENSE_CURL' },
      { level: 16, move: 'ROCK_THROW' },
      { level: 21, move: 'SELFDESTRUCT' },
      { level: 29, move: 'HARDEN' },
      { level: 36, move: 'EARTHQUAKE' },
      { level: 43, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'MAGMAR',
    evolutions: [],
    levelUpMoves: [
      { level: 36, move: 'LEER' },
      { level: 39, move: 'CONFUSE_RAY' },
      { level: 43, move: 'FIRE_PUNCH' },
      { level: 48, move: 'SMOKESCREEN' },
      { level: 52, move: 'SMOG' },
      { level: 55, move: 'FLAMETHROWER' },
    ],
  },
  {
    id: 'ELECTABUZZ',
    evolutions: [],
    levelUpMoves: [
      { level: 34, move: 'THUNDERSHOCK' },
      { level: 37, move: 'SCREECH' },
      { level: 42, move: 'THUNDERPUNCH' },
      { level: 49, move: 'LIGHT_SCREEN' },
      { level: 54, move: 'THUNDER' },
    ],
  },
  {
    id: 'MAGNETON',
    evolutions: [],
    levelUpMoves: [
      { level: 21, move: 'SONICBOOM' },
      { level: 25, move: 'THUNDERSHOCK' },
      { level: 29, move: 'SUPERSONIC' },
      { level: 38, move: 'THUNDER_WAVE' },
      { level: 46, move: 'SWIFT' },
      { level: 54, move: 'SCREECH' },
    ],
  },
  {
    id: 'KOFFING',
    evolutions: [
      { method: 'LEVEL', condition: 35, into: 'WEEZING' },
    ],
    levelUpMoves: [
      { level: 32, move: 'SLUDGE' },
      { level: 37, move: 'SMOKESCREEN' },
      { level: 40, move: 'SELFDESTRUCT' },
      { level: 45, move: 'HAZE' },
      { level: 48, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'MANKEY',
    evolutions: [
      { method: 'LEVEL', condition: 28, into: 'PRIMEAPE' },
    ],
    levelUpMoves: [
      { level: 15, move: 'KARATE_CHOP' },
      { level: 21, move: 'FURY_SWIPES' },
      { level: 27, move: 'FOCUS_ENERGY' },
      { level: 33, move: 'SEISMIC_TOSS' },
      { level: 39, move: 'THRASH' },
    ],
  },
  {
    id: 'SEEL',
    evolutions: [
      { method: 'LEVEL', condition: 34, into: 'DEWGONG' },
    ],
    levelUpMoves: [
      { level: 30, move: 'GROWL' },
      { level: 35, move: 'AURORA_BEAM' },
      { level: 40, move: 'REST' },
      { level: 45, move: 'TAKE_DOWN' },
      { level: 50, move: 'ICE_BEAM' },
    ],
  },
  {
    id: 'DIGLETT',
    evolutions: [
      { method: 'LEVEL', condition: 26, into: 'DUGTRIO' },
    ],
    levelUpMoves: [
      { level: 15, move: 'GROWL' },
      { level: 19, move: 'DIG' },
      { level: 24, move: 'SAND_ATTACK' },
      { level: 31, move: 'SLASH' },
      { level: 40, move: 'EARTHQUAKE' },
    ],
  },
  {
    id: 'TAUROS',
    evolutions: [],
    levelUpMoves: [
      { level: 21, move: 'STOMP' },
      { level: 28, move: 'TAIL_WHIP' },
      { level: 35, move: 'LEER' },
      { level: 44, move: 'RAGE' },
      { level: 51, move: 'TAKE_DOWN' },
    ],
  },
  {
    id: 'FARFETCH_D',
    evolutions: [],
    levelUpMoves: [
      { level: 7, move: 'LEER' },
      { level: 15, move: 'FURY_ATTACK' },
      { level: 23, move: 'SWORDS_DANCE' },
      { level: 31, move: 'AGILITY' },
      { level: 39, move: 'SLASH' },
    ],
  },
  {
    id: 'VENONAT',
    evolutions: [
      { method: 'LEVEL', condition: 31, into: 'VENOMOTH' },
    ],
    levelUpMoves: [
      { level: 24, move: 'POISONPOWDER' },
      { level: 27, move: 'LEECH_LIFE' },
      { level: 30, move: 'STUN_SPORE' },
      { level: 35, move: 'PSYBEAM' },
      { level: 38, move: 'SLEEP_POWDER' },
      { level: 43, move: 'PSYCHIC_M' },
    ],
  },
  {
    id: 'DRAGONITE',
    evolutions: [],
    levelUpMoves: [
      { level: 10, move: 'THUNDER_WAVE' },
      { level: 20, move: 'AGILITY' },
      { level: 35, move: 'SLAM' },
      { level: 45, move: 'DRAGON_RAGE' },
      { level: 60, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'DODUO',
    evolutions: [
      { method: 'LEVEL', condition: 31, into: 'DODRIO' },
    ],
    levelUpMoves: [
      { level: 20, move: 'GROWL' },
      { level: 24, move: 'FURY_ATTACK' },
      { level: 30, move: 'DRILL_PECK' },
      { level: 36, move: 'RAGE' },
      { level: 40, move: 'TRI_ATTACK' },
      { level: 44, move: 'AGILITY' },
    ],
  },
  {
    id: 'POLIWAG',
    evolutions: [
      { method: 'LEVEL', condition: 25, into: 'POLIWHIRL' },
    ],
    levelUpMoves: [
      { level: 16, move: 'HYPNOSIS' },
      { level: 19, move: 'WATER_GUN' },
      { level: 25, move: 'DOUBLESLAP' },
      { level: 31, move: 'BODY_SLAM' },
      { level: 38, move: 'AMNESIA' },
      { level: 45, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'JYNX',
    evolutions: [],
    levelUpMoves: [
      { level: 18, move: 'LICK' },
      { level: 23, move: 'DOUBLESLAP' },
      { level: 31, move: 'ICE_PUNCH' },
      { level: 39, move: 'BODY_SLAM' },
      { level: 47, move: 'THRASH' },
      { level: 58, move: 'BLIZZARD' },
    ],
  },
  {
    id: 'MOLTRES',
    evolutions: [],
    levelUpMoves: [
      { level: 51, move: 'LEER' },
      { level: 55, move: 'AGILITY' },
      { level: 60, move: 'SKY_ATTACK' },
    ],
  },
  {
    id: 'ARTICUNO',
    evolutions: [],
    levelUpMoves: [
      { level: 51, move: 'BLIZZARD' },
      { level: 55, move: 'AGILITY' },
      { level: 60, move: 'MIST' },
    ],
  },
  {
    id: 'ZAPDOS',
    evolutions: [],
    levelUpMoves: [
      { level: 51, move: 'THUNDER' },
      { level: 55, move: 'AGILITY' },
      { level: 60, move: 'LIGHT_SCREEN' },
    ],
  },
  {
    id: 'DITTO',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'MEOWTH',
    evolutions: [
      { method: 'LEVEL', condition: 28, into: 'PERSIAN' },
    ],
    levelUpMoves: [
      { level: 12, move: 'BITE' },
      { level: 17, move: 'PAY_DAY' },
      { level: 24, move: 'SCREECH' },
      { level: 33, move: 'FURY_SWIPES' },
      { level: 44, move: 'SLASH' },
    ],
  },
  {
    id: 'KRABBY',
    evolutions: [
      { method: 'LEVEL', condition: 28, into: 'KINGLER' },
    ],
    levelUpMoves: [
      { level: 20, move: 'VICEGRIP' },
      { level: 25, move: 'GUILLOTINE' },
      { level: 30, move: 'STOMP' },
      { level: 35, move: 'CRABHAMMER' },
      { level: 40, move: 'HARDEN' },
    ],
  },
  {
    id: 'VULPIX',
    evolutions: [
      { method: 'ITEM', condition: 'FIRE_STONE', into: 'NINETALES' },
    ],
    levelUpMoves: [
      { level: 16, move: 'QUICK_ATTACK' },
      { level: 21, move: 'ROAR' },
      { level: 28, move: 'CONFUSE_RAY' },
      { level: 35, move: 'FLAMETHROWER' },
      { level: 42, move: 'FIRE_SPIN' },
    ],
  },
  {
    id: 'NINETALES',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'PIKACHU',
    evolutions: [
      { method: 'ITEM', condition: 'THUNDER_STONE', into: 'RAICHU' },
    ],
    levelUpMoves: [
      { level: 9, move: 'THUNDER_WAVE' },
      { level: 16, move: 'QUICK_ATTACK' },
      { level: 26, move: 'SWIFT' },
      { level: 33, move: 'AGILITY' },
      { level: 43, move: 'THUNDER' },
    ],
  },
  {
    id: 'RAICHU',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'DRATINI',
    evolutions: [
      { method: 'LEVEL', condition: 30, into: 'DRAGONAIR' },
    ],
    levelUpMoves: [
      { level: 10, move: 'THUNDER_WAVE' },
      { level: 20, move: 'AGILITY' },
      { level: 30, move: 'SLAM' },
      { level: 40, move: 'DRAGON_RAGE' },
      { level: 50, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'DRAGONAIR',
    evolutions: [
      { method: 'LEVEL', condition: 55, into: 'DRAGONITE' },
    ],
    levelUpMoves: [
      { level: 10, move: 'THUNDER_WAVE' },
      { level: 20, move: 'AGILITY' },
      { level: 35, move: 'SLAM' },
      { level: 45, move: 'DRAGON_RAGE' },
      { level: 55, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'KABUTO',
    evolutions: [
      { method: 'LEVEL', condition: 40, into: 'KABUTOPS' },
    ],
    levelUpMoves: [
      { level: 34, move: 'ABSORB' },
      { level: 39, move: 'SLASH' },
      { level: 44, move: 'LEER' },
      { level: 49, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'KABUTOPS',
    evolutions: [],
    levelUpMoves: [
      { level: 34, move: 'ABSORB' },
      { level: 39, move: 'SLASH' },
      { level: 46, move: 'LEER' },
      { level: 53, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'HORSEA',
    evolutions: [
      { method: 'LEVEL', condition: 32, into: 'SEADRA' },
    ],
    levelUpMoves: [
      { level: 19, move: 'SMOKESCREEN' },
      { level: 24, move: 'LEER' },
      { level: 30, move: 'WATER_GUN' },
      { level: 37, move: 'AGILITY' },
      { level: 45, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'SEADRA',
    evolutions: [],
    levelUpMoves: [
      { level: 19, move: 'SMOKESCREEN' },
      { level: 24, move: 'LEER' },
      { level: 30, move: 'WATER_GUN' },
      { level: 41, move: 'AGILITY' },
      { level: 52, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'SANDSHREW',
    evolutions: [
      { method: 'LEVEL', condition: 22, into: 'SANDSLASH' },
    ],
    levelUpMoves: [
      { level: 10, move: 'SAND_ATTACK' },
      { level: 17, move: 'SLASH' },
      { level: 24, move: 'POISON_STING' },
      { level: 31, move: 'SWIFT' },
      { level: 38, move: 'FURY_SWIPES' },
    ],
  },
  {
    id: 'SANDSLASH',
    evolutions: [],
    levelUpMoves: [
      { level: 10, move: 'SAND_ATTACK' },
      { level: 17, move: 'SLASH' },
      { level: 27, move: 'POISON_STING' },
      { level: 36, move: 'SWIFT' },
      { level: 47, move: 'FURY_SWIPES' },
    ],
  },
  {
    id: 'OMANYTE',
    evolutions: [
      { method: 'LEVEL', condition: 40, into: 'OMASTAR' },
    ],
    levelUpMoves: [
      { level: 34, move: 'HORN_ATTACK' },
      { level: 39, move: 'LEER' },
      { level: 46, move: 'SPIKE_CANNON' },
      { level: 53, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'OMASTAR',
    evolutions: [],
    levelUpMoves: [
      { level: 34, move: 'HORN_ATTACK' },
      { level: 39, move: 'LEER' },
      { level: 44, move: 'SPIKE_CANNON' },
      { level: 49, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'JIGGLYPUFF',
    evolutions: [
      { method: 'ITEM', condition: 'MOON_STONE', into: 'WIGGLYTUFF' },
    ],
    levelUpMoves: [
      { level: 9, move: 'POUND' },
      { level: 14, move: 'DISABLE' },
      { level: 19, move: 'DEFENSE_CURL' },
      { level: 24, move: 'DOUBLESLAP' },
      { level: 29, move: 'REST' },
      { level: 34, move: 'BODY_SLAM' },
      { level: 39, move: 'DOUBLE_EDGE' },
    ],
  },
  {
    id: 'WIGGLYTUFF',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'EEVEE',
    evolutions: [
      { method: 'ITEM', condition: 'FIRE_STONE', into: 'FLAREON' },
      { method: 'ITEM', condition: 'THUNDER_STONE', into: 'JOLTEON' },
      { method: 'ITEM', condition: 'WATER_STONE', into: 'VAPOREON' },
    ],
    levelUpMoves: [
      { level: 27, move: 'QUICK_ATTACK' },
      { level: 31, move: 'TAIL_WHIP' },
      { level: 37, move: 'BITE' },
      { level: 45, move: 'TAKE_DOWN' },
    ],
  },
  {
    id: 'FLAREON',
    evolutions: [],
    levelUpMoves: [
      { level: 27, move: 'QUICK_ATTACK' },
      { level: 31, move: 'EMBER' },
      { level: 37, move: 'TAIL_WHIP' },
      { level: 40, move: 'BITE' },
      { level: 42, move: 'LEER' },
      { level: 44, move: 'FIRE_SPIN' },
      { level: 48, move: 'RAGE' },
      { level: 54, move: 'FLAMETHROWER' },
    ],
  },
  {
    id: 'JOLTEON',
    evolutions: [],
    levelUpMoves: [
      { level: 27, move: 'QUICK_ATTACK' },
      { level: 31, move: 'THUNDERSHOCK' },
      { level: 37, move: 'TAIL_WHIP' },
      { level: 40, move: 'THUNDER_WAVE' },
      { level: 42, move: 'DOUBLE_KICK' },
      { level: 44, move: 'AGILITY' },
      { level: 48, move: 'PIN_MISSILE' },
      { level: 54, move: 'THUNDER' },
    ],
  },
  {
    id: 'VAPOREON',
    evolutions: [],
    levelUpMoves: [
      { level: 27, move: 'QUICK_ATTACK' },
      { level: 31, move: 'WATER_GUN' },
      { level: 37, move: 'TAIL_WHIP' },
      { level: 40, move: 'BITE' },
      { level: 42, move: 'ACID_ARMOR' },
      { level: 44, move: 'HAZE' },
      { level: 48, move: 'MIST' },
      { level: 54, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'MACHOP',
    evolutions: [
      { method: 'LEVEL', condition: 28, into: 'MACHOKE' },
    ],
    levelUpMoves: [
      { level: 20, move: 'LOW_KICK' },
      { level: 25, move: 'LEER' },
      { level: 32, move: 'FOCUS_ENERGY' },
      { level: 39, move: 'SEISMIC_TOSS' },
      { level: 46, move: 'SUBMISSION' },
    ],
  },
  {
    id: 'ZUBAT',
    evolutions: [
      { method: 'LEVEL', condition: 22, into: 'GOLBAT' },
    ],
    levelUpMoves: [
      { level: 10, move: 'SUPERSONIC' },
      { level: 15, move: 'BITE' },
      { level: 21, move: 'CONFUSE_RAY' },
      { level: 28, move: 'WING_ATTACK' },
      { level: 36, move: 'HAZE' },
    ],
  },
  {
    id: 'EKANS',
    evolutions: [
      { method: 'LEVEL', condition: 22, into: 'ARBOK' },
    ],
    levelUpMoves: [
      { level: 10, move: 'POISON_STING' },
      { level: 17, move: 'BITE' },
      { level: 24, move: 'GLARE' },
      { level: 31, move: 'SCREECH' },
      { level: 38, move: 'ACID' },
    ],
  },
  {
    id: 'PARAS',
    evolutions: [
      { method: 'LEVEL', condition: 24, into: 'PARASECT' },
    ],
    levelUpMoves: [
      { level: 13, move: 'STUN_SPORE' },
      { level: 20, move: 'LEECH_LIFE' },
      { level: 27, move: 'SPORE' },
      { level: 34, move: 'SLASH' },
      { level: 41, move: 'GROWTH' },
    ],
  },
  {
    id: 'POLIWHIRL',
    evolutions: [
      { method: 'ITEM', condition: 'WATER_STONE', into: 'POLIWRATH' },
    ],
    levelUpMoves: [
      { level: 16, move: 'HYPNOSIS' },
      { level: 19, move: 'WATER_GUN' },
      { level: 26, move: 'DOUBLESLAP' },
      { level: 33, move: 'BODY_SLAM' },
      { level: 41, move: 'AMNESIA' },
      { level: 49, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'POLIWRATH',
    evolutions: [],
    levelUpMoves: [
      { level: 16, move: 'HYPNOSIS' },
      { level: 19, move: 'WATER_GUN' },
    ],
  },
  {
    id: 'WEEDLE',
    evolutions: [
      { method: 'LEVEL', condition: 7, into: 'KAKUNA' },
    ],
    levelUpMoves: [],
  },
  {
    id: 'KAKUNA',
    evolutions: [
      { method: 'LEVEL', condition: 10, into: 'BEEDRILL' },
    ],
    levelUpMoves: [],
  },
  {
    id: 'BEEDRILL',
    evolutions: [],
    levelUpMoves: [
      { level: 12, move: 'FURY_ATTACK' },
      { level: 16, move: 'FOCUS_ENERGY' },
      { level: 20, move: 'TWINEEDLE' },
      { level: 25, move: 'RAGE' },
      { level: 30, move: 'PIN_MISSILE' },
      { level: 35, move: 'AGILITY' },
    ],
  },
  {
    id: 'DODRIO',
    evolutions: [],
    levelUpMoves: [
      { level: 20, move: 'GROWL' },
      { level: 24, move: 'FURY_ATTACK' },
      { level: 30, move: 'DRILL_PECK' },
      { level: 39, move: 'RAGE' },
      { level: 45, move: 'TRI_ATTACK' },
      { level: 51, move: 'AGILITY' },
    ],
  },
  {
    id: 'PRIMEAPE',
    evolutions: [],
    levelUpMoves: [
      { level: 15, move: 'KARATE_CHOP' },
      { level: 21, move: 'FURY_SWIPES' },
      { level: 27, move: 'FOCUS_ENERGY' },
      { level: 37, move: 'SEISMIC_TOSS' },
      { level: 46, move: 'THRASH' },
    ],
  },
  {
    id: 'DUGTRIO',
    evolutions: [],
    levelUpMoves: [
      { level: 15, move: 'GROWL' },
      { level: 19, move: 'DIG' },
      { level: 24, move: 'SAND_ATTACK' },
      { level: 35, move: 'SLASH' },
      { level: 47, move: 'EARTHQUAKE' },
    ],
  },
  {
    id: 'VENOMOTH',
    evolutions: [],
    levelUpMoves: [
      { level: 24, move: 'POISONPOWDER' },
      { level: 27, move: 'LEECH_LIFE' },
      { level: 30, move: 'STUN_SPORE' },
      { level: 38, move: 'PSYBEAM' },
      { level: 43, move: 'SLEEP_POWDER' },
      { level: 50, move: 'PSYCHIC_M' },
    ],
  },
  {
    id: 'DEWGONG',
    evolutions: [],
    levelUpMoves: [
      { level: 30, move: 'GROWL' },
      { level: 35, move: 'AURORA_BEAM' },
      { level: 44, move: 'REST' },
      { level: 50, move: 'TAKE_DOWN' },
      { level: 56, move: 'ICE_BEAM' },
    ],
  },
  {
    id: 'CATERPIE',
    evolutions: [
      { method: 'LEVEL', condition: 7, into: 'METAPOD' },
    ],
    levelUpMoves: [],
  },
  {
    id: 'METAPOD',
    evolutions: [
      { method: 'LEVEL', condition: 10, into: 'BUTTERFREE' },
    ],
    levelUpMoves: [],
  },
  {
    id: 'BUTTERFREE',
    evolutions: [],
    levelUpMoves: [
      { level: 12, move: 'CONFUSION' },
      { level: 15, move: 'POISONPOWDER' },
      { level: 16, move: 'STUN_SPORE' },
      { level: 17, move: 'SLEEP_POWDER' },
      { level: 21, move: 'SUPERSONIC' },
      { level: 26, move: 'WHIRLWIND' },
      { level: 32, move: 'PSYBEAM' },
    ],
  },
  {
    id: 'MACHAMP',
    evolutions: [],
    levelUpMoves: [
      { level: 20, move: 'LOW_KICK' },
      { level: 25, move: 'LEER' },
      { level: 36, move: 'FOCUS_ENERGY' },
      { level: 44, move: 'SEISMIC_TOSS' },
      { level: 52, move: 'SUBMISSION' },
    ],
  },
  {
    id: 'GOLDUCK',
    evolutions: [],
    levelUpMoves: [
      { level: 28, move: 'TAIL_WHIP' },
      { level: 31, move: 'DISABLE' },
      { level: 39, move: 'CONFUSION' },
      { level: 48, move: 'FURY_SWIPES' },
      { level: 59, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'HYPNO',
    evolutions: [],
    levelUpMoves: [
      { level: 12, move: 'DISABLE' },
      { level: 17, move: 'CONFUSION' },
      { level: 24, move: 'HEADBUTT' },
      { level: 33, move: 'POISON_GAS' },
      { level: 37, move: 'PSYCHIC_M' },
      { level: 43, move: 'MEDITATE' },
    ],
  },
  {
    id: 'GOLBAT',
    evolutions: [],
    levelUpMoves: [
      { level: 10, move: 'SUPERSONIC' },
      { level: 15, move: 'BITE' },
      { level: 21, move: 'CONFUSE_RAY' },
      { level: 32, move: 'WING_ATTACK' },
      { level: 43, move: 'HAZE' },
    ],
  },
  {
    id: 'MEWTWO',
    evolutions: [],
    levelUpMoves: [
      { level: 63, move: 'BARRIER' },
      { level: 66, move: 'PSYCHIC_M' },
      { level: 70, move: 'RECOVER' },
      { level: 75, move: 'MIST' },
      { level: 81, move: 'AMNESIA' },
    ],
  },
  {
    id: 'SNORLAX',
    evolutions: [],
    levelUpMoves: [
      { level: 35, move: 'BODY_SLAM' },
      { level: 41, move: 'HARDEN' },
      { level: 48, move: 'DOUBLE_EDGE' },
      { level: 56, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'MAGIKARP',
    evolutions: [
      { method: 'LEVEL', condition: 20, into: 'GYARADOS' },
    ],
    levelUpMoves: [
      { level: 15, move: 'TACKLE' },
    ],
  },
  {
    id: 'MUK',
    evolutions: [],
    levelUpMoves: [
      { level: 30, move: 'POISON_GAS' },
      { level: 33, move: 'MINIMIZE' },
      { level: 37, move: 'SLUDGE' },
      { level: 45, move: 'HARDEN' },
      { level: 53, move: 'SCREECH' },
      { level: 60, move: 'ACID_ARMOR' },
    ],
  },
  {
    id: 'KINGLER',
    evolutions: [],
    levelUpMoves: [
      { level: 20, move: 'VICEGRIP' },
      { level: 25, move: 'GUILLOTINE' },
      { level: 34, move: 'STOMP' },
      { level: 42, move: 'CRABHAMMER' },
      { level: 49, move: 'HARDEN' },
    ],
  },
  {
    id: 'CLOYSTER',
    evolutions: [],
    levelUpMoves: [
      { level: 50, move: 'SPIKE_CANNON' },
    ],
  },
  {
    id: 'ELECTRODE',
    evolutions: [],
    levelUpMoves: [
      { level: 17, move: 'SONICBOOM' },
      { level: 22, move: 'SELFDESTRUCT' },
      { level: 29, move: 'LIGHT_SCREEN' },
      { level: 40, move: 'SWIFT' },
      { level: 50, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'CLEFABLE',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'WEEZING',
    evolutions: [],
    levelUpMoves: [
      { level: 32, move: 'SLUDGE' },
      { level: 39, move: 'SMOKESCREEN' },
      { level: 43, move: 'SELFDESTRUCT' },
      { level: 49, move: 'HAZE' },
      { level: 53, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'PERSIAN',
    evolutions: [],
    levelUpMoves: [
      { level: 12, move: 'BITE' },
      { level: 17, move: 'PAY_DAY' },
      { level: 24, move: 'SCREECH' },
      { level: 37, move: 'FURY_SWIPES' },
      { level: 51, move: 'SLASH' },
    ],
  },
  {
    id: 'MAROWAK',
    evolutions: [],
    levelUpMoves: [
      { level: 25, move: 'LEER' },
      { level: 33, move: 'FOCUS_ENERGY' },
      { level: 41, move: 'THRASH' },
      { level: 48, move: 'BONEMERANG' },
      { level: 55, move: 'RAGE' },
    ],
  },
  {
    id: 'HAUNTER',
    evolutions: [
      { method: 'TRADE', condition: 0, into: 'GENGAR' },
    ],
    levelUpMoves: [
      { level: 29, move: 'HYPNOSIS' },
      { level: 38, move: 'DREAM_EATER' },
    ],
  },
  {
    id: 'ABRA',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'KADABRA' },
    ],
    levelUpMoves: [],
  },
  {
    id: 'ALAKAZAM',
    evolutions: [],
    levelUpMoves: [
      { level: 16, move: 'CONFUSION' },
      { level: 20, move: 'DISABLE' },
      { level: 27, move: 'PSYBEAM' },
      { level: 31, move: 'RECOVER' },
      { level: 38, move: 'PSYCHIC_M' },
      { level: 42, move: 'REFLECT' },
    ],
  },
  {
    id: 'PIDGEOTTO',
    evolutions: [
      { method: 'LEVEL', condition: 36, into: 'PIDGEOT' },
    ],
    levelUpMoves: [
      { level: 5, move: 'SAND_ATTACK' },
      { level: 12, move: 'QUICK_ATTACK' },
      { level: 21, move: 'WHIRLWIND' },
      { level: 31, move: 'WING_ATTACK' },
      { level: 40, move: 'AGILITY' },
      { level: 49, move: 'MIRROR_MOVE' },
    ],
  },
  {
    id: 'PIDGEOT',
    evolutions: [],
    levelUpMoves: [
      { level: 5, move: 'SAND_ATTACK' },
      { level: 12, move: 'QUICK_ATTACK' },
      { level: 21, move: 'WHIRLWIND' },
      { level: 31, move: 'WING_ATTACK' },
      { level: 44, move: 'AGILITY' },
      { level: 54, move: 'MIRROR_MOVE' },
    ],
  },
  {
    id: 'STARMIE',
    evolutions: [],
    levelUpMoves: [],
  },
  {
    id: 'BULBASAUR',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'IVYSAUR' },
    ],
    levelUpMoves: [
      { level: 7, move: 'LEECH_SEED' },
      { level: 13, move: 'VINE_WHIP' },
      { level: 20, move: 'POISONPOWDER' },
      { level: 27, move: 'RAZOR_LEAF' },
      { level: 34, move: 'GROWTH' },
      { level: 41, move: 'SLEEP_POWDER' },
      { level: 48, move: 'SOLARBEAM' },
    ],
  },
  {
    id: 'VENUSAUR',
    evolutions: [],
    levelUpMoves: [
      { level: 7, move: 'LEECH_SEED' },
      { level: 13, move: 'VINE_WHIP' },
      { level: 22, move: 'POISONPOWDER' },
      { level: 30, move: 'RAZOR_LEAF' },
      { level: 43, move: 'GROWTH' },
      { level: 55, move: 'SLEEP_POWDER' },
      { level: 65, move: 'SOLARBEAM' },
    ],
  },
  {
    id: 'TENTACRUEL',
    evolutions: [],
    levelUpMoves: [
      { level: 7, move: 'SUPERSONIC' },
      { level: 13, move: 'WRAP' },
      { level: 18, move: 'POISON_STING' },
      { level: 22, move: 'WATER_GUN' },
      { level: 27, move: 'CONSTRICT' },
      { level: 35, move: 'BARRIER' },
      { level: 43, move: 'SCREECH' },
      { level: 50, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'GOLDEEN',
    evolutions: [
      { method: 'LEVEL', condition: 33, into: 'SEAKING' },
    ],
    levelUpMoves: [
      { level: 19, move: 'SUPERSONIC' },
      { level: 24, move: 'HORN_ATTACK' },
      { level: 30, move: 'FURY_ATTACK' },
      { level: 37, move: 'WATERFALL' },
      { level: 45, move: 'HORN_DRILL' },
      { level: 54, move: 'AGILITY' },
    ],
  },
  {
    id: 'SEAKING',
    evolutions: [],
    levelUpMoves: [
      { level: 19, move: 'SUPERSONIC' },
      { level: 24, move: 'HORN_ATTACK' },
      { level: 30, move: 'FURY_ATTACK' },
      { level: 39, move: 'WATERFALL' },
      { level: 48, move: 'HORN_DRILL' },
      { level: 54, move: 'AGILITY' },
    ],
  },
  {
    id: 'PONYTA',
    evolutions: [
      { method: 'LEVEL', condition: 40, into: 'RAPIDASH' },
    ],
    levelUpMoves: [
      { level: 30, move: 'TAIL_WHIP' },
      { level: 32, move: 'STOMP' },
      { level: 35, move: 'GROWL' },
      { level: 39, move: 'FIRE_SPIN' },
      { level: 43, move: 'TAKE_DOWN' },
      { level: 48, move: 'AGILITY' },
    ],
  },
  {
    id: 'RAPIDASH',
    evolutions: [],
    levelUpMoves: [
      { level: 30, move: 'TAIL_WHIP' },
      { level: 32, move: 'STOMP' },
      { level: 35, move: 'GROWL' },
      { level: 39, move: 'FIRE_SPIN' },
      { level: 47, move: 'TAKE_DOWN' },
      { level: 55, move: 'AGILITY' },
    ],
  },
  {
    id: 'RATTATA',
    evolutions: [
      { method: 'LEVEL', condition: 20, into: 'RATICATE' },
    ],
    levelUpMoves: [
      { level: 7, move: 'QUICK_ATTACK' },
      { level: 14, move: 'HYPER_FANG' },
      { level: 23, move: 'FOCUS_ENERGY' },
      { level: 34, move: 'SUPER_FANG' },
    ],
  },
  {
    id: 'RATICATE',
    evolutions: [],
    levelUpMoves: [
      { level: 7, move: 'QUICK_ATTACK' },
      { level: 14, move: 'HYPER_FANG' },
      { level: 27, move: 'FOCUS_ENERGY' },
      { level: 41, move: 'SUPER_FANG' },
    ],
  },
  {
    id: 'NIDORINO',
    evolutions: [
      { method: 'ITEM', condition: 'MOON_STONE', into: 'NIDOKING' },
    ],
    levelUpMoves: [
      { level: 8, move: 'HORN_ATTACK' },
      { level: 14, move: 'POISON_STING' },
      { level: 23, move: 'FOCUS_ENERGY' },
      { level: 32, move: 'FURY_ATTACK' },
      { level: 41, move: 'HORN_DRILL' },
      { level: 50, move: 'DOUBLE_KICK' },
    ],
  },
  {
    id: 'NIDORINA',
    evolutions: [
      { method: 'ITEM', condition: 'MOON_STONE', into: 'NIDOQUEEN' },
    ],
    levelUpMoves: [
      { level: 8, move: 'SCRATCH' },
      { level: 14, move: 'POISON_STING' },
      { level: 23, move: 'TAIL_WHIP' },
      { level: 32, move: 'BITE' },
      { level: 41, move: 'FURY_SWIPES' },
      { level: 50, move: 'DOUBLE_KICK' },
    ],
  },
  {
    id: 'GEODUDE',
    evolutions: [
      { method: 'LEVEL', condition: 25, into: 'GRAVELER' },
    ],
    levelUpMoves: [
      { level: 11, move: 'DEFENSE_CURL' },
      { level: 16, move: 'ROCK_THROW' },
      { level: 21, move: 'SELFDESTRUCT' },
      { level: 26, move: 'HARDEN' },
      { level: 31, move: 'EARTHQUAKE' },
      { level: 36, move: 'EXPLOSION' },
    ],
  },
  {
    id: 'PORYGON',
    evolutions: [],
    levelUpMoves: [
      { level: 23, move: 'PSYBEAM' },
      { level: 28, move: 'RECOVER' },
      { level: 35, move: 'AGILITY' },
      { level: 42, move: 'TRI_ATTACK' },
    ],
  },
  {
    id: 'AERODACTYL',
    evolutions: [],
    levelUpMoves: [
      { level: 33, move: 'SUPERSONIC' },
      { level: 38, move: 'BITE' },
      { level: 45, move: 'TAKE_DOWN' },
      { level: 54, move: 'HYPER_BEAM' },
    ],
  },
  {
    id: 'MAGNEMITE',
    evolutions: [
      { method: 'LEVEL', condition: 30, into: 'MAGNETON' },
    ],
    levelUpMoves: [
      { level: 21, move: 'SONICBOOM' },
      { level: 25, move: 'THUNDERSHOCK' },
      { level: 29, move: 'SUPERSONIC' },
      { level: 35, move: 'THUNDER_WAVE' },
      { level: 41, move: 'SWIFT' },
      { level: 47, move: 'SCREECH' },
    ],
  },
  {
    id: 'CHARMANDER',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'CHARMELEON' },
    ],
    levelUpMoves: [
      { level: 9, move: 'EMBER' },
      { level: 15, move: 'LEER' },
      { level: 22, move: 'RAGE' },
      { level: 30, move: 'SLASH' },
      { level: 38, move: 'FLAMETHROWER' },
      { level: 46, move: 'FIRE_SPIN' },
    ],
  },
  {
    id: 'SQUIRTLE',
    evolutions: [
      { method: 'LEVEL', condition: 16, into: 'WARTORTLE' },
    ],
    levelUpMoves: [
      { level: 8, move: 'BUBBLE' },
      { level: 15, move: 'WATER_GUN' },
      { level: 22, move: 'BITE' },
      { level: 28, move: 'WITHDRAW' },
      { level: 35, move: 'SKULL_BASH' },
      { level: 42, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'CHARMELEON',
    evolutions: [
      { method: 'LEVEL', condition: 36, into: 'CHARIZARD' },
    ],
    levelUpMoves: [
      { level: 9, move: 'EMBER' },
      { level: 15, move: 'LEER' },
      { level: 24, move: 'RAGE' },
      { level: 33, move: 'SLASH' },
      { level: 42, move: 'FLAMETHROWER' },
      { level: 56, move: 'FIRE_SPIN' },
    ],
  },
  {
    id: 'WARTORTLE',
    evolutions: [
      { method: 'LEVEL', condition: 36, into: 'BLASTOISE' },
    ],
    levelUpMoves: [
      { level: 8, move: 'BUBBLE' },
      { level: 15, move: 'WATER_GUN' },
      { level: 24, move: 'BITE' },
      { level: 31, move: 'WITHDRAW' },
      { level: 39, move: 'SKULL_BASH' },
      { level: 47, move: 'HYDRO_PUMP' },
    ],
  },
  {
    id: 'CHARIZARD',
    evolutions: [],
    levelUpMoves: [
      { level: 9, move: 'EMBER' },
      { level: 15, move: 'LEER' },
      { level: 24, move: 'RAGE' },
      { level: 36, move: 'SLASH' },
      { level: 46, move: 'FLAMETHROWER' },
      { level: 55, move: 'FIRE_SPIN' },
    ],
  },
  {
    id: 'ODDISH',
    evolutions: [
      { method: 'LEVEL', condition: 21, into: 'GLOOM' },
    ],
    levelUpMoves: [
      { level: 15, move: 'POISONPOWDER' },
      { level: 17, move: 'STUN_SPORE' },
      { level: 19, move: 'SLEEP_POWDER' },
      { level: 24, move: 'ACID' },
      { level: 33, move: 'PETAL_DANCE' },
      { level: 46, move: 'SOLARBEAM' },
    ],
  },
  {
    id: 'GLOOM',
    evolutions: [
      { method: 'ITEM', condition: 'LEAF_STONE', into: 'VILEPLUME' },
    ],
    levelUpMoves: [
      { level: 15, move: 'POISONPOWDER' },
      { level: 17, move: 'STUN_SPORE' },
      { level: 19, move: 'SLEEP_POWDER' },
      { level: 28, move: 'ACID' },
      { level: 38, move: 'PETAL_DANCE' },
      { level: 52, move: 'SOLARBEAM' },
    ],
  },
  {
    id: 'VILEPLUME',
    evolutions: [],
    levelUpMoves: [
      { level: 15, move: 'POISONPOWDER' },
      { level: 17, move: 'STUN_SPORE' },
      { level: 19, move: 'SLEEP_POWDER' },
    ],
  },
  {
    id: 'BELLSPROUT',
    evolutions: [
      { method: 'LEVEL', condition: 21, into: 'WEEPINBELL' },
    ],
    levelUpMoves: [
      { level: 13, move: 'WRAP' },
      { level: 15, move: 'POISONPOWDER' },
      { level: 18, move: 'SLEEP_POWDER' },
      { level: 21, move: 'STUN_SPORE' },
      { level: 26, move: 'ACID' },
      { level: 33, move: 'RAZOR_LEAF' },
      { level: 42, move: 'SLAM' },
    ],
  },
  {
    id: 'WEEPINBELL',
    evolutions: [
      { method: 'ITEM', condition: 'LEAF_STONE', into: 'VICTREEBEL' },
    ],
    levelUpMoves: [
      { level: 13, move: 'WRAP' },
      { level: 15, move: 'POISONPOWDER' },
      { level: 18, move: 'SLEEP_POWDER' },
      { level: 23, move: 'STUN_SPORE' },
      { level: 29, move: 'ACID' },
      { level: 38, move: 'RAZOR_LEAF' },
      { level: 49, move: 'SLAM' },
    ],
  },
  {
    id: 'VICTREEBEL',
    evolutions: [],
    levelUpMoves: [
      { level: 13, move: 'WRAP' },
      { level: 15, move: 'POISONPOWDER' },
      { level: 18, move: 'SLEEP_POWDER' },
    ],
  },
];

export const GROWTH_BY_ID: Record<string, PokemonGrowth> = Object.fromEntries(
  POKEMON_GROWTH.map(g => [g.id, g])
);
