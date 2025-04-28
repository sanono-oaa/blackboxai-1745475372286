import PyInstaller.__main__
import sys
import os

# Add any additional data files or dependencies here
additional_files = [
    ('ikabot-7.1.9/ikabot/locale', 'ikabot/locale'),
    ('ikabot-7.1.9/ikabot/helpers', 'ikabot/helpers'),
    ('ikabot-7.1.9/ikabot/function', 'ikabot/function'),
    ('ikabot-7.1.9/ikabot/web', 'ikabot/web'),
]

PyInstaller.__main__.run([
    'ikabot-7.1.9/ikabot/command_line.py',
    '--name=ikabot-multi',
    '--onefile',
    '--console',
    '--clean',
    '--add-data=ikabot-7.1.9/ikabot/locale;ikabot/locale',
    '--add-data=ikabot-7.1.9/ikabot/helpers;ikabot/helpers',
    '--add-data=ikabot-7.1.9/ikabot/function;ikabot/function',
    '--add-data=ikabot-7.1.9/ikabot/web;ikabot/web',
    '--hidden-import=flask',
    '--hidden-import=cryptography',
    '--hidden-import=requests',
    '--hidden-import=psutil',
])
