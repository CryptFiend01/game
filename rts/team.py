from public import CMD_MOVE


class Team:
    def __init__(self, teamId) -> None:
        self.teamId = teamId
        self.units = []
        self.buildings = []
        self.isSelected = False

    def makeTeam(self, units):
        self.units = units

    def addToTeam(self, unit):
        if self.isSelected:
            unit.setSelected(True)
        self.units.append(unit)

    def removeFromTeam(self, unit):
        i = self.units.index(unit)
        if i >= 0:
            self.units.pop(i)
        if self.isSelected:
            unit.setSelected(False)

    def setSelect(self, selected):
        for unit in self.units:
            unit.setSelected(selected)
        self.isSelected = selected

    def clear(self):
        if self.isSelected:
            for unit in self.units:
                unit.setSelected(False)
        self.units = []
        self.buildings = []

    def isEmpty(self):
        return len(self.units) == 0

    def addCommands(self, cmd):
        if cmd["cmd"] == CMD_MOVE:
            pos = cmd["pos"]
            l, t, r, b = -1, -1, -1, -1
            for unit in self.units:
                p = unit.pos
                if l == -1 or l > p[0]:
                    l = p[0]
                if r == -1 or r < p[0]:
                    r = p[0]
                if t == -1 or t > p[1]:
                    t = p[1]
                if b == -1 or t < p[1]:
                    b = p[1]
            center = [int(l + (r - l)/2), int(t + (b - t)/2)]
            for unit in self.units:
                # p = unit.pos
                # d = [p[0] - center[0], p[1] - center[1]]
                unit.addCmd({"cmd":CMD_MOVE, "pos":pos})
