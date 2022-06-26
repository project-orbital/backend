#!/bin/sh
BRANCH="${1:-dev}"

echo "Updating Git submodules from branch \`$BRANCH\`..."
git submodule update
git submodule foreach git checkout $BRANCH
git submodule foreach git pull origin $BRANCH
echo "Git submodules updated."

echo "Compiling parser to .wasm..."
cd parser || exit
wasm-pack build --target nodejs
echo "Parser compiled."

echo "Installing dependencies..."
npm install
echo "Dependencies installed."

if [ $BRANCH = dev ]
then
  echo "Starting server using nodemon..."
  npm start
else
  echo "Starting server using pm2..."
  pm2 start ~/backend/src/server.js
fi

exit
