
import { APIMSG_I2Cs_IMenuUID, CsResMenus, DomCss4 } from "pm-xtn-csui";
import { NR, IBgIconAccount } from "./copy-of-types";
import { IDomiArray, quoUnp } from "pm-xtn-dom/es6";

//declare var webComps: { "html": {}, "css": {}, "svg": {} };

const menuRes = {
    "dpmaxz_MID_n": "[{\"cmd\":\"addlogin\",\"t\":\"cmd_addlogin\"},{\"cmd\":\"openpm\",\"t\":\"cmd_openpm\"},{\"cmd\":\"help\",\"t\":\"cmd_help\"}]",
    "dpmaxz_MID_c": "[{\"cmd\":\"chgpsw\",\"t\":\"cmd_chgpsw\"},{\"cmd\":\"openpm\",\"t\":\"cmd_openpm\"},{\"cmd\":\"help\",\"t\":\"cmd_help\"}]",
    "dpmaxz_MID_t": "[{\"cmd\":\"fillin\",\"t\":\"cmd_fillin\"},{\"cmd\":\"editprofile\",\"t\":\"cmd_editprofile\"},{\"cmd\":\"addprofile\",\"t\":\"cmd_addprofile\"},{\"cmd\":\"openpm\",\"t\":\"cmd_openpm\"},{\"cmd\":\"help\",\"t\":\"cmd_help\"}]",
    "ui_fbmenus": "dpmaxz_MID_n@dpmaxz_MID_c@dpmaxz_MID_t",
};

// not used
// const gMenuDefs = {
// };

// type IWCResources = {
//     ico: {
//         dom: string;
//         css: string;
//     };
//     fbm: {
//         css: string;
//     };
//     fbb: {
//         dom: string;
//         css: string;
//     },
//     lit: {
//         dom: string;
//         css: string;
//     };
// };

declare function unbrandWCR(brand: string): DomCss4;

export function unbrandWCR_Unpacked(brand: string): DomCss4 {
    let res: DomCss4 = unbrandWCR(brand);

    [res.ico, res.fbb, res.lit].forEach(_ => Object.keys(_).forEach(key => {
        if (key === 'dom') {
            _[key] = quoUnp(_[key]);
        }
    }));

    return res;
}

var WCR: DomCss4 = {};
WCR = unbrandWCR_Unpacked('dp');

// namespace csRes2 {
//     export let menuDomis: { [key: string /*I2Cs.IMenuUniqueID*/]: IDomiString; } = {};
//     // not used: export let fbiDomi: string;
// }
var csRes: CsResMenus = {
    menuDomis: {},
    fbiDomi: ''
};

csRes.menuDomis['t_1574821576'] = JSON.stringify(
    [
        "ul", {"id":"t_1574821576"}, [
            "li", {"class":"menu-row","data-cmd":"fillin"}, ["span",{"class":"row-txt"},"Fill in logon data"]
        ], [
            "li", {"class":"menu-row","data-cmd":"editprofile"},["span",{"class":"row-txt"},"Edit logon"]
        ], [
            "li",{"class":"menu-row","data-cmd":"addprofile"},["span",{"class":"row-txt"},"Add logon"]
        ], [
            "li",{"class":"menu-row","data-cmd":"openpm"},["span",{"class":"row-txt"},"Open Password Manager"]
        ], [
            "li",{"class":"menu-row","data-cmd":"help"},["span",{"class":"row-txt"},"Help"]
        ]
    ]
);

/* TODO: copy with replaced class names */
class GenFbiMenu_Not_Used_Yet {
    private static menuRowPattern(id_: string, text_: string): IDomiArray {
        // 0. Pattern for menu row.
        //    <li class="menu-row" id="dpmaxz_addlogin">
        //        <span class="row-icn"> </span>
        //        <span class="row-txt">Add to Password Manager</span>
        //    </li>
        return [
            'li', { 'class': 'menu-row', 'data-dpmaxz-cmd': id_ }, //['span', { 'class': 'row-icn' }],
            ['span', { 'class': 'row-txt' }, text_]
        ];
    }

    static makePopupMenu(muid: APIMSG_I2Cs_IMenuUID, constMenuItems: NR.IResMenu, accs?: IBgIconAccount[]): IDomiArray {

        let ul = ['ul', { id: `${muid}` }]; //TODO: I'm not sure that we are using this ID at all.

        if (accs && accs.length > 1) {
            // Multiple accounts
            constMenuItems.forEach((item_: NR.IResMenuItem, index_: number) => {
                if (index_ === 0) {
                    // Replace '0' item with list of fill-in + account name.
                    accs.forEach((account: IBgIconAccount) => ul.push(this.menuRowPattern(`${item_.cmd}:${account.tsid}`, `${item_.t} (${account.disp})`)) );
                } else if (index_ !== 1) {
                    // Ignore/Skip '1'st item: it is the 'edit account', but we have multiple accounts.
                    ul.push(this.menuRowPattern(item_.cmd, item_.t));
                }
            });
        }
        else {
            // Single is if there are no accounts (i.e undefined) or just one account.
            constMenuItems.forEach((row: NR.IResMenuItem) => ul.push(this.menuRowPattern(row.cmd, row.t)) );
        }

        return ul;
    }
    
} //class genFbiMenu

//window.customElements.define('dp-ico', DpIco);
//window.customElements.define('dp-lit', DpLit);
//window.customElements.define('dp-fbm', DpFbm);
//window.customElements.define('dp-fbi', DpFbi);
//window.customElements.define('dp-fbb', DpFbb);
