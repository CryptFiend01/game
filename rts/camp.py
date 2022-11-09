from building import Building


class Camp:
    def __init__(self, game, campid) -> None:
        self.buildings = {}
        self.units = {}
        self.golds = 0
        self.game = game
        self.campid = campid

    def Init(self, pos):
        self.golds = 1000
        if len(pos) > 0:
            self.game.addBuilding(301, pos, self.campid)

    def isLose(self):
        return len(self.buildings) == 0

    def addBuilding(self, building):
        self.buildings[building.uid] = building

    def addUnit(self, unit):
        self.units[unit.uid] = unit

    def addGold(self, gold):
        self.golds += gold

    def useGold(self, gold):
        self.golds -= gold

    