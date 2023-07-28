import os
import re

def jsonToLua(tagPath, fname):
    f = open(fname + '.json', 'r')
    context = f.read()
    f.close()
    context = context.replace(":", " =")
    context = context.replace("[", "{")
    context = context.replace("]", "}")
    all = set(re.findall('"\w+" =', context))
    for k in all:
        rep = k.replace('"', '')
        context = context.replace(k, rep)

    if fname == 'monster' or fname == 'role':
        all = set(re.findall('{id = \d+,', context))
        for k in all:
            digit = k[k.find('=') + 1:-1]
            val = int(digit)
            rep = f'[{val}] = ' + k
            context = context.replace(k, rep)

    f = open(tagPath + fname + '.lua', 'w')
    f.write("return " + context)
    f.close()

tagPath = '../../balllua/ball_logic/data/'

files = os.listdir("./")
for f in files:
    if len(f) > 5 and f[-4:] == 'json':
        jsonToLua(tagPath, f[:-5])
