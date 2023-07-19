local Basic = require "ball_logic.basic"
local Logic = require "ball_logic.logic"

local Line = {}
Line.__index = Line

local function mixId(id1, id2)
    return id1 * 1000 + id2
end

local function unMixId(id)
    return math.floor(id / 1000), id % 1000
end

function Line:new(l)
    local self = {
        x1 = l.x1,
        y1 = l.y1,
        x2 = l.x2,
        y2 = l.y2,
        solid = l.solid,
        mid = l.mid,
        hide = l.hide or 0,
        hide_lines = {}
    }
    self.normal = Basic.normalize(Basic.normal_vector(Basic.vector(self)))
    setmetatable(self, Line)
end

function Line:is_hit_hide(point)
    
end

function Line:add_hide_line(line)
    table.insert(self.hide_lines, line)
end

function Line:get_reflect(dir)
    
end

return Line
