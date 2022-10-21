from base_unit import *
import pygame
from public import CMD_MOVE, posDist
from res_mgr import ResMgr

DIR_DOWN = 1
DIR_LEFT = 2
DIR_RIGHT = 3
DIR_UP = 4

class Unit(BaseUnit):
    def __init__(self, app, uid, camp) -> None:
        super().__init__(app, uid, camp)
        self.utype = 0
        self.speed = 0
        self.dir = DIR_DOWN
        self.img = None
        self.resCfg = None
        self.aniElapse = 0
        self.frame = 0
        self.dFrame = 1
        self.rect = pygame.Rect(0, 0, 0, 0)
        self.cmds = []
        self.runningCmd = None
        self.roads = []
        self.logicFrame = 0

    def Init(self, cfg, pos):
        self.hp = cfg['hp']
        self.atk = cfg['atk']
        self.defend = cfg['def']
        self.speed = cfg['speed']
        self.pos = pos

        rm = ResMgr()
        self.resCfg = rm.getUnitResCfg(cfg['config_id'])
        self.img = rm.getUintImage(self.resCfg['image'])
        # self.surface = pygame.Surface((self.resCfg["width"], self.resCfg["height"]), 0, self.app.screen).convert_alpha()
        self.renderPos = [self.pos[0]-self.resCfg["anchor"][0], self.pos[1]-self.resCfg["anchor"][1]]
        self.initSelect()

        self._drawFrame()
        self.aniElapse = pygame.time.get_ticks()

    def move(self, dx, dy):
        if abs(dy) > abs(dx):
            if dy > 0:
                self.dir = DIR_DOWN
            else:
                self.dir = DIR_UP
        else:
            if dx > 0:
                self.dir = DIR_RIGHT
            else:
                self.dir = DIR_LEFT

        gmap = self.app.game.map

        if gmap.isBlock([self.pos[0] + dx, self.pos[1] + dy]):
            # print("unit is blocked")
            return False

        old = [self.pos[0], self.pos[1]]
        
        self.pos[0] += dx
        self.pos[1] += dy
        self.renderPos = [self.pos[0]-self.resCfg["anchor"][0], self.pos[1]-self.resCfg["anchor"][1]]
        gmap.unitMove(self, old)
        return True

    def moveTo(self, pos):
        self.roads.append(pos)

    def updateLogic(self):
        self.checkCmd()
        self.doMove()

    def checkCmd(self):
        if not self.runningCmd and len(self.cmds) > 0:
            self.runningCmd = self.cmds[0]
            self.cmds.pop(0)
            if self.runningCmd['cmd'] == CMD_MOVE:
                self.moveTo(self.runningCmd['pos'])

    def doMove(self):
        if len(self.roads) > 0:
            tag = self.roads[len(self.roads) - 1]
            dist = posDist(tag, self.pos)
            if dist > self.speed:
                dx = int(self.speed * (tag[0] - self.pos[0]) / dist)
                dy = int(self.speed * (tag[1] - self.pos[1]) / dist)
                # print(f"move from {self.pos} to {tag} dist: {dist} speed: {self.speed} dx: {dx} dy: {dy}")
                self.move(dx, dy)
            else:
                gmap = self.app.game.map
                if not gmap.isUnitTake(tag):
                    dx = int((tag[0] - self.pos[0]) / dist)
                    dy = int((tag[1] - self.pos[1]) / dist)
                    self.move(dx, dy)
                self.roads.pop()
                if len(self.roads) == 0:
                    self.runningCmd = None

    def update(self):
        self.logicFrame += 1
        if self.logicFrame == 3:
            self.logicFrame = 0
            self.updateLogic()
        tick = pygame.time.get_ticks()
        if tick - self.aniElapse >= self.resCfg['frame']:
            if self.frame >= len(self.resCfg["animations"][self.dir - 1]) - 1:
                self.dFrame = -1
            elif self.frame <= 0:
                self.dFrame = 1
            self.frame += self.dFrame
            self.aniElapse = tick
            self._drawFrame()

    def _drawFrame(self):
        n = self.resCfg["animations"][self.dir - 1][self.frame]
        w, h = self.resCfg["width"], self.resCfg["height"]
        x, y = int(n % 12) * w, int(n/12) * h
        self.rect = pygame.Rect(x, y, w, h)
        #self.surface.blit(self.img, (0, 0), (x, y, self.resCfg["width"], self.resCfg["height"]))

    def draw(self, dst):
        self.drawSelect(dst)
        dst.blit(self.img, self.renderPos, self.rect)

    def addCmd(self, cmd):
        self.cmds.append(cmd)
