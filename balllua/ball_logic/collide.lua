local Basic = require "ball_logic.basic"
local Line = require "ball_logic.line"
local Help = require "ball_logic.help"

local function reset_ignores(start, ignores, collide, finish)
    local temp = {}
    -- 任何情况，只要完成了本次碰撞移动，本次碰撞线加入下次碰撞检测的忽略组中
    if collide.line and finish then
        table.insert(temp, collide.line)
    end
    for _, l in ipairs(ignores) do
        -- 起点所在的线条如果还在忽略列表中，则继续保留在忽略列表，防止在同一条线上反复碰撞
        if Basic.point_in_line(start, l) then
           table.insert(temp, l) 
        end
    end
    return temp
end

local function check_next_collide(start, dir, lines, ignores, hitid)
    local nearest = 1e10
    local collide = {}
    local check_line = function(l)
        -- 检测是否需要忽略，hitid表示当前需要忽略碰撞的敌方id
        if hitid > 0 and l.mid == hitid then
            return
        end
        -- 忽略列表中直接忽略，非穿透球隐藏线也忽略检测（穿透球需要检测，才能对中间方块计算伤害）
        if Help.contain(ignores, l) or (l.hide ~= 0 and not Line.through) then
            return
        end
        -- 检查入射方向与线的夹角，背面入射不碰撞
        local angle = Basic.get_angle(dir, l.normal)
        if angle > math.pi / 2 then
            return
        end
        local p = Basic.ray_line_intersection(start, dir, l)
        if p then
            -- 检测是否碰到内部隐藏虚线，非完整隐藏线段
            if l:is_hit_hide(p) then
                return
            end
            local dist = Basic.distance({x = p.x - start.x, y = p.y - start.y})
            -- 实线和虚线相交时，算碰到实线
            if dist < nearest or (dist == nearest and l.solid and not collide.line.solid) then
                collide.point = p;
                collide.line = l;
                nearest = dist;
            end
        end
    end
    for _, l in ipairs(lines) do
        check_line(l)
    end
    return collide
end

local function get_hit_id(collide)
    -- 虚线物体或者当前为穿透球，第一次碰撞时需要记录id，再次碰撞其他物体前不会反复计算碰撞伤害
    -- (再次碰到其他物体表示已经从记录物体中出去了)
    if collide.line and (not collide.line.solid or Line.through) then
        return collide.line.mid
    else
        return 0
    end
end

local function aim(base, dir, lines, times)
    local start = base
    local n = dir
    local hitid = 0
    local ignores = {}
    local collisions = {}
    while #collisions < times do
        local collide = check_next_collide(start, n, lines, ignores, hitid)
        if not collide.point or not collide.line then
            break
        end

        table.insert(collisions, Basic.copy_point(collide.point))

        local reflect = collide.line:get_reflect(n)

        start = collide.point
        n = reflect
        ignores = reset_ignores(start, ignores, collide)
        hitid = get_hit_id(collide)
    end
    return collisions
end

return {
    reset_ignores = reset_ignores,
    check_next_collide = check_next_collide,
    get_hit_id = get_hit_id,
    aim = aim
}