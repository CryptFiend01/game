import json
from res_mgr import ResMgr
from public import Singleton

class UIElement:
    def __init__(self, cfg, pos):
        self.pos = [pos[0], pos[1]]
        self.children = []
        self.name = ''
        self.img = None
        self.onload(cfg)

    def onload(self):
        if self.cfg.get('background'):
            self.img = ResMgr().getUIImage(self.cfg['background'])
        if self.cfg.get('children'):
            for child in self.cfg['children']:
                if child['type'] == 'panel':
                    child = UIElement(child['cfg'], child['pos'])
                elif child['type'] == 'button':
                    child = Button(child['cfg'], child['pos'])
                self.addChild(child)

    def clone(self):
        new = UIElement(self.cfg, self.pos)
        for child in self.children:
            new.addChild(child.clone())
        return new

    def addChild(self, child):
        self.children.append(child)

    def removeChild(self, child):
        self.children.remove(child)

    def draw(self, surface):
        for child in self.children:
            child.draw(surface)

class Button(UIElement):
    def __init__(self, cfg, pos):
        super().__init__(cfg, pos)
        self.name = cfg['name']

@Singleton
class UIMgr:
    def load(self, name):
        cfg = json.load(open('../json/ui/%s.json' % name, 'r', encoding='utf-8'))
        return UIElement(cfg, [0,0])