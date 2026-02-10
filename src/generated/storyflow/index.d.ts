
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Project
 * 
 */
export type Project = $Result.DefaultSelection<Prisma.$ProjectPayload>
/**
 * Model ProjectSettings
 * 
 */
export type ProjectSettings = $Result.DefaultSelection<Prisma.$ProjectSettingsPayload>
/**
 * Model Script
 * 
 */
export type Script = $Result.DefaultSelection<Prisma.$ScriptPayload>
/**
 * Model Asset
 * 
 */
export type Asset = $Result.DefaultSelection<Prisma.$AssetPayload>
/**
 * Model AppSettings
 * 
 */
export type AppSettings = $Result.DefaultSelection<Prisma.$AppSettingsPayload>
/**
 * Model Render
 * 
 */
export type Render = $Result.DefaultSelection<Prisma.$RenderPayload>
/**
 * Model AiCallLog
 * 
 */
export type AiCallLog = $Result.DefaultSelection<Prisma.$AiCallLogPayload>
/**
 * Model Viewport
 * 
 */
export type Viewport = $Result.DefaultSelection<Prisma.$ViewportPayload>
/**
 * Model Board
 * 
 */
export type Board = $Result.DefaultSelection<Prisma.$BoardPayload>
/**
 * Model Blueprint
 * 
 */
export type Blueprint = $Result.DefaultSelection<Prisma.$BlueprintPayload>
/**
 * Model ScriptDraft
 * 
 */
export type ScriptDraft = $Result.DefaultSelection<Prisma.$ScriptDraftPayload>
/**
 * Model BlueprintHistory
 * 
 */
export type BlueprintHistory = $Result.DefaultSelection<Prisma.$BlueprintHistoryPayload>
/**
 * Model ScriptDraftHistory
 * 
 */
export type ScriptDraftHistory = $Result.DefaultSelection<Prisma.$ScriptDraftHistoryPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const AiCallStatus: {
  PENDING: 'PENDING',
  STREAMING: 'STREAMING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export type AiCallStatus = (typeof AiCallStatus)[keyof typeof AiCallStatus]


export const ProjectStatus: {
  DRAFT: 'DRAFT',
  SCRIPT_READY: 'SCRIPT_READY',
  ASSETS_READY: 'ASSETS_READY',
  VIEWPORT_READY: 'VIEWPORT_READY',
  BOARDS_READY: 'BOARDS_READY',
  RENDER_READY: 'RENDER_READY',
  RENDERING: 'RENDERING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]


export const AssetType: {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  MUSIC: 'MUSIC'
};

export type AssetType = (typeof AssetType)[keyof typeof AssetType]


export const RenderQuality: {
  DRAFT: 'DRAFT',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  PRODUCTION: 'PRODUCTION'
};

export type RenderQuality = (typeof RenderQuality)[keyof typeof RenderQuality]


export const RenderStatus: {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type RenderStatus = (typeof RenderStatus)[keyof typeof RenderStatus]


export const BlueprintStatus: {
  GENERATING: 'GENERATING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export type BlueprintStatus = (typeof BlueprintStatus)[keyof typeof BlueprintStatus]


export const ScriptDraftStatus: {
  DRAFTING: 'DRAFTING',
  GLUING: 'GLUING',
  POLISHING: 'POLISHING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type ScriptDraftStatus = (typeof ScriptDraftStatus)[keyof typeof ScriptDraftStatus]

}

export type AiCallStatus = $Enums.AiCallStatus

export const AiCallStatus: typeof $Enums.AiCallStatus

export type ProjectStatus = $Enums.ProjectStatus

export const ProjectStatus: typeof $Enums.ProjectStatus

export type AssetType = $Enums.AssetType

export const AssetType: typeof $Enums.AssetType

export type RenderQuality = $Enums.RenderQuality

export const RenderQuality: typeof $Enums.RenderQuality

export type RenderStatus = $Enums.RenderStatus

export const RenderStatus: typeof $Enums.RenderStatus

export type BlueprintStatus = $Enums.BlueprintStatus

export const BlueprintStatus: typeof $Enums.BlueprintStatus

export type ScriptDraftStatus = $Enums.ScriptDraftStatus

export const ScriptDraftStatus: typeof $Enums.ScriptDraftStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Projects
 * const projects = await prisma.project.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Projects
   * const projects = await prisma.project.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.project`: Exposes CRUD operations for the **Project** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Projects
    * const projects = await prisma.project.findMany()
    * ```
    */
  get project(): Prisma.ProjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.projectSettings`: Exposes CRUD operations for the **ProjectSettings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProjectSettings
    * const projectSettings = await prisma.projectSettings.findMany()
    * ```
    */
  get projectSettings(): Prisma.ProjectSettingsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.script`: Exposes CRUD operations for the **Script** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Scripts
    * const scripts = await prisma.script.findMany()
    * ```
    */
  get script(): Prisma.ScriptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.asset`: Exposes CRUD operations for the **Asset** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Assets
    * const assets = await prisma.asset.findMany()
    * ```
    */
  get asset(): Prisma.AssetDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.appSettings`: Exposes CRUD operations for the **AppSettings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AppSettings
    * const appSettings = await prisma.appSettings.findMany()
    * ```
    */
  get appSettings(): Prisma.AppSettingsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.render`: Exposes CRUD operations for the **Render** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Renders
    * const renders = await prisma.render.findMany()
    * ```
    */
  get render(): Prisma.RenderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.aiCallLog`: Exposes CRUD operations for the **AiCallLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AiCallLogs
    * const aiCallLogs = await prisma.aiCallLog.findMany()
    * ```
    */
  get aiCallLog(): Prisma.AiCallLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.viewport`: Exposes CRUD operations for the **Viewport** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Viewports
    * const viewports = await prisma.viewport.findMany()
    * ```
    */
  get viewport(): Prisma.ViewportDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.board`: Exposes CRUD operations for the **Board** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Boards
    * const boards = await prisma.board.findMany()
    * ```
    */
  get board(): Prisma.BoardDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blueprint`: Exposes CRUD operations for the **Blueprint** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Blueprints
    * const blueprints = await prisma.blueprint.findMany()
    * ```
    */
  get blueprint(): Prisma.BlueprintDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.scriptDraft`: Exposes CRUD operations for the **ScriptDraft** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ScriptDrafts
    * const scriptDrafts = await prisma.scriptDraft.findMany()
    * ```
    */
  get scriptDraft(): Prisma.ScriptDraftDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blueprintHistory`: Exposes CRUD operations for the **BlueprintHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BlueprintHistories
    * const blueprintHistories = await prisma.blueprintHistory.findMany()
    * ```
    */
  get blueprintHistory(): Prisma.BlueprintHistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.scriptDraftHistory`: Exposes CRUD operations for the **ScriptDraftHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ScriptDraftHistories
    * const scriptDraftHistories = await prisma.scriptDraftHistory.findMany()
    * ```
    */
  get scriptDraftHistory(): Prisma.ScriptDraftHistoryDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.0
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Project: 'Project',
    ProjectSettings: 'ProjectSettings',
    Script: 'Script',
    Asset: 'Asset',
    AppSettings: 'AppSettings',
    Render: 'Render',
    AiCallLog: 'AiCallLog',
    Viewport: 'Viewport',
    Board: 'Board',
    Blueprint: 'Blueprint',
    ScriptDraft: 'ScriptDraft',
    BlueprintHistory: 'BlueprintHistory',
    ScriptDraftHistory: 'ScriptDraftHistory'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    storyflowDb?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "project" | "projectSettings" | "script" | "asset" | "appSettings" | "render" | "aiCallLog" | "viewport" | "board" | "blueprint" | "scriptDraft" | "blueprintHistory" | "scriptDraftHistory"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Project: {
        payload: Prisma.$ProjectPayload<ExtArgs>
        fields: Prisma.ProjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findFirst: {
            args: Prisma.ProjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findMany: {
            args: Prisma.ProjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          create: {
            args: Prisma.ProjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          createMany: {
            args: Prisma.ProjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          delete: {
            args: Prisma.ProjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          update: {
            args: Prisma.ProjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          deleteMany: {
            args: Prisma.ProjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          upsert: {
            args: Prisma.ProjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          aggregate: {
            args: Prisma.ProjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProject>
          }
          groupBy: {
            args: Prisma.ProjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectCountAggregateOutputType> | number
          }
        }
      }
      ProjectSettings: {
        payload: Prisma.$ProjectSettingsPayload<ExtArgs>
        fields: Prisma.ProjectSettingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectSettingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectSettingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          findFirst: {
            args: Prisma.ProjectSettingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectSettingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          findMany: {
            args: Prisma.ProjectSettingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>[]
          }
          create: {
            args: Prisma.ProjectSettingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          createMany: {
            args: Prisma.ProjectSettingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectSettingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>[]
          }
          delete: {
            args: Prisma.ProjectSettingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          update: {
            args: Prisma.ProjectSettingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          deleteMany: {
            args: Prisma.ProjectSettingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectSettingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectSettingsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>[]
          }
          upsert: {
            args: Prisma.ProjectSettingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectSettingsPayload>
          }
          aggregate: {
            args: Prisma.ProjectSettingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProjectSettings>
          }
          groupBy: {
            args: Prisma.ProjectSettingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectSettingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectSettingsCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectSettingsCountAggregateOutputType> | number
          }
        }
      }
      Script: {
        payload: Prisma.$ScriptPayload<ExtArgs>
        fields: Prisma.ScriptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ScriptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ScriptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          findFirst: {
            args: Prisma.ScriptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ScriptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          findMany: {
            args: Prisma.ScriptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>[]
          }
          create: {
            args: Prisma.ScriptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          createMany: {
            args: Prisma.ScriptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ScriptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>[]
          }
          delete: {
            args: Prisma.ScriptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          update: {
            args: Prisma.ScriptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          deleteMany: {
            args: Prisma.ScriptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ScriptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ScriptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>[]
          }
          upsert: {
            args: Prisma.ScriptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptPayload>
          }
          aggregate: {
            args: Prisma.ScriptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateScript>
          }
          groupBy: {
            args: Prisma.ScriptGroupByArgs<ExtArgs>
            result: $Utils.Optional<ScriptGroupByOutputType>[]
          }
          count: {
            args: Prisma.ScriptCountArgs<ExtArgs>
            result: $Utils.Optional<ScriptCountAggregateOutputType> | number
          }
        }
      }
      Asset: {
        payload: Prisma.$AssetPayload<ExtArgs>
        fields: Prisma.AssetFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AssetFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AssetFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          findFirst: {
            args: Prisma.AssetFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AssetFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          findMany: {
            args: Prisma.AssetFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>[]
          }
          create: {
            args: Prisma.AssetCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          createMany: {
            args: Prisma.AssetCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AssetCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>[]
          }
          delete: {
            args: Prisma.AssetDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          update: {
            args: Prisma.AssetUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          deleteMany: {
            args: Prisma.AssetDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AssetUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AssetUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>[]
          }
          upsert: {
            args: Prisma.AssetUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetPayload>
          }
          aggregate: {
            args: Prisma.AssetAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAsset>
          }
          groupBy: {
            args: Prisma.AssetGroupByArgs<ExtArgs>
            result: $Utils.Optional<AssetGroupByOutputType>[]
          }
          count: {
            args: Prisma.AssetCountArgs<ExtArgs>
            result: $Utils.Optional<AssetCountAggregateOutputType> | number
          }
        }
      }
      AppSettings: {
        payload: Prisma.$AppSettingsPayload<ExtArgs>
        fields: Prisma.AppSettingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppSettingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppSettingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          findFirst: {
            args: Prisma.AppSettingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppSettingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          findMany: {
            args: Prisma.AppSettingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>[]
          }
          create: {
            args: Prisma.AppSettingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          createMany: {
            args: Prisma.AppSettingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AppSettingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>[]
          }
          delete: {
            args: Prisma.AppSettingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          update: {
            args: Prisma.AppSettingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          deleteMany: {
            args: Prisma.AppSettingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppSettingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AppSettingsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>[]
          }
          upsert: {
            args: Prisma.AppSettingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          aggregate: {
            args: Prisma.AppSettingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAppSettings>
          }
          groupBy: {
            args: Prisma.AppSettingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppSettingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.AppSettingsCountArgs<ExtArgs>
            result: $Utils.Optional<AppSettingsCountAggregateOutputType> | number
          }
        }
      }
      Render: {
        payload: Prisma.$RenderPayload<ExtArgs>
        fields: Prisma.RenderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RenderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RenderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          findFirst: {
            args: Prisma.RenderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RenderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          findMany: {
            args: Prisma.RenderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>[]
          }
          create: {
            args: Prisma.RenderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          createMany: {
            args: Prisma.RenderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RenderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>[]
          }
          delete: {
            args: Prisma.RenderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          update: {
            args: Prisma.RenderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          deleteMany: {
            args: Prisma.RenderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RenderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RenderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>[]
          }
          upsert: {
            args: Prisma.RenderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RenderPayload>
          }
          aggregate: {
            args: Prisma.RenderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRender>
          }
          groupBy: {
            args: Prisma.RenderGroupByArgs<ExtArgs>
            result: $Utils.Optional<RenderGroupByOutputType>[]
          }
          count: {
            args: Prisma.RenderCountArgs<ExtArgs>
            result: $Utils.Optional<RenderCountAggregateOutputType> | number
          }
        }
      }
      AiCallLog: {
        payload: Prisma.$AiCallLogPayload<ExtArgs>
        fields: Prisma.AiCallLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AiCallLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AiCallLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          findFirst: {
            args: Prisma.AiCallLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AiCallLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          findMany: {
            args: Prisma.AiCallLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>[]
          }
          create: {
            args: Prisma.AiCallLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          createMany: {
            args: Prisma.AiCallLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AiCallLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>[]
          }
          delete: {
            args: Prisma.AiCallLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          update: {
            args: Prisma.AiCallLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          deleteMany: {
            args: Prisma.AiCallLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AiCallLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AiCallLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>[]
          }
          upsert: {
            args: Prisma.AiCallLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiCallLogPayload>
          }
          aggregate: {
            args: Prisma.AiCallLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAiCallLog>
          }
          groupBy: {
            args: Prisma.AiCallLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AiCallLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AiCallLogCountArgs<ExtArgs>
            result: $Utils.Optional<AiCallLogCountAggregateOutputType> | number
          }
        }
      }
      Viewport: {
        payload: Prisma.$ViewportPayload<ExtArgs>
        fields: Prisma.ViewportFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ViewportFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ViewportFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          findFirst: {
            args: Prisma.ViewportFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ViewportFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          findMany: {
            args: Prisma.ViewportFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>[]
          }
          create: {
            args: Prisma.ViewportCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          createMany: {
            args: Prisma.ViewportCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ViewportCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>[]
          }
          delete: {
            args: Prisma.ViewportDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          update: {
            args: Prisma.ViewportUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          deleteMany: {
            args: Prisma.ViewportDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ViewportUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ViewportUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>[]
          }
          upsert: {
            args: Prisma.ViewportUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ViewportPayload>
          }
          aggregate: {
            args: Prisma.ViewportAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateViewport>
          }
          groupBy: {
            args: Prisma.ViewportGroupByArgs<ExtArgs>
            result: $Utils.Optional<ViewportGroupByOutputType>[]
          }
          count: {
            args: Prisma.ViewportCountArgs<ExtArgs>
            result: $Utils.Optional<ViewportCountAggregateOutputType> | number
          }
        }
      }
      Board: {
        payload: Prisma.$BoardPayload<ExtArgs>
        fields: Prisma.BoardFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BoardFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BoardFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          findFirst: {
            args: Prisma.BoardFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BoardFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          findMany: {
            args: Prisma.BoardFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>[]
          }
          create: {
            args: Prisma.BoardCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          createMany: {
            args: Prisma.BoardCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BoardCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>[]
          }
          delete: {
            args: Prisma.BoardDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          update: {
            args: Prisma.BoardUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          deleteMany: {
            args: Prisma.BoardDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BoardUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BoardUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>[]
          }
          upsert: {
            args: Prisma.BoardUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoardPayload>
          }
          aggregate: {
            args: Prisma.BoardAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBoard>
          }
          groupBy: {
            args: Prisma.BoardGroupByArgs<ExtArgs>
            result: $Utils.Optional<BoardGroupByOutputType>[]
          }
          count: {
            args: Prisma.BoardCountArgs<ExtArgs>
            result: $Utils.Optional<BoardCountAggregateOutputType> | number
          }
        }
      }
      Blueprint: {
        payload: Prisma.$BlueprintPayload<ExtArgs>
        fields: Prisma.BlueprintFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlueprintFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlueprintFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          findFirst: {
            args: Prisma.BlueprintFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlueprintFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          findMany: {
            args: Prisma.BlueprintFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>[]
          }
          create: {
            args: Prisma.BlueprintCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          createMany: {
            args: Prisma.BlueprintCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BlueprintCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>[]
          }
          delete: {
            args: Prisma.BlueprintDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          update: {
            args: Prisma.BlueprintUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          deleteMany: {
            args: Prisma.BlueprintDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlueprintUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BlueprintUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>[]
          }
          upsert: {
            args: Prisma.BlueprintUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintPayload>
          }
          aggregate: {
            args: Prisma.BlueprintAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlueprint>
          }
          groupBy: {
            args: Prisma.BlueprintGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlueprintGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlueprintCountArgs<ExtArgs>
            result: $Utils.Optional<BlueprintCountAggregateOutputType> | number
          }
        }
      }
      ScriptDraft: {
        payload: Prisma.$ScriptDraftPayload<ExtArgs>
        fields: Prisma.ScriptDraftFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ScriptDraftFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ScriptDraftFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          findFirst: {
            args: Prisma.ScriptDraftFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ScriptDraftFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          findMany: {
            args: Prisma.ScriptDraftFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>[]
          }
          create: {
            args: Prisma.ScriptDraftCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          createMany: {
            args: Prisma.ScriptDraftCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ScriptDraftCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>[]
          }
          delete: {
            args: Prisma.ScriptDraftDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          update: {
            args: Prisma.ScriptDraftUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          deleteMany: {
            args: Prisma.ScriptDraftDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ScriptDraftUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ScriptDraftUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>[]
          }
          upsert: {
            args: Prisma.ScriptDraftUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftPayload>
          }
          aggregate: {
            args: Prisma.ScriptDraftAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateScriptDraft>
          }
          groupBy: {
            args: Prisma.ScriptDraftGroupByArgs<ExtArgs>
            result: $Utils.Optional<ScriptDraftGroupByOutputType>[]
          }
          count: {
            args: Prisma.ScriptDraftCountArgs<ExtArgs>
            result: $Utils.Optional<ScriptDraftCountAggregateOutputType> | number
          }
        }
      }
      BlueprintHistory: {
        payload: Prisma.$BlueprintHistoryPayload<ExtArgs>
        fields: Prisma.BlueprintHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlueprintHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlueprintHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          findFirst: {
            args: Prisma.BlueprintHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlueprintHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          findMany: {
            args: Prisma.BlueprintHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>[]
          }
          create: {
            args: Prisma.BlueprintHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          createMany: {
            args: Prisma.BlueprintHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BlueprintHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>[]
          }
          delete: {
            args: Prisma.BlueprintHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          update: {
            args: Prisma.BlueprintHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          deleteMany: {
            args: Prisma.BlueprintHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlueprintHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BlueprintHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>[]
          }
          upsert: {
            args: Prisma.BlueprintHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlueprintHistoryPayload>
          }
          aggregate: {
            args: Prisma.BlueprintHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlueprintHistory>
          }
          groupBy: {
            args: Prisma.BlueprintHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlueprintHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlueprintHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<BlueprintHistoryCountAggregateOutputType> | number
          }
        }
      }
      ScriptDraftHistory: {
        payload: Prisma.$ScriptDraftHistoryPayload<ExtArgs>
        fields: Prisma.ScriptDraftHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ScriptDraftHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ScriptDraftHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          findFirst: {
            args: Prisma.ScriptDraftHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ScriptDraftHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          findMany: {
            args: Prisma.ScriptDraftHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>[]
          }
          create: {
            args: Prisma.ScriptDraftHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          createMany: {
            args: Prisma.ScriptDraftHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ScriptDraftHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>[]
          }
          delete: {
            args: Prisma.ScriptDraftHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          update: {
            args: Prisma.ScriptDraftHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          deleteMany: {
            args: Prisma.ScriptDraftHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ScriptDraftHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ScriptDraftHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>[]
          }
          upsert: {
            args: Prisma.ScriptDraftHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScriptDraftHistoryPayload>
          }
          aggregate: {
            args: Prisma.ScriptDraftHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateScriptDraftHistory>
          }
          groupBy: {
            args: Prisma.ScriptDraftHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ScriptDraftHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ScriptDraftHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<ScriptDraftHistoryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    project?: ProjectOmit
    projectSettings?: ProjectSettingsOmit
    script?: ScriptOmit
    asset?: AssetOmit
    appSettings?: AppSettingsOmit
    render?: RenderOmit
    aiCallLog?: AiCallLogOmit
    viewport?: ViewportOmit
    board?: BoardOmit
    blueprint?: BlueprintOmit
    scriptDraft?: ScriptDraftOmit
    blueprintHistory?: BlueprintHistoryOmit
    scriptDraftHistory?: ScriptDraftHistoryOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ProjectCountOutputType
   */

  export type ProjectCountOutputType = {
    blueprints: number
    assets: number
    boards: number
    renders: number
    aiCallLogs: number
  }

  export type ProjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprints?: boolean | ProjectCountOutputTypeCountBlueprintsArgs
    assets?: boolean | ProjectCountOutputTypeCountAssetsArgs
    boards?: boolean | ProjectCountOutputTypeCountBoardsArgs
    renders?: boolean | ProjectCountOutputTypeCountRendersArgs
    aiCallLogs?: boolean | ProjectCountOutputTypeCountAiCallLogsArgs
  }

  // Custom InputTypes
  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectCountOutputType
     */
    select?: ProjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountBlueprintsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlueprintWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountAssetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AssetWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountBoardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BoardWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountRendersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RenderWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountAiCallLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiCallLogWhereInput
  }


  /**
   * Count Type AssetCountOutputType
   */

  export type AssetCountOutputType = {
    boards: number
  }

  export type AssetCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    boards?: boolean | AssetCountOutputTypeCountBoardsArgs
  }

  // Custom InputTypes
  /**
   * AssetCountOutputType without action
   */
  export type AssetCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetCountOutputType
     */
    select?: AssetCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AssetCountOutputType without action
   */
  export type AssetCountOutputTypeCountBoardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BoardWhereInput
  }


  /**
   * Count Type AiCallLogCountOutputType
   */

  export type AiCallLogCountOutputType = {
    children: number
  }

  export type AiCallLogCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | AiCallLogCountOutputTypeCountChildrenArgs
  }

  // Custom InputTypes
  /**
   * AiCallLogCountOutputType without action
   */
  export type AiCallLogCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLogCountOutputType
     */
    select?: AiCallLogCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AiCallLogCountOutputType without action
   */
  export type AiCallLogCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiCallLogWhereInput
  }


  /**
   * Count Type BlueprintCountOutputType
   */

  export type BlueprintCountOutputType = {
    scripts: number
    scriptDrafts: number
    histories: number
    draftHistories: number
  }

  export type BlueprintCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    scripts?: boolean | BlueprintCountOutputTypeCountScriptsArgs
    scriptDrafts?: boolean | BlueprintCountOutputTypeCountScriptDraftsArgs
    histories?: boolean | BlueprintCountOutputTypeCountHistoriesArgs
    draftHistories?: boolean | BlueprintCountOutputTypeCountDraftHistoriesArgs
  }

  // Custom InputTypes
  /**
   * BlueprintCountOutputType without action
   */
  export type BlueprintCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintCountOutputType
     */
    select?: BlueprintCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BlueprintCountOutputType without action
   */
  export type BlueprintCountOutputTypeCountScriptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptWhereInput
  }

  /**
   * BlueprintCountOutputType without action
   */
  export type BlueprintCountOutputTypeCountScriptDraftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptDraftWhereInput
  }

  /**
   * BlueprintCountOutputType without action
   */
  export type BlueprintCountOutputTypeCountHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlueprintHistoryWhereInput
  }

  /**
   * BlueprintCountOutputType without action
   */
  export type BlueprintCountOutputTypeCountDraftHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptDraftHistoryWhereInput
  }


  /**
   * Count Type ScriptDraftCountOutputType
   */

  export type ScriptDraftCountOutputType = {
    histories: number
  }

  export type ScriptDraftCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    histories?: boolean | ScriptDraftCountOutputTypeCountHistoriesArgs
  }

  // Custom InputTypes
  /**
   * ScriptDraftCountOutputType without action
   */
  export type ScriptDraftCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftCountOutputType
     */
    select?: ScriptDraftCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ScriptDraftCountOutputType without action
   */
  export type ScriptDraftCountOutputTypeCountHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptDraftHistoryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Project
   */

  export type AggregateProject = {
    _count: ProjectCountAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  export type ProjectMinAggregateOutputType = {
    id: string | null
    name: string | null
    topic: string | null
    status: $Enums.ProjectStatus | null
    aspectRatio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProjectMaxAggregateOutputType = {
    id: string | null
    name: string | null
    topic: string | null
    status: $Enums.ProjectStatus | null
    aspectRatio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProjectCountAggregateOutputType = {
    id: number
    name: number
    topic: number
    status: number
    aspectRatio: number
    wizardProgress: number
    createdAt: number
    updatedAt: number
    assetMappings: number
    _all: number
  }


  export type ProjectMinAggregateInputType = {
    id?: true
    name?: true
    topic?: true
    status?: true
    aspectRatio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProjectMaxAggregateInputType = {
    id?: true
    name?: true
    topic?: true
    status?: true
    aspectRatio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProjectCountAggregateInputType = {
    id?: true
    name?: true
    topic?: true
    status?: true
    aspectRatio?: true
    wizardProgress?: true
    createdAt?: true
    updatedAt?: true
    assetMappings?: true
    _all?: true
  }

  export type ProjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Project to aggregate.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Projects
    **/
    _count?: true | ProjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectMaxAggregateInputType
  }

  export type GetProjectAggregateType<T extends ProjectAggregateArgs> = {
        [P in keyof T & keyof AggregateProject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProject[P]>
      : GetScalarType<T[P], AggregateProject[P]>
  }




  export type ProjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectWhereInput
    orderBy?: ProjectOrderByWithAggregationInput | ProjectOrderByWithAggregationInput[]
    by: ProjectScalarFieldEnum[] | ProjectScalarFieldEnum
    having?: ProjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectCountAggregateInputType | true
    _min?: ProjectMinAggregateInputType
    _max?: ProjectMaxAggregateInputType
  }

  export type ProjectGroupByOutputType = {
    id: string
    name: string
    topic: string | null
    status: $Enums.ProjectStatus
    aspectRatio: string
    wizardProgress: JsonValue | null
    createdAt: Date
    updatedAt: Date
    assetMappings: JsonValue | null
    _count: ProjectCountAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  type GetProjectGroupByPayload<T extends ProjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectGroupByOutputType[P]>
        }
      >
    >


  export type ProjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    topic?: boolean
    status?: boolean
    aspectRatio?: boolean
    wizardProgress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    assetMappings?: boolean
    settings?: boolean | Project$settingsArgs<ExtArgs>
    script?: boolean | Project$scriptArgs<ExtArgs>
    blueprints?: boolean | Project$blueprintsArgs<ExtArgs>
    assets?: boolean | Project$assetsArgs<ExtArgs>
    viewport?: boolean | Project$viewportArgs<ExtArgs>
    boards?: boolean | Project$boardsArgs<ExtArgs>
    renders?: boolean | Project$rendersArgs<ExtArgs>
    aiCallLogs?: boolean | Project$aiCallLogsArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    topic?: boolean
    status?: boolean
    aspectRatio?: boolean
    wizardProgress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    assetMappings?: boolean
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    topic?: boolean
    status?: boolean
    aspectRatio?: boolean
    wizardProgress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    assetMappings?: boolean
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectScalar = {
    id?: boolean
    name?: boolean
    topic?: boolean
    status?: boolean
    aspectRatio?: boolean
    wizardProgress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    assetMappings?: boolean
  }

  export type ProjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "topic" | "status" | "aspectRatio" | "wizardProgress" | "createdAt" | "updatedAt" | "assetMappings", ExtArgs["result"]["project"]>
  export type ProjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    settings?: boolean | Project$settingsArgs<ExtArgs>
    script?: boolean | Project$scriptArgs<ExtArgs>
    blueprints?: boolean | Project$blueprintsArgs<ExtArgs>
    assets?: boolean | Project$assetsArgs<ExtArgs>
    viewport?: boolean | Project$viewportArgs<ExtArgs>
    boards?: boolean | Project$boardsArgs<ExtArgs>
    renders?: boolean | Project$rendersArgs<ExtArgs>
    aiCallLogs?: boolean | Project$aiCallLogsArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Project"
    objects: {
      settings: Prisma.$ProjectSettingsPayload<ExtArgs> | null
      script: Prisma.$ScriptPayload<ExtArgs> | null
      blueprints: Prisma.$BlueprintPayload<ExtArgs>[]
      assets: Prisma.$AssetPayload<ExtArgs>[]
      viewport: Prisma.$ViewportPayload<ExtArgs> | null
      boards: Prisma.$BoardPayload<ExtArgs>[]
      renders: Prisma.$RenderPayload<ExtArgs>[]
      aiCallLogs: Prisma.$AiCallLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      topic: string | null
      status: $Enums.ProjectStatus
      aspectRatio: string
      wizardProgress: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
      assetMappings: Prisma.JsonValue | null
    }, ExtArgs["result"]["project"]>
    composites: {}
  }

  type ProjectGetPayload<S extends boolean | null | undefined | ProjectDefaultArgs> = $Result.GetResult<Prisma.$ProjectPayload, S>

  type ProjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectCountAggregateInputType | true
    }

  export interface ProjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Project'], meta: { name: 'Project' } }
    /**
     * Find zero or one Project that matches the filter.
     * @param {ProjectFindUniqueArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectFindUniqueArgs>(args: SelectSubset<T, ProjectFindUniqueArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Project that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectFindUniqueOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectFindFirstArgs>(args?: SelectSubset<T, ProjectFindFirstArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Projects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Projects
     * const projects = await prisma.project.findMany()
     * 
     * // Get first 10 Projects
     * const projects = await prisma.project.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectWithIdOnly = await prisma.project.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectFindManyArgs>(args?: SelectSubset<T, ProjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Project.
     * @param {ProjectCreateArgs} args - Arguments to create a Project.
     * @example
     * // Create one Project
     * const Project = await prisma.project.create({
     *   data: {
     *     // ... data to create a Project
     *   }
     * })
     * 
     */
    create<T extends ProjectCreateArgs>(args: SelectSubset<T, ProjectCreateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Projects.
     * @param {ProjectCreateManyArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectCreateManyArgs>(args?: SelectSubset<T, ProjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Projects and returns the data saved in the database.
     * @param {ProjectCreateManyAndReturnArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Project.
     * @param {ProjectDeleteArgs} args - Arguments to delete one Project.
     * @example
     * // Delete one Project
     * const Project = await prisma.project.delete({
     *   where: {
     *     // ... filter to delete one Project
     *   }
     * })
     * 
     */
    delete<T extends ProjectDeleteArgs>(args: SelectSubset<T, ProjectDeleteArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Project.
     * @param {ProjectUpdateArgs} args - Arguments to update one Project.
     * @example
     * // Update one Project
     * const project = await prisma.project.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectUpdateArgs>(args: SelectSubset<T, ProjectUpdateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Projects.
     * @param {ProjectDeleteManyArgs} args - Arguments to filter Projects to delete.
     * @example
     * // Delete a few Projects
     * const { count } = await prisma.project.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectDeleteManyArgs>(args?: SelectSubset<T, ProjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectUpdateManyArgs>(args: SelectSubset<T, ProjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects and returns the data updated in the database.
     * @param {ProjectUpdateManyAndReturnArgs} args - Arguments to update many Projects.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Project.
     * @param {ProjectUpsertArgs} args - Arguments to update or create a Project.
     * @example
     * // Update or create a Project
     * const project = await prisma.project.upsert({
     *   create: {
     *     // ... data to create a Project
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Project we want to update
     *   }
     * })
     */
    upsert<T extends ProjectUpsertArgs>(args: SelectSubset<T, ProjectUpsertArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectCountArgs} args - Arguments to filter Projects to count.
     * @example
     * // Count the number of Projects
     * const count = await prisma.project.count({
     *   where: {
     *     // ... the filter for the Projects we want to count
     *   }
     * })
    **/
    count<T extends ProjectCountArgs>(
      args?: Subset<T, ProjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectAggregateArgs>(args: Subset<T, ProjectAggregateArgs>): Prisma.PrismaPromise<GetProjectAggregateType<T>>

    /**
     * Group by Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectGroupByArgs['orderBy'] }
        : { orderBy?: ProjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Project model
   */
  readonly fields: ProjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Project.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    settings<T extends Project$settingsArgs<ExtArgs> = {}>(args?: Subset<T, Project$settingsArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    script<T extends Project$scriptArgs<ExtArgs> = {}>(args?: Subset<T, Project$scriptArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    blueprints<T extends Project$blueprintsArgs<ExtArgs> = {}>(args?: Subset<T, Project$blueprintsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    assets<T extends Project$assetsArgs<ExtArgs> = {}>(args?: Subset<T, Project$assetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    viewport<T extends Project$viewportArgs<ExtArgs> = {}>(args?: Subset<T, Project$viewportArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    boards<T extends Project$boardsArgs<ExtArgs> = {}>(args?: Subset<T, Project$boardsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    renders<T extends Project$rendersArgs<ExtArgs> = {}>(args?: Subset<T, Project$rendersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    aiCallLogs<T extends Project$aiCallLogsArgs<ExtArgs> = {}>(args?: Subset<T, Project$aiCallLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Project model
   */
  interface ProjectFieldRefs {
    readonly id: FieldRef<"Project", 'String'>
    readonly name: FieldRef<"Project", 'String'>
    readonly topic: FieldRef<"Project", 'String'>
    readonly status: FieldRef<"Project", 'ProjectStatus'>
    readonly aspectRatio: FieldRef<"Project", 'String'>
    readonly wizardProgress: FieldRef<"Project", 'Json'>
    readonly createdAt: FieldRef<"Project", 'DateTime'>
    readonly updatedAt: FieldRef<"Project", 'DateTime'>
    readonly assetMappings: FieldRef<"Project", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Project findUnique
   */
  export type ProjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findUniqueOrThrow
   */
  export type ProjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findFirst
   */
  export type ProjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findFirstOrThrow
   */
  export type ProjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findMany
   */
  export type ProjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Projects to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project create
   */
  export type ProjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to create a Project.
     */
    data: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
  }

  /**
   * Project createMany
   */
  export type ProjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
  }

  /**
   * Project createManyAndReturn
   */
  export type ProjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
  }

  /**
   * Project update
   */
  export type ProjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to update a Project.
     */
    data: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
    /**
     * Choose, which Project to update.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project updateMany
   */
  export type ProjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
  }

  /**
   * Project updateManyAndReturn
   */
  export type ProjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
  }

  /**
   * Project upsert
   */
  export type ProjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The filter to search for the Project to update in case it exists.
     */
    where: ProjectWhereUniqueInput
    /**
     * In case the Project found by the `where` argument doesn't exist, create a new Project with this data.
     */
    create: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
    /**
     * In case the Project was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
  }

  /**
   * Project delete
   */
  export type ProjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter which Project to delete.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project deleteMany
   */
  export type ProjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Projects to delete
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to delete.
     */
    limit?: number
  }

  /**
   * Project.settings
   */
  export type Project$settingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    where?: ProjectSettingsWhereInput
  }

  /**
   * Project.script
   */
  export type Project$scriptArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    where?: ScriptWhereInput
  }

  /**
   * Project.blueprints
   */
  export type Project$blueprintsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    where?: BlueprintWhereInput
    orderBy?: BlueprintOrderByWithRelationInput | BlueprintOrderByWithRelationInput[]
    cursor?: BlueprintWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlueprintScalarFieldEnum | BlueprintScalarFieldEnum[]
  }

  /**
   * Project.assets
   */
  export type Project$assetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    where?: AssetWhereInput
    orderBy?: AssetOrderByWithRelationInput | AssetOrderByWithRelationInput[]
    cursor?: AssetWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AssetScalarFieldEnum | AssetScalarFieldEnum[]
  }

  /**
   * Project.viewport
   */
  export type Project$viewportArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    where?: ViewportWhereInput
  }

  /**
   * Project.boards
   */
  export type Project$boardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    where?: BoardWhereInput
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    cursor?: BoardWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BoardScalarFieldEnum | BoardScalarFieldEnum[]
  }

  /**
   * Project.renders
   */
  export type Project$rendersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    where?: RenderWhereInput
    orderBy?: RenderOrderByWithRelationInput | RenderOrderByWithRelationInput[]
    cursor?: RenderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RenderScalarFieldEnum | RenderScalarFieldEnum[]
  }

  /**
   * Project.aiCallLogs
   */
  export type Project$aiCallLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    where?: AiCallLogWhereInput
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    cursor?: AiCallLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AiCallLogScalarFieldEnum | AiCallLogScalarFieldEnum[]
  }

  /**
   * Project without action
   */
  export type ProjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
  }


  /**
   * Model ProjectSettings
   */

  export type AggregateProjectSettings = {
    _count: ProjectSettingsCountAggregateOutputType | null
    _avg: ProjectSettingsAvgAggregateOutputType | null
    _sum: ProjectSettingsSumAggregateOutputType | null
    _min: ProjectSettingsMinAggregateOutputType | null
    _max: ProjectSettingsMaxAggregateOutputType | null
  }

  export type ProjectSettingsAvgAggregateOutputType = {
    temperature: number | null
    speakingRate: number | null
    pitch: number | null
    musicVolume: number | null
  }

  export type ProjectSettingsSumAggregateOutputType = {
    temperature: number | null
    speakingRate: number | null
    pitch: number | null
    musicVolume: number | null
  }

  export type ProjectSettingsMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    provider: string | null
    model: string | null
    temperature: number | null
    voice: string | null
    speakingRate: number | null
    pitch: number | null
    defaultQuality: string | null
    defaultAspectRatio: string | null
    musicTrackId: string | null
    musicVolume: number | null
  }

  export type ProjectSettingsMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    provider: string | null
    model: string | null
    temperature: number | null
    voice: string | null
    speakingRate: number | null
    pitch: number | null
    defaultQuality: string | null
    defaultAspectRatio: string | null
    musicTrackId: string | null
    musicVolume: number | null
  }

  export type ProjectSettingsCountAggregateOutputType = {
    id: number
    projectId: number
    provider: number
    model: number
    temperature: number
    voice: number
    speakingRate: number
    pitch: number
    defaultQuality: number
    defaultAspectRatio: number
    musicTrackId: number
    musicVolume: number
    _all: number
  }


  export type ProjectSettingsAvgAggregateInputType = {
    temperature?: true
    speakingRate?: true
    pitch?: true
    musicVolume?: true
  }

  export type ProjectSettingsSumAggregateInputType = {
    temperature?: true
    speakingRate?: true
    pitch?: true
    musicVolume?: true
  }

  export type ProjectSettingsMinAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    temperature?: true
    voice?: true
    speakingRate?: true
    pitch?: true
    defaultQuality?: true
    defaultAspectRatio?: true
    musicTrackId?: true
    musicVolume?: true
  }

  export type ProjectSettingsMaxAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    temperature?: true
    voice?: true
    speakingRate?: true
    pitch?: true
    defaultQuality?: true
    defaultAspectRatio?: true
    musicTrackId?: true
    musicVolume?: true
  }

  export type ProjectSettingsCountAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    temperature?: true
    voice?: true
    speakingRate?: true
    pitch?: true
    defaultQuality?: true
    defaultAspectRatio?: true
    musicTrackId?: true
    musicVolume?: true
    _all?: true
  }

  export type ProjectSettingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectSettings to aggregate.
     */
    where?: ProjectSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectSettings to fetch.
     */
    orderBy?: ProjectSettingsOrderByWithRelationInput | ProjectSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProjectSettings
    **/
    _count?: true | ProjectSettingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProjectSettingsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProjectSettingsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectSettingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectSettingsMaxAggregateInputType
  }

  export type GetProjectSettingsAggregateType<T extends ProjectSettingsAggregateArgs> = {
        [P in keyof T & keyof AggregateProjectSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProjectSettings[P]>
      : GetScalarType<T[P], AggregateProjectSettings[P]>
  }




  export type ProjectSettingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectSettingsWhereInput
    orderBy?: ProjectSettingsOrderByWithAggregationInput | ProjectSettingsOrderByWithAggregationInput[]
    by: ProjectSettingsScalarFieldEnum[] | ProjectSettingsScalarFieldEnum
    having?: ProjectSettingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectSettingsCountAggregateInputType | true
    _avg?: ProjectSettingsAvgAggregateInputType
    _sum?: ProjectSettingsSumAggregateInputType
    _min?: ProjectSettingsMinAggregateInputType
    _max?: ProjectSettingsMaxAggregateInputType
  }

  export type ProjectSettingsGroupByOutputType = {
    id: string
    projectId: string
    provider: string
    model: string
    temperature: number
    voice: string
    speakingRate: number
    pitch: number
    defaultQuality: string
    defaultAspectRatio: string
    musicTrackId: string | null
    musicVolume: number
    _count: ProjectSettingsCountAggregateOutputType | null
    _avg: ProjectSettingsAvgAggregateOutputType | null
    _sum: ProjectSettingsSumAggregateOutputType | null
    _min: ProjectSettingsMinAggregateOutputType | null
    _max: ProjectSettingsMaxAggregateOutputType | null
  }

  type GetProjectSettingsGroupByPayload<T extends ProjectSettingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectSettingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectSettingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectSettingsGroupByOutputType[P]>
        }
      >
    >


  export type ProjectSettingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    temperature?: boolean
    voice?: boolean
    speakingRate?: boolean
    pitch?: boolean
    defaultQuality?: boolean
    defaultAspectRatio?: boolean
    musicTrackId?: boolean
    musicVolume?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["projectSettings"]>

  export type ProjectSettingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    temperature?: boolean
    voice?: boolean
    speakingRate?: boolean
    pitch?: boolean
    defaultQuality?: boolean
    defaultAspectRatio?: boolean
    musicTrackId?: boolean
    musicVolume?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["projectSettings"]>

  export type ProjectSettingsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    temperature?: boolean
    voice?: boolean
    speakingRate?: boolean
    pitch?: boolean
    defaultQuality?: boolean
    defaultAspectRatio?: boolean
    musicTrackId?: boolean
    musicVolume?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["projectSettings"]>

  export type ProjectSettingsSelectScalar = {
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    temperature?: boolean
    voice?: boolean
    speakingRate?: boolean
    pitch?: boolean
    defaultQuality?: boolean
    defaultAspectRatio?: boolean
    musicTrackId?: boolean
    musicVolume?: boolean
  }

  export type ProjectSettingsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "provider" | "model" | "temperature" | "voice" | "speakingRate" | "pitch" | "defaultQuality" | "defaultAspectRatio" | "musicTrackId" | "musicVolume", ExtArgs["result"]["projectSettings"]>
  export type ProjectSettingsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type ProjectSettingsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type ProjectSettingsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $ProjectSettingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProjectSettings"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      provider: string
      model: string
      temperature: number
      voice: string
      speakingRate: number
      pitch: number
      defaultQuality: string
      defaultAspectRatio: string
      musicTrackId: string | null
      musicVolume: number
    }, ExtArgs["result"]["projectSettings"]>
    composites: {}
  }

  type ProjectSettingsGetPayload<S extends boolean | null | undefined | ProjectSettingsDefaultArgs> = $Result.GetResult<Prisma.$ProjectSettingsPayload, S>

  type ProjectSettingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectSettingsCountAggregateInputType | true
    }

  export interface ProjectSettingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProjectSettings'], meta: { name: 'ProjectSettings' } }
    /**
     * Find zero or one ProjectSettings that matches the filter.
     * @param {ProjectSettingsFindUniqueArgs} args - Arguments to find a ProjectSettings
     * @example
     * // Get one ProjectSettings
     * const projectSettings = await prisma.projectSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectSettingsFindUniqueArgs>(args: SelectSubset<T, ProjectSettingsFindUniqueArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProjectSettings that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectSettingsFindUniqueOrThrowArgs} args - Arguments to find a ProjectSettings
     * @example
     * // Get one ProjectSettings
     * const projectSettings = await prisma.projectSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectSettingsFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsFindFirstArgs} args - Arguments to find a ProjectSettings
     * @example
     * // Get one ProjectSettings
     * const projectSettings = await prisma.projectSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectSettingsFindFirstArgs>(args?: SelectSubset<T, ProjectSettingsFindFirstArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsFindFirstOrThrowArgs} args - Arguments to find a ProjectSettings
     * @example
     * // Get one ProjectSettings
     * const projectSettings = await prisma.projectSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectSettingsFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProjectSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProjectSettings
     * const projectSettings = await prisma.projectSettings.findMany()
     * 
     * // Get first 10 ProjectSettings
     * const projectSettings = await prisma.projectSettings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectSettingsWithIdOnly = await prisma.projectSettings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectSettingsFindManyArgs>(args?: SelectSubset<T, ProjectSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProjectSettings.
     * @param {ProjectSettingsCreateArgs} args - Arguments to create a ProjectSettings.
     * @example
     * // Create one ProjectSettings
     * const ProjectSettings = await prisma.projectSettings.create({
     *   data: {
     *     // ... data to create a ProjectSettings
     *   }
     * })
     * 
     */
    create<T extends ProjectSettingsCreateArgs>(args: SelectSubset<T, ProjectSettingsCreateArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProjectSettings.
     * @param {ProjectSettingsCreateManyArgs} args - Arguments to create many ProjectSettings.
     * @example
     * // Create many ProjectSettings
     * const projectSettings = await prisma.projectSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectSettingsCreateManyArgs>(args?: SelectSubset<T, ProjectSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProjectSettings and returns the data saved in the database.
     * @param {ProjectSettingsCreateManyAndReturnArgs} args - Arguments to create many ProjectSettings.
     * @example
     * // Create many ProjectSettings
     * const projectSettings = await prisma.projectSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProjectSettings and only return the `id`
     * const projectSettingsWithIdOnly = await prisma.projectSettings.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectSettingsCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProjectSettings.
     * @param {ProjectSettingsDeleteArgs} args - Arguments to delete one ProjectSettings.
     * @example
     * // Delete one ProjectSettings
     * const ProjectSettings = await prisma.projectSettings.delete({
     *   where: {
     *     // ... filter to delete one ProjectSettings
     *   }
     * })
     * 
     */
    delete<T extends ProjectSettingsDeleteArgs>(args: SelectSubset<T, ProjectSettingsDeleteArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProjectSettings.
     * @param {ProjectSettingsUpdateArgs} args - Arguments to update one ProjectSettings.
     * @example
     * // Update one ProjectSettings
     * const projectSettings = await prisma.projectSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectSettingsUpdateArgs>(args: SelectSubset<T, ProjectSettingsUpdateArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProjectSettings.
     * @param {ProjectSettingsDeleteManyArgs} args - Arguments to filter ProjectSettings to delete.
     * @example
     * // Delete a few ProjectSettings
     * const { count } = await prisma.projectSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectSettingsDeleteManyArgs>(args?: SelectSubset<T, ProjectSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProjectSettings
     * const projectSettings = await prisma.projectSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectSettingsUpdateManyArgs>(args: SelectSubset<T, ProjectSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectSettings and returns the data updated in the database.
     * @param {ProjectSettingsUpdateManyAndReturnArgs} args - Arguments to update many ProjectSettings.
     * @example
     * // Update many ProjectSettings
     * const projectSettings = await prisma.projectSettings.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProjectSettings and only return the `id`
     * const projectSettingsWithIdOnly = await prisma.projectSettings.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectSettingsUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProjectSettings.
     * @param {ProjectSettingsUpsertArgs} args - Arguments to update or create a ProjectSettings.
     * @example
     * // Update or create a ProjectSettings
     * const projectSettings = await prisma.projectSettings.upsert({
     *   create: {
     *     // ... data to create a ProjectSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProjectSettings we want to update
     *   }
     * })
     */
    upsert<T extends ProjectSettingsUpsertArgs>(args: SelectSubset<T, ProjectSettingsUpsertArgs<ExtArgs>>): Prisma__ProjectSettingsClient<$Result.GetResult<Prisma.$ProjectSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProjectSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsCountArgs} args - Arguments to filter ProjectSettings to count.
     * @example
     * // Count the number of ProjectSettings
     * const count = await prisma.projectSettings.count({
     *   where: {
     *     // ... the filter for the ProjectSettings we want to count
     *   }
     * })
    **/
    count<T extends ProjectSettingsCountArgs>(
      args?: Subset<T, ProjectSettingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectSettingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProjectSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectSettingsAggregateArgs>(args: Subset<T, ProjectSettingsAggregateArgs>): Prisma.PrismaPromise<GetProjectSettingsAggregateType<T>>

    /**
     * Group by ProjectSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectSettingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectSettingsGroupByArgs['orderBy'] }
        : { orderBy?: ProjectSettingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProjectSettings model
   */
  readonly fields: ProjectSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProjectSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectSettingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProjectSettings model
   */
  interface ProjectSettingsFieldRefs {
    readonly id: FieldRef<"ProjectSettings", 'String'>
    readonly projectId: FieldRef<"ProjectSettings", 'String'>
    readonly provider: FieldRef<"ProjectSettings", 'String'>
    readonly model: FieldRef<"ProjectSettings", 'String'>
    readonly temperature: FieldRef<"ProjectSettings", 'Float'>
    readonly voice: FieldRef<"ProjectSettings", 'String'>
    readonly speakingRate: FieldRef<"ProjectSettings", 'Float'>
    readonly pitch: FieldRef<"ProjectSettings", 'Float'>
    readonly defaultQuality: FieldRef<"ProjectSettings", 'String'>
    readonly defaultAspectRatio: FieldRef<"ProjectSettings", 'String'>
    readonly musicTrackId: FieldRef<"ProjectSettings", 'String'>
    readonly musicVolume: FieldRef<"ProjectSettings", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * ProjectSettings findUnique
   */
  export type ProjectSettingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter, which ProjectSettings to fetch.
     */
    where: ProjectSettingsWhereUniqueInput
  }

  /**
   * ProjectSettings findUniqueOrThrow
   */
  export type ProjectSettingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter, which ProjectSettings to fetch.
     */
    where: ProjectSettingsWhereUniqueInput
  }

  /**
   * ProjectSettings findFirst
   */
  export type ProjectSettingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter, which ProjectSettings to fetch.
     */
    where?: ProjectSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectSettings to fetch.
     */
    orderBy?: ProjectSettingsOrderByWithRelationInput | ProjectSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectSettings.
     */
    cursor?: ProjectSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectSettings.
     */
    distinct?: ProjectSettingsScalarFieldEnum | ProjectSettingsScalarFieldEnum[]
  }

  /**
   * ProjectSettings findFirstOrThrow
   */
  export type ProjectSettingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter, which ProjectSettings to fetch.
     */
    where?: ProjectSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectSettings to fetch.
     */
    orderBy?: ProjectSettingsOrderByWithRelationInput | ProjectSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectSettings.
     */
    cursor?: ProjectSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectSettings.
     */
    distinct?: ProjectSettingsScalarFieldEnum | ProjectSettingsScalarFieldEnum[]
  }

  /**
   * ProjectSettings findMany
   */
  export type ProjectSettingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter, which ProjectSettings to fetch.
     */
    where?: ProjectSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectSettings to fetch.
     */
    orderBy?: ProjectSettingsOrderByWithRelationInput | ProjectSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProjectSettings.
     */
    cursor?: ProjectSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectSettings.
     */
    skip?: number
    distinct?: ProjectSettingsScalarFieldEnum | ProjectSettingsScalarFieldEnum[]
  }

  /**
   * ProjectSettings create
   */
  export type ProjectSettingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * The data needed to create a ProjectSettings.
     */
    data: XOR<ProjectSettingsCreateInput, ProjectSettingsUncheckedCreateInput>
  }

  /**
   * ProjectSettings createMany
   */
  export type ProjectSettingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProjectSettings.
     */
    data: ProjectSettingsCreateManyInput | ProjectSettingsCreateManyInput[]
  }

  /**
   * ProjectSettings createManyAndReturn
   */
  export type ProjectSettingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * The data used to create many ProjectSettings.
     */
    data: ProjectSettingsCreateManyInput | ProjectSettingsCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProjectSettings update
   */
  export type ProjectSettingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * The data needed to update a ProjectSettings.
     */
    data: XOR<ProjectSettingsUpdateInput, ProjectSettingsUncheckedUpdateInput>
    /**
     * Choose, which ProjectSettings to update.
     */
    where: ProjectSettingsWhereUniqueInput
  }

  /**
   * ProjectSettings updateMany
   */
  export type ProjectSettingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProjectSettings.
     */
    data: XOR<ProjectSettingsUpdateManyMutationInput, ProjectSettingsUncheckedUpdateManyInput>
    /**
     * Filter which ProjectSettings to update
     */
    where?: ProjectSettingsWhereInput
    /**
     * Limit how many ProjectSettings to update.
     */
    limit?: number
  }

  /**
   * ProjectSettings updateManyAndReturn
   */
  export type ProjectSettingsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * The data used to update ProjectSettings.
     */
    data: XOR<ProjectSettingsUpdateManyMutationInput, ProjectSettingsUncheckedUpdateManyInput>
    /**
     * Filter which ProjectSettings to update
     */
    where?: ProjectSettingsWhereInput
    /**
     * Limit how many ProjectSettings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProjectSettings upsert
   */
  export type ProjectSettingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * The filter to search for the ProjectSettings to update in case it exists.
     */
    where: ProjectSettingsWhereUniqueInput
    /**
     * In case the ProjectSettings found by the `where` argument doesn't exist, create a new ProjectSettings with this data.
     */
    create: XOR<ProjectSettingsCreateInput, ProjectSettingsUncheckedCreateInput>
    /**
     * In case the ProjectSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectSettingsUpdateInput, ProjectSettingsUncheckedUpdateInput>
  }

  /**
   * ProjectSettings delete
   */
  export type ProjectSettingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
    /**
     * Filter which ProjectSettings to delete.
     */
    where: ProjectSettingsWhereUniqueInput
  }

  /**
   * ProjectSettings deleteMany
   */
  export type ProjectSettingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectSettings to delete
     */
    where?: ProjectSettingsWhereInput
    /**
     * Limit how many ProjectSettings to delete.
     */
    limit?: number
  }

  /**
   * ProjectSettings without action
   */
  export type ProjectSettingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectSettings
     */
    select?: ProjectSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectSettings
     */
    omit?: ProjectSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectSettingsInclude<ExtArgs> | null
  }


  /**
   * Model Script
   */

  export type AggregateScript = {
    _count: ScriptCountAggregateOutputType | null
    _min: ScriptMinAggregateOutputType | null
    _max: ScriptMaxAggregateOutputType | null
  }

  export type ScriptMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    blueprintId: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ScriptMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    blueprintId: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ScriptCountAggregateOutputType = {
    id: number
    projectId: number
    blueprintId: number
    title: number
    segments: number
    timestamps: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ScriptMinAggregateInputType = {
    id?: true
    projectId?: true
    blueprintId?: true
    title?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ScriptMaxAggregateInputType = {
    id?: true
    projectId?: true
    blueprintId?: true
    title?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ScriptCountAggregateInputType = {
    id?: true
    projectId?: true
    blueprintId?: true
    title?: true
    segments?: true
    timestamps?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ScriptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Script to aggregate.
     */
    where?: ScriptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scripts to fetch.
     */
    orderBy?: ScriptOrderByWithRelationInput | ScriptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ScriptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scripts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scripts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Scripts
    **/
    _count?: true | ScriptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ScriptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ScriptMaxAggregateInputType
  }

  export type GetScriptAggregateType<T extends ScriptAggregateArgs> = {
        [P in keyof T & keyof AggregateScript]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateScript[P]>
      : GetScalarType<T[P], AggregateScript[P]>
  }




  export type ScriptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptWhereInput
    orderBy?: ScriptOrderByWithAggregationInput | ScriptOrderByWithAggregationInput[]
    by: ScriptScalarFieldEnum[] | ScriptScalarFieldEnum
    having?: ScriptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ScriptCountAggregateInputType | true
    _min?: ScriptMinAggregateInputType
    _max?: ScriptMaxAggregateInputType
  }

  export type ScriptGroupByOutputType = {
    id: string
    projectId: string
    blueprintId: string | null
    title: string
    segments: JsonValue
    timestamps: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ScriptCountAggregateOutputType | null
    _min: ScriptMinAggregateOutputType | null
    _max: ScriptMaxAggregateOutputType | null
  }

  type GetScriptGroupByPayload<T extends ScriptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ScriptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ScriptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ScriptGroupByOutputType[P]>
            : GetScalarType<T[P], ScriptGroupByOutputType[P]>
        }
      >
    >


  export type ScriptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    blueprintId?: boolean
    title?: boolean
    segments?: boolean
    timestamps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }, ExtArgs["result"]["script"]>

  export type ScriptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    blueprintId?: boolean
    title?: boolean
    segments?: boolean
    timestamps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }, ExtArgs["result"]["script"]>

  export type ScriptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    blueprintId?: boolean
    title?: boolean
    segments?: boolean
    timestamps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }, ExtArgs["result"]["script"]>

  export type ScriptSelectScalar = {
    id?: boolean
    projectId?: boolean
    blueprintId?: boolean
    title?: boolean
    segments?: boolean
    timestamps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ScriptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "blueprintId" | "title" | "segments" | "timestamps" | "createdAt" | "updatedAt", ExtArgs["result"]["script"]>
  export type ScriptInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }
  export type ScriptIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }
  export type ScriptIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    blueprint?: boolean | Script$blueprintArgs<ExtArgs>
  }

  export type $ScriptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Script"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      blueprint: Prisma.$BlueprintPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      blueprintId: string | null
      title: string
      segments: Prisma.JsonValue
      timestamps: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["script"]>
    composites: {}
  }

  type ScriptGetPayload<S extends boolean | null | undefined | ScriptDefaultArgs> = $Result.GetResult<Prisma.$ScriptPayload, S>

  type ScriptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ScriptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ScriptCountAggregateInputType | true
    }

  export interface ScriptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Script'], meta: { name: 'Script' } }
    /**
     * Find zero or one Script that matches the filter.
     * @param {ScriptFindUniqueArgs} args - Arguments to find a Script
     * @example
     * // Get one Script
     * const script = await prisma.script.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ScriptFindUniqueArgs>(args: SelectSubset<T, ScriptFindUniqueArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Script that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ScriptFindUniqueOrThrowArgs} args - Arguments to find a Script
     * @example
     * // Get one Script
     * const script = await prisma.script.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ScriptFindUniqueOrThrowArgs>(args: SelectSubset<T, ScriptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Script that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptFindFirstArgs} args - Arguments to find a Script
     * @example
     * // Get one Script
     * const script = await prisma.script.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ScriptFindFirstArgs>(args?: SelectSubset<T, ScriptFindFirstArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Script that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptFindFirstOrThrowArgs} args - Arguments to find a Script
     * @example
     * // Get one Script
     * const script = await prisma.script.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ScriptFindFirstOrThrowArgs>(args?: SelectSubset<T, ScriptFindFirstOrThrowArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Scripts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Scripts
     * const scripts = await prisma.script.findMany()
     * 
     * // Get first 10 Scripts
     * const scripts = await prisma.script.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const scriptWithIdOnly = await prisma.script.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ScriptFindManyArgs>(args?: SelectSubset<T, ScriptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Script.
     * @param {ScriptCreateArgs} args - Arguments to create a Script.
     * @example
     * // Create one Script
     * const Script = await prisma.script.create({
     *   data: {
     *     // ... data to create a Script
     *   }
     * })
     * 
     */
    create<T extends ScriptCreateArgs>(args: SelectSubset<T, ScriptCreateArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Scripts.
     * @param {ScriptCreateManyArgs} args - Arguments to create many Scripts.
     * @example
     * // Create many Scripts
     * const script = await prisma.script.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ScriptCreateManyArgs>(args?: SelectSubset<T, ScriptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Scripts and returns the data saved in the database.
     * @param {ScriptCreateManyAndReturnArgs} args - Arguments to create many Scripts.
     * @example
     * // Create many Scripts
     * const script = await prisma.script.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Scripts and only return the `id`
     * const scriptWithIdOnly = await prisma.script.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ScriptCreateManyAndReturnArgs>(args?: SelectSubset<T, ScriptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Script.
     * @param {ScriptDeleteArgs} args - Arguments to delete one Script.
     * @example
     * // Delete one Script
     * const Script = await prisma.script.delete({
     *   where: {
     *     // ... filter to delete one Script
     *   }
     * })
     * 
     */
    delete<T extends ScriptDeleteArgs>(args: SelectSubset<T, ScriptDeleteArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Script.
     * @param {ScriptUpdateArgs} args - Arguments to update one Script.
     * @example
     * // Update one Script
     * const script = await prisma.script.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ScriptUpdateArgs>(args: SelectSubset<T, ScriptUpdateArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Scripts.
     * @param {ScriptDeleteManyArgs} args - Arguments to filter Scripts to delete.
     * @example
     * // Delete a few Scripts
     * const { count } = await prisma.script.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ScriptDeleteManyArgs>(args?: SelectSubset<T, ScriptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Scripts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Scripts
     * const script = await prisma.script.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ScriptUpdateManyArgs>(args: SelectSubset<T, ScriptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Scripts and returns the data updated in the database.
     * @param {ScriptUpdateManyAndReturnArgs} args - Arguments to update many Scripts.
     * @example
     * // Update many Scripts
     * const script = await prisma.script.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Scripts and only return the `id`
     * const scriptWithIdOnly = await prisma.script.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ScriptUpdateManyAndReturnArgs>(args: SelectSubset<T, ScriptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Script.
     * @param {ScriptUpsertArgs} args - Arguments to update or create a Script.
     * @example
     * // Update or create a Script
     * const script = await prisma.script.upsert({
     *   create: {
     *     // ... data to create a Script
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Script we want to update
     *   }
     * })
     */
    upsert<T extends ScriptUpsertArgs>(args: SelectSubset<T, ScriptUpsertArgs<ExtArgs>>): Prisma__ScriptClient<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Scripts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptCountArgs} args - Arguments to filter Scripts to count.
     * @example
     * // Count the number of Scripts
     * const count = await prisma.script.count({
     *   where: {
     *     // ... the filter for the Scripts we want to count
     *   }
     * })
    **/
    count<T extends ScriptCountArgs>(
      args?: Subset<T, ScriptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ScriptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Script.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ScriptAggregateArgs>(args: Subset<T, ScriptAggregateArgs>): Prisma.PrismaPromise<GetScriptAggregateType<T>>

    /**
     * Group by Script.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ScriptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ScriptGroupByArgs['orderBy'] }
        : { orderBy?: ScriptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ScriptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetScriptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Script model
   */
  readonly fields: ScriptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Script.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ScriptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    blueprint<T extends Script$blueprintArgs<ExtArgs> = {}>(args?: Subset<T, Script$blueprintArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Script model
   */
  interface ScriptFieldRefs {
    readonly id: FieldRef<"Script", 'String'>
    readonly projectId: FieldRef<"Script", 'String'>
    readonly blueprintId: FieldRef<"Script", 'String'>
    readonly title: FieldRef<"Script", 'String'>
    readonly segments: FieldRef<"Script", 'Json'>
    readonly timestamps: FieldRef<"Script", 'Json'>
    readonly createdAt: FieldRef<"Script", 'DateTime'>
    readonly updatedAt: FieldRef<"Script", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Script findUnique
   */
  export type ScriptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter, which Script to fetch.
     */
    where: ScriptWhereUniqueInput
  }

  /**
   * Script findUniqueOrThrow
   */
  export type ScriptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter, which Script to fetch.
     */
    where: ScriptWhereUniqueInput
  }

  /**
   * Script findFirst
   */
  export type ScriptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter, which Script to fetch.
     */
    where?: ScriptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scripts to fetch.
     */
    orderBy?: ScriptOrderByWithRelationInput | ScriptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Scripts.
     */
    cursor?: ScriptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scripts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scripts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Scripts.
     */
    distinct?: ScriptScalarFieldEnum | ScriptScalarFieldEnum[]
  }

  /**
   * Script findFirstOrThrow
   */
  export type ScriptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter, which Script to fetch.
     */
    where?: ScriptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scripts to fetch.
     */
    orderBy?: ScriptOrderByWithRelationInput | ScriptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Scripts.
     */
    cursor?: ScriptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scripts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scripts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Scripts.
     */
    distinct?: ScriptScalarFieldEnum | ScriptScalarFieldEnum[]
  }

  /**
   * Script findMany
   */
  export type ScriptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter, which Scripts to fetch.
     */
    where?: ScriptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scripts to fetch.
     */
    orderBy?: ScriptOrderByWithRelationInput | ScriptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Scripts.
     */
    cursor?: ScriptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scripts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scripts.
     */
    skip?: number
    distinct?: ScriptScalarFieldEnum | ScriptScalarFieldEnum[]
  }

  /**
   * Script create
   */
  export type ScriptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * The data needed to create a Script.
     */
    data: XOR<ScriptCreateInput, ScriptUncheckedCreateInput>
  }

  /**
   * Script createMany
   */
  export type ScriptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Scripts.
     */
    data: ScriptCreateManyInput | ScriptCreateManyInput[]
  }

  /**
   * Script createManyAndReturn
   */
  export type ScriptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * The data used to create many Scripts.
     */
    data: ScriptCreateManyInput | ScriptCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Script update
   */
  export type ScriptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * The data needed to update a Script.
     */
    data: XOR<ScriptUpdateInput, ScriptUncheckedUpdateInput>
    /**
     * Choose, which Script to update.
     */
    where: ScriptWhereUniqueInput
  }

  /**
   * Script updateMany
   */
  export type ScriptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Scripts.
     */
    data: XOR<ScriptUpdateManyMutationInput, ScriptUncheckedUpdateManyInput>
    /**
     * Filter which Scripts to update
     */
    where?: ScriptWhereInput
    /**
     * Limit how many Scripts to update.
     */
    limit?: number
  }

  /**
   * Script updateManyAndReturn
   */
  export type ScriptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * The data used to update Scripts.
     */
    data: XOR<ScriptUpdateManyMutationInput, ScriptUncheckedUpdateManyInput>
    /**
     * Filter which Scripts to update
     */
    where?: ScriptWhereInput
    /**
     * Limit how many Scripts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Script upsert
   */
  export type ScriptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * The filter to search for the Script to update in case it exists.
     */
    where: ScriptWhereUniqueInput
    /**
     * In case the Script found by the `where` argument doesn't exist, create a new Script with this data.
     */
    create: XOR<ScriptCreateInput, ScriptUncheckedCreateInput>
    /**
     * In case the Script was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ScriptUpdateInput, ScriptUncheckedUpdateInput>
  }

  /**
   * Script delete
   */
  export type ScriptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    /**
     * Filter which Script to delete.
     */
    where: ScriptWhereUniqueInput
  }

  /**
   * Script deleteMany
   */
  export type ScriptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Scripts to delete
     */
    where?: ScriptWhereInput
    /**
     * Limit how many Scripts to delete.
     */
    limit?: number
  }

  /**
   * Script.blueprint
   */
  export type Script$blueprintArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    where?: BlueprintWhereInput
  }

  /**
   * Script without action
   */
  export type ScriptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
  }


  /**
   * Model Asset
   */

  export type AggregateAsset = {
    _count: AssetCountAggregateOutputType | null
    _min: AssetMinAggregateOutputType | null
    _max: AssetMaxAggregateOutputType | null
  }

  export type AssetMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    type: $Enums.AssetType | null
    filename: string | null
    path: string | null
    upscaled: boolean | null
    upscaledPath: string | null
    createdAt: Date | null
  }

  export type AssetMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    type: $Enums.AssetType | null
    filename: string | null
    path: string | null
    upscaled: boolean | null
    upscaledPath: string | null
    createdAt: Date | null
  }

  export type AssetCountAggregateOutputType = {
    id: number
    projectId: number
    type: number
    filename: number
    path: number
    metadata: number
    upscaled: number
    upscaledPath: number
    createdAt: number
    _all: number
  }


  export type AssetMinAggregateInputType = {
    id?: true
    projectId?: true
    type?: true
    filename?: true
    path?: true
    upscaled?: true
    upscaledPath?: true
    createdAt?: true
  }

  export type AssetMaxAggregateInputType = {
    id?: true
    projectId?: true
    type?: true
    filename?: true
    path?: true
    upscaled?: true
    upscaledPath?: true
    createdAt?: true
  }

  export type AssetCountAggregateInputType = {
    id?: true
    projectId?: true
    type?: true
    filename?: true
    path?: true
    metadata?: true
    upscaled?: true
    upscaledPath?: true
    createdAt?: true
    _all?: true
  }

  export type AssetAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Asset to aggregate.
     */
    where?: AssetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Assets to fetch.
     */
    orderBy?: AssetOrderByWithRelationInput | AssetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AssetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Assets
    **/
    _count?: true | AssetCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AssetMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AssetMaxAggregateInputType
  }

  export type GetAssetAggregateType<T extends AssetAggregateArgs> = {
        [P in keyof T & keyof AggregateAsset]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAsset[P]>
      : GetScalarType<T[P], AggregateAsset[P]>
  }




  export type AssetGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AssetWhereInput
    orderBy?: AssetOrderByWithAggregationInput | AssetOrderByWithAggregationInput[]
    by: AssetScalarFieldEnum[] | AssetScalarFieldEnum
    having?: AssetScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AssetCountAggregateInputType | true
    _min?: AssetMinAggregateInputType
    _max?: AssetMaxAggregateInputType
  }

  export type AssetGroupByOutputType = {
    id: string
    projectId: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata: JsonValue | null
    upscaled: boolean
    upscaledPath: string | null
    createdAt: Date
    _count: AssetCountAggregateOutputType | null
    _min: AssetMinAggregateOutputType | null
    _max: AssetMaxAggregateOutputType | null
  }

  type GetAssetGroupByPayload<T extends AssetGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AssetGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AssetGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AssetGroupByOutputType[P]>
            : GetScalarType<T[P], AssetGroupByOutputType[P]>
        }
      >
    >


  export type AssetSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    type?: boolean
    filename?: boolean
    path?: boolean
    metadata?: boolean
    upscaled?: boolean
    upscaledPath?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    viewport?: boolean | Asset$viewportArgs<ExtArgs>
    boards?: boolean | Asset$boardsArgs<ExtArgs>
    _count?: boolean | AssetCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["asset"]>

  export type AssetSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    type?: boolean
    filename?: boolean
    path?: boolean
    metadata?: boolean
    upscaled?: boolean
    upscaledPath?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["asset"]>

  export type AssetSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    type?: boolean
    filename?: boolean
    path?: boolean
    metadata?: boolean
    upscaled?: boolean
    upscaledPath?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["asset"]>

  export type AssetSelectScalar = {
    id?: boolean
    projectId?: boolean
    type?: boolean
    filename?: boolean
    path?: boolean
    metadata?: boolean
    upscaled?: boolean
    upscaledPath?: boolean
    createdAt?: boolean
  }

  export type AssetOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "type" | "filename" | "path" | "metadata" | "upscaled" | "upscaledPath" | "createdAt", ExtArgs["result"]["asset"]>
  export type AssetInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    viewport?: boolean | Asset$viewportArgs<ExtArgs>
    boards?: boolean | Asset$boardsArgs<ExtArgs>
    _count?: boolean | AssetCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AssetIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type AssetIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $AssetPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Asset"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      viewport: Prisma.$ViewportPayload<ExtArgs> | null
      boards: Prisma.$BoardPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      type: $Enums.AssetType
      filename: string
      path: string
      metadata: Prisma.JsonValue | null
      upscaled: boolean
      upscaledPath: string | null
      createdAt: Date
    }, ExtArgs["result"]["asset"]>
    composites: {}
  }

  type AssetGetPayload<S extends boolean | null | undefined | AssetDefaultArgs> = $Result.GetResult<Prisma.$AssetPayload, S>

  type AssetCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AssetFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AssetCountAggregateInputType | true
    }

  export interface AssetDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Asset'], meta: { name: 'Asset' } }
    /**
     * Find zero or one Asset that matches the filter.
     * @param {AssetFindUniqueArgs} args - Arguments to find a Asset
     * @example
     * // Get one Asset
     * const asset = await prisma.asset.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AssetFindUniqueArgs>(args: SelectSubset<T, AssetFindUniqueArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Asset that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AssetFindUniqueOrThrowArgs} args - Arguments to find a Asset
     * @example
     * // Get one Asset
     * const asset = await prisma.asset.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AssetFindUniqueOrThrowArgs>(args: SelectSubset<T, AssetFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Asset that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetFindFirstArgs} args - Arguments to find a Asset
     * @example
     * // Get one Asset
     * const asset = await prisma.asset.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AssetFindFirstArgs>(args?: SelectSubset<T, AssetFindFirstArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Asset that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetFindFirstOrThrowArgs} args - Arguments to find a Asset
     * @example
     * // Get one Asset
     * const asset = await prisma.asset.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AssetFindFirstOrThrowArgs>(args?: SelectSubset<T, AssetFindFirstOrThrowArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Assets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Assets
     * const assets = await prisma.asset.findMany()
     * 
     * // Get first 10 Assets
     * const assets = await prisma.asset.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const assetWithIdOnly = await prisma.asset.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AssetFindManyArgs>(args?: SelectSubset<T, AssetFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Asset.
     * @param {AssetCreateArgs} args - Arguments to create a Asset.
     * @example
     * // Create one Asset
     * const Asset = await prisma.asset.create({
     *   data: {
     *     // ... data to create a Asset
     *   }
     * })
     * 
     */
    create<T extends AssetCreateArgs>(args: SelectSubset<T, AssetCreateArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Assets.
     * @param {AssetCreateManyArgs} args - Arguments to create many Assets.
     * @example
     * // Create many Assets
     * const asset = await prisma.asset.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AssetCreateManyArgs>(args?: SelectSubset<T, AssetCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Assets and returns the data saved in the database.
     * @param {AssetCreateManyAndReturnArgs} args - Arguments to create many Assets.
     * @example
     * // Create many Assets
     * const asset = await prisma.asset.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Assets and only return the `id`
     * const assetWithIdOnly = await prisma.asset.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AssetCreateManyAndReturnArgs>(args?: SelectSubset<T, AssetCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Asset.
     * @param {AssetDeleteArgs} args - Arguments to delete one Asset.
     * @example
     * // Delete one Asset
     * const Asset = await prisma.asset.delete({
     *   where: {
     *     // ... filter to delete one Asset
     *   }
     * })
     * 
     */
    delete<T extends AssetDeleteArgs>(args: SelectSubset<T, AssetDeleteArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Asset.
     * @param {AssetUpdateArgs} args - Arguments to update one Asset.
     * @example
     * // Update one Asset
     * const asset = await prisma.asset.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AssetUpdateArgs>(args: SelectSubset<T, AssetUpdateArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Assets.
     * @param {AssetDeleteManyArgs} args - Arguments to filter Assets to delete.
     * @example
     * // Delete a few Assets
     * const { count } = await prisma.asset.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AssetDeleteManyArgs>(args?: SelectSubset<T, AssetDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Assets
     * const asset = await prisma.asset.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AssetUpdateManyArgs>(args: SelectSubset<T, AssetUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Assets and returns the data updated in the database.
     * @param {AssetUpdateManyAndReturnArgs} args - Arguments to update many Assets.
     * @example
     * // Update many Assets
     * const asset = await prisma.asset.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Assets and only return the `id`
     * const assetWithIdOnly = await prisma.asset.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AssetUpdateManyAndReturnArgs>(args: SelectSubset<T, AssetUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Asset.
     * @param {AssetUpsertArgs} args - Arguments to update or create a Asset.
     * @example
     * // Update or create a Asset
     * const asset = await prisma.asset.upsert({
     *   create: {
     *     // ... data to create a Asset
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Asset we want to update
     *   }
     * })
     */
    upsert<T extends AssetUpsertArgs>(args: SelectSubset<T, AssetUpsertArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetCountArgs} args - Arguments to filter Assets to count.
     * @example
     * // Count the number of Assets
     * const count = await prisma.asset.count({
     *   where: {
     *     // ... the filter for the Assets we want to count
     *   }
     * })
    **/
    count<T extends AssetCountArgs>(
      args?: Subset<T, AssetCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AssetCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Asset.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AssetAggregateArgs>(args: Subset<T, AssetAggregateArgs>): Prisma.PrismaPromise<GetAssetAggregateType<T>>

    /**
     * Group by Asset.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AssetGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AssetGroupByArgs['orderBy'] }
        : { orderBy?: AssetGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AssetGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAssetGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Asset model
   */
  readonly fields: AssetFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Asset.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AssetClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    viewport<T extends Asset$viewportArgs<ExtArgs> = {}>(args?: Subset<T, Asset$viewportArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    boards<T extends Asset$boardsArgs<ExtArgs> = {}>(args?: Subset<T, Asset$boardsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Asset model
   */
  interface AssetFieldRefs {
    readonly id: FieldRef<"Asset", 'String'>
    readonly projectId: FieldRef<"Asset", 'String'>
    readonly type: FieldRef<"Asset", 'AssetType'>
    readonly filename: FieldRef<"Asset", 'String'>
    readonly path: FieldRef<"Asset", 'String'>
    readonly metadata: FieldRef<"Asset", 'Json'>
    readonly upscaled: FieldRef<"Asset", 'Boolean'>
    readonly upscaledPath: FieldRef<"Asset", 'String'>
    readonly createdAt: FieldRef<"Asset", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Asset findUnique
   */
  export type AssetFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter, which Asset to fetch.
     */
    where: AssetWhereUniqueInput
  }

  /**
   * Asset findUniqueOrThrow
   */
  export type AssetFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter, which Asset to fetch.
     */
    where: AssetWhereUniqueInput
  }

  /**
   * Asset findFirst
   */
  export type AssetFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter, which Asset to fetch.
     */
    where?: AssetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Assets to fetch.
     */
    orderBy?: AssetOrderByWithRelationInput | AssetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Assets.
     */
    cursor?: AssetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Assets.
     */
    distinct?: AssetScalarFieldEnum | AssetScalarFieldEnum[]
  }

  /**
   * Asset findFirstOrThrow
   */
  export type AssetFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter, which Asset to fetch.
     */
    where?: AssetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Assets to fetch.
     */
    orderBy?: AssetOrderByWithRelationInput | AssetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Assets.
     */
    cursor?: AssetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Assets.
     */
    distinct?: AssetScalarFieldEnum | AssetScalarFieldEnum[]
  }

  /**
   * Asset findMany
   */
  export type AssetFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter, which Assets to fetch.
     */
    where?: AssetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Assets to fetch.
     */
    orderBy?: AssetOrderByWithRelationInput | AssetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Assets.
     */
    cursor?: AssetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Assets.
     */
    skip?: number
    distinct?: AssetScalarFieldEnum | AssetScalarFieldEnum[]
  }

  /**
   * Asset create
   */
  export type AssetCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * The data needed to create a Asset.
     */
    data: XOR<AssetCreateInput, AssetUncheckedCreateInput>
  }

  /**
   * Asset createMany
   */
  export type AssetCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Assets.
     */
    data: AssetCreateManyInput | AssetCreateManyInput[]
  }

  /**
   * Asset createManyAndReturn
   */
  export type AssetCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * The data used to create many Assets.
     */
    data: AssetCreateManyInput | AssetCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Asset update
   */
  export type AssetUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * The data needed to update a Asset.
     */
    data: XOR<AssetUpdateInput, AssetUncheckedUpdateInput>
    /**
     * Choose, which Asset to update.
     */
    where: AssetWhereUniqueInput
  }

  /**
   * Asset updateMany
   */
  export type AssetUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Assets.
     */
    data: XOR<AssetUpdateManyMutationInput, AssetUncheckedUpdateManyInput>
    /**
     * Filter which Assets to update
     */
    where?: AssetWhereInput
    /**
     * Limit how many Assets to update.
     */
    limit?: number
  }

  /**
   * Asset updateManyAndReturn
   */
  export type AssetUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * The data used to update Assets.
     */
    data: XOR<AssetUpdateManyMutationInput, AssetUncheckedUpdateManyInput>
    /**
     * Filter which Assets to update
     */
    where?: AssetWhereInput
    /**
     * Limit how many Assets to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Asset upsert
   */
  export type AssetUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * The filter to search for the Asset to update in case it exists.
     */
    where: AssetWhereUniqueInput
    /**
     * In case the Asset found by the `where` argument doesn't exist, create a new Asset with this data.
     */
    create: XOR<AssetCreateInput, AssetUncheckedCreateInput>
    /**
     * In case the Asset was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AssetUpdateInput, AssetUncheckedUpdateInput>
  }

  /**
   * Asset delete
   */
  export type AssetDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    /**
     * Filter which Asset to delete.
     */
    where: AssetWhereUniqueInput
  }

  /**
   * Asset deleteMany
   */
  export type AssetDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Assets to delete
     */
    where?: AssetWhereInput
    /**
     * Limit how many Assets to delete.
     */
    limit?: number
  }

  /**
   * Asset.viewport
   */
  export type Asset$viewportArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    where?: ViewportWhereInput
  }

  /**
   * Asset.boards
   */
  export type Asset$boardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    where?: BoardWhereInput
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    cursor?: BoardWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BoardScalarFieldEnum | BoardScalarFieldEnum[]
  }

  /**
   * Asset without action
   */
  export type AssetDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
  }


  /**
   * Model AppSettings
   */

  export type AggregateAppSettings = {
    _count: AppSettingsCountAggregateOutputType | null
    _min: AppSettingsMinAggregateOutputType | null
    _max: AppSettingsMaxAggregateOutputType | null
  }

  export type AppSettingsMinAggregateOutputType = {
    id: string | null
    key: string | null
    updatedAt: Date | null
  }

  export type AppSettingsMaxAggregateOutputType = {
    id: string | null
    key: string | null
    updatedAt: Date | null
  }

  export type AppSettingsCountAggregateOutputType = {
    id: number
    key: number
    value: number
    updatedAt: number
    _all: number
  }


  export type AppSettingsMinAggregateInputType = {
    id?: true
    key?: true
    updatedAt?: true
  }

  export type AppSettingsMaxAggregateInputType = {
    id?: true
    key?: true
    updatedAt?: true
  }

  export type AppSettingsCountAggregateInputType = {
    id?: true
    key?: true
    value?: true
    updatedAt?: true
    _all?: true
  }

  export type AppSettingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSettings to aggregate.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AppSettings
    **/
    _count?: true | AppSettingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppSettingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppSettingsMaxAggregateInputType
  }

  export type GetAppSettingsAggregateType<T extends AppSettingsAggregateArgs> = {
        [P in keyof T & keyof AggregateAppSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAppSettings[P]>
      : GetScalarType<T[P], AggregateAppSettings[P]>
  }




  export type AppSettingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppSettingsWhereInput
    orderBy?: AppSettingsOrderByWithAggregationInput | AppSettingsOrderByWithAggregationInput[]
    by: AppSettingsScalarFieldEnum[] | AppSettingsScalarFieldEnum
    having?: AppSettingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppSettingsCountAggregateInputType | true
    _min?: AppSettingsMinAggregateInputType
    _max?: AppSettingsMaxAggregateInputType
  }

  export type AppSettingsGroupByOutputType = {
    id: string
    key: string
    value: JsonValue
    updatedAt: Date
    _count: AppSettingsCountAggregateOutputType | null
    _min: AppSettingsMinAggregateOutputType | null
    _max: AppSettingsMaxAggregateOutputType | null
  }

  type GetAppSettingsGroupByPayload<T extends AppSettingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppSettingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppSettingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], AppSettingsGroupByOutputType[P]>
        }
      >
    >


  export type AppSettingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSettings"]>

  export type AppSettingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSettings"]>

  export type AppSettingsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSettings"]>

  export type AppSettingsSelectScalar = {
    id?: boolean
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }

  export type AppSettingsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "key" | "value" | "updatedAt", ExtArgs["result"]["appSettings"]>

  export type $AppSettingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AppSettings"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      key: string
      value: Prisma.JsonValue
      updatedAt: Date
    }, ExtArgs["result"]["appSettings"]>
    composites: {}
  }

  type AppSettingsGetPayload<S extends boolean | null | undefined | AppSettingsDefaultArgs> = $Result.GetResult<Prisma.$AppSettingsPayload, S>

  type AppSettingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AppSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AppSettingsCountAggregateInputType | true
    }

  export interface AppSettingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AppSettings'], meta: { name: 'AppSettings' } }
    /**
     * Find zero or one AppSettings that matches the filter.
     * @param {AppSettingsFindUniqueArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppSettingsFindUniqueArgs>(args: SelectSubset<T, AppSettingsFindUniqueArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AppSettings that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AppSettingsFindUniqueOrThrowArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppSettingsFindUniqueOrThrowArgs>(args: SelectSubset<T, AppSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AppSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindFirstArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppSettingsFindFirstArgs>(args?: SelectSubset<T, AppSettingsFindFirstArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AppSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindFirstOrThrowArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppSettingsFindFirstOrThrowArgs>(args?: SelectSubset<T, AppSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AppSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AppSettings
     * const appSettings = await prisma.appSettings.findMany()
     * 
     * // Get first 10 AppSettings
     * const appSettings = await prisma.appSettings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const appSettingsWithIdOnly = await prisma.appSettings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AppSettingsFindManyArgs>(args?: SelectSubset<T, AppSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AppSettings.
     * @param {AppSettingsCreateArgs} args - Arguments to create a AppSettings.
     * @example
     * // Create one AppSettings
     * const AppSettings = await prisma.appSettings.create({
     *   data: {
     *     // ... data to create a AppSettings
     *   }
     * })
     * 
     */
    create<T extends AppSettingsCreateArgs>(args: SelectSubset<T, AppSettingsCreateArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AppSettings.
     * @param {AppSettingsCreateManyArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSettings = await prisma.appSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppSettingsCreateManyArgs>(args?: SelectSubset<T, AppSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AppSettings and returns the data saved in the database.
     * @param {AppSettingsCreateManyAndReturnArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSettings = await prisma.appSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AppSettings and only return the `id`
     * const appSettingsWithIdOnly = await prisma.appSettings.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AppSettingsCreateManyAndReturnArgs>(args?: SelectSubset<T, AppSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AppSettings.
     * @param {AppSettingsDeleteArgs} args - Arguments to delete one AppSettings.
     * @example
     * // Delete one AppSettings
     * const AppSettings = await prisma.appSettings.delete({
     *   where: {
     *     // ... filter to delete one AppSettings
     *   }
     * })
     * 
     */
    delete<T extends AppSettingsDeleteArgs>(args: SelectSubset<T, AppSettingsDeleteArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AppSettings.
     * @param {AppSettingsUpdateArgs} args - Arguments to update one AppSettings.
     * @example
     * // Update one AppSettings
     * const appSettings = await prisma.appSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppSettingsUpdateArgs>(args: SelectSubset<T, AppSettingsUpdateArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AppSettings.
     * @param {AppSettingsDeleteManyArgs} args - Arguments to filter AppSettings to delete.
     * @example
     * // Delete a few AppSettings
     * const { count } = await prisma.appSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppSettingsDeleteManyArgs>(args?: SelectSubset<T, AppSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AppSettings
     * const appSettings = await prisma.appSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppSettingsUpdateManyArgs>(args: SelectSubset<T, AppSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AppSettings and returns the data updated in the database.
     * @param {AppSettingsUpdateManyAndReturnArgs} args - Arguments to update many AppSettings.
     * @example
     * // Update many AppSettings
     * const appSettings = await prisma.appSettings.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AppSettings and only return the `id`
     * const appSettingsWithIdOnly = await prisma.appSettings.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AppSettingsUpdateManyAndReturnArgs>(args: SelectSubset<T, AppSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AppSettings.
     * @param {AppSettingsUpsertArgs} args - Arguments to update or create a AppSettings.
     * @example
     * // Update or create a AppSettings
     * const appSettings = await prisma.appSettings.upsert({
     *   create: {
     *     // ... data to create a AppSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AppSettings we want to update
     *   }
     * })
     */
    upsert<T extends AppSettingsUpsertArgs>(args: SelectSubset<T, AppSettingsUpsertArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsCountArgs} args - Arguments to filter AppSettings to count.
     * @example
     * // Count the number of AppSettings
     * const count = await prisma.appSettings.count({
     *   where: {
     *     // ... the filter for the AppSettings we want to count
     *   }
     * })
    **/
    count<T extends AppSettingsCountArgs>(
      args?: Subset<T, AppSettingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppSettingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AppSettingsAggregateArgs>(args: Subset<T, AppSettingsAggregateArgs>): Prisma.PrismaPromise<GetAppSettingsAggregateType<T>>

    /**
     * Group by AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AppSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppSettingsGroupByArgs['orderBy'] }
        : { orderBy?: AppSettingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AppSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AppSettings model
   */
  readonly fields: AppSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AppSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppSettingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AppSettings model
   */
  interface AppSettingsFieldRefs {
    readonly id: FieldRef<"AppSettings", 'String'>
    readonly key: FieldRef<"AppSettings", 'String'>
    readonly value: FieldRef<"AppSettings", 'Json'>
    readonly updatedAt: FieldRef<"AppSettings", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AppSettings findUnique
   */
  export type AppSettingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings findUniqueOrThrow
   */
  export type AppSettingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings findFirst
   */
  export type AppSettingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings findFirstOrThrow
   */
  export type AppSettingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings findMany
   */
  export type AppSettingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings create
   */
  export type AppSettingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * The data needed to create a AppSettings.
     */
    data: XOR<AppSettingsCreateInput, AppSettingsUncheckedCreateInput>
  }

  /**
   * AppSettings createMany
   */
  export type AppSettingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingsCreateManyInput | AppSettingsCreateManyInput[]
  }

  /**
   * AppSettings createManyAndReturn
   */
  export type AppSettingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingsCreateManyInput | AppSettingsCreateManyInput[]
  }

  /**
   * AppSettings update
   */
  export type AppSettingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * The data needed to update a AppSettings.
     */
    data: XOR<AppSettingsUpdateInput, AppSettingsUncheckedUpdateInput>
    /**
     * Choose, which AppSettings to update.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings updateMany
   */
  export type AppSettingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AppSettings.
     */
    data: XOR<AppSettingsUpdateManyMutationInput, AppSettingsUncheckedUpdateManyInput>
    /**
     * Filter which AppSettings to update
     */
    where?: AppSettingsWhereInput
    /**
     * Limit how many AppSettings to update.
     */
    limit?: number
  }

  /**
   * AppSettings updateManyAndReturn
   */
  export type AppSettingsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * The data used to update AppSettings.
     */
    data: XOR<AppSettingsUpdateManyMutationInput, AppSettingsUncheckedUpdateManyInput>
    /**
     * Filter which AppSettings to update
     */
    where?: AppSettingsWhereInput
    /**
     * Limit how many AppSettings to update.
     */
    limit?: number
  }

  /**
   * AppSettings upsert
   */
  export type AppSettingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * The filter to search for the AppSettings to update in case it exists.
     */
    where: AppSettingsWhereUniqueInput
    /**
     * In case the AppSettings found by the `where` argument doesn't exist, create a new AppSettings with this data.
     */
    create: XOR<AppSettingsCreateInput, AppSettingsUncheckedCreateInput>
    /**
     * In case the AppSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppSettingsUpdateInput, AppSettingsUncheckedUpdateInput>
  }

  /**
   * AppSettings delete
   */
  export type AppSettingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
    /**
     * Filter which AppSettings to delete.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings deleteMany
   */
  export type AppSettingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSettings to delete
     */
    where?: AppSettingsWhereInput
    /**
     * Limit how many AppSettings to delete.
     */
    limit?: number
  }

  /**
   * AppSettings without action
   */
  export type AppSettingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSettings
     */
    omit?: AppSettingsOmit<ExtArgs> | null
  }


  /**
   * Model Render
   */

  export type AggregateRender = {
    _count: RenderCountAggregateOutputType | null
    _avg: RenderAvgAggregateOutputType | null
    _sum: RenderSumAggregateOutputType | null
    _min: RenderMinAggregateOutputType | null
    _max: RenderMaxAggregateOutputType | null
  }

  export type RenderAvgAggregateOutputType = {
    progress: number | null
  }

  export type RenderSumAggregateOutputType = {
    progress: number | null
  }

  export type RenderMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    quality: $Enums.RenderQuality | null
    status: $Enums.RenderStatus | null
    progress: number | null
    outputPath: string | null
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
  }

  export type RenderMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    quality: $Enums.RenderQuality | null
    status: $Enums.RenderStatus | null
    progress: number | null
    outputPath: string | null
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
  }

  export type RenderCountAggregateOutputType = {
    id: number
    projectId: number
    quality: number
    status: number
    progress: number
    outputPath: number
    error: number
    startedAt: number
    completedAt: number
    createdAt: number
    _all: number
  }


  export type RenderAvgAggregateInputType = {
    progress?: true
  }

  export type RenderSumAggregateInputType = {
    progress?: true
  }

  export type RenderMinAggregateInputType = {
    id?: true
    projectId?: true
    quality?: true
    status?: true
    progress?: true
    outputPath?: true
    error?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
  }

  export type RenderMaxAggregateInputType = {
    id?: true
    projectId?: true
    quality?: true
    status?: true
    progress?: true
    outputPath?: true
    error?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
  }

  export type RenderCountAggregateInputType = {
    id?: true
    projectId?: true
    quality?: true
    status?: true
    progress?: true
    outputPath?: true
    error?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
    _all?: true
  }

  export type RenderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Render to aggregate.
     */
    where?: RenderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Renders to fetch.
     */
    orderBy?: RenderOrderByWithRelationInput | RenderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RenderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Renders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Renders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Renders
    **/
    _count?: true | RenderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RenderAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RenderSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RenderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RenderMaxAggregateInputType
  }

  export type GetRenderAggregateType<T extends RenderAggregateArgs> = {
        [P in keyof T & keyof AggregateRender]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRender[P]>
      : GetScalarType<T[P], AggregateRender[P]>
  }




  export type RenderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RenderWhereInput
    orderBy?: RenderOrderByWithAggregationInput | RenderOrderByWithAggregationInput[]
    by: RenderScalarFieldEnum[] | RenderScalarFieldEnum
    having?: RenderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RenderCountAggregateInputType | true
    _avg?: RenderAvgAggregateInputType
    _sum?: RenderSumAggregateInputType
    _min?: RenderMinAggregateInputType
    _max?: RenderMaxAggregateInputType
  }

  export type RenderGroupByOutputType = {
    id: string
    projectId: string
    quality: $Enums.RenderQuality
    status: $Enums.RenderStatus
    progress: number
    outputPath: string | null
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date
    _count: RenderCountAggregateOutputType | null
    _avg: RenderAvgAggregateOutputType | null
    _sum: RenderSumAggregateOutputType | null
    _min: RenderMinAggregateOutputType | null
    _max: RenderMaxAggregateOutputType | null
  }

  type GetRenderGroupByPayload<T extends RenderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RenderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RenderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RenderGroupByOutputType[P]>
            : GetScalarType<T[P], RenderGroupByOutputType[P]>
        }
      >
    >


  export type RenderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    quality?: boolean
    status?: boolean
    progress?: boolean
    outputPath?: boolean
    error?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["render"]>

  export type RenderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    quality?: boolean
    status?: boolean
    progress?: boolean
    outputPath?: boolean
    error?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["render"]>

  export type RenderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    quality?: boolean
    status?: boolean
    progress?: boolean
    outputPath?: boolean
    error?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["render"]>

  export type RenderSelectScalar = {
    id?: boolean
    projectId?: boolean
    quality?: boolean
    status?: boolean
    progress?: boolean
    outputPath?: boolean
    error?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
  }

  export type RenderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "quality" | "status" | "progress" | "outputPath" | "error" | "startedAt" | "completedAt" | "createdAt", ExtArgs["result"]["render"]>
  export type RenderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type RenderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type RenderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $RenderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Render"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      quality: $Enums.RenderQuality
      status: $Enums.RenderStatus
      progress: number
      outputPath: string | null
      error: string | null
      startedAt: Date | null
      completedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["render"]>
    composites: {}
  }

  type RenderGetPayload<S extends boolean | null | undefined | RenderDefaultArgs> = $Result.GetResult<Prisma.$RenderPayload, S>

  type RenderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RenderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RenderCountAggregateInputType | true
    }

  export interface RenderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Render'], meta: { name: 'Render' } }
    /**
     * Find zero or one Render that matches the filter.
     * @param {RenderFindUniqueArgs} args - Arguments to find a Render
     * @example
     * // Get one Render
     * const render = await prisma.render.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RenderFindUniqueArgs>(args: SelectSubset<T, RenderFindUniqueArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Render that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RenderFindUniqueOrThrowArgs} args - Arguments to find a Render
     * @example
     * // Get one Render
     * const render = await prisma.render.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RenderFindUniqueOrThrowArgs>(args: SelectSubset<T, RenderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Render that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderFindFirstArgs} args - Arguments to find a Render
     * @example
     * // Get one Render
     * const render = await prisma.render.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RenderFindFirstArgs>(args?: SelectSubset<T, RenderFindFirstArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Render that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderFindFirstOrThrowArgs} args - Arguments to find a Render
     * @example
     * // Get one Render
     * const render = await prisma.render.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RenderFindFirstOrThrowArgs>(args?: SelectSubset<T, RenderFindFirstOrThrowArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Renders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Renders
     * const renders = await prisma.render.findMany()
     * 
     * // Get first 10 Renders
     * const renders = await prisma.render.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const renderWithIdOnly = await prisma.render.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RenderFindManyArgs>(args?: SelectSubset<T, RenderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Render.
     * @param {RenderCreateArgs} args - Arguments to create a Render.
     * @example
     * // Create one Render
     * const Render = await prisma.render.create({
     *   data: {
     *     // ... data to create a Render
     *   }
     * })
     * 
     */
    create<T extends RenderCreateArgs>(args: SelectSubset<T, RenderCreateArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Renders.
     * @param {RenderCreateManyArgs} args - Arguments to create many Renders.
     * @example
     * // Create many Renders
     * const render = await prisma.render.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RenderCreateManyArgs>(args?: SelectSubset<T, RenderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Renders and returns the data saved in the database.
     * @param {RenderCreateManyAndReturnArgs} args - Arguments to create many Renders.
     * @example
     * // Create many Renders
     * const render = await prisma.render.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Renders and only return the `id`
     * const renderWithIdOnly = await prisma.render.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RenderCreateManyAndReturnArgs>(args?: SelectSubset<T, RenderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Render.
     * @param {RenderDeleteArgs} args - Arguments to delete one Render.
     * @example
     * // Delete one Render
     * const Render = await prisma.render.delete({
     *   where: {
     *     // ... filter to delete one Render
     *   }
     * })
     * 
     */
    delete<T extends RenderDeleteArgs>(args: SelectSubset<T, RenderDeleteArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Render.
     * @param {RenderUpdateArgs} args - Arguments to update one Render.
     * @example
     * // Update one Render
     * const render = await prisma.render.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RenderUpdateArgs>(args: SelectSubset<T, RenderUpdateArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Renders.
     * @param {RenderDeleteManyArgs} args - Arguments to filter Renders to delete.
     * @example
     * // Delete a few Renders
     * const { count } = await prisma.render.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RenderDeleteManyArgs>(args?: SelectSubset<T, RenderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Renders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Renders
     * const render = await prisma.render.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RenderUpdateManyArgs>(args: SelectSubset<T, RenderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Renders and returns the data updated in the database.
     * @param {RenderUpdateManyAndReturnArgs} args - Arguments to update many Renders.
     * @example
     * // Update many Renders
     * const render = await prisma.render.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Renders and only return the `id`
     * const renderWithIdOnly = await prisma.render.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RenderUpdateManyAndReturnArgs>(args: SelectSubset<T, RenderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Render.
     * @param {RenderUpsertArgs} args - Arguments to update or create a Render.
     * @example
     * // Update or create a Render
     * const render = await prisma.render.upsert({
     *   create: {
     *     // ... data to create a Render
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Render we want to update
     *   }
     * })
     */
    upsert<T extends RenderUpsertArgs>(args: SelectSubset<T, RenderUpsertArgs<ExtArgs>>): Prisma__RenderClient<$Result.GetResult<Prisma.$RenderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Renders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderCountArgs} args - Arguments to filter Renders to count.
     * @example
     * // Count the number of Renders
     * const count = await prisma.render.count({
     *   where: {
     *     // ... the filter for the Renders we want to count
     *   }
     * })
    **/
    count<T extends RenderCountArgs>(
      args?: Subset<T, RenderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RenderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Render.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RenderAggregateArgs>(args: Subset<T, RenderAggregateArgs>): Prisma.PrismaPromise<GetRenderAggregateType<T>>

    /**
     * Group by Render.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RenderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RenderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RenderGroupByArgs['orderBy'] }
        : { orderBy?: RenderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RenderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRenderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Render model
   */
  readonly fields: RenderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Render.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RenderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Render model
   */
  interface RenderFieldRefs {
    readonly id: FieldRef<"Render", 'String'>
    readonly projectId: FieldRef<"Render", 'String'>
    readonly quality: FieldRef<"Render", 'RenderQuality'>
    readonly status: FieldRef<"Render", 'RenderStatus'>
    readonly progress: FieldRef<"Render", 'Float'>
    readonly outputPath: FieldRef<"Render", 'String'>
    readonly error: FieldRef<"Render", 'String'>
    readonly startedAt: FieldRef<"Render", 'DateTime'>
    readonly completedAt: FieldRef<"Render", 'DateTime'>
    readonly createdAt: FieldRef<"Render", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Render findUnique
   */
  export type RenderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter, which Render to fetch.
     */
    where: RenderWhereUniqueInput
  }

  /**
   * Render findUniqueOrThrow
   */
  export type RenderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter, which Render to fetch.
     */
    where: RenderWhereUniqueInput
  }

  /**
   * Render findFirst
   */
  export type RenderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter, which Render to fetch.
     */
    where?: RenderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Renders to fetch.
     */
    orderBy?: RenderOrderByWithRelationInput | RenderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Renders.
     */
    cursor?: RenderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Renders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Renders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Renders.
     */
    distinct?: RenderScalarFieldEnum | RenderScalarFieldEnum[]
  }

  /**
   * Render findFirstOrThrow
   */
  export type RenderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter, which Render to fetch.
     */
    where?: RenderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Renders to fetch.
     */
    orderBy?: RenderOrderByWithRelationInput | RenderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Renders.
     */
    cursor?: RenderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Renders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Renders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Renders.
     */
    distinct?: RenderScalarFieldEnum | RenderScalarFieldEnum[]
  }

  /**
   * Render findMany
   */
  export type RenderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter, which Renders to fetch.
     */
    where?: RenderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Renders to fetch.
     */
    orderBy?: RenderOrderByWithRelationInput | RenderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Renders.
     */
    cursor?: RenderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Renders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Renders.
     */
    skip?: number
    distinct?: RenderScalarFieldEnum | RenderScalarFieldEnum[]
  }

  /**
   * Render create
   */
  export type RenderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * The data needed to create a Render.
     */
    data: XOR<RenderCreateInput, RenderUncheckedCreateInput>
  }

  /**
   * Render createMany
   */
  export type RenderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Renders.
     */
    data: RenderCreateManyInput | RenderCreateManyInput[]
  }

  /**
   * Render createManyAndReturn
   */
  export type RenderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * The data used to create many Renders.
     */
    data: RenderCreateManyInput | RenderCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Render update
   */
  export type RenderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * The data needed to update a Render.
     */
    data: XOR<RenderUpdateInput, RenderUncheckedUpdateInput>
    /**
     * Choose, which Render to update.
     */
    where: RenderWhereUniqueInput
  }

  /**
   * Render updateMany
   */
  export type RenderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Renders.
     */
    data: XOR<RenderUpdateManyMutationInput, RenderUncheckedUpdateManyInput>
    /**
     * Filter which Renders to update
     */
    where?: RenderWhereInput
    /**
     * Limit how many Renders to update.
     */
    limit?: number
  }

  /**
   * Render updateManyAndReturn
   */
  export type RenderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * The data used to update Renders.
     */
    data: XOR<RenderUpdateManyMutationInput, RenderUncheckedUpdateManyInput>
    /**
     * Filter which Renders to update
     */
    where?: RenderWhereInput
    /**
     * Limit how many Renders to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Render upsert
   */
  export type RenderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * The filter to search for the Render to update in case it exists.
     */
    where: RenderWhereUniqueInput
    /**
     * In case the Render found by the `where` argument doesn't exist, create a new Render with this data.
     */
    create: XOR<RenderCreateInput, RenderUncheckedCreateInput>
    /**
     * In case the Render was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RenderUpdateInput, RenderUncheckedUpdateInput>
  }

  /**
   * Render delete
   */
  export type RenderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
    /**
     * Filter which Render to delete.
     */
    where: RenderWhereUniqueInput
  }

  /**
   * Render deleteMany
   */
  export type RenderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Renders to delete
     */
    where?: RenderWhereInput
    /**
     * Limit how many Renders to delete.
     */
    limit?: number
  }

  /**
   * Render without action
   */
  export type RenderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Render
     */
    select?: RenderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Render
     */
    omit?: RenderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RenderInclude<ExtArgs> | null
  }


  /**
   * Model AiCallLog
   */

  export type AggregateAiCallLog = {
    _count: AiCallLogCountAggregateOutputType | null
    _avg: AiCallLogAvgAggregateOutputType | null
    _sum: AiCallLogSumAggregateOutputType | null
    _min: AiCallLogMinAggregateOutputType | null
    _max: AiCallLogMaxAggregateOutputType | null
  }

  export type AiCallLogAvgAggregateOutputType = {
    promptTokens: number | null
    responseTokens: number | null
    durationMs: number | null
    retryCount: number | null
  }

  export type AiCallLogSumAggregateOutputType = {
    promptTokens: number | null
    responseTokens: number | null
    durationMs: number | null
    retryCount: number | null
  }

  export type AiCallLogMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    provider: string | null
    model: string | null
    operation: string | null
    parentId: string | null
    prompt: string | null
    promptTokens: number | null
    response: string | null
    responseTokens: number | null
    status: $Enums.AiCallStatus | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    errorMessage: string | null
    errorCode: string | null
    retryCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AiCallLogMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    provider: string | null
    model: string | null
    operation: string | null
    parentId: string | null
    prompt: string | null
    promptTokens: number | null
    response: string | null
    responseTokens: number | null
    status: $Enums.AiCallStatus | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    errorMessage: string | null
    errorCode: string | null
    retryCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AiCallLogCountAggregateOutputType = {
    id: number
    projectId: number
    provider: number
    model: number
    operation: number
    parentId: number
    prompt: number
    promptTokens: number
    response: number
    responseTokens: number
    status: number
    startedAt: number
    completedAt: number
    durationMs: number
    errorMessage: number
    errorCode: number
    retryCount: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AiCallLogAvgAggregateInputType = {
    promptTokens?: true
    responseTokens?: true
    durationMs?: true
    retryCount?: true
  }

  export type AiCallLogSumAggregateInputType = {
    promptTokens?: true
    responseTokens?: true
    durationMs?: true
    retryCount?: true
  }

  export type AiCallLogMinAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    operation?: true
    parentId?: true
    prompt?: true
    promptTokens?: true
    response?: true
    responseTokens?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    errorMessage?: true
    errorCode?: true
    retryCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AiCallLogMaxAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    operation?: true
    parentId?: true
    prompt?: true
    promptTokens?: true
    response?: true
    responseTokens?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    errorMessage?: true
    errorCode?: true
    retryCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AiCallLogCountAggregateInputType = {
    id?: true
    projectId?: true
    provider?: true
    model?: true
    operation?: true
    parentId?: true
    prompt?: true
    promptTokens?: true
    response?: true
    responseTokens?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    errorMessage?: true
    errorCode?: true
    retryCount?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AiCallLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiCallLog to aggregate.
     */
    where?: AiCallLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiCallLogs to fetch.
     */
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AiCallLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiCallLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiCallLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AiCallLogs
    **/
    _count?: true | AiCallLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AiCallLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AiCallLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AiCallLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AiCallLogMaxAggregateInputType
  }

  export type GetAiCallLogAggregateType<T extends AiCallLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAiCallLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAiCallLog[P]>
      : GetScalarType<T[P], AggregateAiCallLog[P]>
  }




  export type AiCallLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiCallLogWhereInput
    orderBy?: AiCallLogOrderByWithAggregationInput | AiCallLogOrderByWithAggregationInput[]
    by: AiCallLogScalarFieldEnum[] | AiCallLogScalarFieldEnum
    having?: AiCallLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AiCallLogCountAggregateInputType | true
    _avg?: AiCallLogAvgAggregateInputType
    _sum?: AiCallLogSumAggregateInputType
    _min?: AiCallLogMinAggregateInputType
    _max?: AiCallLogMaxAggregateInputType
  }

  export type AiCallLogGroupByOutputType = {
    id: string
    projectId: string
    provider: string
    model: string | null
    operation: string
    parentId: string | null
    prompt: string
    promptTokens: number | null
    response: string | null
    responseTokens: number | null
    status: $Enums.AiCallStatus
    startedAt: Date
    completedAt: Date | null
    durationMs: number | null
    errorMessage: string | null
    errorCode: string | null
    retryCount: number
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: AiCallLogCountAggregateOutputType | null
    _avg: AiCallLogAvgAggregateOutputType | null
    _sum: AiCallLogSumAggregateOutputType | null
    _min: AiCallLogMinAggregateOutputType | null
    _max: AiCallLogMaxAggregateOutputType | null
  }

  type GetAiCallLogGroupByPayload<T extends AiCallLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AiCallLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AiCallLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AiCallLogGroupByOutputType[P]>
            : GetScalarType<T[P], AiCallLogGroupByOutputType[P]>
        }
      >
    >


  export type AiCallLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    operation?: boolean
    parentId?: boolean
    prompt?: boolean
    promptTokens?: boolean
    response?: boolean
    responseTokens?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    retryCount?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
    children?: boolean | AiCallLog$childrenArgs<ExtArgs>
    _count?: boolean | AiCallLogCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aiCallLog"]>

  export type AiCallLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    operation?: boolean
    parentId?: boolean
    prompt?: boolean
    promptTokens?: boolean
    response?: boolean
    responseTokens?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    retryCount?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
  }, ExtArgs["result"]["aiCallLog"]>

  export type AiCallLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    operation?: boolean
    parentId?: boolean
    prompt?: boolean
    promptTokens?: boolean
    response?: boolean
    responseTokens?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    retryCount?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
  }, ExtArgs["result"]["aiCallLog"]>

  export type AiCallLogSelectScalar = {
    id?: boolean
    projectId?: boolean
    provider?: boolean
    model?: boolean
    operation?: boolean
    parentId?: boolean
    prompt?: boolean
    promptTokens?: boolean
    response?: boolean
    responseTokens?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    retryCount?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AiCallLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "provider" | "model" | "operation" | "parentId" | "prompt" | "promptTokens" | "response" | "responseTokens" | "status" | "startedAt" | "completedAt" | "durationMs" | "errorMessage" | "errorCode" | "retryCount" | "metadata" | "createdAt" | "updatedAt", ExtArgs["result"]["aiCallLog"]>
  export type AiCallLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
    children?: boolean | AiCallLog$childrenArgs<ExtArgs>
    _count?: boolean | AiCallLogCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AiCallLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
  }
  export type AiCallLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    parent?: boolean | AiCallLog$parentArgs<ExtArgs>
  }

  export type $AiCallLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AiCallLog"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      parent: Prisma.$AiCallLogPayload<ExtArgs> | null
      children: Prisma.$AiCallLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      provider: string
      model: string | null
      operation: string
      parentId: string | null
      prompt: string
      promptTokens: number | null
      response: string | null
      responseTokens: number | null
      status: $Enums.AiCallStatus
      startedAt: Date
      completedAt: Date | null
      durationMs: number | null
      errorMessage: string | null
      errorCode: string | null
      retryCount: number
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["aiCallLog"]>
    composites: {}
  }

  type AiCallLogGetPayload<S extends boolean | null | undefined | AiCallLogDefaultArgs> = $Result.GetResult<Prisma.$AiCallLogPayload, S>

  type AiCallLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AiCallLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AiCallLogCountAggregateInputType | true
    }

  export interface AiCallLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AiCallLog'], meta: { name: 'AiCallLog' } }
    /**
     * Find zero or one AiCallLog that matches the filter.
     * @param {AiCallLogFindUniqueArgs} args - Arguments to find a AiCallLog
     * @example
     * // Get one AiCallLog
     * const aiCallLog = await prisma.aiCallLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AiCallLogFindUniqueArgs>(args: SelectSubset<T, AiCallLogFindUniqueArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AiCallLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AiCallLogFindUniqueOrThrowArgs} args - Arguments to find a AiCallLog
     * @example
     * // Get one AiCallLog
     * const aiCallLog = await prisma.aiCallLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AiCallLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AiCallLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AiCallLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogFindFirstArgs} args - Arguments to find a AiCallLog
     * @example
     * // Get one AiCallLog
     * const aiCallLog = await prisma.aiCallLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AiCallLogFindFirstArgs>(args?: SelectSubset<T, AiCallLogFindFirstArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AiCallLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogFindFirstOrThrowArgs} args - Arguments to find a AiCallLog
     * @example
     * // Get one AiCallLog
     * const aiCallLog = await prisma.aiCallLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AiCallLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AiCallLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AiCallLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AiCallLogs
     * const aiCallLogs = await prisma.aiCallLog.findMany()
     * 
     * // Get first 10 AiCallLogs
     * const aiCallLogs = await prisma.aiCallLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const aiCallLogWithIdOnly = await prisma.aiCallLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AiCallLogFindManyArgs>(args?: SelectSubset<T, AiCallLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AiCallLog.
     * @param {AiCallLogCreateArgs} args - Arguments to create a AiCallLog.
     * @example
     * // Create one AiCallLog
     * const AiCallLog = await prisma.aiCallLog.create({
     *   data: {
     *     // ... data to create a AiCallLog
     *   }
     * })
     * 
     */
    create<T extends AiCallLogCreateArgs>(args: SelectSubset<T, AiCallLogCreateArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AiCallLogs.
     * @param {AiCallLogCreateManyArgs} args - Arguments to create many AiCallLogs.
     * @example
     * // Create many AiCallLogs
     * const aiCallLog = await prisma.aiCallLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AiCallLogCreateManyArgs>(args?: SelectSubset<T, AiCallLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AiCallLogs and returns the data saved in the database.
     * @param {AiCallLogCreateManyAndReturnArgs} args - Arguments to create many AiCallLogs.
     * @example
     * // Create many AiCallLogs
     * const aiCallLog = await prisma.aiCallLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AiCallLogs and only return the `id`
     * const aiCallLogWithIdOnly = await prisma.aiCallLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AiCallLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AiCallLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AiCallLog.
     * @param {AiCallLogDeleteArgs} args - Arguments to delete one AiCallLog.
     * @example
     * // Delete one AiCallLog
     * const AiCallLog = await prisma.aiCallLog.delete({
     *   where: {
     *     // ... filter to delete one AiCallLog
     *   }
     * })
     * 
     */
    delete<T extends AiCallLogDeleteArgs>(args: SelectSubset<T, AiCallLogDeleteArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AiCallLog.
     * @param {AiCallLogUpdateArgs} args - Arguments to update one AiCallLog.
     * @example
     * // Update one AiCallLog
     * const aiCallLog = await prisma.aiCallLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AiCallLogUpdateArgs>(args: SelectSubset<T, AiCallLogUpdateArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AiCallLogs.
     * @param {AiCallLogDeleteManyArgs} args - Arguments to filter AiCallLogs to delete.
     * @example
     * // Delete a few AiCallLogs
     * const { count } = await prisma.aiCallLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AiCallLogDeleteManyArgs>(args?: SelectSubset<T, AiCallLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AiCallLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AiCallLogs
     * const aiCallLog = await prisma.aiCallLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AiCallLogUpdateManyArgs>(args: SelectSubset<T, AiCallLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AiCallLogs and returns the data updated in the database.
     * @param {AiCallLogUpdateManyAndReturnArgs} args - Arguments to update many AiCallLogs.
     * @example
     * // Update many AiCallLogs
     * const aiCallLog = await prisma.aiCallLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AiCallLogs and only return the `id`
     * const aiCallLogWithIdOnly = await prisma.aiCallLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AiCallLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AiCallLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AiCallLog.
     * @param {AiCallLogUpsertArgs} args - Arguments to update or create a AiCallLog.
     * @example
     * // Update or create a AiCallLog
     * const aiCallLog = await prisma.aiCallLog.upsert({
     *   create: {
     *     // ... data to create a AiCallLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AiCallLog we want to update
     *   }
     * })
     */
    upsert<T extends AiCallLogUpsertArgs>(args: SelectSubset<T, AiCallLogUpsertArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AiCallLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogCountArgs} args - Arguments to filter AiCallLogs to count.
     * @example
     * // Count the number of AiCallLogs
     * const count = await prisma.aiCallLog.count({
     *   where: {
     *     // ... the filter for the AiCallLogs we want to count
     *   }
     * })
    **/
    count<T extends AiCallLogCountArgs>(
      args?: Subset<T, AiCallLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AiCallLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AiCallLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AiCallLogAggregateArgs>(args: Subset<T, AiCallLogAggregateArgs>): Prisma.PrismaPromise<GetAiCallLogAggregateType<T>>

    /**
     * Group by AiCallLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiCallLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AiCallLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AiCallLogGroupByArgs['orderBy'] }
        : { orderBy?: AiCallLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AiCallLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAiCallLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AiCallLog model
   */
  readonly fields: AiCallLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AiCallLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AiCallLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    parent<T extends AiCallLog$parentArgs<ExtArgs> = {}>(args?: Subset<T, AiCallLog$parentArgs<ExtArgs>>): Prisma__AiCallLogClient<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    children<T extends AiCallLog$childrenArgs<ExtArgs> = {}>(args?: Subset<T, AiCallLog$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiCallLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AiCallLog model
   */
  interface AiCallLogFieldRefs {
    readonly id: FieldRef<"AiCallLog", 'String'>
    readonly projectId: FieldRef<"AiCallLog", 'String'>
    readonly provider: FieldRef<"AiCallLog", 'String'>
    readonly model: FieldRef<"AiCallLog", 'String'>
    readonly operation: FieldRef<"AiCallLog", 'String'>
    readonly parentId: FieldRef<"AiCallLog", 'String'>
    readonly prompt: FieldRef<"AiCallLog", 'String'>
    readonly promptTokens: FieldRef<"AiCallLog", 'Int'>
    readonly response: FieldRef<"AiCallLog", 'String'>
    readonly responseTokens: FieldRef<"AiCallLog", 'Int'>
    readonly status: FieldRef<"AiCallLog", 'AiCallStatus'>
    readonly startedAt: FieldRef<"AiCallLog", 'DateTime'>
    readonly completedAt: FieldRef<"AiCallLog", 'DateTime'>
    readonly durationMs: FieldRef<"AiCallLog", 'Int'>
    readonly errorMessage: FieldRef<"AiCallLog", 'String'>
    readonly errorCode: FieldRef<"AiCallLog", 'String'>
    readonly retryCount: FieldRef<"AiCallLog", 'Int'>
    readonly metadata: FieldRef<"AiCallLog", 'Json'>
    readonly createdAt: FieldRef<"AiCallLog", 'DateTime'>
    readonly updatedAt: FieldRef<"AiCallLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AiCallLog findUnique
   */
  export type AiCallLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter, which AiCallLog to fetch.
     */
    where: AiCallLogWhereUniqueInput
  }

  /**
   * AiCallLog findUniqueOrThrow
   */
  export type AiCallLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter, which AiCallLog to fetch.
     */
    where: AiCallLogWhereUniqueInput
  }

  /**
   * AiCallLog findFirst
   */
  export type AiCallLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter, which AiCallLog to fetch.
     */
    where?: AiCallLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiCallLogs to fetch.
     */
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiCallLogs.
     */
    cursor?: AiCallLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiCallLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiCallLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiCallLogs.
     */
    distinct?: AiCallLogScalarFieldEnum | AiCallLogScalarFieldEnum[]
  }

  /**
   * AiCallLog findFirstOrThrow
   */
  export type AiCallLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter, which AiCallLog to fetch.
     */
    where?: AiCallLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiCallLogs to fetch.
     */
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiCallLogs.
     */
    cursor?: AiCallLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiCallLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiCallLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiCallLogs.
     */
    distinct?: AiCallLogScalarFieldEnum | AiCallLogScalarFieldEnum[]
  }

  /**
   * AiCallLog findMany
   */
  export type AiCallLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter, which AiCallLogs to fetch.
     */
    where?: AiCallLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiCallLogs to fetch.
     */
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AiCallLogs.
     */
    cursor?: AiCallLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiCallLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiCallLogs.
     */
    skip?: number
    distinct?: AiCallLogScalarFieldEnum | AiCallLogScalarFieldEnum[]
  }

  /**
   * AiCallLog create
   */
  export type AiCallLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * The data needed to create a AiCallLog.
     */
    data: XOR<AiCallLogCreateInput, AiCallLogUncheckedCreateInput>
  }

  /**
   * AiCallLog createMany
   */
  export type AiCallLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AiCallLogs.
     */
    data: AiCallLogCreateManyInput | AiCallLogCreateManyInput[]
  }

  /**
   * AiCallLog createManyAndReturn
   */
  export type AiCallLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * The data used to create many AiCallLogs.
     */
    data: AiCallLogCreateManyInput | AiCallLogCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AiCallLog update
   */
  export type AiCallLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * The data needed to update a AiCallLog.
     */
    data: XOR<AiCallLogUpdateInput, AiCallLogUncheckedUpdateInput>
    /**
     * Choose, which AiCallLog to update.
     */
    where: AiCallLogWhereUniqueInput
  }

  /**
   * AiCallLog updateMany
   */
  export type AiCallLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AiCallLogs.
     */
    data: XOR<AiCallLogUpdateManyMutationInput, AiCallLogUncheckedUpdateManyInput>
    /**
     * Filter which AiCallLogs to update
     */
    where?: AiCallLogWhereInput
    /**
     * Limit how many AiCallLogs to update.
     */
    limit?: number
  }

  /**
   * AiCallLog updateManyAndReturn
   */
  export type AiCallLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * The data used to update AiCallLogs.
     */
    data: XOR<AiCallLogUpdateManyMutationInput, AiCallLogUncheckedUpdateManyInput>
    /**
     * Filter which AiCallLogs to update
     */
    where?: AiCallLogWhereInput
    /**
     * Limit how many AiCallLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AiCallLog upsert
   */
  export type AiCallLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * The filter to search for the AiCallLog to update in case it exists.
     */
    where: AiCallLogWhereUniqueInput
    /**
     * In case the AiCallLog found by the `where` argument doesn't exist, create a new AiCallLog with this data.
     */
    create: XOR<AiCallLogCreateInput, AiCallLogUncheckedCreateInput>
    /**
     * In case the AiCallLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AiCallLogUpdateInput, AiCallLogUncheckedUpdateInput>
  }

  /**
   * AiCallLog delete
   */
  export type AiCallLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    /**
     * Filter which AiCallLog to delete.
     */
    where: AiCallLogWhereUniqueInput
  }

  /**
   * AiCallLog deleteMany
   */
  export type AiCallLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiCallLogs to delete
     */
    where?: AiCallLogWhereInput
    /**
     * Limit how many AiCallLogs to delete.
     */
    limit?: number
  }

  /**
   * AiCallLog.parent
   */
  export type AiCallLog$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    where?: AiCallLogWhereInput
  }

  /**
   * AiCallLog.children
   */
  export type AiCallLog$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
    where?: AiCallLogWhereInput
    orderBy?: AiCallLogOrderByWithRelationInput | AiCallLogOrderByWithRelationInput[]
    cursor?: AiCallLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AiCallLogScalarFieldEnum | AiCallLogScalarFieldEnum[]
  }

  /**
   * AiCallLog without action
   */
  export type AiCallLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiCallLog
     */
    select?: AiCallLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiCallLog
     */
    omit?: AiCallLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiCallLogInclude<ExtArgs> | null
  }


  /**
   * Model Viewport
   */

  export type AggregateViewport = {
    _count: ViewportCountAggregateOutputType | null
    _min: ViewportMinAggregateOutputType | null
    _max: ViewportMaxAggregateOutputType | null
  }

  export type ViewportMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    imageAssetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ViewportMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    imageAssetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ViewportCountAggregateOutputType = {
    id: number
    projectId: number
    imageAssetId: number
    keyframes: number
    regions: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ViewportMinAggregateInputType = {
    id?: true
    projectId?: true
    imageAssetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ViewportMaxAggregateInputType = {
    id?: true
    projectId?: true
    imageAssetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ViewportCountAggregateInputType = {
    id?: true
    projectId?: true
    imageAssetId?: true
    keyframes?: true
    regions?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ViewportAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Viewport to aggregate.
     */
    where?: ViewportWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Viewports to fetch.
     */
    orderBy?: ViewportOrderByWithRelationInput | ViewportOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ViewportWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Viewports from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Viewports.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Viewports
    **/
    _count?: true | ViewportCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ViewportMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ViewportMaxAggregateInputType
  }

  export type GetViewportAggregateType<T extends ViewportAggregateArgs> = {
        [P in keyof T & keyof AggregateViewport]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateViewport[P]>
      : GetScalarType<T[P], AggregateViewport[P]>
  }




  export type ViewportGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ViewportWhereInput
    orderBy?: ViewportOrderByWithAggregationInput | ViewportOrderByWithAggregationInput[]
    by: ViewportScalarFieldEnum[] | ViewportScalarFieldEnum
    having?: ViewportScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ViewportCountAggregateInputType | true
    _min?: ViewportMinAggregateInputType
    _max?: ViewportMaxAggregateInputType
  }

  export type ViewportGroupByOutputType = {
    id: string
    projectId: string
    imageAssetId: string | null
    keyframes: JsonValue
    regions: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ViewportCountAggregateOutputType | null
    _min: ViewportMinAggregateOutputType | null
    _max: ViewportMaxAggregateOutputType | null
  }

  type GetViewportGroupByPayload<T extends ViewportGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ViewportGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ViewportGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ViewportGroupByOutputType[P]>
            : GetScalarType<T[P], ViewportGroupByOutputType[P]>
        }
      >
    >


  export type ViewportSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    imageAssetId?: boolean
    keyframes?: boolean
    regions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }, ExtArgs["result"]["viewport"]>

  export type ViewportSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    imageAssetId?: boolean
    keyframes?: boolean
    regions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }, ExtArgs["result"]["viewport"]>

  export type ViewportSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    imageAssetId?: boolean
    keyframes?: boolean
    regions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }, ExtArgs["result"]["viewport"]>

  export type ViewportSelectScalar = {
    id?: boolean
    projectId?: boolean
    imageAssetId?: boolean
    keyframes?: boolean
    regions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ViewportOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "imageAssetId" | "keyframes" | "regions" | "createdAt" | "updatedAt", ExtArgs["result"]["viewport"]>
  export type ViewportInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }
  export type ViewportIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }
  export type ViewportIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    imageAsset?: boolean | Viewport$imageAssetArgs<ExtArgs>
  }

  export type $ViewportPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Viewport"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      imageAsset: Prisma.$AssetPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      imageAssetId: string | null
      keyframes: Prisma.JsonValue
      regions: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["viewport"]>
    composites: {}
  }

  type ViewportGetPayload<S extends boolean | null | undefined | ViewportDefaultArgs> = $Result.GetResult<Prisma.$ViewportPayload, S>

  type ViewportCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ViewportFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ViewportCountAggregateInputType | true
    }

  export interface ViewportDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Viewport'], meta: { name: 'Viewport' } }
    /**
     * Find zero or one Viewport that matches the filter.
     * @param {ViewportFindUniqueArgs} args - Arguments to find a Viewport
     * @example
     * // Get one Viewport
     * const viewport = await prisma.viewport.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ViewportFindUniqueArgs>(args: SelectSubset<T, ViewportFindUniqueArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Viewport that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ViewportFindUniqueOrThrowArgs} args - Arguments to find a Viewport
     * @example
     * // Get one Viewport
     * const viewport = await prisma.viewport.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ViewportFindUniqueOrThrowArgs>(args: SelectSubset<T, ViewportFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Viewport that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportFindFirstArgs} args - Arguments to find a Viewport
     * @example
     * // Get one Viewport
     * const viewport = await prisma.viewport.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ViewportFindFirstArgs>(args?: SelectSubset<T, ViewportFindFirstArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Viewport that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportFindFirstOrThrowArgs} args - Arguments to find a Viewport
     * @example
     * // Get one Viewport
     * const viewport = await prisma.viewport.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ViewportFindFirstOrThrowArgs>(args?: SelectSubset<T, ViewportFindFirstOrThrowArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Viewports that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Viewports
     * const viewports = await prisma.viewport.findMany()
     * 
     * // Get first 10 Viewports
     * const viewports = await prisma.viewport.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const viewportWithIdOnly = await prisma.viewport.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ViewportFindManyArgs>(args?: SelectSubset<T, ViewportFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Viewport.
     * @param {ViewportCreateArgs} args - Arguments to create a Viewport.
     * @example
     * // Create one Viewport
     * const Viewport = await prisma.viewport.create({
     *   data: {
     *     // ... data to create a Viewport
     *   }
     * })
     * 
     */
    create<T extends ViewportCreateArgs>(args: SelectSubset<T, ViewportCreateArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Viewports.
     * @param {ViewportCreateManyArgs} args - Arguments to create many Viewports.
     * @example
     * // Create many Viewports
     * const viewport = await prisma.viewport.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ViewportCreateManyArgs>(args?: SelectSubset<T, ViewportCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Viewports and returns the data saved in the database.
     * @param {ViewportCreateManyAndReturnArgs} args - Arguments to create many Viewports.
     * @example
     * // Create many Viewports
     * const viewport = await prisma.viewport.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Viewports and only return the `id`
     * const viewportWithIdOnly = await prisma.viewport.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ViewportCreateManyAndReturnArgs>(args?: SelectSubset<T, ViewportCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Viewport.
     * @param {ViewportDeleteArgs} args - Arguments to delete one Viewport.
     * @example
     * // Delete one Viewport
     * const Viewport = await prisma.viewport.delete({
     *   where: {
     *     // ... filter to delete one Viewport
     *   }
     * })
     * 
     */
    delete<T extends ViewportDeleteArgs>(args: SelectSubset<T, ViewportDeleteArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Viewport.
     * @param {ViewportUpdateArgs} args - Arguments to update one Viewport.
     * @example
     * // Update one Viewport
     * const viewport = await prisma.viewport.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ViewportUpdateArgs>(args: SelectSubset<T, ViewportUpdateArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Viewports.
     * @param {ViewportDeleteManyArgs} args - Arguments to filter Viewports to delete.
     * @example
     * // Delete a few Viewports
     * const { count } = await prisma.viewport.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ViewportDeleteManyArgs>(args?: SelectSubset<T, ViewportDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Viewports.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Viewports
     * const viewport = await prisma.viewport.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ViewportUpdateManyArgs>(args: SelectSubset<T, ViewportUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Viewports and returns the data updated in the database.
     * @param {ViewportUpdateManyAndReturnArgs} args - Arguments to update many Viewports.
     * @example
     * // Update many Viewports
     * const viewport = await prisma.viewport.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Viewports and only return the `id`
     * const viewportWithIdOnly = await prisma.viewport.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ViewportUpdateManyAndReturnArgs>(args: SelectSubset<T, ViewportUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Viewport.
     * @param {ViewportUpsertArgs} args - Arguments to update or create a Viewport.
     * @example
     * // Update or create a Viewport
     * const viewport = await prisma.viewport.upsert({
     *   create: {
     *     // ... data to create a Viewport
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Viewport we want to update
     *   }
     * })
     */
    upsert<T extends ViewportUpsertArgs>(args: SelectSubset<T, ViewportUpsertArgs<ExtArgs>>): Prisma__ViewportClient<$Result.GetResult<Prisma.$ViewportPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Viewports.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportCountArgs} args - Arguments to filter Viewports to count.
     * @example
     * // Count the number of Viewports
     * const count = await prisma.viewport.count({
     *   where: {
     *     // ... the filter for the Viewports we want to count
     *   }
     * })
    **/
    count<T extends ViewportCountArgs>(
      args?: Subset<T, ViewportCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ViewportCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Viewport.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ViewportAggregateArgs>(args: Subset<T, ViewportAggregateArgs>): Prisma.PrismaPromise<GetViewportAggregateType<T>>

    /**
     * Group by Viewport.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ViewportGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ViewportGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ViewportGroupByArgs['orderBy'] }
        : { orderBy?: ViewportGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ViewportGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetViewportGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Viewport model
   */
  readonly fields: ViewportFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Viewport.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ViewportClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    imageAsset<T extends Viewport$imageAssetArgs<ExtArgs> = {}>(args?: Subset<T, Viewport$imageAssetArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Viewport model
   */
  interface ViewportFieldRefs {
    readonly id: FieldRef<"Viewport", 'String'>
    readonly projectId: FieldRef<"Viewport", 'String'>
    readonly imageAssetId: FieldRef<"Viewport", 'String'>
    readonly keyframes: FieldRef<"Viewport", 'Json'>
    readonly regions: FieldRef<"Viewport", 'Json'>
    readonly createdAt: FieldRef<"Viewport", 'DateTime'>
    readonly updatedAt: FieldRef<"Viewport", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Viewport findUnique
   */
  export type ViewportFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter, which Viewport to fetch.
     */
    where: ViewportWhereUniqueInput
  }

  /**
   * Viewport findUniqueOrThrow
   */
  export type ViewportFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter, which Viewport to fetch.
     */
    where: ViewportWhereUniqueInput
  }

  /**
   * Viewport findFirst
   */
  export type ViewportFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter, which Viewport to fetch.
     */
    where?: ViewportWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Viewports to fetch.
     */
    orderBy?: ViewportOrderByWithRelationInput | ViewportOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Viewports.
     */
    cursor?: ViewportWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Viewports from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Viewports.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Viewports.
     */
    distinct?: ViewportScalarFieldEnum | ViewportScalarFieldEnum[]
  }

  /**
   * Viewport findFirstOrThrow
   */
  export type ViewportFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter, which Viewport to fetch.
     */
    where?: ViewportWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Viewports to fetch.
     */
    orderBy?: ViewportOrderByWithRelationInput | ViewportOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Viewports.
     */
    cursor?: ViewportWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Viewports from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Viewports.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Viewports.
     */
    distinct?: ViewportScalarFieldEnum | ViewportScalarFieldEnum[]
  }

  /**
   * Viewport findMany
   */
  export type ViewportFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter, which Viewports to fetch.
     */
    where?: ViewportWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Viewports to fetch.
     */
    orderBy?: ViewportOrderByWithRelationInput | ViewportOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Viewports.
     */
    cursor?: ViewportWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Viewports from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Viewports.
     */
    skip?: number
    distinct?: ViewportScalarFieldEnum | ViewportScalarFieldEnum[]
  }

  /**
   * Viewport create
   */
  export type ViewportCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * The data needed to create a Viewport.
     */
    data: XOR<ViewportCreateInput, ViewportUncheckedCreateInput>
  }

  /**
   * Viewport createMany
   */
  export type ViewportCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Viewports.
     */
    data: ViewportCreateManyInput | ViewportCreateManyInput[]
  }

  /**
   * Viewport createManyAndReturn
   */
  export type ViewportCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * The data used to create many Viewports.
     */
    data: ViewportCreateManyInput | ViewportCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Viewport update
   */
  export type ViewportUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * The data needed to update a Viewport.
     */
    data: XOR<ViewportUpdateInput, ViewportUncheckedUpdateInput>
    /**
     * Choose, which Viewport to update.
     */
    where: ViewportWhereUniqueInput
  }

  /**
   * Viewport updateMany
   */
  export type ViewportUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Viewports.
     */
    data: XOR<ViewportUpdateManyMutationInput, ViewportUncheckedUpdateManyInput>
    /**
     * Filter which Viewports to update
     */
    where?: ViewportWhereInput
    /**
     * Limit how many Viewports to update.
     */
    limit?: number
  }

  /**
   * Viewport updateManyAndReturn
   */
  export type ViewportUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * The data used to update Viewports.
     */
    data: XOR<ViewportUpdateManyMutationInput, ViewportUncheckedUpdateManyInput>
    /**
     * Filter which Viewports to update
     */
    where?: ViewportWhereInput
    /**
     * Limit how many Viewports to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Viewport upsert
   */
  export type ViewportUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * The filter to search for the Viewport to update in case it exists.
     */
    where: ViewportWhereUniqueInput
    /**
     * In case the Viewport found by the `where` argument doesn't exist, create a new Viewport with this data.
     */
    create: XOR<ViewportCreateInput, ViewportUncheckedCreateInput>
    /**
     * In case the Viewport was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ViewportUpdateInput, ViewportUncheckedUpdateInput>
  }

  /**
   * Viewport delete
   */
  export type ViewportDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
    /**
     * Filter which Viewport to delete.
     */
    where: ViewportWhereUniqueInput
  }

  /**
   * Viewport deleteMany
   */
  export type ViewportDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Viewports to delete
     */
    where?: ViewportWhereInput
    /**
     * Limit how many Viewports to delete.
     */
    limit?: number
  }

  /**
   * Viewport.imageAsset
   */
  export type Viewport$imageAssetArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    where?: AssetWhereInput
  }

  /**
   * Viewport without action
   */
  export type ViewportDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Viewport
     */
    select?: ViewportSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Viewport
     */
    omit?: ViewportOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ViewportInclude<ExtArgs> | null
  }


  /**
   * Model Board
   */

  export type AggregateBoard = {
    _count: BoardCountAggregateOutputType | null
    _avg: BoardAvgAggregateOutputType | null
    _sum: BoardSumAggregateOutputType | null
    _min: BoardMinAggregateOutputType | null
    _max: BoardMaxAggregateOutputType | null
  }

  export type BoardAvgAggregateOutputType = {
    index: number | null
  }

  export type BoardSumAggregateOutputType = {
    index: number | null
  }

  export type BoardMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    index: number | null
    assetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BoardMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    index: number | null
    assetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BoardCountAggregateOutputType = {
    id: number
    projectId: number
    index: number
    layout: number
    regions: number
    triggers: number
    plan: number
    prompts: number
    assetId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BoardAvgAggregateInputType = {
    index?: true
  }

  export type BoardSumAggregateInputType = {
    index?: true
  }

  export type BoardMinAggregateInputType = {
    id?: true
    projectId?: true
    index?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BoardMaxAggregateInputType = {
    id?: true
    projectId?: true
    index?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BoardCountAggregateInputType = {
    id?: true
    projectId?: true
    index?: true
    layout?: true
    regions?: true
    triggers?: true
    plan?: true
    prompts?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BoardAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Board to aggregate.
     */
    where?: BoardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boards to fetch.
     */
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BoardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Boards
    **/
    _count?: true | BoardCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BoardAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BoardSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BoardMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BoardMaxAggregateInputType
  }

  export type GetBoardAggregateType<T extends BoardAggregateArgs> = {
        [P in keyof T & keyof AggregateBoard]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBoard[P]>
      : GetScalarType<T[P], AggregateBoard[P]>
  }




  export type BoardGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BoardWhereInput
    orderBy?: BoardOrderByWithAggregationInput | BoardOrderByWithAggregationInput[]
    by: BoardScalarFieldEnum[] | BoardScalarFieldEnum
    having?: BoardScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BoardCountAggregateInputType | true
    _avg?: BoardAvgAggregateInputType
    _sum?: BoardSumAggregateInputType
    _min?: BoardMinAggregateInputType
    _max?: BoardMaxAggregateInputType
  }

  export type BoardGroupByOutputType = {
    id: string
    projectId: string
    index: number
    layout: JsonValue
    regions: JsonValue
    triggers: JsonValue | null
    plan: JsonValue | null
    prompts: JsonValue | null
    assetId: string | null
    createdAt: Date
    updatedAt: Date
    _count: BoardCountAggregateOutputType | null
    _avg: BoardAvgAggregateOutputType | null
    _sum: BoardSumAggregateOutputType | null
    _min: BoardMinAggregateOutputType | null
    _max: BoardMaxAggregateOutputType | null
  }

  type GetBoardGroupByPayload<T extends BoardGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BoardGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BoardGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BoardGroupByOutputType[P]>
            : GetScalarType<T[P], BoardGroupByOutputType[P]>
        }
      >
    >


  export type BoardSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    index?: boolean
    layout?: boolean
    regions?: boolean
    triggers?: boolean
    plan?: boolean
    prompts?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }, ExtArgs["result"]["board"]>

  export type BoardSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    index?: boolean
    layout?: boolean
    regions?: boolean
    triggers?: boolean
    plan?: boolean
    prompts?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }, ExtArgs["result"]["board"]>

  export type BoardSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    index?: boolean
    layout?: boolean
    regions?: boolean
    triggers?: boolean
    plan?: boolean
    prompts?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }, ExtArgs["result"]["board"]>

  export type BoardSelectScalar = {
    id?: boolean
    projectId?: boolean
    index?: boolean
    layout?: boolean
    regions?: boolean
    triggers?: boolean
    plan?: boolean
    prompts?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BoardOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "index" | "layout" | "regions" | "triggers" | "plan" | "prompts" | "assetId" | "createdAt" | "updatedAt", ExtArgs["result"]["board"]>
  export type BoardInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }
  export type BoardIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }
  export type BoardIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    asset?: boolean | Board$assetArgs<ExtArgs>
  }

  export type $BoardPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Board"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      asset: Prisma.$AssetPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      index: number
      layout: Prisma.JsonValue
      regions: Prisma.JsonValue
      triggers: Prisma.JsonValue | null
      plan: Prisma.JsonValue | null
      prompts: Prisma.JsonValue | null
      assetId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["board"]>
    composites: {}
  }

  type BoardGetPayload<S extends boolean | null | undefined | BoardDefaultArgs> = $Result.GetResult<Prisma.$BoardPayload, S>

  type BoardCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BoardFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BoardCountAggregateInputType | true
    }

  export interface BoardDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Board'], meta: { name: 'Board' } }
    /**
     * Find zero or one Board that matches the filter.
     * @param {BoardFindUniqueArgs} args - Arguments to find a Board
     * @example
     * // Get one Board
     * const board = await prisma.board.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BoardFindUniqueArgs>(args: SelectSubset<T, BoardFindUniqueArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Board that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BoardFindUniqueOrThrowArgs} args - Arguments to find a Board
     * @example
     * // Get one Board
     * const board = await prisma.board.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BoardFindUniqueOrThrowArgs>(args: SelectSubset<T, BoardFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Board that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardFindFirstArgs} args - Arguments to find a Board
     * @example
     * // Get one Board
     * const board = await prisma.board.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BoardFindFirstArgs>(args?: SelectSubset<T, BoardFindFirstArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Board that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardFindFirstOrThrowArgs} args - Arguments to find a Board
     * @example
     * // Get one Board
     * const board = await prisma.board.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BoardFindFirstOrThrowArgs>(args?: SelectSubset<T, BoardFindFirstOrThrowArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Boards that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Boards
     * const boards = await prisma.board.findMany()
     * 
     * // Get first 10 Boards
     * const boards = await prisma.board.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const boardWithIdOnly = await prisma.board.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BoardFindManyArgs>(args?: SelectSubset<T, BoardFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Board.
     * @param {BoardCreateArgs} args - Arguments to create a Board.
     * @example
     * // Create one Board
     * const Board = await prisma.board.create({
     *   data: {
     *     // ... data to create a Board
     *   }
     * })
     * 
     */
    create<T extends BoardCreateArgs>(args: SelectSubset<T, BoardCreateArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Boards.
     * @param {BoardCreateManyArgs} args - Arguments to create many Boards.
     * @example
     * // Create many Boards
     * const board = await prisma.board.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BoardCreateManyArgs>(args?: SelectSubset<T, BoardCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Boards and returns the data saved in the database.
     * @param {BoardCreateManyAndReturnArgs} args - Arguments to create many Boards.
     * @example
     * // Create many Boards
     * const board = await prisma.board.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Boards and only return the `id`
     * const boardWithIdOnly = await prisma.board.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BoardCreateManyAndReturnArgs>(args?: SelectSubset<T, BoardCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Board.
     * @param {BoardDeleteArgs} args - Arguments to delete one Board.
     * @example
     * // Delete one Board
     * const Board = await prisma.board.delete({
     *   where: {
     *     // ... filter to delete one Board
     *   }
     * })
     * 
     */
    delete<T extends BoardDeleteArgs>(args: SelectSubset<T, BoardDeleteArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Board.
     * @param {BoardUpdateArgs} args - Arguments to update one Board.
     * @example
     * // Update one Board
     * const board = await prisma.board.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BoardUpdateArgs>(args: SelectSubset<T, BoardUpdateArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Boards.
     * @param {BoardDeleteManyArgs} args - Arguments to filter Boards to delete.
     * @example
     * // Delete a few Boards
     * const { count } = await prisma.board.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BoardDeleteManyArgs>(args?: SelectSubset<T, BoardDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Boards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Boards
     * const board = await prisma.board.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BoardUpdateManyArgs>(args: SelectSubset<T, BoardUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Boards and returns the data updated in the database.
     * @param {BoardUpdateManyAndReturnArgs} args - Arguments to update many Boards.
     * @example
     * // Update many Boards
     * const board = await prisma.board.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Boards and only return the `id`
     * const boardWithIdOnly = await prisma.board.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BoardUpdateManyAndReturnArgs>(args: SelectSubset<T, BoardUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Board.
     * @param {BoardUpsertArgs} args - Arguments to update or create a Board.
     * @example
     * // Update or create a Board
     * const board = await prisma.board.upsert({
     *   create: {
     *     // ... data to create a Board
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Board we want to update
     *   }
     * })
     */
    upsert<T extends BoardUpsertArgs>(args: SelectSubset<T, BoardUpsertArgs<ExtArgs>>): Prisma__BoardClient<$Result.GetResult<Prisma.$BoardPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Boards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardCountArgs} args - Arguments to filter Boards to count.
     * @example
     * // Count the number of Boards
     * const count = await prisma.board.count({
     *   where: {
     *     // ... the filter for the Boards we want to count
     *   }
     * })
    **/
    count<T extends BoardCountArgs>(
      args?: Subset<T, BoardCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BoardCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Board.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BoardAggregateArgs>(args: Subset<T, BoardAggregateArgs>): Prisma.PrismaPromise<GetBoardAggregateType<T>>

    /**
     * Group by Board.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoardGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BoardGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BoardGroupByArgs['orderBy'] }
        : { orderBy?: BoardGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BoardGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBoardGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Board model
   */
  readonly fields: BoardFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Board.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BoardClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    asset<T extends Board$assetArgs<ExtArgs> = {}>(args?: Subset<T, Board$assetArgs<ExtArgs>>): Prisma__AssetClient<$Result.GetResult<Prisma.$AssetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Board model
   */
  interface BoardFieldRefs {
    readonly id: FieldRef<"Board", 'String'>
    readonly projectId: FieldRef<"Board", 'String'>
    readonly index: FieldRef<"Board", 'Int'>
    readonly layout: FieldRef<"Board", 'Json'>
    readonly regions: FieldRef<"Board", 'Json'>
    readonly triggers: FieldRef<"Board", 'Json'>
    readonly plan: FieldRef<"Board", 'Json'>
    readonly prompts: FieldRef<"Board", 'Json'>
    readonly assetId: FieldRef<"Board", 'String'>
    readonly createdAt: FieldRef<"Board", 'DateTime'>
    readonly updatedAt: FieldRef<"Board", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Board findUnique
   */
  export type BoardFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter, which Board to fetch.
     */
    where: BoardWhereUniqueInput
  }

  /**
   * Board findUniqueOrThrow
   */
  export type BoardFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter, which Board to fetch.
     */
    where: BoardWhereUniqueInput
  }

  /**
   * Board findFirst
   */
  export type BoardFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter, which Board to fetch.
     */
    where?: BoardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boards to fetch.
     */
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Boards.
     */
    cursor?: BoardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Boards.
     */
    distinct?: BoardScalarFieldEnum | BoardScalarFieldEnum[]
  }

  /**
   * Board findFirstOrThrow
   */
  export type BoardFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter, which Board to fetch.
     */
    where?: BoardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boards to fetch.
     */
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Boards.
     */
    cursor?: BoardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Boards.
     */
    distinct?: BoardScalarFieldEnum | BoardScalarFieldEnum[]
  }

  /**
   * Board findMany
   */
  export type BoardFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter, which Boards to fetch.
     */
    where?: BoardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boards to fetch.
     */
    orderBy?: BoardOrderByWithRelationInput | BoardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Boards.
     */
    cursor?: BoardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boards.
     */
    skip?: number
    distinct?: BoardScalarFieldEnum | BoardScalarFieldEnum[]
  }

  /**
   * Board create
   */
  export type BoardCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * The data needed to create a Board.
     */
    data: XOR<BoardCreateInput, BoardUncheckedCreateInput>
  }

  /**
   * Board createMany
   */
  export type BoardCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Boards.
     */
    data: BoardCreateManyInput | BoardCreateManyInput[]
  }

  /**
   * Board createManyAndReturn
   */
  export type BoardCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * The data used to create many Boards.
     */
    data: BoardCreateManyInput | BoardCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Board update
   */
  export type BoardUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * The data needed to update a Board.
     */
    data: XOR<BoardUpdateInput, BoardUncheckedUpdateInput>
    /**
     * Choose, which Board to update.
     */
    where: BoardWhereUniqueInput
  }

  /**
   * Board updateMany
   */
  export type BoardUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Boards.
     */
    data: XOR<BoardUpdateManyMutationInput, BoardUncheckedUpdateManyInput>
    /**
     * Filter which Boards to update
     */
    where?: BoardWhereInput
    /**
     * Limit how many Boards to update.
     */
    limit?: number
  }

  /**
   * Board updateManyAndReturn
   */
  export type BoardUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * The data used to update Boards.
     */
    data: XOR<BoardUpdateManyMutationInput, BoardUncheckedUpdateManyInput>
    /**
     * Filter which Boards to update
     */
    where?: BoardWhereInput
    /**
     * Limit how many Boards to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Board upsert
   */
  export type BoardUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * The filter to search for the Board to update in case it exists.
     */
    where: BoardWhereUniqueInput
    /**
     * In case the Board found by the `where` argument doesn't exist, create a new Board with this data.
     */
    create: XOR<BoardCreateInput, BoardUncheckedCreateInput>
    /**
     * In case the Board was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BoardUpdateInput, BoardUncheckedUpdateInput>
  }

  /**
   * Board delete
   */
  export type BoardDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
    /**
     * Filter which Board to delete.
     */
    where: BoardWhereUniqueInput
  }

  /**
   * Board deleteMany
   */
  export type BoardDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Boards to delete
     */
    where?: BoardWhereInput
    /**
     * Limit how many Boards to delete.
     */
    limit?: number
  }

  /**
   * Board.asset
   */
  export type Board$assetArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Asset
     */
    select?: AssetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Asset
     */
    omit?: AssetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AssetInclude<ExtArgs> | null
    where?: AssetWhereInput
  }

  /**
   * Board without action
   */
  export type BoardDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Board
     */
    select?: BoardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Board
     */
    omit?: BoardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoardInclude<ExtArgs> | null
  }


  /**
   * Model Blueprint
   */

  export type AggregateBlueprint = {
    _count: BlueprintCountAggregateOutputType | null
    _avg: BlueprintAvgAggregateOutputType | null
    _sum: BlueprintSumAggregateOutputType | null
    _min: BlueprintMinAggregateOutputType | null
    _max: BlueprintMaxAggregateOutputType | null
  }

  export type BlueprintAvgAggregateOutputType = {
    version: number | null
    targetDurationMs: number | null
  }

  export type BlueprintSumAggregateOutputType = {
    version: number | null
    targetDurationMs: number | null
  }

  export type BlueprintMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    version: number | null
    targetDurationMs: number | null
    status: $Enums.BlueprintStatus | null
    rejectionNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlueprintMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    version: number | null
    targetDurationMs: number | null
    status: $Enums.BlueprintStatus | null
    rejectionNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlueprintCountAggregateOutputType = {
    id: number
    projectId: number
    version: number
    targetDurationMs: number
    status: number
    beats: number
    rejectionNotes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BlueprintAvgAggregateInputType = {
    version?: true
    targetDurationMs?: true
  }

  export type BlueprintSumAggregateInputType = {
    version?: true
    targetDurationMs?: true
  }

  export type BlueprintMinAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    targetDurationMs?: true
    status?: true
    rejectionNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlueprintMaxAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    targetDurationMs?: true
    status?: true
    rejectionNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlueprintCountAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    targetDurationMs?: true
    status?: true
    beats?: true
    rejectionNotes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BlueprintAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Blueprint to aggregate.
     */
    where?: BlueprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Blueprints to fetch.
     */
    orderBy?: BlueprintOrderByWithRelationInput | BlueprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlueprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Blueprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Blueprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Blueprints
    **/
    _count?: true | BlueprintCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BlueprintAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BlueprintSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlueprintMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlueprintMaxAggregateInputType
  }

  export type GetBlueprintAggregateType<T extends BlueprintAggregateArgs> = {
        [P in keyof T & keyof AggregateBlueprint]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlueprint[P]>
      : GetScalarType<T[P], AggregateBlueprint[P]>
  }




  export type BlueprintGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlueprintWhereInput
    orderBy?: BlueprintOrderByWithAggregationInput | BlueprintOrderByWithAggregationInput[]
    by: BlueprintScalarFieldEnum[] | BlueprintScalarFieldEnum
    having?: BlueprintScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlueprintCountAggregateInputType | true
    _avg?: BlueprintAvgAggregateInputType
    _sum?: BlueprintSumAggregateInputType
    _min?: BlueprintMinAggregateInputType
    _max?: BlueprintMaxAggregateInputType
  }

  export type BlueprintGroupByOutputType = {
    id: string
    projectId: string
    version: number
    targetDurationMs: number
    status: $Enums.BlueprintStatus
    beats: JsonValue
    rejectionNotes: string | null
    createdAt: Date
    updatedAt: Date
    _count: BlueprintCountAggregateOutputType | null
    _avg: BlueprintAvgAggregateOutputType | null
    _sum: BlueprintSumAggregateOutputType | null
    _min: BlueprintMinAggregateOutputType | null
    _max: BlueprintMaxAggregateOutputType | null
  }

  type GetBlueprintGroupByPayload<T extends BlueprintGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlueprintGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlueprintGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlueprintGroupByOutputType[P]>
            : GetScalarType<T[P], BlueprintGroupByOutputType[P]>
        }
      >
    >


  export type BlueprintSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    targetDurationMs?: boolean
    status?: boolean
    beats?: boolean
    rejectionNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    scripts?: boolean | Blueprint$scriptsArgs<ExtArgs>
    scriptDrafts?: boolean | Blueprint$scriptDraftsArgs<ExtArgs>
    histories?: boolean | Blueprint$historiesArgs<ExtArgs>
    draftHistories?: boolean | Blueprint$draftHistoriesArgs<ExtArgs>
    _count?: boolean | BlueprintCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprint"]>

  export type BlueprintSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    targetDurationMs?: boolean
    status?: boolean
    beats?: boolean
    rejectionNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprint"]>

  export type BlueprintSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    targetDurationMs?: boolean
    status?: boolean
    beats?: boolean
    rejectionNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprint"]>

  export type BlueprintSelectScalar = {
    id?: boolean
    projectId?: boolean
    version?: boolean
    targetDurationMs?: boolean
    status?: boolean
    beats?: boolean
    rejectionNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BlueprintOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "version" | "targetDurationMs" | "status" | "beats" | "rejectionNotes" | "createdAt" | "updatedAt", ExtArgs["result"]["blueprint"]>
  export type BlueprintInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    scripts?: boolean | Blueprint$scriptsArgs<ExtArgs>
    scriptDrafts?: boolean | Blueprint$scriptDraftsArgs<ExtArgs>
    histories?: boolean | Blueprint$historiesArgs<ExtArgs>
    draftHistories?: boolean | Blueprint$draftHistoriesArgs<ExtArgs>
    _count?: boolean | BlueprintCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BlueprintIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type BlueprintIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $BlueprintPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Blueprint"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      scripts: Prisma.$ScriptPayload<ExtArgs>[]
      scriptDrafts: Prisma.$ScriptDraftPayload<ExtArgs>[]
      histories: Prisma.$BlueprintHistoryPayload<ExtArgs>[]
      draftHistories: Prisma.$ScriptDraftHistoryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      version: number
      targetDurationMs: number
      status: $Enums.BlueprintStatus
      beats: Prisma.JsonValue
      rejectionNotes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["blueprint"]>
    composites: {}
  }

  type BlueprintGetPayload<S extends boolean | null | undefined | BlueprintDefaultArgs> = $Result.GetResult<Prisma.$BlueprintPayload, S>

  type BlueprintCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlueprintFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlueprintCountAggregateInputType | true
    }

  export interface BlueprintDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Blueprint'], meta: { name: 'Blueprint' } }
    /**
     * Find zero or one Blueprint that matches the filter.
     * @param {BlueprintFindUniqueArgs} args - Arguments to find a Blueprint
     * @example
     * // Get one Blueprint
     * const blueprint = await prisma.blueprint.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlueprintFindUniqueArgs>(args: SelectSubset<T, BlueprintFindUniqueArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Blueprint that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlueprintFindUniqueOrThrowArgs} args - Arguments to find a Blueprint
     * @example
     * // Get one Blueprint
     * const blueprint = await prisma.blueprint.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlueprintFindUniqueOrThrowArgs>(args: SelectSubset<T, BlueprintFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Blueprint that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintFindFirstArgs} args - Arguments to find a Blueprint
     * @example
     * // Get one Blueprint
     * const blueprint = await prisma.blueprint.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlueprintFindFirstArgs>(args?: SelectSubset<T, BlueprintFindFirstArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Blueprint that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintFindFirstOrThrowArgs} args - Arguments to find a Blueprint
     * @example
     * // Get one Blueprint
     * const blueprint = await prisma.blueprint.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlueprintFindFirstOrThrowArgs>(args?: SelectSubset<T, BlueprintFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Blueprints that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Blueprints
     * const blueprints = await prisma.blueprint.findMany()
     * 
     * // Get first 10 Blueprints
     * const blueprints = await prisma.blueprint.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blueprintWithIdOnly = await prisma.blueprint.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlueprintFindManyArgs>(args?: SelectSubset<T, BlueprintFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Blueprint.
     * @param {BlueprintCreateArgs} args - Arguments to create a Blueprint.
     * @example
     * // Create one Blueprint
     * const Blueprint = await prisma.blueprint.create({
     *   data: {
     *     // ... data to create a Blueprint
     *   }
     * })
     * 
     */
    create<T extends BlueprintCreateArgs>(args: SelectSubset<T, BlueprintCreateArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Blueprints.
     * @param {BlueprintCreateManyArgs} args - Arguments to create many Blueprints.
     * @example
     * // Create many Blueprints
     * const blueprint = await prisma.blueprint.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlueprintCreateManyArgs>(args?: SelectSubset<T, BlueprintCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Blueprints and returns the data saved in the database.
     * @param {BlueprintCreateManyAndReturnArgs} args - Arguments to create many Blueprints.
     * @example
     * // Create many Blueprints
     * const blueprint = await prisma.blueprint.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Blueprints and only return the `id`
     * const blueprintWithIdOnly = await prisma.blueprint.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BlueprintCreateManyAndReturnArgs>(args?: SelectSubset<T, BlueprintCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Blueprint.
     * @param {BlueprintDeleteArgs} args - Arguments to delete one Blueprint.
     * @example
     * // Delete one Blueprint
     * const Blueprint = await prisma.blueprint.delete({
     *   where: {
     *     // ... filter to delete one Blueprint
     *   }
     * })
     * 
     */
    delete<T extends BlueprintDeleteArgs>(args: SelectSubset<T, BlueprintDeleteArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Blueprint.
     * @param {BlueprintUpdateArgs} args - Arguments to update one Blueprint.
     * @example
     * // Update one Blueprint
     * const blueprint = await prisma.blueprint.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlueprintUpdateArgs>(args: SelectSubset<T, BlueprintUpdateArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Blueprints.
     * @param {BlueprintDeleteManyArgs} args - Arguments to filter Blueprints to delete.
     * @example
     * // Delete a few Blueprints
     * const { count } = await prisma.blueprint.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlueprintDeleteManyArgs>(args?: SelectSubset<T, BlueprintDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Blueprints.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Blueprints
     * const blueprint = await prisma.blueprint.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlueprintUpdateManyArgs>(args: SelectSubset<T, BlueprintUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Blueprints and returns the data updated in the database.
     * @param {BlueprintUpdateManyAndReturnArgs} args - Arguments to update many Blueprints.
     * @example
     * // Update many Blueprints
     * const blueprint = await prisma.blueprint.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Blueprints and only return the `id`
     * const blueprintWithIdOnly = await prisma.blueprint.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BlueprintUpdateManyAndReturnArgs>(args: SelectSubset<T, BlueprintUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Blueprint.
     * @param {BlueprintUpsertArgs} args - Arguments to update or create a Blueprint.
     * @example
     * // Update or create a Blueprint
     * const blueprint = await prisma.blueprint.upsert({
     *   create: {
     *     // ... data to create a Blueprint
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Blueprint we want to update
     *   }
     * })
     */
    upsert<T extends BlueprintUpsertArgs>(args: SelectSubset<T, BlueprintUpsertArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Blueprints.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintCountArgs} args - Arguments to filter Blueprints to count.
     * @example
     * // Count the number of Blueprints
     * const count = await prisma.blueprint.count({
     *   where: {
     *     // ... the filter for the Blueprints we want to count
     *   }
     * })
    **/
    count<T extends BlueprintCountArgs>(
      args?: Subset<T, BlueprintCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlueprintCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Blueprint.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlueprintAggregateArgs>(args: Subset<T, BlueprintAggregateArgs>): Prisma.PrismaPromise<GetBlueprintAggregateType<T>>

    /**
     * Group by Blueprint.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlueprintGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlueprintGroupByArgs['orderBy'] }
        : { orderBy?: BlueprintGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlueprintGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlueprintGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Blueprint model
   */
  readonly fields: BlueprintFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Blueprint.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlueprintClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    scripts<T extends Blueprint$scriptsArgs<ExtArgs> = {}>(args?: Subset<T, Blueprint$scriptsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    scriptDrafts<T extends Blueprint$scriptDraftsArgs<ExtArgs> = {}>(args?: Subset<T, Blueprint$scriptDraftsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    histories<T extends Blueprint$historiesArgs<ExtArgs> = {}>(args?: Subset<T, Blueprint$historiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    draftHistories<T extends Blueprint$draftHistoriesArgs<ExtArgs> = {}>(args?: Subset<T, Blueprint$draftHistoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Blueprint model
   */
  interface BlueprintFieldRefs {
    readonly id: FieldRef<"Blueprint", 'String'>
    readonly projectId: FieldRef<"Blueprint", 'String'>
    readonly version: FieldRef<"Blueprint", 'Int'>
    readonly targetDurationMs: FieldRef<"Blueprint", 'Int'>
    readonly status: FieldRef<"Blueprint", 'BlueprintStatus'>
    readonly beats: FieldRef<"Blueprint", 'Json'>
    readonly rejectionNotes: FieldRef<"Blueprint", 'String'>
    readonly createdAt: FieldRef<"Blueprint", 'DateTime'>
    readonly updatedAt: FieldRef<"Blueprint", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Blueprint findUnique
   */
  export type BlueprintFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter, which Blueprint to fetch.
     */
    where: BlueprintWhereUniqueInput
  }

  /**
   * Blueprint findUniqueOrThrow
   */
  export type BlueprintFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter, which Blueprint to fetch.
     */
    where: BlueprintWhereUniqueInput
  }

  /**
   * Blueprint findFirst
   */
  export type BlueprintFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter, which Blueprint to fetch.
     */
    where?: BlueprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Blueprints to fetch.
     */
    orderBy?: BlueprintOrderByWithRelationInput | BlueprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Blueprints.
     */
    cursor?: BlueprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Blueprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Blueprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Blueprints.
     */
    distinct?: BlueprintScalarFieldEnum | BlueprintScalarFieldEnum[]
  }

  /**
   * Blueprint findFirstOrThrow
   */
  export type BlueprintFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter, which Blueprint to fetch.
     */
    where?: BlueprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Blueprints to fetch.
     */
    orderBy?: BlueprintOrderByWithRelationInput | BlueprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Blueprints.
     */
    cursor?: BlueprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Blueprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Blueprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Blueprints.
     */
    distinct?: BlueprintScalarFieldEnum | BlueprintScalarFieldEnum[]
  }

  /**
   * Blueprint findMany
   */
  export type BlueprintFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter, which Blueprints to fetch.
     */
    where?: BlueprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Blueprints to fetch.
     */
    orderBy?: BlueprintOrderByWithRelationInput | BlueprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Blueprints.
     */
    cursor?: BlueprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Blueprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Blueprints.
     */
    skip?: number
    distinct?: BlueprintScalarFieldEnum | BlueprintScalarFieldEnum[]
  }

  /**
   * Blueprint create
   */
  export type BlueprintCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * The data needed to create a Blueprint.
     */
    data: XOR<BlueprintCreateInput, BlueprintUncheckedCreateInput>
  }

  /**
   * Blueprint createMany
   */
  export type BlueprintCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Blueprints.
     */
    data: BlueprintCreateManyInput | BlueprintCreateManyInput[]
  }

  /**
   * Blueprint createManyAndReturn
   */
  export type BlueprintCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * The data used to create many Blueprints.
     */
    data: BlueprintCreateManyInput | BlueprintCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Blueprint update
   */
  export type BlueprintUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * The data needed to update a Blueprint.
     */
    data: XOR<BlueprintUpdateInput, BlueprintUncheckedUpdateInput>
    /**
     * Choose, which Blueprint to update.
     */
    where: BlueprintWhereUniqueInput
  }

  /**
   * Blueprint updateMany
   */
  export type BlueprintUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Blueprints.
     */
    data: XOR<BlueprintUpdateManyMutationInput, BlueprintUncheckedUpdateManyInput>
    /**
     * Filter which Blueprints to update
     */
    where?: BlueprintWhereInput
    /**
     * Limit how many Blueprints to update.
     */
    limit?: number
  }

  /**
   * Blueprint updateManyAndReturn
   */
  export type BlueprintUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * The data used to update Blueprints.
     */
    data: XOR<BlueprintUpdateManyMutationInput, BlueprintUncheckedUpdateManyInput>
    /**
     * Filter which Blueprints to update
     */
    where?: BlueprintWhereInput
    /**
     * Limit how many Blueprints to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Blueprint upsert
   */
  export type BlueprintUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * The filter to search for the Blueprint to update in case it exists.
     */
    where: BlueprintWhereUniqueInput
    /**
     * In case the Blueprint found by the `where` argument doesn't exist, create a new Blueprint with this data.
     */
    create: XOR<BlueprintCreateInput, BlueprintUncheckedCreateInput>
    /**
     * In case the Blueprint was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlueprintUpdateInput, BlueprintUncheckedUpdateInput>
  }

  /**
   * Blueprint delete
   */
  export type BlueprintDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
    /**
     * Filter which Blueprint to delete.
     */
    where: BlueprintWhereUniqueInput
  }

  /**
   * Blueprint deleteMany
   */
  export type BlueprintDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Blueprints to delete
     */
    where?: BlueprintWhereInput
    /**
     * Limit how many Blueprints to delete.
     */
    limit?: number
  }

  /**
   * Blueprint.scripts
   */
  export type Blueprint$scriptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Script
     */
    select?: ScriptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Script
     */
    omit?: ScriptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptInclude<ExtArgs> | null
    where?: ScriptWhereInput
    orderBy?: ScriptOrderByWithRelationInput | ScriptOrderByWithRelationInput[]
    cursor?: ScriptWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScriptScalarFieldEnum | ScriptScalarFieldEnum[]
  }

  /**
   * Blueprint.scriptDrafts
   */
  export type Blueprint$scriptDraftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    where?: ScriptDraftWhereInput
    orderBy?: ScriptDraftOrderByWithRelationInput | ScriptDraftOrderByWithRelationInput[]
    cursor?: ScriptDraftWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScriptDraftScalarFieldEnum | ScriptDraftScalarFieldEnum[]
  }

  /**
   * Blueprint.histories
   */
  export type Blueprint$historiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    where?: BlueprintHistoryWhereInput
    orderBy?: BlueprintHistoryOrderByWithRelationInput | BlueprintHistoryOrderByWithRelationInput[]
    cursor?: BlueprintHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlueprintHistoryScalarFieldEnum | BlueprintHistoryScalarFieldEnum[]
  }

  /**
   * Blueprint.draftHistories
   */
  export type Blueprint$draftHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    where?: ScriptDraftHistoryWhereInput
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    cursor?: ScriptDraftHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScriptDraftHistoryScalarFieldEnum | ScriptDraftHistoryScalarFieldEnum[]
  }

  /**
   * Blueprint without action
   */
  export type BlueprintDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Blueprint
     */
    select?: BlueprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Blueprint
     */
    omit?: BlueprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintInclude<ExtArgs> | null
  }


  /**
   * Model ScriptDraft
   */

  export type AggregateScriptDraft = {
    _count: ScriptDraftCountAggregateOutputType | null
    _avg: ScriptDraftAvgAggregateOutputType | null
    _sum: ScriptDraftSumAggregateOutputType | null
    _min: ScriptDraftMinAggregateOutputType | null
    _max: ScriptDraftMaxAggregateOutputType | null
  }

  export type ScriptDraftAvgAggregateOutputType = {
    version: number | null
    currentBeatIndex: number | null
  }

  export type ScriptDraftSumAggregateOutputType = {
    version: number | null
    currentBeatIndex: number | null
  }

  export type ScriptDraftMinAggregateOutputType = {
    id: string | null
    blueprintId: string | null
    version: number | null
    status: $Enums.ScriptDraftStatus | null
    currentBeatIndex: number | null
    polishedText: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ScriptDraftMaxAggregateOutputType = {
    id: string | null
    blueprintId: string | null
    version: number | null
    status: $Enums.ScriptDraftStatus | null
    currentBeatIndex: number | null
    polishedText: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ScriptDraftCountAggregateOutputType = {
    id: number
    blueprintId: number
    version: number
    status: number
    currentBeatIndex: number
    beatDrafts: number
    glueIssues: number
    polishedText: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ScriptDraftAvgAggregateInputType = {
    version?: true
    currentBeatIndex?: true
  }

  export type ScriptDraftSumAggregateInputType = {
    version?: true
    currentBeatIndex?: true
  }

  export type ScriptDraftMinAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    status?: true
    currentBeatIndex?: true
    polishedText?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ScriptDraftMaxAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    status?: true
    currentBeatIndex?: true
    polishedText?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ScriptDraftCountAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    status?: true
    currentBeatIndex?: true
    beatDrafts?: true
    glueIssues?: true
    polishedText?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ScriptDraftAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ScriptDraft to aggregate.
     */
    where?: ScriptDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDrafts to fetch.
     */
    orderBy?: ScriptDraftOrderByWithRelationInput | ScriptDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ScriptDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ScriptDrafts
    **/
    _count?: true | ScriptDraftCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ScriptDraftAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ScriptDraftSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ScriptDraftMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ScriptDraftMaxAggregateInputType
  }

  export type GetScriptDraftAggregateType<T extends ScriptDraftAggregateArgs> = {
        [P in keyof T & keyof AggregateScriptDraft]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateScriptDraft[P]>
      : GetScalarType<T[P], AggregateScriptDraft[P]>
  }




  export type ScriptDraftGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptDraftWhereInput
    orderBy?: ScriptDraftOrderByWithAggregationInput | ScriptDraftOrderByWithAggregationInput[]
    by: ScriptDraftScalarFieldEnum[] | ScriptDraftScalarFieldEnum
    having?: ScriptDraftScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ScriptDraftCountAggregateInputType | true
    _avg?: ScriptDraftAvgAggregateInputType
    _sum?: ScriptDraftSumAggregateInputType
    _min?: ScriptDraftMinAggregateInputType
    _max?: ScriptDraftMaxAggregateInputType
  }

  export type ScriptDraftGroupByOutputType = {
    id: string
    blueprintId: string
    version: number
    status: $Enums.ScriptDraftStatus
    currentBeatIndex: number
    beatDrafts: JsonValue
    glueIssues: JsonValue | null
    polishedText: string | null
    createdAt: Date
    updatedAt: Date
    _count: ScriptDraftCountAggregateOutputType | null
    _avg: ScriptDraftAvgAggregateOutputType | null
    _sum: ScriptDraftSumAggregateOutputType | null
    _min: ScriptDraftMinAggregateOutputType | null
    _max: ScriptDraftMaxAggregateOutputType | null
  }

  type GetScriptDraftGroupByPayload<T extends ScriptDraftGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ScriptDraftGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ScriptDraftGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ScriptDraftGroupByOutputType[P]>
            : GetScalarType<T[P], ScriptDraftGroupByOutputType[P]>
        }
      >
    >


  export type ScriptDraftSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    status?: boolean
    currentBeatIndex?: boolean
    beatDrafts?: boolean
    glueIssues?: boolean
    polishedText?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
    histories?: boolean | ScriptDraft$historiesArgs<ExtArgs>
    _count?: boolean | ScriptDraftCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraft"]>

  export type ScriptDraftSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    status?: boolean
    currentBeatIndex?: boolean
    beatDrafts?: boolean
    glueIssues?: boolean
    polishedText?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraft"]>

  export type ScriptDraftSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    status?: boolean
    currentBeatIndex?: boolean
    beatDrafts?: boolean
    glueIssues?: boolean
    polishedText?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraft"]>

  export type ScriptDraftSelectScalar = {
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    status?: boolean
    currentBeatIndex?: boolean
    beatDrafts?: boolean
    glueIssues?: boolean
    polishedText?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ScriptDraftOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "blueprintId" | "version" | "status" | "currentBeatIndex" | "beatDrafts" | "glueIssues" | "polishedText" | "createdAt" | "updatedAt", ExtArgs["result"]["scriptDraft"]>
  export type ScriptDraftInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
    histories?: boolean | ScriptDraft$historiesArgs<ExtArgs>
    _count?: boolean | ScriptDraftCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ScriptDraftIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }
  export type ScriptDraftIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }

  export type $ScriptDraftPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ScriptDraft"
    objects: {
      blueprint: Prisma.$BlueprintPayload<ExtArgs>
      histories: Prisma.$ScriptDraftHistoryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      blueprintId: string
      version: number
      status: $Enums.ScriptDraftStatus
      currentBeatIndex: number
      beatDrafts: Prisma.JsonValue
      glueIssues: Prisma.JsonValue | null
      polishedText: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["scriptDraft"]>
    composites: {}
  }

  type ScriptDraftGetPayload<S extends boolean | null | undefined | ScriptDraftDefaultArgs> = $Result.GetResult<Prisma.$ScriptDraftPayload, S>

  type ScriptDraftCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ScriptDraftFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ScriptDraftCountAggregateInputType | true
    }

  export interface ScriptDraftDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ScriptDraft'], meta: { name: 'ScriptDraft' } }
    /**
     * Find zero or one ScriptDraft that matches the filter.
     * @param {ScriptDraftFindUniqueArgs} args - Arguments to find a ScriptDraft
     * @example
     * // Get one ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ScriptDraftFindUniqueArgs>(args: SelectSubset<T, ScriptDraftFindUniqueArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ScriptDraft that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ScriptDraftFindUniqueOrThrowArgs} args - Arguments to find a ScriptDraft
     * @example
     * // Get one ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ScriptDraftFindUniqueOrThrowArgs>(args: SelectSubset<T, ScriptDraftFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ScriptDraft that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftFindFirstArgs} args - Arguments to find a ScriptDraft
     * @example
     * // Get one ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ScriptDraftFindFirstArgs>(args?: SelectSubset<T, ScriptDraftFindFirstArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ScriptDraft that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftFindFirstOrThrowArgs} args - Arguments to find a ScriptDraft
     * @example
     * // Get one ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ScriptDraftFindFirstOrThrowArgs>(args?: SelectSubset<T, ScriptDraftFindFirstOrThrowArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ScriptDrafts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ScriptDrafts
     * const scriptDrafts = await prisma.scriptDraft.findMany()
     * 
     * // Get first 10 ScriptDrafts
     * const scriptDrafts = await prisma.scriptDraft.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const scriptDraftWithIdOnly = await prisma.scriptDraft.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ScriptDraftFindManyArgs>(args?: SelectSubset<T, ScriptDraftFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ScriptDraft.
     * @param {ScriptDraftCreateArgs} args - Arguments to create a ScriptDraft.
     * @example
     * // Create one ScriptDraft
     * const ScriptDraft = await prisma.scriptDraft.create({
     *   data: {
     *     // ... data to create a ScriptDraft
     *   }
     * })
     * 
     */
    create<T extends ScriptDraftCreateArgs>(args: SelectSubset<T, ScriptDraftCreateArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ScriptDrafts.
     * @param {ScriptDraftCreateManyArgs} args - Arguments to create many ScriptDrafts.
     * @example
     * // Create many ScriptDrafts
     * const scriptDraft = await prisma.scriptDraft.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ScriptDraftCreateManyArgs>(args?: SelectSubset<T, ScriptDraftCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ScriptDrafts and returns the data saved in the database.
     * @param {ScriptDraftCreateManyAndReturnArgs} args - Arguments to create many ScriptDrafts.
     * @example
     * // Create many ScriptDrafts
     * const scriptDraft = await prisma.scriptDraft.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ScriptDrafts and only return the `id`
     * const scriptDraftWithIdOnly = await prisma.scriptDraft.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ScriptDraftCreateManyAndReturnArgs>(args?: SelectSubset<T, ScriptDraftCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ScriptDraft.
     * @param {ScriptDraftDeleteArgs} args - Arguments to delete one ScriptDraft.
     * @example
     * // Delete one ScriptDraft
     * const ScriptDraft = await prisma.scriptDraft.delete({
     *   where: {
     *     // ... filter to delete one ScriptDraft
     *   }
     * })
     * 
     */
    delete<T extends ScriptDraftDeleteArgs>(args: SelectSubset<T, ScriptDraftDeleteArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ScriptDraft.
     * @param {ScriptDraftUpdateArgs} args - Arguments to update one ScriptDraft.
     * @example
     * // Update one ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ScriptDraftUpdateArgs>(args: SelectSubset<T, ScriptDraftUpdateArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ScriptDrafts.
     * @param {ScriptDraftDeleteManyArgs} args - Arguments to filter ScriptDrafts to delete.
     * @example
     * // Delete a few ScriptDrafts
     * const { count } = await prisma.scriptDraft.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ScriptDraftDeleteManyArgs>(args?: SelectSubset<T, ScriptDraftDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ScriptDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ScriptDrafts
     * const scriptDraft = await prisma.scriptDraft.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ScriptDraftUpdateManyArgs>(args: SelectSubset<T, ScriptDraftUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ScriptDrafts and returns the data updated in the database.
     * @param {ScriptDraftUpdateManyAndReturnArgs} args - Arguments to update many ScriptDrafts.
     * @example
     * // Update many ScriptDrafts
     * const scriptDraft = await prisma.scriptDraft.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ScriptDrafts and only return the `id`
     * const scriptDraftWithIdOnly = await prisma.scriptDraft.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ScriptDraftUpdateManyAndReturnArgs>(args: SelectSubset<T, ScriptDraftUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ScriptDraft.
     * @param {ScriptDraftUpsertArgs} args - Arguments to update or create a ScriptDraft.
     * @example
     * // Update or create a ScriptDraft
     * const scriptDraft = await prisma.scriptDraft.upsert({
     *   create: {
     *     // ... data to create a ScriptDraft
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ScriptDraft we want to update
     *   }
     * })
     */
    upsert<T extends ScriptDraftUpsertArgs>(args: SelectSubset<T, ScriptDraftUpsertArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ScriptDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftCountArgs} args - Arguments to filter ScriptDrafts to count.
     * @example
     * // Count the number of ScriptDrafts
     * const count = await prisma.scriptDraft.count({
     *   where: {
     *     // ... the filter for the ScriptDrafts we want to count
     *   }
     * })
    **/
    count<T extends ScriptDraftCountArgs>(
      args?: Subset<T, ScriptDraftCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ScriptDraftCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ScriptDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ScriptDraftAggregateArgs>(args: Subset<T, ScriptDraftAggregateArgs>): Prisma.PrismaPromise<GetScriptDraftAggregateType<T>>

    /**
     * Group by ScriptDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ScriptDraftGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ScriptDraftGroupByArgs['orderBy'] }
        : { orderBy?: ScriptDraftGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ScriptDraftGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetScriptDraftGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ScriptDraft model
   */
  readonly fields: ScriptDraftFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ScriptDraft.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ScriptDraftClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    blueprint<T extends BlueprintDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BlueprintDefaultArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    histories<T extends ScriptDraft$historiesArgs<ExtArgs> = {}>(args?: Subset<T, ScriptDraft$historiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ScriptDraft model
   */
  interface ScriptDraftFieldRefs {
    readonly id: FieldRef<"ScriptDraft", 'String'>
    readonly blueprintId: FieldRef<"ScriptDraft", 'String'>
    readonly version: FieldRef<"ScriptDraft", 'Int'>
    readonly status: FieldRef<"ScriptDraft", 'ScriptDraftStatus'>
    readonly currentBeatIndex: FieldRef<"ScriptDraft", 'Int'>
    readonly beatDrafts: FieldRef<"ScriptDraft", 'Json'>
    readonly glueIssues: FieldRef<"ScriptDraft", 'Json'>
    readonly polishedText: FieldRef<"ScriptDraft", 'String'>
    readonly createdAt: FieldRef<"ScriptDraft", 'DateTime'>
    readonly updatedAt: FieldRef<"ScriptDraft", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ScriptDraft findUnique
   */
  export type ScriptDraftFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraft to fetch.
     */
    where: ScriptDraftWhereUniqueInput
  }

  /**
   * ScriptDraft findUniqueOrThrow
   */
  export type ScriptDraftFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraft to fetch.
     */
    where: ScriptDraftWhereUniqueInput
  }

  /**
   * ScriptDraft findFirst
   */
  export type ScriptDraftFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraft to fetch.
     */
    where?: ScriptDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDrafts to fetch.
     */
    orderBy?: ScriptDraftOrderByWithRelationInput | ScriptDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ScriptDrafts.
     */
    cursor?: ScriptDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ScriptDrafts.
     */
    distinct?: ScriptDraftScalarFieldEnum | ScriptDraftScalarFieldEnum[]
  }

  /**
   * ScriptDraft findFirstOrThrow
   */
  export type ScriptDraftFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraft to fetch.
     */
    where?: ScriptDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDrafts to fetch.
     */
    orderBy?: ScriptDraftOrderByWithRelationInput | ScriptDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ScriptDrafts.
     */
    cursor?: ScriptDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ScriptDrafts.
     */
    distinct?: ScriptDraftScalarFieldEnum | ScriptDraftScalarFieldEnum[]
  }

  /**
   * ScriptDraft findMany
   */
  export type ScriptDraftFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDrafts to fetch.
     */
    where?: ScriptDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDrafts to fetch.
     */
    orderBy?: ScriptDraftOrderByWithRelationInput | ScriptDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ScriptDrafts.
     */
    cursor?: ScriptDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDrafts.
     */
    skip?: number
    distinct?: ScriptDraftScalarFieldEnum | ScriptDraftScalarFieldEnum[]
  }

  /**
   * ScriptDraft create
   */
  export type ScriptDraftCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * The data needed to create a ScriptDraft.
     */
    data: XOR<ScriptDraftCreateInput, ScriptDraftUncheckedCreateInput>
  }

  /**
   * ScriptDraft createMany
   */
  export type ScriptDraftCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ScriptDrafts.
     */
    data: ScriptDraftCreateManyInput | ScriptDraftCreateManyInput[]
  }

  /**
   * ScriptDraft createManyAndReturn
   */
  export type ScriptDraftCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * The data used to create many ScriptDrafts.
     */
    data: ScriptDraftCreateManyInput | ScriptDraftCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ScriptDraft update
   */
  export type ScriptDraftUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * The data needed to update a ScriptDraft.
     */
    data: XOR<ScriptDraftUpdateInput, ScriptDraftUncheckedUpdateInput>
    /**
     * Choose, which ScriptDraft to update.
     */
    where: ScriptDraftWhereUniqueInput
  }

  /**
   * ScriptDraft updateMany
   */
  export type ScriptDraftUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ScriptDrafts.
     */
    data: XOR<ScriptDraftUpdateManyMutationInput, ScriptDraftUncheckedUpdateManyInput>
    /**
     * Filter which ScriptDrafts to update
     */
    where?: ScriptDraftWhereInput
    /**
     * Limit how many ScriptDrafts to update.
     */
    limit?: number
  }

  /**
   * ScriptDraft updateManyAndReturn
   */
  export type ScriptDraftUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * The data used to update ScriptDrafts.
     */
    data: XOR<ScriptDraftUpdateManyMutationInput, ScriptDraftUncheckedUpdateManyInput>
    /**
     * Filter which ScriptDrafts to update
     */
    where?: ScriptDraftWhereInput
    /**
     * Limit how many ScriptDrafts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ScriptDraft upsert
   */
  export type ScriptDraftUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * The filter to search for the ScriptDraft to update in case it exists.
     */
    where: ScriptDraftWhereUniqueInput
    /**
     * In case the ScriptDraft found by the `where` argument doesn't exist, create a new ScriptDraft with this data.
     */
    create: XOR<ScriptDraftCreateInput, ScriptDraftUncheckedCreateInput>
    /**
     * In case the ScriptDraft was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ScriptDraftUpdateInput, ScriptDraftUncheckedUpdateInput>
  }

  /**
   * ScriptDraft delete
   */
  export type ScriptDraftDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
    /**
     * Filter which ScriptDraft to delete.
     */
    where: ScriptDraftWhereUniqueInput
  }

  /**
   * ScriptDraft deleteMany
   */
  export type ScriptDraftDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ScriptDrafts to delete
     */
    where?: ScriptDraftWhereInput
    /**
     * Limit how many ScriptDrafts to delete.
     */
    limit?: number
  }

  /**
   * ScriptDraft.histories
   */
  export type ScriptDraft$historiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    where?: ScriptDraftHistoryWhereInput
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    cursor?: ScriptDraftHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScriptDraftHistoryScalarFieldEnum | ScriptDraftHistoryScalarFieldEnum[]
  }

  /**
   * ScriptDraft without action
   */
  export type ScriptDraftDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraft
     */
    select?: ScriptDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraft
     */
    omit?: ScriptDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftInclude<ExtArgs> | null
  }


  /**
   * Model BlueprintHistory
   */

  export type AggregateBlueprintHistory = {
    _count: BlueprintHistoryCountAggregateOutputType | null
    _avg: BlueprintHistoryAvgAggregateOutputType | null
    _sum: BlueprintHistorySumAggregateOutputType | null
    _min: BlueprintHistoryMinAggregateOutputType | null
    _max: BlueprintHistoryMaxAggregateOutputType | null
  }

  export type BlueprintHistoryAvgAggregateOutputType = {
    version: number | null
  }

  export type BlueprintHistorySumAggregateOutputType = {
    version: number | null
  }

  export type BlueprintHistoryMinAggregateOutputType = {
    id: string | null
    blueprintId: string | null
    version: number | null
    event: string | null
    createdAt: Date | null
  }

  export type BlueprintHistoryMaxAggregateOutputType = {
    id: string | null
    blueprintId: string | null
    version: number | null
    event: string | null
    createdAt: Date | null
  }

  export type BlueprintHistoryCountAggregateOutputType = {
    id: number
    blueprintId: number
    version: number
    event: number
    snapshot: number
    createdAt: number
    _all: number
  }


  export type BlueprintHistoryAvgAggregateInputType = {
    version?: true
  }

  export type BlueprintHistorySumAggregateInputType = {
    version?: true
  }

  export type BlueprintHistoryMinAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    event?: true
    createdAt?: true
  }

  export type BlueprintHistoryMaxAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    event?: true
    createdAt?: true
  }

  export type BlueprintHistoryCountAggregateInputType = {
    id?: true
    blueprintId?: true
    version?: true
    event?: true
    snapshot?: true
    createdAt?: true
    _all?: true
  }

  export type BlueprintHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlueprintHistory to aggregate.
     */
    where?: BlueprintHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlueprintHistories to fetch.
     */
    orderBy?: BlueprintHistoryOrderByWithRelationInput | BlueprintHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlueprintHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlueprintHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlueprintHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BlueprintHistories
    **/
    _count?: true | BlueprintHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BlueprintHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BlueprintHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlueprintHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlueprintHistoryMaxAggregateInputType
  }

  export type GetBlueprintHistoryAggregateType<T extends BlueprintHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateBlueprintHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlueprintHistory[P]>
      : GetScalarType<T[P], AggregateBlueprintHistory[P]>
  }




  export type BlueprintHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlueprintHistoryWhereInput
    orderBy?: BlueprintHistoryOrderByWithAggregationInput | BlueprintHistoryOrderByWithAggregationInput[]
    by: BlueprintHistoryScalarFieldEnum[] | BlueprintHistoryScalarFieldEnum
    having?: BlueprintHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlueprintHistoryCountAggregateInputType | true
    _avg?: BlueprintHistoryAvgAggregateInputType
    _sum?: BlueprintHistorySumAggregateInputType
    _min?: BlueprintHistoryMinAggregateInputType
    _max?: BlueprintHistoryMaxAggregateInputType
  }

  export type BlueprintHistoryGroupByOutputType = {
    id: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonValue
    createdAt: Date
    _count: BlueprintHistoryCountAggregateOutputType | null
    _avg: BlueprintHistoryAvgAggregateOutputType | null
    _sum: BlueprintHistorySumAggregateOutputType | null
    _min: BlueprintHistoryMinAggregateOutputType | null
    _max: BlueprintHistoryMaxAggregateOutputType | null
  }

  type GetBlueprintHistoryGroupByPayload<T extends BlueprintHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlueprintHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlueprintHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlueprintHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], BlueprintHistoryGroupByOutputType[P]>
        }
      >
    >


  export type BlueprintHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprintHistory"]>

  export type BlueprintHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprintHistory"]>

  export type BlueprintHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blueprintHistory"]>

  export type BlueprintHistorySelectScalar = {
    id?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
  }

  export type BlueprintHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "blueprintId" | "version" | "event" | "snapshot" | "createdAt", ExtArgs["result"]["blueprintHistory"]>
  export type BlueprintHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }
  export type BlueprintHistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }
  export type BlueprintHistoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }

  export type $BlueprintHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BlueprintHistory"
    objects: {
      blueprint: Prisma.$BlueprintPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      blueprintId: string
      version: number
      event: string
      snapshot: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["blueprintHistory"]>
    composites: {}
  }

  type BlueprintHistoryGetPayload<S extends boolean | null | undefined | BlueprintHistoryDefaultArgs> = $Result.GetResult<Prisma.$BlueprintHistoryPayload, S>

  type BlueprintHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlueprintHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlueprintHistoryCountAggregateInputType | true
    }

  export interface BlueprintHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BlueprintHistory'], meta: { name: 'BlueprintHistory' } }
    /**
     * Find zero or one BlueprintHistory that matches the filter.
     * @param {BlueprintHistoryFindUniqueArgs} args - Arguments to find a BlueprintHistory
     * @example
     * // Get one BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlueprintHistoryFindUniqueArgs>(args: SelectSubset<T, BlueprintHistoryFindUniqueArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BlueprintHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlueprintHistoryFindUniqueOrThrowArgs} args - Arguments to find a BlueprintHistory
     * @example
     * // Get one BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlueprintHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, BlueprintHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlueprintHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryFindFirstArgs} args - Arguments to find a BlueprintHistory
     * @example
     * // Get one BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlueprintHistoryFindFirstArgs>(args?: SelectSubset<T, BlueprintHistoryFindFirstArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlueprintHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryFindFirstOrThrowArgs} args - Arguments to find a BlueprintHistory
     * @example
     * // Get one BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlueprintHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, BlueprintHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BlueprintHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BlueprintHistories
     * const blueprintHistories = await prisma.blueprintHistory.findMany()
     * 
     * // Get first 10 BlueprintHistories
     * const blueprintHistories = await prisma.blueprintHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blueprintHistoryWithIdOnly = await prisma.blueprintHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlueprintHistoryFindManyArgs>(args?: SelectSubset<T, BlueprintHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BlueprintHistory.
     * @param {BlueprintHistoryCreateArgs} args - Arguments to create a BlueprintHistory.
     * @example
     * // Create one BlueprintHistory
     * const BlueprintHistory = await prisma.blueprintHistory.create({
     *   data: {
     *     // ... data to create a BlueprintHistory
     *   }
     * })
     * 
     */
    create<T extends BlueprintHistoryCreateArgs>(args: SelectSubset<T, BlueprintHistoryCreateArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BlueprintHistories.
     * @param {BlueprintHistoryCreateManyArgs} args - Arguments to create many BlueprintHistories.
     * @example
     * // Create many BlueprintHistories
     * const blueprintHistory = await prisma.blueprintHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlueprintHistoryCreateManyArgs>(args?: SelectSubset<T, BlueprintHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BlueprintHistories and returns the data saved in the database.
     * @param {BlueprintHistoryCreateManyAndReturnArgs} args - Arguments to create many BlueprintHistories.
     * @example
     * // Create many BlueprintHistories
     * const blueprintHistory = await prisma.blueprintHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BlueprintHistories and only return the `id`
     * const blueprintHistoryWithIdOnly = await prisma.blueprintHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BlueprintHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, BlueprintHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BlueprintHistory.
     * @param {BlueprintHistoryDeleteArgs} args - Arguments to delete one BlueprintHistory.
     * @example
     * // Delete one BlueprintHistory
     * const BlueprintHistory = await prisma.blueprintHistory.delete({
     *   where: {
     *     // ... filter to delete one BlueprintHistory
     *   }
     * })
     * 
     */
    delete<T extends BlueprintHistoryDeleteArgs>(args: SelectSubset<T, BlueprintHistoryDeleteArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BlueprintHistory.
     * @param {BlueprintHistoryUpdateArgs} args - Arguments to update one BlueprintHistory.
     * @example
     * // Update one BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlueprintHistoryUpdateArgs>(args: SelectSubset<T, BlueprintHistoryUpdateArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BlueprintHistories.
     * @param {BlueprintHistoryDeleteManyArgs} args - Arguments to filter BlueprintHistories to delete.
     * @example
     * // Delete a few BlueprintHistories
     * const { count } = await prisma.blueprintHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlueprintHistoryDeleteManyArgs>(args?: SelectSubset<T, BlueprintHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlueprintHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BlueprintHistories
     * const blueprintHistory = await prisma.blueprintHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlueprintHistoryUpdateManyArgs>(args: SelectSubset<T, BlueprintHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlueprintHistories and returns the data updated in the database.
     * @param {BlueprintHistoryUpdateManyAndReturnArgs} args - Arguments to update many BlueprintHistories.
     * @example
     * // Update many BlueprintHistories
     * const blueprintHistory = await prisma.blueprintHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BlueprintHistories and only return the `id`
     * const blueprintHistoryWithIdOnly = await prisma.blueprintHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BlueprintHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, BlueprintHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BlueprintHistory.
     * @param {BlueprintHistoryUpsertArgs} args - Arguments to update or create a BlueprintHistory.
     * @example
     * // Update or create a BlueprintHistory
     * const blueprintHistory = await prisma.blueprintHistory.upsert({
     *   create: {
     *     // ... data to create a BlueprintHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BlueprintHistory we want to update
     *   }
     * })
     */
    upsert<T extends BlueprintHistoryUpsertArgs>(args: SelectSubset<T, BlueprintHistoryUpsertArgs<ExtArgs>>): Prisma__BlueprintHistoryClient<$Result.GetResult<Prisma.$BlueprintHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BlueprintHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryCountArgs} args - Arguments to filter BlueprintHistories to count.
     * @example
     * // Count the number of BlueprintHistories
     * const count = await prisma.blueprintHistory.count({
     *   where: {
     *     // ... the filter for the BlueprintHistories we want to count
     *   }
     * })
    **/
    count<T extends BlueprintHistoryCountArgs>(
      args?: Subset<T, BlueprintHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlueprintHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BlueprintHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlueprintHistoryAggregateArgs>(args: Subset<T, BlueprintHistoryAggregateArgs>): Prisma.PrismaPromise<GetBlueprintHistoryAggregateType<T>>

    /**
     * Group by BlueprintHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlueprintHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlueprintHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlueprintHistoryGroupByArgs['orderBy'] }
        : { orderBy?: BlueprintHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlueprintHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlueprintHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BlueprintHistory model
   */
  readonly fields: BlueprintHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BlueprintHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlueprintHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    blueprint<T extends BlueprintDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BlueprintDefaultArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BlueprintHistory model
   */
  interface BlueprintHistoryFieldRefs {
    readonly id: FieldRef<"BlueprintHistory", 'String'>
    readonly blueprintId: FieldRef<"BlueprintHistory", 'String'>
    readonly version: FieldRef<"BlueprintHistory", 'Int'>
    readonly event: FieldRef<"BlueprintHistory", 'String'>
    readonly snapshot: FieldRef<"BlueprintHistory", 'Json'>
    readonly createdAt: FieldRef<"BlueprintHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BlueprintHistory findUnique
   */
  export type BlueprintHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter, which BlueprintHistory to fetch.
     */
    where: BlueprintHistoryWhereUniqueInput
  }

  /**
   * BlueprintHistory findUniqueOrThrow
   */
  export type BlueprintHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter, which BlueprintHistory to fetch.
     */
    where: BlueprintHistoryWhereUniqueInput
  }

  /**
   * BlueprintHistory findFirst
   */
  export type BlueprintHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter, which BlueprintHistory to fetch.
     */
    where?: BlueprintHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlueprintHistories to fetch.
     */
    orderBy?: BlueprintHistoryOrderByWithRelationInput | BlueprintHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlueprintHistories.
     */
    cursor?: BlueprintHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlueprintHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlueprintHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlueprintHistories.
     */
    distinct?: BlueprintHistoryScalarFieldEnum | BlueprintHistoryScalarFieldEnum[]
  }

  /**
   * BlueprintHistory findFirstOrThrow
   */
  export type BlueprintHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter, which BlueprintHistory to fetch.
     */
    where?: BlueprintHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlueprintHistories to fetch.
     */
    orderBy?: BlueprintHistoryOrderByWithRelationInput | BlueprintHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlueprintHistories.
     */
    cursor?: BlueprintHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlueprintHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlueprintHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlueprintHistories.
     */
    distinct?: BlueprintHistoryScalarFieldEnum | BlueprintHistoryScalarFieldEnum[]
  }

  /**
   * BlueprintHistory findMany
   */
  export type BlueprintHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter, which BlueprintHistories to fetch.
     */
    where?: BlueprintHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlueprintHistories to fetch.
     */
    orderBy?: BlueprintHistoryOrderByWithRelationInput | BlueprintHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BlueprintHistories.
     */
    cursor?: BlueprintHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlueprintHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlueprintHistories.
     */
    skip?: number
    distinct?: BlueprintHistoryScalarFieldEnum | BlueprintHistoryScalarFieldEnum[]
  }

  /**
   * BlueprintHistory create
   */
  export type BlueprintHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a BlueprintHistory.
     */
    data: XOR<BlueprintHistoryCreateInput, BlueprintHistoryUncheckedCreateInput>
  }

  /**
   * BlueprintHistory createMany
   */
  export type BlueprintHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BlueprintHistories.
     */
    data: BlueprintHistoryCreateManyInput | BlueprintHistoryCreateManyInput[]
  }

  /**
   * BlueprintHistory createManyAndReturn
   */
  export type BlueprintHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many BlueprintHistories.
     */
    data: BlueprintHistoryCreateManyInput | BlueprintHistoryCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BlueprintHistory update
   */
  export type BlueprintHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a BlueprintHistory.
     */
    data: XOR<BlueprintHistoryUpdateInput, BlueprintHistoryUncheckedUpdateInput>
    /**
     * Choose, which BlueprintHistory to update.
     */
    where: BlueprintHistoryWhereUniqueInput
  }

  /**
   * BlueprintHistory updateMany
   */
  export type BlueprintHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BlueprintHistories.
     */
    data: XOR<BlueprintHistoryUpdateManyMutationInput, BlueprintHistoryUncheckedUpdateManyInput>
    /**
     * Filter which BlueprintHistories to update
     */
    where?: BlueprintHistoryWhereInput
    /**
     * Limit how many BlueprintHistories to update.
     */
    limit?: number
  }

  /**
   * BlueprintHistory updateManyAndReturn
   */
  export type BlueprintHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * The data used to update BlueprintHistories.
     */
    data: XOR<BlueprintHistoryUpdateManyMutationInput, BlueprintHistoryUncheckedUpdateManyInput>
    /**
     * Filter which BlueprintHistories to update
     */
    where?: BlueprintHistoryWhereInput
    /**
     * Limit how many BlueprintHistories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BlueprintHistory upsert
   */
  export type BlueprintHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the BlueprintHistory to update in case it exists.
     */
    where: BlueprintHistoryWhereUniqueInput
    /**
     * In case the BlueprintHistory found by the `where` argument doesn't exist, create a new BlueprintHistory with this data.
     */
    create: XOR<BlueprintHistoryCreateInput, BlueprintHistoryUncheckedCreateInput>
    /**
     * In case the BlueprintHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlueprintHistoryUpdateInput, BlueprintHistoryUncheckedUpdateInput>
  }

  /**
   * BlueprintHistory delete
   */
  export type BlueprintHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
    /**
     * Filter which BlueprintHistory to delete.
     */
    where: BlueprintHistoryWhereUniqueInput
  }

  /**
   * BlueprintHistory deleteMany
   */
  export type BlueprintHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlueprintHistories to delete
     */
    where?: BlueprintHistoryWhereInput
    /**
     * Limit how many BlueprintHistories to delete.
     */
    limit?: number
  }

  /**
   * BlueprintHistory without action
   */
  export type BlueprintHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlueprintHistory
     */
    select?: BlueprintHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlueprintHistory
     */
    omit?: BlueprintHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlueprintHistoryInclude<ExtArgs> | null
  }


  /**
   * Model ScriptDraftHistory
   */

  export type AggregateScriptDraftHistory = {
    _count: ScriptDraftHistoryCountAggregateOutputType | null
    _avg: ScriptDraftHistoryAvgAggregateOutputType | null
    _sum: ScriptDraftHistorySumAggregateOutputType | null
    _min: ScriptDraftHistoryMinAggregateOutputType | null
    _max: ScriptDraftHistoryMaxAggregateOutputType | null
  }

  export type ScriptDraftHistoryAvgAggregateOutputType = {
    version: number | null
  }

  export type ScriptDraftHistorySumAggregateOutputType = {
    version: number | null
  }

  export type ScriptDraftHistoryMinAggregateOutputType = {
    id: string | null
    scriptDraftId: string | null
    blueprintId: string | null
    version: number | null
    event: string | null
    createdAt: Date | null
  }

  export type ScriptDraftHistoryMaxAggregateOutputType = {
    id: string | null
    scriptDraftId: string | null
    blueprintId: string | null
    version: number | null
    event: string | null
    createdAt: Date | null
  }

  export type ScriptDraftHistoryCountAggregateOutputType = {
    id: number
    scriptDraftId: number
    blueprintId: number
    version: number
    event: number
    snapshot: number
    createdAt: number
    _all: number
  }


  export type ScriptDraftHistoryAvgAggregateInputType = {
    version?: true
  }

  export type ScriptDraftHistorySumAggregateInputType = {
    version?: true
  }

  export type ScriptDraftHistoryMinAggregateInputType = {
    id?: true
    scriptDraftId?: true
    blueprintId?: true
    version?: true
    event?: true
    createdAt?: true
  }

  export type ScriptDraftHistoryMaxAggregateInputType = {
    id?: true
    scriptDraftId?: true
    blueprintId?: true
    version?: true
    event?: true
    createdAt?: true
  }

  export type ScriptDraftHistoryCountAggregateInputType = {
    id?: true
    scriptDraftId?: true
    blueprintId?: true
    version?: true
    event?: true
    snapshot?: true
    createdAt?: true
    _all?: true
  }

  export type ScriptDraftHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ScriptDraftHistory to aggregate.
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDraftHistories to fetch.
     */
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ScriptDraftHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDraftHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDraftHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ScriptDraftHistories
    **/
    _count?: true | ScriptDraftHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ScriptDraftHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ScriptDraftHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ScriptDraftHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ScriptDraftHistoryMaxAggregateInputType
  }

  export type GetScriptDraftHistoryAggregateType<T extends ScriptDraftHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateScriptDraftHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateScriptDraftHistory[P]>
      : GetScalarType<T[P], AggregateScriptDraftHistory[P]>
  }




  export type ScriptDraftHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScriptDraftHistoryWhereInput
    orderBy?: ScriptDraftHistoryOrderByWithAggregationInput | ScriptDraftHistoryOrderByWithAggregationInput[]
    by: ScriptDraftHistoryScalarFieldEnum[] | ScriptDraftHistoryScalarFieldEnum
    having?: ScriptDraftHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ScriptDraftHistoryCountAggregateInputType | true
    _avg?: ScriptDraftHistoryAvgAggregateInputType
    _sum?: ScriptDraftHistorySumAggregateInputType
    _min?: ScriptDraftHistoryMinAggregateInputType
    _max?: ScriptDraftHistoryMaxAggregateInputType
  }

  export type ScriptDraftHistoryGroupByOutputType = {
    id: string
    scriptDraftId: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonValue
    createdAt: Date
    _count: ScriptDraftHistoryCountAggregateOutputType | null
    _avg: ScriptDraftHistoryAvgAggregateOutputType | null
    _sum: ScriptDraftHistorySumAggregateOutputType | null
    _min: ScriptDraftHistoryMinAggregateOutputType | null
    _max: ScriptDraftHistoryMaxAggregateOutputType | null
  }

  type GetScriptDraftHistoryGroupByPayload<T extends ScriptDraftHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ScriptDraftHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ScriptDraftHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ScriptDraftHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], ScriptDraftHistoryGroupByOutputType[P]>
        }
      >
    >


  export type ScriptDraftHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    scriptDraftId?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraftHistory"]>

  export type ScriptDraftHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    scriptDraftId?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraftHistory"]>

  export type ScriptDraftHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    scriptDraftId?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["scriptDraftHistory"]>

  export type ScriptDraftHistorySelectScalar = {
    id?: boolean
    scriptDraftId?: boolean
    blueprintId?: boolean
    version?: boolean
    event?: boolean
    snapshot?: boolean
    createdAt?: boolean
  }

  export type ScriptDraftHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "scriptDraftId" | "blueprintId" | "version" | "event" | "snapshot" | "createdAt", ExtArgs["result"]["scriptDraftHistory"]>
  export type ScriptDraftHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }
  export type ScriptDraftHistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }
  export type ScriptDraftHistoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    scriptDraft?: boolean | ScriptDraftDefaultArgs<ExtArgs>
    blueprint?: boolean | BlueprintDefaultArgs<ExtArgs>
  }

  export type $ScriptDraftHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ScriptDraftHistory"
    objects: {
      scriptDraft: Prisma.$ScriptDraftPayload<ExtArgs>
      blueprint: Prisma.$BlueprintPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      scriptDraftId: string
      blueprintId: string
      version: number
      event: string
      snapshot: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["scriptDraftHistory"]>
    composites: {}
  }

  type ScriptDraftHistoryGetPayload<S extends boolean | null | undefined | ScriptDraftHistoryDefaultArgs> = $Result.GetResult<Prisma.$ScriptDraftHistoryPayload, S>

  type ScriptDraftHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ScriptDraftHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ScriptDraftHistoryCountAggregateInputType | true
    }

  export interface ScriptDraftHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ScriptDraftHistory'], meta: { name: 'ScriptDraftHistory' } }
    /**
     * Find zero or one ScriptDraftHistory that matches the filter.
     * @param {ScriptDraftHistoryFindUniqueArgs} args - Arguments to find a ScriptDraftHistory
     * @example
     * // Get one ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ScriptDraftHistoryFindUniqueArgs>(args: SelectSubset<T, ScriptDraftHistoryFindUniqueArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ScriptDraftHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ScriptDraftHistoryFindUniqueOrThrowArgs} args - Arguments to find a ScriptDraftHistory
     * @example
     * // Get one ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ScriptDraftHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, ScriptDraftHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ScriptDraftHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryFindFirstArgs} args - Arguments to find a ScriptDraftHistory
     * @example
     * // Get one ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ScriptDraftHistoryFindFirstArgs>(args?: SelectSubset<T, ScriptDraftHistoryFindFirstArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ScriptDraftHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryFindFirstOrThrowArgs} args - Arguments to find a ScriptDraftHistory
     * @example
     * // Get one ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ScriptDraftHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, ScriptDraftHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ScriptDraftHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ScriptDraftHistories
     * const scriptDraftHistories = await prisma.scriptDraftHistory.findMany()
     * 
     * // Get first 10 ScriptDraftHistories
     * const scriptDraftHistories = await prisma.scriptDraftHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const scriptDraftHistoryWithIdOnly = await prisma.scriptDraftHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ScriptDraftHistoryFindManyArgs>(args?: SelectSubset<T, ScriptDraftHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ScriptDraftHistory.
     * @param {ScriptDraftHistoryCreateArgs} args - Arguments to create a ScriptDraftHistory.
     * @example
     * // Create one ScriptDraftHistory
     * const ScriptDraftHistory = await prisma.scriptDraftHistory.create({
     *   data: {
     *     // ... data to create a ScriptDraftHistory
     *   }
     * })
     * 
     */
    create<T extends ScriptDraftHistoryCreateArgs>(args: SelectSubset<T, ScriptDraftHistoryCreateArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ScriptDraftHistories.
     * @param {ScriptDraftHistoryCreateManyArgs} args - Arguments to create many ScriptDraftHistories.
     * @example
     * // Create many ScriptDraftHistories
     * const scriptDraftHistory = await prisma.scriptDraftHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ScriptDraftHistoryCreateManyArgs>(args?: SelectSubset<T, ScriptDraftHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ScriptDraftHistories and returns the data saved in the database.
     * @param {ScriptDraftHistoryCreateManyAndReturnArgs} args - Arguments to create many ScriptDraftHistories.
     * @example
     * // Create many ScriptDraftHistories
     * const scriptDraftHistory = await prisma.scriptDraftHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ScriptDraftHistories and only return the `id`
     * const scriptDraftHistoryWithIdOnly = await prisma.scriptDraftHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ScriptDraftHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, ScriptDraftHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ScriptDraftHistory.
     * @param {ScriptDraftHistoryDeleteArgs} args - Arguments to delete one ScriptDraftHistory.
     * @example
     * // Delete one ScriptDraftHistory
     * const ScriptDraftHistory = await prisma.scriptDraftHistory.delete({
     *   where: {
     *     // ... filter to delete one ScriptDraftHistory
     *   }
     * })
     * 
     */
    delete<T extends ScriptDraftHistoryDeleteArgs>(args: SelectSubset<T, ScriptDraftHistoryDeleteArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ScriptDraftHistory.
     * @param {ScriptDraftHistoryUpdateArgs} args - Arguments to update one ScriptDraftHistory.
     * @example
     * // Update one ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ScriptDraftHistoryUpdateArgs>(args: SelectSubset<T, ScriptDraftHistoryUpdateArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ScriptDraftHistories.
     * @param {ScriptDraftHistoryDeleteManyArgs} args - Arguments to filter ScriptDraftHistories to delete.
     * @example
     * // Delete a few ScriptDraftHistories
     * const { count } = await prisma.scriptDraftHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ScriptDraftHistoryDeleteManyArgs>(args?: SelectSubset<T, ScriptDraftHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ScriptDraftHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ScriptDraftHistories
     * const scriptDraftHistory = await prisma.scriptDraftHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ScriptDraftHistoryUpdateManyArgs>(args: SelectSubset<T, ScriptDraftHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ScriptDraftHistories and returns the data updated in the database.
     * @param {ScriptDraftHistoryUpdateManyAndReturnArgs} args - Arguments to update many ScriptDraftHistories.
     * @example
     * // Update many ScriptDraftHistories
     * const scriptDraftHistory = await prisma.scriptDraftHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ScriptDraftHistories and only return the `id`
     * const scriptDraftHistoryWithIdOnly = await prisma.scriptDraftHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ScriptDraftHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, ScriptDraftHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ScriptDraftHistory.
     * @param {ScriptDraftHistoryUpsertArgs} args - Arguments to update or create a ScriptDraftHistory.
     * @example
     * // Update or create a ScriptDraftHistory
     * const scriptDraftHistory = await prisma.scriptDraftHistory.upsert({
     *   create: {
     *     // ... data to create a ScriptDraftHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ScriptDraftHistory we want to update
     *   }
     * })
     */
    upsert<T extends ScriptDraftHistoryUpsertArgs>(args: SelectSubset<T, ScriptDraftHistoryUpsertArgs<ExtArgs>>): Prisma__ScriptDraftHistoryClient<$Result.GetResult<Prisma.$ScriptDraftHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ScriptDraftHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryCountArgs} args - Arguments to filter ScriptDraftHistories to count.
     * @example
     * // Count the number of ScriptDraftHistories
     * const count = await prisma.scriptDraftHistory.count({
     *   where: {
     *     // ... the filter for the ScriptDraftHistories we want to count
     *   }
     * })
    **/
    count<T extends ScriptDraftHistoryCountArgs>(
      args?: Subset<T, ScriptDraftHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ScriptDraftHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ScriptDraftHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ScriptDraftHistoryAggregateArgs>(args: Subset<T, ScriptDraftHistoryAggregateArgs>): Prisma.PrismaPromise<GetScriptDraftHistoryAggregateType<T>>

    /**
     * Group by ScriptDraftHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScriptDraftHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ScriptDraftHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ScriptDraftHistoryGroupByArgs['orderBy'] }
        : { orderBy?: ScriptDraftHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ScriptDraftHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetScriptDraftHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ScriptDraftHistory model
   */
  readonly fields: ScriptDraftHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ScriptDraftHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ScriptDraftHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    scriptDraft<T extends ScriptDraftDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ScriptDraftDefaultArgs<ExtArgs>>): Prisma__ScriptDraftClient<$Result.GetResult<Prisma.$ScriptDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    blueprint<T extends BlueprintDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BlueprintDefaultArgs<ExtArgs>>): Prisma__BlueprintClient<$Result.GetResult<Prisma.$BlueprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ScriptDraftHistory model
   */
  interface ScriptDraftHistoryFieldRefs {
    readonly id: FieldRef<"ScriptDraftHistory", 'String'>
    readonly scriptDraftId: FieldRef<"ScriptDraftHistory", 'String'>
    readonly blueprintId: FieldRef<"ScriptDraftHistory", 'String'>
    readonly version: FieldRef<"ScriptDraftHistory", 'Int'>
    readonly event: FieldRef<"ScriptDraftHistory", 'String'>
    readonly snapshot: FieldRef<"ScriptDraftHistory", 'Json'>
    readonly createdAt: FieldRef<"ScriptDraftHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ScriptDraftHistory findUnique
   */
  export type ScriptDraftHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraftHistory to fetch.
     */
    where: ScriptDraftHistoryWhereUniqueInput
  }

  /**
   * ScriptDraftHistory findUniqueOrThrow
   */
  export type ScriptDraftHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraftHistory to fetch.
     */
    where: ScriptDraftHistoryWhereUniqueInput
  }

  /**
   * ScriptDraftHistory findFirst
   */
  export type ScriptDraftHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraftHistory to fetch.
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDraftHistories to fetch.
     */
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ScriptDraftHistories.
     */
    cursor?: ScriptDraftHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDraftHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDraftHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ScriptDraftHistories.
     */
    distinct?: ScriptDraftHistoryScalarFieldEnum | ScriptDraftHistoryScalarFieldEnum[]
  }

  /**
   * ScriptDraftHistory findFirstOrThrow
   */
  export type ScriptDraftHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraftHistory to fetch.
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDraftHistories to fetch.
     */
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ScriptDraftHistories.
     */
    cursor?: ScriptDraftHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDraftHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDraftHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ScriptDraftHistories.
     */
    distinct?: ScriptDraftHistoryScalarFieldEnum | ScriptDraftHistoryScalarFieldEnum[]
  }

  /**
   * ScriptDraftHistory findMany
   */
  export type ScriptDraftHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter, which ScriptDraftHistories to fetch.
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ScriptDraftHistories to fetch.
     */
    orderBy?: ScriptDraftHistoryOrderByWithRelationInput | ScriptDraftHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ScriptDraftHistories.
     */
    cursor?: ScriptDraftHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ScriptDraftHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ScriptDraftHistories.
     */
    skip?: number
    distinct?: ScriptDraftHistoryScalarFieldEnum | ScriptDraftHistoryScalarFieldEnum[]
  }

  /**
   * ScriptDraftHistory create
   */
  export type ScriptDraftHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a ScriptDraftHistory.
     */
    data: XOR<ScriptDraftHistoryCreateInput, ScriptDraftHistoryUncheckedCreateInput>
  }

  /**
   * ScriptDraftHistory createMany
   */
  export type ScriptDraftHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ScriptDraftHistories.
     */
    data: ScriptDraftHistoryCreateManyInput | ScriptDraftHistoryCreateManyInput[]
  }

  /**
   * ScriptDraftHistory createManyAndReturn
   */
  export type ScriptDraftHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many ScriptDraftHistories.
     */
    data: ScriptDraftHistoryCreateManyInput | ScriptDraftHistoryCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ScriptDraftHistory update
   */
  export type ScriptDraftHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a ScriptDraftHistory.
     */
    data: XOR<ScriptDraftHistoryUpdateInput, ScriptDraftHistoryUncheckedUpdateInput>
    /**
     * Choose, which ScriptDraftHistory to update.
     */
    where: ScriptDraftHistoryWhereUniqueInput
  }

  /**
   * ScriptDraftHistory updateMany
   */
  export type ScriptDraftHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ScriptDraftHistories.
     */
    data: XOR<ScriptDraftHistoryUpdateManyMutationInput, ScriptDraftHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ScriptDraftHistories to update
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * Limit how many ScriptDraftHistories to update.
     */
    limit?: number
  }

  /**
   * ScriptDraftHistory updateManyAndReturn
   */
  export type ScriptDraftHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * The data used to update ScriptDraftHistories.
     */
    data: XOR<ScriptDraftHistoryUpdateManyMutationInput, ScriptDraftHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ScriptDraftHistories to update
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * Limit how many ScriptDraftHistories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ScriptDraftHistory upsert
   */
  export type ScriptDraftHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the ScriptDraftHistory to update in case it exists.
     */
    where: ScriptDraftHistoryWhereUniqueInput
    /**
     * In case the ScriptDraftHistory found by the `where` argument doesn't exist, create a new ScriptDraftHistory with this data.
     */
    create: XOR<ScriptDraftHistoryCreateInput, ScriptDraftHistoryUncheckedCreateInput>
    /**
     * In case the ScriptDraftHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ScriptDraftHistoryUpdateInput, ScriptDraftHistoryUncheckedUpdateInput>
  }

  /**
   * ScriptDraftHistory delete
   */
  export type ScriptDraftHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
    /**
     * Filter which ScriptDraftHistory to delete.
     */
    where: ScriptDraftHistoryWhereUniqueInput
  }

  /**
   * ScriptDraftHistory deleteMany
   */
  export type ScriptDraftHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ScriptDraftHistories to delete
     */
    where?: ScriptDraftHistoryWhereInput
    /**
     * Limit how many ScriptDraftHistories to delete.
     */
    limit?: number
  }

  /**
   * ScriptDraftHistory without action
   */
  export type ScriptDraftHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScriptDraftHistory
     */
    select?: ScriptDraftHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScriptDraftHistory
     */
    omit?: ScriptDraftHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScriptDraftHistoryInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProjectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    topic: 'topic',
    status: 'status',
    aspectRatio: 'aspectRatio',
    wizardProgress: 'wizardProgress',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    assetMappings: 'assetMappings'
  };

  export type ProjectScalarFieldEnum = (typeof ProjectScalarFieldEnum)[keyof typeof ProjectScalarFieldEnum]


  export const ProjectSettingsScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    provider: 'provider',
    model: 'model',
    temperature: 'temperature',
    voice: 'voice',
    speakingRate: 'speakingRate',
    pitch: 'pitch',
    defaultQuality: 'defaultQuality',
    defaultAspectRatio: 'defaultAspectRatio',
    musicTrackId: 'musicTrackId',
    musicVolume: 'musicVolume'
  };

  export type ProjectSettingsScalarFieldEnum = (typeof ProjectSettingsScalarFieldEnum)[keyof typeof ProjectSettingsScalarFieldEnum]


  export const ScriptScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    blueprintId: 'blueprintId',
    title: 'title',
    segments: 'segments',
    timestamps: 'timestamps',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ScriptScalarFieldEnum = (typeof ScriptScalarFieldEnum)[keyof typeof ScriptScalarFieldEnum]


  export const AssetScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    type: 'type',
    filename: 'filename',
    path: 'path',
    metadata: 'metadata',
    upscaled: 'upscaled',
    upscaledPath: 'upscaledPath',
    createdAt: 'createdAt'
  };

  export type AssetScalarFieldEnum = (typeof AssetScalarFieldEnum)[keyof typeof AssetScalarFieldEnum]


  export const AppSettingsScalarFieldEnum: {
    id: 'id',
    key: 'key',
    value: 'value',
    updatedAt: 'updatedAt'
  };

  export type AppSettingsScalarFieldEnum = (typeof AppSettingsScalarFieldEnum)[keyof typeof AppSettingsScalarFieldEnum]


  export const RenderScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    quality: 'quality',
    status: 'status',
    progress: 'progress',
    outputPath: 'outputPath',
    error: 'error',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    createdAt: 'createdAt'
  };

  export type RenderScalarFieldEnum = (typeof RenderScalarFieldEnum)[keyof typeof RenderScalarFieldEnum]


  export const AiCallLogScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    provider: 'provider',
    model: 'model',
    operation: 'operation',
    parentId: 'parentId',
    prompt: 'prompt',
    promptTokens: 'promptTokens',
    response: 'response',
    responseTokens: 'responseTokens',
    status: 'status',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    durationMs: 'durationMs',
    errorMessage: 'errorMessage',
    errorCode: 'errorCode',
    retryCount: 'retryCount',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AiCallLogScalarFieldEnum = (typeof AiCallLogScalarFieldEnum)[keyof typeof AiCallLogScalarFieldEnum]


  export const ViewportScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    imageAssetId: 'imageAssetId',
    keyframes: 'keyframes',
    regions: 'regions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ViewportScalarFieldEnum = (typeof ViewportScalarFieldEnum)[keyof typeof ViewportScalarFieldEnum]


  export const BoardScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    index: 'index',
    layout: 'layout',
    regions: 'regions',
    triggers: 'triggers',
    plan: 'plan',
    prompts: 'prompts',
    assetId: 'assetId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BoardScalarFieldEnum = (typeof BoardScalarFieldEnum)[keyof typeof BoardScalarFieldEnum]


  export const BlueprintScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    version: 'version',
    targetDurationMs: 'targetDurationMs',
    status: 'status',
    beats: 'beats',
    rejectionNotes: 'rejectionNotes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BlueprintScalarFieldEnum = (typeof BlueprintScalarFieldEnum)[keyof typeof BlueprintScalarFieldEnum]


  export const ScriptDraftScalarFieldEnum: {
    id: 'id',
    blueprintId: 'blueprintId',
    version: 'version',
    status: 'status',
    currentBeatIndex: 'currentBeatIndex',
    beatDrafts: 'beatDrafts',
    glueIssues: 'glueIssues',
    polishedText: 'polishedText',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ScriptDraftScalarFieldEnum = (typeof ScriptDraftScalarFieldEnum)[keyof typeof ScriptDraftScalarFieldEnum]


  export const BlueprintHistoryScalarFieldEnum: {
    id: 'id',
    blueprintId: 'blueprintId',
    version: 'version',
    event: 'event',
    snapshot: 'snapshot',
    createdAt: 'createdAt'
  };

  export type BlueprintHistoryScalarFieldEnum = (typeof BlueprintHistoryScalarFieldEnum)[keyof typeof BlueprintHistoryScalarFieldEnum]


  export const ScriptDraftHistoryScalarFieldEnum: {
    id: 'id',
    scriptDraftId: 'scriptDraftId',
    blueprintId: 'blueprintId',
    version: 'version',
    event: 'event',
    snapshot: 'snapshot',
    createdAt: 'createdAt'
  };

  export type ScriptDraftHistoryScalarFieldEnum = (typeof ScriptDraftHistoryScalarFieldEnum)[keyof typeof ScriptDraftHistoryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'ProjectStatus'
   */
  export type EnumProjectStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectStatus'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'AssetType'
   */
  export type EnumAssetTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AssetType'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'RenderQuality'
   */
  export type EnumRenderQualityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RenderQuality'>
    


  /**
   * Reference to a field of type 'RenderStatus'
   */
  export type EnumRenderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RenderStatus'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'AiCallStatus'
   */
  export type EnumAiCallStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AiCallStatus'>
    


  /**
   * Reference to a field of type 'BlueprintStatus'
   */
  export type EnumBlueprintStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BlueprintStatus'>
    


  /**
   * Reference to a field of type 'ScriptDraftStatus'
   */
  export type EnumScriptDraftStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ScriptDraftStatus'>
    
  /**
   * Deep Input Types
   */


  export type ProjectWhereInput = {
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    id?: StringFilter<"Project"> | string
    name?: StringFilter<"Project"> | string
    topic?: StringNullableFilter<"Project"> | string | null
    status?: EnumProjectStatusFilter<"Project"> | $Enums.ProjectStatus
    aspectRatio?: StringFilter<"Project"> | string
    wizardProgress?: JsonNullableFilter<"Project">
    createdAt?: DateTimeFilter<"Project"> | Date | string
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    assetMappings?: JsonNullableFilter<"Project">
    settings?: XOR<ProjectSettingsNullableScalarRelationFilter, ProjectSettingsWhereInput> | null
    script?: XOR<ScriptNullableScalarRelationFilter, ScriptWhereInput> | null
    blueprints?: BlueprintListRelationFilter
    assets?: AssetListRelationFilter
    viewport?: XOR<ViewportNullableScalarRelationFilter, ViewportWhereInput> | null
    boards?: BoardListRelationFilter
    renders?: RenderListRelationFilter
    aiCallLogs?: AiCallLogListRelationFilter
  }

  export type ProjectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    topic?: SortOrderInput | SortOrder
    status?: SortOrder
    aspectRatio?: SortOrder
    wizardProgress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    assetMappings?: SortOrderInput | SortOrder
    settings?: ProjectSettingsOrderByWithRelationInput
    script?: ScriptOrderByWithRelationInput
    blueprints?: BlueprintOrderByRelationAggregateInput
    assets?: AssetOrderByRelationAggregateInput
    viewport?: ViewportOrderByWithRelationInput
    boards?: BoardOrderByRelationAggregateInput
    renders?: RenderOrderByRelationAggregateInput
    aiCallLogs?: AiCallLogOrderByRelationAggregateInput
  }

  export type ProjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    name?: StringFilter<"Project"> | string
    topic?: StringNullableFilter<"Project"> | string | null
    status?: EnumProjectStatusFilter<"Project"> | $Enums.ProjectStatus
    aspectRatio?: StringFilter<"Project"> | string
    wizardProgress?: JsonNullableFilter<"Project">
    createdAt?: DateTimeFilter<"Project"> | Date | string
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    assetMappings?: JsonNullableFilter<"Project">
    settings?: XOR<ProjectSettingsNullableScalarRelationFilter, ProjectSettingsWhereInput> | null
    script?: XOR<ScriptNullableScalarRelationFilter, ScriptWhereInput> | null
    blueprints?: BlueprintListRelationFilter
    assets?: AssetListRelationFilter
    viewport?: XOR<ViewportNullableScalarRelationFilter, ViewportWhereInput> | null
    boards?: BoardListRelationFilter
    renders?: RenderListRelationFilter
    aiCallLogs?: AiCallLogListRelationFilter
  }, "id">

  export type ProjectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    topic?: SortOrderInput | SortOrder
    status?: SortOrder
    aspectRatio?: SortOrder
    wizardProgress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    assetMappings?: SortOrderInput | SortOrder
    _count?: ProjectCountOrderByAggregateInput
    _max?: ProjectMaxOrderByAggregateInput
    _min?: ProjectMinOrderByAggregateInput
  }

  export type ProjectScalarWhereWithAggregatesInput = {
    AND?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    OR?: ProjectScalarWhereWithAggregatesInput[]
    NOT?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Project"> | string
    name?: StringWithAggregatesFilter<"Project"> | string
    topic?: StringNullableWithAggregatesFilter<"Project"> | string | null
    status?: EnumProjectStatusWithAggregatesFilter<"Project"> | $Enums.ProjectStatus
    aspectRatio?: StringWithAggregatesFilter<"Project"> | string
    wizardProgress?: JsonNullableWithAggregatesFilter<"Project">
    createdAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    assetMappings?: JsonNullableWithAggregatesFilter<"Project">
  }

  export type ProjectSettingsWhereInput = {
    AND?: ProjectSettingsWhereInput | ProjectSettingsWhereInput[]
    OR?: ProjectSettingsWhereInput[]
    NOT?: ProjectSettingsWhereInput | ProjectSettingsWhereInput[]
    id?: StringFilter<"ProjectSettings"> | string
    projectId?: StringFilter<"ProjectSettings"> | string
    provider?: StringFilter<"ProjectSettings"> | string
    model?: StringFilter<"ProjectSettings"> | string
    temperature?: FloatFilter<"ProjectSettings"> | number
    voice?: StringFilter<"ProjectSettings"> | string
    speakingRate?: FloatFilter<"ProjectSettings"> | number
    pitch?: FloatFilter<"ProjectSettings"> | number
    defaultQuality?: StringFilter<"ProjectSettings"> | string
    defaultAspectRatio?: StringFilter<"ProjectSettings"> | string
    musicTrackId?: StringNullableFilter<"ProjectSettings"> | string | null
    musicVolume?: FloatFilter<"ProjectSettings"> | number
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }

  export type ProjectSettingsOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    temperature?: SortOrder
    voice?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    defaultQuality?: SortOrder
    defaultAspectRatio?: SortOrder
    musicTrackId?: SortOrderInput | SortOrder
    musicVolume?: SortOrder
    project?: ProjectOrderByWithRelationInput
  }

  export type ProjectSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId?: string
    AND?: ProjectSettingsWhereInput | ProjectSettingsWhereInput[]
    OR?: ProjectSettingsWhereInput[]
    NOT?: ProjectSettingsWhereInput | ProjectSettingsWhereInput[]
    provider?: StringFilter<"ProjectSettings"> | string
    model?: StringFilter<"ProjectSettings"> | string
    temperature?: FloatFilter<"ProjectSettings"> | number
    voice?: StringFilter<"ProjectSettings"> | string
    speakingRate?: FloatFilter<"ProjectSettings"> | number
    pitch?: FloatFilter<"ProjectSettings"> | number
    defaultQuality?: StringFilter<"ProjectSettings"> | string
    defaultAspectRatio?: StringFilter<"ProjectSettings"> | string
    musicTrackId?: StringNullableFilter<"ProjectSettings"> | string | null
    musicVolume?: FloatFilter<"ProjectSettings"> | number
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }, "id" | "projectId">

  export type ProjectSettingsOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    temperature?: SortOrder
    voice?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    defaultQuality?: SortOrder
    defaultAspectRatio?: SortOrder
    musicTrackId?: SortOrderInput | SortOrder
    musicVolume?: SortOrder
    _count?: ProjectSettingsCountOrderByAggregateInput
    _avg?: ProjectSettingsAvgOrderByAggregateInput
    _max?: ProjectSettingsMaxOrderByAggregateInput
    _min?: ProjectSettingsMinOrderByAggregateInput
    _sum?: ProjectSettingsSumOrderByAggregateInput
  }

  export type ProjectSettingsScalarWhereWithAggregatesInput = {
    AND?: ProjectSettingsScalarWhereWithAggregatesInput | ProjectSettingsScalarWhereWithAggregatesInput[]
    OR?: ProjectSettingsScalarWhereWithAggregatesInput[]
    NOT?: ProjectSettingsScalarWhereWithAggregatesInput | ProjectSettingsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProjectSettings"> | string
    projectId?: StringWithAggregatesFilter<"ProjectSettings"> | string
    provider?: StringWithAggregatesFilter<"ProjectSettings"> | string
    model?: StringWithAggregatesFilter<"ProjectSettings"> | string
    temperature?: FloatWithAggregatesFilter<"ProjectSettings"> | number
    voice?: StringWithAggregatesFilter<"ProjectSettings"> | string
    speakingRate?: FloatWithAggregatesFilter<"ProjectSettings"> | number
    pitch?: FloatWithAggregatesFilter<"ProjectSettings"> | number
    defaultQuality?: StringWithAggregatesFilter<"ProjectSettings"> | string
    defaultAspectRatio?: StringWithAggregatesFilter<"ProjectSettings"> | string
    musicTrackId?: StringNullableWithAggregatesFilter<"ProjectSettings"> | string | null
    musicVolume?: FloatWithAggregatesFilter<"ProjectSettings"> | number
  }

  export type ScriptWhereInput = {
    AND?: ScriptWhereInput | ScriptWhereInput[]
    OR?: ScriptWhereInput[]
    NOT?: ScriptWhereInput | ScriptWhereInput[]
    id?: StringFilter<"Script"> | string
    projectId?: StringFilter<"Script"> | string
    blueprintId?: StringNullableFilter<"Script"> | string | null
    title?: StringFilter<"Script"> | string
    segments?: JsonFilter<"Script">
    timestamps?: JsonNullableFilter<"Script">
    createdAt?: DateTimeFilter<"Script"> | Date | string
    updatedAt?: DateTimeFilter<"Script"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    blueprint?: XOR<BlueprintNullableScalarRelationFilter, BlueprintWhereInput> | null
  }

  export type ScriptOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    blueprintId?: SortOrderInput | SortOrder
    title?: SortOrder
    segments?: SortOrder
    timestamps?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    blueprint?: BlueprintOrderByWithRelationInput
  }

  export type ScriptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId?: string
    AND?: ScriptWhereInput | ScriptWhereInput[]
    OR?: ScriptWhereInput[]
    NOT?: ScriptWhereInput | ScriptWhereInput[]
    blueprintId?: StringNullableFilter<"Script"> | string | null
    title?: StringFilter<"Script"> | string
    segments?: JsonFilter<"Script">
    timestamps?: JsonNullableFilter<"Script">
    createdAt?: DateTimeFilter<"Script"> | Date | string
    updatedAt?: DateTimeFilter<"Script"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    blueprint?: XOR<BlueprintNullableScalarRelationFilter, BlueprintWhereInput> | null
  }, "id" | "projectId">

  export type ScriptOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    blueprintId?: SortOrderInput | SortOrder
    title?: SortOrder
    segments?: SortOrder
    timestamps?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ScriptCountOrderByAggregateInput
    _max?: ScriptMaxOrderByAggregateInput
    _min?: ScriptMinOrderByAggregateInput
  }

  export type ScriptScalarWhereWithAggregatesInput = {
    AND?: ScriptScalarWhereWithAggregatesInput | ScriptScalarWhereWithAggregatesInput[]
    OR?: ScriptScalarWhereWithAggregatesInput[]
    NOT?: ScriptScalarWhereWithAggregatesInput | ScriptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Script"> | string
    projectId?: StringWithAggregatesFilter<"Script"> | string
    blueprintId?: StringNullableWithAggregatesFilter<"Script"> | string | null
    title?: StringWithAggregatesFilter<"Script"> | string
    segments?: JsonWithAggregatesFilter<"Script">
    timestamps?: JsonNullableWithAggregatesFilter<"Script">
    createdAt?: DateTimeWithAggregatesFilter<"Script"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Script"> | Date | string
  }

  export type AssetWhereInput = {
    AND?: AssetWhereInput | AssetWhereInput[]
    OR?: AssetWhereInput[]
    NOT?: AssetWhereInput | AssetWhereInput[]
    id?: StringFilter<"Asset"> | string
    projectId?: StringFilter<"Asset"> | string
    type?: EnumAssetTypeFilter<"Asset"> | $Enums.AssetType
    filename?: StringFilter<"Asset"> | string
    path?: StringFilter<"Asset"> | string
    metadata?: JsonNullableFilter<"Asset">
    upscaled?: BoolFilter<"Asset"> | boolean
    upscaledPath?: StringNullableFilter<"Asset"> | string | null
    createdAt?: DateTimeFilter<"Asset"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    viewport?: XOR<ViewportNullableScalarRelationFilter, ViewportWhereInput> | null
    boards?: BoardListRelationFilter
  }

  export type AssetOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    type?: SortOrder
    filename?: SortOrder
    path?: SortOrder
    metadata?: SortOrderInput | SortOrder
    upscaled?: SortOrder
    upscaledPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    viewport?: ViewportOrderByWithRelationInput
    boards?: BoardOrderByRelationAggregateInput
  }

  export type AssetWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AssetWhereInput | AssetWhereInput[]
    OR?: AssetWhereInput[]
    NOT?: AssetWhereInput | AssetWhereInput[]
    projectId?: StringFilter<"Asset"> | string
    type?: EnumAssetTypeFilter<"Asset"> | $Enums.AssetType
    filename?: StringFilter<"Asset"> | string
    path?: StringFilter<"Asset"> | string
    metadata?: JsonNullableFilter<"Asset">
    upscaled?: BoolFilter<"Asset"> | boolean
    upscaledPath?: StringNullableFilter<"Asset"> | string | null
    createdAt?: DateTimeFilter<"Asset"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    viewport?: XOR<ViewportNullableScalarRelationFilter, ViewportWhereInput> | null
    boards?: BoardListRelationFilter
  }, "id">

  export type AssetOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    type?: SortOrder
    filename?: SortOrder
    path?: SortOrder
    metadata?: SortOrderInput | SortOrder
    upscaled?: SortOrder
    upscaledPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: AssetCountOrderByAggregateInput
    _max?: AssetMaxOrderByAggregateInput
    _min?: AssetMinOrderByAggregateInput
  }

  export type AssetScalarWhereWithAggregatesInput = {
    AND?: AssetScalarWhereWithAggregatesInput | AssetScalarWhereWithAggregatesInput[]
    OR?: AssetScalarWhereWithAggregatesInput[]
    NOT?: AssetScalarWhereWithAggregatesInput | AssetScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Asset"> | string
    projectId?: StringWithAggregatesFilter<"Asset"> | string
    type?: EnumAssetTypeWithAggregatesFilter<"Asset"> | $Enums.AssetType
    filename?: StringWithAggregatesFilter<"Asset"> | string
    path?: StringWithAggregatesFilter<"Asset"> | string
    metadata?: JsonNullableWithAggregatesFilter<"Asset">
    upscaled?: BoolWithAggregatesFilter<"Asset"> | boolean
    upscaledPath?: StringNullableWithAggregatesFilter<"Asset"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Asset"> | Date | string
  }

  export type AppSettingsWhereInput = {
    AND?: AppSettingsWhereInput | AppSettingsWhereInput[]
    OR?: AppSettingsWhereInput[]
    NOT?: AppSettingsWhereInput | AppSettingsWhereInput[]
    id?: StringFilter<"AppSettings"> | string
    key?: StringFilter<"AppSettings"> | string
    value?: JsonFilter<"AppSettings">
    updatedAt?: DateTimeFilter<"AppSettings"> | Date | string
  }

  export type AppSettingsOrderByWithRelationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    key?: string
    AND?: AppSettingsWhereInput | AppSettingsWhereInput[]
    OR?: AppSettingsWhereInput[]
    NOT?: AppSettingsWhereInput | AppSettingsWhereInput[]
    value?: JsonFilter<"AppSettings">
    updatedAt?: DateTimeFilter<"AppSettings"> | Date | string
  }, "id" | "key">

  export type AppSettingsOrderByWithAggregationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
    _count?: AppSettingsCountOrderByAggregateInput
    _max?: AppSettingsMaxOrderByAggregateInput
    _min?: AppSettingsMinOrderByAggregateInput
  }

  export type AppSettingsScalarWhereWithAggregatesInput = {
    AND?: AppSettingsScalarWhereWithAggregatesInput | AppSettingsScalarWhereWithAggregatesInput[]
    OR?: AppSettingsScalarWhereWithAggregatesInput[]
    NOT?: AppSettingsScalarWhereWithAggregatesInput | AppSettingsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AppSettings"> | string
    key?: StringWithAggregatesFilter<"AppSettings"> | string
    value?: JsonWithAggregatesFilter<"AppSettings">
    updatedAt?: DateTimeWithAggregatesFilter<"AppSettings"> | Date | string
  }

  export type RenderWhereInput = {
    AND?: RenderWhereInput | RenderWhereInput[]
    OR?: RenderWhereInput[]
    NOT?: RenderWhereInput | RenderWhereInput[]
    id?: StringFilter<"Render"> | string
    projectId?: StringFilter<"Render"> | string
    quality?: EnumRenderQualityFilter<"Render"> | $Enums.RenderQuality
    status?: EnumRenderStatusFilter<"Render"> | $Enums.RenderStatus
    progress?: FloatFilter<"Render"> | number
    outputPath?: StringNullableFilter<"Render"> | string | null
    error?: StringNullableFilter<"Render"> | string | null
    startedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    createdAt?: DateTimeFilter<"Render"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }

  export type RenderOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    quality?: SortOrder
    status?: SortOrder
    progress?: SortOrder
    outputPath?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
  }

  export type RenderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RenderWhereInput | RenderWhereInput[]
    OR?: RenderWhereInput[]
    NOT?: RenderWhereInput | RenderWhereInput[]
    projectId?: StringFilter<"Render"> | string
    quality?: EnumRenderQualityFilter<"Render"> | $Enums.RenderQuality
    status?: EnumRenderStatusFilter<"Render"> | $Enums.RenderStatus
    progress?: FloatFilter<"Render"> | number
    outputPath?: StringNullableFilter<"Render"> | string | null
    error?: StringNullableFilter<"Render"> | string | null
    startedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    createdAt?: DateTimeFilter<"Render"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }, "id">

  export type RenderOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    quality?: SortOrder
    status?: SortOrder
    progress?: SortOrder
    outputPath?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: RenderCountOrderByAggregateInput
    _avg?: RenderAvgOrderByAggregateInput
    _max?: RenderMaxOrderByAggregateInput
    _min?: RenderMinOrderByAggregateInput
    _sum?: RenderSumOrderByAggregateInput
  }

  export type RenderScalarWhereWithAggregatesInput = {
    AND?: RenderScalarWhereWithAggregatesInput | RenderScalarWhereWithAggregatesInput[]
    OR?: RenderScalarWhereWithAggregatesInput[]
    NOT?: RenderScalarWhereWithAggregatesInput | RenderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Render"> | string
    projectId?: StringWithAggregatesFilter<"Render"> | string
    quality?: EnumRenderQualityWithAggregatesFilter<"Render"> | $Enums.RenderQuality
    status?: EnumRenderStatusWithAggregatesFilter<"Render"> | $Enums.RenderStatus
    progress?: FloatWithAggregatesFilter<"Render"> | number
    outputPath?: StringNullableWithAggregatesFilter<"Render"> | string | null
    error?: StringNullableWithAggregatesFilter<"Render"> | string | null
    startedAt?: DateTimeNullableWithAggregatesFilter<"Render"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"Render"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Render"> | Date | string
  }

  export type AiCallLogWhereInput = {
    AND?: AiCallLogWhereInput | AiCallLogWhereInput[]
    OR?: AiCallLogWhereInput[]
    NOT?: AiCallLogWhereInput | AiCallLogWhereInput[]
    id?: StringFilter<"AiCallLog"> | string
    projectId?: StringFilter<"AiCallLog"> | string
    provider?: StringFilter<"AiCallLog"> | string
    model?: StringNullableFilter<"AiCallLog"> | string | null
    operation?: StringFilter<"AiCallLog"> | string
    parentId?: StringNullableFilter<"AiCallLog"> | string | null
    prompt?: StringFilter<"AiCallLog"> | string
    promptTokens?: IntNullableFilter<"AiCallLog"> | number | null
    response?: StringNullableFilter<"AiCallLog"> | string | null
    responseTokens?: IntNullableFilter<"AiCallLog"> | number | null
    status?: EnumAiCallStatusFilter<"AiCallLog"> | $Enums.AiCallStatus
    startedAt?: DateTimeFilter<"AiCallLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"AiCallLog"> | Date | string | null
    durationMs?: IntNullableFilter<"AiCallLog"> | number | null
    errorMessage?: StringNullableFilter<"AiCallLog"> | string | null
    errorCode?: StringNullableFilter<"AiCallLog"> | string | null
    retryCount?: IntFilter<"AiCallLog"> | number
    metadata?: JsonNullableFilter<"AiCallLog">
    createdAt?: DateTimeFilter<"AiCallLog"> | Date | string
    updatedAt?: DateTimeFilter<"AiCallLog"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    parent?: XOR<AiCallLogNullableScalarRelationFilter, AiCallLogWhereInput> | null
    children?: AiCallLogListRelationFilter
  }

  export type AiCallLogOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrderInput | SortOrder
    operation?: SortOrder
    parentId?: SortOrderInput | SortOrder
    prompt?: SortOrder
    promptTokens?: SortOrderInput | SortOrder
    response?: SortOrderInput | SortOrder
    responseTokens?: SortOrderInput | SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    parent?: AiCallLogOrderByWithRelationInput
    children?: AiCallLogOrderByRelationAggregateInput
  }

  export type AiCallLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AiCallLogWhereInput | AiCallLogWhereInput[]
    OR?: AiCallLogWhereInput[]
    NOT?: AiCallLogWhereInput | AiCallLogWhereInput[]
    projectId?: StringFilter<"AiCallLog"> | string
    provider?: StringFilter<"AiCallLog"> | string
    model?: StringNullableFilter<"AiCallLog"> | string | null
    operation?: StringFilter<"AiCallLog"> | string
    parentId?: StringNullableFilter<"AiCallLog"> | string | null
    prompt?: StringFilter<"AiCallLog"> | string
    promptTokens?: IntNullableFilter<"AiCallLog"> | number | null
    response?: StringNullableFilter<"AiCallLog"> | string | null
    responseTokens?: IntNullableFilter<"AiCallLog"> | number | null
    status?: EnumAiCallStatusFilter<"AiCallLog"> | $Enums.AiCallStatus
    startedAt?: DateTimeFilter<"AiCallLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"AiCallLog"> | Date | string | null
    durationMs?: IntNullableFilter<"AiCallLog"> | number | null
    errorMessage?: StringNullableFilter<"AiCallLog"> | string | null
    errorCode?: StringNullableFilter<"AiCallLog"> | string | null
    retryCount?: IntFilter<"AiCallLog"> | number
    metadata?: JsonNullableFilter<"AiCallLog">
    createdAt?: DateTimeFilter<"AiCallLog"> | Date | string
    updatedAt?: DateTimeFilter<"AiCallLog"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    parent?: XOR<AiCallLogNullableScalarRelationFilter, AiCallLogWhereInput> | null
    children?: AiCallLogListRelationFilter
  }, "id">

  export type AiCallLogOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrderInput | SortOrder
    operation?: SortOrder
    parentId?: SortOrderInput | SortOrder
    prompt?: SortOrder
    promptTokens?: SortOrderInput | SortOrder
    response?: SortOrderInput | SortOrder
    responseTokens?: SortOrderInput | SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AiCallLogCountOrderByAggregateInput
    _avg?: AiCallLogAvgOrderByAggregateInput
    _max?: AiCallLogMaxOrderByAggregateInput
    _min?: AiCallLogMinOrderByAggregateInput
    _sum?: AiCallLogSumOrderByAggregateInput
  }

  export type AiCallLogScalarWhereWithAggregatesInput = {
    AND?: AiCallLogScalarWhereWithAggregatesInput | AiCallLogScalarWhereWithAggregatesInput[]
    OR?: AiCallLogScalarWhereWithAggregatesInput[]
    NOT?: AiCallLogScalarWhereWithAggregatesInput | AiCallLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AiCallLog"> | string
    projectId?: StringWithAggregatesFilter<"AiCallLog"> | string
    provider?: StringWithAggregatesFilter<"AiCallLog"> | string
    model?: StringNullableWithAggregatesFilter<"AiCallLog"> | string | null
    operation?: StringWithAggregatesFilter<"AiCallLog"> | string
    parentId?: StringNullableWithAggregatesFilter<"AiCallLog"> | string | null
    prompt?: StringWithAggregatesFilter<"AiCallLog"> | string
    promptTokens?: IntNullableWithAggregatesFilter<"AiCallLog"> | number | null
    response?: StringNullableWithAggregatesFilter<"AiCallLog"> | string | null
    responseTokens?: IntNullableWithAggregatesFilter<"AiCallLog"> | number | null
    status?: EnumAiCallStatusWithAggregatesFilter<"AiCallLog"> | $Enums.AiCallStatus
    startedAt?: DateTimeWithAggregatesFilter<"AiCallLog"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"AiCallLog"> | Date | string | null
    durationMs?: IntNullableWithAggregatesFilter<"AiCallLog"> | number | null
    errorMessage?: StringNullableWithAggregatesFilter<"AiCallLog"> | string | null
    errorCode?: StringNullableWithAggregatesFilter<"AiCallLog"> | string | null
    retryCount?: IntWithAggregatesFilter<"AiCallLog"> | number
    metadata?: JsonNullableWithAggregatesFilter<"AiCallLog">
    createdAt?: DateTimeWithAggregatesFilter<"AiCallLog"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AiCallLog"> | Date | string
  }

  export type ViewportWhereInput = {
    AND?: ViewportWhereInput | ViewportWhereInput[]
    OR?: ViewportWhereInput[]
    NOT?: ViewportWhereInput | ViewportWhereInput[]
    id?: StringFilter<"Viewport"> | string
    projectId?: StringFilter<"Viewport"> | string
    imageAssetId?: StringNullableFilter<"Viewport"> | string | null
    keyframes?: JsonFilter<"Viewport">
    regions?: JsonNullableFilter<"Viewport">
    createdAt?: DateTimeFilter<"Viewport"> | Date | string
    updatedAt?: DateTimeFilter<"Viewport"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    imageAsset?: XOR<AssetNullableScalarRelationFilter, AssetWhereInput> | null
  }

  export type ViewportOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    imageAssetId?: SortOrderInput | SortOrder
    keyframes?: SortOrder
    regions?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    imageAsset?: AssetOrderByWithRelationInput
  }

  export type ViewportWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId?: string
    imageAssetId?: string
    AND?: ViewportWhereInput | ViewportWhereInput[]
    OR?: ViewportWhereInput[]
    NOT?: ViewportWhereInput | ViewportWhereInput[]
    keyframes?: JsonFilter<"Viewport">
    regions?: JsonNullableFilter<"Viewport">
    createdAt?: DateTimeFilter<"Viewport"> | Date | string
    updatedAt?: DateTimeFilter<"Viewport"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    imageAsset?: XOR<AssetNullableScalarRelationFilter, AssetWhereInput> | null
  }, "id" | "projectId" | "imageAssetId">

  export type ViewportOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    imageAssetId?: SortOrderInput | SortOrder
    keyframes?: SortOrder
    regions?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ViewportCountOrderByAggregateInput
    _max?: ViewportMaxOrderByAggregateInput
    _min?: ViewportMinOrderByAggregateInput
  }

  export type ViewportScalarWhereWithAggregatesInput = {
    AND?: ViewportScalarWhereWithAggregatesInput | ViewportScalarWhereWithAggregatesInput[]
    OR?: ViewportScalarWhereWithAggregatesInput[]
    NOT?: ViewportScalarWhereWithAggregatesInput | ViewportScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Viewport"> | string
    projectId?: StringWithAggregatesFilter<"Viewport"> | string
    imageAssetId?: StringNullableWithAggregatesFilter<"Viewport"> | string | null
    keyframes?: JsonWithAggregatesFilter<"Viewport">
    regions?: JsonNullableWithAggregatesFilter<"Viewport">
    createdAt?: DateTimeWithAggregatesFilter<"Viewport"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Viewport"> | Date | string
  }

  export type BoardWhereInput = {
    AND?: BoardWhereInput | BoardWhereInput[]
    OR?: BoardWhereInput[]
    NOT?: BoardWhereInput | BoardWhereInput[]
    id?: StringFilter<"Board"> | string
    projectId?: StringFilter<"Board"> | string
    index?: IntFilter<"Board"> | number
    layout?: JsonFilter<"Board">
    regions?: JsonFilter<"Board">
    triggers?: JsonNullableFilter<"Board">
    plan?: JsonNullableFilter<"Board">
    prompts?: JsonNullableFilter<"Board">
    assetId?: StringNullableFilter<"Board"> | string | null
    createdAt?: DateTimeFilter<"Board"> | Date | string
    updatedAt?: DateTimeFilter<"Board"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    asset?: XOR<AssetNullableScalarRelationFilter, AssetWhereInput> | null
  }

  export type BoardOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    index?: SortOrder
    layout?: SortOrder
    regions?: SortOrder
    triggers?: SortOrderInput | SortOrder
    plan?: SortOrderInput | SortOrder
    prompts?: SortOrderInput | SortOrder
    assetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    asset?: AssetOrderByWithRelationInput
  }

  export type BoardWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId_index?: BoardProjectIdIndexCompoundUniqueInput
    AND?: BoardWhereInput | BoardWhereInput[]
    OR?: BoardWhereInput[]
    NOT?: BoardWhereInput | BoardWhereInput[]
    projectId?: StringFilter<"Board"> | string
    index?: IntFilter<"Board"> | number
    layout?: JsonFilter<"Board">
    regions?: JsonFilter<"Board">
    triggers?: JsonNullableFilter<"Board">
    plan?: JsonNullableFilter<"Board">
    prompts?: JsonNullableFilter<"Board">
    assetId?: StringNullableFilter<"Board"> | string | null
    createdAt?: DateTimeFilter<"Board"> | Date | string
    updatedAt?: DateTimeFilter<"Board"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    asset?: XOR<AssetNullableScalarRelationFilter, AssetWhereInput> | null
  }, "id" | "projectId_index">

  export type BoardOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    index?: SortOrder
    layout?: SortOrder
    regions?: SortOrder
    triggers?: SortOrderInput | SortOrder
    plan?: SortOrderInput | SortOrder
    prompts?: SortOrderInput | SortOrder
    assetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BoardCountOrderByAggregateInput
    _avg?: BoardAvgOrderByAggregateInput
    _max?: BoardMaxOrderByAggregateInput
    _min?: BoardMinOrderByAggregateInput
    _sum?: BoardSumOrderByAggregateInput
  }

  export type BoardScalarWhereWithAggregatesInput = {
    AND?: BoardScalarWhereWithAggregatesInput | BoardScalarWhereWithAggregatesInput[]
    OR?: BoardScalarWhereWithAggregatesInput[]
    NOT?: BoardScalarWhereWithAggregatesInput | BoardScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Board"> | string
    projectId?: StringWithAggregatesFilter<"Board"> | string
    index?: IntWithAggregatesFilter<"Board"> | number
    layout?: JsonWithAggregatesFilter<"Board">
    regions?: JsonWithAggregatesFilter<"Board">
    triggers?: JsonNullableWithAggregatesFilter<"Board">
    plan?: JsonNullableWithAggregatesFilter<"Board">
    prompts?: JsonNullableWithAggregatesFilter<"Board">
    assetId?: StringNullableWithAggregatesFilter<"Board"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Board"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Board"> | Date | string
  }

  export type BlueprintWhereInput = {
    AND?: BlueprintWhereInput | BlueprintWhereInput[]
    OR?: BlueprintWhereInput[]
    NOT?: BlueprintWhereInput | BlueprintWhereInput[]
    id?: StringFilter<"Blueprint"> | string
    projectId?: StringFilter<"Blueprint"> | string
    version?: IntFilter<"Blueprint"> | number
    targetDurationMs?: IntFilter<"Blueprint"> | number
    status?: EnumBlueprintStatusFilter<"Blueprint"> | $Enums.BlueprintStatus
    beats?: JsonFilter<"Blueprint">
    rejectionNotes?: StringNullableFilter<"Blueprint"> | string | null
    createdAt?: DateTimeFilter<"Blueprint"> | Date | string
    updatedAt?: DateTimeFilter<"Blueprint"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    scripts?: ScriptListRelationFilter
    scriptDrafts?: ScriptDraftListRelationFilter
    histories?: BlueprintHistoryListRelationFilter
    draftHistories?: ScriptDraftHistoryListRelationFilter
  }

  export type BlueprintOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    targetDurationMs?: SortOrder
    status?: SortOrder
    beats?: SortOrder
    rejectionNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: ProjectOrderByWithRelationInput
    scripts?: ScriptOrderByRelationAggregateInput
    scriptDrafts?: ScriptDraftOrderByRelationAggregateInput
    histories?: BlueprintHistoryOrderByRelationAggregateInput
    draftHistories?: ScriptDraftHistoryOrderByRelationAggregateInput
  }

  export type BlueprintWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BlueprintWhereInput | BlueprintWhereInput[]
    OR?: BlueprintWhereInput[]
    NOT?: BlueprintWhereInput | BlueprintWhereInput[]
    projectId?: StringFilter<"Blueprint"> | string
    version?: IntFilter<"Blueprint"> | number
    targetDurationMs?: IntFilter<"Blueprint"> | number
    status?: EnumBlueprintStatusFilter<"Blueprint"> | $Enums.BlueprintStatus
    beats?: JsonFilter<"Blueprint">
    rejectionNotes?: StringNullableFilter<"Blueprint"> | string | null
    createdAt?: DateTimeFilter<"Blueprint"> | Date | string
    updatedAt?: DateTimeFilter<"Blueprint"> | Date | string
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    scripts?: ScriptListRelationFilter
    scriptDrafts?: ScriptDraftListRelationFilter
    histories?: BlueprintHistoryListRelationFilter
    draftHistories?: ScriptDraftHistoryListRelationFilter
  }, "id">

  export type BlueprintOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    targetDurationMs?: SortOrder
    status?: SortOrder
    beats?: SortOrder
    rejectionNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BlueprintCountOrderByAggregateInput
    _avg?: BlueprintAvgOrderByAggregateInput
    _max?: BlueprintMaxOrderByAggregateInput
    _min?: BlueprintMinOrderByAggregateInput
    _sum?: BlueprintSumOrderByAggregateInput
  }

  export type BlueprintScalarWhereWithAggregatesInput = {
    AND?: BlueprintScalarWhereWithAggregatesInput | BlueprintScalarWhereWithAggregatesInput[]
    OR?: BlueprintScalarWhereWithAggregatesInput[]
    NOT?: BlueprintScalarWhereWithAggregatesInput | BlueprintScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Blueprint"> | string
    projectId?: StringWithAggregatesFilter<"Blueprint"> | string
    version?: IntWithAggregatesFilter<"Blueprint"> | number
    targetDurationMs?: IntWithAggregatesFilter<"Blueprint"> | number
    status?: EnumBlueprintStatusWithAggregatesFilter<"Blueprint"> | $Enums.BlueprintStatus
    beats?: JsonWithAggregatesFilter<"Blueprint">
    rejectionNotes?: StringNullableWithAggregatesFilter<"Blueprint"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Blueprint"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Blueprint"> | Date | string
  }

  export type ScriptDraftWhereInput = {
    AND?: ScriptDraftWhereInput | ScriptDraftWhereInput[]
    OR?: ScriptDraftWhereInput[]
    NOT?: ScriptDraftWhereInput | ScriptDraftWhereInput[]
    id?: StringFilter<"ScriptDraft"> | string
    blueprintId?: StringFilter<"ScriptDraft"> | string
    version?: IntFilter<"ScriptDraft"> | number
    status?: EnumScriptDraftStatusFilter<"ScriptDraft"> | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFilter<"ScriptDraft"> | number
    beatDrafts?: JsonFilter<"ScriptDraft">
    glueIssues?: JsonNullableFilter<"ScriptDraft">
    polishedText?: StringNullableFilter<"ScriptDraft"> | string | null
    createdAt?: DateTimeFilter<"ScriptDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ScriptDraft"> | Date | string
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
    histories?: ScriptDraftHistoryListRelationFilter
  }

  export type ScriptDraftOrderByWithRelationInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    status?: SortOrder
    currentBeatIndex?: SortOrder
    beatDrafts?: SortOrder
    glueIssues?: SortOrderInput | SortOrder
    polishedText?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    blueprint?: BlueprintOrderByWithRelationInput
    histories?: ScriptDraftHistoryOrderByRelationAggregateInput
  }

  export type ScriptDraftWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ScriptDraftWhereInput | ScriptDraftWhereInput[]
    OR?: ScriptDraftWhereInput[]
    NOT?: ScriptDraftWhereInput | ScriptDraftWhereInput[]
    blueprintId?: StringFilter<"ScriptDraft"> | string
    version?: IntFilter<"ScriptDraft"> | number
    status?: EnumScriptDraftStatusFilter<"ScriptDraft"> | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFilter<"ScriptDraft"> | number
    beatDrafts?: JsonFilter<"ScriptDraft">
    glueIssues?: JsonNullableFilter<"ScriptDraft">
    polishedText?: StringNullableFilter<"ScriptDraft"> | string | null
    createdAt?: DateTimeFilter<"ScriptDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ScriptDraft"> | Date | string
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
    histories?: ScriptDraftHistoryListRelationFilter
  }, "id">

  export type ScriptDraftOrderByWithAggregationInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    status?: SortOrder
    currentBeatIndex?: SortOrder
    beatDrafts?: SortOrder
    glueIssues?: SortOrderInput | SortOrder
    polishedText?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ScriptDraftCountOrderByAggregateInput
    _avg?: ScriptDraftAvgOrderByAggregateInput
    _max?: ScriptDraftMaxOrderByAggregateInput
    _min?: ScriptDraftMinOrderByAggregateInput
    _sum?: ScriptDraftSumOrderByAggregateInput
  }

  export type ScriptDraftScalarWhereWithAggregatesInput = {
    AND?: ScriptDraftScalarWhereWithAggregatesInput | ScriptDraftScalarWhereWithAggregatesInput[]
    OR?: ScriptDraftScalarWhereWithAggregatesInput[]
    NOT?: ScriptDraftScalarWhereWithAggregatesInput | ScriptDraftScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ScriptDraft"> | string
    blueprintId?: StringWithAggregatesFilter<"ScriptDraft"> | string
    version?: IntWithAggregatesFilter<"ScriptDraft"> | number
    status?: EnumScriptDraftStatusWithAggregatesFilter<"ScriptDraft"> | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntWithAggregatesFilter<"ScriptDraft"> | number
    beatDrafts?: JsonWithAggregatesFilter<"ScriptDraft">
    glueIssues?: JsonNullableWithAggregatesFilter<"ScriptDraft">
    polishedText?: StringNullableWithAggregatesFilter<"ScriptDraft"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ScriptDraft"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ScriptDraft"> | Date | string
  }

  export type BlueprintHistoryWhereInput = {
    AND?: BlueprintHistoryWhereInput | BlueprintHistoryWhereInput[]
    OR?: BlueprintHistoryWhereInput[]
    NOT?: BlueprintHistoryWhereInput | BlueprintHistoryWhereInput[]
    id?: StringFilter<"BlueprintHistory"> | string
    blueprintId?: StringFilter<"BlueprintHistory"> | string
    version?: IntFilter<"BlueprintHistory"> | number
    event?: StringFilter<"BlueprintHistory"> | string
    snapshot?: JsonFilter<"BlueprintHistory">
    createdAt?: DateTimeFilter<"BlueprintHistory"> | Date | string
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
  }

  export type BlueprintHistoryOrderByWithRelationInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
    blueprint?: BlueprintOrderByWithRelationInput
  }

  export type BlueprintHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BlueprintHistoryWhereInput | BlueprintHistoryWhereInput[]
    OR?: BlueprintHistoryWhereInput[]
    NOT?: BlueprintHistoryWhereInput | BlueprintHistoryWhereInput[]
    blueprintId?: StringFilter<"BlueprintHistory"> | string
    version?: IntFilter<"BlueprintHistory"> | number
    event?: StringFilter<"BlueprintHistory"> | string
    snapshot?: JsonFilter<"BlueprintHistory">
    createdAt?: DateTimeFilter<"BlueprintHistory"> | Date | string
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
  }, "id">

  export type BlueprintHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
    _count?: BlueprintHistoryCountOrderByAggregateInput
    _avg?: BlueprintHistoryAvgOrderByAggregateInput
    _max?: BlueprintHistoryMaxOrderByAggregateInput
    _min?: BlueprintHistoryMinOrderByAggregateInput
    _sum?: BlueprintHistorySumOrderByAggregateInput
  }

  export type BlueprintHistoryScalarWhereWithAggregatesInput = {
    AND?: BlueprintHistoryScalarWhereWithAggregatesInput | BlueprintHistoryScalarWhereWithAggregatesInput[]
    OR?: BlueprintHistoryScalarWhereWithAggregatesInput[]
    NOT?: BlueprintHistoryScalarWhereWithAggregatesInput | BlueprintHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BlueprintHistory"> | string
    blueprintId?: StringWithAggregatesFilter<"BlueprintHistory"> | string
    version?: IntWithAggregatesFilter<"BlueprintHistory"> | number
    event?: StringWithAggregatesFilter<"BlueprintHistory"> | string
    snapshot?: JsonWithAggregatesFilter<"BlueprintHistory">
    createdAt?: DateTimeWithAggregatesFilter<"BlueprintHistory"> | Date | string
  }

  export type ScriptDraftHistoryWhereInput = {
    AND?: ScriptDraftHistoryWhereInput | ScriptDraftHistoryWhereInput[]
    OR?: ScriptDraftHistoryWhereInput[]
    NOT?: ScriptDraftHistoryWhereInput | ScriptDraftHistoryWhereInput[]
    id?: StringFilter<"ScriptDraftHistory"> | string
    scriptDraftId?: StringFilter<"ScriptDraftHistory"> | string
    blueprintId?: StringFilter<"ScriptDraftHistory"> | string
    version?: IntFilter<"ScriptDraftHistory"> | number
    event?: StringFilter<"ScriptDraftHistory"> | string
    snapshot?: JsonFilter<"ScriptDraftHistory">
    createdAt?: DateTimeFilter<"ScriptDraftHistory"> | Date | string
    scriptDraft?: XOR<ScriptDraftScalarRelationFilter, ScriptDraftWhereInput>
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
  }

  export type ScriptDraftHistoryOrderByWithRelationInput = {
    id?: SortOrder
    scriptDraftId?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
    scriptDraft?: ScriptDraftOrderByWithRelationInput
    blueprint?: BlueprintOrderByWithRelationInput
  }

  export type ScriptDraftHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ScriptDraftHistoryWhereInput | ScriptDraftHistoryWhereInput[]
    OR?: ScriptDraftHistoryWhereInput[]
    NOT?: ScriptDraftHistoryWhereInput | ScriptDraftHistoryWhereInput[]
    scriptDraftId?: StringFilter<"ScriptDraftHistory"> | string
    blueprintId?: StringFilter<"ScriptDraftHistory"> | string
    version?: IntFilter<"ScriptDraftHistory"> | number
    event?: StringFilter<"ScriptDraftHistory"> | string
    snapshot?: JsonFilter<"ScriptDraftHistory">
    createdAt?: DateTimeFilter<"ScriptDraftHistory"> | Date | string
    scriptDraft?: XOR<ScriptDraftScalarRelationFilter, ScriptDraftWhereInput>
    blueprint?: XOR<BlueprintScalarRelationFilter, BlueprintWhereInput>
  }, "id">

  export type ScriptDraftHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    scriptDraftId?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
    _count?: ScriptDraftHistoryCountOrderByAggregateInput
    _avg?: ScriptDraftHistoryAvgOrderByAggregateInput
    _max?: ScriptDraftHistoryMaxOrderByAggregateInput
    _min?: ScriptDraftHistoryMinOrderByAggregateInput
    _sum?: ScriptDraftHistorySumOrderByAggregateInput
  }

  export type ScriptDraftHistoryScalarWhereWithAggregatesInput = {
    AND?: ScriptDraftHistoryScalarWhereWithAggregatesInput | ScriptDraftHistoryScalarWhereWithAggregatesInput[]
    OR?: ScriptDraftHistoryScalarWhereWithAggregatesInput[]
    NOT?: ScriptDraftHistoryScalarWhereWithAggregatesInput | ScriptDraftHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ScriptDraftHistory"> | string
    scriptDraftId?: StringWithAggregatesFilter<"ScriptDraftHistory"> | string
    blueprintId?: StringWithAggregatesFilter<"ScriptDraftHistory"> | string
    version?: IntWithAggregatesFilter<"ScriptDraftHistory"> | number
    event?: StringWithAggregatesFilter<"ScriptDraftHistory"> | string
    snapshot?: JsonWithAggregatesFilter<"ScriptDraftHistory">
    createdAt?: DateTimeWithAggregatesFilter<"ScriptDraftHistory"> | Date | string
  }

  export type ProjectCreateInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectCreateManyInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
  }

  export type ProjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
  }

  export type ProjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
  }

  export type ProjectSettingsCreateInput = {
    id?: string
    provider?: string
    model?: string
    temperature?: number
    voice?: string
    speakingRate?: number
    pitch?: number
    defaultQuality?: string
    defaultAspectRatio?: string
    musicTrackId?: string | null
    musicVolume?: number
    project: ProjectCreateNestedOneWithoutSettingsInput
  }

  export type ProjectSettingsUncheckedCreateInput = {
    id?: string
    projectId: string
    provider?: string
    model?: string
    temperature?: number
    voice?: string
    speakingRate?: number
    pitch?: number
    defaultQuality?: string
    defaultAspectRatio?: string
    musicTrackId?: string | null
    musicVolume?: number
  }

  export type ProjectSettingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
    project?: ProjectUpdateOneRequiredWithoutSettingsNestedInput
  }

  export type ProjectSettingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
  }

  export type ProjectSettingsCreateManyInput = {
    id?: string
    projectId: string
    provider?: string
    model?: string
    temperature?: number
    voice?: string
    speakingRate?: number
    pitch?: number
    defaultQuality?: string
    defaultAspectRatio?: string
    musicTrackId?: string | null
    musicVolume?: number
  }

  export type ProjectSettingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
  }

  export type ProjectSettingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
  }

  export type ScriptCreateInput = {
    id?: string
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutScriptInput
    blueprint?: BlueprintCreateNestedOneWithoutScriptsInput
  }

  export type ScriptUncheckedCreateInput = {
    id?: string
    projectId: string
    blueprintId?: string | null
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutScriptNestedInput
    blueprint?: BlueprintUpdateOneWithoutScriptsNestedInput
  }

  export type ScriptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    blueprintId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptCreateManyInput = {
    id?: string
    projectId: string
    blueprintId?: string | null
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    blueprintId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetCreateInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    project: ProjectCreateNestedOneWithoutAssetsInput
    viewport?: ViewportCreateNestedOneWithoutImageAssetInput
    boards?: BoardCreateNestedManyWithoutAssetInput
  }

  export type AssetUncheckedCreateInput = {
    id?: string
    projectId: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    viewport?: ViewportUncheckedCreateNestedOneWithoutImageAssetInput
    boards?: BoardUncheckedCreateNestedManyWithoutAssetInput
  }

  export type AssetUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAssetsNestedInput
    viewport?: ViewportUpdateOneWithoutImageAssetNestedInput
    boards?: BoardUpdateManyWithoutAssetNestedInput
  }

  export type AssetUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    viewport?: ViewportUncheckedUpdateOneWithoutImageAssetNestedInput
    boards?: BoardUncheckedUpdateManyWithoutAssetNestedInput
  }

  export type AssetCreateManyInput = {
    id?: string
    projectId: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
  }

  export type AssetUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingsCreateInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type AppSettingsUncheckedCreateInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type AppSettingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingsCreateManyInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type AppSettingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderCreateInput = {
    id?: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
    project: ProjectCreateNestedOneWithoutRendersInput
  }

  export type RenderUncheckedCreateInput = {
    id?: string
    projectId: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RenderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutRendersNestedInput
  }

  export type RenderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderCreateManyInput = {
    id?: string
    projectId: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RenderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiCallLogCreateInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutAiCallLogsInput
    parent?: AiCallLogCreateNestedOneWithoutChildrenInput
    children?: AiCallLogCreateNestedManyWithoutParentInput
  }

  export type AiCallLogUncheckedCreateInput = {
    id?: string
    projectId: string
    provider: string
    model?: string | null
    operation: string
    parentId?: string | null
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: AiCallLogUncheckedCreateNestedManyWithoutParentInput
  }

  export type AiCallLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAiCallLogsNestedInput
    parent?: AiCallLogUpdateOneWithoutChildrenNestedInput
    children?: AiCallLogUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: AiCallLogUncheckedUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogCreateManyInput = {
    id?: string
    projectId: string
    provider: string
    model?: string | null
    operation: string
    parentId?: string | null
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AiCallLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiCallLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ViewportCreateInput = {
    id?: string
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutViewportInput
    imageAsset?: AssetCreateNestedOneWithoutViewportInput
  }

  export type ViewportUncheckedCreateInput = {
    id?: string
    projectId: string
    imageAssetId?: string | null
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ViewportUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutViewportNestedInput
    imageAsset?: AssetUpdateOneWithoutViewportNestedInput
  }

  export type ViewportUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    imageAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ViewportCreateManyInput = {
    id?: string
    projectId: string
    imageAssetId?: string | null
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ViewportUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ViewportUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    imageAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardCreateInput = {
    id?: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBoardsInput
    asset?: AssetCreateNestedOneWithoutBoardsInput
  }

  export type BoardUncheckedCreateInput = {
    id?: string
    projectId: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BoardUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBoardsNestedInput
    asset?: AssetUpdateOneWithoutBoardsNestedInput
  }

  export type BoardUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardCreateManyInput = {
    id?: string
    projectId: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BoardUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintCreateInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBlueprintsInput
    scripts?: ScriptCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptUncheckedCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBlueprintsNestedInput
    scripts?: ScriptUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUncheckedUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintCreateManyInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlueprintUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftCreateInput = {
    id?: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    blueprint: BlueprintCreateNestedOneWithoutScriptDraftsInput
    histories?: ScriptDraftHistoryCreateNestedManyWithoutScriptDraftInput
  }

  export type ScriptDraftUncheckedCreateInput = {
    id?: string
    blueprintId: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    histories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutScriptDraftInput
  }

  export type ScriptDraftUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blueprint?: BlueprintUpdateOneRequiredWithoutScriptDraftsNestedInput
    histories?: ScriptDraftHistoryUpdateManyWithoutScriptDraftNestedInput
  }

  export type ScriptDraftUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    histories?: ScriptDraftHistoryUncheckedUpdateManyWithoutScriptDraftNestedInput
  }

  export type ScriptDraftCreateManyInput = {
    id?: string
    blueprintId: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptDraftUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryCreateInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    blueprint: BlueprintCreateNestedOneWithoutHistoriesInput
  }

  export type BlueprintHistoryUncheckedCreateInput = {
    id?: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type BlueprintHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blueprint?: BlueprintUpdateOneRequiredWithoutHistoriesNestedInput
  }

  export type BlueprintHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryCreateManyInput = {
    id?: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type BlueprintHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryCreateInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    scriptDraft: ScriptDraftCreateNestedOneWithoutHistoriesInput
    blueprint: BlueprintCreateNestedOneWithoutDraftHistoriesInput
  }

  export type ScriptDraftHistoryUncheckedCreateInput = {
    id?: string
    scriptDraftId: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scriptDraft?: ScriptDraftUpdateOneRequiredWithoutHistoriesNestedInput
    blueprint?: BlueprintUpdateOneRequiredWithoutDraftHistoriesNestedInput
  }

  export type ScriptDraftHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    scriptDraftId?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryCreateManyInput = {
    id?: string
    scriptDraftId: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    scriptDraftId?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumProjectStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectStatus | EnumProjectStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectStatus[]
    notIn?: $Enums.ProjectStatus[]
    not?: NestedEnumProjectStatusFilter<$PrismaModel> | $Enums.ProjectStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ProjectSettingsNullableScalarRelationFilter = {
    is?: ProjectSettingsWhereInput | null
    isNot?: ProjectSettingsWhereInput | null
  }

  export type ScriptNullableScalarRelationFilter = {
    is?: ScriptWhereInput | null
    isNot?: ScriptWhereInput | null
  }

  export type BlueprintListRelationFilter = {
    every?: BlueprintWhereInput
    some?: BlueprintWhereInput
    none?: BlueprintWhereInput
  }

  export type AssetListRelationFilter = {
    every?: AssetWhereInput
    some?: AssetWhereInput
    none?: AssetWhereInput
  }

  export type ViewportNullableScalarRelationFilter = {
    is?: ViewportWhereInput | null
    isNot?: ViewportWhereInput | null
  }

  export type BoardListRelationFilter = {
    every?: BoardWhereInput
    some?: BoardWhereInput
    none?: BoardWhereInput
  }

  export type RenderListRelationFilter = {
    every?: RenderWhereInput
    some?: RenderWhereInput
    none?: RenderWhereInput
  }

  export type AiCallLogListRelationFilter = {
    every?: AiCallLogWhereInput
    some?: AiCallLogWhereInput
    none?: AiCallLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type BlueprintOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AssetOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BoardOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RenderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AiCallLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProjectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    aspectRatio?: SortOrder
    wizardProgress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    assetMappings?: SortOrder
  }

  export type ProjectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    aspectRatio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProjectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    aspectRatio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumProjectStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectStatus | EnumProjectStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectStatus[]
    notIn?: $Enums.ProjectStatus[]
    not?: NestedEnumProjectStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProjectStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProjectStatusFilter<$PrismaModel>
    _max?: NestedEnumProjectStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type ProjectScalarRelationFilter = {
    is?: ProjectWhereInput
    isNot?: ProjectWhereInput
  }

  export type ProjectSettingsCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    temperature?: SortOrder
    voice?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    defaultQuality?: SortOrder
    defaultAspectRatio?: SortOrder
    musicTrackId?: SortOrder
    musicVolume?: SortOrder
  }

  export type ProjectSettingsAvgOrderByAggregateInput = {
    temperature?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    musicVolume?: SortOrder
  }

  export type ProjectSettingsMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    temperature?: SortOrder
    voice?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    defaultQuality?: SortOrder
    defaultAspectRatio?: SortOrder
    musicTrackId?: SortOrder
    musicVolume?: SortOrder
  }

  export type ProjectSettingsMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    temperature?: SortOrder
    voice?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    defaultQuality?: SortOrder
    defaultAspectRatio?: SortOrder
    musicTrackId?: SortOrder
    musicVolume?: SortOrder
  }

  export type ProjectSettingsSumOrderByAggregateInput = {
    temperature?: SortOrder
    speakingRate?: SortOrder
    pitch?: SortOrder
    musicVolume?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BlueprintNullableScalarRelationFilter = {
    is?: BlueprintWhereInput | null
    isNot?: BlueprintWhereInput | null
  }

  export type ScriptCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    blueprintId?: SortOrder
    title?: SortOrder
    segments?: SortOrder
    timestamps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ScriptMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    blueprintId?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ScriptMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    blueprintId?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumAssetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AssetType | EnumAssetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AssetType[]
    notIn?: $Enums.AssetType[]
    not?: NestedEnumAssetTypeFilter<$PrismaModel> | $Enums.AssetType
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type AssetCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    type?: SortOrder
    filename?: SortOrder
    path?: SortOrder
    metadata?: SortOrder
    upscaled?: SortOrder
    upscaledPath?: SortOrder
    createdAt?: SortOrder
  }

  export type AssetMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    type?: SortOrder
    filename?: SortOrder
    path?: SortOrder
    upscaled?: SortOrder
    upscaledPath?: SortOrder
    createdAt?: SortOrder
  }

  export type AssetMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    type?: SortOrder
    filename?: SortOrder
    path?: SortOrder
    upscaled?: SortOrder
    upscaledPath?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumAssetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AssetType | EnumAssetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AssetType[]
    notIn?: $Enums.AssetType[]
    not?: NestedEnumAssetTypeWithAggregatesFilter<$PrismaModel> | $Enums.AssetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAssetTypeFilter<$PrismaModel>
    _max?: NestedEnumAssetTypeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type AppSettingsCountOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingsMaxOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingsMinOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumRenderQualityFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderQuality | EnumRenderQualityFieldRefInput<$PrismaModel>
    in?: $Enums.RenderQuality[]
    notIn?: $Enums.RenderQuality[]
    not?: NestedEnumRenderQualityFilter<$PrismaModel> | $Enums.RenderQuality
  }

  export type EnumRenderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderStatus | EnumRenderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RenderStatus[]
    notIn?: $Enums.RenderStatus[]
    not?: NestedEnumRenderStatusFilter<$PrismaModel> | $Enums.RenderStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type RenderCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    quality?: SortOrder
    status?: SortOrder
    progress?: SortOrder
    outputPath?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RenderAvgOrderByAggregateInput = {
    progress?: SortOrder
  }

  export type RenderMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    quality?: SortOrder
    status?: SortOrder
    progress?: SortOrder
    outputPath?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RenderMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    quality?: SortOrder
    status?: SortOrder
    progress?: SortOrder
    outputPath?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RenderSumOrderByAggregateInput = {
    progress?: SortOrder
  }

  export type EnumRenderQualityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderQuality | EnumRenderQualityFieldRefInput<$PrismaModel>
    in?: $Enums.RenderQuality[]
    notIn?: $Enums.RenderQuality[]
    not?: NestedEnumRenderQualityWithAggregatesFilter<$PrismaModel> | $Enums.RenderQuality
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRenderQualityFilter<$PrismaModel>
    _max?: NestedEnumRenderQualityFilter<$PrismaModel>
  }

  export type EnumRenderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderStatus | EnumRenderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RenderStatus[]
    notIn?: $Enums.RenderStatus[]
    not?: NestedEnumRenderStatusWithAggregatesFilter<$PrismaModel> | $Enums.RenderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRenderStatusFilter<$PrismaModel>
    _max?: NestedEnumRenderStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumAiCallStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AiCallStatus | EnumAiCallStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AiCallStatus[]
    notIn?: $Enums.AiCallStatus[]
    not?: NestedEnumAiCallStatusFilter<$PrismaModel> | $Enums.AiCallStatus
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type AiCallLogNullableScalarRelationFilter = {
    is?: AiCallLogWhereInput | null
    isNot?: AiCallLogWhereInput | null
  }

  export type AiCallLogCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    operation?: SortOrder
    parentId?: SortOrder
    prompt?: SortOrder
    promptTokens?: SortOrder
    response?: SortOrder
    responseTokens?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    retryCount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AiCallLogAvgOrderByAggregateInput = {
    promptTokens?: SortOrder
    responseTokens?: SortOrder
    durationMs?: SortOrder
    retryCount?: SortOrder
  }

  export type AiCallLogMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    operation?: SortOrder
    parentId?: SortOrder
    prompt?: SortOrder
    promptTokens?: SortOrder
    response?: SortOrder
    responseTokens?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AiCallLogMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    operation?: SortOrder
    parentId?: SortOrder
    prompt?: SortOrder
    promptTokens?: SortOrder
    response?: SortOrder
    responseTokens?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AiCallLogSumOrderByAggregateInput = {
    promptTokens?: SortOrder
    responseTokens?: SortOrder
    durationMs?: SortOrder
    retryCount?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumAiCallStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AiCallStatus | EnumAiCallStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AiCallStatus[]
    notIn?: $Enums.AiCallStatus[]
    not?: NestedEnumAiCallStatusWithAggregatesFilter<$PrismaModel> | $Enums.AiCallStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAiCallStatusFilter<$PrismaModel>
    _max?: NestedEnumAiCallStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type AssetNullableScalarRelationFilter = {
    is?: AssetWhereInput | null
    isNot?: AssetWhereInput | null
  }

  export type ViewportCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    imageAssetId?: SortOrder
    keyframes?: SortOrder
    regions?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ViewportMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    imageAssetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ViewportMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    imageAssetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoardProjectIdIndexCompoundUniqueInput = {
    projectId: string
    index: number
  }

  export type BoardCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    index?: SortOrder
    layout?: SortOrder
    regions?: SortOrder
    triggers?: SortOrder
    plan?: SortOrder
    prompts?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoardAvgOrderByAggregateInput = {
    index?: SortOrder
  }

  export type BoardMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    index?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoardMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    index?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoardSumOrderByAggregateInput = {
    index?: SortOrder
  }

  export type EnumBlueprintStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BlueprintStatus | EnumBlueprintStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BlueprintStatus[]
    notIn?: $Enums.BlueprintStatus[]
    not?: NestedEnumBlueprintStatusFilter<$PrismaModel> | $Enums.BlueprintStatus
  }

  export type ScriptListRelationFilter = {
    every?: ScriptWhereInput
    some?: ScriptWhereInput
    none?: ScriptWhereInput
  }

  export type ScriptDraftListRelationFilter = {
    every?: ScriptDraftWhereInput
    some?: ScriptDraftWhereInput
    none?: ScriptDraftWhereInput
  }

  export type BlueprintHistoryListRelationFilter = {
    every?: BlueprintHistoryWhereInput
    some?: BlueprintHistoryWhereInput
    none?: BlueprintHistoryWhereInput
  }

  export type ScriptDraftHistoryListRelationFilter = {
    every?: ScriptDraftHistoryWhereInput
    some?: ScriptDraftHistoryWhereInput
    none?: ScriptDraftHistoryWhereInput
  }

  export type ScriptOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ScriptDraftOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlueprintHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ScriptDraftHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlueprintCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    targetDurationMs?: SortOrder
    status?: SortOrder
    beats?: SortOrder
    rejectionNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlueprintAvgOrderByAggregateInput = {
    version?: SortOrder
    targetDurationMs?: SortOrder
  }

  export type BlueprintMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    targetDurationMs?: SortOrder
    status?: SortOrder
    rejectionNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlueprintMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    targetDurationMs?: SortOrder
    status?: SortOrder
    rejectionNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlueprintSumOrderByAggregateInput = {
    version?: SortOrder
    targetDurationMs?: SortOrder
  }

  export type EnumBlueprintStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BlueprintStatus | EnumBlueprintStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BlueprintStatus[]
    notIn?: $Enums.BlueprintStatus[]
    not?: NestedEnumBlueprintStatusWithAggregatesFilter<$PrismaModel> | $Enums.BlueprintStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBlueprintStatusFilter<$PrismaModel>
    _max?: NestedEnumBlueprintStatusFilter<$PrismaModel>
  }

  export type EnumScriptDraftStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ScriptDraftStatus | EnumScriptDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ScriptDraftStatus[]
    notIn?: $Enums.ScriptDraftStatus[]
    not?: NestedEnumScriptDraftStatusFilter<$PrismaModel> | $Enums.ScriptDraftStatus
  }

  export type BlueprintScalarRelationFilter = {
    is?: BlueprintWhereInput
    isNot?: BlueprintWhereInput
  }

  export type ScriptDraftCountOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    status?: SortOrder
    currentBeatIndex?: SortOrder
    beatDrafts?: SortOrder
    glueIssues?: SortOrder
    polishedText?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ScriptDraftAvgOrderByAggregateInput = {
    version?: SortOrder
    currentBeatIndex?: SortOrder
  }

  export type ScriptDraftMaxOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    status?: SortOrder
    currentBeatIndex?: SortOrder
    polishedText?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ScriptDraftMinOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    status?: SortOrder
    currentBeatIndex?: SortOrder
    polishedText?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ScriptDraftSumOrderByAggregateInput = {
    version?: SortOrder
    currentBeatIndex?: SortOrder
  }

  export type EnumScriptDraftStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ScriptDraftStatus | EnumScriptDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ScriptDraftStatus[]
    notIn?: $Enums.ScriptDraftStatus[]
    not?: NestedEnumScriptDraftStatusWithAggregatesFilter<$PrismaModel> | $Enums.ScriptDraftStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumScriptDraftStatusFilter<$PrismaModel>
    _max?: NestedEnumScriptDraftStatusFilter<$PrismaModel>
  }

  export type BlueprintHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
  }

  export type BlueprintHistoryAvgOrderByAggregateInput = {
    version?: SortOrder
  }

  export type BlueprintHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    createdAt?: SortOrder
  }

  export type BlueprintHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    createdAt?: SortOrder
  }

  export type BlueprintHistorySumOrderByAggregateInput = {
    version?: SortOrder
  }

  export type ScriptDraftScalarRelationFilter = {
    is?: ScriptDraftWhereInput
    isNot?: ScriptDraftWhereInput
  }

  export type ScriptDraftHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    scriptDraftId?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    snapshot?: SortOrder
    createdAt?: SortOrder
  }

  export type ScriptDraftHistoryAvgOrderByAggregateInput = {
    version?: SortOrder
  }

  export type ScriptDraftHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    scriptDraftId?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    createdAt?: SortOrder
  }

  export type ScriptDraftHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    scriptDraftId?: SortOrder
    blueprintId?: SortOrder
    version?: SortOrder
    event?: SortOrder
    createdAt?: SortOrder
  }

  export type ScriptDraftHistorySumOrderByAggregateInput = {
    version?: SortOrder
  }

  export type ProjectSettingsCreateNestedOneWithoutProjectInput = {
    create?: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ProjectSettingsCreateOrConnectWithoutProjectInput
    connect?: ProjectSettingsWhereUniqueInput
  }

  export type ScriptCreateNestedOneWithoutProjectInput = {
    create?: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ScriptCreateOrConnectWithoutProjectInput
    connect?: ScriptWhereUniqueInput
  }

  export type BlueprintCreateNestedManyWithoutProjectInput = {
    create?: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput> | BlueprintCreateWithoutProjectInput[] | BlueprintUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BlueprintCreateOrConnectWithoutProjectInput | BlueprintCreateOrConnectWithoutProjectInput[]
    createMany?: BlueprintCreateManyProjectInputEnvelope
    connect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
  }

  export type AssetCreateNestedManyWithoutProjectInput = {
    create?: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput> | AssetCreateWithoutProjectInput[] | AssetUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AssetCreateOrConnectWithoutProjectInput | AssetCreateOrConnectWithoutProjectInput[]
    createMany?: AssetCreateManyProjectInputEnvelope
    connect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
  }

  export type ViewportCreateNestedOneWithoutProjectInput = {
    create?: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutProjectInput
    connect?: ViewportWhereUniqueInput
  }

  export type BoardCreateNestedManyWithoutProjectInput = {
    create?: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput> | BoardCreateWithoutProjectInput[] | BoardUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutProjectInput | BoardCreateOrConnectWithoutProjectInput[]
    createMany?: BoardCreateManyProjectInputEnvelope
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
  }

  export type RenderCreateNestedManyWithoutProjectInput = {
    create?: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput> | RenderCreateWithoutProjectInput[] | RenderUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: RenderCreateOrConnectWithoutProjectInput | RenderCreateOrConnectWithoutProjectInput[]
    createMany?: RenderCreateManyProjectInputEnvelope
    connect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
  }

  export type AiCallLogCreateNestedManyWithoutProjectInput = {
    create?: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput> | AiCallLogCreateWithoutProjectInput[] | AiCallLogUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutProjectInput | AiCallLogCreateOrConnectWithoutProjectInput[]
    createMany?: AiCallLogCreateManyProjectInputEnvelope
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
  }

  export type ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput = {
    create?: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ProjectSettingsCreateOrConnectWithoutProjectInput
    connect?: ProjectSettingsWhereUniqueInput
  }

  export type ScriptUncheckedCreateNestedOneWithoutProjectInput = {
    create?: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ScriptCreateOrConnectWithoutProjectInput
    connect?: ScriptWhereUniqueInput
  }

  export type BlueprintUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput> | BlueprintCreateWithoutProjectInput[] | BlueprintUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BlueprintCreateOrConnectWithoutProjectInput | BlueprintCreateOrConnectWithoutProjectInput[]
    createMany?: BlueprintCreateManyProjectInputEnvelope
    connect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
  }

  export type AssetUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput> | AssetCreateWithoutProjectInput[] | AssetUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AssetCreateOrConnectWithoutProjectInput | AssetCreateOrConnectWithoutProjectInput[]
    createMany?: AssetCreateManyProjectInputEnvelope
    connect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
  }

  export type ViewportUncheckedCreateNestedOneWithoutProjectInput = {
    create?: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutProjectInput
    connect?: ViewportWhereUniqueInput
  }

  export type BoardUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput> | BoardCreateWithoutProjectInput[] | BoardUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutProjectInput | BoardCreateOrConnectWithoutProjectInput[]
    createMany?: BoardCreateManyProjectInputEnvelope
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
  }

  export type RenderUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput> | RenderCreateWithoutProjectInput[] | RenderUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: RenderCreateOrConnectWithoutProjectInput | RenderCreateOrConnectWithoutProjectInput[]
    createMany?: RenderCreateManyProjectInputEnvelope
    connect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
  }

  export type AiCallLogUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput> | AiCallLogCreateWithoutProjectInput[] | AiCallLogUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutProjectInput | AiCallLogCreateOrConnectWithoutProjectInput[]
    createMany?: AiCallLogCreateManyProjectInputEnvelope
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumProjectStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProjectStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ProjectSettingsUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ProjectSettingsCreateOrConnectWithoutProjectInput
    upsert?: ProjectSettingsUpsertWithoutProjectInput
    disconnect?: ProjectSettingsWhereInput | boolean
    delete?: ProjectSettingsWhereInput | boolean
    connect?: ProjectSettingsWhereUniqueInput
    update?: XOR<XOR<ProjectSettingsUpdateToOneWithWhereWithoutProjectInput, ProjectSettingsUpdateWithoutProjectInput>, ProjectSettingsUncheckedUpdateWithoutProjectInput>
  }

  export type ScriptUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ScriptCreateOrConnectWithoutProjectInput
    upsert?: ScriptUpsertWithoutProjectInput
    disconnect?: ScriptWhereInput | boolean
    delete?: ScriptWhereInput | boolean
    connect?: ScriptWhereUniqueInput
    update?: XOR<XOR<ScriptUpdateToOneWithWhereWithoutProjectInput, ScriptUpdateWithoutProjectInput>, ScriptUncheckedUpdateWithoutProjectInput>
  }

  export type BlueprintUpdateManyWithoutProjectNestedInput = {
    create?: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput> | BlueprintCreateWithoutProjectInput[] | BlueprintUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BlueprintCreateOrConnectWithoutProjectInput | BlueprintCreateOrConnectWithoutProjectInput[]
    upsert?: BlueprintUpsertWithWhereUniqueWithoutProjectInput | BlueprintUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: BlueprintCreateManyProjectInputEnvelope
    set?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    disconnect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    delete?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    connect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    update?: BlueprintUpdateWithWhereUniqueWithoutProjectInput | BlueprintUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: BlueprintUpdateManyWithWhereWithoutProjectInput | BlueprintUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: BlueprintScalarWhereInput | BlueprintScalarWhereInput[]
  }

  export type AssetUpdateManyWithoutProjectNestedInput = {
    create?: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput> | AssetCreateWithoutProjectInput[] | AssetUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AssetCreateOrConnectWithoutProjectInput | AssetCreateOrConnectWithoutProjectInput[]
    upsert?: AssetUpsertWithWhereUniqueWithoutProjectInput | AssetUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: AssetCreateManyProjectInputEnvelope
    set?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    disconnect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    delete?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    connect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    update?: AssetUpdateWithWhereUniqueWithoutProjectInput | AssetUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: AssetUpdateManyWithWhereWithoutProjectInput | AssetUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: AssetScalarWhereInput | AssetScalarWhereInput[]
  }

  export type ViewportUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutProjectInput
    upsert?: ViewportUpsertWithoutProjectInput
    disconnect?: ViewportWhereInput | boolean
    delete?: ViewportWhereInput | boolean
    connect?: ViewportWhereUniqueInput
    update?: XOR<XOR<ViewportUpdateToOneWithWhereWithoutProjectInput, ViewportUpdateWithoutProjectInput>, ViewportUncheckedUpdateWithoutProjectInput>
  }

  export type BoardUpdateManyWithoutProjectNestedInput = {
    create?: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput> | BoardCreateWithoutProjectInput[] | BoardUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutProjectInput | BoardCreateOrConnectWithoutProjectInput[]
    upsert?: BoardUpsertWithWhereUniqueWithoutProjectInput | BoardUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: BoardCreateManyProjectInputEnvelope
    set?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    disconnect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    delete?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    update?: BoardUpdateWithWhereUniqueWithoutProjectInput | BoardUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: BoardUpdateManyWithWhereWithoutProjectInput | BoardUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: BoardScalarWhereInput | BoardScalarWhereInput[]
  }

  export type RenderUpdateManyWithoutProjectNestedInput = {
    create?: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput> | RenderCreateWithoutProjectInput[] | RenderUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: RenderCreateOrConnectWithoutProjectInput | RenderCreateOrConnectWithoutProjectInput[]
    upsert?: RenderUpsertWithWhereUniqueWithoutProjectInput | RenderUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: RenderCreateManyProjectInputEnvelope
    set?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    disconnect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    delete?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    connect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    update?: RenderUpdateWithWhereUniqueWithoutProjectInput | RenderUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: RenderUpdateManyWithWhereWithoutProjectInput | RenderUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: RenderScalarWhereInput | RenderScalarWhereInput[]
  }

  export type AiCallLogUpdateManyWithoutProjectNestedInput = {
    create?: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput> | AiCallLogCreateWithoutProjectInput[] | AiCallLogUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutProjectInput | AiCallLogCreateOrConnectWithoutProjectInput[]
    upsert?: AiCallLogUpsertWithWhereUniqueWithoutProjectInput | AiCallLogUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: AiCallLogCreateManyProjectInputEnvelope
    set?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    disconnect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    delete?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    update?: AiCallLogUpdateWithWhereUniqueWithoutProjectInput | AiCallLogUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: AiCallLogUpdateManyWithWhereWithoutProjectInput | AiCallLogUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
  }

  export type ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ProjectSettingsCreateOrConnectWithoutProjectInput
    upsert?: ProjectSettingsUpsertWithoutProjectInput
    disconnect?: ProjectSettingsWhereInput | boolean
    delete?: ProjectSettingsWhereInput | boolean
    connect?: ProjectSettingsWhereUniqueInput
    update?: XOR<XOR<ProjectSettingsUpdateToOneWithWhereWithoutProjectInput, ProjectSettingsUpdateWithoutProjectInput>, ProjectSettingsUncheckedUpdateWithoutProjectInput>
  }

  export type ScriptUncheckedUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ScriptCreateOrConnectWithoutProjectInput
    upsert?: ScriptUpsertWithoutProjectInput
    disconnect?: ScriptWhereInput | boolean
    delete?: ScriptWhereInput | boolean
    connect?: ScriptWhereUniqueInput
    update?: XOR<XOR<ScriptUpdateToOneWithWhereWithoutProjectInput, ScriptUpdateWithoutProjectInput>, ScriptUncheckedUpdateWithoutProjectInput>
  }

  export type BlueprintUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput> | BlueprintCreateWithoutProjectInput[] | BlueprintUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BlueprintCreateOrConnectWithoutProjectInput | BlueprintCreateOrConnectWithoutProjectInput[]
    upsert?: BlueprintUpsertWithWhereUniqueWithoutProjectInput | BlueprintUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: BlueprintCreateManyProjectInputEnvelope
    set?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    disconnect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    delete?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    connect?: BlueprintWhereUniqueInput | BlueprintWhereUniqueInput[]
    update?: BlueprintUpdateWithWhereUniqueWithoutProjectInput | BlueprintUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: BlueprintUpdateManyWithWhereWithoutProjectInput | BlueprintUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: BlueprintScalarWhereInput | BlueprintScalarWhereInput[]
  }

  export type AssetUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput> | AssetCreateWithoutProjectInput[] | AssetUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AssetCreateOrConnectWithoutProjectInput | AssetCreateOrConnectWithoutProjectInput[]
    upsert?: AssetUpsertWithWhereUniqueWithoutProjectInput | AssetUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: AssetCreateManyProjectInputEnvelope
    set?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    disconnect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    delete?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    connect?: AssetWhereUniqueInput | AssetWhereUniqueInput[]
    update?: AssetUpdateWithWhereUniqueWithoutProjectInput | AssetUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: AssetUpdateManyWithWhereWithoutProjectInput | AssetUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: AssetScalarWhereInput | AssetScalarWhereInput[]
  }

  export type ViewportUncheckedUpdateOneWithoutProjectNestedInput = {
    create?: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutProjectInput
    upsert?: ViewportUpsertWithoutProjectInput
    disconnect?: ViewportWhereInput | boolean
    delete?: ViewportWhereInput | boolean
    connect?: ViewportWhereUniqueInput
    update?: XOR<XOR<ViewportUpdateToOneWithWhereWithoutProjectInput, ViewportUpdateWithoutProjectInput>, ViewportUncheckedUpdateWithoutProjectInput>
  }

  export type BoardUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput> | BoardCreateWithoutProjectInput[] | BoardUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutProjectInput | BoardCreateOrConnectWithoutProjectInput[]
    upsert?: BoardUpsertWithWhereUniqueWithoutProjectInput | BoardUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: BoardCreateManyProjectInputEnvelope
    set?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    disconnect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    delete?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    update?: BoardUpdateWithWhereUniqueWithoutProjectInput | BoardUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: BoardUpdateManyWithWhereWithoutProjectInput | BoardUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: BoardScalarWhereInput | BoardScalarWhereInput[]
  }

  export type RenderUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput> | RenderCreateWithoutProjectInput[] | RenderUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: RenderCreateOrConnectWithoutProjectInput | RenderCreateOrConnectWithoutProjectInput[]
    upsert?: RenderUpsertWithWhereUniqueWithoutProjectInput | RenderUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: RenderCreateManyProjectInputEnvelope
    set?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    disconnect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    delete?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    connect?: RenderWhereUniqueInput | RenderWhereUniqueInput[]
    update?: RenderUpdateWithWhereUniqueWithoutProjectInput | RenderUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: RenderUpdateManyWithWhereWithoutProjectInput | RenderUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: RenderScalarWhereInput | RenderScalarWhereInput[]
  }

  export type AiCallLogUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput> | AiCallLogCreateWithoutProjectInput[] | AiCallLogUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutProjectInput | AiCallLogCreateOrConnectWithoutProjectInput[]
    upsert?: AiCallLogUpsertWithWhereUniqueWithoutProjectInput | AiCallLogUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: AiCallLogCreateManyProjectInputEnvelope
    set?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    disconnect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    delete?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    update?: AiCallLogUpdateWithWhereUniqueWithoutProjectInput | AiCallLogUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: AiCallLogUpdateManyWithWhereWithoutProjectInput | AiCallLogUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
  }

  export type ProjectCreateNestedOneWithoutSettingsInput = {
    create?: XOR<ProjectCreateWithoutSettingsInput, ProjectUncheckedCreateWithoutSettingsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutSettingsInput
    connect?: ProjectWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProjectUpdateOneRequiredWithoutSettingsNestedInput = {
    create?: XOR<ProjectCreateWithoutSettingsInput, ProjectUncheckedCreateWithoutSettingsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutSettingsInput
    upsert?: ProjectUpsertWithoutSettingsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutSettingsInput, ProjectUpdateWithoutSettingsInput>, ProjectUncheckedUpdateWithoutSettingsInput>
  }

  export type ProjectCreateNestedOneWithoutScriptInput = {
    create?: XOR<ProjectCreateWithoutScriptInput, ProjectUncheckedCreateWithoutScriptInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutScriptInput
    connect?: ProjectWhereUniqueInput
  }

  export type BlueprintCreateNestedOneWithoutScriptsInput = {
    create?: XOR<BlueprintCreateWithoutScriptsInput, BlueprintUncheckedCreateWithoutScriptsInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutScriptsInput
    connect?: BlueprintWhereUniqueInput
  }

  export type ProjectUpdateOneRequiredWithoutScriptNestedInput = {
    create?: XOR<ProjectCreateWithoutScriptInput, ProjectUncheckedCreateWithoutScriptInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutScriptInput
    upsert?: ProjectUpsertWithoutScriptInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutScriptInput, ProjectUpdateWithoutScriptInput>, ProjectUncheckedUpdateWithoutScriptInput>
  }

  export type BlueprintUpdateOneWithoutScriptsNestedInput = {
    create?: XOR<BlueprintCreateWithoutScriptsInput, BlueprintUncheckedCreateWithoutScriptsInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutScriptsInput
    upsert?: BlueprintUpsertWithoutScriptsInput
    disconnect?: BlueprintWhereInput | boolean
    delete?: BlueprintWhereInput | boolean
    connect?: BlueprintWhereUniqueInput
    update?: XOR<XOR<BlueprintUpdateToOneWithWhereWithoutScriptsInput, BlueprintUpdateWithoutScriptsInput>, BlueprintUncheckedUpdateWithoutScriptsInput>
  }

  export type ProjectCreateNestedOneWithoutAssetsInput = {
    create?: XOR<ProjectCreateWithoutAssetsInput, ProjectUncheckedCreateWithoutAssetsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutAssetsInput
    connect?: ProjectWhereUniqueInput
  }

  export type ViewportCreateNestedOneWithoutImageAssetInput = {
    create?: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutImageAssetInput
    connect?: ViewportWhereUniqueInput
  }

  export type BoardCreateNestedManyWithoutAssetInput = {
    create?: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput> | BoardCreateWithoutAssetInput[] | BoardUncheckedCreateWithoutAssetInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutAssetInput | BoardCreateOrConnectWithoutAssetInput[]
    createMany?: BoardCreateManyAssetInputEnvelope
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
  }

  export type ViewportUncheckedCreateNestedOneWithoutImageAssetInput = {
    create?: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutImageAssetInput
    connect?: ViewportWhereUniqueInput
  }

  export type BoardUncheckedCreateNestedManyWithoutAssetInput = {
    create?: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput> | BoardCreateWithoutAssetInput[] | BoardUncheckedCreateWithoutAssetInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutAssetInput | BoardCreateOrConnectWithoutAssetInput[]
    createMany?: BoardCreateManyAssetInputEnvelope
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
  }

  export type EnumAssetTypeFieldUpdateOperationsInput = {
    set?: $Enums.AssetType
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ProjectUpdateOneRequiredWithoutAssetsNestedInput = {
    create?: XOR<ProjectCreateWithoutAssetsInput, ProjectUncheckedCreateWithoutAssetsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutAssetsInput
    upsert?: ProjectUpsertWithoutAssetsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutAssetsInput, ProjectUpdateWithoutAssetsInput>, ProjectUncheckedUpdateWithoutAssetsInput>
  }

  export type ViewportUpdateOneWithoutImageAssetNestedInput = {
    create?: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutImageAssetInput
    upsert?: ViewportUpsertWithoutImageAssetInput
    disconnect?: ViewportWhereInput | boolean
    delete?: ViewportWhereInput | boolean
    connect?: ViewportWhereUniqueInput
    update?: XOR<XOR<ViewportUpdateToOneWithWhereWithoutImageAssetInput, ViewportUpdateWithoutImageAssetInput>, ViewportUncheckedUpdateWithoutImageAssetInput>
  }

  export type BoardUpdateManyWithoutAssetNestedInput = {
    create?: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput> | BoardCreateWithoutAssetInput[] | BoardUncheckedCreateWithoutAssetInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutAssetInput | BoardCreateOrConnectWithoutAssetInput[]
    upsert?: BoardUpsertWithWhereUniqueWithoutAssetInput | BoardUpsertWithWhereUniqueWithoutAssetInput[]
    createMany?: BoardCreateManyAssetInputEnvelope
    set?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    disconnect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    delete?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    update?: BoardUpdateWithWhereUniqueWithoutAssetInput | BoardUpdateWithWhereUniqueWithoutAssetInput[]
    updateMany?: BoardUpdateManyWithWhereWithoutAssetInput | BoardUpdateManyWithWhereWithoutAssetInput[]
    deleteMany?: BoardScalarWhereInput | BoardScalarWhereInput[]
  }

  export type ViewportUncheckedUpdateOneWithoutImageAssetNestedInput = {
    create?: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
    connectOrCreate?: ViewportCreateOrConnectWithoutImageAssetInput
    upsert?: ViewportUpsertWithoutImageAssetInput
    disconnect?: ViewportWhereInput | boolean
    delete?: ViewportWhereInput | boolean
    connect?: ViewportWhereUniqueInput
    update?: XOR<XOR<ViewportUpdateToOneWithWhereWithoutImageAssetInput, ViewportUpdateWithoutImageAssetInput>, ViewportUncheckedUpdateWithoutImageAssetInput>
  }

  export type BoardUncheckedUpdateManyWithoutAssetNestedInput = {
    create?: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput> | BoardCreateWithoutAssetInput[] | BoardUncheckedCreateWithoutAssetInput[]
    connectOrCreate?: BoardCreateOrConnectWithoutAssetInput | BoardCreateOrConnectWithoutAssetInput[]
    upsert?: BoardUpsertWithWhereUniqueWithoutAssetInput | BoardUpsertWithWhereUniqueWithoutAssetInput[]
    createMany?: BoardCreateManyAssetInputEnvelope
    set?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    disconnect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    delete?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    connect?: BoardWhereUniqueInput | BoardWhereUniqueInput[]
    update?: BoardUpdateWithWhereUniqueWithoutAssetInput | BoardUpdateWithWhereUniqueWithoutAssetInput[]
    updateMany?: BoardUpdateManyWithWhereWithoutAssetInput | BoardUpdateManyWithWhereWithoutAssetInput[]
    deleteMany?: BoardScalarWhereInput | BoardScalarWhereInput[]
  }

  export type ProjectCreateNestedOneWithoutRendersInput = {
    create?: XOR<ProjectCreateWithoutRendersInput, ProjectUncheckedCreateWithoutRendersInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutRendersInput
    connect?: ProjectWhereUniqueInput
  }

  export type EnumRenderQualityFieldUpdateOperationsInput = {
    set?: $Enums.RenderQuality
  }

  export type EnumRenderStatusFieldUpdateOperationsInput = {
    set?: $Enums.RenderStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ProjectUpdateOneRequiredWithoutRendersNestedInput = {
    create?: XOR<ProjectCreateWithoutRendersInput, ProjectUncheckedCreateWithoutRendersInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutRendersInput
    upsert?: ProjectUpsertWithoutRendersInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutRendersInput, ProjectUpdateWithoutRendersInput>, ProjectUncheckedUpdateWithoutRendersInput>
  }

  export type ProjectCreateNestedOneWithoutAiCallLogsInput = {
    create?: XOR<ProjectCreateWithoutAiCallLogsInput, ProjectUncheckedCreateWithoutAiCallLogsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutAiCallLogsInput
    connect?: ProjectWhereUniqueInput
  }

  export type AiCallLogCreateNestedOneWithoutChildrenInput = {
    create?: XOR<AiCallLogCreateWithoutChildrenInput, AiCallLogUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: AiCallLogCreateOrConnectWithoutChildrenInput
    connect?: AiCallLogWhereUniqueInput
  }

  export type AiCallLogCreateNestedManyWithoutParentInput = {
    create?: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput> | AiCallLogCreateWithoutParentInput[] | AiCallLogUncheckedCreateWithoutParentInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutParentInput | AiCallLogCreateOrConnectWithoutParentInput[]
    createMany?: AiCallLogCreateManyParentInputEnvelope
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
  }

  export type AiCallLogUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput> | AiCallLogCreateWithoutParentInput[] | AiCallLogUncheckedCreateWithoutParentInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutParentInput | AiCallLogCreateOrConnectWithoutParentInput[]
    createMany?: AiCallLogCreateManyParentInputEnvelope
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumAiCallStatusFieldUpdateOperationsInput = {
    set?: $Enums.AiCallStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProjectUpdateOneRequiredWithoutAiCallLogsNestedInput = {
    create?: XOR<ProjectCreateWithoutAiCallLogsInput, ProjectUncheckedCreateWithoutAiCallLogsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutAiCallLogsInput
    upsert?: ProjectUpsertWithoutAiCallLogsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutAiCallLogsInput, ProjectUpdateWithoutAiCallLogsInput>, ProjectUncheckedUpdateWithoutAiCallLogsInput>
  }

  export type AiCallLogUpdateOneWithoutChildrenNestedInput = {
    create?: XOR<AiCallLogCreateWithoutChildrenInput, AiCallLogUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: AiCallLogCreateOrConnectWithoutChildrenInput
    upsert?: AiCallLogUpsertWithoutChildrenInput
    disconnect?: AiCallLogWhereInput | boolean
    delete?: AiCallLogWhereInput | boolean
    connect?: AiCallLogWhereUniqueInput
    update?: XOR<XOR<AiCallLogUpdateToOneWithWhereWithoutChildrenInput, AiCallLogUpdateWithoutChildrenInput>, AiCallLogUncheckedUpdateWithoutChildrenInput>
  }

  export type AiCallLogUpdateManyWithoutParentNestedInput = {
    create?: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput> | AiCallLogCreateWithoutParentInput[] | AiCallLogUncheckedCreateWithoutParentInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutParentInput | AiCallLogCreateOrConnectWithoutParentInput[]
    upsert?: AiCallLogUpsertWithWhereUniqueWithoutParentInput | AiCallLogUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: AiCallLogCreateManyParentInputEnvelope
    set?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    disconnect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    delete?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    update?: AiCallLogUpdateWithWhereUniqueWithoutParentInput | AiCallLogUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: AiCallLogUpdateManyWithWhereWithoutParentInput | AiCallLogUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
  }

  export type AiCallLogUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput> | AiCallLogCreateWithoutParentInput[] | AiCallLogUncheckedCreateWithoutParentInput[]
    connectOrCreate?: AiCallLogCreateOrConnectWithoutParentInput | AiCallLogCreateOrConnectWithoutParentInput[]
    upsert?: AiCallLogUpsertWithWhereUniqueWithoutParentInput | AiCallLogUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: AiCallLogCreateManyParentInputEnvelope
    set?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    disconnect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    delete?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    connect?: AiCallLogWhereUniqueInput | AiCallLogWhereUniqueInput[]
    update?: AiCallLogUpdateWithWhereUniqueWithoutParentInput | AiCallLogUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: AiCallLogUpdateManyWithWhereWithoutParentInput | AiCallLogUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
  }

  export type ProjectCreateNestedOneWithoutViewportInput = {
    create?: XOR<ProjectCreateWithoutViewportInput, ProjectUncheckedCreateWithoutViewportInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutViewportInput
    connect?: ProjectWhereUniqueInput
  }

  export type AssetCreateNestedOneWithoutViewportInput = {
    create?: XOR<AssetCreateWithoutViewportInput, AssetUncheckedCreateWithoutViewportInput>
    connectOrCreate?: AssetCreateOrConnectWithoutViewportInput
    connect?: AssetWhereUniqueInput
  }

  export type ProjectUpdateOneRequiredWithoutViewportNestedInput = {
    create?: XOR<ProjectCreateWithoutViewportInput, ProjectUncheckedCreateWithoutViewportInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutViewportInput
    upsert?: ProjectUpsertWithoutViewportInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutViewportInput, ProjectUpdateWithoutViewportInput>, ProjectUncheckedUpdateWithoutViewportInput>
  }

  export type AssetUpdateOneWithoutViewportNestedInput = {
    create?: XOR<AssetCreateWithoutViewportInput, AssetUncheckedCreateWithoutViewportInput>
    connectOrCreate?: AssetCreateOrConnectWithoutViewportInput
    upsert?: AssetUpsertWithoutViewportInput
    disconnect?: AssetWhereInput | boolean
    delete?: AssetWhereInput | boolean
    connect?: AssetWhereUniqueInput
    update?: XOR<XOR<AssetUpdateToOneWithWhereWithoutViewportInput, AssetUpdateWithoutViewportInput>, AssetUncheckedUpdateWithoutViewportInput>
  }

  export type ProjectCreateNestedOneWithoutBoardsInput = {
    create?: XOR<ProjectCreateWithoutBoardsInput, ProjectUncheckedCreateWithoutBoardsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutBoardsInput
    connect?: ProjectWhereUniqueInput
  }

  export type AssetCreateNestedOneWithoutBoardsInput = {
    create?: XOR<AssetCreateWithoutBoardsInput, AssetUncheckedCreateWithoutBoardsInput>
    connectOrCreate?: AssetCreateOrConnectWithoutBoardsInput
    connect?: AssetWhereUniqueInput
  }

  export type ProjectUpdateOneRequiredWithoutBoardsNestedInput = {
    create?: XOR<ProjectCreateWithoutBoardsInput, ProjectUncheckedCreateWithoutBoardsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutBoardsInput
    upsert?: ProjectUpsertWithoutBoardsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutBoardsInput, ProjectUpdateWithoutBoardsInput>, ProjectUncheckedUpdateWithoutBoardsInput>
  }

  export type AssetUpdateOneWithoutBoardsNestedInput = {
    create?: XOR<AssetCreateWithoutBoardsInput, AssetUncheckedCreateWithoutBoardsInput>
    connectOrCreate?: AssetCreateOrConnectWithoutBoardsInput
    upsert?: AssetUpsertWithoutBoardsInput
    disconnect?: AssetWhereInput | boolean
    delete?: AssetWhereInput | boolean
    connect?: AssetWhereUniqueInput
    update?: XOR<XOR<AssetUpdateToOneWithWhereWithoutBoardsInput, AssetUpdateWithoutBoardsInput>, AssetUncheckedUpdateWithoutBoardsInput>
  }

  export type ProjectCreateNestedOneWithoutBlueprintsInput = {
    create?: XOR<ProjectCreateWithoutBlueprintsInput, ProjectUncheckedCreateWithoutBlueprintsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutBlueprintsInput
    connect?: ProjectWhereUniqueInput
  }

  export type ScriptCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput> | ScriptCreateWithoutBlueprintInput[] | ScriptUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptCreateOrConnectWithoutBlueprintInput | ScriptCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptCreateManyBlueprintInputEnvelope
    connect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
  }

  export type ScriptDraftCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput> | ScriptDraftCreateWithoutBlueprintInput[] | ScriptDraftUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutBlueprintInput | ScriptDraftCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptDraftCreateManyBlueprintInputEnvelope
    connect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
  }

  export type BlueprintHistoryCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput> | BlueprintHistoryCreateWithoutBlueprintInput[] | BlueprintHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: BlueprintHistoryCreateOrConnectWithoutBlueprintInput | BlueprintHistoryCreateOrConnectWithoutBlueprintInput[]
    createMany?: BlueprintHistoryCreateManyBlueprintInputEnvelope
    connect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
  }

  export type ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput> | ScriptDraftHistoryCreateWithoutBlueprintInput[] | ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput | ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptDraftHistoryCreateManyBlueprintInputEnvelope
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
  }

  export type ScriptUncheckedCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput> | ScriptCreateWithoutBlueprintInput[] | ScriptUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptCreateOrConnectWithoutBlueprintInput | ScriptCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptCreateManyBlueprintInputEnvelope
    connect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
  }

  export type ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput> | ScriptDraftCreateWithoutBlueprintInput[] | ScriptDraftUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutBlueprintInput | ScriptDraftCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptDraftCreateManyBlueprintInputEnvelope
    connect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
  }

  export type BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput> | BlueprintHistoryCreateWithoutBlueprintInput[] | BlueprintHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: BlueprintHistoryCreateOrConnectWithoutBlueprintInput | BlueprintHistoryCreateOrConnectWithoutBlueprintInput[]
    createMany?: BlueprintHistoryCreateManyBlueprintInputEnvelope
    connect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
  }

  export type ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput> | ScriptDraftHistoryCreateWithoutBlueprintInput[] | ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput | ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput[]
    createMany?: ScriptDraftHistoryCreateManyBlueprintInputEnvelope
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
  }

  export type EnumBlueprintStatusFieldUpdateOperationsInput = {
    set?: $Enums.BlueprintStatus
  }

  export type ProjectUpdateOneRequiredWithoutBlueprintsNestedInput = {
    create?: XOR<ProjectCreateWithoutBlueprintsInput, ProjectUncheckedCreateWithoutBlueprintsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutBlueprintsInput
    upsert?: ProjectUpsertWithoutBlueprintsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutBlueprintsInput, ProjectUpdateWithoutBlueprintsInput>, ProjectUncheckedUpdateWithoutBlueprintsInput>
  }

  export type ScriptUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput> | ScriptCreateWithoutBlueprintInput[] | ScriptUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptCreateOrConnectWithoutBlueprintInput | ScriptCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptUpsertWithWhereUniqueWithoutBlueprintInput | ScriptUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptCreateManyBlueprintInputEnvelope
    set?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    disconnect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    delete?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    connect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    update?: ScriptUpdateWithWhereUniqueWithoutBlueprintInput | ScriptUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptUpdateManyWithWhereWithoutBlueprintInput | ScriptUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptScalarWhereInput | ScriptScalarWhereInput[]
  }

  export type ScriptDraftUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput> | ScriptDraftCreateWithoutBlueprintInput[] | ScriptDraftUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutBlueprintInput | ScriptDraftCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptDraftUpsertWithWhereUniqueWithoutBlueprintInput | ScriptDraftUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptDraftCreateManyBlueprintInputEnvelope
    set?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    disconnect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    delete?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    connect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    update?: ScriptDraftUpdateWithWhereUniqueWithoutBlueprintInput | ScriptDraftUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptDraftUpdateManyWithWhereWithoutBlueprintInput | ScriptDraftUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptDraftScalarWhereInput | ScriptDraftScalarWhereInput[]
  }

  export type BlueprintHistoryUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput> | BlueprintHistoryCreateWithoutBlueprintInput[] | BlueprintHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: BlueprintHistoryCreateOrConnectWithoutBlueprintInput | BlueprintHistoryCreateOrConnectWithoutBlueprintInput[]
    upsert?: BlueprintHistoryUpsertWithWhereUniqueWithoutBlueprintInput | BlueprintHistoryUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: BlueprintHistoryCreateManyBlueprintInputEnvelope
    set?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    disconnect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    delete?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    connect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    update?: BlueprintHistoryUpdateWithWhereUniqueWithoutBlueprintInput | BlueprintHistoryUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: BlueprintHistoryUpdateManyWithWhereWithoutBlueprintInput | BlueprintHistoryUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: BlueprintHistoryScalarWhereInput | BlueprintHistoryScalarWhereInput[]
  }

  export type ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput> | ScriptDraftHistoryCreateWithoutBlueprintInput[] | ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput | ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptDraftHistoryUpsertWithWhereUniqueWithoutBlueprintInput | ScriptDraftHistoryUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptDraftHistoryCreateManyBlueprintInputEnvelope
    set?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    disconnect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    delete?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    update?: ScriptDraftHistoryUpdateWithWhereUniqueWithoutBlueprintInput | ScriptDraftHistoryUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptDraftHistoryUpdateManyWithWhereWithoutBlueprintInput | ScriptDraftHistoryUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
  }

  export type ScriptUncheckedUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput> | ScriptCreateWithoutBlueprintInput[] | ScriptUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptCreateOrConnectWithoutBlueprintInput | ScriptCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptUpsertWithWhereUniqueWithoutBlueprintInput | ScriptUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptCreateManyBlueprintInputEnvelope
    set?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    disconnect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    delete?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    connect?: ScriptWhereUniqueInput | ScriptWhereUniqueInput[]
    update?: ScriptUpdateWithWhereUniqueWithoutBlueprintInput | ScriptUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptUpdateManyWithWhereWithoutBlueprintInput | ScriptUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptScalarWhereInput | ScriptScalarWhereInput[]
  }

  export type ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput> | ScriptDraftCreateWithoutBlueprintInput[] | ScriptDraftUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutBlueprintInput | ScriptDraftCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptDraftUpsertWithWhereUniqueWithoutBlueprintInput | ScriptDraftUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptDraftCreateManyBlueprintInputEnvelope
    set?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    disconnect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    delete?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    connect?: ScriptDraftWhereUniqueInput | ScriptDraftWhereUniqueInput[]
    update?: ScriptDraftUpdateWithWhereUniqueWithoutBlueprintInput | ScriptDraftUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptDraftUpdateManyWithWhereWithoutBlueprintInput | ScriptDraftUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptDraftScalarWhereInput | ScriptDraftScalarWhereInput[]
  }

  export type BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput> | BlueprintHistoryCreateWithoutBlueprintInput[] | BlueprintHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: BlueprintHistoryCreateOrConnectWithoutBlueprintInput | BlueprintHistoryCreateOrConnectWithoutBlueprintInput[]
    upsert?: BlueprintHistoryUpsertWithWhereUniqueWithoutBlueprintInput | BlueprintHistoryUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: BlueprintHistoryCreateManyBlueprintInputEnvelope
    set?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    disconnect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    delete?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    connect?: BlueprintHistoryWhereUniqueInput | BlueprintHistoryWhereUniqueInput[]
    update?: BlueprintHistoryUpdateWithWhereUniqueWithoutBlueprintInput | BlueprintHistoryUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: BlueprintHistoryUpdateManyWithWhereWithoutBlueprintInput | BlueprintHistoryUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: BlueprintHistoryScalarWhereInput | BlueprintHistoryScalarWhereInput[]
  }

  export type ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput> | ScriptDraftHistoryCreateWithoutBlueprintInput[] | ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput | ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput[]
    upsert?: ScriptDraftHistoryUpsertWithWhereUniqueWithoutBlueprintInput | ScriptDraftHistoryUpsertWithWhereUniqueWithoutBlueprintInput[]
    createMany?: ScriptDraftHistoryCreateManyBlueprintInputEnvelope
    set?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    disconnect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    delete?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    update?: ScriptDraftHistoryUpdateWithWhereUniqueWithoutBlueprintInput | ScriptDraftHistoryUpdateWithWhereUniqueWithoutBlueprintInput[]
    updateMany?: ScriptDraftHistoryUpdateManyWithWhereWithoutBlueprintInput | ScriptDraftHistoryUpdateManyWithWhereWithoutBlueprintInput[]
    deleteMany?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
  }

  export type BlueprintCreateNestedOneWithoutScriptDraftsInput = {
    create?: XOR<BlueprintCreateWithoutScriptDraftsInput, BlueprintUncheckedCreateWithoutScriptDraftsInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutScriptDraftsInput
    connect?: BlueprintWhereUniqueInput
  }

  export type ScriptDraftHistoryCreateNestedManyWithoutScriptDraftInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput> | ScriptDraftHistoryCreateWithoutScriptDraftInput[] | ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput | ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput[]
    createMany?: ScriptDraftHistoryCreateManyScriptDraftInputEnvelope
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
  }

  export type ScriptDraftHistoryUncheckedCreateNestedManyWithoutScriptDraftInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput> | ScriptDraftHistoryCreateWithoutScriptDraftInput[] | ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput | ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput[]
    createMany?: ScriptDraftHistoryCreateManyScriptDraftInputEnvelope
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
  }

  export type EnumScriptDraftStatusFieldUpdateOperationsInput = {
    set?: $Enums.ScriptDraftStatus
  }

  export type BlueprintUpdateOneRequiredWithoutScriptDraftsNestedInput = {
    create?: XOR<BlueprintCreateWithoutScriptDraftsInput, BlueprintUncheckedCreateWithoutScriptDraftsInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutScriptDraftsInput
    upsert?: BlueprintUpsertWithoutScriptDraftsInput
    connect?: BlueprintWhereUniqueInput
    update?: XOR<XOR<BlueprintUpdateToOneWithWhereWithoutScriptDraftsInput, BlueprintUpdateWithoutScriptDraftsInput>, BlueprintUncheckedUpdateWithoutScriptDraftsInput>
  }

  export type ScriptDraftHistoryUpdateManyWithoutScriptDraftNestedInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput> | ScriptDraftHistoryCreateWithoutScriptDraftInput[] | ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput | ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput[]
    upsert?: ScriptDraftHistoryUpsertWithWhereUniqueWithoutScriptDraftInput | ScriptDraftHistoryUpsertWithWhereUniqueWithoutScriptDraftInput[]
    createMany?: ScriptDraftHistoryCreateManyScriptDraftInputEnvelope
    set?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    disconnect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    delete?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    update?: ScriptDraftHistoryUpdateWithWhereUniqueWithoutScriptDraftInput | ScriptDraftHistoryUpdateWithWhereUniqueWithoutScriptDraftInput[]
    updateMany?: ScriptDraftHistoryUpdateManyWithWhereWithoutScriptDraftInput | ScriptDraftHistoryUpdateManyWithWhereWithoutScriptDraftInput[]
    deleteMany?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
  }

  export type ScriptDraftHistoryUncheckedUpdateManyWithoutScriptDraftNestedInput = {
    create?: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput> | ScriptDraftHistoryCreateWithoutScriptDraftInput[] | ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput[]
    connectOrCreate?: ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput | ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput[]
    upsert?: ScriptDraftHistoryUpsertWithWhereUniqueWithoutScriptDraftInput | ScriptDraftHistoryUpsertWithWhereUniqueWithoutScriptDraftInput[]
    createMany?: ScriptDraftHistoryCreateManyScriptDraftInputEnvelope
    set?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    disconnect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    delete?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    connect?: ScriptDraftHistoryWhereUniqueInput | ScriptDraftHistoryWhereUniqueInput[]
    update?: ScriptDraftHistoryUpdateWithWhereUniqueWithoutScriptDraftInput | ScriptDraftHistoryUpdateWithWhereUniqueWithoutScriptDraftInput[]
    updateMany?: ScriptDraftHistoryUpdateManyWithWhereWithoutScriptDraftInput | ScriptDraftHistoryUpdateManyWithWhereWithoutScriptDraftInput[]
    deleteMany?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
  }

  export type BlueprintCreateNestedOneWithoutHistoriesInput = {
    create?: XOR<BlueprintCreateWithoutHistoriesInput, BlueprintUncheckedCreateWithoutHistoriesInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutHistoriesInput
    connect?: BlueprintWhereUniqueInput
  }

  export type BlueprintUpdateOneRequiredWithoutHistoriesNestedInput = {
    create?: XOR<BlueprintCreateWithoutHistoriesInput, BlueprintUncheckedCreateWithoutHistoriesInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutHistoriesInput
    upsert?: BlueprintUpsertWithoutHistoriesInput
    connect?: BlueprintWhereUniqueInput
    update?: XOR<XOR<BlueprintUpdateToOneWithWhereWithoutHistoriesInput, BlueprintUpdateWithoutHistoriesInput>, BlueprintUncheckedUpdateWithoutHistoriesInput>
  }

  export type ScriptDraftCreateNestedOneWithoutHistoriesInput = {
    create?: XOR<ScriptDraftCreateWithoutHistoriesInput, ScriptDraftUncheckedCreateWithoutHistoriesInput>
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutHistoriesInput
    connect?: ScriptDraftWhereUniqueInput
  }

  export type BlueprintCreateNestedOneWithoutDraftHistoriesInput = {
    create?: XOR<BlueprintCreateWithoutDraftHistoriesInput, BlueprintUncheckedCreateWithoutDraftHistoriesInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutDraftHistoriesInput
    connect?: BlueprintWhereUniqueInput
  }

  export type ScriptDraftUpdateOneRequiredWithoutHistoriesNestedInput = {
    create?: XOR<ScriptDraftCreateWithoutHistoriesInput, ScriptDraftUncheckedCreateWithoutHistoriesInput>
    connectOrCreate?: ScriptDraftCreateOrConnectWithoutHistoriesInput
    upsert?: ScriptDraftUpsertWithoutHistoriesInput
    connect?: ScriptDraftWhereUniqueInput
    update?: XOR<XOR<ScriptDraftUpdateToOneWithWhereWithoutHistoriesInput, ScriptDraftUpdateWithoutHistoriesInput>, ScriptDraftUncheckedUpdateWithoutHistoriesInput>
  }

  export type BlueprintUpdateOneRequiredWithoutDraftHistoriesNestedInput = {
    create?: XOR<BlueprintCreateWithoutDraftHistoriesInput, BlueprintUncheckedCreateWithoutDraftHistoriesInput>
    connectOrCreate?: BlueprintCreateOrConnectWithoutDraftHistoriesInput
    upsert?: BlueprintUpsertWithoutDraftHistoriesInput
    connect?: BlueprintWhereUniqueInput
    update?: XOR<XOR<BlueprintUpdateToOneWithWhereWithoutDraftHistoriesInput, BlueprintUpdateWithoutDraftHistoriesInput>, BlueprintUncheckedUpdateWithoutDraftHistoriesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumProjectStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectStatus | EnumProjectStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectStatus[]
    notIn?: $Enums.ProjectStatus[]
    not?: NestedEnumProjectStatusFilter<$PrismaModel> | $Enums.ProjectStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumProjectStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectStatus | EnumProjectStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectStatus[]
    notIn?: $Enums.ProjectStatus[]
    not?: NestedEnumProjectStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProjectStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProjectStatusFilter<$PrismaModel>
    _max?: NestedEnumProjectStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumAssetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AssetType | EnumAssetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AssetType[]
    notIn?: $Enums.AssetType[]
    not?: NestedEnumAssetTypeFilter<$PrismaModel> | $Enums.AssetType
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumAssetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AssetType | EnumAssetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AssetType[]
    notIn?: $Enums.AssetType[]
    not?: NestedEnumAssetTypeWithAggregatesFilter<$PrismaModel> | $Enums.AssetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAssetTypeFilter<$PrismaModel>
    _max?: NestedEnumAssetTypeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumRenderQualityFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderQuality | EnumRenderQualityFieldRefInput<$PrismaModel>
    in?: $Enums.RenderQuality[]
    notIn?: $Enums.RenderQuality[]
    not?: NestedEnumRenderQualityFilter<$PrismaModel> | $Enums.RenderQuality
  }

  export type NestedEnumRenderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderStatus | EnumRenderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RenderStatus[]
    notIn?: $Enums.RenderStatus[]
    not?: NestedEnumRenderStatusFilter<$PrismaModel> | $Enums.RenderStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumRenderQualityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderQuality | EnumRenderQualityFieldRefInput<$PrismaModel>
    in?: $Enums.RenderQuality[]
    notIn?: $Enums.RenderQuality[]
    not?: NestedEnumRenderQualityWithAggregatesFilter<$PrismaModel> | $Enums.RenderQuality
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRenderQualityFilter<$PrismaModel>
    _max?: NestedEnumRenderQualityFilter<$PrismaModel>
  }

  export type NestedEnumRenderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RenderStatus | EnumRenderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RenderStatus[]
    notIn?: $Enums.RenderStatus[]
    not?: NestedEnumRenderStatusWithAggregatesFilter<$PrismaModel> | $Enums.RenderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRenderStatusFilter<$PrismaModel>
    _max?: NestedEnumRenderStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumAiCallStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AiCallStatus | EnumAiCallStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AiCallStatus[]
    notIn?: $Enums.AiCallStatus[]
    not?: NestedEnumAiCallStatusFilter<$PrismaModel> | $Enums.AiCallStatus
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumAiCallStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AiCallStatus | EnumAiCallStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AiCallStatus[]
    notIn?: $Enums.AiCallStatus[]
    not?: NestedEnumAiCallStatusWithAggregatesFilter<$PrismaModel> | $Enums.AiCallStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAiCallStatusFilter<$PrismaModel>
    _max?: NestedEnumAiCallStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedEnumBlueprintStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BlueprintStatus | EnumBlueprintStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BlueprintStatus[]
    notIn?: $Enums.BlueprintStatus[]
    not?: NestedEnumBlueprintStatusFilter<$PrismaModel> | $Enums.BlueprintStatus
  }

  export type NestedEnumBlueprintStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BlueprintStatus | EnumBlueprintStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BlueprintStatus[]
    notIn?: $Enums.BlueprintStatus[]
    not?: NestedEnumBlueprintStatusWithAggregatesFilter<$PrismaModel> | $Enums.BlueprintStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBlueprintStatusFilter<$PrismaModel>
    _max?: NestedEnumBlueprintStatusFilter<$PrismaModel>
  }

  export type NestedEnumScriptDraftStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ScriptDraftStatus | EnumScriptDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ScriptDraftStatus[]
    notIn?: $Enums.ScriptDraftStatus[]
    not?: NestedEnumScriptDraftStatusFilter<$PrismaModel> | $Enums.ScriptDraftStatus
  }

  export type NestedEnumScriptDraftStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ScriptDraftStatus | EnumScriptDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ScriptDraftStatus[]
    notIn?: $Enums.ScriptDraftStatus[]
    not?: NestedEnumScriptDraftStatusWithAggregatesFilter<$PrismaModel> | $Enums.ScriptDraftStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumScriptDraftStatusFilter<$PrismaModel>
    _max?: NestedEnumScriptDraftStatusFilter<$PrismaModel>
  }

  export type ProjectSettingsCreateWithoutProjectInput = {
    id?: string
    provider?: string
    model?: string
    temperature?: number
    voice?: string
    speakingRate?: number
    pitch?: number
    defaultQuality?: string
    defaultAspectRatio?: string
    musicTrackId?: string | null
    musicVolume?: number
  }

  export type ProjectSettingsUncheckedCreateWithoutProjectInput = {
    id?: string
    provider?: string
    model?: string
    temperature?: number
    voice?: string
    speakingRate?: number
    pitch?: number
    defaultQuality?: string
    defaultAspectRatio?: string
    musicTrackId?: string | null
    musicVolume?: number
  }

  export type ProjectSettingsCreateOrConnectWithoutProjectInput = {
    where: ProjectSettingsWhereUniqueInput
    create: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
  }

  export type ScriptCreateWithoutProjectInput = {
    id?: string
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    blueprint?: BlueprintCreateNestedOneWithoutScriptsInput
  }

  export type ScriptUncheckedCreateWithoutProjectInput = {
    id?: string
    blueprintId?: string | null
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptCreateOrConnectWithoutProjectInput = {
    where: ScriptWhereUniqueInput
    create: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
  }

  export type BlueprintCreateWithoutProjectInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateWithoutProjectInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptUncheckedCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintCreateOrConnectWithoutProjectInput = {
    where: BlueprintWhereUniqueInput
    create: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput>
  }

  export type BlueprintCreateManyProjectInputEnvelope = {
    data: BlueprintCreateManyProjectInput | BlueprintCreateManyProjectInput[]
  }

  export type AssetCreateWithoutProjectInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    viewport?: ViewportCreateNestedOneWithoutImageAssetInput
    boards?: BoardCreateNestedManyWithoutAssetInput
  }

  export type AssetUncheckedCreateWithoutProjectInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    viewport?: ViewportUncheckedCreateNestedOneWithoutImageAssetInput
    boards?: BoardUncheckedCreateNestedManyWithoutAssetInput
  }

  export type AssetCreateOrConnectWithoutProjectInput = {
    where: AssetWhereUniqueInput
    create: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput>
  }

  export type AssetCreateManyProjectInputEnvelope = {
    data: AssetCreateManyProjectInput | AssetCreateManyProjectInput[]
  }

  export type ViewportCreateWithoutProjectInput = {
    id?: string
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    imageAsset?: AssetCreateNestedOneWithoutViewportInput
  }

  export type ViewportUncheckedCreateWithoutProjectInput = {
    id?: string
    imageAssetId?: string | null
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ViewportCreateOrConnectWithoutProjectInput = {
    where: ViewportWhereUniqueInput
    create: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
  }

  export type BoardCreateWithoutProjectInput = {
    id?: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    asset?: AssetCreateNestedOneWithoutBoardsInput
  }

  export type BoardUncheckedCreateWithoutProjectInput = {
    id?: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BoardCreateOrConnectWithoutProjectInput = {
    where: BoardWhereUniqueInput
    create: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput>
  }

  export type BoardCreateManyProjectInputEnvelope = {
    data: BoardCreateManyProjectInput | BoardCreateManyProjectInput[]
  }

  export type RenderCreateWithoutProjectInput = {
    id?: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RenderUncheckedCreateWithoutProjectInput = {
    id?: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RenderCreateOrConnectWithoutProjectInput = {
    where: RenderWhereUniqueInput
    create: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput>
  }

  export type RenderCreateManyProjectInputEnvelope = {
    data: RenderCreateManyProjectInput | RenderCreateManyProjectInput[]
  }

  export type AiCallLogCreateWithoutProjectInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: AiCallLogCreateNestedOneWithoutChildrenInput
    children?: AiCallLogCreateNestedManyWithoutParentInput
  }

  export type AiCallLogUncheckedCreateWithoutProjectInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    parentId?: string | null
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: AiCallLogUncheckedCreateNestedManyWithoutParentInput
  }

  export type AiCallLogCreateOrConnectWithoutProjectInput = {
    where: AiCallLogWhereUniqueInput
    create: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput>
  }

  export type AiCallLogCreateManyProjectInputEnvelope = {
    data: AiCallLogCreateManyProjectInput | AiCallLogCreateManyProjectInput[]
  }

  export type ProjectSettingsUpsertWithoutProjectInput = {
    update: XOR<ProjectSettingsUpdateWithoutProjectInput, ProjectSettingsUncheckedUpdateWithoutProjectInput>
    create: XOR<ProjectSettingsCreateWithoutProjectInput, ProjectSettingsUncheckedCreateWithoutProjectInput>
    where?: ProjectSettingsWhereInput
  }

  export type ProjectSettingsUpdateToOneWithWhereWithoutProjectInput = {
    where?: ProjectSettingsWhereInput
    data: XOR<ProjectSettingsUpdateWithoutProjectInput, ProjectSettingsUncheckedUpdateWithoutProjectInput>
  }

  export type ProjectSettingsUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
  }

  export type ProjectSettingsUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    temperature?: FloatFieldUpdateOperationsInput | number
    voice?: StringFieldUpdateOperationsInput | string
    speakingRate?: FloatFieldUpdateOperationsInput | number
    pitch?: FloatFieldUpdateOperationsInput | number
    defaultQuality?: StringFieldUpdateOperationsInput | string
    defaultAspectRatio?: StringFieldUpdateOperationsInput | string
    musicTrackId?: NullableStringFieldUpdateOperationsInput | string | null
    musicVolume?: FloatFieldUpdateOperationsInput | number
  }

  export type ScriptUpsertWithoutProjectInput = {
    update: XOR<ScriptUpdateWithoutProjectInput, ScriptUncheckedUpdateWithoutProjectInput>
    create: XOR<ScriptCreateWithoutProjectInput, ScriptUncheckedCreateWithoutProjectInput>
    where?: ScriptWhereInput
  }

  export type ScriptUpdateToOneWithWhereWithoutProjectInput = {
    where?: ScriptWhereInput
    data: XOR<ScriptUpdateWithoutProjectInput, ScriptUncheckedUpdateWithoutProjectInput>
  }

  export type ScriptUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blueprint?: BlueprintUpdateOneWithoutScriptsNestedInput
  }

  export type ScriptUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintUpsertWithWhereUniqueWithoutProjectInput = {
    where: BlueprintWhereUniqueInput
    update: XOR<BlueprintUpdateWithoutProjectInput, BlueprintUncheckedUpdateWithoutProjectInput>
    create: XOR<BlueprintCreateWithoutProjectInput, BlueprintUncheckedCreateWithoutProjectInput>
  }

  export type BlueprintUpdateWithWhereUniqueWithoutProjectInput = {
    where: BlueprintWhereUniqueInput
    data: XOR<BlueprintUpdateWithoutProjectInput, BlueprintUncheckedUpdateWithoutProjectInput>
  }

  export type BlueprintUpdateManyWithWhereWithoutProjectInput = {
    where: BlueprintScalarWhereInput
    data: XOR<BlueprintUpdateManyMutationInput, BlueprintUncheckedUpdateManyWithoutProjectInput>
  }

  export type BlueprintScalarWhereInput = {
    AND?: BlueprintScalarWhereInput | BlueprintScalarWhereInput[]
    OR?: BlueprintScalarWhereInput[]
    NOT?: BlueprintScalarWhereInput | BlueprintScalarWhereInput[]
    id?: StringFilter<"Blueprint"> | string
    projectId?: StringFilter<"Blueprint"> | string
    version?: IntFilter<"Blueprint"> | number
    targetDurationMs?: IntFilter<"Blueprint"> | number
    status?: EnumBlueprintStatusFilter<"Blueprint"> | $Enums.BlueprintStatus
    beats?: JsonFilter<"Blueprint">
    rejectionNotes?: StringNullableFilter<"Blueprint"> | string | null
    createdAt?: DateTimeFilter<"Blueprint"> | Date | string
    updatedAt?: DateTimeFilter<"Blueprint"> | Date | string
  }

  export type AssetUpsertWithWhereUniqueWithoutProjectInput = {
    where: AssetWhereUniqueInput
    update: XOR<AssetUpdateWithoutProjectInput, AssetUncheckedUpdateWithoutProjectInput>
    create: XOR<AssetCreateWithoutProjectInput, AssetUncheckedCreateWithoutProjectInput>
  }

  export type AssetUpdateWithWhereUniqueWithoutProjectInput = {
    where: AssetWhereUniqueInput
    data: XOR<AssetUpdateWithoutProjectInput, AssetUncheckedUpdateWithoutProjectInput>
  }

  export type AssetUpdateManyWithWhereWithoutProjectInput = {
    where: AssetScalarWhereInput
    data: XOR<AssetUpdateManyMutationInput, AssetUncheckedUpdateManyWithoutProjectInput>
  }

  export type AssetScalarWhereInput = {
    AND?: AssetScalarWhereInput | AssetScalarWhereInput[]
    OR?: AssetScalarWhereInput[]
    NOT?: AssetScalarWhereInput | AssetScalarWhereInput[]
    id?: StringFilter<"Asset"> | string
    projectId?: StringFilter<"Asset"> | string
    type?: EnumAssetTypeFilter<"Asset"> | $Enums.AssetType
    filename?: StringFilter<"Asset"> | string
    path?: StringFilter<"Asset"> | string
    metadata?: JsonNullableFilter<"Asset">
    upscaled?: BoolFilter<"Asset"> | boolean
    upscaledPath?: StringNullableFilter<"Asset"> | string | null
    createdAt?: DateTimeFilter<"Asset"> | Date | string
  }

  export type ViewportUpsertWithoutProjectInput = {
    update: XOR<ViewportUpdateWithoutProjectInput, ViewportUncheckedUpdateWithoutProjectInput>
    create: XOR<ViewportCreateWithoutProjectInput, ViewportUncheckedCreateWithoutProjectInput>
    where?: ViewportWhereInput
  }

  export type ViewportUpdateToOneWithWhereWithoutProjectInput = {
    where?: ViewportWhereInput
    data: XOR<ViewportUpdateWithoutProjectInput, ViewportUncheckedUpdateWithoutProjectInput>
  }

  export type ViewportUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageAsset?: AssetUpdateOneWithoutViewportNestedInput
  }

  export type ViewportUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUpsertWithWhereUniqueWithoutProjectInput = {
    where: BoardWhereUniqueInput
    update: XOR<BoardUpdateWithoutProjectInput, BoardUncheckedUpdateWithoutProjectInput>
    create: XOR<BoardCreateWithoutProjectInput, BoardUncheckedCreateWithoutProjectInput>
  }

  export type BoardUpdateWithWhereUniqueWithoutProjectInput = {
    where: BoardWhereUniqueInput
    data: XOR<BoardUpdateWithoutProjectInput, BoardUncheckedUpdateWithoutProjectInput>
  }

  export type BoardUpdateManyWithWhereWithoutProjectInput = {
    where: BoardScalarWhereInput
    data: XOR<BoardUpdateManyMutationInput, BoardUncheckedUpdateManyWithoutProjectInput>
  }

  export type BoardScalarWhereInput = {
    AND?: BoardScalarWhereInput | BoardScalarWhereInput[]
    OR?: BoardScalarWhereInput[]
    NOT?: BoardScalarWhereInput | BoardScalarWhereInput[]
    id?: StringFilter<"Board"> | string
    projectId?: StringFilter<"Board"> | string
    index?: IntFilter<"Board"> | number
    layout?: JsonFilter<"Board">
    regions?: JsonFilter<"Board">
    triggers?: JsonNullableFilter<"Board">
    plan?: JsonNullableFilter<"Board">
    prompts?: JsonNullableFilter<"Board">
    assetId?: StringNullableFilter<"Board"> | string | null
    createdAt?: DateTimeFilter<"Board"> | Date | string
    updatedAt?: DateTimeFilter<"Board"> | Date | string
  }

  export type RenderUpsertWithWhereUniqueWithoutProjectInput = {
    where: RenderWhereUniqueInput
    update: XOR<RenderUpdateWithoutProjectInput, RenderUncheckedUpdateWithoutProjectInput>
    create: XOR<RenderCreateWithoutProjectInput, RenderUncheckedCreateWithoutProjectInput>
  }

  export type RenderUpdateWithWhereUniqueWithoutProjectInput = {
    where: RenderWhereUniqueInput
    data: XOR<RenderUpdateWithoutProjectInput, RenderUncheckedUpdateWithoutProjectInput>
  }

  export type RenderUpdateManyWithWhereWithoutProjectInput = {
    where: RenderScalarWhereInput
    data: XOR<RenderUpdateManyMutationInput, RenderUncheckedUpdateManyWithoutProjectInput>
  }

  export type RenderScalarWhereInput = {
    AND?: RenderScalarWhereInput | RenderScalarWhereInput[]
    OR?: RenderScalarWhereInput[]
    NOT?: RenderScalarWhereInput | RenderScalarWhereInput[]
    id?: StringFilter<"Render"> | string
    projectId?: StringFilter<"Render"> | string
    quality?: EnumRenderQualityFilter<"Render"> | $Enums.RenderQuality
    status?: EnumRenderStatusFilter<"Render"> | $Enums.RenderStatus
    progress?: FloatFilter<"Render"> | number
    outputPath?: StringNullableFilter<"Render"> | string | null
    error?: StringNullableFilter<"Render"> | string | null
    startedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Render"> | Date | string | null
    createdAt?: DateTimeFilter<"Render"> | Date | string
  }

  export type AiCallLogUpsertWithWhereUniqueWithoutProjectInput = {
    where: AiCallLogWhereUniqueInput
    update: XOR<AiCallLogUpdateWithoutProjectInput, AiCallLogUncheckedUpdateWithoutProjectInput>
    create: XOR<AiCallLogCreateWithoutProjectInput, AiCallLogUncheckedCreateWithoutProjectInput>
  }

  export type AiCallLogUpdateWithWhereUniqueWithoutProjectInput = {
    where: AiCallLogWhereUniqueInput
    data: XOR<AiCallLogUpdateWithoutProjectInput, AiCallLogUncheckedUpdateWithoutProjectInput>
  }

  export type AiCallLogUpdateManyWithWhereWithoutProjectInput = {
    where: AiCallLogScalarWhereInput
    data: XOR<AiCallLogUpdateManyMutationInput, AiCallLogUncheckedUpdateManyWithoutProjectInput>
  }

  export type AiCallLogScalarWhereInput = {
    AND?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
    OR?: AiCallLogScalarWhereInput[]
    NOT?: AiCallLogScalarWhereInput | AiCallLogScalarWhereInput[]
    id?: StringFilter<"AiCallLog"> | string
    projectId?: StringFilter<"AiCallLog"> | string
    provider?: StringFilter<"AiCallLog"> | string
    model?: StringNullableFilter<"AiCallLog"> | string | null
    operation?: StringFilter<"AiCallLog"> | string
    parentId?: StringNullableFilter<"AiCallLog"> | string | null
    prompt?: StringFilter<"AiCallLog"> | string
    promptTokens?: IntNullableFilter<"AiCallLog"> | number | null
    response?: StringNullableFilter<"AiCallLog"> | string | null
    responseTokens?: IntNullableFilter<"AiCallLog"> | number | null
    status?: EnumAiCallStatusFilter<"AiCallLog"> | $Enums.AiCallStatus
    startedAt?: DateTimeFilter<"AiCallLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"AiCallLog"> | Date | string | null
    durationMs?: IntNullableFilter<"AiCallLog"> | number | null
    errorMessage?: StringNullableFilter<"AiCallLog"> | string | null
    errorCode?: StringNullableFilter<"AiCallLog"> | string | null
    retryCount?: IntFilter<"AiCallLog"> | number
    metadata?: JsonNullableFilter<"AiCallLog">
    createdAt?: DateTimeFilter<"AiCallLog"> | Date | string
    updatedAt?: DateTimeFilter<"AiCallLog"> | Date | string
  }

  export type ProjectCreateWithoutSettingsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutSettingsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutSettingsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutSettingsInput, ProjectUncheckedCreateWithoutSettingsInput>
  }

  export type ProjectUpsertWithoutSettingsInput = {
    update: XOR<ProjectUpdateWithoutSettingsInput, ProjectUncheckedUpdateWithoutSettingsInput>
    create: XOR<ProjectCreateWithoutSettingsInput, ProjectUncheckedCreateWithoutSettingsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutSettingsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutSettingsInput, ProjectUncheckedUpdateWithoutSettingsInput>
  }

  export type ProjectUpdateWithoutSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectCreateWithoutScriptInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutScriptInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutScriptInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutScriptInput, ProjectUncheckedCreateWithoutScriptInput>
  }

  export type BlueprintCreateWithoutScriptsInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBlueprintsInput
    scriptDrafts?: ScriptDraftCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateWithoutScriptsInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scriptDrafts?: ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintCreateOrConnectWithoutScriptsInput = {
    where: BlueprintWhereUniqueInput
    create: XOR<BlueprintCreateWithoutScriptsInput, BlueprintUncheckedCreateWithoutScriptsInput>
  }

  export type ProjectUpsertWithoutScriptInput = {
    update: XOR<ProjectUpdateWithoutScriptInput, ProjectUncheckedUpdateWithoutScriptInput>
    create: XOR<ProjectCreateWithoutScriptInput, ProjectUncheckedCreateWithoutScriptInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutScriptInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutScriptInput, ProjectUncheckedUpdateWithoutScriptInput>
  }

  export type ProjectUpdateWithoutScriptInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutScriptInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type BlueprintUpsertWithoutScriptsInput = {
    update: XOR<BlueprintUpdateWithoutScriptsInput, BlueprintUncheckedUpdateWithoutScriptsInput>
    create: XOR<BlueprintCreateWithoutScriptsInput, BlueprintUncheckedCreateWithoutScriptsInput>
    where?: BlueprintWhereInput
  }

  export type BlueprintUpdateToOneWithWhereWithoutScriptsInput = {
    where?: BlueprintWhereInput
    data: XOR<BlueprintUpdateWithoutScriptsInput, BlueprintUncheckedUpdateWithoutScriptsInput>
  }

  export type BlueprintUpdateWithoutScriptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBlueprintsNestedInput
    scriptDrafts?: ScriptDraftUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateWithoutScriptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scriptDrafts?: ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type ProjectCreateWithoutAssetsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutAssetsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutAssetsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutAssetsInput, ProjectUncheckedCreateWithoutAssetsInput>
  }

  export type ViewportCreateWithoutImageAssetInput = {
    id?: string
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutViewportInput
  }

  export type ViewportUncheckedCreateWithoutImageAssetInput = {
    id?: string
    projectId: string
    keyframes: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ViewportCreateOrConnectWithoutImageAssetInput = {
    where: ViewportWhereUniqueInput
    create: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
  }

  export type BoardCreateWithoutAssetInput = {
    id?: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBoardsInput
  }

  export type BoardUncheckedCreateWithoutAssetInput = {
    id?: string
    projectId: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BoardCreateOrConnectWithoutAssetInput = {
    where: BoardWhereUniqueInput
    create: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput>
  }

  export type BoardCreateManyAssetInputEnvelope = {
    data: BoardCreateManyAssetInput | BoardCreateManyAssetInput[]
  }

  export type ProjectUpsertWithoutAssetsInput = {
    update: XOR<ProjectUpdateWithoutAssetsInput, ProjectUncheckedUpdateWithoutAssetsInput>
    create: XOR<ProjectCreateWithoutAssetsInput, ProjectUncheckedCreateWithoutAssetsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutAssetsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutAssetsInput, ProjectUncheckedUpdateWithoutAssetsInput>
  }

  export type ProjectUpdateWithoutAssetsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutAssetsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ViewportUpsertWithoutImageAssetInput = {
    update: XOR<ViewportUpdateWithoutImageAssetInput, ViewportUncheckedUpdateWithoutImageAssetInput>
    create: XOR<ViewportCreateWithoutImageAssetInput, ViewportUncheckedCreateWithoutImageAssetInput>
    where?: ViewportWhereInput
  }

  export type ViewportUpdateToOneWithWhereWithoutImageAssetInput = {
    where?: ViewportWhereInput
    data: XOR<ViewportUpdateWithoutImageAssetInput, ViewportUncheckedUpdateWithoutImageAssetInput>
  }

  export type ViewportUpdateWithoutImageAssetInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutViewportNestedInput
  }

  export type ViewportUncheckedUpdateWithoutImageAssetInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    keyframes?: JsonNullValueInput | InputJsonValue
    regions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUpsertWithWhereUniqueWithoutAssetInput = {
    where: BoardWhereUniqueInput
    update: XOR<BoardUpdateWithoutAssetInput, BoardUncheckedUpdateWithoutAssetInput>
    create: XOR<BoardCreateWithoutAssetInput, BoardUncheckedCreateWithoutAssetInput>
  }

  export type BoardUpdateWithWhereUniqueWithoutAssetInput = {
    where: BoardWhereUniqueInput
    data: XOR<BoardUpdateWithoutAssetInput, BoardUncheckedUpdateWithoutAssetInput>
  }

  export type BoardUpdateManyWithWhereWithoutAssetInput = {
    where: BoardScalarWhereInput
    data: XOR<BoardUpdateManyMutationInput, BoardUncheckedUpdateManyWithoutAssetInput>
  }

  export type ProjectCreateWithoutRendersInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutRendersInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutRendersInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutRendersInput, ProjectUncheckedCreateWithoutRendersInput>
  }

  export type ProjectUpsertWithoutRendersInput = {
    update: XOR<ProjectUpdateWithoutRendersInput, ProjectUncheckedUpdateWithoutRendersInput>
    create: XOR<ProjectCreateWithoutRendersInput, ProjectUncheckedCreateWithoutRendersInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutRendersInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutRendersInput, ProjectUncheckedUpdateWithoutRendersInput>
  }

  export type ProjectUpdateWithoutRendersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutRendersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectCreateWithoutAiCallLogsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutAiCallLogsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutAiCallLogsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutAiCallLogsInput, ProjectUncheckedCreateWithoutAiCallLogsInput>
  }

  export type AiCallLogCreateWithoutChildrenInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutAiCallLogsInput
    parent?: AiCallLogCreateNestedOneWithoutChildrenInput
  }

  export type AiCallLogUncheckedCreateWithoutChildrenInput = {
    id?: string
    projectId: string
    provider: string
    model?: string | null
    operation: string
    parentId?: string | null
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AiCallLogCreateOrConnectWithoutChildrenInput = {
    where: AiCallLogWhereUniqueInput
    create: XOR<AiCallLogCreateWithoutChildrenInput, AiCallLogUncheckedCreateWithoutChildrenInput>
  }

  export type AiCallLogCreateWithoutParentInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutAiCallLogsInput
    children?: AiCallLogCreateNestedManyWithoutParentInput
  }

  export type AiCallLogUncheckedCreateWithoutParentInput = {
    id?: string
    projectId: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: AiCallLogUncheckedCreateNestedManyWithoutParentInput
  }

  export type AiCallLogCreateOrConnectWithoutParentInput = {
    where: AiCallLogWhereUniqueInput
    create: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput>
  }

  export type AiCallLogCreateManyParentInputEnvelope = {
    data: AiCallLogCreateManyParentInput | AiCallLogCreateManyParentInput[]
  }

  export type ProjectUpsertWithoutAiCallLogsInput = {
    update: XOR<ProjectUpdateWithoutAiCallLogsInput, ProjectUncheckedUpdateWithoutAiCallLogsInput>
    create: XOR<ProjectCreateWithoutAiCallLogsInput, ProjectUncheckedCreateWithoutAiCallLogsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutAiCallLogsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutAiCallLogsInput, ProjectUncheckedUpdateWithoutAiCallLogsInput>
  }

  export type ProjectUpdateWithoutAiCallLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutAiCallLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type AiCallLogUpsertWithoutChildrenInput = {
    update: XOR<AiCallLogUpdateWithoutChildrenInput, AiCallLogUncheckedUpdateWithoutChildrenInput>
    create: XOR<AiCallLogCreateWithoutChildrenInput, AiCallLogUncheckedCreateWithoutChildrenInput>
    where?: AiCallLogWhereInput
  }

  export type AiCallLogUpdateToOneWithWhereWithoutChildrenInput = {
    where?: AiCallLogWhereInput
    data: XOR<AiCallLogUpdateWithoutChildrenInput, AiCallLogUncheckedUpdateWithoutChildrenInput>
  }

  export type AiCallLogUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAiCallLogsNestedInput
    parent?: AiCallLogUpdateOneWithoutChildrenNestedInput
  }

  export type AiCallLogUncheckedUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiCallLogUpsertWithWhereUniqueWithoutParentInput = {
    where: AiCallLogWhereUniqueInput
    update: XOR<AiCallLogUpdateWithoutParentInput, AiCallLogUncheckedUpdateWithoutParentInput>
    create: XOR<AiCallLogCreateWithoutParentInput, AiCallLogUncheckedCreateWithoutParentInput>
  }

  export type AiCallLogUpdateWithWhereUniqueWithoutParentInput = {
    where: AiCallLogWhereUniqueInput
    data: XOR<AiCallLogUpdateWithoutParentInput, AiCallLogUncheckedUpdateWithoutParentInput>
  }

  export type AiCallLogUpdateManyWithWhereWithoutParentInput = {
    where: AiCallLogScalarWhereInput
    data: XOR<AiCallLogUpdateManyMutationInput, AiCallLogUncheckedUpdateManyWithoutParentInput>
  }

  export type ProjectCreateWithoutViewportInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutViewportInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutViewportInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutViewportInput, ProjectUncheckedCreateWithoutViewportInput>
  }

  export type AssetCreateWithoutViewportInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    project: ProjectCreateNestedOneWithoutAssetsInput
    boards?: BoardCreateNestedManyWithoutAssetInput
  }

  export type AssetUncheckedCreateWithoutViewportInput = {
    id?: string
    projectId: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    boards?: BoardUncheckedCreateNestedManyWithoutAssetInput
  }

  export type AssetCreateOrConnectWithoutViewportInput = {
    where: AssetWhereUniqueInput
    create: XOR<AssetCreateWithoutViewportInput, AssetUncheckedCreateWithoutViewportInput>
  }

  export type ProjectUpsertWithoutViewportInput = {
    update: XOR<ProjectUpdateWithoutViewportInput, ProjectUncheckedUpdateWithoutViewportInput>
    create: XOR<ProjectCreateWithoutViewportInput, ProjectUncheckedCreateWithoutViewportInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutViewportInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutViewportInput, ProjectUncheckedUpdateWithoutViewportInput>
  }

  export type ProjectUpdateWithoutViewportInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutViewportInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type AssetUpsertWithoutViewportInput = {
    update: XOR<AssetUpdateWithoutViewportInput, AssetUncheckedUpdateWithoutViewportInput>
    create: XOR<AssetCreateWithoutViewportInput, AssetUncheckedCreateWithoutViewportInput>
    where?: AssetWhereInput
  }

  export type AssetUpdateToOneWithWhereWithoutViewportInput = {
    where?: AssetWhereInput
    data: XOR<AssetUpdateWithoutViewportInput, AssetUncheckedUpdateWithoutViewportInput>
  }

  export type AssetUpdateWithoutViewportInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAssetsNestedInput
    boards?: BoardUpdateManyWithoutAssetNestedInput
  }

  export type AssetUncheckedUpdateWithoutViewportInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    boards?: BoardUncheckedUpdateManyWithoutAssetNestedInput
  }

  export type ProjectCreateWithoutBoardsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintCreateNestedManyWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutBoardsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    blueprints?: BlueprintUncheckedCreateNestedManyWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutBoardsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutBoardsInput, ProjectUncheckedCreateWithoutBoardsInput>
  }

  export type AssetCreateWithoutBoardsInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    project: ProjectCreateNestedOneWithoutAssetsInput
    viewport?: ViewportCreateNestedOneWithoutImageAssetInput
  }

  export type AssetUncheckedCreateWithoutBoardsInput = {
    id?: string
    projectId: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
    viewport?: ViewportUncheckedCreateNestedOneWithoutImageAssetInput
  }

  export type AssetCreateOrConnectWithoutBoardsInput = {
    where: AssetWhereUniqueInput
    create: XOR<AssetCreateWithoutBoardsInput, AssetUncheckedCreateWithoutBoardsInput>
  }

  export type ProjectUpsertWithoutBoardsInput = {
    update: XOR<ProjectUpdateWithoutBoardsInput, ProjectUncheckedUpdateWithoutBoardsInput>
    create: XOR<ProjectCreateWithoutBoardsInput, ProjectUncheckedCreateWithoutBoardsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutBoardsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutBoardsInput, ProjectUncheckedUpdateWithoutBoardsInput>
  }

  export type ProjectUpdateWithoutBoardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUpdateManyWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutBoardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    blueprints?: BlueprintUncheckedUpdateManyWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type AssetUpsertWithoutBoardsInput = {
    update: XOR<AssetUpdateWithoutBoardsInput, AssetUncheckedUpdateWithoutBoardsInput>
    create: XOR<AssetCreateWithoutBoardsInput, AssetUncheckedCreateWithoutBoardsInput>
    where?: AssetWhereInput
  }

  export type AssetUpdateToOneWithWhereWithoutBoardsInput = {
    where?: AssetWhereInput
    data: XOR<AssetUpdateWithoutBoardsInput, AssetUncheckedUpdateWithoutBoardsInput>
  }

  export type AssetUpdateWithoutBoardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAssetsNestedInput
    viewport?: ViewportUpdateOneWithoutImageAssetNestedInput
  }

  export type AssetUncheckedUpdateWithoutBoardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    viewport?: ViewportUncheckedUpdateOneWithoutImageAssetNestedInput
  }

  export type ProjectCreateWithoutBlueprintsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsCreateNestedOneWithoutProjectInput
    script?: ScriptCreateNestedOneWithoutProjectInput
    assets?: AssetCreateNestedManyWithoutProjectInput
    viewport?: ViewportCreateNestedOneWithoutProjectInput
    boards?: BoardCreateNestedManyWithoutProjectInput
    renders?: RenderCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutBlueprintsInput = {
    id?: string
    name: string
    topic?: string | null
    status?: $Enums.ProjectStatus
    aspectRatio?: string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedCreateNestedOneWithoutProjectInput
    script?: ScriptUncheckedCreateNestedOneWithoutProjectInput
    assets?: AssetUncheckedCreateNestedManyWithoutProjectInput
    viewport?: ViewportUncheckedCreateNestedOneWithoutProjectInput
    boards?: BoardUncheckedCreateNestedManyWithoutProjectInput
    renders?: RenderUncheckedCreateNestedManyWithoutProjectInput
    aiCallLogs?: AiCallLogUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutBlueprintsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutBlueprintsInput, ProjectUncheckedCreateWithoutBlueprintsInput>
  }

  export type ScriptCreateWithoutBlueprintInput = {
    id?: string
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutScriptInput
  }

  export type ScriptUncheckedCreateWithoutBlueprintInput = {
    id?: string
    projectId: string
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptCreateOrConnectWithoutBlueprintInput = {
    where: ScriptWhereUniqueInput
    create: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptCreateManyBlueprintInputEnvelope = {
    data: ScriptCreateManyBlueprintInput | ScriptCreateManyBlueprintInput[]
  }

  export type ScriptDraftCreateWithoutBlueprintInput = {
    id?: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    histories?: ScriptDraftHistoryCreateNestedManyWithoutScriptDraftInput
  }

  export type ScriptDraftUncheckedCreateWithoutBlueprintInput = {
    id?: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    histories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutScriptDraftInput
  }

  export type ScriptDraftCreateOrConnectWithoutBlueprintInput = {
    where: ScriptDraftWhereUniqueInput
    create: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptDraftCreateManyBlueprintInputEnvelope = {
    data: ScriptDraftCreateManyBlueprintInput | ScriptDraftCreateManyBlueprintInput[]
  }

  export type BlueprintHistoryCreateWithoutBlueprintInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type BlueprintHistoryUncheckedCreateWithoutBlueprintInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type BlueprintHistoryCreateOrConnectWithoutBlueprintInput = {
    where: BlueprintHistoryWhereUniqueInput
    create: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput>
  }

  export type BlueprintHistoryCreateManyBlueprintInputEnvelope = {
    data: BlueprintHistoryCreateManyBlueprintInput | BlueprintHistoryCreateManyBlueprintInput[]
  }

  export type ScriptDraftHistoryCreateWithoutBlueprintInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    scriptDraft: ScriptDraftCreateNestedOneWithoutHistoriesInput
  }

  export type ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput = {
    id?: string
    scriptDraftId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryCreateOrConnectWithoutBlueprintInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    create: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptDraftHistoryCreateManyBlueprintInputEnvelope = {
    data: ScriptDraftHistoryCreateManyBlueprintInput | ScriptDraftHistoryCreateManyBlueprintInput[]
  }

  export type ProjectUpsertWithoutBlueprintsInput = {
    update: XOR<ProjectUpdateWithoutBlueprintsInput, ProjectUncheckedUpdateWithoutBlueprintsInput>
    create: XOR<ProjectCreateWithoutBlueprintsInput, ProjectUncheckedCreateWithoutBlueprintsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutBlueprintsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutBlueprintsInput, ProjectUncheckedUpdateWithoutBlueprintsInput>
  }

  export type ProjectUpdateWithoutBlueprintsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUpdateOneWithoutProjectNestedInput
    script?: ScriptUpdateOneWithoutProjectNestedInput
    assets?: AssetUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUpdateOneWithoutProjectNestedInput
    boards?: BoardUpdateManyWithoutProjectNestedInput
    renders?: RenderUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutBlueprintsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProjectStatusFieldUpdateOperationsInput | $Enums.ProjectStatus
    aspectRatio?: StringFieldUpdateOperationsInput | string
    wizardProgress?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assetMappings?: NullableJsonNullValueInput | InputJsonValue
    settings?: ProjectSettingsUncheckedUpdateOneWithoutProjectNestedInput
    script?: ScriptUncheckedUpdateOneWithoutProjectNestedInput
    assets?: AssetUncheckedUpdateManyWithoutProjectNestedInput
    viewport?: ViewportUncheckedUpdateOneWithoutProjectNestedInput
    boards?: BoardUncheckedUpdateManyWithoutProjectNestedInput
    renders?: RenderUncheckedUpdateManyWithoutProjectNestedInput
    aiCallLogs?: AiCallLogUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ScriptUpsertWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptWhereUniqueInput
    update: XOR<ScriptUpdateWithoutBlueprintInput, ScriptUncheckedUpdateWithoutBlueprintInput>
    create: XOR<ScriptCreateWithoutBlueprintInput, ScriptUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptUpdateWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptWhereUniqueInput
    data: XOR<ScriptUpdateWithoutBlueprintInput, ScriptUncheckedUpdateWithoutBlueprintInput>
  }

  export type ScriptUpdateManyWithWhereWithoutBlueprintInput = {
    where: ScriptScalarWhereInput
    data: XOR<ScriptUpdateManyMutationInput, ScriptUncheckedUpdateManyWithoutBlueprintInput>
  }

  export type ScriptScalarWhereInput = {
    AND?: ScriptScalarWhereInput | ScriptScalarWhereInput[]
    OR?: ScriptScalarWhereInput[]
    NOT?: ScriptScalarWhereInput | ScriptScalarWhereInput[]
    id?: StringFilter<"Script"> | string
    projectId?: StringFilter<"Script"> | string
    blueprintId?: StringNullableFilter<"Script"> | string | null
    title?: StringFilter<"Script"> | string
    segments?: JsonFilter<"Script">
    timestamps?: JsonNullableFilter<"Script">
    createdAt?: DateTimeFilter<"Script"> | Date | string
    updatedAt?: DateTimeFilter<"Script"> | Date | string
  }

  export type ScriptDraftUpsertWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptDraftWhereUniqueInput
    update: XOR<ScriptDraftUpdateWithoutBlueprintInput, ScriptDraftUncheckedUpdateWithoutBlueprintInput>
    create: XOR<ScriptDraftCreateWithoutBlueprintInput, ScriptDraftUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptDraftUpdateWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptDraftWhereUniqueInput
    data: XOR<ScriptDraftUpdateWithoutBlueprintInput, ScriptDraftUncheckedUpdateWithoutBlueprintInput>
  }

  export type ScriptDraftUpdateManyWithWhereWithoutBlueprintInput = {
    where: ScriptDraftScalarWhereInput
    data: XOR<ScriptDraftUpdateManyMutationInput, ScriptDraftUncheckedUpdateManyWithoutBlueprintInput>
  }

  export type ScriptDraftScalarWhereInput = {
    AND?: ScriptDraftScalarWhereInput | ScriptDraftScalarWhereInput[]
    OR?: ScriptDraftScalarWhereInput[]
    NOT?: ScriptDraftScalarWhereInput | ScriptDraftScalarWhereInput[]
    id?: StringFilter<"ScriptDraft"> | string
    blueprintId?: StringFilter<"ScriptDraft"> | string
    version?: IntFilter<"ScriptDraft"> | number
    status?: EnumScriptDraftStatusFilter<"ScriptDraft"> | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFilter<"ScriptDraft"> | number
    beatDrafts?: JsonFilter<"ScriptDraft">
    glueIssues?: JsonNullableFilter<"ScriptDraft">
    polishedText?: StringNullableFilter<"ScriptDraft"> | string | null
    createdAt?: DateTimeFilter<"ScriptDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ScriptDraft"> | Date | string
  }

  export type BlueprintHistoryUpsertWithWhereUniqueWithoutBlueprintInput = {
    where: BlueprintHistoryWhereUniqueInput
    update: XOR<BlueprintHistoryUpdateWithoutBlueprintInput, BlueprintHistoryUncheckedUpdateWithoutBlueprintInput>
    create: XOR<BlueprintHistoryCreateWithoutBlueprintInput, BlueprintHistoryUncheckedCreateWithoutBlueprintInput>
  }

  export type BlueprintHistoryUpdateWithWhereUniqueWithoutBlueprintInput = {
    where: BlueprintHistoryWhereUniqueInput
    data: XOR<BlueprintHistoryUpdateWithoutBlueprintInput, BlueprintHistoryUncheckedUpdateWithoutBlueprintInput>
  }

  export type BlueprintHistoryUpdateManyWithWhereWithoutBlueprintInput = {
    where: BlueprintHistoryScalarWhereInput
    data: XOR<BlueprintHistoryUpdateManyMutationInput, BlueprintHistoryUncheckedUpdateManyWithoutBlueprintInput>
  }

  export type BlueprintHistoryScalarWhereInput = {
    AND?: BlueprintHistoryScalarWhereInput | BlueprintHistoryScalarWhereInput[]
    OR?: BlueprintHistoryScalarWhereInput[]
    NOT?: BlueprintHistoryScalarWhereInput | BlueprintHistoryScalarWhereInput[]
    id?: StringFilter<"BlueprintHistory"> | string
    blueprintId?: StringFilter<"BlueprintHistory"> | string
    version?: IntFilter<"BlueprintHistory"> | number
    event?: StringFilter<"BlueprintHistory"> | string
    snapshot?: JsonFilter<"BlueprintHistory">
    createdAt?: DateTimeFilter<"BlueprintHistory"> | Date | string
  }

  export type ScriptDraftHistoryUpsertWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    update: XOR<ScriptDraftHistoryUpdateWithoutBlueprintInput, ScriptDraftHistoryUncheckedUpdateWithoutBlueprintInput>
    create: XOR<ScriptDraftHistoryCreateWithoutBlueprintInput, ScriptDraftHistoryUncheckedCreateWithoutBlueprintInput>
  }

  export type ScriptDraftHistoryUpdateWithWhereUniqueWithoutBlueprintInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    data: XOR<ScriptDraftHistoryUpdateWithoutBlueprintInput, ScriptDraftHistoryUncheckedUpdateWithoutBlueprintInput>
  }

  export type ScriptDraftHistoryUpdateManyWithWhereWithoutBlueprintInput = {
    where: ScriptDraftHistoryScalarWhereInput
    data: XOR<ScriptDraftHistoryUpdateManyMutationInput, ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintInput>
  }

  export type ScriptDraftHistoryScalarWhereInput = {
    AND?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
    OR?: ScriptDraftHistoryScalarWhereInput[]
    NOT?: ScriptDraftHistoryScalarWhereInput | ScriptDraftHistoryScalarWhereInput[]
    id?: StringFilter<"ScriptDraftHistory"> | string
    scriptDraftId?: StringFilter<"ScriptDraftHistory"> | string
    blueprintId?: StringFilter<"ScriptDraftHistory"> | string
    version?: IntFilter<"ScriptDraftHistory"> | number
    event?: StringFilter<"ScriptDraftHistory"> | string
    snapshot?: JsonFilter<"ScriptDraftHistory">
    createdAt?: DateTimeFilter<"ScriptDraftHistory"> | Date | string
  }

  export type BlueprintCreateWithoutScriptDraftsInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBlueprintsInput
    scripts?: ScriptCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateWithoutScriptDraftsInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptUncheckedCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintCreateOrConnectWithoutScriptDraftsInput = {
    where: BlueprintWhereUniqueInput
    create: XOR<BlueprintCreateWithoutScriptDraftsInput, BlueprintUncheckedCreateWithoutScriptDraftsInput>
  }

  export type ScriptDraftHistoryCreateWithoutScriptDraftInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    blueprint: BlueprintCreateNestedOneWithoutDraftHistoriesInput
  }

  export type ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput = {
    id?: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryCreateOrConnectWithoutScriptDraftInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    create: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput>
  }

  export type ScriptDraftHistoryCreateManyScriptDraftInputEnvelope = {
    data: ScriptDraftHistoryCreateManyScriptDraftInput | ScriptDraftHistoryCreateManyScriptDraftInput[]
  }

  export type BlueprintUpsertWithoutScriptDraftsInput = {
    update: XOR<BlueprintUpdateWithoutScriptDraftsInput, BlueprintUncheckedUpdateWithoutScriptDraftsInput>
    create: XOR<BlueprintCreateWithoutScriptDraftsInput, BlueprintUncheckedCreateWithoutScriptDraftsInput>
    where?: BlueprintWhereInput
  }

  export type BlueprintUpdateToOneWithWhereWithoutScriptDraftsInput = {
    where?: BlueprintWhereInput
    data: XOR<BlueprintUpdateWithoutScriptDraftsInput, BlueprintUncheckedUpdateWithoutScriptDraftsInput>
  }

  export type BlueprintUpdateWithoutScriptDraftsInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBlueprintsNestedInput
    scripts?: ScriptUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateWithoutScriptDraftsInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUncheckedUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type ScriptDraftHistoryUpsertWithWhereUniqueWithoutScriptDraftInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    update: XOR<ScriptDraftHistoryUpdateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedUpdateWithoutScriptDraftInput>
    create: XOR<ScriptDraftHistoryCreateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedCreateWithoutScriptDraftInput>
  }

  export type ScriptDraftHistoryUpdateWithWhereUniqueWithoutScriptDraftInput = {
    where: ScriptDraftHistoryWhereUniqueInput
    data: XOR<ScriptDraftHistoryUpdateWithoutScriptDraftInput, ScriptDraftHistoryUncheckedUpdateWithoutScriptDraftInput>
  }

  export type ScriptDraftHistoryUpdateManyWithWhereWithoutScriptDraftInput = {
    where: ScriptDraftHistoryScalarWhereInput
    data: XOR<ScriptDraftHistoryUpdateManyMutationInput, ScriptDraftHistoryUncheckedUpdateManyWithoutScriptDraftInput>
  }

  export type BlueprintCreateWithoutHistoriesInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBlueprintsInput
    scripts?: ScriptCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateWithoutHistoriesInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptUncheckedCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput
    draftHistories?: ScriptDraftHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintCreateOrConnectWithoutHistoriesInput = {
    where: BlueprintWhereUniqueInput
    create: XOR<BlueprintCreateWithoutHistoriesInput, BlueprintUncheckedCreateWithoutHistoriesInput>
  }

  export type BlueprintUpsertWithoutHistoriesInput = {
    update: XOR<BlueprintUpdateWithoutHistoriesInput, BlueprintUncheckedUpdateWithoutHistoriesInput>
    create: XOR<BlueprintCreateWithoutHistoriesInput, BlueprintUncheckedCreateWithoutHistoriesInput>
    where?: BlueprintWhereInput
  }

  export type BlueprintUpdateToOneWithWhereWithoutHistoriesInput = {
    where?: BlueprintWhereInput
    data: XOR<BlueprintUpdateWithoutHistoriesInput, BlueprintUncheckedUpdateWithoutHistoriesInput>
  }

  export type BlueprintUpdateWithoutHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBlueprintsNestedInput
    scripts?: ScriptUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateWithoutHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUncheckedUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type ScriptDraftCreateWithoutHistoriesInput = {
    id?: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    blueprint: BlueprintCreateNestedOneWithoutScriptDraftsInput
  }

  export type ScriptDraftUncheckedCreateWithoutHistoriesInput = {
    id?: string
    blueprintId: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptDraftCreateOrConnectWithoutHistoriesInput = {
    where: ScriptDraftWhereUniqueInput
    create: XOR<ScriptDraftCreateWithoutHistoriesInput, ScriptDraftUncheckedCreateWithoutHistoriesInput>
  }

  export type BlueprintCreateWithoutDraftHistoriesInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    project: ProjectCreateNestedOneWithoutBlueprintsInput
    scripts?: ScriptCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintUncheckedCreateWithoutDraftHistoriesInput = {
    id?: string
    projectId: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scripts?: ScriptUncheckedCreateNestedManyWithoutBlueprintInput
    scriptDrafts?: ScriptDraftUncheckedCreateNestedManyWithoutBlueprintInput
    histories?: BlueprintHistoryUncheckedCreateNestedManyWithoutBlueprintInput
  }

  export type BlueprintCreateOrConnectWithoutDraftHistoriesInput = {
    where: BlueprintWhereUniqueInput
    create: XOR<BlueprintCreateWithoutDraftHistoriesInput, BlueprintUncheckedCreateWithoutDraftHistoriesInput>
  }

  export type ScriptDraftUpsertWithoutHistoriesInput = {
    update: XOR<ScriptDraftUpdateWithoutHistoriesInput, ScriptDraftUncheckedUpdateWithoutHistoriesInput>
    create: XOR<ScriptDraftCreateWithoutHistoriesInput, ScriptDraftUncheckedCreateWithoutHistoriesInput>
    where?: ScriptDraftWhereInput
  }

  export type ScriptDraftUpdateToOneWithWhereWithoutHistoriesInput = {
    where?: ScriptDraftWhereInput
    data: XOR<ScriptDraftUpdateWithoutHistoriesInput, ScriptDraftUncheckedUpdateWithoutHistoriesInput>
  }

  export type ScriptDraftUpdateWithoutHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blueprint?: BlueprintUpdateOneRequiredWithoutScriptDraftsNestedInput
  }

  export type ScriptDraftUncheckedUpdateWithoutHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintUpsertWithoutDraftHistoriesInput = {
    update: XOR<BlueprintUpdateWithoutDraftHistoriesInput, BlueprintUncheckedUpdateWithoutDraftHistoriesInput>
    create: XOR<BlueprintCreateWithoutDraftHistoriesInput, BlueprintUncheckedCreateWithoutDraftHistoriesInput>
    where?: BlueprintWhereInput
  }

  export type BlueprintUpdateToOneWithWhereWithoutDraftHistoriesInput = {
    where?: BlueprintWhereInput
    data: XOR<BlueprintUpdateWithoutDraftHistoriesInput, BlueprintUncheckedUpdateWithoutDraftHistoriesInput>
  }

  export type BlueprintUpdateWithoutDraftHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBlueprintsNestedInput
    scripts?: ScriptUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateWithoutDraftHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUncheckedUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintCreateManyProjectInput = {
    id?: string
    version?: number
    targetDurationMs: number
    status?: $Enums.BlueprintStatus
    beats: JsonNullValueInput | InputJsonValue
    rejectionNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AssetCreateManyProjectInput = {
    id?: string
    type: $Enums.AssetType
    filename: string
    path: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: boolean
    upscaledPath?: string | null
    createdAt?: Date | string
  }

  export type BoardCreateManyProjectInput = {
    id?: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RenderCreateManyProjectInput = {
    id?: string
    quality?: $Enums.RenderQuality
    status?: $Enums.RenderStatus
    progress?: number
    outputPath?: string | null
    error?: string | null
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type AiCallLogCreateManyProjectInput = {
    id?: string
    provider: string
    model?: string | null
    operation: string
    parentId?: string | null
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlueprintUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scripts?: ScriptUncheckedUpdateManyWithoutBlueprintNestedInput
    scriptDrafts?: ScriptDraftUncheckedUpdateManyWithoutBlueprintNestedInput
    histories?: BlueprintHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
    draftHistories?: ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintNestedInput
  }

  export type BlueprintUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    targetDurationMs?: IntFieldUpdateOperationsInput | number
    status?: EnumBlueprintStatusFieldUpdateOperationsInput | $Enums.BlueprintStatus
    beats?: JsonNullValueInput | InputJsonValue
    rejectionNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    viewport?: ViewportUpdateOneWithoutImageAssetNestedInput
    boards?: BoardUpdateManyWithoutAssetNestedInput
  }

  export type AssetUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    viewport?: ViewportUncheckedUpdateOneWithoutImageAssetNestedInput
    boards?: BoardUncheckedUpdateManyWithoutAssetNestedInput
  }

  export type AssetUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType
    filename?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    upscaled?: BoolFieldUpdateOperationsInput | boolean
    upscaledPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    asset?: AssetUpdateOneWithoutBoardsNestedInput
  }

  export type BoardUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RenderUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    quality?: EnumRenderQualityFieldUpdateOperationsInput | $Enums.RenderQuality
    status?: EnumRenderStatusFieldUpdateOperationsInput | $Enums.RenderStatus
    progress?: FloatFieldUpdateOperationsInput | number
    outputPath?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiCallLogUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: AiCallLogUpdateOneWithoutChildrenNestedInput
    children?: AiCallLogUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: AiCallLogUncheckedUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardCreateManyAssetInput = {
    id?: string
    projectId: string
    index: number
    layout: JsonNullValueInput | InputJsonValue
    regions: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BoardUpdateWithoutAssetInput = {
    id?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutBoardsNestedInput
  }

  export type BoardUncheckedUpdateWithoutAssetInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BoardUncheckedUpdateManyWithoutAssetInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    index?: IntFieldUpdateOperationsInput | number
    layout?: JsonNullValueInput | InputJsonValue
    regions?: JsonNullValueInput | InputJsonValue
    triggers?: NullableJsonNullValueInput | InputJsonValue
    plan?: NullableJsonNullValueInput | InputJsonValue
    prompts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiCallLogCreateManyParentInput = {
    id?: string
    projectId: string
    provider: string
    model?: string | null
    operation: string
    prompt: string
    promptTokens?: number | null
    response?: string | null
    responseTokens?: number | null
    status?: $Enums.AiCallStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    errorMessage?: string | null
    errorCode?: string | null
    retryCount?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AiCallLogUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutAiCallLogsNestedInput
    children?: AiCallLogUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: AiCallLogUncheckedUpdateManyWithoutParentNestedInput
  }

  export type AiCallLogUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    prompt?: StringFieldUpdateOperationsInput | string
    promptTokens?: NullableIntFieldUpdateOperationsInput | number | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    responseTokens?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumAiCallStatusFieldUpdateOperationsInput | $Enums.AiCallStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptCreateManyBlueprintInput = {
    id?: string
    projectId: string
    title: string
    segments: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ScriptDraftCreateManyBlueprintInput = {
    id?: string
    version?: number
    status?: $Enums.ScriptDraftStatus
    currentBeatIndex?: number
    beatDrafts: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlueprintHistoryCreateManyBlueprintInput = {
    id?: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryCreateManyBlueprintInput = {
    id?: string
    scriptDraftId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: ProjectUpdateOneRequiredWithoutScriptNestedInput
  }

  export type ScriptUncheckedUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptUncheckedUpdateManyWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    segments?: JsonNullValueInput | InputJsonValue
    timestamps?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    histories?: ScriptDraftHistoryUpdateManyWithoutScriptDraftNestedInput
  }

  export type ScriptDraftUncheckedUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    histories?: ScriptDraftHistoryUncheckedUpdateManyWithoutScriptDraftNestedInput
  }

  export type ScriptDraftUncheckedUpdateManyWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    status?: EnumScriptDraftStatusFieldUpdateOperationsInput | $Enums.ScriptDraftStatus
    currentBeatIndex?: IntFieldUpdateOperationsInput | number
    beatDrafts?: JsonNullValueInput | InputJsonValue
    glueIssues?: NullableJsonNullValueInput | InputJsonValue
    polishedText?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryUncheckedUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlueprintHistoryUncheckedUpdateManyWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scriptDraft?: ScriptDraftUpdateOneRequiredWithoutHistoriesNestedInput
  }

  export type ScriptDraftHistoryUncheckedUpdateWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    scriptDraftId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryUncheckedUpdateManyWithoutBlueprintInput = {
    id?: StringFieldUpdateOperationsInput | string
    scriptDraftId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryCreateManyScriptDraftInput = {
    id?: string
    blueprintId: string
    version: number
    event: string
    snapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ScriptDraftHistoryUpdateWithoutScriptDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blueprint?: BlueprintUpdateOneRequiredWithoutDraftHistoriesNestedInput
  }

  export type ScriptDraftHistoryUncheckedUpdateWithoutScriptDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScriptDraftHistoryUncheckedUpdateManyWithoutScriptDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    blueprintId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    event?: StringFieldUpdateOperationsInput | string
    snapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}