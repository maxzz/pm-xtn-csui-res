import { APIMSG_DID, DomCss } from "../types";
import { jElement, IPointNum, utl, px, jElem, domi, IDomiString } from "pm-xtn-dom";
import { DpFbi } from "./dp-fbi";

export type MenuDomis = Record<string /*I2Cs.IMenuUniqueID*/, IDomiString>;

export type CsResMenus = {
    menuDomis: MenuDomis;
    fbiDomi: string;
};

export const csResMenus: CsResMenus = {
        menuDomis: {},
        fbiDomi: '',
};

namespace DpFbmLocal {
    // Global UI root is shared between menu and highlighter.
    /*
        <div id="dpmaxz_fbm_gui">
            <div class="menus">
                <div class="menus-rel">
                    <ul id="n" style="height: 66px;" class="hide">
                        <li class="menu-row" id="dpmaxz_addlogin">
                            <span class="row-icn"></span>
                            <span class="row-txt">Add to Password Manager</span>
                        </li>
                        <li class="menu-row" id="dpmaxz_openpm">
                            <span class="row-icn"></span>
                            <span class="row-txt">Open Password Manager</span>
                        </li>
                        <li class="menu-row" id="dpmaxz_help">
                            <span class="row-icn"></span>
                            <span class="row-txt">Help</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    */

    export type IDimention = { w: number; h: number; };

    /* not used here
    export interface MenuDef {
        cmd: string; // command
        t: string; // text
    }
    */

} //namespace DpFbmLocal

export class DpFbm {
    public onCommand: (menuID: string, did: APIMSG_DID) => void = null; // Callback to invoke menu command.
    public currentFBI: DpFbi;

    private m_menusroot: HTMLElement;
    private menuDefs: { [menuUID: string]: HTMLElement; } = {}; // key is literal: 'add'|'chg'|'tra'|'tra_tsid_tsid_tsid...'

    private piggy: HTMLElement = null;

    constructor(domcss: DomCss) {
        this.piggy = document.createElement('dp-fbm');
        this.piggy.attachShadow({ mode: 'open' });
        this.piggy.shadowRoot.appendChild(domi(['style', domcss.css]));
    }

    public verifyMenu(menuUID: string) {
        // 0. Verify that menu was created; if not then create it, show it and hide all other menus.
        if (menuUID === 'hide') {
            return;
        }

        if (this.menuDefs[menuUID] === undefined) { // If sub-menu was not created yet.
            this.menuDefs[menuUID] = this.createMenu(menuUID);
        }

        // 2. Set this sub-menu visible and hide the rest.
        Object.keys(this.menuDefs).forEach((uid: string) => {
            this.menuDefs[uid].classList.toggle('hide', uid !== menuUID);
        });
    }

    private setPoint(elem: HTMLElement, aTo: jElement, logo: DpFbmLocal.IDimention, menu: DpFbmLocal.IDimention) {
        let box: IPointNum = aTo.offset(),
            boxH: number = aTo.height();

        box.top -= aTo.elem.ownerDocument.defaultView.pageYOffset; // <- now we are using position fixed
        box.left -= aTo.elem.ownerDocument.defaultView.pageXOffset; // <- now we are using position fixed

        box.top = box.top + logo.h * .75;
        //box.left = box.left + logo.w * .25;

        let win = document.defaultView;
        // let viewportW = win.innerWidth + win.scrollX;
        // let viewportH = win.innerHeight + win.scrollY;
        let viewportW = win.innerWidth; //let viewportW = win.innerWidth + win.scrollX; <- now we are using position fixed
        let viewportH = win.innerHeight; //let viewportH = win.innerHeight + win.scrollY; <- now we are using position fixed

        if (box.left + menu.w + 24 >= viewportW) {
            box.left = viewportW - menu.w - 24;
        }

        if (box.top + menu.h + 24 >= viewportH) {
            box.top = viewportH - menu.h - 24;
            box.left = box.left - logo.w * .5;
        }

        utl.css(elem, { top: px(box.top), left: px(box.left) });
    }

    public alignMenu(alighToMover: HTMLElement): void {
        // 0. Position menu reletive to bkd menu item and show the menu base at correct position.
        let aTo: jElement = jElem(alighToMover),
            menuRoot = this.m_menusroot,
            menuEl: jElement = jElem('.menus-rel > ul:not([class*=hide])', menuRoot),
            logo: DpFbmLocal.IDimention = { w: aTo.width(), h: aTo.height() },
            menu: DpFbmLocal.IDimention = { w: menuEl.outerWidth(), h: menuEl.outerHeight() };

        //console.log(`rcA`, menuRoot.getBoundingClientRect());

        this.setPoint(menuRoot, aTo, logo, menu);
        menuRoot.classList.remove('hide');
        menuRoot.classList.add('menu-in');
        menuRoot.classList.remove('menu-out');
        menuRoot.style.pointerEvents = menu.h < 10 ? 'none' : '';

        setTimeout(() => {
            //console.log(`rcB`, menuRoot.getBoundingClientRect());
            if (menu.h < 10) {
                // the initial values are 0 (it is 2 actually), so updated for the first time.
                menu = { w: menuEl.outerWidth(), h: menuEl.outerHeight() };
            }
            this.setPoint(menuRoot, aTo, logo, menu); // Position menu twice because if document has overflow=auto scrollbars may appear. frame02.html lower-right corner.
        }, 100);

        if (menu.h < 10) {
            setTimeout(() => menuRoot.style.pointerEvents = '', 267);
        }
    }

    createMenu(menuUID: string): HTMLElement {
        if (!this.m_menusroot) {
            this.m_menusroot = domi(['div', { 'class': 'menus hide' },
                ['div', { 'class': 'menus-rel' }]
            ]);
            this.m_menusroot.addEventListener('mouseenter', (ev) => { this.resetCloseTimer(); }, false);
            this.m_menusroot.addEventListener('mouseleave', (ev) => { this.closeMenu(); }, false);

            this.piggy.shadowRoot.appendChild(this.m_menusroot);
        }

        let menus = this.m_menusroot.querySelector('.menus-rel');

        let newMenu = domi(JSON.parse(csResMenus.menuDomis[menuUID])) as any as HTMLElement;
        menus.appendChild(newMenu);

        // 4. Subscribe to events for each menu row.
        const rowClick = (ev: Event) => {
            if (!this.currentFBI) {
                // This is happening very rare when menu is closed but CSS animation is still going on.
                // Menu close: /*[traceDc]{}*/ traceCs.traceMessage(`%cFBM: !this.currentFBI`);
                return;
            }
            let fbi: DpFbi = this.currentFBI; // closeMenuNow() will clean up current icon.
            this.closeMenuNow();
            let cmd = (ev.currentTarget as HTMLElement).dataset.cmd;
            let fieldDid = fbi.m_fieldDID; //TODO: !!! exception here if !this.currentFBI
            fbi.commandStarted();
            this.onCommand && this.onCommand(cmd, fieldDid);
        };
        [...newMenu.querySelectorAll('.menu-row')].forEach((row: Element) => row.addEventListener('click', rowClick, false));

        return newMenu;
    }

    public closeMenuNow() {
        // for multiple icons on page we need to close prev now
        //this.m_menusroot.classList.add('hide');
        this.m_menusroot.classList.remove('menu-in');
        this.m_menusroot.classList.add('menu-out');
        this.m_menusroot.style.pointerEvents = 'none';
        if (this.currentFBI) {
            this.currentFBI.menuClosed();
            this.currentFBI = null;
            // Menu close: /*[traceDc]{}*/ traceCs.traceMessage(`%cFBM: Menu closed`);
        }
    }

    public closeMenu(): void {
        this.closeTimer = window.setTimeout(() => {
            this.closeMenuNow();
        }, 100);
    }

    private closeTimer: number = null; // This is timeout ID to close menu.
    public resetCloseTimer(): void {
        // 0. Reset menu timer.
        // This allows us to have icon and menu separated and multiple icons with a single menu.
        if (this.closeTimer) {
            window.clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }
    }

    public appendMeToDoc() {
        document.body.appendChild(this.piggy);
    }

} //class DpFbm
