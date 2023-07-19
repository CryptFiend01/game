local Heap = {}
Heap.__index = Heap

function Heap:new(less)
    local self = {}
    setmetatable(self, Heap)
    self.array = {}
    self.less = less
    return self
end

function Heap:add(e)
    table.insert(self.array, e)
    local i = #self.array
    while i > 1 do
        local parent = math.floor((i - 1) / 2 + 1)
        if (i - 1) % 2 == 0 then
            parent = math.floor((i - 1) / 2)
        end
        if self.less(self.array[i], self.array[parent]) then
            self:swap(i, parent)
            i = parent
        else
            break
        end
    end
end

function Heap:swap(i, j)
    self.array[i], self.array[j] = self.array[j], self.array[i]
end

function Heap:pop()
    if self:empty() then
        return
    end

    local size = #self.array
    local e = self.array[1]
    self.array[1] = self.array[size]
    self.array[size] = nil

    size = #self.array
    if size > 1 then
        local i = 1
        while i < size do
            local left = (i - 1) * 2 + 2
		    local right = (i - 1) * 2 + 3
            if left > size then
                break
            end

            if right > size then
                if self.less(self.array[left], self.array[i]) then
                    self:swap(left, i)
                end
                break
            else
                local j = left
                if self.less(self.array[right], self.array[left]) then
                    j = right
                end
                if self.less(self.array[j], self.array[i]) then
                    self:swap(i, j)
                    i = j
                else
                    break
                end
            end
        end
    end
    return e
end

function Heap:empty()
    return #self.array == 0
end

function Heap:count()
    return #self.array
end

function Heap:clear()
    self.array = {}
end

return Heap
