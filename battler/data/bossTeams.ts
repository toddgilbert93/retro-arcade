import type { BossTeam } from './types';

// Each trainer has 2 guaranteed Pokémon plus one of two random alternates
// (selected at runtime via GenRandom). All possible members are listed below.
// The optional third slot (index 2+) represents the random pick options.

export const BOSS_TEAMS: BossTeam[] = [
  {
    // BrockPickMons: guaranteed VULPIX + ONIX, then 50% MAGNEMITE / 50% GEODUDE
    name: 'BROCK',
    pokemon: [
      { species: 'VULPIX',     moves: ['FLAMETHROWER', 'CONFUSE_RAY', 'QUICK_ATTACK', 'DOUBLE_TEAM'] },
      { species: 'ONIX',       moves: ['ROCK_THROW', 'DIG', 'SLAM', 'SCREECH'] },
      { species: 'MAGNEMITE',  moves: ['THUNDERSHOCK', 'THUNDER_WAVE', 'SWIFT', 'SUPERSONIC'] },
      { species: 'GEODUDE',    moves: ['EXPLOSION', 'ROCK_THROW', 'STRENGTH', 'HARDEN'] },
    ],
  },
  {
    // KogaPickMons: guaranteed WEEZING + GOLBAT, then ~57% VENOMOTH / ~43% SCYTHER
    name: 'KOGA',
    pokemon: [
      { species: 'WEEZING',   moves: ['SLUDGE', 'SELFDESTRUCT', 'TOXIC', 'SMOKESCREEN'] },
      { species: 'GOLBAT',    moves: ['WING_ATTACK', 'LEECH_LIFE', 'TOXIC', 'CONFUSE_RAY'] },
      { species: 'VENOMOTH',  moves: ['PSYWAVE', 'TOXIC', 'SLEEP_POWDER', 'POISONPOWDER'] },
      { species: 'SCYTHER',   moves: ['SLASH', 'SWORDS_DANCE', 'DOUBLE_TEAM', 'TOXIC'] },
    ],
  },
  {
    // BlainePickMons: always NINETALES + RHYDON + MAGMAR (no random branch)
    name: 'BLAINE',
    pokemon: [
      { species: 'NINETALES', moves: ['FIRE_BLAST', 'CONFUSE_RAY', 'TAKE_DOWN', 'DIG'] },
      { species: 'RHYDON',    moves: ['EARTHQUAKE', 'HORN_DRILL', 'TAKE_DOWN', 'FIRE_BLAST'] },
      { species: 'MAGMAR',    moves: ['FIRE_BLAST', 'CONFUSE_RAY', 'SMOKESCREEN', 'PSYCHIC_M'] },
    ],
  },
  {
    // GioPickMons: guaranteed KANGASKHAN + RHYDON, then 50% NIDOKING / 50% NIDOQUEEN
    name: 'GIOVANNI',
    pokemon: [
      { species: 'KANGASKHAN', moves: ['MEGA_PUNCH', 'EARTHQUAKE', 'DIZZY_PUNCH', 'SUBMISSION'] },
      { species: 'RHYDON',     moves: ['EARTHQUAKE', 'HORN_DRILL', 'TAKE_DOWN', 'FISSURE'] },
      { species: 'NIDOKING',   moves: ['THRASH', 'TOXIC', 'SURF', 'ICE_BEAM'] },
      { species: 'NIDOQUEEN',  moves: ['EARTHQUAKE', 'BODY_SLAM', 'ROCK_SLIDE', 'TOXIC'] },
    ],
  },
  {
    // LoreleiPickMons: guaranteed DEWGONG + LAPRAS, then 50% CLOYSTER / 50% JYNX
    name: 'LORELEI',
    pokemon: [
      { species: 'DEWGONG',  moves: ['ICE_BEAM', 'SURF', 'REST', 'TAKE_DOWN'] },
      { species: 'LAPRAS',   moves: ['ICE_BEAM', 'SURF', 'THUNDERBOLT', 'SING'] },
      { species: 'CLOYSTER', moves: ['SPIKE_CANNON', 'ICE_BEAM', 'WITHDRAW', 'DOUBLE_TEAM'] },
      { species: 'JYNX',     moves: ['ICE_PUNCH', 'LOVELY_KISS', 'THRASH', 'DOUBLE_TEAM'] },
    ],
  },
  {
    // LancePickMons: always DRAGONITE + AERODACTYL + CHARIZARD (no random branch)
    name: 'LANCE',
    pokemon: [
      { species: 'DRAGONITE',  moves: ['HYPER_BEAM', 'THUNDERBOLT', 'SURF', 'ICE_BEAM'] },
      { species: 'AERODACTYL', moves: ['WING_ATTACK', 'TAKE_DOWN', 'ROCK_SLIDE', 'HYPER_BEAM'] },
      { species: 'CHARIZARD',  moves: ['FLAMETHROWER', 'FLY', 'HYPER_BEAM', 'SLASH'] },
    ],
  },
  {
    // OakPickMons: guaranteed TAUROS, then one of EXEGGUTOR / ARCANINE / GYARADOS,
    // then one of VENUSAUR / BLASTOISE / CHARIZARD
    name: 'OAK',
    pokemon: [
      { species: 'TAUROS',    moves: ['EARTHQUAKE', 'DOUBLE_EDGE', 'FIRE_BLAST', 'DOUBLE_TEAM'] },
      { species: 'EXEGGUTOR', moves: ['PSYCHIC_M', 'MEGA_DRAIN', 'HYPNOSIS', 'EGG_BOMB'] },
      { species: 'ARCANINE',  moves: ['FIRE_BLAST', 'DOUBLE_EDGE', 'DIG', 'DOUBLE_TEAM'] },
      { species: 'GYARADOS',  moves: ['SURF', 'HYPER_BEAM', 'THUNDER', 'BLIZZARD'] },
      { species: 'VENUSAUR',  moves: ['RAZOR_LEAF', 'SOLARBEAM', 'SLEEP_POWDER', 'TOXIC'] },
      { species: 'BLASTOISE', moves: ['HYDRO_PUMP', 'BODY_SLAM', 'ICE_BEAM', 'EARTHQUAKE'] },
      { species: 'CHARIZARD', moves: ['FIRE_BLAST', 'FLY', 'FLASH', 'HYPER_BEAM'] },
    ],
  },
];

export const BOSS_BY_NAME: Record<string, BossTeam> = Object.fromEntries(
  BOSS_TEAMS.map(t => [t.name, t])
);
