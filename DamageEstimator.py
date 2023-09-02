import json
import math
from termcolor import colored
import argparse

status_multipliers = {
    "Pull": 0.5,
    "Push": 0.5,
    "Dazed": 0.75,
    "Grabbed": 0.75,
    "Reeling": 0.75,
    "Vulnerable": 0.75,
    "Slowed": 0.75,
    "Bleed": 1.0,
    "Exposed": 1.0,
    "Impaired": 1.0,
    "Prone": 1.25,
    "Hobbled": 1.25,
    "Reeling": 1.25
}

def get_status_damage(status_string, glancing):
    split_status = status_string.split()
    if(len(split_status) == 0): return 0
    status = split_status[0]
    secondary = split_status[1]
    status = status.replace('_', '')
    secondary = secondary.replace('[', '')

    damage_multiplier = status_multipliers[status]

    glancing_mod = 0
    if(glancing): glancing_mod = -1

    if damage_multiplier != 0:
        if 'x' in secondary:
            return damage_multiplier * (int(secondary[0]) + glancing_mod) * int(secondary[2])
        else:
            return damage_multiplier * (int(secondary)  + glancing_mod)
    else:
        print(status + " has no damage multiplier!")
    return damage_multiplier


def estimate_damage(type, name, glancing, treat_status_as_damage):
    if(type == "Technique"):
        f = open('.\src\database\\techniques.json')
    elif(type == "Obstacle"):
        f = open('.\src\database\obstacles.json')
    elif(type == "Weapon"):
        f = open('.\src\database\items\weapons.json')
    elif(type == "Maneuvers"):
        f = open('.\src\database\maneuvers.json')
    elif(type == "Attack"):
        f = open('.\src\database\\attacks.json')

    data = json.load(f)

    # Liklihood of a roll based on the defenses being used.
    straight = [0.0277777777778, 0.0555555555556, 0.0833333333333, 0.111111111111, 0.138888888889, 0.166666666667, 0.138888888889, 0.111111111111, 0.0833333333333, 0.0555555555556, 0.0277777777778]
    advantage = [0.00462962962963, 0.0138888888889, 0.0324074074074, 0.0555555555556, 0.087962962963, 0.125, 0.157407407407, 0.166666666667, 0.157407407407, 0.125, 0.0740740740741]
    disadvantage = [0.0740740740741, 0.125, 0.157407407407, 0.166666666667, 0.157407407407, 0.125, 0.087962962963, 0.0555555555556, 0.0324074074074, 0.0138888888889, 0.00462962962963]

    hit = []
    damage_chart = []
    status_chart = []
    speed = 1
    lvh = 'none'
    minor = False
    
    expected_damage = [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]

    if(type == "Technique"):
        for technique in data:
            if(technique["name"] == name):
                if("chart" in technique):
                    if(not("damage" in technique["chart"])):
                        damage_chart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    else:                        
                        damage_chart = technique["chart"]["damage"]
                    hit = technique["chart"]["roll"]
                    status_chart = technique["chart"]["status"]
                    if(len(technique["speed"]) == 1):
                        speed = int(technique["speed"])
                    else:
                        speed = int(technique["speed"][0])
    else:
        for weapon in data:
            if(weapon["name"] == name):
                hit = weapon["chart"]["roll"]
                if(not("damage" in weapon["chart"])):
                    damage_chart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                else:
                    damage_chart = weapon["chart"]["damage"]
                status_chart = weapon["chart"]["status"]
                if("speed" in weapon):
                    speed = int(weapon["speed"])
                if("class" in weapon):
                    minor = weapon["class"] == 'Minor Attack'

    if(damage_chart == []):
        raise Exception("Technique or weapon not found.")
                        
    straight_damage = [0, 0, 0, 0, 0, 0, 0, 0]
    advantage_damage = [0, 0, 0, 0, 0, 0, 0, 0]
    disadvantage_damage = [0, 0, 0, 0, 0, 0, 0, 0]

    for i in range (10,0,-1):
        for j in range(0,8):
            speed_dif = j-speed+1 # +1 because zero indexed
            if lvh == 'Heavy':
                speed_dif = speed_dif*2
            index = i

            if speed_dif < 0:
                index = i + speed_dif

            if index < 0:
                continue

            damage = (damage_chart[index])
            if(glancing): damage = math.ceil(damage/2.0)

            if(treat_status_as_damage):
                for status in status_chart[index].split(','):
                    if '/' in status:
                        options = status.split('/')
                        damage += max([get_status_damage(x, glancing) for x in options])
                    else:
                        damage += get_status_damage(status, glancing)

            straight_damage[j] += straight[i]*damage
            advantage_damage[j] += advantage[i]*damage
            disadvantage_damage[j] += disadvantage[i]*damage

    if minor:
        expected_damage = [x / 2 for x in expected_damage]

    print(colored("Speed:                  1      2      3      4      5      6      7      8", 'white'))
    print(colored("Expected Damage:        " +  '  '.join(["{:.3f}".format(damage) for damage in expected_damage]), 'blue'))
    print(colored("Straight Attack:        " +  '  '.join(["{:.3f}".format(damage) for damage in straight_damage]), 'white'))
    print(colored("Advantage Attack:       " +  '  '.join(["{:.3f}".format(damage) for damage in advantage_damage]), 'green'))
    print(colored("Disadvantage Attack:    " +  '  '.join(["{:.3f}".format(damage) for damage in disadvantage_damage]), 'red'))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", help="What type of ability this is.", type=str)
    parser.add_argument("--name", help="Name of the ability.", type=str)
    parser.add_argument("--glancing", help="Whether or not to apply Glancing.", action='store_true')
    parser.add_argument("--treat_status_as_damage", help="If specified will add statuses additively to the Damage.", action='store_true')
    args = parser.parse_args()
    estimate_damage(args.type, args.name, args.glancing, args.treat_status_as_damage)