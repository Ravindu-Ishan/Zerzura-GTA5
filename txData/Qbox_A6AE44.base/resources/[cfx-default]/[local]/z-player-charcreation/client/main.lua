-- Phase 3: full tab set (Details, Face & Body, Face Adjustments, Hair & Eyes, Overlays,
-- Tattoos). Live preview and persistence via illenium-appearance's own exported getters/setters
-- (never raw DB access - see AGENT.md). Tattoo catalog (client/tattoos.lua) is a static copy of
-- illenium's shared/tattoos.lua since no export exists to read it cross-resource.

---@param character PlayerEntity
local function toClientCharacter(character)
    return {
        citizenid = character.citizenid,
        firstname = character.charinfo.firstname,
        lastname = character.charinfo.lastname,
        gender = character.charinfo.gender == 0 and 'Male' or 'Female',
    }
end

local previewCam

---True while the select screen has nothing to preview (a brand-new account with zero
---characters). See openSelectScreen() for why we hide the ped rather than invent one.
local previewPedHidden = false

--[[
  What "bare" actually looks like on a freemode ped - per component, per gender.

  IT IS NOT DRAWABLE 0. That was the entire bug, twice over. illenium-appearance calls
  SetPedDefaultComponentVariation on every model swap (game/util.lua:198-199), and the freemode
  DEFAULT variation is drawable 0 on every component - which *is* the white t-shirt and jeans the
  player was looking at. So the old code backed up {drawable=0} and wrote 0 straight back: a
  literal no-op on the creation ped. Adding component 3 to that list changed nothing because the
  drawable, not the component list, was wrong.

  These numbers are copied verbatim from illenium's own strip-the-ped routine - removeClothes
  (game/customization.lua:520-523) writes constants.DATA_CLOTHES[type].components[male|female] as
  {componentId, bareDrawable} pairs (game/constants.lua:289-338). That table is the only verified
  source for these ids in this repo; nothing here is recalled or inferred. Palette 2 and texture 0
  mirror that same call.

  Two entries are not in illenium's table: 9 (vest/body armour) and 1 (mask) - component ids per
  outfits.lua:40 and constants.lua:261. For both, 0 genuinely is "none", so they are no-op
  insurance that armour can't hide a torso tattoo and a mask can't hide a head one.
]]
local UNDRESS_DRAWABLES = {
    male   = { [1] = 0, [3] = 15, [4] = 61, [5] = 0, [6] = 34, [8] = 15, [9] = 0, [10] = 0, [11] = 252 },
    female = { [1] = 0, [3] = 15, [4] = 15, [5] = 0, [6] = 35, [8] = 14, [9] = 0, [10] = 0, [11] = 15 },
}

---nil while dressed; while undressed, the per-component {drawable, texture} to put back.
local componentBackup
---Which ped model the backup was taken from - a model swap invalidates it (see below).
local undressedModel

---Strips the ped to that bare state for the whole time the Tattoos tab is open - every zone needs
---it, not just whichever one is focused, so this is a tab-wide on/off rather than something
---setCameraFocus toggles per zone. Restores what was equipped the moment the tab closes. Safe and
---idempotent - call it as often as needed.
---@param undressed boolean
local function setPreviewUndressed(undressed)
    local ped = PlayerPedId()
    local model = GetEntityModel(ped)

    if undressed then
        if componentBackup then return end

        -- Gender test mirrors illenium's getPedDecorationType (game/util.lua:156-163). We repeat
        -- it rather than call it because it only exists in their internal `client` table, not in
        -- their exports list (game/util.lua:395-413).
        local bare = model == `mp_f_freemode_01` and UNDRESS_DRAWABLES.female or UNDRESS_DRAWABLES.male

        componentBackup = {}
        undressedModel = model

        for component, drawable in pairs(bare) do
            componentBackup[component] = {
                drawable = GetPedDrawableVariation(ped, component),
                texture = GetPedTextureVariation(ped, component),
            }
            SetPedComponentVariation(ped, component, drawable, 0, 2)

            -- Read back instead of trusting the write. An out-of-range drawable is rejected
            -- silently, and male torso2 252 in particular only exists if the DLC that ships it is
            -- streaming. If want ~= got on a line here, that component is the one still dressed -
            -- which is exactly the evidence the last two attempts at this bug were missing.
            print(('[undress] comp=%d want=%d got=%d was=%d count=%d'):format(
                component, drawable, GetPedDrawableVariation(ped, component),
                componentBackup[component].drawable, GetNumberOfPedDrawableVariations(ped, component)))
        end
    elseif componentBackup then
        -- A model swap destroys the ped and default-dresses the replacement (util.lua:194-199),
        -- so drawables backed up off the old body mean nothing on the new one - drop them rather
        -- than paint them onto a ped that never wore them.
        if model == undressedModel then
            for component, backup in pairs(componentBackup) do
                SetPedComponentVariation(ped, component, backup.drawable, backup.texture, 2)
            end
        end
        componentBackup = nil
        undressedModel = nil
    end
end

---Applies the current show/hide decision to whatever ped the player owns right now.
local function applyPreviewPedVisibility()
    SetEntityVisible(PlayerPedId(), not previewPedHidden, false)
end

local function destroyPreviewCam()
    if not previewCam then return end
    SetCamActive(previewCam, false)
    DestroyCam(previewCam, true)
    RenderScriptCams(false, false, 1, true, true)

    -- Hand the ped back in a sane state. parkPreviewPed() turns collision off and hides the
    -- ped, so *every* one of those has to be undone here - otherwise the player spawns into
    -- the world invisible and falling through the map.
    local ped = PlayerPedId()
    FreezeEntityPosition(ped, false)
    SetEntityCollision(ped, true, true)
    previewPedHidden = false
    SetEntityVisible(ped, true, false)

    DisplayRadar(true)
    previewCam = nil
    setPreviewUndressed(false)
end

--[[
  Preview ped placement
  ---------------------
  History note, because this took seven attempts: the coordinates were never the problem.
  qbx_core ships these exact coords and places a ped on them fine. What was wrong was the
  *order of operations*, and it was wrong in three separate ways:

  1. The old code explicitly UNFROZE the ped, teleported it, and then burned up to 3 seconds
     of Wait(0) waiting for the interior to stream - with the screen already faded in, with
     collision enabled and gravity acting on a ped standing over a floor that did not exist
     yet. That is the "ped is visibly falling on join" symptom, literally.
  2. It then called PlaceObjectOnGroundProperly(ped). Per the native reference that is
     `OBJECT::PLACE_OBJECT_ON_GROUND_PROPERLY(Object object)` - an OBJECT-namespace native
     that takes an Object, not a Ped. It was never going to ground a ped.
  3. It finished with FreezeEntityPosition(ped, true), which pins the ped wherever gravity
     left it AND preserves its in-progress falling task. A frozen, mid-fall ped renders as a
     character hovering in the air - which is exactly what was on screen.

  There is also a subtler one: attempt #6 replaced RequestCollisionAtCoord with
  GetInteriorAtCoords/PinInteriorInMemory/IsInteriorReady and made the whole wait conditional
  on `interiorId ~= 0`. If the preview mark is not inside a registered MLO room (a rooftop, a
  balcony, an exterior-ish shell), GetInteriorAtCoords returns 0 and that code performed *no
  streaming wait at all*. Interior pinning and collision streaming are two different systems;
  we now do both, unconditionally.

  The fix mirrors what spawnmanager itself does in spawnPlayer() (the Cfx reference
  implementation, in [managers]/spawnmanager/spawnmanager.lua): fade to black, freeze and
  DISABLE COLLISION on the ped first, move it, wait for the world, and only then hand it back
  to physics. SET_ENTITY_COORDS is documented as taking "the Z coordinate, ground level" and
  offsetting by the entity radius itself, so no hand-rolled ground snap is needed - the engine
  puts a ped's feet on a surface for free, as long as the surface exists when you let go.
]]

local PREVIEW_STREAM_TIMEOUT = 8000
local PREVIEW_SETTLE_TIMEOUT = 1500

---Parks the ped on the preview mark completely inert: no tasks, no collision, no gravity.
---Safe and cheap to call at any time, including repeatedly.
local function parkPreviewPed()
    local loc = Config.PreviewCamera
    local ped = PlayerPedId()

    -- Kill any in-progress fall/ragdoll task, or the ped keeps that pose while frozen.
    ClearPedTasksImmediately(ped)
    SetEntityCollision(ped, false, false)
    FreezeEntityPosition(ped, true)
    SetEntityCoords(ped, loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z, false, false, false, false)
    SetEntityHeading(ped, loc.pedCoords.w)
    SetEntityVelocity(ped, 0.0, 0.0, 0.0)
    applyPreviewPedVisibility()
end

---Blocks until the world around the preview mark genuinely exists, or we give up.
---@return boolean streamed true if both checks passed within the timeout
local function streamPreviewLocation()
    local loc = Config.PreviewCamera
    local ped = PlayerPedId()

    -- MLO rooms have to be pinned separately from world collision. interiorId == 0 just means
    -- "this spot isn't inside a registered interior", which is fine - the collision request
    -- below still applies, which is the case attempt #6 accidentally skipped entirely.
    local interiorId = GetInteriorAtCoords(loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z)
    if interiorId ~= 0 then
        PinInteriorInMemory(interiorId)
    end

    local deadline = GetGameTimer() + PREVIEW_STREAM_TIMEOUT
    while GetGameTimer() < deadline do
        -- REQUEST_COLLISION_AT_COORD is a per-frame request, not a one-shot call - issuing it
        -- once (as the old code did) mostly does nothing. It has to be re-asserted every tick
        -- until the streamer reports the collision is in.
        RequestCollisionAtCoord(loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z)

        local interiorReady = interiorId == 0 or IsInteriorReady(interiorId)
        if interiorReady and HasCollisionLoadedAroundEntity(ped) then return true end
        Wait(0)
    end

    return false
end

---Hands the ped back to the physics engine just long enough for it to stand on the floor,
---then locks it there. This replaces the hand-rolled ground snap: resolving a ped's feet
---against arbitrary interior geometry is exactly what the collision solver does, and no
---ground-probe native does it as reliably for MLO floors.
local function settlePreviewPed()
    local loc = Config.PreviewCamera
    local ped = PlayerPedId()

    SetEntityCollision(ped, true, true)
    FreezeEntityPosition(ped, false)

    -- Poll for actual ground contact rather than sleeping a fixed amount of time. A ped that
    -- is already standing satisfies this within a couple of frames; one that has to drop a few
    -- centimetres onto the floor takes a few more. Either way we stop as soon as it is true,
    -- instead of guessing a duration.
    local deadline = GetGameTimer() + PREVIEW_SETTLE_TIMEOUT
    local stableFrames = 0
    repeat
        Wait(0)
        local velocity = GetEntityVelocity(ped)
        if not IsEntityInAir(ped) and math.abs(velocity.z) < 0.02 then
            stableFrames = stableFrames + 1
        else
            stableFrames = 0
        end
    until stableFrames >= 5 or GetGameTimer() > deadline

    FreezeEntityPosition(ped, true)

    -- Last-resort guard: if the ped is nowhere near the mark it never found a floor at all
    -- (streaming gave up). Put it back on the authored coordinate rather than leave it
    -- somewhere under the map. The threshold is deliberately loose - a legitimate settle is
    -- centimetres, so anything past 2m is a failure, not a correction.
    if #(GetEntityCoords(ped) - loc.pedCoords.xyz) > 2.0 then
        SetEntityCoords(ped, loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z, false, false, false, false)
        SetEntityHeading(ped, loc.pedCoords.w)
    end
end

---Re-applies the whole preview placement to whatever ped the player owns *now*.
---
---MUST be called after every model change. SET_PLAYER_MODEL is documented as "this will
---destroy the current Ped for the Player and create a new one, any reference to the old ped
---will be invalid after calling this" - so the replacement ped inherits none of our freeze,
---position, heading, collision or visibility state. Not doing this is why the ped was back to
---hovering the moment a character was clicked in the list.
local function repositionPreviewPed()
    parkPreviewPed()

    -- Only worth settling if there is something to settle onto; on the very first call the
    -- world has not streamed yet and setupPreviewCam() will do the full sequence right after.
    if HasCollisionLoadedAroundEntity(PlayerPedId()) then
        settlePreviewPed()
    end
end

---Blacks the screen out and waits for it. Everything the preview does to the ped (model
---swaps, teleports, a moment of live physics) happens behind this.
local function beginPreviewFade()
    if IsScreenFadedOut() then return end
    DoScreenFadeOut(200)
    local deadline = GetGameTimer() + 1500
    while not IsScreenFadedOut() and GetGameTimer() < deadline do Wait(0) end
end

---Returns the point the camera should actually aim at so that `target` lands to the RIGHT of
---screen centre rather than on it, clearing the left-anchored UI panel. The camera itself does
---not move - only its aim does, which is the standard way to offset a subject in frame.
---@param target vector3 what we want to look at (ped position or a bone)
---@param camPos vector3 where the camera is
---@param fov number the camera's vertical FOV, in degrees
---@return vector3 aimPoint
local function aimPointFor(target, camPos, fov)
    local shift = Config.PreviewCamera.screenShift or 0.0
    if shift == 0.0 then return target end

    local fx, fy = target.x - camPos.x, target.y - camPos.y
    local length = math.sqrt(fx * fx + fy * fy)
    if length < 0.01 then return target end
    fx, fy = fx / length, fy / length

    -- Camera-right in world space for GTA's Z-up world is forward x up = (fy, -fx, 0).
    -- Sanity check: facing north, forward = (0,1,0), so right = (1,0,0) = east. Correct.
    -- Aiming LEFT (subtracting right) is what pushes the subject right on screen.
    local rightX, rightY = fy, -fx

    -- Half the width visible at the subject's distance. GTA camera FOV is vertical, so the
    -- horizontal extent is that times the real aspect ratio - which keeps the framing identical
    -- on 16:9 and ultrawide instead of flinging the ped off-screen on a wide monitor.
    local aspect = 16.0 / 9.0
    if GetAspectRatio then
        local reported = GetAspectRatio(false)
        if reported and reported > 1.0 and reported < 4.0 then aspect = reported end
    end

    local distance = #(target - camPos)
    local offset = shift * distance * math.tan(math.rad(fov * 0.5)) * aspect

    return vector3(target.x - rightX * offset, target.y - rightY * offset, target.z)
end

-- Per-tab/per-zone camera framing. Rather than hardcoding a separate world-space camera position
-- for each one (which would need re-deriving by hand for every zone, and would drift if the ped's
-- pose/model ever changes), each preset re-derives its target live from the ped's own skeleton via
-- GetEntityBoneIndexByName/GetWorldPositionOfEntityBone, then reuses the *direction* from the
-- already-correct default camCoords (just scaled closer) so it keeps looking at the ped from the
-- front rather than from some arbitrary angle. Bone names confirmed against CitizenFX's own
-- BoneID enum: https://github.com/citizenfx/fivem/blob/master/code/client/clrcore/External/BoneID.cs
local CAMERA_FOCUS = {}

-- 'default' is the whole-body shot used by the select screen and the Details tab. It has no
-- bone, so it frames the ped's live position plus zOffset (how far up the body the frame is
-- centred) at an FOV wide enough to keep the whole body in frame. `distance` scales how far back
-- the camera sits along its configured direction (config.lua's camCoords-pedCoords line);
-- `height` raises (positive) or lowers (negative) the camera relative to the aim point - since
-- PointCamAtCoord always points straight at its target, that height difference is the only thing
-- that produces the up/down tilt, not a rotation value we set directly.
CAMERA_FOCUS.default = { bone = nil, zOffset = 0.1, distance = 1.0, height = -0.2, fov = 50.0 }

-- Close-up presets keep the same camera DIRECTION as 'default' but scale both how far back and
-- how high/low the camera sits, as a fraction (`ratio`) of 'default's OWN distance/height, rather
-- than hardcoded absolute numbers. That's what "relative to the default" means here: retune
-- 'default' and every close-up rescales and re-tilts proportionally with it.
--
-- IMPORTANT: our [camerafocus] diagnostic print showed GetEntityBoneIndexByName(ped, 'SKEL_Head')
-- (and every other bone name) returning -1 on the LOCAL PLAYER ped specifically - every close-up
-- was silently falling back to the same fixed point, which is what actually looked broken, not
-- the distance/height maths. This repo's own qbx_core (modules/utils.lua:536) already routes
-- around exactly this: GetPedBoneIndex(ped, numericId) for peds, GetEntityBoneIndexByName only
-- for other entity types (ox_target's vehicle door-bone lookups are why *that* one works fine).
-- So `bone` here is the classic numeric PED_BONE id, not a name. Values are copied verbatim from
-- CitizenFX's own enum, not guessed:
-- https://github.com/citizenfx/fivem/blob/master/code/client/clrcore/External/BoneID.cs
-- (first attempt used remembered hex constants for everything but SKEL_Head - wrong, confirmed
-- by boneIndex printing -1 for torso/arms/legs; these decimal values are the verified source).
---@param bone integer classic numeric PED_BONE id (GetPedBoneIndex, not GetEntityBoneIndexByName)
---@param ratio number this preset's distance/height as a fraction of CAMERA_FOCUS.default's
---@param fov number vertical FOV in degrees for this close-up
local function relativeFocus(bone, ratio, fov)
    return {
        bone = bone,
        distance = CAMERA_FOCUS.default.distance * ratio,
        height = CAMERA_FOCUS.default.height * ratio,
        fov = fov,
    }
end

local PED_BONE = {
    SKEL_Head = 31086,
    SKEL_Spine2 = 24817,
    SKEL_L_Forearm = 61163,
    SKEL_R_Forearm = 28252,
    SKEL_L_Calf = 63931,
    SKEL_R_Calf = 36864,
}

CAMERA_FOCUS.face = relativeFocus(PED_BONE.SKEL_Head, 0.32, 28.0)
CAMERA_FOCUS.torso = relativeFocus(PED_BONE.SKEL_Spine2, 0.55, 35.0)
CAMERA_FOCUS.leftArm = relativeFocus(PED_BONE.SKEL_L_Forearm, 0.45, 32.0)
CAMERA_FOCUS.rightArm = relativeFocus(PED_BONE.SKEL_R_Forearm, 0.45, 32.0)
CAMERA_FOCUS.leftLeg = relativeFocus(PED_BONE.SKEL_L_Calf, 0.55, 34.0)
CAMERA_FOCUS.rightLeg = relativeFocus(PED_BONE.SKEL_R_Calf, 0.55, 34.0)

---@param key string key into CAMERA_FOCUS, unknown/nil keys fall back to 'default'.
local function setCameraFocus(key)
    if not previewCam then return end

    local preset = CAMERA_FOCUS[key] or CAMERA_FOCUS.default
    local ped = PlayerPedId()
    local loc = Config.PreviewCamera

    local target
    local boneIndex = preset.bone and GetPedBoneIndex(ped, preset.bone) or -1
    if boneIndex and boneIndex ~= -1 and boneIndex ~= 0 then
        target = GetWorldPositionOfEntityBone(ped, boneIndex)
    else
        -- No bone (the 'default' preset) or the name didn't resolve. Frame the ped's *live*
        -- position rather than the configured mark, so the shot is still correct if it settled
        -- a few centimetres off it.
        local pedCoords = GetEntityCoords(ped)
        target = vector3(pedCoords.x, pedCoords.y, pedCoords.z + (preset.zOffset or 0.85))
    end

    local dx = (loc.camCoords.x - loc.pedCoords.x) * preset.distance
    local dy = (loc.camCoords.y - loc.pedCoords.y) * preset.distance
    local camPos = vector3(target.x + dx, target.y + dy, target.z + (preset.height or 0.0))

    SetCamCoord(previewCam, camPos.x, camPos.y, camPos.z)
    SetCamFov(previewCam, preset.fov)

    -- Aim off-centre so the ped sits clear of the left-hand UI panel. Every preset goes
    -- through this, so the framing offset is consistent across all tabs.
    local aim = aimPointFor(target, camPos, preset.fov)
    PointCamAtCoord(previewCam, aim.x, aim.y, aim.z)

    -- Diagnostic left in from tracking down GetEntityBoneIndexByName returning -1 for every ped
    -- bone (fixed by switching to GetPedBoneIndex + numeric PED_BONE ids above). Keep running
    -- this until each of the six presets is confirmed with a real, non-zero boneIndex in-game.
    print(('[camerafocus] key=%s bone=%s boneIndex=%s distance=%.3f height=%.3f fov=%.1f'):format(
        key or 'nil', tostring(preset.bone), tostring(boneIndex), preset.distance, preset.height or 0.0, preset.fov))
    print(('[camerafocus] target %.3f %.3f %.3f'):format(target.x, target.y, target.z))
    print(('[camerafocus] camPos %.3f %.3f %.3f'):format(camPos.x, camPos.y, camPos.z))
    print(('[camerafocus] aim    %.3f %.3f %.3f'):format(aim.x, aim.y, aim.z))
end

---Places the ped, waits for the world, settles it onto the floor and builds the preview
---camera - all behind a black screen, fading back in only once everything is correct.
local function setupPreviewCam()
    -- Guard against double-creation (e.g. re-opening the select screen after a delete while
    -- a preview camera from the last time round is still active).
    destroyPreviewCam()

    beginPreviewFade()

    local loc = Config.PreviewCamera

    parkPreviewPed()

    local tStream = GetGameTimer()
    streamPreviewLocation()
    print(('[bootTiming]   setupPreviewCam streamPreviewLocation: %dms (near-0 confirms the boot '
        .. 'thread\'s early pre-warm already finished this in the background)'):format(GetGameTimer() - tStream))

    local tSettle = GetGameTimer()
    settlePreviewPed()
    print(('[bootTiming]   setupPreviewCam settlePreviewPed: %dms'):format(GetGameTimer() - tSettle))

    DisplayRadar(false)

    -- Created with the configured position/rotation as a sane starting state; setCameraFocus
    -- immediately re-derives both from the ped so there is exactly one framing code path.
    previewCam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', loc.camCoords.x, loc.camCoords.y,
        loc.camCoords.z, -6.0, 0.0, loc.camCoords.w, CAMERA_FOCUS.default.fov, false, 0)
    SetCamActive(previewCam, true)
    RenderScriptCams(true, false, 1, true, true)
    setCameraFocus('default')

    DoScreenFadeIn(500)
end

RegisterNUICallback('setCameraFocus', function(data, cb)
    setCameraFocus(data.focus)
    cb({})
end)

---Tab-wide, not per-zone: TattoosTab calls this once on mount (true) and once on unmount
---(false), independently of whichever zone is focused within it.
RegisterNUICallback('setTattoosMode', function(data, cb)
    setPreviewUndressed(data.active == true)
    cb({})
end)

---Shows a random default-looking freemode ped. Only used as a fallback when a saved
---character's appearance fails to load - never to populate an empty roster (see
---openSelectScreen).
local function previewRandomPed()
    local model = math.random(2) == 1 and 'mp_m_freemode_01' or 'mp_f_freemode_01'
    exports['illenium-appearance']:setPlayerModel(model)
    repositionPreviewPed()
end

---Loads and displays a specific existing character's actual saved appearance, same callback
---stock qbx_core used to preview a character before you commit to playing them.
---@param citizenId string
local function previewSavedCharacter(citizenId)
    previewPedHidden = false

    -- Broken out into its own [bootTiming] sub-steps (not just one mark for the whole function)
    -- because this bundles two genuinely different kinds of latency - a server round trip and a
    -- local model stream-in - and only splitting them tells you which one is actually slow if
    -- this step is still the bottleneck after the parallel-streaming fix in the boot thread.
    local t0 = GetGameTimer()
    local clothing, model = lib.callback.await('qbx_core:server:getPreviewPedData', false, citizenId)
    print(('[bootTiming]   getPreviewPedData round-trip: %dms'):format(GetGameTimer() - t0))
    if not (model and clothing) then
        previewRandomPed()
        return
    end

    local t1 = GetGameTimer()
    lib.requestModel(model)
    print(('[bootTiming]   model stream-in (%s): %dms'):format(model, GetGameTimer() - t1))

    SetPlayerModel(cache.playerId, model)
    pcall(function()
        exports['illenium-appearance']:setPedAppearance(PlayerPedId(), json.decode(clothing))
    end)
    SetModelAsNoLongerNeeded(model)

    -- SET_PLAYER_MODEL just destroyed the ped we had parked and made a brand new one. Park
    -- the new one too, or it falls/hovers the moment the player clicks a character.
    repositionPreviewPed()
end

---@param bootMark fun(label: string)|nil optional timing hook, only passed on the very first
---call from the boot thread - see [bootTiming] prints there. Later calls (cancelCreation,
---after a delete) pass nothing.
local function openSelectScreen(bootMark)
    bootMark = bootMark or function() end

    -- Black the screen out before anything touches the ped. Model swaps, the teleport and the
    -- brief moment of live physics that settles the ped onto the floor all happen behind this.
    beginPreviewFade()
    parkPreviewPed()

    bootMark('requesting character list from server')
    local characters, maxSlots = lib.callback.await('qbx_core:server:getCharacters', false)
    bootMark('character list received')

    local list = {}
    for i = 1, #characters do
        list[i] = toClientCharacter(characters[i])
    end

    -- Empty roster: show no ped at all.
    --
    -- This used to drop in a random freemode ped. That reads as "here is a character you own"
    -- on an account that owns none, it isn't the ped you get when you click Create either
    -- (creation always starts on mp_m_freemode_01), and it costs a model load for something
    -- with no meaning. The panel on this screen is entirely about creating your first
    -- character, so the empty room is the honest backdrop - the first ped a new player ever
    -- sees is the one they're actually building.
    local hasCharacters = characters[1] ~= nil
    if hasCharacters then
        previewSavedCharacter(characters[1].citizenid)
        bootMark('saved character appearance applied (server round-trip + model stream-in)')
    end

    setupPreviewCam()
    bootMark('camera set up (world streaming + settle, hopefully already warm)')

    -- Must come AFTER setupPreviewCam(), not before: that function tears down any existing
    -- camera via destroyPreviewCam(), which unconditionally resets previewPedHidden to false
    -- and force-shows the ped (the correct behaviour for destroyPreviewCam's main job - right
    -- before actually spawning the player for real). On the very first call there's no camera
    -- yet, so that reset is a no-op and this bug stays hidden - but going Creation -> Cancel ->
    -- Select with an empty roster, a camera already exists, destroyPreviewCam() fires from
    -- inside setupPreviewCam(), and it silently clobbered the hide decision if that decision
    -- was made earlier in this function. That's why cancelling out of creation with no saved
    -- characters used to leave the creation ped standing on the select screen instead of
    -- hiding it - this ordering is what fixes it.
    previewPedHidden = not hasCharacters
    applyPreviewPedVisibility()

    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'init', payload = { characters = list, maxSlots = maxSlots } })
end

RegisterNUICallback('previewCharacter', function(data, cb)
    previewSavedCharacter(data.citizenid)
    cb({})
end)

local function openCreationScreen()
    beginPreviewFade()

    -- Creation always starts from the male freemode base; the gender toggle swaps it from here.
    previewPedHidden = false
    exports['illenium-appearance']:setPlayerModel('mp_m_freemode_01')

    setupPreviewCam()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'openCreation', payload = {} })
end

---@param isNewCharacter boolean
local function closeUiAndSpawn(isNewCharacter)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'setVisible', payload = { visible = false } })

    DoScreenFadeOut(300)
    while not IsScreenFadedOut() do Wait(0) end

    local coords = Config.NewCharacterSpawn
    if not isNewCharacter then
        local playerData = exports.qbx_core:GetPlayerData()
        coords = (playerData and playerData.position) or coords
    end

    pcall(function()
        exports.spawnmanager:spawnPlayer({ x = coords.x, y = coords.y, z = coords.z, heading = coords.w or 0.0 })
    end)

    TriggerServerEvent('QBCore:Server:OnPlayerLoaded')
    TriggerEvent('QBCore:Client:OnPlayerLoaded')

    Wait(500)
    DoScreenFadeIn(300)
end

RegisterNUICallback('quit', function(_, cb)
    cb({})
    TriggerServerEvent('z-player-charcreation:server:quit')
end)

RegisterNUICallback('selectCharacter', function(data, cb)
    lib.callback.await('qbx_core:server:loadCharacter', false, data.citizenid)
    cb({})
    destroyPreviewCam()
    closeUiAndSpawn(false)
end)

RegisterNUICallback('deleteCharacter', function(data, cb)
    local success = lib.callback.await('qbx_core:server:deleteCharacter', false, data.citizenid)
    cb({ success = success })
    if success then openSelectScreen() end
end)

RegisterNUICallback('startCreation', function(_, cb)
    cb({})
    openCreationScreen()
end)

RegisterNUICallback('cancelCreation', function(_, cb)
    cb({})
    -- No explicit destroyPreviewCam() here: openSelectScreen fades to black first and
    -- setupPreviewCam tears the old camera down behind it. Destroying it up front would
    -- snap the gameplay camera back for a visible frame or two.
    openSelectScreen()
end)

RegisterNUICallback('setGender', function(data, cb)
    local model = data.gender == 'Female' and 'mp_f_freemode_01' or 'mp_m_freemode_01'
    exports['illenium-appearance']:setPlayerModel(model)
    -- New model == new ped entity, so re-park it (see repositionPreviewPed).
    repositionPreviewPed()
    cb({})
end)

RegisterNUICallback('setHeadBlend', function(data, cb)
    exports['illenium-appearance']:setPedHeadBlend(PlayerPedId(), data)
    cb({})
end)

RegisterNUICallback('setFaceFeatures', function(data, cb)
    exports['illenium-appearance']:setPedFaceFeatures(PlayerPedId(), data)
    cb({})
end)

RegisterNUICallback('setHair', function(data, cb)
    exports['illenium-appearance']:setPedHair(PlayerPedId(), data)
    cb({})
end)

RegisterNUICallback('setEyeColor', function(data, cb)
    exports['illenium-appearance']:setPedEyeColor(PlayerPedId(), data.eyeColor)
    cb({})
end)

RegisterNUICallback('setHeadOverlays', function(data, cb)
    exports['illenium-appearance']:setPedHeadOverlays(PlayerPedId(), data)
    cb({})
end)

RegisterNUICallback('setTattoos', function(data, cb)
    exports['illenium-appearance']:setPedTattoos(PlayerPedId(), data)
    cb({})
end)

RegisterNUICallback('getTattooCatalog', function(_, cb)
    cb(Config.Tattoos)
end)

-- Index order matches illenium-appearance's game/constants.lua HEAD_OVERLAYS list exactly -
-- GetPedHeadOverlayNum expects that native overlay index (0-based), not our field name.
local OVERLAY_ORDER = {
    'blemishes', 'beard', 'eyebrows', 'ageing', 'makeUp', 'blush',
    'complexion', 'sunDamage', 'lipstick', 'moleAndFreckles', 'chestHair', 'bodyBlemishes',
}

RegisterNUICallback('getModelRanges', function(_, cb)
    local ped = PlayerPedId()

    local overlayMax = {}
    for i = 1, #OVERLAY_ORDER do
        overlayMax[OVERLAY_ORDER[i]] = GetPedHeadOverlayNum(i - 1) - 1
    end

    cb({
        hairStyleMax = GetNumberOfPedDrawableVariations(ped, 2) - 1,
        overlayMax = overlayMax,
    })
end)

RegisterNUICallback('submitNewCharacter', function(data, cb)
    local details = data.details

    local newData = lib.callback.await('qbx_core:server:createCharacter', false, {
        firstname = details.firstname,
        lastname = details.lastname,
        nationality = details.nationality,
        birthdate = details.birthdate,
        gender = details.gender == 'Female' and 1 or 0,
    })

    if not newData then
        cb({ success = false })
        return
    end

    -- getPedAppearance() reads the ped's current live state (already shaped exactly how
    -- illenium-appearance expects it) - we never hand-build this schema ourselves.
    local appearance = exports['illenium-appearance']:getPedAppearance(PlayerPedId())
    TriggerServerEvent('illenium-appearance:server:saveAppearance', appearance)

    cb({ success = true })
    destroyPreviewCam()
    closeUiAndSpawn(true)
end)

-- Diagnostic for the preview placement, deliberately left in: this is only observable in-game,
-- and printing the actual numbers beats another round of guessing at it. Run `charpreview` in
-- the F8 console while the select/creation screen is up.
RegisterCommand('charpreview', function()
    local ped = PlayerPedId()
    local loc = Config.PreviewCamera
    local coords = GetEntityCoords(ped)
    local interiorId = GetInteriorAtCoords(loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z)
    local foundGround, groundZ = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z + 1.0, false)

    print(('[charpreview] ped=%s model=%s visible=%s'):format(ped, GetEntityModel(ped), tostring(IsEntityVisible(ped))))
    print(('[charpreview] at      %.3f %.3f %.3f  heading %.2f'):format(coords.x, coords.y, coords.z, GetEntityHeading(ped)))
    print(('[charpreview] config  %.3f %.3f %.3f  heading %.2f'):format(loc.pedCoords.x, loc.pedCoords.y, loc.pedCoords.z, loc.pedCoords.w))
    print(('[charpreview] drift   %.3f m'):format(#(coords - loc.pedCoords.xyz)))
    print(('[charpreview] inAir=%s heightAboveGround=%.3f groundZfound=%s groundZ=%.3f'):format(
        tostring(IsEntityInAir(ped)), GetEntityHeightAboveGround(ped), tostring(foundGround),
        foundGround and groundZ or 0.0))
    print(('[charpreview] interiorId=%s interiorReady=%s collisionLoaded=%s tutorialSession=%s'):format(
        interiorId, interiorId ~= 0 and tostring(IsInteriorReady(interiorId)) or 'n/a',
        tostring(HasCollisionLoadedAroundEntity(ped)), tostring(NetworkIsInTutorialSession())))
end, false)

CreateThread(function()
    while not NetworkIsSessionStarted() do Wait(0) end
    pcall(function() exports.spawnmanager:setAutoSpawn(false) end)

    -- Isolates us from other players while on this screen (nobody walking through our character).
    NetworkStartSoloTutorialSession()
    while not NetworkIsInTutorialSession() do Wait(0) end

    Wait(250)

    -- Black the world out BEFORE tearing the loading screen down. Otherwise the instant the
    -- loading screen disappears the player is looking at a half-streamed world with an
    -- unplaced ped in it - which is where the "ped is falling on join" was visible from.
    -- openSelectScreen/setupPreviewCam fade back in once the ped is actually standing.
    DoScreenFadeOut(0)

    -- Park the ped on the preview mark while we're still behind the loading screen. It costs
    -- nothing, guarantees the ped never falls even once, and gives the streamer a head start
    -- on the preview location before openSelectScreen's server round-trip.
    parkPreviewPed()

    -- Start streaming the preview location's world/collision data NOW, in the background, in
    -- parallel with everything openSelectScreen is about to do (a getCharacters server round
    -- trip, then a getPreviewPedData round trip plus a blocking model stream-in inside
    -- previewSavedCharacter). Previously this only started deep inside setupPreviewCam(), which
    -- only runs AFTER both of those complete - three genuinely independent sources of latency
    -- chained strictly one-after-another is what actually produced the reported 10-20 second
    -- wait, not any single slow step. streamPreviewLocation() is side-effect-safe to call twice:
    -- by the time setupPreviewCam() calls it again for real, it usually finds everything already
    -- streamed in and returns in a frame or two instead of waiting out its own 8-second timeout.
    -- See the [bootTiming] prints below if the wait is still long after this - they'll show
    -- exactly which stage it's actually going to.
    CreateThread(streamPreviewLocation)

    local bootStart = GetGameTimer()
    local function bootMark(label)
        print(('[bootTiming] %s at +%dms'):format(label, GetGameTimer() - bootStart))
    end
    bootMark('parked ped, streaming kicked off')

    -- loadscreen.cfg has externalShutdown=true, meaning it will NOT hide itself automatically -
    -- whichever character-creation script is active is expected to do this. Stock qbx_core used
    -- to; now that useExternalCharacters=true disables that, it's on us instead.
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
    bootMark('loading screen shut down, opening select screen')

    openSelectScreen(bootMark)
    bootMark('select screen open, camera faded in')

    -- Mirrors qbx_core's own safety net: SetEntityInvincible alone is unreliable, so keep
    -- re-applying it for as long as we're isolated in the tutorial session.
    CreateThread(function()
        while NetworkIsInTutorialSession() do
            SetEntityInvincible(PlayerPedId(), true)
            Wait(250)
        end
        SetEntityInvincible(PlayerPedId(), false)
    end)
end)
