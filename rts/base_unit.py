import pygame

class BaseUnit:
    def __init__(self, app, uid, campid) -> None:
        self.uid = uid
        self.hp = 0
        self.atk = 0
        self.defend = 0
        self.pos = None
        self.renderPos = None
        self.campid = campid
        self.surface = None
        self.app = app
        self.isSelected = False
        self.selSurf = None

    def initSelect(self):
        self.selSurf = pygame.Surface([self.resCfg['width'], self.resCfg['width']/2], 0, self.app.screen)
        self.selSurf.set_colorkey(pygame.Color(1, 1, 1))
        self.selSurf.fill(pygame.Color(1, 1, 1))
        pygame.draw.ellipse(self.selSurf, pygame.Color(35,217,110), pygame.Rect(0, 0, self.resCfg['width'], self.resCfg['width']/2), 1)

    def subHp(self, hp):
        self.hp -= hp
        if self.hp < 0:
            self.hp = 0

    def isDead(self):
        return self.hp <= 0

    def isInRect(self, rect):
        rt = pygame.Rect(self.renderPos[0], self.renderPos[1], self.resCfg['width'], self.resCfg['height'])
        return rt.colliderect(rect)

    def setSelected(self, selected):
        self.isSelected = selected

    def drawSelect(self, dst):
        if self.isSelected:
            dst.blit(self.selSurf, [self.renderPos[0], self.pos[1] - self.resCfg['width']/4])

    def draw(self, dst):
        if self.surface:
            dst.blit(self.surface, self.renderPos)

    def isMoving(self):
        return False
