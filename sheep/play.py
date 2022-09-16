import pygame
from sheep import makeGrids
from card import Card

KEY_COLOR = pygame.Color(0, 0, 10)

class Game:
    def __init__(self) -> None:
        self.surfaces = []
        self.screen = None
        self.cards = []
        self.isTop = False
        self.maxWidth = 0
        self.maxHeight = 0

    def Init(self, grids, maxWidth, maxHeight):
        pygame.init()

        self.maxWidth = maxWidth
        self.maxHeight = maxHeight
        self.grids = grids

        self.screen = pygame.display.set_mode((480, 960), 0, 32)
        pygame.display.set_caption("Sheep*3")
        self.screen.fill((195,254,139))

        ssize = [self.maxWidth * 50, self.maxHeight * 60]
        print(f"screen size: {ssize}")

        for layer in grids:
            surf = pygame.Surface(ssize, 0, self.screen)
            surf.set_colorkey(KEY_COLOR)
            surf.fill(KEY_COLOR)
            self.surfaces.append(surf)
            w, h = len(layer[0]), len(layer)
            dx = (self.maxWidth - w) * 25
            dy = (self.maxHeight - h) * 30
            x, y = 0, 0
            for line in layer:
                for n in line:
                    if n > 0:
                        px = x * 50 + dx
                        py = y * 60 + dy
                        card = Card(n, (px, py))
                        card.Create(self.screen, surf)
                        self.cards.append(card)
                    x += 1
                y += 1
                x = 0
                    

    def draw(self):
        for surf in self.surfaces:
            surf.fill(KEY_COLOR)
        for card in self.cards:
            card.draw()
        for surf in self.surfaces:
            self.screen.blit(surf, (50, 200))

    def Run(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    exit()
            self.draw()
            pygame.display.flip()

if __name__ == '__main__':
    game = Game()
    grids, w, h = makeGrids()
    game.Init(grids, w, h)
    game.Run()