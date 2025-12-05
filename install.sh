#!/bin/bash

APP_NAME="Elyon"
INSTALL_DIR="$HOME/.local/share/elyon"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons"

echo "Installing Elyon..."

mkdir -p "$INSTALL_DIR"
mkdir -p "$DESKTOP_DIR"
mkdir -p "$ICON_DIR"

cp dist/Elyon-1.0.0.AppImage "$INSTALL_DIR/elyon.AppImage"
chmod +x "$INSTALL_DIR/elyon.AppImage"
cp src/assets/logo\ icon.png "$ICON_DIR/elyon.png"
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

update-desktop-database "$DESKTOP_DIR" 2>/dev/null

echo "✓ elyon installed successfully!"
echo "you can now find it in your applications menu."
