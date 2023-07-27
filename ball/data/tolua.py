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
        #print(k)
        rep = k.replace('"', '')
        context = context.replace(k, rep)

    f = open(tagPath + fname + '.lua', 'w')
    f.write("return " + context)
    f.close()

tagPath = 'D:/Work/Src/mygit/game/balllua/ball_logic/data/'

files = os.listdir("./")
for f in files:
    if len(f) > 5 and f[-4:] == 'json':
        jsonToLua(tagPath, f[:-5])
