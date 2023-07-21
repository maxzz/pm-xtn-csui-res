interface ICsResCssDom {
    css?: string;
    dom?: string;
}

interface ICsResCss {
    css: string;
}

// In Cs
interface ICsRes { // Contetn script web component resources
    logo: ICsResCssDom;
    menu: ICsResCss;
    fbb: ICsResCssDom;
}

// In Bg
interface ICsResBranded {
    dp: ICsRes;
    hp: ICsRes;
}

// Generated var with all for Bg as ICsResBranded and make map of refs to all (to avoid duplicates).
