from base_unit import *
import pygame
from public import CMD_MOVE, posDist
from res_mgr import ResMgr

DIR_DOWN = 1
DIR_LEFT = 2
DIR_RIGHT = 3
DIR_UP = 4
DIR_LD = 5
DIR_LR = 6
DIR_RU = 7
DIR_LU = 8

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
        self.waitUnit = None
        self.isSkip = False
        self.angle = -90

    def Init(self, cfg, pos):
        self.hp = cfg['hp']
        self.atk = cfg['atk']
        self.defend = cfg['def']
        self.speed = cfg['speed']
        self.radius = cfg['radius']
        self.pos = pos

        rm = ResMgr()
        self.resCfg = rm.getUnitResCfg(cfg['config_id'])
        self.img = rm.getUintImage(self.resCfg['image'])
        # self.surface = pygame.Surface((self.resCfg["width"], self.resCfg["height"]), 0, self.app.screen).convert_alpha()
        self.renderPos = [self.pos[0]-self.resCfg["anchor"][0], self.pos[1]-self.resCfg["anchor"][1]]
        self.initSelect()

        self._drawFrame()
        self.aniElapse = pygame.time.get_ticks()

    def updateLogic(self):
        self.checkCmd()
        self.doMove()

    def checkCmd(self):
        if not self.runningCmd and len(self.cmds) > 0:
            self.runningCmd = self.cmds.pop(0)
            if self.runningCmd['cmd'] == CMD_MOVE:
                self.roads = []
                self.moveTo(self.runningCmd['tpos'], self.runningCmd['pos'])

    def isMoving(self):
        return self.runningCmd != None and self.runningCmd['cmd'] == CMD_MOVE

    def moveTo(self, tpos, pos):
        self.isSkip = False
        self.isFinish = False
        self.roads = self.app.game.map.getPath(self.pos, tpos, tpos)

    def doMove(self):
        if len(self.roads) > 0:
            tag = self.roads[0]
            gmap = self.app.game.map
            if len(self.roads) == 1:
                tagUnit = gmap.getTakingUnit(tag)
                # 终点被占据，并且距离终点足够近，则直接结束移动
                if tagUnit and not tagUnit.isMoving() and posDist(self.pos, tagUnit.pos) <= self.radius + tagUnit.radius + 5:
                    self.roads.pop(0)
                    self.runningCmd = None
                    logging.debug("last grid is taked, stop.")
                    return

            dist = posDist(tag, self.pos)
            if dist > self.speed:
                dx = int(self.speed * (tag[0] - self.pos[0]) / dist)
                dy = int(self.speed * (tag[1] - self.pos[1]) / dist)
                # print(f"move from {self.pos} to {tag} dist: {dist} speed: {self.speed} dx: {dx} dy: {dy}")
                self.move(dx, dy)
                if self.isSkip and len(self.roads) > 1:
                    self.isSkip = False
                    self.roads.pop(0)
            else:
                if not gmap.isUnitTake(tag):
                    dx = int((tag[0] - self.pos[0]) / dist)
                    dy = int((tag[1] - self.pos[1]) / dist)
                    self.move(dx, dy)
                self.roads.pop(0)
                if len(self.roads) == 0:
                    self.runningCmd = None

    def move(self, dx, dy):
        gmap = self.app.game.map
        nextPos = [self.pos[0] + dx, self.pos[1] + dy]

        unit = gmap.getTakingUnit(nextPos)
        if unit and unit != self:
            dist = posDist(nextPos, unit.pos)
            if dist < self.radius + unit.radius:
                if unit.isMoving() and (not unit.waitUnit or unit.waitUnit != self):
                    # print(f"wait front moving. nextPos={nextPos} unitPos={unit.pos} dist={dist} radius={self.radius}")
                    self.waitUnit = unit
                    return
                else:
                    times = 1
                    while times > 0:
                        times -= 1
                        # 垂直该单位的方向向右
                        vec = pygame.Vector2(unit.pos[0] - self.pos[0], unit.pos[1] - self.pos[1])
                        v = vec.rotate(self.angle).normalize()
                        dx, dy = v.x * self.speed, v.y * self.speed
                        nextPos = [self.pos[0] + dx, self.pos[1] + dy]
                        if gmap.isBlock(nextPos):
                            self.angle = -self.angle
                            continue
                        unit = gmap.getTakingUnit(nextPos)
                        if unit and unit != self:
                            if times <= 0:
                                return False
                            self.angle = -self.angle
                            continue
                        self.isSkip = True
                        break
        self.waitUnit = None
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

        if gmap.isBlock(nextPos):
            # print("unit is blocked")
            return False

        unit = gmap.getTakingUnit(nextPos)
        if unit and unit != self:
            return False

        old = [self.pos[0], self.pos[1]]
        
        self.pos[0] += dx
        self.pos[1] += dy
        self.renderPos = [self.pos[0]-self.resCfg["anchor"][0], self.pos[1]-self.resCfg["anchor"][1]]
        gmap.unitMove(self, old)
        return True

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
        self.runningCmd = None
        self.cmds.append(cmd)
