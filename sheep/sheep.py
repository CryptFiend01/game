from random import shuffle
from tokenize import group
from gate import gates
import json

def makeGrids():
    data = json.load(open("levels/S2Type1.json", "r"))
    cards = []
    for i in range(data["uniqueTiles"]):
        cards.extend([i+1] * data["totalTiles"] * 3)

    shuffle(cards)

    maxWidth = 0
    maxHeight = 0

    i = 0
    grids = []
    for g in data["layers"]:
        grids.insert(0, g)
        # grids.append(g)

    for l, layer in enumerate(grids):
        if maxHeight < len(layer):
            maxHeight = len(layer)
        if maxWidth < len(layer[0]):
            maxWidth = len(layer[0])
        for y, line in enumerate(layer):
            for k in range(len(line)):
                if line[k] > 0:
                    # if i >= len(cards):
                    #     print(f"layer {l} x {k} y {y} i {i}")
                    line[k] = cards[i]
                    i += 1
    #print(f'use card {i}')
    groups = []
    while i < len(cards):
        groups.append(cards[i])
        i += 1
    return grids, maxWidth, maxHeight, groups

# grids, width, height, groups = makeGrids()
# for grid in grids:
#     print(grid)
