import pygame
from table_data import TableData

class Cell:
    def __init__(self):
        self.isBlock = False
        self.units = []

class GameMap:
    def __init__(self, app) -> None:
        self.cfg = None
        self.surface = None
        self.app = app
        self.grids = []

    def Init(self, mapId):
        td = TableData()
        cfg = td.getMapCfg(mapId)
        if not cfg:
            return False
        self.cfg = cfg
        width = cfg['width']
        height = cfg['height']
        side = cfg['side']
        blocks = cfg['blocks']
        tiles = cfg['tiles']
        imageFiles = cfg['images']
        self.width = width
        self.height = height
        self.side = side
        images = []
        for fimg in imageFiles:
            img = pygame.image.load("Assets/" + fimg)
            cols = int(img.get_width() / side)
            rows = int(img.get_height() / side)
            #print(f"w: {cols} h:{rows}")
            images.append([img, cols, rows])
        for i in range(width * height):
            self.grids.append(Cell())
        for i, b in enumerate(blocks):
            if b != 0:
                self.grids[i].isBlock = True
        self.surface = pygame.Surface((width * side, height * side), 0, self.app.screen)
        self.surface.fill(pygame.Color(200, 250, 200))
        for i, tile in enumerate(tiles):
            img, cols, rows = images[tile[0] - 1]
            sx, sy = int(tile[1] % cols), int(tile[1] / cols)
            dx, dy = int(i % width), int(i / width)
            self.surface.blit(img, (dx * side, dy * side), (sx * side, sy * side, side, side))
        print(f"game surface size: {self.surface.get_width()}, {self.surface.get_height()}")
        return True

    def getWidth(self):
        return self.cfg['width'] * self.cfg['side']

    def getHeight(self):
        return self.cfg['height'] * self.cfg['side']

    def getInitPos(self):
        return (self.cfg['init1'], self.cfg['init2'])

    def addUnit(self, unit):
        x, y = self.posToGrid(unit.pos)
        self.__addUnit(unit, x, y)

    def __addUnit(self, unit, x, y):
        # print(f"addUnit at [{x},{y}]")
        cell = self.grids[x + y * self.width]
        cell.units.append(unit)

    def removeUnit(self, unit):
        x, y = self.posToGrid(unit.pos)
        self.__removeUnit(unit, x, y)

    def __removeUnit(self, unit, x, y):
        cell = self.grids[x + y * self.width]
        n = cell.units.index(unit)
        if n >= 0:
            cell.units.pop(n)

    def unitMove(self, unit, old):
        x, y = self.posToGrid(old)
        x1, y1 = self.posToGrid(unit.pos)
        # print(f"move from grid [{x},{y}] to [{x1},{y1}]")
        if x != x1 or y != y1:
            self.__removeUnit(unit, x, y)
            self.__addUnit(unit, x1, y1)

    def isBlock(self, pos):
        x, y = self.posToGrid(pos)
        cell = self.grids[x + y * self.width]
        return cell.isBlock
        # if len(cell.units) == 0 or (unit != None and unit in cell.units):
        #     # print(f'uid:{uid} cell units:{cell.units}')
        #     return False
        # else:
        #     return True

    def isUnitTake(self, pos):
        x, y = self.posToGrid(pos)
        cell = self.grids[x + y * self.width]
        if len(cell.units) == 0:
            return True
        else:
            return False

    def draw(self, dst):
        dst.blit(self.surface, (0, 0))

    def posToGrid(self, pos):
        return [int(pos[0] / self.side), int(pos[1] / self.side)]

    def gridToPos(self, grid):
        return [grid[0] * self.side + self.side / 2, grid[1] * self.side + self.side / 2]
