def VAssign(v1, v2):
    v1[0], v1[1] = v2[0], v2[1]

def VSub(v1, v2):
    return [v1[0] - v2[0], v1[1] - v2[1]]

def VAdd(v1, v2):
    return [v1[0] + v2[0], v1[1] + v2[1]]

def VMul(v1, n):
    return [v1[0] * n, v1[1] * n]

def VDot(v1, v2):
    return v1[0] * v2[0] + v1[1] * v2[1]

def VDiv(v1, n):
    return [v1[0] / n, v1[1] / n]

def VSubEq(v1, v2):
    v1[0] -= v2[0]
    v1[1] -= v2[1]

def VAddEq(v1, v2):
    v1[0] += v2[0]
    v1[1] += v2[1]

def VMulEq(v1, n):
    v1[0] *= n
    v1[1] *= n

def VSqure(v):
    return v[0] * v[0] + v[1] * v[1]

def VDet(v1, v2):
    return v1[0] * v2[1] - v1[1] * v2[0]

def Normalize(v):
    x, y = v[0], v[1]
    x1 = 0 if x == 0 else x / abs(x)
    y1 = 0 if y == 0 else y / abs(y)
    return [x1, y1]