// @ts-check
import gulp from 'gulp';

import { obj as through } from 'through2';

import File from 'vinyl';

import minimist from 'minimist';
const args = minimist(process.argv.slice(2));

import browserSyncModule from 'browser-sync';
const sync = browserSyncModule.create();

import sourcemaps from 'gulp-sourcemaps';

//sass

import gulpSassModule from 'gulp-sass'; // compiles SCSS to CSS
import * as sassModule from 'sass';
const sass = gulpSassModule(sassModule);

import postcss from 'gulp-postcss'; // runs autoprefixer and cssnano
import autoprefixer from 'autoprefixer'; //adds vendor prefixes to CSS
import cssnano from 'cssnano'; // minifies CSS
//typescript
import tsGulp from 'gulp-typescript';
//html
import cheerio from 'cheerio';
import htmlMinifierModule from 'html-minifier';
const htmlMinifier = htmlMinifierModule.minify;

import { quoPck, removeIndent, removeFirstIndent, addIndent } from 'pm-xtn-dom/es6';
import { makeDomi } from 'pm-xtn-dom/builder';

const isProduction = args.type === 'production';
const noSCSSMaps = true;

const rootDest = './.build';
const srcRoot = './src/csui-res';

const srcFolderDev = `${srcRoot}/dev`;
const dstGenerated = './dist';
const devGenerated = './.build';
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

// WebComp Dev resources

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
    const accWebComponents = {
        dom: {},
        css: {},
        svg: {},
    };

    const tasks =
        gulp.series(
            gulp.parallel(
                htmlTemplatesTask,
                cssTemplatesTask,
                svgTemplatesTask
            ),
            outTemplatesTask,
        )(done);

    return tasks;

    function htmlTemplatesTask() {
        accWebComponents.dom = {};
        return htmlTemplatePipes(webResourceSources.html)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                accWebComponents.dom[key] = file.contents.toString();
                callback();
            }));

        function htmlTemplatePipes(src) {
            function getTemplateBody() {
                return through(function transform(file, enc, callback) {
                    let cnt = file.contents.toString();

                    let $ = cheerio.load(cnt);
                    let txt = $('.web-component').html() || '';
                    // if (!txt) {
                    //     throw new Error('No .web-component html element found in ' + file.path);
                    // }
                    txt = txt.replace(/^[\r\n]/, '');
                    txt = removeIndent(txt, false);
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
        accWebComponents.css = {};
        return scssPipes(webResourceSources.css, noSCSSMaps)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                accWebComponents.css[key] = file.contents.toString();
                callback();
            }));

        function scssPipes(src, noMaps = true) {
            return gulp
                .src(src)
                .pipe(noMaps ? through() : sourcemaps.init())
                .pipe(sass())
                .pipe(postcss([
                    autoprefixer({ overrideBrowserslist: ['last 3 Chrome versions', 'last 4 Firefox versions'] }),
                    //cssnano({ zindex: false }) // OK 'reduceIdents: false' but animation is not included //, discardUnused: false, reduceIdents: false
                    cssnano()
                ]))
                .pipe(noMaps ? through() : sourcemaps.write('.'))
                .pipe(skipEmptyPipe());
        }
    }

    function svgTemplatesTask() {
        accWebComponents.svg = {};
        return gulp
            .src(webResourceSources.svg)
            .pipe(through((file, enc, callback) => {
                let key = filenameToKey(file.stem);
                accWebComponents.svg[key] = file.contents.toString();
                callback();
            }));
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

    function outTemplatesTask() {
        return gulp.src('.').pipe(through(function transform(file, enc, callback) {

            const newContent = prepareFileContent(accWebComponents);

            const outBase = process.cwd();
            //console.log('---------------------------outBase', outBase);

            let newFileJs = new File({
                contents: Buffer.from(newContent.js),
                base: outBase,
                path: outBase + '/webcomp-res.js'
            });
            this.push(newFileJs);

            let newFileTs = new File({
                contents: Buffer.from(newContent.ts),
                base: outBase,
                path: outBase + '/webcomp-res.ts'
            });
            this.push(newFileTs);

            callback();
        })).pipe(gulp.dest(dstGenerated));

        function prepareFileContent(allWebComponents) {
            // 1. html
            for (let key of Object.keys(allWebComponents.dom)) {
                allWebComponents.dom[key] = quoPck(makeDomi(allWebComponents.dom[key], 'body'));
            }

            // 2. svg
            for (let key of Object.keys(allWebComponents.svg)) {
                allWebComponents.dom[key] = quoPck(makeDomi(allWebComponents.svg[key], 'svg'));
            }
            delete allWebComponents.svg;

            const res = collectedToGenerated(allWebComponents);
            return res;
        }

        function collectedToGenerated(allWebComponents) {

            allWebComponents.css = renameKeys(allWebComponents.css);
            allWebComponents.dom = renameKeys(allWebComponents.dom);

            let partCss = removeFirstIndent(addIndent(JSON.stringify(allWebComponents.css, null, 4), '    '));
            let partDom = removeFirstIndent(addIndent(JSON.stringify(allWebComponents.dom, null, 4), '    '));

            return {
                js: makeJsFileContent(partCss, partDom),
                ts: makeTsFileContent(partCss, partDom),
            };

            function renameKeys(obj) {
                function renameKey(key) {
                    const m = /(dp|hp)-(.+)/.exec(key);
                    if (!m){
                        throw new Error('Invalid key: ' + key);
                    }
                    return `${m[2]}${m[1].toUpperCase()}`;
                }

                const rv = {};
                Object.keys(obj).forEach((key) => rv[renameKey(key)] = obj[key]);
                return rv;
            }

            function makeJsFileContent(strCss, strDom) {
                let prolog = removeIndent(`
                    export function unbrandWCR(brand) { // WCR - Web Component Resources by brand`, false);

                let epilog = getEpilog({ withTypes: false });

                let final = `${prolog}\n\n    const css = ${strCss};\n\n    const dom = ${strDom};\n${epilog}`;
                return final;
            }

            function makeTsFileContent(strCss, strDom) {
                let prolog = removeIndent(`
                    export function unbrandWCR(brand: 'dp' | 'hp') { // WCR - Web Component Resources by brand`, false);

                const types = addIndent(removeIndent(`
                        type DomCss = {
                            css?: string;
                            dom?: string;
                        };
                        
                        type DomCss4 = {
                            ico?: DomCss;
                            fbm?: DomCss;
                            fbb?: DomCss;
                            lit?: DomCss;
                        };
                    `, false
                ), '    ');

                let epilog = getEpilog({ withTypes: true });

                let final = `${prolog}\n\n    const css = ${strCss};\n\n    const dom = ${strDom};\n${types}${epilog}`;
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
                `, false
                );
            }

        } //collectedToGenerated()

    } //outTemplatesTask()

} //createDevResourcesTask()

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
        .pipe(gulp.dest(devGenerated));

    function traceTaskPipe() {
        return through(function transform(file, enc, callback) {
            console.log('trace task filename:', file.basename);
            callback(null, file);
        });
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
            `!${dstGenerated}/webcomp-res.ts`,
            `!${dstGenerated}/webcomp-res.js`,
        ],
        gulp.series(createDevResourcesTask, reloadTask)
    );
}

export const ts = typescriptTask;
export const copy = copyTestHtmlTask;
export const res = (done) => createDevResourcesTask(done);
export const build = (done) => gulp.series(createDevResourcesTask, copyTestHtmlTask)(done);
export default (done) => gulp.series(createDevResourcesTask, copyTestHtmlTask, watchTask)(done);
