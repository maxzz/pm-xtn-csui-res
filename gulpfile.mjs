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

import { quoPck, makeDomi, removeIndent, removeFirstIndent, addIndent } from 'pm-xtn-dom';
//const { makeDomi } = require('./.build/js/content-ui/dev/dom-language.js');

const isProduction = args.type === 'production';
const noSCSSMaps = true;

const rootDest = './.build';
const srcRoot = './src/csui-res';

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

function skipEmptyPipe() {
    return through(function transform(file, enc, callback) {
        file.contents.length ? callback(null, file) : callback();
    });
}

// Typescript

let tsProject;

function typescriptTask() {
    if (!tsProject) {
        tsProject = tsGulp.createProject('tsconfig.components.json');
    }

    return tsProject
        .src()
        .pipe(tsProject())
        .pipe(gulp.dest(rootDest));
}

function copyTestHtmlTask() {
    return gulp
        .src([`${srcFolderDev}/index.html`])
        .pipe(traceTaskPipe())
        .pipe(gulp.dest(srcFolderUi));

    function traceTaskPipe() {
        return through(function transform(file, enc, callback) {
            console.log('trace task filename:', file.basename);
            callback(null, file);
        });
    }
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

    let finalJs = makeJsFileContent();
    let finalTs = makeTsFileContent();

    return {
        js: finalJs,
        ts: finalTs,
    };

    function makeJsFileContent() {
        let prolog = removeIndent(`
            function unbrandWCRjs(brand) { // WCR - WebCompRes`);

        let epilog = getEpilog({ withTypes: false });

        let final = `${prolog}\n    const css = ${resMapCss};\n    const dom = ${resMapDom};${epilog}`;
        return final;
    }

    function makeTsFileContent() {
        let prolog = removeIndent(`
            export function unbrandWCR(brand: 'dp' | 'hp') { // WCR - Web Component Resources by brand`);

        const types = addIndent(removeIndent(`
                type DomCss = {
                    css?: string;
                    dom?: string;
                }
                
                type DomCss4 = {
                    ico?: DomCss;
                    fbm?: DomCss;
                    fbb?: DomCss;
                    lit?: DomCss;
                }
        `), '    ');

        let epilog = getEpilog({ withTypes: true });

        let final = `${prolog}\n    const css = ${resMapCss};\n    const dom = ${resMapDom};\n${types}${epilog}`;
        return final;
    }

    function getEpilog({ withTypes }) {
        const typ = withTypes ? ': { dp: DomCss4, hp: DomCss4; }' : '';
        return removeIndent(`
            const mapped${typ} = {
                dp: {
                    ico: {
                        css: css.icoDP,
                        dom: dom.icoDP,
                    },
                    lit: {
                        css: css.litDP,
                        dom: dom.litDP,
                    },
                    fbm: {
                        css: css.fbmDP,
                    },
                    fbb: {
                        css: css.fbbDP,
                        dom: dom.fbbDP,
                    }
                },
                hp: {
                    ico: {
                        css: css.icoDP,
                        dom: dom.icoHP,
                    },
                    lit: {
                        css: css.litDP,
                        dom: dom.litDP,
                    },
                    fbm: {
                        css: css.fbmDP,
                    },
                    fbb: {
                        css: css.fbbDP,
                        dom: dom.fbbDP,
                    }
                }
            };
            return mapped[brand];
        } //unbrandWCR()
    `);
    }
}

const webResourceSources = {
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

function createDevResourcesTask(done) {
    const webComponents = {
        dom: {},
        css: {},
        svg: {},
    };

    const tasks =
        gulp.series(
            gulp.parallel(
                htmlTemplatesTask,
                cssTemplatesTask,
                svgTemplatesTask),
            outTemplates
        )(done);

    return tasks;

    function htmlTemplatesTask() {
        webComponents.dom = {};
        return htmlTemplatePipes(webResourceSources.html)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.dom[key] = file.contents.toString();
                callback();
            }));

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
    }

    function cssTemplatesTask() {
        webComponents.css = {};
        return scssPipes(webResourceSources.css, noSCSSMaps)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.css[key] = file.contents.toString();
                callback();
            }));

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
    }

    function svgTemplatesTask() {
        webComponents.svg = {};
        return gulp
            .src(webResourceSources.svg)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                webComponents.svg[key] = file.contents.toString();
                callback();
            }));
    }

    function outTemplates() {
        return gulp.src('.').pipe(through(function transform(file, enc, callback) {

            const newContent = prepareFileContent(webComponents);

            let newFileJs = new File({
                contents: Buffer.from(newContent.js),
                base: process.cwd(),
                path: process.cwd() + '/webcomp-res.js'
            });
            this.push(newFileJs);

            let newFileTs = new File({
                contents: Buffer.from(newContent.ts),
                base: process.cwd(),
                path: process.cwd() + '/webcomp-res.ts'
            });
            this.push(newFileTs);

            callback();
        })).pipe(gulp.dest(srcFolderUi));

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

            const res = collectedToGenerated(cnt);
            return res;
        }
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
}

// Reload

function reloadTask(done) {
    sync.reload();
    done();
}

function watchTask() {
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
        gulp.series(copyTestHtmlTask, reloadTask)
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

export const ts = typescriptTask;
export const copy = copyTestHtmlTask;
export const res = (done) => createDevResourcesTask(done);
export const build = (done) => gulp.series(createDevResourcesTask, copyTestHtmlTask)(done);
export default (done) => gulp.series(createDevResourcesTask, copyTestHtmlTask, watchTask)(done);
