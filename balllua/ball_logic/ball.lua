local Help = require "ball_logic.help"
local Basic = require "ball_logic.basic"
local Collide = require "ball_logic.collide"

local Ball = {}
Ball.__index = Ball

function Ball:new(b)
    local self = {
        id = b.id,
        x = b.x,
        y = b.y,
        dir = b.dir,
        role = b.role,

        collide = b.collide,
        dist = b.dist,
        passed = 0,
        times = 0,
        ctimes = 0,
        ignores = {},
        hit = 0,
        interval = b.interval,
        old_state = {ignores = {}, hit = 0, collide = {}}
    }
    setmetatable(self, Ball)
    return self
end

function Ball:get_pos()
    local pos = {
        x = self.x + self.dir.x * self.passed,
        y = self.y + self.dir.y * self.passed
    }

    if self.ctimes == 0 then
        pos.x = pos.x - self.interval * self.dir.x
        pos.y = pos.y - self.interval * self.dir.x
    end
    return pos
end

function Ball:save_state()
    self.old_state.hit = self.hit
    if self.collide.point then
        self.old_state.collide = {
            point = Basic.copy_point(self.collide.point),
            line = self.collide.line
        }
    end

    self.old_state.ignores = {}
    for _, l in ipairs(self.ignores) do
        table.insert(self.old_state.ignores, l)
    end
end

function Ball:recover_state()
    self.hit = self.old_state.hit
    if self.old_state.collide.point then
        self.collide.point = Basic.copy_point(self.old_state.collide.point)
        self.collide.line = self.old_state.collide.line
    end

    self.ignores = {}
    for _, l in ipairs(self.old_state.ignores) do
        table.insert(self.ignores, l)
    end
end

function Ball:will_collide()
    return self.collide.point ~= nil
end

function Ball:check_ignores()
    self.ignores = Collide.reset_ignores(self:get_pos(), self.ignores, self.collide)
end

function Ball:calc_collide(lines)
    self:check_ignores()
    local start = self:get_pos()
    local collide = Collide.check_next_collide(start, self.dir, lines, self.ignores, self.hit)
    self.collide = collide
    -- 虚线物体或者当前为穿透球，需要记录正在那个敌方体内，再次碰撞其他物体前不会反复计算碰撞伤害
    self.hit = Collide.get_hit_id(self.collide)
    if self.collide.point then
        self.dist = Basic.distance({x = collide.point.x - self.x, y = collide.point.y - self.y})
        if self.ctimes == 0 then
            -- 还未第一次触发弹射的球，因为目标消失而重新计算碰撞点，需要加上起点等待距离
            self.dist = self.dist + self.interval
        end
    else
        self.dist = 0
    end
end

function Ball:next_collide_point()
    return self.collide.point
end

function Ball:next_collide_id()
    if self.collide.line then
        return self.collide.line.mid
    else
        return -1
    end
end

function Ball:next_collide_line()
    return self.collide.line
end

function Ball:rest_dist()
    return self.dist - self.passed
end

function Ball:move(d)
    assert(self.dist >= 0, "dist can't be nagetive.")
    self.passed = self.passed - d
end

function Ball:update(data)
    if self.hit == 0 then
        self.times = self.times + 1
    end
    self.ctimes = self.ctimes + 1
    -- 达到撞击次数上限，就不再计算该球
    if self.times < self.role.times then
        local l = self:next_collide_line()
        self.dir = l:get_reflect(self.dir)
        -- 只有反弹时才需要将pass设置为0
        self.passed = 0
        Basic.assign_point(self.collide.point, self)
        self:save_state()
        self:calc_collide(data.lines)
        return self:next_collide_point() ~= nil
    else
        return false
    end
end

function Ball.less(a, b)
    local da = a.dist - a.passed
    local db = b.dist - b.passed
    if da < db then
        return true
    elseif da > db then
        return false
    else
        return a.id < b.id
    end
end

return Ball