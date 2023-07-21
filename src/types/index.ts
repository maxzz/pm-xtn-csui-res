export * from './dom-css';

export const enum FBIType {                 // Icon type in Cs
    unini = -2,                             // Not initialized.
    hideicon = -1,                          // Should be FormType.insign but ts does not like it. Hide icon.
    nlogin = 1,                             // Should be FormType.nlogin but ts does not like it. Icon add login.
    tlogin = 3,                             // Should be FormType.tlogin but ts does not like it. Icon login.
    change = 16                             // Should be FormType.change but ts does not like it. Icon change password.
}

export type APIMSG_DID = number;            // Document ID. // duplicate from api-messages.ts
export type APIMSG_I2Cs_IMenuUID = string;  // Menu unique ID: it can be 'n', 'c', or 't_1480729469_1480730476' or something like that. // duplicate from api-messages.ts

export const traceCsUi = {
    errors: false,                          // turned on with /*[traceDc]{}*/
}
