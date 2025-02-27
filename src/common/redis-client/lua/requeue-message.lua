--- KEYS[1] keyQueueSettings (hash)
--- KEYS[2] keyQueueSettingsQueueType
--- KEYS[3] keyQueuePendingWithPriority (hash)
--- KEYS[4] keyQueuePriority (sorted set)
--- KEYS[5] keyQueuePending (list)
--- KEYS[6] from (list)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] messagePriority
--- ARGV[4] fromMessage
local result = redis.call("LREM", KEYS[6], 1, ARGV[4])
if result then
    local queueType = redis.call("HGET", KEYS[1], KEYS[2])
    if queueType == '2' and not(ARGV[3] == nil or ARGV[3] == '') then
        redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
        redis.call("ZADD", KEYS[4], ARGV[3], ARGV[1])
        return 1
    elseif (queueType == '0' or queueType == '1') and (ARGV[3] == nil or ARGV[3] == '') then
        if queueType == '0' then
            redis.call("RPUSH", KEYS[5], ARGV[2])
        else
            redis.call("LPUSH", KEYS[5], ARGV[2])
        end
        return 1
    end
end
return 0