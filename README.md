# elyon

a desktop application for sending personalized bulk emails.

## what it does

- upload a csv file with recipient data
- write an email template using `{{ variable }}` placeholders
- preview the rendered email before sending
- send personalized emails to all recipients

## download & install

go to the [releases page](https://github.com/ilyyeees/elyon/releases) to download the latest version.

### windows
1. download `Elyon.Setup.1.0.0.exe`
2. run the installer
3. launch elyon from your start menu

### linux
**option 1: portable (easiest)**
1. download `Elyon-1.0.0.AppImage`
2. right-click -> properties -> permissions -> allow executing file as program
3. double-click to run

**option 2: install to menu**
if you want elyon in your application menu:
1. download `Elyon-1.0.0.AppImage`
2. download `linux-setup.sh` from this repo (or create it)
3. place them in the same folder
4. run: `chmod +x linux-setup.sh && ./linux-setup.sh`

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
