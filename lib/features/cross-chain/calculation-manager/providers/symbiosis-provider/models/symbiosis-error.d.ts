export declare const errorCode: {
    readonly DEFAULT: "DEFAULT";
    readonly NO_ROUTE: "NO_ROUTE";
    readonly AMOUNT_TOO_LOW: "AMOUNT_TOO_LOW";
    readonly AMOUNT_TOO_HIGH: "AMOUNT_TOO_HIGH";
    readonly AMOUNT_LESS_THAN_FEE: "AMOUNT_LESS_THAN_FEE";
    readonly NO_TRANSIT_TOKEN: "NO_TRANSIT_TOKEN";
    readonly NO_TRANSIT_POO: "NO_TRANSIT_POO";
};
export interface SymbiosisError {
    code: keyof typeof errorCode | number;
    message?: string;
}
