from random import shuffle
from gate import gates

def makeGrids():
    cards = [14,14,14]
    for i in range(14):
        if i < 7:
            cards.extend([i+1]*12)
        else:
            cards.extend([i+1]*12)

    shuffle(cards)

    maxWidth = 0
    maxHeight = 0

    i = 0
    grids = gates.copy()
    for layer in grids:
        if maxHeight < len(layer):
            maxHeight = len(layer)
        if maxWidth < len(layer[0]):
            maxWidth = len(layer[0])
        for line in layer:
            for k in range(len(line)):
                if line[k] > 0:
                    line[k] = cards[i]
                    i += 1
    print(f'use card {i}')
    return grids, maxWidth, maxHeight

grids, width, height = makeGrids()
for grid in grids:
    print(grid)

    