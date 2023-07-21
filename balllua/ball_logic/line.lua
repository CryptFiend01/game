local Basic = require "ball_logic.basic"

local Line = {}
Line.__index = Line
Line.through = false

local function mix_id(id1, id2)
    return id1 * 1000 + id2
end

local function un_mix_id(id)
    return math.floor(id / 1000), id % 1000
end

function Line:new(l)
    local self = {
        x1 = l.x1,
        y1 = l.y1,
        x2 = l.x2,
        y2 = l.y2,
        solid = l.solid,
        mid = l.mid or 0,
        hide = l.hide or 0,
        hide_lines = {}
    }
    self.normal = Basic.normalize(Basic.normal_vector(Basic.vector(self)))
    setmetatable(self, Line)
    return self
end

function Line:is_hit_hide(point)
    if #self.hide_lines == 0 then
        return
    end
    for _, l in ipairs(self.hide_lines) do
        if Basic.point_in_line(point, l) then
            return true
        end
    end
    return false
end

function Line:add_hide_line(line)
    table.insert(self.hide_lines, line)
end

function Line:hide_each_other(line)
    local l1 = self
    local l2 = line
    if (l1.x1 == l2.x1 and l1.y1 == l2.y1 and l1.x2 == l2.x2 and l1.y2 == l2.y2) or 
       (l1.x1 == l2.x2 and l1.y1 == l2.y2 and l1.x2 == l2.x1 and l1.y2 == l2.y1) then
        l1.hide = l2.mid
        l2.hide = l1.mid
    else
        local p11 = {x = l1.x1, y = l1.y1}
        local p12 = {x = l1.x2, y = l1.y2}
        local p21 = {x = l2.x1, y = l2.y1}
        local p22 = {x = l2.x2, y = l2.y2}
        if Basic.point_in_line(p11, l2) and Basic.point_in_line(p12, l2) then
            l1.hide = l2.mid
            l2:add_hide_line(l1)
        elseif Basic.point_in_line(p21, l1) and Basic.point_in_line(p22, l1) then
            l2.hide = l1.mid
            l1:add_hide_line(l2)
        elseif Basic.point_in_line(p11, l2) then
            if Basic.point_in_line(p21, l1) and not Basic.vequal(p11, p21) then
                local l = Line:new({x1 = p11.x, y1 = p11.y, x2 = p21.x, y2 = p21.y, hide = mix_id(l1.mid, l2.mid)})
                l1:add_hide_line(l)
                l2:add_hide_line(l)
            elseif Basic.point_in_line(p22, l1) and not Basic.vequal(p11, p22) then
                local l = Line:new({x1 = p11.x, y1 = p11.y, x2 = p22.x, y2 = p22.y, hide = mix_id(l1.mid, l2.mid)})
                l1:add_hide_line(l)
                l2:add_hide_line(l)
            end
        elseif Basic.point_in_line(p12, l2) then
            if Basic.point_in_line(p21, l1) and not Basic.vequal(p12, p21) then
                local l = Line:new({x1 = p12.x, y1 = p12.y, x2 = p21.x, y2 = p21.y, hide = mix_id(l1.mid, l2.mid)})
                l1:add_hide_line(l)
                l2:add_hide_line(l)
            elseif Basic.point_in_line(p22, l1) and not Basic.vequal(p12, p22) then
                local l = Line:new({x1 = p12.x, y1 = p12.y, x2 = p22.x, y2 = p22.y, hide = mix_id(l1.mid, l2.mid)})
                l1:add_hide_line(l)
                l2:add_hide_line(l)
            end
        end
    end
end

function Line:move(yoffset)
    self.y1 = self.y1 + yoffset
    self.y2 = self.y2 + yoffset
    self.hide = 0
    self.hide_lines = {}
end

function Line:get_reflect(dir)
    -- 虚线或者穿透球不是打在边框上，不改变方向
    if not self.solid or (Line.through and self.mid > 0) then
        return dir
    end

    local rft = Basic.reflect_vector(dir, self.normal)
    local rft_normal = Basic.normalize(rft)
    if rft_normal.x == 0 or rft_normal.y == 0 then
        local angle = math.pi / 36
        local rotate = {
            x = rft_normal.x * math.cos(angle) - rft_normal.y * math.sin(angle),
            y = rft_normal.x * math.sin(angle) + rft_normal.y * math.cos(angle)
        }
        rft_normal = rotate
    end
    return rft_normal
end

function Line:un_hide(mid)
    if self.hide == mid then
        self.hide = 0
    end

    local temp = {}
    for _, l in ipairs(self.hide_lines) do
        local id1, id2 = un_mix_id(l.mid)
        if id1 ~= mid and id2 ~= mid then
            table.insert(temp, l)
        end
    end
    self.hide_lines = temp
end

function Line:is_hiden()
    return self.hide > 0 or #self.hide_lines > 0
end

function Line.make_lines(cid, point, obj, solid)
    local lt = {
        x = point.x - obj.anchor.x,
        y = point.y - obj.anchor.y
    }
    local lines = {}
    for i = #obj.points, 1, -1 do
        local j = i - 1
        if j < 1 then
            j = #obj.points
        end
        local start = obj.points[i]
        local ed = obj.points[j]
        local line = Line:new({
            x1 = start.x + lt.x,
            y1 = start.y + lt.y,
            x2 = ed.x + lt.x,
            y2 = ed.y + lt.y,
            mid = cid,
            solid = solid
        });
        table.insert(lines, line)
    end
    return lines
end

return Line
