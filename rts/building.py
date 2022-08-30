import pygame
from base_unit import BaseUnit
from timer_mgr import TimerMgr
from unit import Unit
from res_mgr import ResMgr

class Building(BaseUnit):
    def __init__(self, app, uid, campid) -> None:
        super().__init__(app, uid, campid)
        self.status = 0
        self.btype = 0
        self.trainings = []
        self.trainFinishes = []
        self.start_time = 0
        self.cfg = None
        self.pos = [0, 0]

    def Init(self, cfg, pos):
        self.cfg = cfg
        self.pos = pos

        self.hp = cfg['hp']
        self.defend = cfg['def']
        self.pos = pos

        rm = ResMgr()
        self.resCfg = rm.getBuildingResCfg(cfg['config_id'])
        self.img = rm.getBuildingImage(self.resCfg['image'])
        self.renderPos = [self.pos[0]-self.resCfg["anchor"][0], self.pos[1]-self.resCfg["anchor"][1]]
        w, h = self.resCfg["width"], self.resCfg["height"]
        x, y = self.resCfg["pos"][0], self.resCfg["pos"][1]
        self.rect = pygame.Rect(x, y, w, h)

        self.initSelect()

    def trainUnit(self, cfg):
        self.trainings.append(cfg)

    def getTrainFinishUnits(self):
        return self.trainFinishes

    def clearTrainFinishUnits(self):
        self.trainFinishes.clear()

    def getUnitPos(self):
        return [self.pos[0] + self.cfg['size'] / 2, self.pos[1] + self.cfg['size'] / 2]

    def update(self):
        while len(self.trainings) > 0:
            if TimerMgr.getTick() - self.start_time > self.trainings[0]['train_time']:
                self.trainFinishes.append(self.trainings[0])
                self.trainings.pop(0)
            else:
                break

    def draw(self, dst):
        self.drawSelect(dst)
        dst.blit(self.img, self.renderPos, self.rect)
