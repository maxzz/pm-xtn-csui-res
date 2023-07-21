export namespace icoUtl { // logo show

    function show_(el: Element) {
        el && el.classList.remove('hide');
    }

    function hide_(el: Element) {
        el && el.classList.add('hide');
    }

    export const show = show_;
    export const hide = hide_;

    function into_(el: Element, toClass: string, done?: any) {
        done && el.addEventListener('animationend', done, { once: true});
        el.classList.add(toClass);
    }

    function anim_(el: Element, toClass: string) { // className SHOULD have animation
        into_(el, toClass, () => el.classList.remove(toClass));
    }

    type ILogo = {
        amover: HTMLElement;
        root: SVGGraphicsElement;
        bkg: SVGGraphicsElement;
        logo: SVGGraphicsElement;
        logoEgg: SVGGraphicsElement;
        badge: SVGGraphicsElement;
        badgeBBkg: SVGGraphicsElement;
        badgeChg: SVGGraphicsElement;
        badgeAdd: SVGGraphicsElement;
        feedback: SVGGraphicsElement;
        feedbackOk: SVGGraphicsElement;
        feedbackNo: SVGGraphicsElement;
    };

    export const enum ILogoState {
        tlogin = 't',   // main state: trained login
        nlogin = 'n',   // main state: new login
        clogin = 'c',   // main state: password change screen
        ok = 'ok',      // addition to the main state: user authenticated
        no = 'no',      // addition to the main state: user not authenticated
        hide = 'h',     // addition to the main state: hide icon
        show = 's',     // addition to the main state: show icon
    }

    export class State {
        private defs: ILogo;

        owner(mover: HTMLElement): void {
            // 0. Bind to SVG.
            if (!mover) {
                this.defs = null;
                return;
            }
            let r = mover.querySelector('svg') as SVGGraphicsElement;
            let rq = r.querySelector.bind(r) as (selector: string) => SVGGraphicsElement;
            this.defs = {
                amover: mover,
                root: r,
                bkg: rq(`#bkg`),
                logo: rq(`#logo`),
                logoEgg: rq(`#logo>#egg`),
                badge: rq(`#badge`),
                badgeBBkg: rq(`#badge>#bbkg`),
                badgeChg: rq(`#badge>#chg`),
                badgeAdd: rq(`#badge>#add`),
                feedback: rq(`#feedback`),
                feedbackOk: rq(`#feedback>#iOk`),
                feedbackNo: rq(`#feedback>#iNo`),
            };

        } //owner()

        setTra() {
            if (!this.defs) {
                return;
            }
            let d = this.defs;
            hide_(d.badge);
            hide_(d.badgeAdd);
            hide_(d.badgeChg);
            show_(d.logo);
            hide_(d.logoEgg);
            hide_(d.feedbackOk);
            hide_(d.feedbackNo);
        }
        setAdd() {
            if (!this.defs) {
                return;
            }
            let d = this.defs;
            show_(d.badge);
            show_(d.badgeAdd);
            hide_(d.badgeChg);
            show_(d.logo);
            hide_(d.logoEgg);
            hide_(d.feedbackOk);
            hide_(d.feedbackNo);
        }
        setChg() {
            if (!this.defs) {
                return;
            }
            let d = this.defs;
            hide_(d.badgeAdd);
            show_(d.badge);
            show_(d.badgeChg);
            into_(d.badgeChg, 'chg-show');
            show_(d.logo);
            hide_(d.logoEgg);
            hide_(d.feedbackOk);
            hide_(d.feedbackNo);
        }

        fadeFOk() {
            if (!this.defs) {
                return;
            }
            let d = this.defs;
            anim_(d.logo, 'logo-hide');
            show_(d.feedbackOk);
            anim_(d.feedbackOk, 'mark-show');
        }
        fadeFNo() {
            if (!this.defs) {
                return;
            }
            let d = this.defs;
            anim_(d.logo, 'logo-hide');
            show_(d.feedbackNo);
            anim_(d.feedbackNo, 'mark-show');
        }
        state(s: ILogoState) {
            switch (s) {
                case ILogoState.tlogin: return this.setTra();
                case ILogoState.nlogin: return this.setAdd();
                case ILogoState.clogin: return this.setChg();
                case ILogoState.ok: return this.fadeFOk();
                case ILogoState.no: return this.fadeFNo();
            }
        }
    } //class State
} //namespace icoUtl
