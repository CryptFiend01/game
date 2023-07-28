local Role = {}
Role.__index = Role

function Role:new(cfg)
    local self = {
        id = cfg.id,
        cfg = cfg,
        anger = 0,
        attack = cfg.attack,
        add_times = 0,
    }
    setmetatable(self, Role)
    return self 
end

function Role:add_anger(anger)
    if self.cfg.max_anger <= 0 then
        return
    end
    self.anger = self.anger + anger
end

function Role:get_anger()
    return self.anger
end

function Role:max_anger()
    return self.cfg.max_anger
end

function Role:ball_count()
    return self.cfg.count
end

function Role:is_anger_full()
    if self.cfg.max_anger == 0 then
        return false
    end
    return self.anger >= self.cfg.max_anger
end

function Role:clear_anger()
    self.anger = 0
end

function Role:get_attack()
    return self.attack
end

function Role:base_attack()
    return self.cfg.attack
end

function Role:change_attack(attack, times)
    self.attack = attack
    self.add_times = times
end

function Role:recover_attack()
    if self.add_times <= 0 then
        return
    end
    self.add_times = self.add_times - 1
    if self.add_times <= 0 then
        self.attack = self.cfg.attack
    end
end

function Role:max_ball_times()
    return self.cfg.times
end

function Role:reset()
    self.attack = self.cfg.attack
    self.add_times = 0
end

function Role:get_skill()
    return self.cfg.skill
end

return Role
