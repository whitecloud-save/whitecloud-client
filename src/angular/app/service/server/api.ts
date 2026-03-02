export declare class AccountToken {
    session: string;
    expireAt: number;
    accountId: number;
}
export declare class AccountGateway {
    accountId: number;
    gatewayId: string;
    session: string;
    connectedAt: number;
}
export enum AccountLoginType {
    Username = 1,
    Email = 2
}
export declare class AccountLogin {
    id: number;
    type: AccountLoginType;
    username: string;
    password: string;
    salt: string;
}
export enum PermissionResult {
    ALLOW = 1,
    DENY = 2
}
export declare class AuthPermission {
    gid: string;
    name: string;
    permission: PermissionResult;
    group: AuthGroup;
}
export declare class AuthGroup {
    id: string;
    name: string;
    permissions: AuthPermission[];
    protected: boolean;
    createTime: number;
}
export declare class Account {
    id: number;
    nickname?: string;
    avatar?: string;
    groupList?: AuthGroup[];
    createTime: number;
    lastLoginTime: number;
    lastCleanTime: number;
    disabled: boolean;
}
export declare class AccountAuthGroup {
    accountId: number;
    account?: Account;
    groupId: string;
    authGroup?: AuthGroup;
}
export enum VIPLevel {
    None = 0,
    Normal = 1
}
export declare class AccountVIP {
    accountId: number;
    level: VIPLevel;
    space: number;
    expireTime: number;
}
export declare class VIPLevelConfig {
    level: VIPLevel;
    capacity: number;
}
export declare class ClientVersion {
    version: string;
    zipUrl: string;
    asarUrl: string;
    asarHash: string;
    isFullUpdate: boolean;
    deprecated: boolean;
}
export declare class UserGame {
    accountId: number;
    gameId: string;
    name: string;
    gameCoverImgUrl: string | null;
    savePath: string | null;
    exePath: string;
    cloudSaveNum: number;
    enableCloudSave: boolean;
    updateTime: number;
    order: number;
    deleted: boolean;
}
export declare class UserGameSave {
    saveId: string;
    gameId: string;
    accountId: number;
    size: number;
    hostname: string;
    ossPath: string;
    remark: string;
    stared: boolean;
    createTime: number;
    updateTime: number;
    directoryHash: string | null;
    zipHash: string | null;
    directorySize: number | null;
}
export declare class GameHistory {
    id: string;
    accountId: number;
    gameId: string;
    host: string;
    startTime: number;
    endTime: number;
    createTime: number;
}
export enum SKUIdentify {
    VIP = "vip",
    VIP2 = "vip2",
    VIP3 = "vip3"
}
export enum ProductSKUState {
    OnSale = 1,
    OffSale = 2
}
export declare class ProductSKU {
    id: number;
    identify: SKUIdentify;
    price: number;
    name: string;
    remark: string;
    state: ProductSKUState;
    args: unknown;
}
export interface ProductSKUSnapshot {
    version: number;
    id: number;
    identify: string;
    price: number;
    name: string;
    args: string;
}
export enum OrderState {
    Created = 1,
    Finished = 2,
    Closed = 100
}
export enum PaymentState {
    Pending = 1,
    Paid = 2
}
export enum PaymentPlatform {
    WechatMiniProgram = "wechat-mini-program",
    WechatWeb = "wechat-web",
    WechatNative = "wechat-native"
}
export declare class AccountOrder {
    id: string;
    accountId: number;
    account?: Account;
    skuId: number;
    skuSnapshot: ProductSKUSnapshot;
    createTime: number;
    successTime: number;
    sandbox: boolean;
    expireTime: number;
    state: OrderState;
    paymentState: PaymentState;
    platformOrderId: string;
    platform: PaymentPlatform;
    platformData: unknown;
}
export enum GlobalConfigKey {
    PaymentMaintain = "payment-maintain",
    PaymentOpen = "payment-open",
    PaymentTestAccountList = "payment-test-account-list",
    PaymentSandbox = "payment-sandbox"
}
export declare class GlobalConfig {
    name: GlobalConfigKey;
    value: unknown;
}
export declare class AuthHandler {
    login(body: IReqLogin): Promise<{
        account: {
            id: number;
            nickname: string | undefined;
            disabled: boolean;
            avatar: string | undefined;
        };
        permissions: {
            name: string;
            permission: PermissionResult;
        }[];
        authorization: {
            token: string;
            expireAt: number;
        };
        vip: AccountVIP;
        storage: {
            usedSpace: number;
            totalSpace: number;
        };
    }>;
    expireToken(body: void): Promise<{
        session: string;
        expireAt: number;
    }>;
    reconnectLogin(body: void): Promise<{
        account: {
            id: number;
            nickname: string | undefined;
            disabled: boolean;
            avatar: string | undefined;
        };
        permissions: {
            name: string;
            permission: PermissionResult;
        }[];
        authorization: {
            token: string;
            expireAt: number;
        };
        vip: AccountVIP;
        storage: {
            usedSpace: number;
            totalSpace: number;
        };
    }>;
    info(body: void): Promise<{
        account: {
            id: number;
            nickname: string | undefined;
            disabled: boolean;
            avatar: string | undefined;
        };
        permissions: {
            name: string;
            permission: PermissionResult;
        }[];
        authorization: {
            token: string;
            expireAt: number;
        };
        vip: AccountVIP;
        storage: {
            usedSpace: number;
            totalSpace: number;
        };
    }>;
    register(body: IReqRegister): Promise<{}>;
    logout(body: void): Promise<{}>;
    updatePermission(body: IReqUpdatePermission): Promise<{}>;
    updateAccount(body: IReqUpdateAccount): Promise<{}>;
    disableAccount(body: IReqDisableAccount): Promise<{}>;
    deleteAuthGroup(body: IReqDeleteAuthGroup): Promise<{}>;
    createAccount(body: IReqCreateAccount): Promise<{
        id: number;
    }>;
    resetPassword(body: IReqResetPassword): Promise<{}>;
    requestForgetPassword(body: IReqRequestForgetPassword): Promise<{
        id: string;
    }>;
    forgetPassword(body: IReqForgetPassword): Promise<{}>;
}
export interface IReqLogin {
    username: string;
    password: string;
    type: AccountLoginType;
}
export interface IReqRegister {
    password: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
}
export interface IReqUpdatePermission {
    gid: string;
    permissions: {
        name: string;
        permission: PermissionResult;
    }[];
}
export interface IReqUpdateAccount {
    accountId: number;
    groupList?: string[];
    nickname?: string;
}
export interface IReqDisableAccount {
    accountId: number;
    disabled: boolean;
}
export interface IReqDeleteAuthGroup {
    gid: string;
}
export interface IReqCreateAccount {
    username: string;
    nickname: string;
    email: string;
    groupList: string[];
    password: string;
}
export interface IReqResetPassword {
    id: number;
    password: string;
}
export interface IReqRequestForgetPassword {
    email: string;
}
export interface IReqForgetPassword {
    id: string;
    code: string;
    password: string;
}
export declare class BusinessHandler {
    generateAvatarUploadSignature(body: void): Promise<{
        dir: string;
        callback: string;
        host: string;
        signature: string;
        policy: string;
        accessKey: string;
    }>;
    generateGameCoverUploadSignature(body: IReqGenerateGameCoverUploadSignature): Promise<{
        dir: string;
        host: string;
        signature: string;
        policy: string;
        accessKey: string;
    }>;
    generateGameSaveSignature(body: IReqGenerateGameSaveSignature): Promise<{
        dir: string;
        callback: string;
        host: string;
        signature: string;
        policy: string;
        accessKey: string;
    }>;
    modifyNickname(body: IReqModifyNickname): Promise<{}>;
    syncGame(body: IReqSyncGame): Promise<UserGame>;
    signGameCoverUrl(body: IReqSignGameCoverUrl): Promise<{
        url: string;
    }>;
    signGameSaveUrl(body: IReqSignGameSaveUrl): Promise<{
        url: string;
    }>;
    fetchUserGame(body: void): Promise<UserGame[]>;
    removeGame(body: IReqRemoveGame): Promise<{}>;
    fetchGameSave(body: IReqFetchGameSave): Promise<UserGameSave[]>;
    syncGameSave(body: IReqSyncGameSave): Promise<{}>;
    deleteGameSave(body: IReqDeleteGameSave): Promise<{}>;
    clearGameSaves(body: IReqClearGameSaves): Promise<{}>;
    syncGameHistory(body: IReqSyncGameHistory): Promise<GameHistory[]>;
    fetchGameHistory(body: IReqFetchGameHistory): Promise<GameHistory[]>;
    fetchClientUpdates(body: IReqFetchClientUpdates): Promise<ClientVersion[]>;
    fetchLatestClientVersion(): Promise<ClientVersion | null>;
    fetchClientVersion(body: IReqFetchClientVersion): Promise<ClientVersion | null>;
}
export interface IReqGenerateGameCoverUploadSignature {
    gameId: string;
}
export interface IReqGenerateGameSaveSignature {
    gameId: string;
    saveId: string;
    remark: string;
    stared: boolean;
    hostname: string;
    size: number;
    createTime: number;
    directoryHash?: string | null;
    zipHash?: string | null;
    directorySize?: number | null;
}
export interface IReqModifyNickname {
    nickname: string;
}
export interface IReqSyncGame {
    gameId: string;
    name: string;
    gameCoverImgUrl?: string;
    savePath?: string;
    exePath: string;
    cloudSaveNum?: number;
    enableCloudSave?: boolean;
    order: number;
}
export interface IReqSignGameCoverUrl {
    url: string;
}
export interface IReqSignGameSaveUrl {
    url: string;
}
export interface IReqRemoveGame {
    gameId: string;
}
export interface IReqFetchGameSave {
    gameId: string;
}
export interface IReqSyncGameSave {
    gameId: string;
    saveId: string;
    remark: string;
    stared: boolean;
    hostname: string;
    createTime: number;
    updateTime: number;
    directoryHash?: string | null;
    zipHash?: string | null;
    directorySize?: number | null;
}
export interface IReqDeleteGameSave {
    gameId: string;
    saveId: string;
}
export interface IReqClearGameSaves {
    gameId: string;
}
export interface IReqSyncGameHistory {
    history: {
        id: string;
        gameId: string;
        host: string;
        startTime: number;
        endTime: number;
    }[];
}
export interface IReqFetchGameHistory {
    gameId: string;
    lastSyncTime: number;
}
export interface IReqFetchClientUpdates {
    version: string;
}
export interface IReqFetchClientVersion {
    version: string;
}
export declare class ClientNotifyHandler {
    notifyUserInfoUpdate(notify: INotifyUserInfoUpdate): void;
    notifyGameUpdate(notify: INotifyGameUpdate): void;
    notifyGameDeleted(notify: INotifyGameDeleted): void;
    notifyGameSaveUpdate(notify: UserGameSave): void;
    notifyGameSaveDelete(notify: INotifyGameSaveDelete): void;
    notifyStorageUpdate(notify: INotifyStorageUpdate): void;
    notifyVipUpdate(notify: INotifyVipUpdate): void;
    notifyPaymentSuccess(notify: INotifyPaymentSuccess): void;
    notifyGameHistoryUpdate(notify: INotifyGameHistoryUpdate[]): void;
    notifyGameHistoryDelete(notify: INotifyGameHistoryDelete): void;
}
export interface INotifyUserInfoUpdate {
    nickname?: string;
    avatar?: string;
}
export interface INotifyGameUpdate {
    gameId: string;
    name: string;
    gameCoverImgUrl: string | null;
    savePath: string | null;
    exePath: string;
    cloudSaveNum: number;
    enableCloudSave: boolean;
    order: number;
    updateTime: number;
}
export interface INotifyGameDeleted {
    gameId: string;
}
export interface INotifyGameSaveDelete {
    gameId: string;
    saveId: string;
}
export interface INotifyStorageUpdate {
    usedSpace: number;
    totalSpace: number;
}
export interface INotifyVipUpdate {
    level: VIPLevel;
    expireTime: number;
}
export interface INotifyPaymentSuccess {
    orderId: string;
}
export interface INotifyGameHistoryUpdate {
    id: string;
    gameId: string;
    host: string;
    startTime: number;
    endTime: number;
    createTime: number;
}
export interface INotifyGameHistoryDelete {
    id: string;
}
export declare class GatewayHandler {
    notifyToSession<T>(body: IReqNotifyToSession<T>): Promise<{} | undefined>;
    checkConnection(body: IReqCheckConnection): Promise<IResCheckConnection>;
}
export interface IReqNotifyToSession<T> {
    session: string;
    service: string;
    method: string;
    payload: T;
}
export interface IReqCheckConnection {
    session: string;
}
export interface IResCheckConnection {
    alive: boolean;
}
export declare class OssHandler {
    avatarUploadCallback(body: IReqAvatarUploadCallback): Promise<{}>;
    gameSaveUploadCallback(body: IReqGameSaveUploadCallback): Promise<{}>;
}
export interface IReqAvatarUploadCallback {
    accountId: number;
    object: string;
}
export interface IReqGameSaveUploadCallback {
    accountId: number;
    size: number;
    object: string;
    gameId: string;
    saveId: string;
    stared: boolean;
    remark: string;
    hostname: string;
    createTime: number;
    directoryHash?: string | null;
    zipHash?: string | null;
    directorySize?: number | null;
}
export declare class PaymentHandler {
    wechatNativePrepay(body: IReqWechatNativePrepay): Promise<{
        sandbox: boolean;
        codeUrl?: undefined;
    } | {
        codeUrl: string;
        sandbox: boolean;
    }>;
    fetchProductSKU(): Promise<IRespFetchProductSKU[]>;
}
export interface IReqWechatNativePrepay {
    skuIdentify: SKUIdentify;
}
export interface IRespFetchProductSKU {
    id: number;
    identify: SKUIdentify;
    name: string;
    price: number;
}
export declare class WechatCallbackHandler {
    wechatPayCallback(body: IReqWechatMerchantCallback): Promise<{}>;
}
export interface IWechatEncryptedResource {
    original_type: string;
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
}
export interface IReqWechatMerchantCallback {
    id: string;
    create_time: string;
    resource_type: string;
    event_type: string;
    summary: string;
    resource: IWechatEncryptedResource;
}
export declare class RestfulHandler {
    fetch<T extends ObjectLiteral>(body: IReqFetch<T>): Promise<{
        list: Array<T>;
        total: number;
    }>;
    insert<T extends ObjectLiteral>(body: IReqInsert<T>): Promise<T>;
    insertBatch<T extends ObjectLiteral>(body: IReqInsertBatch<T>): Promise<T[]>;
    update<T extends ObjectLiteral>(body: IReqUpdate<T>): Promise<{}>;
    updateBatch<T extends ObjectLiteral>(body: IReqUpdateBatch<T>): Promise<{}>;
    delete<T extends ObjectLiteral>(body: IReqDelete<T>): Promise<{}>;
    deleteBatch<T extends ObjectLiteral>(body: IReqDeleteBatch<T>): Promise<{}>;
}
export interface ObjectLiteral {
    [key: string]: any;
}
export type EntityValueTypeProperty<T, V> = T extends Array<any> ? V : T extends string ? never : T extends number ? never : T extends V ? never : T extends Function ? never : T extends object ? EntityValueType<T> | V : V;
export type EntityValueType<T> = {
    [k in keyof T]?: EntityValueTypeProperty<T[k], boolean>;
};
export declare type FindOptionsOrderValue = "ASC" | "DESC" | "asc" | "desc" | 1 | -1 | {
    direction?: "asc" | "desc" | "ASC" | "DESC";
    nulls?: "first" | "last" | "FIRST" | "LAST";
};
export enum WhereOperators {
    any = "$any",
    between = "$between",
    eq = "$eq",
    iLike = "$iLike",
    in = "$in",
    isNull = "$isNull",
    lt = "$lt",
    lte = "$lte",
    like = "$like",
    gt = "$gt",
    gte = "$gte",
    not = "$not",
    raw = "$raw"
}
export type WhereOperatorCondition = {
    [K in WhereOperators]?: any;
};
export type Condition<T> = {
    [K in keyof T]?: T[K] | WhereOperatorCondition | Condition<T[K]>;
};
export type WhereCondition<T> = Condition<T> | Array<Condition<T>>;
export interface IReqFetch<T> {
    db: string;
    offset?: number;
    limit?: number;
    relations?: EntityValueType<T>;
    order?: {
        [k in keyof T]?: FindOptionsOrderValue;
    };
    select?: string[];
    where?: WhereCondition<T>;
}
export interface IReqInsert<T> {
    db: string;
    data: Partial<T>;
}
export interface IReqInsertBatch<T> {
    db: string;
    list: Partial<T>[];
}
export interface IReqUpdate<T> {
    data: Partial<T>;
    where: WhereCondition<T>;
    db: string;
}
export interface IReqUpdateBatch<T> {
    db: string;
    list: {
        where: WhereCondition<T>;
        data: Partial<T>;
    }[];
}
export interface IReqDelete<T> {
    db: string;
    where: WhereCondition<T>;
}
export interface IReqDeleteBatch<T> {
    db: string;
    where: WhereCondition<T>[];
}
export enum ServiceName {
    HttpGateway = "http-gateway",
    Restful = "restful",
    Auth = "auth",
    Business = "business",
    Oss = "oss",
    Payment = "payment"
}
export enum UserErrorCode {
    ERR_DUPLICATE_REGISTER = "ERR_DUPLICATE_REGISTER",
    ERR_USERNAME_NOT_FOUND = "ERR_USERNAME_NOT_FOUND",
    ERR_WRONG_PASSWORD = "ERR_WRONG_PASSWORD",
    ERR_PARAMETERS_INVALID = "ERR_PARAMETERS_INVALID",
    ERR_NOT_LOGIN = "ERR_NOT_LOGIN",
    ERR_PROTECTED_GROUP = "ERR_PROTECTED_GROUP",
    ERR_CANT_CREATE_ROOT = "ERR_CANT_CREATE_ROOT",
    ERR_ACCOUNT_NOT_FOUND = "ERR_ACCOUNT_NOT_FOUND",
    ERR_WRONG_EMAIL_CODE = "ERR_WRONG_EMAIL_CODE",
    ERR_ACCOUNT_DISABLED = "ERR_ACCOUNT_DISABLED",
    ERR_DISABLE_SELF = "ERR_DISABLE_SELF",
    ERR_INVALID_REQUEST = "ERR_INVALID_REQUEST",
    ERR_AUTH_GROUP_NOT_FOUND = "ERR_AUTH_GROUP_NOT_FOUND",
    ERR_AUTH_GROUP_NOT_EMPTY = "ERR_AUTH_GROUP_NOT_EMPTY",
    ERR_NICKNAME_LENGTH = "ERR_NICKNAME_LENGTH",
    ERR_GAME_NOT_FOUND = "ERR_GAME_NOT_FOUND",
    ERR_GAME_SAVE_NOT_FOUND = "ERR_GAME_SAVE_NOT_FOUND",
    ERR_GAME_HISTORY_NOT_FOUND = "ERR_GAME_HISTORY_NOT_FOUND",
    ERR_FILE_SPACE_LIMIT = "ERR_FILE_SPACE_LIMIT",
    ERR_PAYMENT_MAINTAIN = "ERR_PAYMENT_MAINTAIN",
    ERR_PRODUCT_NOT_FOUND = "ERR_PRODUCT_NOT_FOUND",
    ERR_PRODUCT_OFF_SALE = "ERR_PRODUCT_OFF_SALE",
    ERR_SPACE_NOT_ENOUGH = "ERR_SPACE_NOT_ENOUGH",
    ERR_AUTH_DENY = "ERR_AUTH_DENY",
    ERR_DB_NOT_FOUND = "ERR_DB_NOT_FOUND",
    ERR_SERVER_INTERNAL = "ERR_SERVER_INTERNAL"
}
