#!/bin/sh
BRANCH="${1:-dev}"

echo "Updating Git submodules from branch \`$BRANCH\`..."
git submodule update
git submodule foreach git checkout $BRANCH
git submodule foreach git pull origin $BRANCH
echo "Git submodules updated."

echo "Entering parser submodule"
cd parser || exit
echo "Compiling parser to .wasm..."
wasm-pack build --target nodejs
echo "Parser compiled."

echo "Installing dependencies..."
npm install
echo "Dependencies installed."

cd ..
cp ../secrets/.env ./src

if [ $BRANCH = dev ]
then
  echo "Starting server using nodemon..."
  npm start
else
  echo "Starting server using pm2..."
  pm2 restart --update-env /var/www/dollarplanner.live/backend/src/server.js
fi

exit
