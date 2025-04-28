import os
import sys
from auto_py_to_exe import run_auto_py_to_exe

def main():
    # Configure auto-py-to-exe settings
    sys.argv.extend([
        '--noupx',
        '--onefile',
        '--console',
        '--name=ikabot-multi',
        '--add-data=ikabot-7.1.9/ikabot/locale;ikabot/locale',
        '--add-data=ikabot-7.1.9/ikabot/helpers;ikabot/helpers',
        '--add-data=ikabot-7.1.9/ikabot/function;ikabot/function',
        '--add-data=ikabot-7.1.9/ikabot/web;ikabot/web',
        '--hidden-import=flask',
        '--hidden-import=cryptography',
        '--hidden-import=requests',
        '--hidden-import=psutil',
        'ikabot-7.1.9/ikabot/command_line.py'
    ])
    
    run_auto_py_to_exe()

if __name__ == '__main__':
    main()
