export interface UserObject {  
    xrplAddress: string;
    name: string;
};

export interface TokenObject {  
    issuer: string;
    currency: string;
    amount: string,
};

export interface AmmObject {
    pool1: {
        currency: string,
        amount: string,
        issuer: string,
    },
    pool2: {
        currency: string,
        amount: string,
        issuer: string,
    },
    trading_fee: string,
    lpToken: {
        amount: string,
        currency: string,
        issuer: string,  
        holders: LpHolder[]
    }
}

interface LpHolder {
    account: string,
    amount: string,
    share: string
}