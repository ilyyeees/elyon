# elyon

a desktop application for sending personalized bulk emails.

## what it does

- upload a csv file with recipient data
- write an email template using `{{ variable }}` placeholders
- preview the rendered email before sending
- send personalized emails to all recipients

## download

### linux
1. download `Elyon-1.0.0.AppImage` from releases
2. make it executable: `chmod +x Elyon-1.0.0.AppImage`
3. run it: `./Elyon-1.0.0.AppImage --no-sandbox`

to install to your applications menu:
```bash
./install.sh
```

### windows
1. download `Elyon-Setup-1.0.0.exe` from releases
2. run the installer
3. launch from start menu

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

to build installers:
```bash
# compile python backend first
source python_backend/venv/bin/activate
cd python_backend && pyinstaller --onefile --name backend app.py && cd ..

# build for your platform
npm run dist:linux
npm run dist:win
npm run dist:mac
```

## usage

1. authenticate with your smtp credentials (gmail uses app passwords)
2. upload a csv file containing recipient data
3. select which column contains email addresses
4. write your email subject and body using `{{ column_name }}` for personalization
5. preview to check the rendered output
6. send

## license

mit
