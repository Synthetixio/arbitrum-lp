#!/usr/bin/env bash

pushd .

cd ~/WebstormProjects/arbitrum-lp/liquidity/ui
export GIT_SHA=$(git log --pretty=format:"%h" --date=unix -1)

echo "Start building the project..."

yarn build

rm -rf ~/WebstormProjects/perps-pub/dist
cp -R ~/WebstormProjects/arbitrum-lp/liquidity/ui/dist ~/WebstormProjects/perps-pub/dist

cd ~/WebstormProjects/perps-pub

git add .
git commit -m "Dev Join $GIT_SHA"
git push

popd
