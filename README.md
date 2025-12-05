# elyon

a tactical command station for personalized bulk email deployment.

## capabilities

- **secure authentication**: connects directly to smtp servers (gmail, outlook, etc.) using standard protocols and app passwords.
- **data ingestion**: parses csv datasets to generate dynamic recipient lists and variable contexts.
- **dynamic templating**: utilizes a jinja2-based engine to inject recipient-specific data (e.g., `{{ name }}`, `{{ company }}`) into email subjects and bodies.
- **html support**: accepts raw html templates for rich email layouts and styling.
- **transmission preview**: renders accurate previews of outgoing messages, verifying variable substitution and layout before transmission.
- **visual monitoring**: features a real-time 3d visualization interface to track deployment progress and status.

## download & install

go to the [releases page](https://github.com/ilyyeees/elyon/releases) to download the latest version.

### windows
1. download `Elyon.Setup.1.0.0.exe`
2. run the installer
3. launch elyon from your start menu

### linux
**option 1: portable (terminal)**
due to electron sandbox restrictions on some systems, the appimage must be run with a flag:
1. download `Elyon-1.0.0.AppImage`
2. open terminal in the download folder
3. make executable: `chmod +x Elyon-1.0.0.AppImage`
4. run: `./Elyon-1.0.0.AppImage --no-sandbox`

**option 2: install to menu (recommended)**
this script installs the app and handles the flags for you:
1. download `Elyon-1.0.0.AppImage`
2. download `linux-setup.sh` from this repo
3. place them in the same folder
4. run: `chmod +x linux-setup.sh && ./linux-setup.sh`
5. launch "elyon" from your applications menu

## building from source

requirements:
- node.js
- python 3.x

```bash
git clone git@github.com:ilyyeees/elyon.git
cd elyon
npm install
cd python_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
npm start
```

## license

mit
