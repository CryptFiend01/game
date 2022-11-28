import pygame
import sys
from public import *
from game import Game
from res_mgr import ResMgr
from table_data import TableData

class GameApp:
    def __init__(self) -> None:
        self.width = 800
        self.height = 600
        self.screen = None
        self.game = None

    def Init(self):
        pygame.init()
        self.screen = pygame.display.set_mode((self.width, self.height), 0, 32)
        pygame.display.set_caption("CrazyRuk")
        self.font = pygame.font.SysFont("Arial", 10)
        self.cmdFont = pygame.font.SysFont("Consolas", 16)
        self.boardTxts = [] # text, [x, y], color

        td = TableData()
        if not td.Init():
            return False

        self.game = Game(self)
        self.game.Init()
        return True

    def addBoard(self, text, pos, color):
        self.boardTxts.append({"text":text, "pos":pos, "color":color})

    def clearAndAddBoard(self, text, pos, color):
        self.boardTxts.clear()
        self.addBoard(text, pos, color)

    def onMouseDown(self, mpos):
        self.clearAndAddBoard(f'mouse down: {mpos}', [3, 3], pygame.Color(200, 230, 200))
        self.game.onMouseDown(mpos)

    def onMouseMove(self, mpos):
        self.clearAndAddBoard(f'mouse move: {mpos}', [3, 3], pygame.Color(200, 230, 200))
        self.game.onMouseMove(mpos)

    def onMouseUp(self, mpos):
        self.clearAndAddBoard(f'mouse up: {mpos}', [3, 3], pygame.Color(200, 230, 200))
        self.game.onMouseUp(mpos)

    def onRMouseClick(self, mpos):
        self.clearAndAddBoard(f"right mouse click: {mpos}", [3, 3], pygame.Color(200, 230, 200))
        self.game.onRMouseClick(mpos)

    def run(self):
        fpsClock = pygame.time.Clock()
        while True:
            for evt in pygame.event.get():
                if evt.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                elif evt.type == pygame.MOUSEBUTTONDOWN:
                    if evt.button == pygame.BUTTON_LEFT:
                        self.onMouseDown(evt.pos)
                elif evt.type == pygame.MOUSEMOTION:
                    self.onMouseMove(evt.pos)
                elif evt.type == pygame.MOUSEBUTTONUP:
                    if evt.button == pygame.BUTTON_LEFT:
                        self.onMouseUp(evt.pos)
                    elif evt.button == pygame.BUTTON_RIGHT:
                        self.onRMouseClick(evt.pos)
                elif evt.type == pygame.KEYUP and evt.key == pygame.K_SPACE:
                    self.game.clearFlows()
                
            self._runGame()
            self._draw()
            pygame.display.update()
            fpsClock.tick(60)

    def _runGame(self):
        self.game.update()

    def _draw(self):
        self.screen.fill(pygame.Color(0, 0, 0))
        self.game.draw()
        
        for board in self.boardTxts:
            text = self.cmdFont.render(board["text"], True, board["color"])
            self.screen.blit(text, board["pos"])
        