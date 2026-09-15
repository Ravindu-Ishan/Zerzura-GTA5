fx_version 'cerulean'
game 'gta5'

description 'ZERZURA - custom character selection & creation (replaces qbx_core internal flow)'
version '0.4.1'

shared_script '@ox_lib/init.lua'

client_scripts {
    'client/config.lua',
    'client/tattoos.lua',
    'client/main.lua',
}

server_scripts {
    'server/main.lua',
}

ui_page 'web/out/index.html'

files {
    'web/out/index.html',
    'web/out/**/*',
}

lua54 'yes'
