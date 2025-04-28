from cx_Freeze import setup, Executable
import sys
import os

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {
    "packages": [
        "os", 
        "flask",
        "cryptography",
        "requests",
        "psutil",
        "multiprocessing"
    ],
    "excludes": [],
    "include_files": [
        ("ikabot-7.1.9/ikabot/locale", "ikabot/locale"),
        ("ikabot-7.1.9/ikabot/helpers", "ikabot/helpers"),
        ("ikabot-7.1.9/ikabot/function", "ikabot/function"),
        ("ikabot-7.1.9/ikabot/web", "ikabot/web")
    ]
}

base = 'Console'

executables = [
    Executable(
        "ikabot-7.1.9/ikabot/command_line.py",
        base=base,
        target_name="ikabot-multi.exe",
        icon="ikabot-7.1.9/assets/banner.png"
    )
]

setup(
    name="ikabot-multi",
    version="7.1.9",
    description="Multi-account Ikabot",
    options={"build_exe": build_exe_options},
    executables=executables
)
