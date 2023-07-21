import { DomCss } from "../types";
import { domi, jElem } from "pm-xtn-dom";
import { DpIco } from "./dp-ico";

// function rippleOnMouseDown(el: HTMLElement) {}

// $(".paper").mousedown(function(e) {
//    var ripple = $(this).find(".ripple");
//    ripple.removeClass("animate");
//    var x = parseInt(e.pageX - $(this).offset().left) - (ripple.width() / 2);
//    var y = parseInt(e.pageY - $(this).offset().top) - (ripple.height() / 2);
//    ripple.css({
//       top: y,
//       left: x
//    }).addClass("animate");
// });

export const enum FbbCmd {
    save = 's',
    never = 'n',
    close = 'c'
};

export interface FbbRes {
    css: string;
    dom: string;
}

export type FbbOutName = {
    disp?: string;                  // Field display name from clien page UI.
    value: string;                  // Value for that field (as usual account name) as default username.
};

export type FbbInName = FbbOutName & {
    values?: string[];              // Possible choices for value field (as usual other account names) as username alternatives.
};

export interface FbbIn {
    lines: FbbInName[];             // Detected from page values.
    grbId: string;                  // Request ID to send with command to BG.
    res: FbbRes;
}

export interface FbbOut {
    cmd: FbbCmd;                    // Command as ID of how UI was closed
    values: FbbOutName[];           // Values (detected/corrected) from user to store.
    grbId: string;                  // This is request ID.
}
export const enum FbbEventType {
    name = 'fbb-event',             // name of any event
    show = 's',                     // FBB is shown
    enough = 'e',                   // shown enough
    destroy = 'd',                  // destroyed
    command = 'c',                  // command selected by user
}

export interface FbbEventAny {
    ev: FbbEventType.show | FbbEventType.enough | FbbEventType.destroy;
}

export interface FbbEventCmd {
    ev: FbbEventType.command;
    out: FbbOut;
}

export type FbbEvent = FbbEventAny | FbbEventCmd;

interface FbbTimeouts {             // Activity timers
    show?: NodeJS.Timeout;          // Initially shown, i.e. in document
    enou?: NodeJS.Timeout;          // Shown enough
    kill?: NodeJS.Timeout;          // Auto kill
}

export const enum tutpleIdx { disp, value, details }
export type FbbSingleInput = [HTMLElement, HTMLInputElement, HTMLDetailsElement]; // type FbbSingleInput = [ disp: HTMLElement, value: HTMLInputElement, details: HTMLDetailsElement];

export class DpFbb {
    private grbId: string;          // Grabbing ID to send back with command to BG.
    public piggy: HTMLElement;      // Our FBB custom element root
    private inputs: FbbSingleInput[];
    private rroot: HTMLElement;     // ripple root
    private btns: HTMLElement[];

    constructor(domcssIco: DomCss, fbbIn: FbbIn) {
        this.piggy = document.createElement('dp-fbb');
        this.piggy.attachShadow({ mode: 'open' });

        let shadow = this.piggy.shadowRoot;

        // 1. Setup resources.
        fbbIn.res.css && shadow.appendChild(domi(['style', fbbIn.res.css]));
        fbbIn.res.dom && shadow.appendChild(domi(JSON.parse(fbbIn.res.dom)));

        this.grbId = fbbIn.grbId;

        let query = shadow.querySelector.bind(shadow);
        new DpIco(domcssIco, query('dp-ico'));
        this.rroot = query('.main');
        this.btns = [...shadow.querySelectorAll<HTMLElement>('#close, #save, #never')];

        // 2. Replicate input elements from input data.
        const cloneAll = () => {
            let firstId = 10185237; // 101-85-237 hws arround "0x9b6a15"
            let firstInputElm = query('#username') as HTMLInputElement;
            const firstInput: FbbSingleInput = [firstInputElm.previousElementSibling, firstInputElm, firstInputElm.nextElementSibling] as FbbSingleInput;
            let firstInputDisp: string = firstInput[tutpleIdx.disp].innerText;
            let fragment = document.createDocumentFragment();

            function createInput(line: FbbInName): FbbSingleInput {
                let newInput: FbbSingleInput = firstInput
                    .map(elm => elm.cloneNode(true) as HTMLElement)
                    .map(elm => (elm.id = `${firstId++}`, elm)) as FbbSingleInput;
                newInput[tutpleIdx.disp].innerText = line.disp || firstInputDisp;
                newInput[tutpleIdx.value].value = line.value;
                newInput[tutpleIdx.details].innerHTML = '';
                line.values?.forEach(choice => newInput[tutpleIdx.details].appendChild(domi(['option', { value: choice }])));

                newInput.forEach(elm => fragment.appendChild(elm));
                return newInput;
            }

            this.inputs = fbbIn.lines.map(createInput);
            firstInputElm.parentElement.insertBefore(fragment, firstInputElm.nextElementSibling.nextElementSibling);
            firstInput.forEach(elm => elm.remove());
        };
        cloneAll(); // TODO: If we have user name set focus on Save otherwise set focus on username.
        this.events.add();
    }

    private events = {
        add: () => {
            const name = 'addEventListener';
            this.btns.forEach((el) => el[name]('click', this.events.clk));
            this.piggy[name]('keydown', this.events.key);
            (this.piggy.shadowRoot[name]as any)('mousedown', this.events.ripple);
        },
        rem: () => {
            const name = 'removeEventListener';
            this.btns.forEach((el) => el[name]('click', this.events.clk));
            this.piggy[name]('keydown', this.events.key);
            (this.piggy.shadowRoot[name] as any)('mousedown', this.events.ripple);
        },
        clk: (ev: MouseEvent) => this.sendCmd((ev.target as HTMLElement).dataset.id as FbbCmd),
        key: (ev: KeyboardEvent) => this.keydown(ev),
        ripple: (ev: MouseEvent) => this.ripple(ev)
    };

    private ripple(event: MouseEvent) {
        this.stop(); // clear activity timer. TODO: maybe restart?
        let el = event.target as HTMLElement;
        let ofs = jElem(el).offset();
        this.rroot.style.setProperty('--ripple-x', `${(event.clientX - ofs.left) / el.offsetWidth}`);
        this.rroot.style.setProperty('--ripple-y', `${(event.clientY - ofs.top) / el.offsetHeight}`);
    }

    private keydown(event: KeyboardEvent) {
        if (event.altKey || event.shiftKey) {
            return; // Don’t handle modifier shortcuts typically used by assistive technology.
        }
        //console.log('active', document.activeElement, this.shadowRoot.activeElement);
        let id: string;
        switch (event.key) {
            case 'Space':
            case 'Enter': {
                let active = this.piggy.shadowRoot.activeElement;
                if (active && ['save', 'never', 'close'].includes(active.id)) {
                    id = active.id;
                }
                break;
            }
            case 'Escape':
                id = 'close';
                break;
        }
        if (id) {
            event.preventDefault();
            this.sendCmd(id as FbbCmd);
        }
    }

    private sendCmd(cmd: FbbCmd) {
        this.send({ ev: FbbEventType.enough }); // any user command is treated as shown enough.
        this.send({
            ev: FbbEventType.command,
            out: {
                cmd,   // innerText can be later replased with value if we'll have HTMLInputElement
                values: cmd === FbbCmd.save ? this.inputs.map(input => ({ disp: input[tutpleIdx.disp].innerText.trim(), value: input[tutpleIdx.value].value.trim() })) : [],
                grbId: this.grbId
            }
        });
    }

    private send(ev: FbbEvent) {
        window.dispatchEvent(new CustomEvent(FbbEventType.name, { detail: ev }));
    }

    private timers: FbbTimeouts = {
    };

    private stop() {
        let t = this.timers;
        (Object.keys(t) as (keyof typeof t)[]).forEach((key) => {
            t[key] && (clearTimeout(t[key]), t[key] = null)
        });
    }

    public indoc(show: number = 800, enough: number = 3000, kill?: number) {
        // 0. We are inserted in the document now. 'enough' is relative to 'show', 'kill' is relative to 'enough'.
        // Show UI and call callback in 800ms to tell that we were created (cb will notify BG after 3sec to tell shown enough).
        this.stop();
        let t = this.timers;
        t.show = setTimeout(() => {
            t.show = null;
            this.send({ ev: FbbEventType.show });

            t.enou = setTimeout(() => {
                t.enou = null;
                this.send({ ev: FbbEventType.enough });

                t.kill = kill && setTimeout(() => {
                    t.kill = null;
                    this.destroy();
                }, kill); // auto shotdown us in 20sec.
            }, enough);
        }, show);
    }

    public destroy() {
        this.send({ ev: FbbEventType.destroy });
        this.stop();
        this.events.rem();
        this.piggy.parentElement.removeChild(this.piggy);
    }

    public reveal(onOff: boolean) {
        this.rroot.classList[onOff ? 'remove' : 'add']('hide-main');
    }

} //class DpFbb
