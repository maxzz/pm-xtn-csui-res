import { DomCss } from "../types";
import { domi } from "pm-xtn-dom";
import { icoUtl } from "./dp-ico-utils";

export class DpIco {
    public piggy: HTMLElement;
    public mover: HTMLElement;
    private img: icoUtl.State;
    private svg: SVGSVGElement;
    public fitted: boolean = false; // Set icon dimentions to host. public so we can set 'fitted' and then call set 'dim'.

    constructor(domcss: DomCss, piggy?: HTMLElement) {
        this.piggy = piggy || document.createElement('dp-ico');
        this.piggy.attachShadow({mode: 'open'});
        this.img = new icoUtl.State();
        this.loadDomi(domcss.dom, domcss.css);
        this.applyAttrs();
    }

    private loadDomi(domiStr: string, cssStr: string) {
        this.piggy.shadowRoot.appendChild(domi(['style', cssStr]));

        this.svg = domi(JSON.parse(domiStr)) as any as SVGSVGElement;
        this.mover = domi(['tm-div', { id: 'mover' }]);
        this.mover.appendChild(this.svg);
        this.piggy.shadowRoot.appendChild(this.mover);

        this.img.owner(this.mover);
    }

    public applyAttrs() {
        let d = this.piggy.dataset;
        d.state && this.img.state(d.state as icoUtl.ILogoState);
        d.fit && (this.fit = !!d.fit); // 'fit' should be called before 'dim'
        d.dim && (this.dim = { w: +d.dim, h: +d.dim });
    }

    public get dim(): {w: number, h: number} {
        let r: DOMRect = this.mover.getBoundingClientRect() as DOMRect;
        return {w: r.width, h: r.height};
    }

    public set dim({w, h}: {w: number, h: number}) {
        this.mover.style.width = `${w}px`;
        this.mover.style.height = `${h}px`;
        this.fitted && this.setDimHost({w, h});
    }

    public set fit(v: boolean) {
        this.fitted = v;
        v && this.setDimHost(this.dim);
    }

    public setDimHost({w, h}: {w: number, h: number}) {
        this.piggy.style.width = `${w}px`;
        this.piggy.style.height = `${h}px`;
    }

    public set state(s: icoUtl.ILogoState) {
        if (/^(s|h)/.test(s)) {
            this.piggy.style.display = s === icoUtl.ILogoState.show ? '' : 'none';
        } else {
            this.img.state(s);
        }
    }

} //class DpIco
