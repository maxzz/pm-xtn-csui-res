import { APIMSG_DID, APIMSG_I2Cs_IMenuUID, DomCss, FBIType, traceCsUi } from "../types";
import { IPointNum, jElem, jElement, nodeInDocument, throttleByRAF } from "pm-xtn-dom";
import { DpFbm } from "./dp-fbm";
import { DpIco } from "./dp-ico";
import { icoUtl } from "./dp-ico-utils";

let gDocFocused = true;

/*
namespace Fixes {
    const reOv = /auto|hidden|scroll/; // regex for overflow value check.
    export function fixCSSRules(fbiHolder: HTMLElement): void {
        // 0. Fix overflow hidden for all elements css rules.
        // So far just fix for 'overflow: hidden' on https://signup.netflix.com/Login and some others.
        // We'll duplicate style sheets, but this is more light solution over creating only unique rules.
        //
        // 'auto' is a problem on http://www.myspace.com/, however we cannot filter this out since
        // body element may have it.
        //
        // Any overflow value different from visible will cause a trouble for us.
        // We need to set 'visible' on parent of FBI or the whole form.
        // On https://login.iis.net they set: .form-horizontal div { overflow: auto; }, to the while document.

        let parents: HTMLElement[] = jElem(fbiHolder).parents();
        //For login.iis.net it is:
        //    0:div  <- parent of FBI i.e. fbiHolder
        //    1:form.form-horizontal
        //    2:div#loginform
        //    3:div.content
        //    4:div.allcontent
        //    5:body
        //    6:html

        type Overlows = { "overflow": string; "overflow-x": string; "overflow-y": string; };

        let ovKeys = ['overflow', 'overflow-x', 'overflow-y'];

        // 1. Check if we have anything to fix.
        let hasOverflow = false;
        checkDone:
        for (let i = 0; i < parents.length - 2; i++) { // skip: body, html
            let el = parents[i];
            let ov: Overlows = utl.css(el, ovKeys) as Overlows;

            for (let k = 0; k < ovKeys.length; k++) {
                let ovValue = ov[ovKeys[k]];
                if (ovValue.length && reOv.test(ovValue)) {
                    hasOverflow = true;
                    break checkDone;
                }
            }
        }
        if (!hasOverflow) {
            return;
        }

        // 2. Find the root to fix.
        let end = 0; // assuming there is no FORM we get only first parent which will be parent or body.
        for (let i = 0; i < parents.length - 2; i++) { // skip: body, html
            if (parents[i].tagName === 'FORM') {
                end = i;
                break;
            }
        }

        // 3. Fix it.
        parents.slice(0, end + 1).forEach((el: HTMLElement) => { // to include FORM or BODY (for slice() end is not included).
            el.style.setProperty('overflow-x', 'visible', 'important');
            el.style.setProperty('overflow-y', 'visible', 'important');
        });
    } //fixCSSRules()

} //namespace Fixes
*/

function __updateIconPos(piggyInput: HTMLElement, back: HTMLElement): void {
    // 0. Update FBI position. piggyInput: input; back: mover
    let $input: jElement = jElem(piggyInput),
        [piggyPaddingRight] = $input.cssArr(['padding-right']).map((value: string) => parseInt(value)),
        piggyWidth: number = $input.outerWidth(), // no margin + border + padding - piggyPaddingRight
        piggyHeight: number = $input.outerHeight();

    //if (piggyWidth) { piggyWidth -= piggyPaddingRight; } // This is right but on citi.com (small size) is not looking good.

    // allow icon to be hidded. online.citi.com is showing two icons. TODO: find the way to show it back.
    // if (piggyWidth === 0 || piggyHeight === 0) { // This is case of google.com when user name is hidden. TODO: We need to have align element as psw for such cases. Right now leave it as it is, since pos is relative.
    //     return;
    // }

    if (piggyHeight < 12 && piggyHeight !== 0) {
        piggyHeight = 12;
    }
    let backSize = piggyHeight * 1.4; // witdth and height for SVG are the same.

    let ratio = piggyWidth / backSize;
    if (ratio < 3) {
        backSize = piggyWidth / 3; // take no more then 1/3 of edit width.
    }
    let rightShift = piggyWidth * 0.05 + backSize;

    back.style.width = backSize + 'px'; // Happening again: dog.js:1333 Uncaught TypeError: Cannot read property 'style' of null; from this.events = { focus: () => this.updateIconPos() }
    back.style.height = backSize + 'px';

    let backOfs: IPointNum = $input.offset();

    backOfs.left = backOfs.left/*ie piggyInput.left*/ + piggyWidth/* - piggyPaddingRight*/ - rightShift; // the same as - back.clientWidth - back.clientWidth * .1;
    backOfs.top = backOfs.top/*ie piggyInput.top*/ + piggyHeight / 2 - back.clientHeight / 2;

    back.style.zIndex = '2147483645'; // 2147483647 - max // temp fix: There is a problem with https://www.ipower.com/secure/login.bml#webmail (they reset it to 1)
    jElem(back).offset(backOfs);
} 

export interface HTMLElementMax<T> extends HTMLElement {
    // 1. Firefox is switching execution context and maxz will be available only when debugger paused.
    // 2. Memory leak will happen if our destroy() is not called to break cross reference DpFbi.piggy.DpFbi.
    maxz: T;
}

export class DpFbi {
    public piggy: HTMLElementMax<DpFbi> = null;
    private dpico: DpIco;
    private dpfbm: DpFbm;
    private input: HTMLElement;
    private mover: HTMLElement;
    private moverParent: HTMLElement;           // For reconnect: We keep ref to mover parent to reconnect FBI (global.americanexpress.com/login).
    private iconType: FBIType;                  // For reconnect
    private m_menuUID: APIMSG_I2Cs_IMenuUID;    // For reconnect
    private lockMenu: boolean;                  // Lock menu for a while after menu command send to BG.
    public m_fieldDID: APIMSG_DID;              // Used only for the send command from field.
    private domcssIco: DomCss;
    private domcssFbm: DomCss;

    public init(domcssIco: DomCss, el: HTMLElement, didForCommand: APIMSG_DID, fbm: DpFbm) {
        // el - HTMLElement attach to; did - Field ID that will be returned when command is selected.
        // TODO: If position is too close to the window left edge then move feedback to the right edge.
        // TODO: Check z-index and lower for parent. (http://softwareas.com/whats-the-maximum-z-index)
        // TODO: Check 'overflow' to top and set 'visible' if specified 'hidden'.
        this.domcssIco = domcssIco;

        this.input = el;
        this.m_fieldDID = didForCommand;
        this.dpfbm = fbm;
        this.m_menuUID = ''; // generated ID of this menu will be defined by initIconType().

        this.removeIconDOM();
        this.createMover(this.input);
        this.on(true);

        this.updateIconPos();
        this.dpico.state = icoUtl.ILogoState.tlogin;

        // Fix whatever we need.
        //Fixes.fixCSSRules(this.mover.parentElement); // TODO: I'm not sure if we still need it.
    } //constructor()

    private events = {
        click: (ev: MouseEvent) => {
            gDocFocused = true; this.mouseIn(ev);
        },
        mouseenter: (ev: MouseEvent) => this.mouseIn(ev),
        mouseleave: (ev: MouseEvent) => this.mouseOut(ev),
        focus: () => {
            /*[traceDc]{}*/ traceCsUi.errors && !this.mover && console.error(`Focus: no mover`);
            this.updateIconPos();
        },
        blur: () => this.updateIconPos(),
        size: () => this.updateIconPos() // console.log('throttle', this.m_fieldDID);
    };

    private on(onORoff: boolean) {
        // 0. Subscribe/unsibscribe events.
        // Note (1): Done for #69526 login.target.com, but they need for 'input' as well, which will be too much. TODO: Lastpass
        // is setting background - image instead, but we can do both: bkg - image and icon, so it will be even more bullet proof.
        let i = this.input;
        let m = this.mover;
        let e = this.events;
        const a = 'addEventListener';
        const r = 'removeEventListener';
        if (onORoff) {
            m && m[a]('click', e.click, false); // gDocFocused = true; for ME
            m && m[a]('mouseenter', e.mouseenter, false);
            m && m[a]('mouseleave', e.mouseleave, false);
            i && i[a]('focus', e.focus, false);
            i && i[a]('blur', e.blur, false); // Note (1)
            window[a]("tmOptimizedResize", e.size);
        } else {
            m && m[r]('click', e.click, false); // gDocFocused = true; for ME
            m && m[r]('mouseenter', e.mouseenter, false);
            m && m[r]('mouseleave', e.mouseleave, false);
            i && i[r]('focus', e.focus, false);
            i && i[r]('blur', e.blur, false); // Note (1)
            window[r]("tmOptimizedResize", e.size);
        }
    } //on()

    private createMover(input: HTMLElement): void {
        // TODO: Fight with CSS Grid: overall we don't care where inserted FBI (may be keyboard input,
        //     but that isn't supported yet), beacuse we align FBI to input by bounding box.
        //     max-width and max-height are 0 to fight with CSS Grid on moverParent.
        //let moverParent: HTMLElement = document.createElement('tm-div');
        //moverParent.style.cssText = 'display:inline-block; position:relative; max-width:0; max-height:0; padding:0; margin:0; border:0';

        this.piggy = document.createElement('dp-fbi') as HTMLElementMax<this>;
        this.piggy.maxz = this;
        this.piggy.attachShadow({ mode: 'open' });

        // this.piggy.style.width = '0';
        // this.piggy.style.height = '0';
        // this.piggy.style.display = 'inline-block';
        // this.piggy.style.boxSizing = 'border-box';
        // this.piggy.style.clear = 'both';

        this.dpico = new DpIco(this.domcssIco);
        this.piggy.shadowRoot.appendChild(this.dpico.piggy);

        input.parentElement.insertBefore(this.piggy, input.nextElementSibling);

        // Save state.
        this.moverParent = this.piggy;
        this.mover = this.dpico.mover;
        this.lockMenu = false;
    } //createMover()

    public initIconType(iconType: FBIType, menuUID: APIMSG_I2Cs_IMenuUID): void {
        // 0. This is called once when we recieve showicon event from bin.

        this.iconType = iconType;
        this.m_menuUID = menuUID;
        this.dpfbm.verifyMenu(this.m_menuUID); // Somehow if we didn't create it ahead we are missing the 1st hover event.

        let fbiHolder = this.mover && this.moverParent;

        let newState: icoUtl.ILogoState;

        if (iconType === FBIType.tlogin) {
            newState = icoUtl.ILogoState.tlogin;
        } else if (iconType === FBIType.nlogin) {
            newState = icoUtl.ILogoState.nlogin;
        } else if (iconType === FBIType.change) {
            newState = icoUtl.ILogoState.clogin;
        }

        if (newState) {
            this.dpico.state = newState;
            icoUtl.show(fbiHolder);
            this.updateIconPos();
        } else {
            icoUtl.hide(fbiHolder); // FBIType.hideicon and anything else. DpFbi should be destoyed from outside.
        }
    } //initIconType()

    private updateIconPos() {
        if (!this.mover) {
            //if (__DEV__) {
                // Happening again: dog.js:1333 Uncaught TypeError: Cannot read property 'style' of null; from this.events = { focus: () => this.updateIconPos() }
                /*[traceDc]{}*/ traceCsUi.errors && console.error(`NULL FBI`);
                //throw new Error('No mover');
            //}
            return;
        }
        __updateIconPos(this.input, this.mover);
    }

    private focused: HTMLElement = null;
    private menuOpened() {
        let active = document.activeElement;
        active = active && active.shadowRoot && active.shadowRoot.activeElement || active;
        if (active) {
            this.focused = active as HTMLElement;
            this.focused.blur();
        }
    }

    public menuClosed() {
        if (this.focused) {
            this.focused.focus();
            this.focused = null;
        }
    }

    private mouseOut(ev: MouseEvent) {
        this.dpfbm.closeMenu();
    }

    private mouseIn(ev: MouseEvent) {
        this.dpfbm.resetCloseTimer();

        if (!gDocFocused || this.lockMenu) { // wo/ this we'll have the menu will be shown again on command select.
            return;
        }

        this.menuOpened();

        // TODO: If closed by esc set focus back to input

        let doInit: number = 0; // Get menus to make sure that they are created.

        // Set a proper menu type, the new owner ...
        if (!this.dpfbm.currentFBI) {
            doInit++;
            this.dpfbm.verifyMenu(this.m_menuUID);
            this.updateIconPos();
        } else if (this.dpfbm.currentFBI !== this) { // if multiple icons on page
            doInit++;
            this.dpfbm.closeMenuNow();
            this.dpfbm.verifyMenu(this.m_menuUID);
            this.updateIconPos();
        }

        this.dpfbm.currentFBI = this;

        if (doInit) {
            this.dpfbm.alignMenu(this.mover);
        }
    }

    public showAuth(ok: boolean): void {
        this.dpico.state = ok ? icoUtl.ILogoState.ok : icoUtl.ILogoState.no;
    }

    public commandStarted() {
        // 0. This is called by FBM that command was selected and sent to BG. We need to lock icon for some time.
        this.lockMenu = true;
        setTimeout(() => this.lockMenu = false, 500);
    }

    public inDocument(): boolean {
        // 0. inDocument is called on state change to check if we need to call reconnect() on our this fbi.
        return nodeInDocument(this.piggy);
    }

    public reconnect() {
        // 0. reconnect is called if inDocument() returns false.
        this.removeIconDOM();
        this.createMover(this.input);
        this.on(true);
        this.initIconType(this.iconType, this.m_menuUID);
    }

    private removeIconDOM(): void {
        // 0. Remove icon when corresponding Element was removed from DOM.
        this.on(false); // TODO: This will unsubscribe from input when we construct and did not subscribed yet.
        // 1. Remove any previously created FBIs (i.e. unreferenced FBI root(s)).
        //    This is happen when a form element is cloned (including children), and used as a HTML template.
        //    When this.input removed from DOM then this.input.nextElementSibling is null.
        let inputParent = this.input && this.input.parentElement;
        if (inputParent) {
            ([...inputParent.querySelectorAll('dp-fbi')] as HTMLElementMax<this>[]).forEach(el => {
                let compFbi = el.maxz;
                if (compFbi) {
                    if (compFbi.input === this.input) { // We need this if all inputs have parent as <body>.
                        /*{}*/ console.log(`%cRemoved leftover FBI keeper %o`, 'color: red', compFbi);
                        compFbi.destroy();
                    }
                } else {
                    // There should be only one dp-fbi, so remove any leftovers that don't have DpFbi class.
                    /*{}*/ console.log(`%cRemoved leftover FBI JUST ICON %o`, 'color: red', compFbi);
                    el.parentElement && el.parentElement.removeChild(el);
                }
            });
        }
        this.moverParent = null;
        this.mover = null;
    }

    public destroy() {
        this.on(false);
        this.piggy.maxz = null;
        this.piggy.parentElement && this.piggy.parentElement.removeChild(this.piggy); // this.piggy.parentElement is null when piggy is already removed from document.
    }

} //class DpFbi

(function () {
    throttleByRAF('resize', 'tmOptimizedResize');
})();
