import { DomCss } from "../types";
import { domi } from "pm-xtn-dom";

export class DpLit { // Hili - Highlignt
    private container: HTMLElement = null;
    private items: HTMLElement[] = [];
    private w1: number = 0;
    private h1: number = 0;

    private piggy: HTMLElement = null;

    constructor(domcss: DomCss, piggy?: HTMLElement) {
        this.piggy = piggy || document.createElement('dp-lit');
        this.piggy.attachShadow({ mode: 'open' });

        this.loadDomi(domcss.dom, domcss.css);
    }

    private setPos(idx: number, rect: number[]): void {
        // @param {Number} idx Index of element to set.
        // @param {Array} dim_ Rectangle: l,t,w,h (left,top,width,height).
        let style = this.items[idx].style;
        [style.left, style.top, style.width, style.height] = rect.map((n: number) => `${n}px`);
        //style.display = '';
        style.opacity = '1';
        style.transition = 'opacity 2s';
    }

    private loadDomi(domiStr: string, cssStr: string): void {
        let styles = domi(['style', cssStr]);
        this.piggy.shadowRoot.appendChild(styles);

        this.container = domi(JSON.parse(domiStr)) as HTMLElement;
        this.piggy.shadowRoot.appendChild(this.container);

        // 1. Init items: Borders arround the frame image in w3c order.
        // Container: The element where our edges will be created:
        // old                               new
        //   |       |       |       |         |       |       |       |
        // --|-------|-------|-------|--     --|-------|-------|-------|--
        //   | 0     | 1     | 2     |         | 0                     |
        //   | w1,h1 | w2,h1 | w3,h1 |         | w1,h1                 |
        // --|-------|-------|-------|--     --|-------|-------|-------|--
        //   | 3     | 4     | 5     |         | 1     |       | 2     |
        //   | w1,h2 | w2,h2 | w3,h2 |         | w1,h2 |  el_  | w3,h2 |
        // --|-------|-------|-------|--     --|-------|-------|-------|--
        //   | 6     | 7     | 8     |         | 3                     |
        //   | w1,h3 | w2,h3 | w3,h3 |         | w1,h3                 |
        // --|-------|-------|-------|--     --|-------|-------|-------|--
        //   |       |       |       |         |       |       |       |
        // https://developer.mozilla.org/en-US/docs/Web/CSS/border-image-slice
        // https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties#Tricky_edge_cases

        this.items = [...this.container.querySelectorAll('*')] as HTMLElement[];

        let borderImageSlice = [5, 9, 8, 6]; // the same as defined in CSS: t,r,b,l
        this.h1 = borderImageSlice[0]; // top
        this.w1 = borderImageSlice[3]; // left
        let w3 = borderImageSlice[1];  // right
        let h3 = borderImageSlice[2];  // bottom

        // 2. set border. dim is W3C dimmentions: t,r,b,l
        const squares: readonly [t: number, r: number, b: number, l: number][] = [
            [/**/ this.h1, /**/ w3, /**/ 0,  /**/ this.w1, /**/],
            [/**/ 0,       /**/ 0,  /**/ 0,  /**/ this.w1, /**/],
            [/**/ 0,       /**/ w3, /**/ 0,  /**/ 0,       /**/],
            [/**/ 0,       /**/ w3, /**/ h3, /**/ this.w1, /**/],
        ];
        squares.forEach(([t, r, b, l], idx) => this.items[idx].style.borderWidth = `${t}px ${r}px ${b}px ${l}px`);

        this.hide();
    }

    private _highlight(el: HTMLElement) {
        // 0. Removes highlight from previously highlighted element and highlights el.
        (el && el.nodeType !== 1) && (el = el.parentElement); // i.e. el != Node.ELEMENT_NODE
        if (!el) {
            this.hide();
            return;
        }

        // 1. get el box
        let rc: DOMRect = el.getBoundingClientRect() as DOMRect;
        let box = {
            left: Math.round(rc.left), //left: Math.round(window.scrollX + rc.left), <- now we are using position fixed
            top: Math.round(rc.top), //top: Math.round(window.scrollY + rc.top), <- now we are using position fixed
            width: Math.round(rc.right - rc.left),
            height: Math.round(rc.bottom - rc.top)
        };

        // 2. set position
        const rects: readonly [x: number, y: number, w: number, h: number][] = [
            [/**/ box.left - this.w1,   /**/ box.top - this.h1,    /**/ box.width, /**/ 0],
            [/**/ box.left - this.w1,   /**/ box.top,              /**/ 0,         /**/ box.height],
            [/**/ box.left + box.width, /**/ box.top,              /**/ 0,         /**/ box.height],
            [/**/ box.left - this.w1,   /**/ box.top + box.height, /**/ box.width, /**/ 0],
        ];
        rects.forEach((rect, idx) => this.setPos(idx, rect));
    }

    private timeout: NodeJS.Timeout = null;

    public highlight(el: HTMLElement, autoHide: boolean) {
        // 0. Do highlight until explicit hide called or hide after ~1sec.
        this._highlight(el);
        this.timeout && (clearTimeout(this.timeout), this.timeout = null);
        autoHide && (this.timeout = setTimeout(() => this.hide(), 3000));
    }

    public hide() {
        //this.items.forEach((_) => _.style.display = 'none');
        this.items.forEach((_) => _.style.opacity = '0');
    }

    public appendMeToDoc() {
        document.body.appendChild(this.piggy);
    }

} //class DpHili
