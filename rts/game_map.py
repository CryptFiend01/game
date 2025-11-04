import pygame
from table_data import TableData
from public import *

class Cell:
    def __init__(self, p):
        self.pos = p
        self.isBlock = False
        self.units = []
        self.toStart = 0
        self.eval = 0
        self.parent = None
        self.layer = 0

class GameMap:
    def __init__(self, app) -> None:
        self.cfg = None
        self.surface = None
        self.app = app
        self.grids = []
        self.nears = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 0]]
        self.arrounds = [[0, -1], [-1, 0], [1, 0], [0, 1]]
        self.flowVec = {}
        self.roadLayer = 1  # 每次寻路+1，不用清空所有cell
        self.flowSurf = None

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
            self.grids.append(Cell([int(i % self.width), int(i/self.width)]))
        for i, b in enumerate(blocks):
            if b != 0:
                self.grids[i].isBlock = True
        self.flowSurf = pygame.Surface((width * side, height * side), 0, self.app.screen)
        self.flowSurf.set_colorkey(COLOR_KEY)
        self.flowSurf.fill(COLOR_KEY)
        self.flowSurf.set_alpha(150)
        self.surface = pygame.Surface((width * side, height * side), 0, self.app.screen)
        self.surface.fill(pygame.Color(200, 250, 200))
        for i, tile in enumerate(tiles):
            img, cols, rows = images[tile[0] - 1]
            sx, sy = int(tile[1] % cols), int(tile[1] / cols)
            dx, dy = int(i % width), int(i / width)
            self.surface.blit(img, (dx * side, dy * side), (sx * side, sy * side, side, side))
        logging.debug(f"game surface size: {self.surface.get_width()}, {self.surface.get_height()}")
        return True

    def getWidth(self):
        return self.cfg['width'] * self.cfg['side']

    def getHeight(self):
        return self.cfg['height'] * self.cfg['side']

    def getInitPos(self):
        return (self.cfg['init1'], self.cfg['init2'])

    def getSide(self):
        return self.cfg["side"]

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

    def getNearUnits(self, pos):
        x, y = self.posToGrid(pos)
        units = []
        for p in self.nears:
            x1, y1 = x + p[0], y + p[1]
            if x1 < 0 or x1 >= self.width or y1 < 0 or y1 >= self.height:
                continue
            cell = self.grids[x1 + y1 * self.width]
            units.extend(cell.units)
        return units

    def getTakingUnit(self, pos):
        x, y = self.posToGrid(pos)
        cell = self.grids[x + y * self.width]
        if len(cell.units) == 0:
            return None
        else:
            return cell.units[0]

    def redrawFlow(self, flows):
        self.flowSurf.fill(COLOR_KEY)
        if flows != None:
            for i in range(self.width):
                pygame.draw.line(self.flowSurf, pygame.Color(50, 80, 220), (i * self.side, 0), (i * self.side, self.height * self.side))
            for i in range(self.height):
                pygame.draw.line(self.flowSurf, pygame.Color(50, 80, 220), (0, i * self.side), (self.width * self.side, i * self.side))
            for i, d in enumerate(flows):
                if self.grids[i].isBlock:
                    continue
                x, y = int(i % self.width), int(i / self.width)
                mx, my = x * self.side + self.side / 2, y * self.side + self.side / 2
                pygame.draw.circle(self.flowSurf, pygame.Color(230, 60, 80), (mx, my), 2)
                tx, ty = mx + self.nears[d-1][0] * 6, my + self.nears[d-1][1] * 6
                pygame.draw.line(self.flowSurf, pygame.Color(0, 0, 0), (mx, my), (tx, ty))

    def draw(self, dst: pygame.Surface):
        dst.blit(self.surface, (0, 0))
        #dst.blit(self.flowSurf, (0, 0))

    def posToGrid(self, pos):
        return [int(pos[0] / self.side), int(pos[1] / self.side)]

    def gridToPos(self, grid):
        return [grid[0] * self.side + self.side / 2, grid[1] * self.side + self.side / 2]

    def getGrid(self, pos):
        if pos[0] < 0 or pos[0] >= self.width or pos[1] < 0 or pos[1] >= self.height:
            return None
        i = pos[0] + pos[1] * self.width
        return self.grids[i]

    def _createFlowField(self, end):
        key = end[0] + end[1] * self.width
        flows = self.flowVec.get(key)
        if flows:
            return flows
        self.roadLayer += 1
        target = self.getGrid(end)
        open_list = []
        target.eval = 0
        target.layer = self.roadLayer
        open_list.append(target)
        while len(open_list) > 0:
            cell = open_list.pop(0)
            for p in self.arrounds:
                np = [cell.pos[0] + p[0], cell.pos[1] + p[1]]
                ncell = self.getGrid(np)
                if ncell and not ncell.isBlock:
                    if ncell.layer < self.roadLayer:
                        ncell.eval = cell.eval + 1
                        ncell.layer = self.roadLayer
                        open_list.append(ncell)
                    elif ncell.eval > cell.eval + 1:
                        ncell.eval = cell.eval + 1

        flows = [0] * (self.width * self.height)
        for i, cell in enumerate(self.grids):
            if cell.isBlock:
                continue
            if cell.layer != self.roadLayer:
                logging.warning(f"cell{cell.pos} not in new layer")
                continue
            minval = -1
            for k, p in enumerate(self.nears):
                # 斜向移动时，如果跨过一个障碍点，则不能通行
                if p[0] != 0 and p[1] != 0:
                    c1 = self.getGrid([cell.pos[0] + p[0], cell.pos[1]])
                    c2 = self.getGrid([cell.pos[0], cell.pos[1] + p[1]])
                    if not c1 or c1.isBlock or not c2 or c2.isBlock:
                        continue
                c = self.getGrid([cell.pos[0] + p[0], cell.pos[1] + p[1]])
                if c and not c.isBlock and (minval < 0 or c.eval < minval):
                    minval = c.eval
                    flows[i] = k + 1
        self.flowVec[key] = flows
        return flows

    def getPath(self, start, end, rend):
        ex, ey = self.posToGrid(end)
        ep = ex + ey * self.width
        if ex < 0 or ex >= self.width or ey < 0 or ey >= self.width or self.grids[ep].isBlock:
            return []
            
        flows = self.flowVec.get(ep)
        if not flows:
            flows = self._createFlowField([ex, ey])
        self.redrawFlow(flows)

        rex, rey = self.posToGrid(rend)
        sx, sy = self.posToGrid(start)
        p = sx + sy * self.width
        roadTemp = []
        dirList = []
        mindist = -1
        minidx = -1

        while p != ep:
            direct = flows[p]
            sx, sy = sx + self.nears[direct-1][0], sy + self.nears[direct-1][1]
            roadTemp.append(self.gridToPos([sx, sy]))
            dirList.append(direct)
            if rex != ex or rey != ey:
                dist = posDist([sx, sy], [rex, rey])
                if dist == 0:
                    return roadTemp
                elif dist < 2:
                    roadTemp.append(rend)
                    return roadTemp
                if mindist < 0 or dist < mindist:
                    mindist = dist
                    minidx = len(roadTemp)
            p = sx + sy * self.width

        if sx != rex or sy != rey:
            while len(roadTemp) > minidx:
                dirList.pop()
                roadTemp.pop()
            roadTemp.append(rend)
        return roadTemp
