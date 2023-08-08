local Const = require "ball_logic.const"
local Help = require "ball_logic.help"

local function get_skill_range(point, width, height)
    return {
        x = (point.x - math.floor(width / 2)) * Const.Board.SIDE + Const.Offset.x,
        y = (point.y - math.floor(height / 2)) * Const.Board.SIDE + Const.Offset.y,
        width = width * Const.Board.SIDE,
        height = height * Const.Board.SIDE
    }
end

local function get_enemy(data, p)
    if p.x < 0 or p.x >= Const.Board.WIDTH or p.y < 0 or p.y >= Const.Board.HEIGHT then
        return nil
    end
    local grid = p.x + p.y * Const.Board.WIDTH
    local eid = data.take_grids[grid+1]
    if eid ~= 0 then
        return data.enemys[eid]
    else
        return nil
    end
end 

local function add_enemy(enemies, data, p)
    local enemy = get_enemy(data, p)
    if enemy then
        enemies[enemy.id] = enemy
    end
end

local function get_cross_enemies(data, point, horizon, vertical)
    local enemies = {}
    for i = -horizon, horizon do
        add_enemy(enemies, data, {x = point.x + i, y = point.y})
    end

    for i = -vertical, vertical do
        add_enemy(enemies, data, {x = point.x, y = point.y + i})
    end
    return enemies
end

local function get_rect_enemies(data, point, width, height)
    local enemies = {}
    local x = math.floor(width / 2)
    local y = math.floor(height / 2)
    for h = -y, y do
        for w = -x, x do
            add_enemy(enemies, data, {x = point.x + w, y = point.y + h})
        end 
    end
    return enemies
end

local function get_skill_enemies(data, point, skill)
    -- 根据不同形状筛选敌人
    if skill.shape == "cross" then
        return get_cross_enemies(data, point, skill.horizon, skill.vertical)
    elseif skill.shape == "rect" then
        return get_rect_enemies(data, point, skill.width, skill.height)
    end
end

local function select_grid(data, is_tag, f)
    local grid = 0
    local max_count = 0

    for i, eid in ipairs(data.take_grids) do
        if eid ~= 0 or not is_tag then
            local count = f(i)
            if count > max_count then
                max_count = count
                grid = i
            end
        end
    end
    return grid
end

local function select_cross_grid(data, horizon, vertical)
    local get_enemy_count = function(g)
        local count = 1
        local point = Help.grid_to_xy(g)
        for i = -horizon, horizon do
            local p = {x = point.x + i, y = point.y}
            if get_enemy(data, p) then
                count = count + 1
            end
        end

        for i = -vertical, -vertical do
            local p = {x = point.x, y = point.y + i}
            if get_enemy(data, p) then
                count = count + 1
            end
        end

        return count
    end 
    return select_grid(data, true, get_enemy_count)
end

local function select_rect_grid(data, width, height)
    local get_enemy_count = function(g)
        local count = 0
        local point = Help.grid_to_xy(g)
        local x = math.floor(width / 2)
        local y = math.floor(height / 2)
        for h = -y, y do
            for w = -x, x do
                local p = {x = point.x + w, y = point.y + h}
                if get_enemy(data, p) then
                    count = count + 1
                end
            end
        end
        return count
    end
    return select_grid(data, false, get_enemy_count)
end

local function select_skill_grid(data, skill)
    if not skill.shape then
        return -1
    end
    if skill.shape == "cross" then
        return select_cross_grid(data, skill.horizon, skill.vertical)
    elseif skill.shape == "rect" then
        return select_rect_grid(data, skill.width, skill.height)
    else
        return -1
    end
end

return {
    get_skill_range = get_skill_range,
    select_skill_grid = select_skill_grid,
    get_skill_enemies = get_skill_enemies
}