Config = {}

-- Where a brand-new character spawns (returning characters spawn at their saved position
-- instead, via exports.qbx_core:GetPlayerData().position). Adjust freely - this is entirely
-- ours to decide now, not something inherited from qbx_core's own defaultSpawn.
Config.NewCharacterSpawn = vec4(-1035.71, -2731.87, 12.86, 210.0)

-- Where the player stands/the camera looks while previewing a ped - both on the character
-- select screen (an existing character's saved look) and during creation. Independent of
-- Config.NewCharacterSpawn, which is where they actually spawn into the world afterward.
--
-- These are copied verbatim from qbx_core/config/client.lua's own multichar location list
-- (entry #7), so they are known-good, authored, feet-on-the-floor coordinates. Every
-- "ped is floating / standing on furniture" symptom we chased was a *sequencing* bug in
-- client/main.lua, not a bad coordinate - see the comment block above setupPreviewCam().
-- Other verified stock alternatives, if this room ever needs swapping out:
--   pedCoords vec4(-996.71, -68.07, -99.0, 57.61)    cam vec4(-999.90, -66.30, -98.45, 241.68)
--   pedCoords vec4(1104.49, 195.9, -49.44, 44.22)    cam vec4(1102.29, 198.14, -48.86, 225.07)
--   pedCoords vec4(2265.27, 2925.02, -84.8, 267.77)  cam vec4(2268.24, 2925.02, -84.36, 90.88)
Config.PreviewCamera = {
    pedCoords = vec4(-1004.5, -478.51, 50.03, 28.19),
    camCoords = vec4(-1006.36, -476.19, 50.50, 210.38),

    -- The UI panel is anchored to the LEFT of the screen, so pointing the camera dead-centre
    -- at the ped buries the character behind/next to it. Instead the camera keeps its physical
    -- position but aims at a point offset along its own *left* axis, which pushes the ped's
    -- on-screen position to the right. Expressed as a fraction of half the screen width:
    --   0.0 = dead centre (old behaviour), 1.0 = ped hard against the right edge.
    -- 0.42 puts the ped at roughly 71% across the screen, which clears the widest panel
    -- (CreationFlow's 860px) on a 1920-wide display. Tune this one number if it looks off.
    screenShift = 0.42,
}
