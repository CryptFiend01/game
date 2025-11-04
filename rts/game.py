import pygame
from building import Building
from public import CMD_MOVE, COLOR_KEY
from team import Team
from unit import Unit
from camp import Camp
from game_map import GameMap
from table_data import TableData
import logging

class Game:
    def __init__(self, app) -> None:
        self.app = app
        self.map = GameMap(self.app)
        self.surface = None
        self.camps = []
        self.buildings = {}
        self.units = {}
        self.uidGen = 1
        self.windowPos = [0, 0]
        self.horizon = 0
        self.vertical = 0
        self.selSurf = None
        self.isMouseDown = False
        self.mouseStart = [0,0]
        self.screenPos = [0,0]
        self.defaultTeam = Team(0, self.map)

    def Init(self):
        if not self.map.Init(1003):
            return False

        initPoses = self.map.getInitPos()
        campid = 1
        for pos in initPoses:
            camp = Camp(self, campid)
            self.camps.append(camp)
            camp.Init([pos[0] * self.map.getSide(), pos[1] * self.map.getSide()])
            campid += 1

        poses = [[110, 110], [320, 82], [510, 90], [115, 180], [140, 55], [20, 200]]
        for pos in poses[:4]:
            self.addUnit(101, pos, 1)
        for pos in poses[4:]:
            self.addUnit(102, pos, 1)
        
        self.surface = pygame.Surface((self.map.getWidth(), self.map.getHeight()), 0, self.app.screen)
        self.selSurf = pygame.Surface((self.map.getWidth(), self.map.getHeight()), 0, self.app.screen)
        self.selSurf.set_colorkey(COLOR_KEY)
        self.selSurf.fill(COLOR_KEY)
        return True

    def addBuilding(self, configId, pos, campid):
        td = TableData()
        cfg = td.getBuilding(configId)
        building = Building(self.app, self.genUid(), campid)
        building.Init(cfg, pos)

        self.buildings[building.uid] = building
        self.camps[campid - 1].addBuilding(building)
        self.map.addUnit(building)

    def addUnit(self, configId, pos, campid):
        td = TableData()
        cfg = td.getUnit(configId)
        unit = Unit(self.app, self.genUid(), campid)
        unit.Init(cfg, pos)

        self.units[unit.uid] = unit
        self.camps[campid - 1].addUnit(unit)
        self.map.addUnit(unit)

    def update(self):
        if self.horizon != 0 or self.vertical != 0:
            self.moveWindow(self.horizon*5, self.vertical*5)

        for _, unit in self.units.items():
            unit.update()

        for _, building in self.buildings.items():
            building.update()
            trainUnits = building.getTrainFinishUnits()
            if len(trainUnits) > 0:
                for cfg in trainUnits:
                    self.addUnit(cfg['config_id'], building.getUnitPos(), building.campid)
                building.clearTrainFinishUnits()

    def draw(self):
        self.surface.fill(COLOR_KEY)
        self.map.draw(self.surface)
        for _, building in self.buildings.items():
            building.draw(self.surface)

        for _, unit in self.units.items():
            unit.draw(self.surface)

        self.app.screen.blit(self.surface, (0, 0), (self.windowPos[0], self.windowPos[1], self.app.width, self.app.height))
        if self.isMouseDown:
            self.selSurf.fill(COLOR_KEY)
            mappos = self.toMapPos(self.screenPos)
            w, h = abs(mappos[0] - self.mouseStart[0]), abs(mappos[1] - self.mouseStart[1])
            x, y = min(mappos[0], self.mouseStart[0]), min(mappos[1], self.mouseStart[1])
            pygame.draw.rect(self.selSurf, pygame.Color(35,217,110), pygame.Rect(x, y, w, h), 1)
            self.app.screen.blit(self.selSurf, (0, 0), (self.windowPos[0], self.windowPos[1], self.app.width, self.app.height))

    def clearFlows(self):
        logging.debug("clear flows.")
        self.map.redrawFlow(None)

    def genUid(self):
        uid = self.uidGen
        self.uidGen += 1
        return uid

    def setHorizon(self, hor):
        self.horizon = hor

    def setVertical(self, vert):
        self.vertical = vert

    def toMapPos(self, pos):
        return [pos[0] + self.windowPos[0], pos[1] + self.windowPos[1]]

    def moveWindow(self, dx, dy):
        self.windowPos[0] += dx
        self.windowPos[1] += dy
        if self.windowPos[0] < 0:
            self.windowPos[0] = 0
        elif self.windowPos[0] > self.map.getWidth() - self.app.width:
            self.windowPos[0] = self.map.getWidth() - self.app.width
        
        if self.windowPos[1] < 0:
            self.windowPos[1] = 0
        elif self.windowPos[1] > self.map.getHeight() - self.app.height:
            self.windowPos[1] = self.map.getHeight() - self.app.height

    def onMouseDown(self, mpos):
        self.mouseStart = self.toMapPos(mpos)
        self.screenPos[0], self.screenPos[1] = mpos[0], mpos[1]
        self.isMouseDown = True

    def onMouseMove(self, mpos):
        if mpos[0] < 16:
            self.setHorizon(-1)
        elif mpos[0] > self.app.width - 16:
            self.setHorizon(1)
        else:
            self.setHorizon(0)

        if mpos[1] < 16:
            self.setVertical(-1)
        elif mpos[1] > self.app.height - 16:
            self.setVertical(1)
        else:
            self.setVertical(0)

        if self.isMouseDown:
            self.screenPos[0], self.screenPos[1] = mpos[0], mpos[1]

    def onMouseUp(self, mpos):
        self.isMouseDown = False

        mappos = self.toMapPos(self.screenPos)
        w, h = abs(mappos[0] - self.mouseStart[0]), abs(mappos[1] - self.mouseStart[1])
        x, y = min(mappos[0], self.mouseStart[0]), min(mappos[1], self.mouseStart[1])

        self.defaultTeam.clear()
        self.defaultTeam.setSelect(True)
        #self.selectUnits = []
        if w > 1 and h > 1:
            rect = pygame.Rect(x, y, w, h)
            for _, unit in self.units.items():
                if unit.isInRect(rect):
                    self.defaultTeam.addToTeam(unit)
        else:
            for _, unit in self.units.items():
                if unit.isHitPos((x, y)):
                    self.defaultTeam.addToTeam(unit)
                    break
            if self.defaultTeam.isEmpty():
                for _, building in self.buildings.items():
                    if building.isHitPos((x, y)):
                        self.defaultTeam.addBuilding(building)
                        break

    def onRMouseClick(self, mpos):
        if self.defaultTeam.isEmpty():
            return
        
        mappos = self.toMapPos(mpos)
        self.defaultTeam.addCommands({"cmd":CMD_MOVE, "pos":mappos})
