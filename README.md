# How to use:

1. Set project name:
```bash
MY_PROJECT=my-project
```

2. Install:
```bash
git clone --depth=1 --branch=master git@github.com:elderapo/ts-node-starter.git $MY_PROJECT
cd $MY_PROJECT
sed -i -- "s/ts-node-starter/$MY_PROJECT/g" ./package.json
rm -rf .git
git init
git add .
git commit -m "Init"
yarn
yarn start
```
