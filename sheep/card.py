import pygame

CARD_KEY_COLOR = pygame.Color(0, 1, 10)

class Card:
    def __init__(self, cno, pos) -> None:
        self.cardNo = cno
        self.pos = pos
        self.surf = None
        self.dst = None

    def Create(self, screen, dst):
        self.surf = pygame.Surface([48, 58], 0, screen)
        self.surf.set_colorkey(CARD_KEY_COLOR)
        self.dst = dst
        self.surf.fill(CARD_KEY_COLOR)
        color = ((11 * self.cardNo) % 256, (22 * self.cardNo) % 256, (33 * self.cardNo) % 256)
        pygame.draw.rect(self.surf, color, (0, 0, 50, 60), 0, 6)
        font = pygame.font.SysFont("Consolas", 16)
        txColor = (255-color[0], 255-color[1], 255-color[2])
        text = font.render("%d" % self.cardNo, True, txColor)
        self.surf.blit(text, (20, 25))

    def draw(self):
        self.dst.blit(self.surf, self.pos)