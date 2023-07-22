import { DomCss4, DpFbm, DpLit } from "pm-xtn-csui";

export type WebComponentInstances = { // shared singletons
    // ico: DpIco[]; // not used anywhere
    // fbi: DpFbi[]; // not used anywhere
    fbm: DpFbm | null;
    lit: DpLit | null;
}

export type CsResVars = {
    domCss4: DomCss4;                   // Web component resources for all 4 components
    wcInstances: WebComponentInstances; // Web component instances
};

export const csResVars: CsResVars = {
    domCss4: {},
    wcInstances: {
        // ico: [], // [...document.querySelectorAll('dp-ico')] as DpIco[];
        // fbi: [],
        fbm: null,
        lit: null,
    }
};
