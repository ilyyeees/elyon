#!/bin/bash

# elyon linux setup script
# usage: place this script next to the downloaded AppImage and run it.

APP_NAME="Elyon"
INSTALL_DIR="$HOME/.local/share/elyon"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons"
ICON_URL="https://raw.githubusercontent.com/ilyyeees/elyon/main/src/assets/logo%20icon.png"

# find appimage
APPIMAGE=$(find . -maxdepth 1 -name "Elyon-*.AppImage" | head -n 1)

if [ -z "$APPIMAGE" ]; then
    # check dist folder (dev mode)
    APPIMAGE=$(find dist -maxdepth 1 -name "Elyon-*.AppImage" 2>/dev/null | head -n 1)
fi

if [ -z "$APPIMAGE" ]; then
    echo "error: could not find Elyon-*.AppImage in current directory."
    echo "please download it from releases and place it next to this script."
    exit 1
fi

echo "installing $APPIMAGE..."

# create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$DESKTOP_DIR"
mkdir -p "$ICON_DIR"

# copy appimage
cp "$APPIMAGE" "$INSTALL_DIR/elyon.AppImage"
chmod +x "$INSTALL_DIR/elyon.AppImage"

# get icon
if [ -f "src/assets/logo icon.png" ]; then
    cp "src/assets/logo icon.png" "$ICON_DIR/elyon.png"
else
    echo "downloading icon..."
    curl -sL "$ICON_URL" -o "$ICON_DIR/elyon.png"
fi

# create desktop entry
cat > "$DESKTOP_DIR/elyon.desktop" << EOF
[Desktop Entry]
Name=Elyon
Comment=Email Deployment Command Station
Exec=$INSTALL_DIR/elyon.AppImage --no-sandbox
Icon=$ICON_DIR/elyon.png
Terminal=false
Type=Application
Categories=Utility;Network;Email;
StartupWMClass=elyon
EOF

# update desktop database
update-desktop-database "$DESKTOP_DIR" 2>/dev/null

echo "✓ elyon installed successfully!"
echo "you can now find it in your applications menu."
