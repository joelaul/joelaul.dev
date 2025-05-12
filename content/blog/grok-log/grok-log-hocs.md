---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-hocs'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

Is the reason why useRoutingInfo() returns the route previous to the the component returned by this HOC, rather than that component's route, that the hook is called at the HOC level before the component is rendered?

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

    const navigate = useNavigate();
    const location = useLocation();

    let { returnToRoute } = useRouteInfo();
    returnToRoute =
        location.pathname === returnToRoute ? "/library" : returnToRoute;

    // Get current auth state
    const [authState] = useAuth(); // Think: const { user } = useSelector((state) => state.auth);
    const isLoggedIn = isLoggedInSelector(authState);
    const isAuthPending = authState.isPending;
    const userRole = authState.user.role;

    // Test current auth state with above switch table, which returns
    const meetsAuthReqs = isMeetingAuthReq(authReq, isLoggedIn, userRole);

    useEffect(() => {
        if (isAuthPending || meetsAuthReqs) {
        return;
        }
        // If test fails, redirect the user to somewhere reasonable, and display spinner in the meantime
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

And the ternary which determines the returnToRoute assignment -- if it's truthy, /library is assigned, and if it's falsy it's assigned directly. What falsy value could it return, and how could it be assigned without break navigate calls() in the switch cases?

RouteInfoCtx.tsx (the route info context which useRouteinfo() exposes:

```
import { createAction, createReducer } from '@reduxjs/toolkit';
import React, { PropsWithChildren, useEffect, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteInfoState } from './types';

const ROUTE_INFO_ACTIONS = {
setPrevRoute: createAction<{ prevRoute: string }>('setPrevRoute'),
setReturnToRoute: createAction<{ returnToRoute: string }>('setReturnToRoute'),
};

const RETURN_TO_PATHNAMES = ['/library', '/n', '/upload', '/users', '/tags'];

const getInitialState = (): RouteInfoState => ({ prevRoute: '', returnToRoute: '/library' });

const routeInfoReducer = createReducer(getInitialState(), (builder) => {
builder.addCase(ROUTE_INFO_ACTIONS.setPrevRoute, (state, action) => {
    state.prevRoute = action.payload.prevRoute;
});
builder.addCase(ROUTE_INFO_ACTIONS.setReturnToRoute, (state, action) => {
    state.returnToRoute = action.payload.returnToRoute;
});
});

export const RouteInfoCtx = React.createContext<RouteInfoState>(getInitialState());

export const RouteInfoProvider: React.FC<PropsWithChildren<{}>> = (props) => {
const [state, dispatch] = useReducer(routeInfoReducer, getInitialState());
const location = useLocation();

useEffect(
    // This only fires when cleaning up so it is not run when it initially mounts.
    () => () => {
    dispatch(ROUTE_INFO_ACTIONS.setPrevRoute({ prevRoute: location.pathname }));
    },
    [location]
);

useEffect(() => {
    if (RETURN_TO_PATHNAMES.some((pathname) => location.pathname.startsWith(pathname))) {
    dispatch(ROUTE_INFO_ACTIONS.setReturnToRoute({ returnToRoute: location.pathname }));
    }
}, [location]);

return <RouteInfoCtx.Provider value={state}>{props.children}</RouteInfoCtx.Provider>;
};
```

---

Correction: the ternary fallback to 'library' is triggered if returnToRoute is truthy. If it's falsy, it stays unchanged, passing a falsy value through the switch block...

---

But I assumed that since this is in HOC scope, location.pathname and returnToRoute would both reference the route previous to the one the HOC returns.

---

Got it. This HOC and Landing seem to be the only components that read prevRoute state (via useRouteInfo()). But since, presumably, the setPrevRoute dispatch in the RouteInfoCtx.tsx cleanup function happens when the user navigates away, does that mean that routeInfo-state-calling components necessarily both read and write to that state?

---

Oh, so RouteInfoCtx.tsx runs its cleanup function whenever any child component to RouteInfoProvider is navigated away from, whether they call useRouteInfo() or not? It does seem to be read-only state to calling components since useRouteInfo() doesn't return any mutators. I suppose auth state changes globally whether a component opts in to it with useAuth(), so this shouldn't be different.

---

So the authRequirement HOC can't actually receive a falsy prevRoute value since its value is assured globally. The check is for whether the user refreshed, not whether prevRoute is valid.

---

So, verify my comment:

```
// If a logged in user hasn't navigated to one of the RETURN_TO_PATHNAMES locations yet, they're by default returned to /library if they attempt to access a withAuthRequirement component w/ insufficient authReq. Otherwise, they're returned to the most recent RETURN_TO_PATHNAMES location visited. And if they're not logged in, they're generally returned to /login.

const RETURN_TO_PATHNAMES = ['/library', '/n', '/upload', '/users', '/tags'];

const getInitialState = (): RouteInfoState => ({ prevRoute: '', returnToRoute: '/library' });

const routeInfoReducer = createReducer(getInitialState(), (builder) => {
builder.addCase(ROUTE_INFO_ACTIONS.setPrevRoute, (state, action) => {
    state.prevRoute = action.payload.prevRoute;
});
builder.addCase(ROUTE_INFO_ACTIONS.setReturnToRoute, (state, action) => {
    state.returnToRoute = action.payload.returnToRoute;
});
});

export const RouteInfoCtx = React.createContext<RouteInfoState>(getInitialState());

export const RouteInfoProvider: React.FC<PropsWithChildren<{}>> = (props) => {
const [state, dispatch] = useReducer(routeInfoReducer, getInitialState());
const location = useLocation();

useEffect(
    // This only fires when cleaning up so it is not run when it initially mounts.
    () => () => {
    dispatch(ROUTE_INFO_ACTIONS.setPrevRoute({ prevRoute: location.pathname }));
    },
    [location]
);

useEffect(() => {
    if (RETURN_TO_PATHNAMES.some((pathname) => location.pathname.startsWith(pathname))) {
    dispatch(ROUTE_INFO_ACTIONS.setReturnToRoute({ returnToRoute: location.pathname }));
    }
}, [location]);

return <RouteInfoCtx.Provider value={state}>{props.children}</RouteInfoCtx.Provider>;
};
```

---

Final question: There's the auth-related route info use case, as explained above, and then there's the "does landing redirect user to library?" use case. Landing component calls useRoutingBehavior() which in turn retrieves prevRoute via useRouteInfo() to run this test. I'd like a walkthrough of the flow, with attention to how localStorage is involved.

Landing:

```
export const Landing: React.FC<Props> = enhance((props: Props) => {
const { shouldRedirectFromLandingToLibrary, recordLandingVisit } = useRoutingBehavior();

useEffectOnce(() => {
recordLandingVisit();
});

return (
<Outer data-testid="landing">
{shouldRedirectFromLandingToLibrary && <Navigate to="/library" replace />}

{ ... }
</Outer>
);
```

useRoutingBehavior:

```
// Redirect the user if they last visited between 1 minute and 14 days.
// This gives people a 1 minute grace period to try to visit the landing using a link
// again.
const ONE_MINUTE = Duration.min(1);
const TWO_WEEKS = Duration.day(14);
const REDIRECT_LANDING_TO_LIBRARY_TIME_MS_RANGE = NumberRange.from(ONE_MINUTE.ms).to(TWO_WEEKS.ms);

const getMsSinceEpoch = () => new Date().getTime();

export const useRoutingBehavior = () => {
const { prevRoute } = useRouteInfo();
const isInitialPage = prevRoute === '';
const [cache, updateCache] = useRoutingLocalCache();

const [shouldRedirectFromLandingToLibrary, setShouldRedirectFromLandingToLibrary] = useState(() => {
    const msSinceLandingLastVisited = getMsSinceEpoch() - cache.lastVisitedLandingAtMsSinceEpoch;
    return isInitialPage && REDIRECT_LANDING_TO_LIBRARY_TIME_MS_RANGE.contains(msSinceLandingLastVisited);
});

const recordLandingVisit = useCallback(() => {
    updateCache({
    ...cache,
    lastVisitedLandingAtMsSinceEpoch: getMsSinceEpoch(),
    });
}, [cache, updateCache]);

useEffect(() => {
    setShouldRedirectFromLandingToLibrary(false);
}, [isInitialPage]);

return { shouldRedirectFromLandingToLibrary, recordLandingVisit };
};
```

useRoutingLocalCache:

```
const DEFAULT_ROUTING_CACHE: RoutingCache = Object.freeze({
lastVisitedLandingAtMsSinceEpoch: 0,
});

export const useRoutingLocalCache = () => useLocalStorage(ROUTING_CACHE_KEY, DEFAULT_ROUTING_CACHE);
```

---

Why is compose() required here? WithLayout is a HOC that simply adds styling (based on Layout param) to the component passed.

```
const enhance = compose(withLayout(Layout.DEFAULT));

export const Landing: React.FC<Props> = enhance((props: Props) => {
const { shouldRedirectFromLandingToLibrary, recordLandingVisit } = useRoutingBehavior();

useEffectOnce(() => {
    recordLandingVisit();
});

return (
    <></>
);
});

const getLayout = (layout: Layout, opts: LayoutOptions): React.FC<PropsWithChildren<{}>> => {
switch (layout) {
    case Layout.DEFAULT:
    return (props) => (
        <DefaultLayout lanes={opts.lanes} footer={opts.footer}>
        {props.children}
        </DefaultLayout>
    );
    case Layout.NONE:
    return NoneLayout;
    default:
    throw new TypeError(unrecognized layout: '${layout}');
}
};
```

WithLayout.tsx:

```
export const withLayout = (layout: Layout, opts: LayoutOptions = DEFAULT_OPTIONS) => {
const LayoutComponent = getLayout(layout, opts);
return function<P>(Component: React.ComponentType<P>) {
    return (props: P) => (
    <LayoutComponent>
        <Component {...props} />
    </LayoutComponent>
    );
};
}; 
```

---

To backtrack, useRoutingBehavior essentially tests for a fresh session and, by reading localstorage, whether the user last touched Landing between 1m-2w ago, and redirects to library if so -- but in either case, it updates localstorage before render.

---

```
const N = compose(withAuthRequirement(AuthRequirement.NONE))(React.lazy(() => import('./components/N')));
```

And this import isn't a compose() of both loaded HOC and lazy import... it's a HOC passed to a redundant compose() function that takes a lazy import component as a param... right?

---

All good, seems it's just preemptive scaling, much like the other 99% of this app lol

---