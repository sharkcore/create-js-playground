#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const shell = require('shelljs');

const MAKEFILE = `any: build

node_modules: package.json
	yarn

build: node_modules
	./node_modules/.bin/babel src -d lib --watch
`;

const BABELRC = `{
  presets: [
    ['flow'],
    [
      'env',
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: true,
      },
    ],
  ],
}`;

const DEVDEPS = ['babel-cli', 'babel-core', 'babel-preset-env'];

const argv = require('yargs')
    .options({
        appName: {
            type: 'string',
            describe: 'name of app',
        },
    })
    .help().argv;

const appDir = path.join(process.cwd(), argv.appName);

shell.mkdir(appDir);
shell.cd(appDir);

shell.mkdir('src');
shell.touch('src/index.js');

if (shell.exec('yarn init --yes').code !== 0) {
    shell.echo('Error: yarn failed');
    shell.exit(1);
}

if (shell.exec(`yarn add ${DEVDEPS.join(' ')} --dev`).code !== 0) {
    shell.echo('Error: yarn add deps failed');
    shell.exit(1);
}

shell.ShellString(MAKEFILE).to('Makefile');
shell.ShellString(BABELRC).to('.babelrc');
