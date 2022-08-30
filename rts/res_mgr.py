from public import *
import json
import pygame

@Singleton
class ResMgr:
    def __init__(self) -> None:
        self.unit_res = {}
        self.unit_imgs = {}
        self.building_res = {}
        self.building_imgs = {}

    def getUnitResCfg(self, configId):
        res = self.unit_res.get(configId)
        if not res:
            res = json.load(open(f'json/roles/{configId}.json', 'r'))
            self.unit_res[configId] = res
        return res

    def getBuildingResCfg(self, configId):
        res = self.building_res.get(configId)
        if not res:
            res = json.load(open(f'json/buildings/{configId}.json', 'r'))
            self.building_res[configId] = res
        return res

    def getUintImage(self, imgName):
        img = self.unit_imgs.get(imgName)
        if not img:
            img = pygame.image.load("Assets/Characters/" + imgName).convert_alpha()
        return img

    def getBuildingImage(self, imgName):
        img = self.building_imgs.get(imgName)
        if not img:
            img = pygame.image.load("Assets/" + imgName).convert_alpha()
        return img
        