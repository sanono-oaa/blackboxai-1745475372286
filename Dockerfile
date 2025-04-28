FROM python:3.10-windowsservercore

# Install dependencies
RUN pip install --upgrade pip && \
    pip install pyinstaller requests cryptography psutil flask

# Copy the application files
COPY ikabot-7.1.9 /app/ikabot-7.1.9

# Set working directory
WORKDIR /app

# Create spec file
RUN echo "# -*- mode: python ; coding: utf-8 -*-" > ikabot.spec && \
    echo "a = Analysis(['ikabot-7.1.9/ikabot/command_line.py']," >> ikabot.spec && \
    echo "    pathex=[]," >> ikabot.spec && \
    echo "    binaries=[]," >> ikabot.spec && \
    echo "    datas=[" >> ikabot.spec && \
    echo "        ('ikabot-7.1.9/ikabot/locale', 'ikabot/locale')," >> ikabot.spec && \
    echo "        ('ikabot-7.1.9/ikabot/helpers', 'ikabot/helpers')," >> ikabot.spec && \
    echo "        ('ikabot-7.1.9/ikabot/function', 'ikabot/function')," >> ikabot.spec && \
    echo "        ('ikabot-7.1.9/ikabot/web', 'ikabot/web')" >> ikabot.spec && \
    echo "    ]," >> ikabot.spec && \
    echo "    hiddenimports=['flask', 'cryptography', 'requests', 'psutil']," >> ikabot.spec && \
    echo "    hookspath=[]," >> ikabot.spec && \
    echo "    runtime_hooks=[]," >> ikabot.spec && \
    echo "    excludes=[]," >> ikabot.spec && \
    echo "    noarchive=False)" >> ikabot.spec && \
    echo "pyz = PYZ(a.pure)" >> ikabot.spec && \
    echo "exe = EXE(pyz," >> ikabot.spec && \
    echo "    a.scripts," >> ikabot.spec && \
    echo "    a.binaries," >> ikabot.spec && \
    echo "    a.zipfiles," >> ikabot.spec && \
    echo "    a.datas," >> ikabot.spec && \
    echo "    name='ikabot-multi'," >> ikabot.spec && \
    echo "    debug=False," >> ikabot.spec && \
    echo "    strip=False," >> ikabot.spec && \
    echo "    upx=True," >> ikabot.spec && \
    echo "    console=True)" >> ikabot.spec

# Build the executable
CMD ["pyinstaller", "--clean", "ikabot.spec"]
