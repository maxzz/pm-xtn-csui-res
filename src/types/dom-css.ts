export interface DomCss {  // Web Component Resource
    css?: string;
    dom?: string;
}

export interface DomCss4 { // Generated 'Web Component Resources' from 'webcomp-res.js' for Cs and UI test app.
    ico?: DomCss;          // logo. wcIco send only once for wcFbi or wcFbb, so it will be in CS always if any WC resource was send before.
    fbm?: DomCss;          // menu
    fbb?: DomCss;          // fbb
    lit?: DomCss;          // highlight
}
