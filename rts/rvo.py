from math import sqrt
from rmath import *

RVO_EPSILON = 0.00001

class Agent:
    def __init__(self) -> None:
        self.pos = [0, 0]
        self.velocity = [0, 0]
        self.newVelocity = [0, 0]
        self.radius = 0
        self.neighbors = []
        self.timeHorizon = 1
        self.orcaLines = []

    def computeVelocity(self, timeStep):
        t = 1 / self.timeHorizon
        for other in self.neighbors:
            rePos = VSub(other.pos, self.pos)
            reVel = VSub(self.velocity - other.velocity)
            posSq = VSqure(rePos)
            reRadius = self.radius + other.radius
            radiusSq = reRadius ** 2

            line = {"dir":[0, 0], "pos":[0, 0]}
            u = [0, 0]

            if posSq > radiusSq:
                w = VSub(reVel, VMul(rePos, t))
                wSq = VSqure(w)
                p = VDot(w, reVel)

                if p < 0.0 and p ** 2 > radiusSq * wSq:
                    wLen = sqrt(wSq)
                    unitw = VDiv(w, wLen)
                    line["dir"] = [unitw[1], -unitw[0]]
                    u = VMul(unitw, reRadius * t - wLen)
                else:
                    leg = sqrt(posSq - radiusSq)
                    if VDet(rePos, w) > 0:
                        line["dir"] = [rePos[0] * leg - rePos[1] * reRadius, rePos[0] * reRadius + rePos[1] * leg]
                    else:
                        line["dir"] = [rePos[0] * leg + rePos[1] * reRadius, -rePos[0] * reRadius + rePos[1] * leg]
                    p2 = VDot(reVel, line["dir"])
                    u = VSub(VMul(line["dir"], p2), reVel)
            else:
                w = VSub(reVel, VDiv(rePos, timeStep))
                wLen = sqrt(VSqure(w))
                unitw = VDiv(w, wLen)
                line["dir"] = [unitw[1], -unitw[0]]
                u = VMul(unitw, reRadius / timeStep - wLen)

            line["pos"] = VAdd(self.velocity, VMul(u, 0.5))
            self.orcaLines.append(line)

            if not self.checkLine2():
                self.checkLine3()
        
    def checkLine1(self, lines, i, radius, velocity, direction):
        lpos = lines[i]['pos']
        ldir = lines[i]['dir']
        p = VDot(lpos, ldir)
        disc = p * p + radius * radius - VDot(lpos)
        if disc < 0:
            return (False, None)
        
        d = sqrt(disc)
        left = -p - d
        right = -p + d

        for k in range(i):
            dentor = VDet(ldir, lines[k]['dir'])
            numtor = VDet(lines[k]['dir'], lpos - lines[k]['pos'])

            if abs(dentor) <= RVO_EPSILON:
                if numtor < 0:
                    return (False, None)
                else:
                    continue

            t = numtor / dentor

            if dentor > 0:
                right = min(right, t)
            else:
                left = max(left, t)
            
            if left > right:
                return (False, None)

        result = [0, 0]
        if direction:
            if velocity * ldir > 0:
                result = VAdd(lpos, VMul(ldir, right))
            else:
                result = VAdd(lpos, VMul(ldir, left))
        else:
            t = VDot(ldir, VSub(velocity, lpos))
            if t < left:
                result = VAdd(lpos, VMul(ldir, left))
            elif t > right:
                result = VAdd(lpos, VMul(ldir, right))
            else:
                result = VAdd(lpos, VMul(ldir, t))
        return (True, result)

    def checkLine2(self, lines, radius, velocity, direction):
        if direction:
            result = VMul(velocity, radius)
        elif VDot(velocity) > radius ** 2:
            result = VMul(Normalize(velocity), radius)
        else:
            result = velocity

        for i, l in enumerate(lines):
            if VDet(l['dir'], VSub(l['pos'] - result)) > 0:
                temp = result
                ok, result = self.checkLine1(lines, i, radius, velocity, direction)
                if not ok:
                    result = temp
                    return (i, result)

        return (len(lines), result)

    def checkLine3(self, lines, numObstLines, beginLine, radius):
        result = [self.newVelocity[0], self.newVelocity[1]]
        distance = 0
        for i in range(beginLine, len(lines)):
            if VDet(lines[i]['dir'], VSub(lines[i]['pos'], result)) > distance:
                pass
        pass

    def update(self):
        VAssign(self.velocity, self.newVelocity)
        VAddEq(self.pos, self.velocity)

class RVOMgr:
    def __init__(self) -> None:
        self.agents = []

    def run(self):
        for agent in self.agents:
            agent.computeVelocity()
        
        for agent in self.agents:
            agent.update()
