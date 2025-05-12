---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-arch-2'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

true or false: the conditional rendering and the lazy loading demonstrated in the below protected component are logically independent, i.e., whether it's the first time the component loads or not, current auth state is tested by the withAuthRequirement HOC before returning either route or fallback.

```
const Signup = compose(withAuthRequirement(AuthRequirement.LOGGED_OUT))(
React.lazy(() => import('./components/Signup'))
);
```

---

in the HOC, is the fallback (spinner) component displayed only until the appropriate redirect (per switch block) is performed?

```
import React, { useEffect } from "react"; 
import { useLocation, useNavigate } from "react-router-dom";
import { Fallback } from "../components/Fallback";
import { isLoggedInSelector, useAuth } from "../ctx/auth";
import { useRouteInfo } from "../ctx/route-info";

import { gtEqAdmin, gtEqStudent, gtEqTeacher } from "../domain";

import { UserRole } from "../lib/graphql";
import { notify } from "../lib/notify";
import { AuthRequirement } from "../util/types";

const isMeetingAuthReq = (
authReqs: AuthRequirement,
isLoggedIn: boolean,
userRole: UserRole
) => {
switch (authReqs) {
    case AuthRequirement.NONE:
    return true;
    case AuthRequirement.LOGGED_IN:
    return isLoggedIn;
    case AuthRequirement.LOGGED_OUT:
    return !isLoggedIn;
    case AuthRequirement.LOGGED_IN_AS_STUDENT:
    return isLoggedIn && gtEqStudent(userRole);
    case AuthRequirement.LOGGED_IN_AS_TEACHER:
    return isLoggedIn && gtEqTeacher(userRole);
    case AuthRequirement.LOGGED_IN_AS_ADMIN:
    return isLoggedIn && gtEqAdmin(userRole);
    default:
    // fail open for unhandled authReqs
    return true;
}
};

export const withAuthRequirement = (authReq: AuthRequirement) =>
function <P>(Component: React.ComponentType<P>): React.FC<P> {
    return (props) => {

    // const { user } = useSelector((state) => state.auth);
    const [authState] = useAuth();

    const isLoggedIn = isLoggedInSelector(authState);
    const isAuthPending = authState.isPending;
    const userRole = authState.user.role;
    const navigate = useNavigate();
    const location = useLocation();

    let { returnToRoute } = useRouteInfo();
    returnToRoute =
        location.pathname === returnToRoute ? "/library" : returnToRoute;

    const meetsAuthReqs = isMeetingAuthReq(authReq, isLoggedIn, userRole);

    useEffect(() => {
        if (isAuthPending || meetsAuthReqs) {
        return;
        }
        // when the current session fails to meet auth
        // reqs, redirect the user to somewhere reasonable
        switch (authReq) {
        case AuthRequirement.NONE:
            break;
        case AuthRequirement.LOGGED_IN:
            notify.message.error({ content: "must be logged in" });
            navigate("/login");
            break;
        case AuthRequirement.LOGGED_OUT:
            navigate(returnToRoute);
            break;
        case AuthRequirement.LOGGED_IN_AS_STUDENT:
            notify.message.error({ content: "must be logged in as a student" });
            navigate(isLoggedIn ? returnToRoute : "/login");
            break;
        case AuthRequirement.LOGGED_IN_AS_TEACHER:
            notify.message.error({ content: "must be logged in as a teacher" });
            navigate(isLoggedIn ? returnToRoute : "/login");
            break;
        case AuthRequirement.LOGGED_IN_AS_ADMIN:
            notify.message.error({ content: "must be logged in as a admin" });
            navigate(isLoggedIn ? returnToRoute : "/login");
            break;
        }
    }, [isAuthPending, meetsAuthReqs, navigate, isLoggedIn, returnToRoute]);

    return meetsAuthReqs ? <Component {...props} /> : <Fallback />;
    };
};
```

---

Are Number values -1, 0, and 1 treated as booleans in some JS contexts? The switch table in this HOC that tests auth status returns values like "isLoggedIn && [function* that returns -1, 0, or 1 by enumerating user role based on its index in its native array]"

*function:

```
import { UserRole } from '../lib/graphql';

const USER_ROLES: UserRole[] = [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN];

export const compareUserRoles = (role1: UserRole, role2: UserRole) => {
const ndx1 = USER_ROLES.indexOf(role1);
const ndx2 = USER_ROLES.indexOf(role2);

if (ndx1 < ndx2) {
    return -1;
}
if (ndx1 > ndx2) {
    return 1;
}
return 0;
};

export const ltStudent = (role: UserRole) => compareUserRoles(role, UserRole.STUDENT) < 0;
export const ltEqStudent = (role: UserRole) => compareUserRoles(role, UserRole.STUDENT) <= 0;
export const eqStudent = (role: UserRole) => compareUserRoles(role, UserRole.STUDENT) === 0;
export const gtEqStudent = (role: UserRole) => compareUserRoles(role, UserRole.STUDENT) >= 0;
export const gtStudent = (role: UserRole) => compareUserRoles(role, UserRole.STUDENT) > 0;

export const ltTeacher = (role: UserRole) => compareUserRoles(role, UserRole.TEACHER) < 0;
export const ltEqTeacher = (role: UserRole) => compareUserRoles(role, UserRole.TEACHER) <= 0;
export const eqTeacher = (role: UserRole) => compareUserRoles(role, UserRole.TEACHER) === 0;
export const gtEqTeacher = (role: UserRole) => compareUserRoles(role, UserRole.TEACHER) >= 0;
export const gtTeacher = (role: UserRole) => compareUserRoles(role, UserRole.TEACHER) > 0;

export const ltAdmin = (role: UserRole) => compareUserRoles(role, UserRole.ADMIN) < 0;
export const ltEqAdmin = (role: UserRole) => compareUserRoles(role, UserRole.ADMIN) <= 0;
export const eqAdmin = (role: UserRole) => compareUserRoles(role, UserRole.ADMIN) === 0;
export const gtEqAdmin = (role: UserRole) => compareUserRoles(role, UserRole.ADMIN) >= 0;
export const gtAdmin = (role: UserRole) => compareUserRoles(role, UserRole.ADMIN) > 0;
```

---

Right, so we have the switch table return [boolean] && [boolean], since gtEq(userRole, minimumRole) is itself a test that returns a boolean.

---

Is the hierarchical order of custom context providers in this component tree intentional, or would the route components gain access to each state slice regardless of the order?

```
    <>
    <BrowserRouter>
        <MetaProvider>
        <ConfigProvider locale={enUS}>
            <ThemeProviderProxy theme={theme}>
            <ViewportProvider>
                <DeviceProvider>
                <AuthProvider>
                    <RouteInfoProvider>
                    <NewVersionNotifier />
                    <ScrollBehavior />
                    <React.Suspense fallback={<Fallback />}>
                        <Routes>
                        <Route path="/index.html" element={<Navigate to="/" replace />} />
                        <Route path="/" element={<Landing />}></Route>
                        <Route path="/library" element={<Library />} />
                        <Route path="/n/:id" element={<N />} />
                        <Route path="/n/:id/edit" element={<NEdit />} />
                        <Route path="/n/:id/export" element={<NExport />} />
                        <Route path="/n/:id/record" element={<NRecord />} />
                        <Route path="/users" element={<UserIndex />} />
                        <Route path="/tags" element={<TagIndex />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/confirm-email" element={<ConfirmEmail />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/200.html" element={<Nothing />} />
                        <Route path="*" element={<NotFound />} />
                        </Routes>
                    </React.Suspense>
                    </RouteInfoProvider>
                </AuthProvider>
                </DeviceProvider>
            </ViewportProvider>
            </ThemeProviderProxy>
        </ConfigProvider>
        </MetaProvider>
    </BrowserRouter>
    </>
```

---

so, given the order here is intentional:

- route state depends on auth state
- auth state depends on device state
- device state depends on viewport state?

i can't imagine why operations requiring auth state would depend on device information.

---

no matches for "device" in AuthCtx.jsx (<AuthProvider/>-returning module), so it's probably incidental. device/auth context tree segment is intentional, all else above is arbitary.

---

Super confused by this auth state manager, specifically how it combines the redux and react context APIs:

```
import { createAction, createReducer } from "@reduxjs/toolkit";
import { noop } from "lodash";

import React, {
PropsWithChildren,
useCallback,
useMemo,
useReducer,
} from "react";

import { useEffectOnce } from "../../hooks/useEffectOnce";
import { useGql } from "../../hooks/useGql";
import { useGqlHandler } from "../../hooks/useGqlHandler";

import { UNKNOWN_ERROR_MSG } from "../../lib/errors";
import { LoginInput, SignupInput } from "../../lib/graphql";
import { notify } from "../../lib/notify";

import { getNullAuthUser } from "./getNullAuthUser";

import * as helpers from "./helpers";
import * as queries from "./queries";
import { AuthState, AuthUser } from "./types";

// TYPE DECLARATION... BUT DOESN'T REDUX EXPOSE THIS "OBJECT" VIA USEDISPATCH?

export type AuthApi = {
authenticate(): void; 
login(variables: { input: LoginInput }): void;
logout(): void;
signup(variables: { input: SignupInput }): void;
clearErrors(): void;
reset(): void;
};

// ACTIONS

export const AUTH_ACTIONS = {
pending: createAction("pending"),
setUser: createAction<{ user: AuthUser }>("setUser"),
setErrors: createAction<{ errors: string[] }>("setErrors"),
reset: createAction("reset"),
clearErrors: createAction("clearErrors"),
};

// REDUCERS

const getInitialState = (): AuthState => ({
isPending: true,
errors: [],
user: getNullAuthUser(),
});
const authReducer = createReducer(getInitialState(), (builder) => {
builder.addCase(AUTH_ACTIONS.pending, (state) => {
    state.isPending = true;
    state.errors = [];
});
builder.addCase(AUTH_ACTIONS.setUser, (state, action) => {
    state.isPending = false;
    state.errors = [];
    state.user = action.payload.user;
});
builder.addCase(AUTH_ACTIONS.setErrors, (state, action) => {
    state.isPending = false;
    state.errors = action.payload.errors;
    state.user = getNullAuthUser();
});
builder.addCase(AUTH_ACTIONS.clearErrors, (state) => {
    state.errors = [];
});
builder.addCase(AUTH_ACTIONS.reset, (state) => {
    state.user = getNullAuthUser();
    state.isPending = false;
    state.errors = [];
});
});

// WHY IS CREATECONTEXT BEING USED IN TANDEM WITH REDUX? DOESN'T REDUX WORK ON ITS OWN?

export const AuthStateCtx = React.createContext<AuthState>(getInitialState());
export const AuthApiCtx = React.createContext<AuthApi>({
authenticate: noop,
login: noop,
logout: noop,
signup: noop,
clearErrors: noop,
reset: noop,
});

export const AuthProvider: React.FC<PropsWithChildren<{}>> = (props) => {
// DOESN'T REDUX PASS ACTIONS TO REDUCERS WITHOUT USEREDUCER?
const [state, dispatch] = useReducer(authReducer, getInitialState());

// CUSTOM WRAPPERS?

const [authenticate, authenticateRes] = useGql(queries.whoami);

useGqlHandler
    .onInit(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(authenticateRes, ({ data }) => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(data.whoami) }));
    })
    .onErrors(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    })
    .onCancelled(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    });

const [login, loginRes] = useGql(queries.login);

useGqlHandler
    .onPending(loginRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(loginRes, ({ data }) => {
    switch (data.login?.__typename) {
        case "User":
        
        dispatch(AUTH_ACTIONS.setUser({ user: data.login }));

        notify.message.success({
            content: logged in as ${data.login.username},
        });

        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.login?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [logout, logoutRes] = useGql(queries.logout);

useGqlHandler
    .onPending(logoutRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(logoutRes, ({ data }) => {
    switch (data.logout?.__typename) {
        case "Processed":
        dispatch(AUTH_ACTIONS.setUser({ user: getNullAuthUser() }));
        notify.message.success({ content: "logged out" });
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.logout?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [signup, signupRes] = useGql(queries.signup);
useGqlHandler
    .onPending(signupRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(signupRes, ({ data }) => {
    switch (data.signup?.__typename) {
        case "User":
        dispatch(AUTH_ACTIONS.setUser({ user: data.signup }));
        notify.message.success({
            content: logged in as ${data.signup.username},
        });
        break;
        case "ValidationError":
        dispatch(AUTH_ACTIONS.setErrors({ errors: data.signup.details }));
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.signup?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const clearErrors = useCallback(() => {
    dispatch(AUTH_ACTIONS.clearErrors());
}, []);

const reset = useCallback(() => {
    dispatch(AUTH_ACTIONS.reset());
}, []);

useEffectOnce(() => {
    authenticate();
});

const api = useMemo<AuthApi>(
    () => ({
    authenticate,
    login,
    logout,
    signup,
    clearErrors,
    reset,
    }),
    [authenticate, login, logout, signup, clearErrors, reset]
);

return (
    <AuthStateCtx.Provider value={state}>
    <AuthApiCtx.Provider value={api}>{props.children}</AuthApiCtx.Provider>
    </AuthStateCtx.Provider>
);
};
```

---

in my experience, state management and connection of the component tree to that state has been a package deal with redux. maybe this app was written before redux toolkit?

---

The toolkit import is right at the top, missed that. So despite state management and exposure being amenable with redux toolkit, the author chose the redux/context hybrid approach for a reason...

---

but in modern RTK, different parts of the app state are encapsulated in their own providers called slices -- the global store is more of a control layer, unless you'd disagree. but in those terms, you're saying this app has no global store?

---

This app's state management / client-server layer is mindboggingly complex abstraction tree. As an example, for auth state, the UI component that triggers the "login" action on form submission is at least 4 files removed from the base fetch. Each intermediate step is another wrapper each with its own web of required utils, custom hooks, and type declarations, and I'm exhausting myself trying to understand it, let alone parse its potential advantages. Maybe you can guide me through the login pipeline so that I can generalize it to the rest of the layer. 

Login.tsx:

```
export const Login: React.FC = () => {
const [authState, authApi] = useAuth();
const errors = authState.errors;
const isAuthPending = authState.isPending;

useEffectOnce(() => {
    authApi.clearErrors();
});

const [form] = Form.useForm<FormValues>();

const login = authApi.login;
const onFinish = useCallback(() => {
    const { usernameOrEmail, password } = form.getFieldsValue();
    login({ input: { usernameOrEmail, password } });
}, [form, login]);

return (...);
```

The Login component retrieves authState and authApi by calling useAuth() -- a custom hook which itself calls useContext() on both "AuthStateCtx" and "AuthApiCtx"... which both are returned by the auth Provider hub, AuthCtx.tsx.

useAuth.ts:

```
import { useContext } from 'react';
import { AuthApi, AuthApiCtx, AuthStateCtx } from './AuthCtx';
import { AuthState } from './types';

export const useAuth = (): [AuthState, AuthApi] => {
const state = useContext(AuthStateCtx);
const api = useContext(AuthApiCtx);
return [state, api];
};
```

AuthCtx.tsx (return block):

```
return (
    <AuthStateCtx.Provider value={state}>
    <AuthApiCtx.Provider value={api}>{props.children}</AuthApiCtx.Provider>
    </AuthStateCtx.Provider>
);
```

I understand that useContext() subscribes a component to a Provider, but: 
- is there a reason that they're both returned in an array, like with useState()? 
- is there a reason that both Providers are separate and nested in each other, before being subscribed to separately and returned in an array to Login.tsx?

From there upward, AuthCtx.tsx has a series of invocations of "useGqlHandler", another custom hook, which seems to implicitly set up actions after they've been declared.

Action declaration:

```
export const AUTH_ACTIONS = {
pending: createAction("pending"),
setUser: createAction<{ user: AuthUser }>("setUser"),
setErrors: createAction<{ errors: string[] }>("setErrors"),
reset: createAction("reset"),
clearErrors: createAction("clearErrors"),
};
```

useGqlHandler part:

```
useGqlHandler
    .onInit(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(authenticateRes, ({ data }) => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(data.whoami) }));
    })
    .onErrors(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    })
    .onCancelled(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    });

const [login, loginRes] = useGql(queries.login);

useGqlHandler
    .onPending(loginRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(loginRes, ({ data }) => {
    switch (data.login?.__typename) {
        case "User":
        
        dispatch(AUTH_ACTIONS.setUser({ user: data.login }));

        notify.message.success({
            content: logged in as ${data.login.username},
        });

        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.login?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [logout, logoutRes] = useGql(queries.logout);

useGqlHandler
    .onPending(logoutRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(logoutRes, ({ data }) => {
    switch (data.logout?.__typename) {
        case "Processed":
        dispatch(AUTH_ACTIONS.setUser({ user: getNullAuthUser() }));
        notify.message.success({ content: "logged out" });
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.logout?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [signup, signupRes] = useGql(queries.signup);
useGqlHandler
    .onPending(signupRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(signupRes, ({ data }) => {
    switch (data.signup?.__typename) {
        case "User":
        dispatch(AUTH_ACTIONS.setUser({ user: data.signup }));
        notify.message.success({
            content: logged in as ${data.signup.username},
        });
        break;
        case "ValidationError":
        dispatch(AUTH_ACTIONS.setErrors({ errors: data.signup.details }));
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.signup?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

export const AuthStateCtx = React.createContext<AuthState>(getInitialState());
export const AuthApiCtx = React.createContext<AuthApi>({
authenticate: noop,
login: noop,
logout: noop,
signup: noop,
clearErrors: noop,
reset: noop,
});
```

^ How do these parts relate to the reducers and the nested Providers?

useGql() and "queries" are further abstractions that can be traced to a base fetch with different configurations depending on action type. 

My head hurts.

---

just a bit more.

useGql() then wraps useReq():

```
import { useCallback, useState } from "react";
import { MissingDataError } from "../lib/errors";
import * as graphql from "../lib/graphql";
import * as xhr from "../lib/xhr";
import { useReq } from "./useReq";
import { useResHandler } from "./useResHandler";

const GRAPHQL_URI = ${window.location.origin}/graphql;

export type Exec<G extends graphql.Any$gql> = (
variables: graphql.VariablesOf<G>
) => void;

// The reason why we use this instead of $gql.GqlResponseOf, is because the server can return data and populate errors.
// Callers can use the status discriminant to determine what the response looks like instead of testing the presence
// of the data and errors properties.

export enum GqlStatus {
Init,
Pending,
Success,
Errors,
Cancelled,
}

export type GqlRes<G extends graphql.Any$gql> =
| {
    status: GqlStatus.Init;
    }
| {
    status: GqlStatus.Pending;
    }
| {
    status: GqlStatus.Success;
    data: graphql.SuccessfulResponse<G>["data"];
    }
| {
    status: GqlStatus.Errors;
    errors: string[];
    }
| {
    status: GqlStatus.Cancelled;
    };

export const useGql = <G extends graphql.Any$gql>(
gql: G
): [exec: Exec<G>, res: GqlRes<G>, cancel: xhr.Cancel, reset: xhr.Reset] => {

const [req, res, cancel, reset] = useReq(graphql.$gql.toGqlResponse);

const exec = useCallback(
    (variables: graphql.VariablesOf<G>) => {
    req(GRAPHQL_URI, gql.toRequestInit(variables));
    },
    [req, gql]
);

const [gqlRes, setGqlRes] = useState<GqlRes<G>>({ status: GqlStatus.Init });

useResHandler(xhr.Status.Init, res, (res) => {
    setGqlRes({ status: GqlStatus.Init });
});
useResHandler(xhr.Status.Pending, res, (res) => {
    setGqlRes({ status: GqlStatus.Pending });
});
useResHandler(xhr.Status.Success, res, (res) => {
    const { data, errors } = res.result;
    if (errors) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: errors.map((error) => error.message),
    });
    } else if (!data) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: [new MissingDataError().message],
    });
    } else {
    setGqlRes({ status: GqlStatus.Success, data });
    }
});
useResHandler(xhr.Status.Error, res, (res) => {
    setGqlRes({ status: GqlStatus.Errors, errors: [res.error.message] });
});
useResHandler(xhr.Status.Cancelled, res, (res) => {
    setGqlRes({ status: GqlStatus.Cancelled });
});

return [exec, gqlRes, cancel, reset];
};
```

and we finally see a fetch block inside of useReq:

```
import { useCallback, useState } from "react";
import { MissingDataError } from "../lib/errors";
import * as graphql from "../lib/graphql";
import * as xhr from "../lib/xhr";
import { useReq } from "./useReq";
import { useResHandler } from "./useResHandler";

const GRAPHQL_URI = ${window.location.origin}/graphql;

export type Exec<G extends graphql.Any$gql> = (
variables: graphql.VariablesOf<G>
) => void;

// The reason why we use this instead of $gql.GqlResponseOf, is because the server can return data and populate errors.
// Callers can use the status discriminant to determine what the response looks like instead of testing the presence
// of the data and errors properties.

export enum GqlStatus {
Init,
Pending,
Success,
Errors,
Cancelled,
}

export type GqlRes<G extends graphql.Any$gql> =
| {
    status: GqlStatus.Init;
    }
| {
    status: GqlStatus.Pending;
    }
| {
    status: GqlStatus.Success;
    data: graphql.SuccessfulResponse<G>["data"];
    }
| {
    status: GqlStatus.Errors;
    errors: string[];
    }
| {
    status: GqlStatus.Cancelled;
    };

export const useGql = <G extends graphql.Any$gql>(
gql: G
): [exec: Exec<G>, res: GqlRes<G>, cancel: xhr.Cancel, reset: xhr.Reset] => {

const [req, res, cancel, reset] = useReq(graphql.$gql.toGqlResponse);

const exec = useCallback(
    (variables: graphql.VariablesOf<G>) => {
    req(GRAPHQL_URI, gql.toRequestInit(variables));
    },
    [req, gql]
);

const [gqlRes, setGqlRes] = useState<GqlRes<G>>({ status: GqlStatus.Init });

useResHandler(xhr.Status.Init, res, (res) => {
    setGqlRes({ status: GqlStatus.Init });
});
useResHandler(xhr.Status.Pending, res, (res) => {
    setGqlRes({ status: GqlStatus.Pending });
});
useResHandler(xhr.Status.Success, res, (res) => {
    const { data, errors } = res.result;
    if (errors) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: errors.map((error) => error.message),
    });
    } else if (!data) {
    setGqlRes({
        status: GqlStatus.Errors,
        errors: [new MissingDataError().message],
    });
    } else {
    setGqlRes({ status: GqlStatus.Success, data });
    }
});
useResHandler(xhr.Status.Error, res, (res) => {
    setGqlRes({ status: GqlStatus.Errors, errors: [res.error.message] });
});
useResHandler(xhr.Status.Cancelled, res, (res) => {
    setGqlRes({ status: GqlStatus.Cancelled });
});

return [exec, gqlRes, cancel, reset];
};
```

but there's an odd horizontal at this layer -- there are fetch blocks in both useReq AND a static method "graphql.$gql" which is called in useGql.

$gql:

```
import { extractFiles } from "extract-files";
import { GraphQLError } from "graphql";
import { cloneDeep, isObject, isString, isUndefined, toPath } from "lodash";
import { mutation, onUnion, params, query, rawString } from "typed-graphqlify";
import { Params } from "typed-graphqlify/dist/render";
import { GRAPHQL_URI } from ".";
import { OnlyKey } from "../../util/types";
import { UnknownError } from "../errors";
import { Mutation, Query } from "./graphqlTypes";
import * as helpers from "./helpers";
import { ObjectPath } from "./ObjectPath";
import { t } from "./t";
import { StrictSelection } from "./types";

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

toRequestInit(variables: V, abortSignal?: AbortSignal): RequestInit {
    return {
    method: "POST",
    headers: { Accept: "application/json" },
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

    // For some reason, if we don't create new objects, some queries will be inexplicably "linked" to
    // each other causing unwanted mutations to the query object.
    return new $gql<T, F, Q, V>(
    this.compiler,
    this.field,
    cloneDeep(this.query),
    cloneDeep(this.variables)
    );
}
}
```

then on further inspection, $gql is found to be its own module, not a static method... so how is it written as graphql.$gql?

---

I think I've been conflating "mutations" with actions here. In a react-redux app I built, (rest) api requests are written in an "actions" file, and somehow returning the action's response passes it to the reducer/"slice" file, which updates auth state. do the roles change in a graphql context? understanding one case in terms of the other may help drastically here.

---

Understanding update:

1. Respond to the questions and assumptions I've commented in AuthCtx.tsx:

```
import { createAction, createReducer } from "@reduxjs/toolkit";
import { noop } from "lodash";

import React, {
PropsWithChildren,
useCallback,
useMemo,
useReducer,
} from "react";

import { useEffectOnce } from "../../hooks/useEffectOnce";
import { useGql } from "../../hooks/useGql";
import { useGqlHandler } from "../../hooks/useGqlHandler";

import { UNKNOWN_ERROR_MSG } from "../../lib/errors";
import { LoginInput, SignupInput } from "../../lib/graphql";
import { notify } from "../../lib/notify";

import { getNullAuthUser } from "./getNullAuthUser";

import * as helpers from "./helpers";
import * as queries from "./queries";
import { AuthState, AuthUser } from "./types";

// Question: so if these type fields are not actions, what do we call the those request functions which trigger the actions?
export type AuthApi = {
authenticate(): void; 
login(variables: { input: LoginInput }): void;
logout(): void;
signup(variables: { input: SignupInput }): void;
clearErrors(): void;
reset(): void;
};

// Question: Actions refer to reducer cases, not the request itself (login, logout, etc.)?
// In my projects, authActions.js lays out the API fetch calls themselves...
export const AUTH_ACTIONS = {
pending: createAction("pending"),
setUser: createAction<{ user: AuthUser }>("setUser"),
setErrors: createAction<{ errors: string[] }>("setErrors"),
reset: createAction("reset"),
clearErrors: createAction("clearErrors"),
};

// REDUCERS

const getInitialState = (): AuthState => ({
isPending: true,
errors: [],
user: getNullAuthUser(),
});

const authReducer = createReducer(getInitialState(), (builder) => {
builder.addCase(AUTH_ACTIONS.pending, (state) => {
    state.isPending = true;
    state.errors = [];
});
builder.addCase(AUTH_ACTIONS.setUser, (state, action) => {
    state.isPending = false;
    state.errors = [];
    state.user = action.payload.user;
});
builder.addCase(AUTH_ACTIONS.setErrors, (state, action) => {
    state.isPending = false;
    state.errors = action.payload.errors;
    state.user = getNullAuthUser();
});
builder.addCase(AUTH_ACTIONS.clearErrors, (state) => {
    state.errors = [];
});
builder.addCase(AUTH_ACTIONS.reset, (state) => {
    state.user = getNullAuthUser();
    state.isPending = false;
    state.errors = [];
});
});

// (Answered) Question: Why use React Context in tandem w/ Redux?
// https://chatgpt.com/c/67f1c962-22e0-8007-af84-0c8c5de90cee

// Question: We declare the global state object's type, then initialize it as a Context, then feed it to a Provider's "state" prop?
export const AuthStateCtx = React.createContext<AuthState>(getInitialState());
export const AuthApiCtx = React.createContext<AuthApi>({
authenticate: noop,
login: noop,
logout: noop,
signup: noop,
clearErrors: noop,
reset: noop,
});

export const AuthProvider: React.FC<PropsWithChildren<{}>> = (props) => {

// Question: does Redux pass actions to this component because useReducer() is called here, or because the component returns the Provider, or both?
const [state, dispatch] = useReducer(authReducer, getInitialState());

const [authenticate, authenticateRes] = useGql(queries.whoami);

useGqlHandler
    .onInit(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(authenticateRes, ({ data }) => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(data.whoami) }));
    })
    .onErrors(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    })
    .onCancelled(authenticateRes, () => {
    dispatch(AUTH_ACTIONS.setUser({ user: helpers.toAuthUser(null) }));
    });

// Assumption: useAuth.ts is the bridge that allows Login.tsx's login() to call THIS function, which makes the API fetch call.
const [login, loginRes] = useGql(queries.login);

// Question: how are these useGqlHandler blocks chainable? Are they necessary, or 
useGqlHandler
    .onPending(loginRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(loginRes, ({ data }) => {
    switch (data.login?.__typename) {
        case "User":

        // Assumption: calling useReducer() above allows dispatch() to send loginRes to the reducer.
        dispatch(AUTH_ACTIONS.setUser({ user: data.login }));

        notify.message.success({
            content: logged in as ${data.login.username},
        });

        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.login?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [logout, logoutRes] = useGql(queries.logout);

useGqlHandler
    .onPending(logoutRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(logoutRes, ({ data }) => {
    switch (data.logout?.__typename) {
        case "Processed":
        dispatch(AUTH_ACTIONS.setUser({ user: getNullAuthUser() }));
        notify.message.success({ content: "logged out" });
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.logout?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const [signup, signupRes] = useGql(queries.signup);
useGqlHandler
    .onPending(signupRes, () => {
    dispatch(AUTH_ACTIONS.pending());
    })
    .onSuccess(signupRes, ({ data }) => {
    switch (data.signup?.__typename) {
        case "User":
        dispatch(AUTH_ACTIONS.setUser({ user: data.signup }));
        notify.message.success({
            content: logged in as ${data.signup.username},
        });
        break;
        case "ValidationError":
        dispatch(AUTH_ACTIONS.setErrors({ errors: data.signup.details }));
        break;
        default:
        dispatch(
            AUTH_ACTIONS.setErrors({
            errors: [data.signup?.message || UNKNOWN_ERROR_MSG],
            })
        );
    }
    });

const clearErrors = useCallback(() => {
    dispatch(AUTH_ACTIONS.clearErrors());
}, []);

const reset = useCallback(() => {
    dispatch(AUTH_ACTIONS.reset());
}, []);

useEffectOnce(() => {
    authenticate();
});

const api = useMemo<AuthApi>(
    () => ({
    authenticate,
    login,
    logout,
    signup,
    clearErrors,
    reset,
    }),
    [authenticate, login, logout, signup, clearErrors, reset]
);

return (
    <AuthStateCtx.Provider value={state}>
    <AuthApiCtx.Provider value={api}>{props.children}</AuthApiCtx.Provider>
    </AuthStateCtx.Provider>
);
};
```

2. I've established that the login responses are passed down from useReq to useGql. I believe useReq makes the base API fetch call, using the "login" fetch template (that is built with functions from $gql.ts), which is passed all the way up from AuthCtx.tsx...

AuthCtx.tsx:

```
const [login, loginRes] = useGql(queries.login);

queries.ts:

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

...but while $gql.ts seems to be a factory for building for the fetch call ultimately made in useReq.ts, it has its own fetch function as well. I think I touched on this earlier -- fetch() existing in both useReq.ts and $gql.ts. What is the latter's fetch for?

---

Here's $gql.ts for context:

```
/* BACKEND - DEPENDENCY TREE
---------------

domain -> repos -> services -> resolvers + middleware -> api server -> entrypoints

User -> ... -> ApiServer.start(schema: GraphQLSchema)

the entrypoint (start()) depends on the api server (app.listen()), which depends on the middleware (app.use({}), which depends on Resolvers, which depend on Services, which depend on DB repos (actual data models), which interact with DB schemas (app data types that correspond to DB repos)

*/

import { extractFiles } from "extract-files";
import { GraphQLError } from "graphql";
import { cloneDeep, isObject, isString, isUndefined, toPath } from "lodash";
import { mutation, onUnion, params, query, rawString } from "typed-graphqlify";
import { Params } from "typed-graphqlify/dist/render";
import { GRAPHQL_URI } from ".";
import { OnlyKey } from "../../util/types";
import { UnknownError } from "../errors";
import { Mutation, Query } from "./graphqlTypes";
import * as helpers from "./helpers";
import { ObjectPath } from "./ObjectPath";
import { t } from "./t";
import { StrictSelection } from "./types";

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

toRequestInit(variables: V, abortSignal?: AbortSignal): RequestInit {
    return {
    method: "POST",
    headers: { Accept: "application/json" },
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

    // For some reason, if we don't create new objects, some queries will be inexplicably "linked" to
    // each other causing unwanted mutations to the query object.
    return new $gql<T, F, Q, V>(
    this.compiler,
    this.field,
    cloneDeep(this.query),
    cloneDeep(this.variables)
    );
}
}
```

---

is it possible that the developer will be notified that services have been accessed if i build this app locally?

---

this is the .env file for dev included in the repo:

```
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
DOMAIN_NAME=localhost
SESSION_SECRET=keyboardcat
WEB_UI_CDN_DOMAIN_NAME=localhost
MEDIA_CDN_DOMAIN_NAME=d11z5bu8xy08xt.cloudfront.net
MEDIA_S3_BUCKET=stringsyncdev-mediabucketbcbb02ba-hv54h8w2yv04
VIDEO_SRC_S3_BUCKET=stringsyncdev-source-1itxo9v3058ci
VIDEO_QUEUE_SQS_URL=https://sqs.us-east-1.amazonaws.com/735208443400/stringsyncdev
INFO_EMAIL=info@stringsync.com
DEV_EMAIL=dev@stringsync.com
DB_HOST=db
DB_NAME=stringsync
DB_PORT=5432
DB_USERNAME=stringsync
DB_PASSWORD=stringsync
REDIS_HOST=redis
REDIS_PORT=6379
```

---

AuthCtx.tsx: how does useGqlHandler() track the response's lifecycle (to run .onPending() and .onSuccess() from outside of useReq.ts?

---

```
useGqlHandler.ts:

/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useEffect } from 'react';
import { Any$gql } from '../lib/graphql';
import { GqlRes, GqlStatus } from './useGql';

type ResHandler<T extends Any$gql, S extends GqlStatus> = (res: Extract<GqlRes<T>, { status: S }>) => void;

type DynamicGqlHandler = <T extends Any$gql, S extends GqlStatus>(
status: S,
res: GqlRes<T>,
handler: ResHandler<T, S>,
deps?: React.DependencyList
) => StaticEventHandlers;

type StaticGqlHandler<S extends GqlStatus> = <T extends Any$gql>(
res: GqlRes<T>,
handler: ResHandler<T, S>,
deps?: React.DependencyList
) => StaticEventHandlers;

type StaticEventHandlers = {
onInit: StaticGqlHandler<GqlStatus.Init>;
onPending: StaticGqlHandler<GqlStatus.Pending>;
onSuccess: StaticGqlHandler<GqlStatus.Success>;
onErrors: StaticGqlHandler<GqlStatus.Errors>;
onCancelled: StaticGqlHandler<GqlStatus.Cancelled>;
};

export type UseGqlHandler = DynamicGqlHandler & StaticEventHandlers;

export const useGqlHandler: UseGqlHandler = (status, res, handler, deps = []): StaticEventHandlers => {
// eslint-disable-next-line react-hooks/exhaustive-deps
const callback = useCallback(handler, deps);
useEffect(() => {
    if (res.status === status) {
    callback(res as Extract<typeof res, { status: typeof status }>);
    }
}, [status, res, callback]);

// allow for chaining
return staticEventHandlers;
};

useGqlHandler.onInit = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Init, res, handler, deps);
};

useGqlHandler.onPending = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Pending, res, handler, deps);
};

useGqlHandler.onSuccess = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Success, res, handler, deps);
};

useGqlHandler.onErrors = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Errors, res, handler, deps);
};

useGqlHandler.onCancelled = (res, handler, deps = []) => {
return useGqlHandler(GqlStatus.Cancelled, res, handler, deps);
};

const staticEventHandlers: StaticEventHandlers = {
onInit: useGqlHandler.onInit,
onPending: useGqlHandler.onPending,
onSuccess: useGqlHandler.onSuccess,
onErrors: useGqlHandler.onErrors,
onCancelled: useGqlHandler.onCancelled,
};
```

---

So before loginRes.status is either pending or success -- right when , which part of useGqlHandler is executed? I understand that useEffect() runs when status changes, but what arguments in AuthCtx.tsx map to useGqlHandler's parameters (stats, res, handler, deps = [])?

---

in /api/src/server/api/ApiServer.ts, the "withGraphQL" middleware takes option "schema" -- built from generateSchema.ts and passed down from entrypoints/api.ts -- which encapsulates all resolvers and mounts them to /graphql, which maps a request to the correct resolver via the name (e.g., "login") specified in the request body's query string (formed by queries:$gql.ts, then passed to *Ctx:useGql (exposed to client via use*), which wraps useReq.)

---

so the Login component doesn't have to make subsequent calls to useAuth() (returning [authState, authApi]) to reflect new state? when the graphql response is passed down from useReq to useGql to AuthCtx, an action is dispatched, prompting the appropriate reducer to update the state, and then authState in Login component is automatically updated? 

---

correction: Login calls "login()", a controller function contained in authApi. There is no useLogin().

---

So the flow is that you call useContext() on a Context object to connect to its state. But the Provider, which wraps the component tree, is strictly meant to limit the scope of this process? if <Login/> was outside of the <AuthProvider/>, it wouldn't work? So it's opt-in to state with useContext(), AND it has to be within Provider scope?

---

Oh, so useContext() from a UI component's pov just says, "give me the state specified in the Provider's value prop". I feel like useProvider would make more sense as a name...

---

createContext() seems like an extra step since it doesn't seem to be involved in the process of updating state... provider only need a populated value prop to do its job. Couldn't the provider "create" the context on its own?

---

Why are the state and api providers nested? Aren't state and updater functions logically independent?

```
return (
    <AuthStateCtx.Provider value={state}>
    <AuthApiCtx.Provider value={api}>{props.children}</AuthApiCtx.Provider>
    </AuthStateCtx.Provider>
);
```

---