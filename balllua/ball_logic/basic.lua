local Const = require "ball_logic.const"
local Fix = require "ball_logic.fixed"

local Basic = {}

function Basic.vector(line)
    return {
        x = line.x2 - line.x1,
        y = line.y2 - line.y1
    }
end

function Basic.normal_vector(v)
    return {x = -v.y, y = v.x}
end

function Basic.magnitude(v)
    return Fix.sqrt(v.x * v.x + v.y * v.y)
end

function Basic.distance(p1, p2)
    local v = {x = p1.x - p2.x, y = p1.y - p2.y}
    return Basic.magnitude(v)
end

function Basic.normalize(v)
    local d = Basic.magnitude(v)
    return {x = v.x / d, y = v.y / d}
end

function Basic.dot(v1, v2)
    return v1.x * v2.x + v1.y * v2.y
end

function Basic.vequal(v1, v2)
    return Fix.abs(v1.x - v2.x) < Const.MIN_NUM and Fix.abs(v1.y - v2.y) < Const.MIN_NUM
end

function Basic.assign_point(src, dst)
    dst.x, dst.y = src.x, src.y
end

function Basic.copy_point(point)
    return {x = point.x, y = point.y}
end

function Basic.point_to_number(point)
    return {x = Fix.tonumber(point.x), y = Fix.tonumber(point.y)}
end

function Basic.copy_rect(rect)
    return {
        left = rect.left,
        top = rect.top,
        right = rect.right,
        bottom = rect.bottom
    }
end

function Basic.rect_inserect(rect1, rect2)
    if rect1.left >= rect2.right or rect2.left >= rect1.right or
        rect1.top >= rect2.bottom or rect2.top >= rect1.bottom then
        return false
    else
        return true
    end
end

function Basic.line_in_rect(line, rect)
    return line.y1 >= rect.top and line.y1 <= rect.bottom and line.y2 >= rect.top and line.y2 <= rect.bottom
end

function Basic.point_in_rect(point, rect)
    return point.x >= rect.left and point.x <= rect.right and point.y >= rect.top or point.y <= rect.bottom
end

function Basic.point_on_side(point, rect)
    return point.x == rect.left or point.x == rect.right or point.y == rect.top or point.y == rect.bottom
end

function Basic.point_in_line(point, line)
    if line.x1 == line.x2 then
        local top = Fix.max(line.y1, line.y2)
        local bottom = Fix.min(line.y1, line.y2)
        return point.x == line.x1 and point.y >= bottom and point.y <= top
    elseif line.y1 == line.y2 then
        local left = Fix.min(line.x1, line.x2)
        local right = Fix.max(line.x1, line.x2)
        return point.y == line.y1 and point.x >= left and point.x <= right
    else
        local d = Basic.magnitude(Basic.vector(line))
        local d2 = Basic.magnitude({x = line.x1 - point.x, y = line.y1 - point.y})
        local d3 = Basic.magnitude({x = line.x2 - point.x, y = line.y2 - point.y})
        return d == d2 + d3
    end
end

function Basic.point_to_line_distance(point, line)
    local px = point.x
    local py = point.y
    local x1 = line.x1
    local y1 = line.y1
    local x2 = line.x2
    local y2 = line.y2

    local a = px - x1
    local b = py - y1
    local c = x2 - x1
    local d = y2 - y1
  
    local dot = a * c + b * d
    local len_sq = c * c + d * d
    local param = dot / len_sq
  
    local xx, yy
  
    if param < 0 or (x1 == x2 and y1 == y2) then
        xx = x1
        yy = y1
    elseif param > 1 then
        xx = x2
        yy = y2
    else
        xx = x1 + param * c
        yy = y1 + param * d
    end
  
    local dx = px - xx
    local dy = py - yy
  
    return Fix.sqrt(dx * dx + dy * dy)
end

function Basic.reflect_vector(incident, normal)
    local dt = Basic.dot(incident, normal);
    local r = {
        x = incident.x - 2 * dt * normal.x,
        y = incident.y - 2 * dt * normal.y
    }
    -- 反射向量不能为0，略微加上一个偏移量
    if r.x == 0 and r.y == 0 then
        r.x = incident.x - 2.1 * dt * normal.x;
        r.y = incident.y - 2.1 * dt * normal.y;       
    end
    return r
end

function Basic.ray_line_intersection(start, dir, line)
    local lstart = {x = line.x1, y = line.y1}
    local lend = {x = line.x2, y = line.y2}

    local denominator = (lend.y - lstart.y) * (dir.x) - (lend.x - lstart.x) * (dir.y)
    if denominator == 0 then
        return nil -- 射线与线段平行或共线，没有交点
    end

    local t1 = ((lend.x - lstart.x) * (start.y - lstart.y) - (lend.y - lstart.y) * (start.x - lstart.x)) / denominator
    local t2 = ((start.y - lstart.y) * (dir.x) - (start.x - lstart.x) * (dir.y)) / denominator

    if t1 >= 0 and t2 >= 0 and t2 <= 1 then
        local x = start.x + t1 * dir.x
        if line.x1 == line.x2 then
            x = line.x1
        end

        local y = start.y + t1 * dir.y
        if line.y1 == line.y2 then
            y = line.y1
        end
        return {x = x, y = y}
    end

    return nil -- 射线与线段不相交或交点不在线段上 
end

function Basic.get_angle(v1, v2)
    local dotv = v1.x * v2.x + v1.y * v2.y
    local len1 = Basic.magnitude(v1)
    local len2 = Basic.magnitude(v2)
    local cos = dotv / (len1 * len2)
    local theta = Fix.acos(cos)
    return Fix.pi - theta;
end

return Basic
