---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-gql'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

Could use some help with validating the notes and answering the questions commented in this gql request builder module. It implements a chaining pattern that iteratively returns more "populated" GqlQueryBuilder instances, finally returning a fully populated $gql instance, which is passed to useGql.ts. I'm mostly trying to trace how the $gql instance properties are transformed into a legal graphql query string, to be injected in the core POST request's "body" field. I see that query is used in toFormData() (as it must be for the resulting query string to be valid), but I can't really visualize it.

Example login request build:

```
export const login = $gql
.mutation('login')
    .setQuery({
    ...t.union<LoginOutput>()({
    User: {
        __typename: t.constant('User'),
        id: t.string,
        email: t.string,
        username: t.string,
        role: t.optional.oneOf(UserRole)!,
        confirmedAt: t.string,
    },
    ForbiddenError: {
        __typename: t.constant('ForbiddenError'),
        message: t.string,
    },
    }),
})
.setVariables<{ input: LoginInput }>({
    input: {
    usernameOrEmail: t.string,
    password: t.string,
    },
})
.build();
```

$gql.ts, the builder module with my notes and questions:

```
import { cloneDeep, isObject, isString, isUndefined, toPath } from "lodash";

import { extractFiles } from "extract-files";
import { GraphQLError } from "graphql";

// used to create the request body's query string from params.
import { mutation, onUnion, params, query, rawString } from "typed-graphqlify";
import { Params } from "typed-graphqlify/dist/render";

/* in /api/src/server/api/ApiServer.ts, the "withGraphQL" middleware takes option "schema" -- built from generateSchema.ts and passed down from entrypoints/api.ts -- which encapsulates all resolvers and mounts them to /graphql, which maps a request to the correct resolver via the name (e.g., "login") specified in the request body's query string (formed by queries:$gql.ts, then passed to *Ctx:useGql (exposed to client via use*), which wraps useReq.)
*/

import { GRAPHQL_URI } from ".";
import { OnlyKey } from "../../util/types";
import { UnknownError } from "../errors";
import { Mutation, Query } from "./graphqlTypes";
import * as helpers from "./helpers";
import { ObjectPath } from "./ObjectPath";
import { t } from "./t";
import { StrictSelection } from "./types";

// =========================================
//                 TYPES
// =========================================

export type Root = Query | Mutation;
export type Fields<T extends Root> = keyof T;
export type Compiler = typeof query | typeof mutation;
type MaybeNullable<T> = T extends any[] ? T : T | null;

export type Any$gql = $gql<any, any, any, any>;

export type RootOf<G extends Any$gql> = G extends $gql<infer T, any, any, any>
? T
: never;
export type FieldOf<G extends Any$gql> = G extends $gql<any, infer F, any, any>
? F
: never;
export type DataOf<G extends Any$gql> = G extends $gql<any, any, infer Q, any>
? MaybeNullable<Q>
: never;
export type VariablesOf<G extends Any$gql> = G extends $gql<
any,
any,
any,
infer V
>
? V
: never;

export type SuccessfulResponse<G extends Any$gql> = {
data: OnlyKey<FieldOf<G>, DataOf<G>>;
errors?: never;
};
export type FailedResponse = { data: null; errors: GraphQLError[] };
export type GqlResponseOf<G extends Any$gql> =
| SuccessfulResponse<G>
| FailedResponse;

type VariableNameLookup = Record<string, string>;

// =========================================
//                 CLASSES
// =========================================

// These classes build fetch request bodies from params.
// queries.login is one example.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class $gql<T extends Root, F extends Fields<T>, Q, V> {
static t = t;
static union = onUnion;

static query<F extends Fields<Query>>(field: F) {
    return new GqlBuilder<Query, F>(query, field, undefined, undefined);
}

static mutation<F extends Fields<Mutation>>(field: F) {
    return new GqlBuilder<Mutation, F>(mutation, field, undefined, undefined);
}

static async toGqlResponse<G extends Any$gql>(
    res: Response
): Promise<GqlResponseOf<G>> {
    const contentType = res.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("application/json")) {
    console.warn(unexpected content-type, got: ${contentType});
    throw new UnknownError();
    }

    const json = await res.json();
    if (!$gql.isGqlResponse<G>(json)) {
    console.warn("unexpected graphql response from server");
    throw new UnknownError();
    }

    return json;
}

private static isGqlResponse = <G extends Any$gql>(
    value: any
): value is GqlResponseOf<G> => {
    return isObject(value) && "data" in value;
};

public readonly compiler: Compiler;
public readonly field: F;
public readonly query: Q;
public readonly variables: V;

constructor(compiler: Compiler, field: F, query: Q, variables: V) {
    this.compiler = compiler;
    this.field = field;
    this.query = query;
    this.variables = variables;
}

// Note: Utility fetch for testing (real fetch is in useReq.ts)
async fetch(
    variables: V,
    abortSignal?: AbortSignal
): Promise<GqlResponseOf<this>> {
    const res = await fetch(
    GRAPHQL_URI,
    this.toRequestInit(variables, abortSignal)
    );
    return await $gql.toGqlResponse(res);
}

toString(variables: V): string {
    const lookup = this.createVariableNameLookup(variables);

    const uploadVariableNames = Object.values(lookup);
    const name =
    uploadVariableNames.length > 0
        ? ${this.field.toString()}(${uploadVariableNames
            .map((variableName) => $${variableName}: Upload!)
            .join(", ")})
        : this.field.toString();
    
    if (isObject(variables)) {
    return this.compiler(name, {
        [this.field]: params(this.graphqlify(variables, lookup), this.query),
    }).toString();
    } else {
    return this.compiler(name, { [this.field]: this.query }).toString();
    }
}

// Note: this populates the core fetch options object, calling toFormData(variables) for the body
toRequestInit(variables: V, abortSignal?: AbortSignal): RequestInit {
    return {
    method: "POST",
    headers: { Accept: "application/json" },
    // Question: How does toFormData() transform "query" and "variables" to the below format?
    /*
        {
        "query": "mutation Login($id, $email, $username, $role, $confirmedAt) { ... }",
        "variables": { "email": "...", "password": "..." }
        }
    */
    body: this.toFormData(variables),
    credentials: "include",
    mode: "cors",
    signal: abortSignal,
    };
}

toFormData(variables: V): FormData {
    const lookup = this.createVariableNameLookup(variables);

    // extract files
    const extraction = extractFiles<File>(
    { query: this.toString(variables), variables },
    undefined,
    (value: any): value is File => value instanceof File
    );
    const clone = extraction.clone;
    const fileMap = extraction.files;

    // compute map
    const map: { [key: string]: string | string[] } = {};
    const pathGroups = Array.from(fileMap.values());
    for (let ndx = 0; ndx < pathGroups.length; ndx++) {
    const paths = pathGroups[ndx];
    map[ndx] = paths.map((path) => {
        const [first, ...rest] = toPath(path);
        const key = ObjectPath.create(...rest).toString();
        return key in lookup ? ${first}.${lookup[key]} : path;
    });
    }

    // create form data
    const formData = new FormData();
    formData.append("operations", JSON.stringify(clone));
    formData.append("map", JSON.stringify(map));

    // append files to form data
    const files = Array.from(fileMap.keys());
    for (let ndx = 0; ndx < files.length; ndx++) {
    const file = files[ndx];
    formData.append(ndx.toString(), file, @${file.name});
    }

    return formData;
}

private createVariableNameLookup(variables: V) {
    const lookup: Record<string, string> = {};

    if (isUndefined(variables)) {
    return lookup;
    }

    let id = 0;

    helpers.forEachEntry(variables, (entry, truePath) => {
    if (entry instanceof File) {
        lookup[truePath.toString()] = upload${id++};
    }
    });

    return lookup;
}

private graphqlify(variables: V, lookup: VariableNameLookup) {
    const params: Params = {};

    helpers.forEachEntry(variables, (entry, truePath, schemaPath) => {
    if (isString(entry) && !this.isEnum(schemaPath)) {
        truePath.set(params, rawString(entry));
    } else if (entry instanceof File) {
        const variableName = lookup[truePath.toString()];
        truePath.set(params, variableName ? $${variableName} : null);
    } else if (Array.isArray(entry)) {
        truePath.set(params, []);
    } else if (isObject(entry)) {
        truePath.set(params, {});
    } else {
        truePath.set(params, entry);
    }
    });

    return params;
}

private isEnum(path: ObjectPath): boolean {
    const t = path.get(this.variables);
    const meta = helpers.getMeta(t);
    return !!meta && !!meta.isEnum;
}
}

class GqlBuilder<
T extends Root,
F extends Fields<T>,
Q extends StrictSelection<T[F]> | void = void,
V extends Record<string, any> | void = void
> {
private compiler: Compiler;
private field: F;
private query: Q;
private variables: V;

constructor(compiler: Compiler, field: F, query: Q, variables: V) {
    this.compiler = compiler;
    this.field = field;
    this.query = query;
    this.variables = variables;
}

setQuery<_Q extends StrictSelection<T[F]>>(query: _Q) {
    return new GqlBuilder<T, F, _Q, V>(
    this.compiler,
    this.field,
    query,
    this.variables
    );
}

setVariables<_V extends Record<string, any>>(variables: _V) {
    return new GqlBuilder<T, F, Q, _V>(
    this.compiler,
    this.field,
    this.query,
    variables
    );
}

// Question: In the core fetch, only the "variables" property of this function's returned "complete" $gql instance is used. Are other essential properties like "query" accessed through "this"?
// Question: How is "compiler" property treated as a function, and what is it doing? Its possible types are "query" and "mutation" (from the typed-graphqlify API). Are these functions?
build() {
    // validate query
    if (!this.query) {
    throw new Error(must set query before building);
    }
    this.compiler(this.query);

    // validate variables
    if (this.variables) {
    this.compiler(this.variables);
    }

    return new $gql<T, F, Q, V>(
    this.compiler,
    this.field,
    cloneDeep(this.query),
    cloneDeep(this.variables)
    );
}
}
```

finally, the main useGql function, "exec()", which passes the API URL and confusingly only the built $gql instance's "variables" property to toRequestInit():

```
const [req, res, cancel, reset] = useReq(graphql.$gql.toGqlResponse);

// Note: calls the core API fetch defined in useReq.ts.
const exec = useCallback(
    (variables: graphql.VariablesOf<G>) => {
    req(GRAPHQL_URI, gql.toRequestInit(variables));
    },
    [req, gql]
);
```

---

Here's toRequestInit() and toString(). 

```
// Note: this populates the core fetch options object, calling toFormData(variables) for the body
toRequestInit(variables: V, abortSignal?: AbortSignal): RequestInit {
    return {
    method: "POST",
    headers: { Accept: "application/json" },
    // Question: How does toFormData() transform "query" and "variables" to the below format?
    /*
        {
        "query": "mutation Login($id, $email, $username, $role, $confirmedAt) { ... }",
        "variables": { "email": "...", "password": "..." }
        }
    */
    body: this.toFormData(variables),
    credentials: "include",
    mode: "cors",
    signal: abortSignal,
    };
}

toFormData(variables: V): FormData {
    const lookup = this.createVariableNameLookup(variables);

    // extract files
    const extraction = extractFiles<File>(
    { query: this.toString(variables), variables },
    undefined,
    (value: any): value is File => value instanceof File
    );
    const clone = extraction.clone;
    const fileMap = extraction.files;

    // compute map
    const map: { [key: string]: string | string[] } = {};
    const pathGroups = Array.from(fileMap.values());
    for (let ndx = 0; ndx < pathGroups.length; ndx++) {
    const paths = pathGroups[ndx];
    map[ndx] = paths.map((path) => {
        const [first, ...rest] = toPath(path);
        const key = ObjectPath.create(...rest).toString();
        return key in lookup ? ${first}.${lookup[key]} : path;
    });
    }

    // create form data
    const formData = new FormData();
    formData.append("operations", JSON.stringify(clone));
    formData.append("map", JSON.stringify(map));

    // append files to form data
    const files = Array.from(fileMap.keys());
    for (let ndx = 0; ndx < files.length; ndx++) {
    const file = files[ndx];
    formData.append(ndx.toString(), file, @${file.name});
    }

    return formData;
}
```

---

I'm not understanding what $gql.compiler is. It's called in the build() stage of the query chain, and then once the core fetch calls toRequestInit() -> toFormData() -> toString(), it's called again in toString().

---

So in the case of the "login" API mutation, the build() runs this.compiler(this.query) to simply set the compiler function to mutation(), for use in the fetch's toRequestInit() pipeline? The constructor inits with an empty compiler variable, and then that variable is somehow configured by passing a graphqlify function to that instance? 

```
import { mutation, onUnion, params, query, rawString } from "typed-graphqlify";
export type Compiler = typeof query | typeof mutation;
```

class $gql:

```
public readonly compiler: Compiler; 
constructor(compiler: Compiler, field: F, query: Q, variables: V) {
    this.compiler = compiler;
    this.field = field;
    this.query = query;
    this.variables = variables;
} 
```

class GqlQueryBuilder:

```
build() {
    // validate query
    if (!this.query) {
    throw new Error(must set query before building);
    }
    this.compiler(this.query);
```

---

So for login mutation, the GqlBuilder compiler property is immediately set to the mutation() function. Then, the toRequestInit() pipeline appropriately transforms the field, query, and variables data so that mutation() can stitch them into a valid POST request body. this.compiler() is strictly run by build() for validation, so mutation() and query() presumably accept a single parameter, even though all three params are needed in practice?

---

Okay, I'll pass off the build() this.compiler call as an author quirk. But I'm realizing toFormData never calls the $gql object's query property, only variables. No this.query in the pipeline or anything, so not sure how it's incorporated in POST body generation. What am I missing?

---

So:

```
// This populates a $gql obj such that useGql() may call its toRequestInit() method to return:
/*
{
    "query": "mutation Login($id, $email, $username, $role, $confirmedAt) { ... }",
    "variables": { "email": "...", "password": "..." }
}
*/
// and inject it into the fetch POST body.
export const login = $gql
.mutation('login')
    .setQuery({
    ...t.union<LoginOutput>()({
    User: {
        __typename: t.constant('User'),
        id: t.string,
        email: t.string,
        username: t.string,
        role: t.optional.oneOf(UserRole)!,
        confirmedAt: t.string,
    },
    ForbiddenError: {
        __typename: t.constant('ForbiddenError'),
        message: t.string,
    },
    }),
})
.setVariables<{ input: LoginInput }>({
    input: {
    usernameOrEmail: t.string,
    password: t.string,
    },
})
.build();

toRequestInit(variables: V, abortSignal?: AbortSignal): RequestInit {
    return {
    method: "POST",
    headers: { Accept: "application/json" },

    // Boom
    body: this.toFormData(variables),

    credentials: "include",
    mode: "cors",
    signal: abortSignal,
    };
}

toString(variables: V): string {
const lookup = this.createVariableNameLookup(variables);

// ...

if (isObject(variables)) {
    
    // Result: 
    /*
    {
        "query": "mutation Login($id, $email, $username, $role, $confirmedAt) { ... }",
        "variables": { "email": "...", "password": "..." }
    }
    */
    return this.compiler(name, {
    [this.field]: params(this.graphqlify(variables, lookup), this.query),
    }).toString();

} else {
    return this.compiler(name, { [this.field]: this.query }).toString();
}
}
```

---

So toString() only forms the query half of the fetch body, and toFormData() combines it with the variables half?

---