from turtle import isvisible
import pygame

CARD_KEY_COLOR = pygame.Color(0, 1, 10)

CARD_POS_GRID = 1
CARD_POS_SLOT = 2
CARD_POS_CACHE = 3
CARD_POS_FINISH = 4

def sub(a, b):
    c = a - b
    if c < 0:
        return 0
    else:
        return c

class Card:
    def __init__(self, cno, pos) -> None:
        self.cardNo = cno
        self.pos = pos
        self.surf = None
        self.dst = None
        self.isTop = False
        self.isVisible = False
        self.status = CARD_POS_GRID

    def Create(self, screen, dst, top, visible):
        self.surf = pygame.Surface([48, 58], 0, screen)
        self.surf.set_colorkey(CARD_KEY_COLOR)
        self.dst = dst
        self.isTop = top
        self.isVisible = visible
        self.drawCard()

    def drawCard(self):
        self.surf.fill(CARD_KEY_COLOR)
        if self.isTop:
            color = ((11 * self.cardNo) % 256, (22 * self.cardNo) % 256, (33 * self.cardNo) % 256)
        else:
            color = (100, 100, 100)
        pygame.draw.rect(self.surf, color, (0, 0, 48, 58), 0, 6)
        if not self.isTop:
            pygame.draw.rect(self.surf, (30, 30, 30), (0, 0, 48, 58), 1, 6)

        if self.isVisible:
            font = pygame.font.SysFont("Consolas", 16)
            if self.isTop:
                txColor = (255-color[0], 255-color[1], 255-color[2])
            else:
                txColor = (250, 250, 250)
            text = font.render("%d" % self.cardNo, True, txColor)
            self.surf.blit(text, (16, 24))
        
    def setTop(self):
        self.isVisible = True
        self.isTop = True
        self.drawCard()

    def setVisible(self):
        self.isVisible = True
        self.drawCard()

    def putSlot(self, dst):
        self.status = CARD_POS_SLOT
        self.dst = dst

    def clearCard(self):
        self.status = CARD_POS_FINISH

    def setSlotPos(self, pos):
        self.pos = pos

    def draw(self):
        if self.status == CARD_POS_GRID or self.status == CARD_POS_SLOT:
            self.dst.blit(self.surf, self.pos)