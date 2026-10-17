export declare const UserRole: {
    readonly OWNER: "OWNER";
    readonly MANAGER: "MANAGER";
    readonly CASHIER: "CASHIER";
    readonly KITCHEN: "KITCHEN";
    readonly WAITER: "WAITER";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const UserStatus: {
    readonly PENDING_VERIFICATION: "PENDING_VERIFICATION";
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly BLOCK: "BLOCK";
    readonly SUSPEND: "SUSPEND";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
