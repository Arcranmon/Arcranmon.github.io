import { store } from '@/store'
import { Armor, Discipline, Stance, Weapon, Spirit, Technique } from '@/class'

var kSpiritDisciplineCategories = ['Earth']

var kBaseHealth = 25

var kBasicTechniques = ['Skirmish', 'Combination Strike', 'Smash']
var kBasicAttacks = ['Weapon Attack', 'Charged Attack', 'Quickened Attack', 'Swift Manifestation', 'Unarmed Attack', 'Grapple']
var kBasicActions = ['Hide', 'Fight', 'Shift', 'Raise Guard', 'Rally', 'Focus']
var kBasicStunts = ['Disengage', 'Draw/Stow', 'Combo', 'Leap', 'Sprint', 'Tumble', 'Use Environment']
var kBasicReactions = ['Flank', 'Engage', 'Opportunity Attack', 'Active Defense', 'Dodge', 'Spiritual Interdiction', 'Spirit Summon']
var kBasicGambits = ['Aim', 'Basic Feint', 'Basic Flourish', 'Basic Sunder', 'Critical Hit', 'Mark']

class Character {
  // Combat Qualities
  private current_health_: number
  private max_health_: number
  private vigor_: number
  private stamina_: number
  private used_manifest_: boolean
  private ap_: number
  private statuses_: Array<IStatusEffect>

  // Level Up Qualities
  private current_spirit_stance_: Stance
  private current_martial_stance_: Stance
  private equipped_armor_: Armor
  private disciplines_: Array<ICharDisciplineData>
  private arts_: Array<ICharDisciplineData>
  private momentum_: number
  private name_: string
  private player_character_: Boolean
  private element_: string
  private weapons_: Array<string>
  private gear_: Array<string>

  private spirit_: Spirit

  kMoveCharts = [
    store.getters.getMovement('Unencumbered'),
    store.getters.getMovement('Light Load'),
    store.getters.getMovement('Medium Load'),
    store.getters.getMovement('Heavy Load'),
  ]

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================
  public constructor() {
    this.current_spirit_stance_ = store.getters.getStance('No Stance')
    this.current_martial_stance_ = store.getters.getStance('No Stance')
    this.arts_ = []
    this.disciplines_ = []
    this.EquippedArmor = store.getters.getArmor('Basic Clothes')
    this.stamina_ = 0
    this.ap_ = 2
    this.used_manifest_ = false
    this.spirit_ = new Spirit()
    this.current_health_ = kBaseHealth
    this.max_health_ = kBaseHealth
    this.momentum_ = 0
    this.name_ = ''
    this.player_character_ = true
    this.element_ = ''
    this.weapons_ = []
    this.statuses_ = []
  }

  // ==========================================================
  // GETTERS/SETTERS
  // ==========================================================

  get AP() {
    return this.ap_
  }

  set AP(ap: number) {
    if (ap > this.MaxAP) return
    this.ap_ = ap
  }

  public AddStatus(status: string) {
    var idx = this.statuses_.findIndex((e) => e.status == status)
    if (idx == -1) {
      this.statuses_.push({ status: status, stack: 1 })
      idx = this.statuses_.length - 1
    } else this.statuses_[idx].stack += 1

    var status_info = store.getters.getStatus(status)

    if (status_info.Type == 'Status Effect') this.statuses_[idx].stack = 777

    this.statuses_.sort((a, b) => a.status.localeCompare(b.status))
  }

  public RemoveStatus(status: string) {
    var idx = this.statuses_.findIndex((e) => e.status == status)
    if (idx == -1) return
    else if (this.statuses_[idx].stack == 777) this.statuses_.splice(idx, 1)
    else {
      this.statuses_[idx].stack -= 1
      if (this.statuses_[idx].stack == 0) this.statuses_.splice(idx, 1)
    }
  }

  public get StatusEffects() {
    return this.statuses_
  }

  get MaxAP() {
    return 2
  }

  get UsedManifest() {
    return this.used_manifest_
  }

  public ToggleManifest() {
    this.used_manifest_ = !this.used_manifest_
  }

  get Vigor() {
    return this.vigor_
  }

  set Vigor(vigor: number) {
    this.vigor_ = vigor
  }

  get Stamina() {
    return this.stamina_
  }

  set Stamina(stamina: number) {
    if (stamina > this.MaxStamina) return
    this.stamina_ = stamina
  }

  get MaxStamina() {
    return this.CurrentSpiritStance.Stamina + this.CurrentMartialStance.Stamina
  }

  get CurrentHealth() {
    return this.current_health_
  }
  set CurrentHealth(health: number) {
    this.current_health_ = health
  }
  get CurrentSpiritStance() {
    // TODO: This is a hack
    var spirit_disc = this.disciplines_.filter((discipline) => store.getters.getDiscipline(discipline.name).Type != 'Style')
    return store.getters.getDiscipline(spirit_disc[0].name).Tier2Stances[0]
  }
  get CurrentMartialStance() {
    // TODO: This is a hack
    var style_disc = this.disciplines_.filter((discipline) => store.getters.getDiscipline(discipline.name).Type == 'Style')
    return store.getters.getDiscipline(style_disc[0].name).Tier2Stances[0]
  }
  get Disciplines() {
    return this.disciplines_
  }
  get EquippedArmor() {
    return this.equipped_armor_
  }
  get MoveChart() {
    for (var movement of this.kMoveCharts) {
      if (this.Weight <= movement.Encumbrance) return movement
    }
  }
  get Weight() {
    var weight = this.equipped_armor_.Weight
    for (var weapon of this.weapons_) {
      weight += store.getters.getWeapon(weapon).Weight
    }
    return weight
  }
  get Gear() {
    return this.gear_
  }
  get MaxHealth() {
    return this.max_health_
  }
  get Momentum() {
    return this.momentum_
  }
  set Momentum(input: number) {
    this.momentum_ = input
  }
  get Name() {
    return this.name_
  }
  get Spirit() {
    return this.spirit_
  }
  get Element() {
    return this.element_
  }

  get SpiritStances() {
    var spirit_stances = []
    for (var disc of this.disciplines_) {
      if (disc.tier > 1) {
        var discipline = store.getters.getDiscipline(disc.name)
        if (kSpiritDisciplineCategories.includes(discipline.Category)) spirit_stances = spirit_stances.concat(discipline.Tier2Stances)
      }
    }
    spirit_stances.sort((a, b) => a.Name.localeCompare(b.Name))
    return spirit_stances
  }

  get MartialStances() {
    var martial_stances = []
    for (var disc of this.disciplines_) {
      if (disc.tier > 1) {
        var discipline = store.getters.getDiscipline(disc.name)
        if (!kSpiritDisciplineCategories.includes(discipline.Category)) martial_stances = martial_stances.concat(discipline.Tier2Stances)
      }
    }
    martial_stances.sort((a, b) => a.Name.localeCompare(b.Name))
    return martial_stances
  }

  get Techniques() {
    var techniques = store.getters.getTechniquesFromList(kBasicTechniques)
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      techniques = techniques.concat(discipline.Tier1Techniques)
      if (disc.tier > 1) techniques = techniques.concat(discipline.Tier2Techniques)
    }
    techniques.sort((a, b) => {
      if (a.Speed > b.Speed) {
        return 1
      } else if (a.Speed < b.Speed) {
        return -1
      } else {
        if (a.Name > b.Name) {
          return 1
        } else if (a.Name < b.Name) {
          return -1
        } else {
          return 0
        }
      }
    })
    return techniques
  }

  get SpiritTechniques() {
    var techniques = store.getters.getTechniquesFromList(kBasicTechniques)
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      if (discipline.Type == 'Style') continue
      techniques = techniques.concat(discipline.Tier1Techniques)
      if (disc.tier > 1) techniques = techniques.concat(discipline.Tier2Techniques)
    }
    techniques.sort((a, b) => {
      if (a.Speed > b.Speed) {
        return 1
      } else if (a.Speed < b.Speed) {
        return -1
      } else {
        if (a.Name > b.Name) {
          return 1
        } else if (a.Name < b.Name) {
          return -1
        } else {
          return 0
        }
      }
    })
    return techniques
  }

  get Attacks() {
    var attacks = store.getters.getAttacksFromList(kBasicAttacks)
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      attacks = attacks.concat(discipline.Tier1Attacks)
      if (disc.tier > 1) attacks = attacks.concat(discipline.Tier2Attacks)
    }
    for (var art of this.arts_) {
      var art_info = store.getters.getArt(art.name)
      attacks = attacks.concat(art_info.Tier1Attacks)
      if (art.tier > 1) attacks = attacks.concat(art_info.Tier2Attacks)
    }
    attacks.sort((a, b) => a.Name.localeCompare(b.Name))
    return attacks
  }

  get MinorAttacks() {
    return this.Attacks.filter((x) => x.Rank == '_Minor Attack_')
  }

  get MajorAttacks() {
    return this.Attacks.filter((x) => x.Rank == '_Major Attack_')
  }

  get SpiritAttacks() {
    var attacks = this.Spirit.Attacks
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      attacks = attacks.concat(discipline.Tier1Attacks)
      if (disc.tier > 1) attacks = attacks.concat(discipline.Tier2Attacks)
    }
    attacks.sort((a, b) => a.Name.localeCompare(b.Name))
    return attacks
  }

  get SpiritMinorAttacks() {
    return this.SpiritAttacks.filter((x) => x.Rank == '_Minor Attack_')
  }

  get SpiritMajorAttacks() {
    return this.SpiritAttacks.filter((x) => x.Rank == '_Major Attack_')
  }

  public ManeuversOfType(type: string) {
    if (type == 'Action') var maneuvers = store.getters.getManeuversFromList(kBasicActions)
    if (type == 'Stunt') var maneuvers = store.getters.getManeuversFromList(kBasicStunts)
    if (type == 'Reaction') var maneuvers = store.getters.getManeuversFromList(kBasicReactions)
    if (type == 'Gambit') var maneuvers = store.getters.getManeuversFromList(kBasicGambits)
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      for (var maneuver of discipline.Tier1Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
      if (disc.tier > 1) for (var maneuver of discipline.Tier2Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
    }
    for (var art of this.arts_) {
      var art_info = store.getters.getArt(art.name)
      for (var maneuver of art_info.Tier1Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
      if (art.tier > 1) for (var maneuver of art_info.Tier2Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
    }
    maneuvers.sort((a, b) => a.Name.localeCompare(b.Name))
    return maneuvers
  }

  public SpiritManeuversOfType(type: string) {
    if (type == 'Action') var maneuvers = this.Spirit.Actions
    if (type == 'Stunt') var maneuvers = this.Spirit.Stunts
    if (type == 'Reaction') var maneuvers = this.Spirit.Reactions
    if (type == 'Gambit') var maneuvers = this.Spirit.Gambits
    for (var disc of this.disciplines_) {
      var discipline = store.getters.getDiscipline(disc.name)
      if (discipline.Type == 'Style') continue
      for (var maneuver of discipline.Tier1Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
      if (disc.tier > 1) for (var maneuver of discipline.Tier2Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
    }
    for (var art of this.arts_) {
      var art_info = store.getters.getArt(art.name)
      if (discipline.Type == 'Style') continue
      for (var maneuver of art_info.Tier1Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
      if (art.tier > 1) for (var maneuver of art_info.Tier2Maneuvers) if (maneuver.Type == type) maneuvers.push(maneuver)
    }
    maneuvers.sort((a, b) => a.Name.localeCompare(b.Name))
    return maneuvers
  }
  get Weapons() {
    return this.weapons_
  }

  // ==========================================================
  // SETTERS
  // ==========================================================
  set CurrentSpiritStance(spirit_stance: Stance) {
    this.current_spirit_stance_ = spirit_stance
  }
  set CurrentMartialStance(martial_stance: Stance) {
    this.current_martial_stance_ = martial_stance
  }

  set EquippedArmor(armor: Armor) {
    this.equipped_armor_ = armor
  }

  set Name(name: string) {
    this.name_ = name
  }
  set Element(spirit: string) {
    this.element_ = spirit
  }
  set Weapons(weapons: string[]) {
    this.weapons_ = weapons
  }
  public AddWeapon(weapon: Weapon) {
    this.weapons_.push(weapon.Name)
  }

  public RemoveWeapon(index: number) {
    if (index > -1) {
      this.weapons_.splice(index, 1)
    }
  }

  public AddArt(art: Discipline) {
    var idx = this.arts_.findIndex((e) => e.name == art.Name)
    if (idx == -1) {
      var new_discipline: ICharDisciplineData = { name: art.Name, tier: 1 }
      this.arts_.push(new_discipline)
    } else {
      this.arts_[idx].tier += 1
    }
  }

  public AddDiscipline(discipline: Discipline) {
    var idx = this.disciplines_.findIndex((e) => e.name == discipline.Name)
    console.log('Add: ' + idx)
    if (idx == -1) {
      var new_discipline: ICharDisciplineData = { name: discipline.Name, tier: 1 }
      this.disciplines_.push(new_discipline)
    } else {
      this.disciplines_[idx].tier += 1
    }
  }

  public RemoveDiscipline(discipline: string) {
    var idx = this.disciplines_.findIndex((e) => e.name == discipline)
    if (idx > -1) {
      this.disciplines_[idx].tier -= 1
      if (this.disciplines_[idx].tier <= 0) this.disciplines_.splice(idx)
    }
  }

  public ApplyRefresh() {}
  public ResetDefault() {
    this.momentum_ = 0
    this.vigor_ = 0
    this.current_health_ = this.max_health_
    this.current_health_ = this.max_health_
  }

  public ClearSpiritInfo() {
    this.spirit_ = new Spirit()
    this.ClearSpiritAbilities()
  }

  public ClearSpiritAbilities() {
    this.arts_ = this.arts_.filter((art) => store.getters.getArt(art.name).Type == 'Style')
    this.disciplines_ = this.disciplines_.filter((discipline) => store.getters.getDiscipline(discipline.name).Type == 'Style')
  }

  // ==========================================================
  // CONVENIENCE CHECKS
  // ==========================================================
  get HasEquippedArmor() {
    return this.equipped_armor_ != null
  }

  get HasSpirit() {
    return this.element_ != ''
  }

  public CanAddDiscipline(discipline: Discipline) {
    var idx = this.disciplines_.findIndex((e) => e.name == discipline.Name)
    if (idx > -1 && this.disciplines_[idx].tier == 3) return false

    if (discipline.Type != 'Style' && this.HasSpiritDisciplines) return false
    if (discipline.Type == 'Style' && this.HasStyleDisciplines) return false

    return true
  }

  public CanAddWeapon(weapon: Weapon) {
    return 16 - this.Weight >= weapon.Weight
  }

  public CanAddArmor(armor: Armor) {
    return 16 - this.Weight >= armor.Weight
  }

  // TODO: Update when character advancement is a thing.
  get HasSpiritDisciplines() {
    var disciplines_check = this.disciplines_.filter((discipline) => store.getters.getDiscipline(discipline.name).Type != 'Style')
    return disciplines_check.length == 1
  }

  // TODO: Update when character advancement is a thing.
  get HasStyleDisciplines() {
    var disciplines_check = this.disciplines_.filter((discipline) => store.getters.getDiscipline(discipline.name).Type == 'Style')
    return disciplines_check.length == 1
  }

  get HasDisciplines() {
    return this.HasSpiritDisciplines && this.HasStyleDisciplines
  }

  get Complete() {
    return this.HasSpirit && this.HasEquippedArmor && this.HasNames
  }

  get AnyStanceUnequipped() {
    return this.current_spirit_stance_.Name == 'No Stance' || this.current_martial_stance_.Name == 'No Stance'
  }

  get HasNames() {
    return this.Name != ''
  }

  get RecommendedDisciplines() {
    var recs = [this.element_, 'Unarmed']
    if (this.equipped_armor_ != null) recs.push(this.equipped_armor_.Category)
    for (var weapon of this.weapons_) {
      var full_weapon = store.getters.getWeapon(weapon)
      if (!recs.includes(full_weapon.Category + ' Weapon')) recs.push(full_weapon.Category + ' Weapon')
      if (full_weapon.Keywords.some((y) => y.includes('Thrown')) && !recs.includes('Throwing Weapons')) recs.push('Throwing Weapon')
    }

    return recs
  }

  // ==========================================================
  // HELPERS
  // ==========================================================
  private SmartCommas(in_string: string, out_string: string) {
    if (out_string.length > 0) return out_string + ', ' + in_string
    return out_string + in_string
  }

  // ==========================================================
  // SERIALIZATION
  // ==========================================================
  public static Serialize(character: Character): ICharacterData {
    return {
      //Character Save Data
      ap: character.ap_,
      current_spirit_stance: character.current_spirit_stance_ ? character.current_spirit_stance_.Name : '',
      current_martial_stance: character.current_martial_stance_ ? character.current_martial_stance_.Name : '',
      arts: character.arts_,
      disciplines: character.disciplines_,
      equipped_armor: character.equipped_armor_ ? character.equipped_armor_.Name : '',
      stamina: character.stamina_,
      gear: character.gear_,
      current_health: character.current_health_,
      max_health: character.max_health_,
      momentum: character.momentum_,
      name: character.name_,
      player_character: character.player_character_,
      spirit: Spirit.Serialize(character.spirit_),
      statuses: character.statuses_,
      used_manifest: character.used_manifest_,
      weapons: character.weapons_,
      vigor: character.vigor_,
    }
  }

  public static Deserialize(data: ICharacterData): Character {
    const c = new Character()
    c.setCharacterData(data)
    return c
  }

  private setCharacterData(data: ICharacterData): void {
    if ('current_spirit_stance' in data) this.current_spirit_stance_ = store.getters.getStance(data.current_spirit_stance)
    if ('current_martial_stance' in data) this.current_martial_stance_ = store.getters.getStance(data.current_martial_stance)
    this.current_health_ = data.current_health || kBaseHealth
    if ('equipped_armor' in data) this.equipped_armor_ = store.getters.getArmor(data.equipped_armor)
    this.gear_ = data.gear || []
    this.max_health_ = data.max_health || kBaseHealth
    this.momentum_ = data.momentum || 0
    this.name_ = data.name || ''
    this.player_character_ = data.player_character || true
    this.stamina_ = data.stamina || 0
    this.statuses_ = data.statuses || []
    this.spirit_ = Spirit.Deserialize(data.spirit)
    this.arts_ = data.arts || []
    this.disciplines_ = data.disciplines || []
    this.used_manifest_ = data.used_manifest || false
    this.weapons_ = data.weapons || []
    this.vigor_ = data.vigor || 0
  }
}
export default Character
