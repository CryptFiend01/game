import os
import pygame
from sheep import makeGrids
from card import Card, CARD_POS_GRID
from card import CARD_POS_SLOT

KEY_COLOR = pygame.Color(0, 0, 10)

OFFSET_X = 50
OFFSET_Y = 100
CARD_WIDTH = 50
CARD_HEIGHT = 60

WIN = 1
LOSE =2

class Game:
    def __init__(self) -> None:
        self.surfaces = []
        self.screen = None
        self.cards = []
        self.cardGrids = []
        self.maxWidth = 0
        self.maxHeight = 0
        self.screenColor = (195,254,139)
        self.cardSlots = []
        self.result = 0

    def Init(self, grids, maxWidth, maxHeight):
        pygame.init()

        self.maxWidth = maxWidth
        self.maxHeight = maxHeight
        self.grids = grids

        self.screen = pygame.display.set_mode((480, 960), 0, 32)
        pygame.display.set_caption("Sheep*3")
        self.screen.fill(self.screenColor)

        font = pygame.font.SysFont("Consolas", 32)
        self.winText = font.render("YOU WIN!!!!", True, (30, 180, 230))
        self.loseText = font.render("YOU LOSE, FOOLISH DONKEY~~~ ^_^", True, (230, 80, 30))

        ssize = [self.maxWidth * 50, self.maxHeight * 60]
        print(f"screen size: {ssize}")

        self.slotSurf = pygame.Surface([50*7, 60], 0, self.screen)
        self.slotSurf.set_colorkey(KEY_COLOR)
        self.slotSurf.fill(KEY_COLOR)

        for i, layer in enumerate(grids):
            surf = pygame.Surface(ssize, 0, self.screen)
            surf.set_colorkey(KEY_COLOR)
            surf.fill(KEY_COLOR)
            self.surfaces.append(surf)
            w, h = len(layer[0]), len(layer)
            dx = (self.maxWidth - w) * 25
            dy = (self.maxHeight - h) * 30
            x, y = 0, 0
            cardLayer = []
            for line in layer:
                cardLine = []
                for n in line:
                    if n > 0:
                        px = x * 50 + dx
                        py = y * 60 + dy
                        card = Card(n, (px, py))
                        card.Create(self.screen, surf, i == len(grids)-1)
                        self.cards.append(card)
                        cardLine.append(card)
                    else:
                        cardLine.append(None)
                    x += 1
                cardLayer.append(cardLine)
                y += 1
                x = 0
            self.cardGrids.append(cardLayer)

        self.checkAllCardGrids()

    def checkAllCardGrids(self):
        for i, cardLayer in enumerate(self.cardGrids):
            if i == len(self.cardGrids) - 1:
                break
            for y, cardLine in enumerate(cardLayer):
                w1 = len(cardLine)
                h1 = len(cardLayer)
                for x, card in enumerate(cardLine):
                    if card == None or card.isTop:
                        continue
                    if not self.isGridCovered(x, y, w1, h1, i):
                        card.setTop()

    def isGridCovered(self, x, y, w1, h1, i):
        for k in range(i+1, len(self.cardGrids)):
            upLayer = self.cardGrids[k]
            w2 = len(upLayer[0])
            h2 = len(upLayer)
            dw = w2 - w1
            dh = h2 - h1
            mx, my = 1, 1
            if dw < 0:
                mx = -1
            if dh < 0:
                my = -1
            poses = []
            poses.append([x + int(dw/2), y + int(dh/2)])
            if dw % 2 == 0 and dh % 2 != 0:
                poses.append([x + int(dw/2), y + int(dh/2) + my])
            if dw % 2 != 0 and dh % 2 == 0:
                poses.append([x + int(dw/2) + mx, y + int(dh/2)])
            if dw % 2 != 0 and dh % 2 != 0:
                poses.append([x + int(dw/2), y + int(dh/2) + my])
                poses.append([x + int(dw/2) + mx, y + int(dh/2)])
                poses.append([x + int(dw/2) + mx, y + int(dh/2) + my])

            if x == 1 and y == 4:
                card = self.cardGrids[i][y][x]
                print(f"layer {i} check poses: {poses} at layer {k} dw: {dw} dh: {dh} card: {card.cardNo}")
            for pos in poses:
                if self.checkLayerHasCard(upLayer, pos[0], pos[1], w2, h2):
                    if x == 1 and y == 4:
                        card = upLayer[pos[1]][pos[0]]
                        print(f"layer {i} check poses: {pos} at layer {k} has card {card.cardNo}")
                    return True
        return False
    
    def checkLayerHasCard(self, layer, dx, dy, w, h):
        if dx < 0 or dx >= w:
            return False
        if dy < 0 or dy >= h:
            return False
        card = layer[dy][dx]
        if card == None:
            return False
        return card.status == CARD_POS_GRID
       
    def onMouseClick(self, pos):
        gamePos = [pos[0] - OFFSET_X, pos[1]-OFFSET_Y]
        print(f"click gamepos {gamePos}")
        for i in range(len(self.cardGrids)-1, -1, -1):
            layer = self.cardGrids[i]
            w, h = len(layer[0]), len(layer)
            dw, dh = self.maxWidth - w, self.maxHeight - h
            dx, dy = (gamePos[0] - (dw * 25)), (gamePos[1] - (dh * 30))
            if dx < 0 or dy < 0:
                continue
            x = int(dx / 50)
            y = int(dy / 60)
            print(f"[{i}] click ({x}, {y}) w: {w} h: {h} dw: {dw} dh: {dh}")
            if x < 0 or x >= w or y < 0 or y >= h:
                continue
            card = layer[y][x]
            if card != None:
                if card.isTop and card.status == CARD_POS_GRID:
                    self.addAndCheckResult(card)
                    self.checkAllCardGrids()
                    break

    def addAndCheckResult(self, card):
        card.putSlot(self.slotSurf)
        cardNo = card.cardNo
        for i in range(len(self.cardSlots)):
            if self.cardSlots[i].cardNo == cardNo:
                self.cardSlots.insert(i, card)
                break
        else:
            self.cardSlots.append(card)
        
        n = 0
        toDeletes = []
        for c in self.cardSlots:
            if c.cardNo == cardNo:
                n += 1
                toDeletes.append(c)
        print(f"card {cardNo} count {n}")
        if n == 3:
            for c in toDeletes:
                self.cardSlots.remove(c)
                c.clearCard()

        for i, card in enumerate(self.cardSlots):
            p = [i * 50, 0]
            print(f"set card to {p}")
            card.setSlotPos(p)

        if len(self.cardSlots) >= 7:
            self.result = LOSE
        else:
            rest = 0
            for card in self.cards:
                if card != None and card.status == CARD_POS_GRID:
                    rest += 1
                    break
            if rest == 0:
                self.result = WIN

    def draw(self):
        self.screen.fill(self.screenColor)
        if self.result == WIN:
            self.screen.blit(self.winText, (200, 400))
        elif self.result == LOSE:
            self.screen.blit(self.loseText, (10, 400))
        else:
            self.slotSurf.fill(KEY_COLOR)
            for surf in self.surfaces:
                surf.fill(KEY_COLOR)
            for card in self.cards:
                card.draw()
            for surf in self.surfaces:
                self.screen.blit(surf, (OFFSET_X, OFFSET_Y))
            self.screen.blit(self.slotSurf, (60, 600))

    def Run(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    os._exit(0)
                elif event.type == pygame.MOUSEBUTTONUP:
                    self.onMouseClick(event.pos)
            self.draw()
            pygame.display.flip()

if __name__ == '__main__':
    game = Game()
    grids, w, h = makeGrids()
    game.Init(grids, w, h)
    game.Run()