from math import fabs
from public import *
import json

@Singleton
class TableData:
    def __init__(self) -> None:
        self.st_building = None
        self.st_unit = None
        self.st_map = None
        

    def Init(self):
        if not self.loadBuilding():
            return False
        if not self.loadUnit():
            return False
        if not self.loadMaps():
            return False
        return True

    def loadMaps(self):
        maps = [1001]
        self.st_map = {}
        for mapid in maps:
            cfg = json.load(open(f'json/maps/{mapid}.json', 'r'))
            self.st_map[mapid] = cfg
        return True

    def loadBuilding(self):
        try:
            data = json.load(open('json/st_building.json', 'r'))
        except:
            return False
        self.st_building = {}
        for d in data:
            self.st_building[d['config_id']] = d
        return True

    def loadUnit(self):
        try:
            data = json.load(open('json/st_unit.json', 'r'))
        except:
            return False
        self.st_unit = {}
        for d in data:
            self.st_unit[d['config_id']] = d
        return True

    def getBuilding(self, configId):
        return self.st_building.get(configId)

    def getUnit(self, configId):
        return self.st_unit.get(configId)

    def getMapCfg(self, configId):
        return self.st_map.get(configId)
