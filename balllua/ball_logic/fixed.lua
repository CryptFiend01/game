local fp = {}

local version = _G._VERSION
if version == "Lua 5.4" then
    local Fix = require "fp64"

    fp.zero = Fix.zero
    fp.one = Fix.one
    fp.pi = Fix.pi
    
    function fp.tofix(x)
        return Fix.new(x)
    end

    function fp.tonumber(x)
        return Fix.tonumber(x)
    end

    function fp.floor(x)
        return Fix.floor(x)
    end

    function fp.ceil(x)
        return Fix.ceil(x)
    end

    function fp.cos(x)
        return Fix.cos(x)
    end

    function fp.sin(x)
        return Fix.sin(x)
    end

    function fp.acos(x)
        return Fix.acos(x)
    end

    function fp.sqrt(x)
        return Fix.sqrt(x)
    end

    function fp.abs(x)
        return Fix.abs(x)
    end

    function fp.max(a, b)
        return Fix.max(a, b)
    end

    function fp.min(a, b)
        return Fix.min(a, b)
    end
else
    fp.zero = 0
    fp.one = 1
    fp.pi = math.pi

    function fp.tofix(x)
        return x
    end

    function fp.tonumber(x)
        return x
    end

    function fp.floor(x)
        return math.floor(x)
    end

    function fp.ceil(x)
        return math.ceil(x)
    end

    function fp.cos(x)
        return math.cos(x)
    end

    function fp.sin(x)
        return math.sin(x)
    end

    function fp.acos(x)
        return math.acos(x)
    end

    function fp.sqrt(x)
        return math.sqrt(x)
    end

    function fp.abs(x)
        return math.abs(x)
    end

    function fp.max(a, b)
        return math.max(a, b)
    end

    function fp.min(a, b)
        return math.min(a, b)
    end
end

return fp
