#!/usr/bin/env node

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const Listr = require('listr');
const shell = require('shelljs');
const Yargs = require('yargs');

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

async function makeGitRepo(appDir) {
    await exec(`git init ${appDir}`);
}

async function initYarn(appDir) {
    await exec('yarn init --yes', {
        cwd: appDir,
        stdio: ['ignore', 'ignore', 'ignore'],
    });
}

async function addYarnDevDeps(appDir) {
    await exec(`yarn add ${DEVDEPS.join(' ')} --dev`, {
        cwd: appDir,
        stdio: ['ignore', 'ignore', 'ignore'],
    });
}

async function addFiles(appDir) {
    shell.cd(appDir);

    shell.mkdir('src');
    shell.touch('src/index.js');

    shell.ShellString(MAKEFILE).to('Makefile');
    shell.ShellString(BABELRC).to('.babelrc');
}

function finish(appDir) {
    // eslint-disable-next-line no-console
    console.log(`
      Congrats! Enjoy your new library here:
      ${appDir}
    `);
}

function generatePlayground(argv) {
    const appDir = path.join(process.cwd(), argv.appName);
    const tasks = new Listr([
        { title: 'Creating git repo', task: makeGitRepo.bind(null, appDir) },
        { title: 'Creating yarn package', task: initYarn.bind(null, appDir) },
        {
            title: 'Adding Yarn Dependencies',
            task: addYarnDevDeps.bind(null, appDir),
        },
        { title: 'Adding files', task: addFiles.bind(null, appDir) },
    ]);

    tasks
        .run()
        .catch(err => {
            // eslint-disable-next-line no-console
            console.error(err);
        })
        .then(() => {
            finish(appDir);
        });
}

function main() {
    const command = Yargs.command('$0 <appName>', 'create', yargs => {
        yargs.positional('appName', {
            describe: 'Name of app',
            type: 'string',
        });
    }).help();

    generatePlayground(command.argv);
}

if (process.env.NODE_ENV !== 'test') {
    main();
}
