# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['ikabot-7.1.9/ikabot/command_line.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('ikabot-7.1.9/ikabot/locale', 'ikabot/locale'),
        ('ikabot-7.1.9/ikabot/helpers', 'ikabot/helpers'),
        ('ikabot-7.1.9/ikabot/function', 'ikabot/function'),
        ('ikabot-7.1.9/ikabot/web', 'ikabot/web')
    ],
    hiddenimports=[
        'flask',
        'cryptography',
        'requests',
        'psutil',
        'multiprocessing',
        'configparser',
        'json',
        'datetime'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ikabot-multi',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
