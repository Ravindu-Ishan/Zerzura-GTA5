-- ExecuteCommand('quit') from the client isn't a reliable way to trigger a built-in console
-- command from Lua. DropPlayer is the actual documented, guaranteed way to disconnect a player.
RegisterNetEvent('z-player-charcreation:server:quit', function()
    DropPlayer(source, 'Left the server from the character menu.')
end)
