@echo off
echo Creating Virtual Environment...

python -m venv virtualstk

echo Activating venv and installing packages...
call virtualstk\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt

echo ✅ Setup Complete! Use this command to activate:
echo virtualstk\Scripts\activate
pause