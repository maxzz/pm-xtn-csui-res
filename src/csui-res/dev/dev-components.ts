import { csResVars } from "./copy-of-vars-cs-res-def";
import { IBgResShiled } from "./copy-of-types";
import { DpIco, DpFbi, DpFbm, DpLit, HTMLElementMax, FbbIn, FbbRes, DpFbb, FbbEventType, FbbEvent, FBIType, icoUtl } from "pm-xtn-csui";
import { formatWith } from "pm-xtn-dom/es6";
import { unbrandWCR_Unpacked } from "./dev-components-test-res";

type WCInstances = {
    ico: DpIco[];
    fbi: DpFbi[];
    fbm: DpFbm;
    lit: DpLit;
}

const wcInstances: WCInstances = {
    ico: [], // [...document.querySelectorAll('dp-ico')] as DpIco[];
    fbi: [],
    fbm: null,
    lit: null
};

function getFBM(): DpFbm {
    // this.menu = document.querySelector('dp-fbm');
    // if (!this.menu) {
    //     this.menu = document.createElement('dp-fbm') as DpFbm;
    //     this.menu.setAttribute('id', 'dpmaxz_fbm_gui');
    //     document.body.appendChild(this.menu);
    // }
    if (!wcInstances.fbm) {
        wcInstances.fbm = new DpFbm(csResVars.domCss4.fbm);
        wcInstances.fbm.onCommand = (cmd: string, fieldDid: number) => {
            console.log(`FBI did ${fieldDid} command ${cmd}`);
        };
        wcInstances.fbm.appendMeToDoc();
    }
    return wcInstances.fbm;
}

namespace TestIco {
    export function createlogos() {
        let iconsInDocAlready = [...document.querySelectorAll('dp-ico')] as HTMLElement[];

        wcInstances.ico = iconsInDocAlready.map((iconInDoc: HTMLElement) => {
            let newIco = new DpIco(csResVars.domCss4.ico);
            iconInDoc.replaceWith(newIco.piggy);
            return newIco;
        });
    }
    export function initLogos() {
        wcInstances.ico.forEach(logo => {
            logo.fitted = true;
            logo.state = icoUtl.ILogoState.tlogin;
            logo.dim = { w: 120, h: 120 };
        });
    }
    export function reCreatelogos() {
        let iconsInDocAlready = [...document.querySelectorAll('dp-ico')] as HTMLElement[];

        wcInstances.ico = wcInstances.ico.map((iconInDoc: DpIco) => {
            let el = iconsInDocAlready.find(htmlEl => htmlEl === iconInDoc.piggy);
            if (!el) {
                throw new Error('No documet dp-ico');
            }

            let newIco = new DpIco(csResVars.domCss4.ico);
            el.replaceWith(newIco.piggy);
            return newIco;
        });

        initLogos();
    }
} //namespace TestIco

namespace TestFBI {
    let absID = 1000;
    export function createFBIs() {
        let idxDID = 10;
        let inputs = [...document.querySelectorAll('.test-input')] as HTMLInputElement[];
        inputs.forEach(inputEl => {
            {
                let newFbi = new DpFbi();
                newFbi.init(csResVars.domCss4.ico, inputEl, idxDID++, getFBM());
                newFbi.initIconType(FBIType.tlogin, 't_1574821576');

                newFbi.piggy.id = `${absID++}`;

                wcInstances.fbi.push(newFbi);
            }
            inputEl.id = `${idxDID}`;
        });
    }
    export function reCreateFBIs() {
        // let fbis = [...document.querySelectorAll('dp-fbi')] as DpFbi[];
        // fbis.forEach(_ => _.parentElement.removeChild(_));

        /* 1. Old way when we kept FBI refs globally.
        GLB.fbi.forEach((_: DpFbi) => _.piggy.parentElement.removeChild(_.piggy));
        GLB.fbi = [];
        */
        // 2.
        let fbis = [...document.querySelectorAll('dp-fbi')] as HTMLElementMax<DpFbi>[];
        fbis.forEach(_ => {
            if (!_.maxz) {
                console.log(`%celement without 'maxz' reference`, 'color: red');
            } else {
                _.maxz.destroy();
            }
        });

        createFBIs();
    }
} //namespace TestFBI

namespace TestFBBLocals {
    export function quoPck(src: string) {
        // If has single quotas return as it is, otherwise replace " to ' and add {~} as prefix
        return /'/.test(src) ? src : `{~}${src.replace(/"/g, '\'')}`;
    }

    export function quoUnp(src: string) {
        // Remove {~} prefix and return back double quotas
        return /^{~}/.test(src) ? src.slice(3).replace(/'/g, '"') : src;
    }

    export namespace TestLocalization {
        export class testResShieldCh implements IBgResShiled {
            private testRes = {
                'dpmaxs_txt_title': 'Save password?', //'dpmaxs_txt_title_update': 'Update password?',
                'dpmaxs_txt_ok': 'Save',
                'dpmaxs_txt_no': 'Close',
                'dpmaxs_txt_ne': 'Never',
                'dpmaxs_txt_bodyupd': 'Would you like DigitalPersona Password Manager to save password for www.google.com?',
                'dpmaxs_txt_bodyadd': 'Would you like DigitalPersona Password Manager to save password for www.google.com?',
                'dpmaxz_safeacc': 'dpmaxz_safeacc',
                'dpmaxz_safeurl': 'dpmaxz_safeurl',
                //'': '',
                'fbb_title_new': 'Save password?',
                'fbb_title_upd': 'Update password?',
                'fbb_hint': 'DigitalPersona Password Manager can save password for {website}.',
                'fbb_btn_never_tip': 'Never ask to save password for this website. You can change this option from the DigitalPersona Password Manager User Dashboard.',
                'fbb_field_user': 'Username',
                'fbb_field_pass': 'Password',
                'fbb_btn_save_new': 'Save',
                'fbb_btn_save_upd': 'Update password',
                'fbb_btn_never': 'Never',
            };

            str(id: keyof typeof this.testRes): string { return this.testRes[id]; } //chrome.i18n.getMessage(id);
            url(res: string): string { return ''; } //chrome.extension.getURL(res); //get url
            res(id: keyof typeof this.testRes): string { return this.testRes[id]; } //chrome.i18n.getMessage(id);
        }
    } //namespace TestLocalization

    export let i18n = new TestLocalization.testResShieldCh();

    export function formatRes(s: string): string {
        // 0. The same as formatWith but getting format strings from locale strings.
        return s.replace(/{([\w\$_-]+)}/gm, (match, name) => i18n.str(name) || match);
    }
} //namespace TestFBBLocals

namespace TestFBB {
    export function createFbbIn(): FbbIn {
        let isNew = true;
        let website = 'www.google.com'; //let website = 'www.google.com/update/user/login/verylongname';

        const fbbRes: FbbRes = {
            css: csResVars.domCss4.fbb.css,
            dom: localizeFbbDomi(csResVars.domCss4.fbb.dom, isNew, website)
        };

        const fbbIn: FbbIn = {
            lines: [{ value: 'max', values: ['max', 'maxzz', 'maxzz', 'google.com'] }],
            grbId: 'any123',
            res: fbbRes
        };

        return fbbIn;
    }

    function localizeFbbDomi(domiStr: string, isNew: boolean, website: string): string {
        // 1. select resource strings for 'save' or 'update'.
        let s = domiStr.replace(/_xyz/g, isNew ? '_new' : '_upd');

        // 2. localize all strings.
        s = TestFBBLocals.formatRes(s);

        // 3. replace website name with a separate span.
        const parts = TestFBBLocals.i18n.str('fbb_hint').replace('{website}', '{1}{_}{1}').split('{1}'); // that will give us always 3 parts.
        const indexWebsite = parts.indexOf('{_}');

        let spans = [0, 1, 2].reduce((acc, cur) => {
            acc[`hint-cls-${cur}`] = `hint-${cur !== indexWebsite ? 'text' : 'site'}`; // make classname 'hint-text' or 'hint-site'
            acc[`hint_txt_${cur}`] = cur !== indexWebsite ? parts[cur] : website; // replace '{_}' wiht the real site name
            return acc;
        }, {} as Record<string, string>);

        return formatWith(s, spans);
    }

    let gDpFbb: DpFbb;

    export function updateButtonText(showHide?: boolean) {
        setTimeout(() => {
            if (showHide === undefined) {
                showHide = !gDpFbb;
            }
            (document.querySelector('#showFbb') as HTMLElement).innerText = showHide ? 'Show' : 'Hide';
        }, 0);
    }

    export function destroyFBB() {
        let fbb = gDpFbb;
        if (fbb) {
            fbb.destroy();
            gDpFbb = null;
        }
    }

    export function createFBB() {
        let fbb = gDpFbb;
        if (!fbb) {
            let fbbIn = createFbbIn();
            fbb = new DpFbb(csResVars.domCss4.ico, fbbIn);
            fbb.reveal(false);
            document.body.appendChild(fbb.piggy);
            gDpFbb = fbb;
            setInDoc();
        }
    }

    let gAutoDestroy: boolean = false;
    let gEnableElement: HTMLInputElement;
    const setClass = (name: string) => document.getElementById('destroyTimer').className = name;

    function setInDoc() {
        gDpFbb.indoc(800, 3000, gAutoDestroy ? 1000 : undefined);
        if (gAutoDestroy) {
            gEnableElement && (gEnableElement.disabled = gAutoDestroy);
            setClass('');

            let text = document.getElementById('destroyTimer');
            let left: number = 800 + 3000 + 1000 - 100;
            let interval = setInterval(() => {
                left -= 100;
                text.innerText = `${left}`;
                if (left <= 0 || !gDpFbb) { // clear interval if done or FBB closed.
                    clearInterval(interval);
                    text.innerText = '';
                    gEnableElement && (gEnableElement.disabled = false);
                    console.log('interval done');
                }
            }, 100);
        }
    }

    export function setAutoDestroy(auto: boolean, enableElement: HTMLInputElement) {
        gAutoDestroy = auto;
        gEnableElement = enableElement;

        if (gDpFbb) {
            setInDoc();
        } else {
            createFBB();
        }
    }

    export function setReveal(onOff: boolean) {
        if (gDpFbb) {
            gDpFbb.reveal(onOff);
        }
    }

    document.querySelector('#showFbb').addEventListener('click', function onShowHideClick() {
        let fbb = gDpFbb;
        if (fbb) {
            destroyFBB();
        } else {
            createFBB();
        }
        updateButtonText(!fbb);
    });

    (window.addEventListener as any)(FbbEventType.name,
        (ev: CustomEvent<FbbEvent>) => {
            if (ev.detail.ev === FbbEventType.destroy) {
                console.log('fbb-event: Destroy', ev.detail);
                setClass('');

                gDpFbb = null;
                updateButtonText(true);
            } else if (ev.detail.ev === FbbEventType.command) {
                console.log('fbb-event: Commannd', ev.detail);

                destroyFBB();
                updateButtonText(true);
            } else if (ev.detail.ev === FbbEventType.show) {
                gDpFbb.reveal(true);
                console.log('fbb-event: Show', ev.detail);
                setClass('shown');
            } else if (ev.detail.ev === FbbEventType.enough) {
                console.log('fbb-event: Enough', ev.detail);
                setClass('enough');
            } else {
                console.log('fbb-event: Any', ev.detail);
            }
        }
    );
} //namespace TestFBB

namespace BrandsTest {
    export function setBrand(name: 'hp' | 'dp') {
        console.log(`brand ${name}`);

        // 1. FBB

        csResVars.domCss4 = unbrandWCR_Unpacked(name);

        TestFBB.destroyFBB();
        TestFBB.createFBB();
        TestFBB.updateButtonText();

        // 2. FBIs
        TestFBI.reCreateFBIs();
        // 3. Logos
        TestIco.reCreatelogos();
    }
} //namespace BrandsTest

namespace TestHighlight {
    export function setState(onOff: boolean) {
        let lit: DpLit = wcInstances.lit;
        if (!lit) {
            let hili = document.querySelector('dp-lit') as HTMLElement;

            wcInstances.lit = lit = new DpLit(csResVars.domCss4.lit, hili);
            if (!hili) {
                lit.appendMeToDoc();
            }
        }

        let test = document.querySelector('.test-btns-layout') as HTMLElement;
        if (test) {
            if (onOff) {
                let pmat = false;
                lit.highlight(test, pmat);
            } else {
                lit.hide();
            }
        }
    }
} //namespace TestHighlight

namespace Bootstrap {
    export function setState() {
        // 0. store
        const storePrefix = 'web-components-store';
        let state = {
            showPla: true,
            showFbi: false,
            showLog: false,
            showHp: false,
            autoDel: false,
        };

        let ls = localStorage.getItem(storePrefix);
        ls && (state = JSON.parse(ls));

        const saveState = () => localStorage.setItem(storePrefix, JSON.stringify(state));

        // 1. Placeholders
        let chkPla = document.getElementById('showPlaceholders') as HTMLInputElement;
        const updatePla = () => {
            state.showPla = chkPla.checked;
            for (let child of [...document.querySelectorAll('.test-big-place')].slice(1) as HTMLElement[]) {
                child.style.display = state.showPla ? 'block' : 'none';
            }
        };
        chkPla.addEventListener('click', () => { updatePla(), saveState(); });

        // 2. FBI test
        let chkFbi = document.getElementById('showTestsFBI') as HTMLInputElement;
        const updateFbi = () => {
            state.showFbi = chkFbi.checked;
            for (let child of [...document.querySelectorAll('.test-fbi-wrap')] as HTMLElement[]) {
                child.style.display = state.showFbi ? 'block' : 'none';
            }
        };
        chkFbi.addEventListener('click', () => { updateFbi(), saveState(); });

        // 3. Logo test
        let chkLog = document.getElementById('showTestsLogo') as HTMLInputElement;
        const updateLog = () => {
            state.showLog = chkLog.checked;
            for (let child of [...document.querySelectorAll('.test-logo-wrap')] as HTMLElement[]) {
                child.style.display = state.showLog ? 'block' : 'none';
            }
        };
        chkLog.addEventListener('click', () => { updateLog(), saveState(); });

        // 4. DP or HP test
        let chkBrd = document.getElementById('showTestsHp') as HTMLInputElement;
        const updateBra = () => {
            state.showHp = chkBrd.checked;
            BrandsTest.setBrand(state.showHp ? 'hp' : 'dp');
        };
        chkBrd.addEventListener('click', () => { updateBra(), saveState(); });

        // 5. Highlight test
        let chkHili = document.getElementById('showHighlight') as HTMLInputElement;
        const updateHili = () => {
            TestHighlight.setState(chkHili.checked);
        };
        chkHili.addEventListener('click', () => { updateHili(); });

        // 6. Audo-destroy
        let chkAuto = document.getElementById('showAutoDestroy') as HTMLInputElement;
        const updateAuto = () => {
            state.autoDel = chkAuto.checked;
            TestFBB.setAutoDestroy(chkAuto.checked, chkAuto);
        };
        chkAuto.addEventListener('click', () => { updateAuto(), saveState(); });

        // 7.
        let chkReveal = document.getElementById('revealFbb') as HTMLInputElement;
        chkReveal.checked = true;
        const updateReveal = () => {
            TestFBB.setReveal(chkReveal.checked);
        };
        chkReveal.addEventListener('click', () => { updateReveal(); });

        // 8. Init state
        chkBrd.checked = state.showHp; updateBra(); // This should be done ahead of the rest to load proper res.
        chkPla.checked = state.showPla; updatePla();
        chkFbi.checked = state.showFbi; updateFbi();
        chkLog.checked = state.showLog; updateLog();
        chkAuto.checked = state.autoDel; updateAuto();
    } //setState()

    export function setLogoState() {
        // 1. States
        ['stateNew', 'stateTra', 'stateCha', 'stateOk', 'stateNo'].map(btnId => {
            let btn = document.getElementById(btnId);
            btn.addEventListener('click', (ev) => {
                wcInstances.ico.forEach((ico: DpIco) => {
                    let newState = btn.dataset.state as icoUtl.ILogoState;
                    let logoState = ico.piggy.dataset.mystate as icoUtl.ILogoState;

                    if (newState === icoUtl.ILogoState.clogin && newState === logoState) {
                        newState = icoUtl.ILogoState.tlogin;
                    }

                    ico.piggy.dataset.mystate = newState;
                    ico.state = newState;
                    ico.applyAttrs();
                });
            });
        });
        // 2. Visibility
        let stateVis = document.getElementById('stateVis');
        stateVis.dataset.vis = 's';
        stateVis.addEventListener('click', () => {
            let isHidden = stateVis.dataset.vis === 'h';
            wcInstances.ico.forEach((ico: DpIco) => {
                stateVis.dataset.vis = isHidden ? 's' : 'h';
                ico.state = isHidden ? icoUtl.ILogoState.show : icoUtl.ILogoState.hide;
            });
        });
    } //setLogoState()

} //namespace Bootstrap

document.addEventListener('DOMContentLoaded', function onLoaded() {
    TestIco.createlogos();
    TestIco.initLogos();
    TestFBI.createFBIs();
    TestFBB.createFBB();

    Bootstrap.setState(); //document.addEventListener('DOMContentLoaded', setState);
    Bootstrap.setLogoState();
});
