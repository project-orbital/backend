#!/bin/sh
BRANCH="${1:=dev}"

echo "Updating Git submodules from branch \`$BRANCH\`..."
git submodule update
git submodule foreach git checkout $BRANCH
git submodule foreach git pull origin $BRANCH
echo "Git submodules updated."

echo "Compiling parser to .wasm..."
cd parser || exit
wasm-pack build --target nodejs
echo "Parser compiled."

exit
