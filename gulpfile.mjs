//const path = require('path');
import gulp from 'gulp';

import { obj as through } from 'through2';
//const through = require('through2').obj;

import File from 'vinyl';

import minimist from 'minimist';
const args = minimist(process.argv.slice(2));
//const args = require('minimist')(process.argv.slice(2));

import browserSyncModule from 'browser-sync';
const sync = browserSyncModule.create();
// const sync = require('browser-sync').create();

import sourcemaps from 'gulp-sourcemaps';

//sass

import gulpSassModule from 'gulp-sass'; // compiles SCSS to CSS
import * as sassModule from 'sass';
const sass = gulpSassModule(sassModule);
//const sass = require('gulp-sass')(require('sass')); // compiles SCSS to CSS

import postcss from 'gulp-postcss'; // runs autoprefixer and cssnano
import autoprefixer from 'autoprefixer'; //adds vendor prefixes to CSS
import cssnano from 'cssnano'; // minifies CSS
//typescript
import tsGulp from 'gulp-typescript';
//html
import cheerio from 'cheerio';
import htmlMinifierModule from 'html-minifier';
const htmlMinifier = htmlMinifierModule.minify;

import { makeDomi } from './.dist-tsc/utils/vdom-server-language.js';
//const { makeDomi } = require('./.build/js/content-ui/dev/dom-language.js');

const isProduction = args.type === 'production';
const noSCSSMaps = true;

const rootDest = './.build';
const srcRoot = './src/content-ui';

const srcFolderDev = `${srcRoot}/dev`;
const srcFolderUi = './.build/content-ui';
const srcFolderAssets = `${srcRoot}/assets`;
const srcImages = `${srcRoot}/assets/src/images`;

const srcServer = `${srcRoot}/test-server`;
const dstServerBuild = './.build/js';
const dstServer = `${dstServerBuild}/test-server`;

const paths = {
    // src: './js/**/*.{html,ts}',
    styles: {
        //src: `${srcFolderAssets}/css/*.scss`,
        // dest: `${rootDest}/css`,
    },
    scripts: {
        //srcDev: `${rootDest}/**/*.js`,
        //dest: rootDest
    },
    // html: {
    //     src: `${srcFolderAssets}/html/*.html`,
    //     dest: `${rootDest}/html`,
    // },
    // dev: {
    //     src: `${srcFolderDev}/*.html`,
    // },
    sync: {
        browser: '%LOCALAPPDATA%/Google/Chrome SxS/Application/chrome.exe',
        //dest: './.build',
    },
};

function removeIndent(src, all) {
    // 1. if defined all then remove all indentation from each line
    if (all) {
        return src.replace(/^[^\S\n]+/gm, '');
    }

    // 2. remove the shortest leading indentation from each line
    const match = src.match(/^[^\S\n]*(?=\S)/gm);
    const indent = match && Math.min(...match.map(el => el.length));
    if (indent) {
        const regexp = new RegExp(`^.{${indent}}`, 'gm');
        return src.replace(regexp, '');
    }
    return src;
}

function addIndent(src, indent) {
    return src.replace(/^([^\S\n]*)/gm, function (match, p1) {
        return indent + p1;
    });
}

function removeFirstIndent(src) {
    return src.replace(/^[^\S]+/, '');
}

// Typescript

let tsProject;

function typescriptTask() {
    !tsProject && (tsProject = tsGulp.createProject('tsconfig.components.json'));
    return tsProject
        .src()
        .pipe(tsProject())
        .pipe(gulp.dest(rootDest));
}

function skipEmptyPipe() {
    return through(function transform(file, enc, callback) {
        file.contents.length ? callback(null, file) : callback();
    });
}

function traceTaskPipe() {
    return through(function transform(file, enc, callback) {
        console.log('trace task filename:', file.basename);
        callback(null, file);
    });
}

// SASS, HTML template pipes

function scssPipes(src, noMaps = true) {
    return gulp
        .src(src)
        .pipe(noMaps ? through() : sourcemaps.init())
        .pipe(sass())
        .pipe(postcss([
            autoprefixer({ overrideBrowserslist: ['last 3 Chrome versions', 'last 4 Firefox versions'] }),
            cssnano({ zindex: false }) // OK 'reduceIdents: false' but animation is not included //, discardUnused: false, reduceIdents: false
        ]))
        .pipe(noMaps ? through() : sourcemaps.write('.'))
        .pipe(skipEmptyPipe());
}

function htmlTemplatePipes(src) {
    function getTemplateBody() {
        return through(function transform(file, enc, callback) {
            let cnt = file.contents.toString();

            let $ = cheerio.load(cnt);
            let txt = $('.web-component').html();
            txt = txt.replace(/^[\r\n]/, '');
            txt = removeIndent(txt);
            txt = htmlMinifier(txt, { removeAttributeQuotes: true, collapseWhitespace: true, removeComments: true });
            file.contents = Buffer.from(txt);

            callback(null, file);
        });
    }
    return gulp
        .src(src)
        .pipe(getTemplateBody())
        .pipe(skipEmptyPipe());
}

function copyTestHtml() {
    return gulp
        .src([`${srcFolderDev}/index.html`])
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(srcFolderUi));
}

// WebComp Dev resources

function collectedToGenerated(cnt) {

    const renameKeys = obj => {
        const renameKey = key => {
            let m = /(dp|hp)-(.+)/.exec(key);
            return `${m[2]}${m[1].toUpperCase()}`;
        };

        let rv = {};
        Object.keys(obj).forEach(key => rv[renameKey(key)] = obj[key]);
        return rv;
    };

    cnt.css = renameKeys(cnt.css);
    cnt.dom = renameKeys(cnt.dom);

    let resMapCss = removeFirstIndent(addIndent(JSON.stringify(cnt.css, null, 4), '    '));
    let resMapDom = removeFirstIndent(addIndent(JSON.stringify(cnt.dom, null, 4), '    '));

    let prolog = removeIndent(`
            function unbrandWCR(brand) { // WCR - WebCompRes`);

    let epilog = removeIndent(`
            const mapped = {
                dp: {
                    ico: {
                        css: css.icoDP,
                        dom: dom.icoDP
                    },
                    lit: {
                        css: css.litDP,
                        dom: dom.litDP
                    },
                    fbm: {
                        css: css.fbmDP
                    },
                    fbb: {
                        css: css.fbbDP,
                        dom: dom.fbbDP
                    }
                },
                hp: {
                    ico: {
                        css: css.icoDP,
                        dom: dom.icoHP
                    },
                    lit: {
                        css: css.litDP,
                        dom: dom.litDP
                    },
                    fbm: {
                        css: css.fbmDP
                    },
                    fbb: {
                        css: css.fbbDP,
                        dom: dom.fbbDP
                    }
                }
            };
            return mapped[brand];
        } //unbrandWCR()
    `);

    let final = `${prolog}\n    const css = ${resMapCss};\n    const dom = ${resMapDom};${epilog}`;

    return final;
}

function filenameToKey(name) {
    let m = /(dp-(?:fbi|fbb|fbm|ico|lit))/.exec(name);
    if (m) {
        return m[0];
    }
    m = /logo-4-domi-(dp|hp)/.exec(name);
    if (m) {
        return `${m[1]}-ico`;
    }
    return name;
}

const sources = {
    html: [
        `${srcFolderAssets}/html/template-dp-fbb.html`,
        `${srcFolderAssets}/html/template-dp-fbi.html`,
        `${srcFolderAssets}/html/template-dp-fbm.html`,
        `${srcFolderAssets}/html/template-dp-lit.html`,
        `${srcFolderAssets}/html/template-dp-ico.html`,
    ],
    css: [
        `${srcFolderAssets}/css/dp-ico.scss`,
        //`${srcFolderAssets}/css/hp-ico.scss`,
        `${srcFolderAssets}/css/dp-fbi.scss`,
        `${srcFolderAssets}/css/dp-fbm.scss`,
        `${srcFolderAssets}/css/dp-fbb.scss`,
        `${srcFolderAssets}/css/dp-lit.scss`,
    ],
    svg: [
        `${srcImages}/logo-4-domi-dp.svg`,
        `${srcImages}/logo-4-domi-hp.svg`,
    ],
};

function quoPck(src) {
    // 0. If has single quotas return as it is, otherwise replace " to ' and add {~} as prefix.
    return /'/.test(src) ? src : `{~}${src.replace(/"/g, '\'')}`;
}
function quoUnp(src) {
    // 0 Unpack quotas: remove {~} prefix and return back double quotas.
    return /^{~}/.test(src) ? src.slice(3).replace(/'/g, '"') : src;
}

function createDevResourcesTask(done) {
    const webComponents = {
        dom: {},
        css: {},
        svg: {},
    };

    function htmlTemplates() {
        webComponents.dom = {};
        return htmlTemplatePipes(sources.html)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.dom[key] = file.contents.toString();
                callback();
            }));
    }

    function cssTemplates() {
        webComponents.css = {};
        return scssPipes(sources.css, noSCSSMaps)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.css[key] = file.contents.toString();
                callback();
            }));
    }

    function svgTemplates() {
        webComponents.svg = {};
        return gulp.src(sources.svg)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.svg[key] = file.contents.toString();
                callback();
            }));
    }

    function prepareFileContent(cnt) {
        // 1. html
        for (let key of Object.keys(cnt.dom)) {
            cnt.dom[key] = quoPck(makeDomi(cnt.dom[key], 'body'));
        }
        // 2. svg
        for (let key of Object.keys(cnt.svg)) {
            cnt.dom[key] = quoPck(makeDomi(cnt.svg[key], 'svg'));
        }
        delete cnt.svg;

        let txt = collectedToGenerated(cnt);
        return txt;
    }

    function outTemplates() {
        return gulp.src('.').pipe(through(function transform(file, enc, callback) {
            let newFile = new File({
                contents: Buffer.from(prepareFileContent(webComponents)),
                base: process.cwd(),
                path: process.cwd() + '/webcomp-res.js'
            });
            this.push(newFile);
            callback();
        })).pipe(gulp.dest(srcFolderUi));
    }

    return gulp.series(gulp.parallel(htmlTemplates, cssTemplates, svgTemplates), outTemplates)(done);
}

// Reload

function reloadTask(done) {
    sync.reload();
    done();
}

function watch() {
    sync.init({
        server: {
            baseDir: './.build',
            index: `/content-ui/index.html`
        },
        notify: false,
        browser: paths.sync.browser
    });

    gulp.watch(
        [
            `${srcFolderDev}/*.html`,
        ],
        gulp.series(copyTestHtml, reloadTask)
    );

    gulp.watch(
        [
            `${srcFolderAssets}/css/*.scss`,
            `${srcFolderAssets}/html/*.html`,
            `${dstServerBuild}/**/*.js`,
            `!${srcFolderUi}/webcomp-res.js`,
        ],
        gulp.series(createDevResourcesTask, reloadTask)
    );
}

// Exports for extension build

// exports.ts = typescriptTask;
// exports.copy = copyTestHtml;
// exports.res = (done) => createDevResourcesTask(done);
// exports.build = (done) => gulp.series(createDevResourcesTask, copyTestHtml)(done);
// exports.default = (done) => gulp.series(createDevResourcesTask, copyTestHtml, watch)(done);

export const ts = typescriptTask;
export const copy = copyTestHtml;
export const res = (done) => createDevResourcesTask(done);
export const build = (done) => gulp.series(createDevResourcesTask, copyTestHtml)(done);
export default (done) => gulp.series(createDevResourcesTask, copyTestHtml, watch)(done);

//#region Test Server

function srv_copyHtml() {
    return gulp
        .src([`${srcServer}/public/index.html`])
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(`${dstServer}`));
}

function srv_copySass() {
    return scssPipes(`${srcServer}/public/*.scss`, noSCSSMaps)
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(`${dstServer}`));
}

function srv_static() {
    return gulp
        .src([
            `${srcServer}/public/thirdparties/vue.js`,
            `${srcServer}/public/thirdparties/vue-composition-api.umd.js`,
        ])
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(`${dstServer}/thirdparties`));
}

function srv_staticB() {
    return gulp
        .src([`${srcServer}/public/favicon.png`])
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(`${dstServer}`));
}

function srv_watch() {
    sync.init({
        server: {
            baseDir: `${dstServer}`,
            index: 'index.html'
        },
        notify: false,
        browser: paths.sync.browser
    });

    gulp.watch(
        [
            `${srcServer}/public/*.html`,
        ],
        gulp.series(srv_copyHtml, reloadTask)
    );

    gulp.watch(
        [
            `${srcServer}/**/*.scss`,
        ],
        gulp.series(srv_copySass, reloadTask)
    );

    gulp.watch(
        [
            `${dstServer}/*.js`, // but not thirdparties (i.e. wo/ vue.js, and composition API). tsc -w will produce js from ts
        ],
        gulp.series(reloadTask)
    );
}

//#endregion Test Server

// Exports for test-server build

// exports.testServer = (done) => gulp.series(srv_static, srv_staticB, srv_copySass, srv_copyHtml, srv_watch)(done);
export const testServer = (done) => gulp.series(srv_static, srv_staticB, srv_copySass, srv_copyHtml, srv_watch)(done);
