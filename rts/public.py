from cmath import sqrt


CMD_MOVE = 1

def Singleton(cls):
    _instance = {}

    def instance():
        if cls not in _instance:
            _instance[cls] = cls()
        return _instance[cls]
    return instance
    
def posDist(p1, p2):
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    return sqrt(dx * dx + dy * dy).real