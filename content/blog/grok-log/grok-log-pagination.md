---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-pagination'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

I understand that useNotationPreviews() calls its loadPage() function to query the db for the next page of notations, and loadPage() is triggered by  Library.tsx:onIntersectionEnter() when the user scrolls past some threshold. But I don't understand how the first page of notations is rendered, since when a search query state change re-renders Library.tsx, loadPage() is not called. What are the flows for first page (query state change) and next page(s) (loadPage()), respectively?

Library component:

```
export const Library: React.FC = enhance(() => {
  const { xs, sm } = useViewport();

  const [tags] = useTags();

  const [affixed, setAffixed] = useState(false);
  const onAffixChange = (nextAffixed?: boolean | undefined) => setAffixed(!!nextAffixed);
  const [query, setQuery] = useState('');
  const [tagIds, setTagIds] = useState(new Array<string>());

  const tagIdsSet = useMemo(() => new Set(tagIds), [tagIds]);
  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setQuery(event.target.value);
  };
  const onTagIdsChange = (tagId: string) => (isChecked: boolean) => {
    const normalize = (tagIds: string[]) => uniq(tagIds).sort();
    let nextTagIds: string[];
    if (isChecked) {
      nextTagIds = normalize([...tagIds, tagId]);
    } else {
      nextTagIds = normalize(without([...tagIds], tagId));
    }
    if (!isEqual(tagIds, nextTagIds)) {
      setTagIds(nextTagIds);
    }
  };
  const isTagChecked = useCallback((tagId: string) => tagIdsSet.has(tagId), [tagIdsSet]);
  const hasSearchTerm = query.length > 0 || tagIds.length > 0;
  const onSearchTermClear: MouseEventHandler<HTMLSpanElement> = (event) => {
    setQuery('');
    setTagIds([]);
  };

  // =============================================================================
  // FLOW: query change -> setQuery() -> re-render -> run useNotationPreviews(query) -> ? / pass scroll threshold -> onIntersectionEnter -> loadPage() -> ? -> 
  // pg_trgm.gin_trgm_ops index used on notations fields (artist_name, song_name) and joined users field (username) to resolve misspelled queries
  const [notations, pageInfo, loadPage, status] = useNotationPreviews(PAGE_SIZE, query, tagIds);
  // =============================================================================
  
  // =============================================================================
  // SEARCH FIELD DEBOUNCING
  // =============================================================================

  const [hasLoadedFirstPageOnce, setHasLoadedFirstPageOnce] = useState(false);
  useEffect(() => {
    setHasLoadedFirstPageOnce((hasLoadedFirstPageOnce) => hasLoadedFirstPageOnce || pageInfo.hasLoadedFirstPage);
  }, [pageInfo]);

  const [debouncing, debounce] = useDebouncer(DEBOUNCE_DELAY, { leading: !hasLoadedFirstPageOnce });
  useEffect(debounce, [debounce, query, tagIds]);

  // Loads next page (10 notations)
  const onIntersectionEnter = useCallback(() => {
    if (REACT_SNAP_ACTIVE) {
      return;
    }
    if (debouncing) {
      return;
    }
    loadPage();
  }, [debouncing, loadPage]);

  // =============================================================================
  // RENDER BRANCHES
  // =============================================================================

  const isLoading = debouncing || status === GqlStatus.Init || status === GqlStatus.Pending;

  const shouldShowList = !debouncing && pageInfo.hasLoadedFirstPage && notations.length > 0;

  const shouldShowErrors = status === GqlStatus.Errors;
  const shouldShowNothingFound = !debouncing && pageInfo.hasLoadedFirstPage && notations.length === 0;
  const shouldShowNoMoreContent =
    !debouncing && pageInfo.hasLoadedFirstPage && !pageInfo.hasNextPage && notations.length > 0;

  return (
    <Outer data-testid="library" xs={xs}>
      <Affix onChange={onAffixChange}>
        <AffixInner xs={xs} affixed={affixed}>
          <SearchOuter xs={xs}>
            {/* Search field */}
            <Input
              value={query}
              onChange={onQueryChange}
              placeholder="song, artist, or transcriber name"
              prefix={<SearchIcon />}
              suffix={hasSearchTerm && <CloseCircleOutlined onClick={onSearchTermClear} />}
            />
            <TagSearch justify="center" align="middle">
              {tags.map((tag) => (
                <StyledCheckableTag key={tag.id} checked={isTagChecked(tag.id)} onChange={onTagIdsChange(tag.id)}>
                  {tag.name}
                </StyledCheckableTag>
              ))}
            </TagSearch>
          </SearchOuter>
        </AffixInner>
      </Affix>

      <Row justify="center" align="middle">
        {hasSearchTerm ? (
          <Button type="link" size="small" onClick={onSearchTermClear}>
            remove filters
          </Button>
        ) : (
          <Button size="small">{/* Dummy button for DOM spacing */}</Button>
        )}
      </Row>

      {shouldShowList && (
        <>
          <br />
          <br />

          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
            style={{ padding: xs || sm ? '16px' : 0, border: '1px solid rgba(255,255,255,0)' }}
            dataSource={notations}
            rowKey={(notation) => notation.id}
            renderItem={(notation) => (
              <List.Item>
                <Link to={/n/${notation.id}}>
                  <NotationCard notation={notation} query={query} isTagChecked={isTagChecked} />
                </Link>
              </List.Item>
            )}
          />
        </>
      )}

      {shouldShowNothingFound && (
        <>
          <br />
          <br />

          <Row justify="center" align="middle">
            <SonarSearch style={{ width: '50%' }} />
          </Row>

          <br />

          <Row justify="center">
            <NoMore>did not find anything</NoMore>
          </Row>
        </>
      )}

      <IntersectionTrigger onEnter={onIntersectionEnter} />

      {shouldShowErrors && (
        <AlertOuter xs={xs}>
          <Alert showIcon closable type="error" message="something went wrong" />
        </AlertOuter>
      )}

      {isLoading && (
        <>
          <br />
          <br />
          <Row justify="center">{<LoadingIcon />}</Row>
        </>
      )}

      {shouldShowNoMoreContent && (
        <Row justify="center">
          <NoMore>no more content</NoMore>
        </Row>
      )}
    </Outer>
  );
});
```

useNotationPreviews hook:

```
import { useCallback, useEffect, useState } from 'react';
import { Notation, Tag, User } from '../domain';
import * as graphql from '../lib/graphql';
import * as pager from '../lib/pager';
import * as queries from '../lib/queries';
import { GqlStatus, useGql } from './useGql';
import { useGqlHandler } from './useGqlHandler';

type Transcriber = Pick<User, 'id' | 'username' | 'role' | 'avatarUrl'>;

type NotationPreview = Omit<Notation, 'createdAt' | 'updatedAt'> & {
  transcriber: Transcriber;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

type LoadPage = () => void;

type PageInfo = pager.PageInfo & {
  hasLoadedFirstPage: boolean;
};

const getInitialPageInfo = () => ({
  ...pager.getInitialPageInfo(),
  hasLoadedFirstPage: false,
});

const toNotationPreviews = (connection: graphql.DataOf<typeof queries.NOTATION_PREVIEWS>): NotationPreview[] => {
  return (connection?.edges || []).map((edge) => {
    const transcriber = { ...edge.node.transcriber };
    return { ...edge.node, transcriber } as NotationPreview;
  });
};

export const useNotationPreviews = (
  pageSize: number,
  query: string,
  tagIds: string[]
): [notations: NotationPreview[], pageInfo: PageInfo, loadPage: LoadPage, status: GqlStatus] => {
  const [notations, setNotations] = useState(new Array<NotationPreview>());
  const [pageInfo, setPageInfo] = useState(getInitialPageInfo);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exec, res, _, reset] = useGql(queries.NOTATION_PREVIEWS);
  useGqlHandler.onSuccess(res, ({ data }) => {
    const connection = data.notations!;
    // the server sorts by ascending cursor, but we're pagingating backwards
    // this is correct according to spec:
    // https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments
    setNotations((notations) => [...notations, ...toNotationPreviews(connection).reverse()]);
    setPageInfo({ ...connection.pageInfo, hasLoadedFirstPage: true });
  });

  useEffect(() => {
    setNotations([]);
    setPageInfo(getInitialPageInfo);
    reset();
  }, [query, tagIds, reset]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadPage = useCallback(() => {
    if (res.status === GqlStatus.Pending) {
      return;
    }
    if (!pageInfo.hasNextPage) {
      return;
    }
    exec({
      first: pageSize,
      after: pageInfo.endCursor,
      query: query ? query : null,
      tagIds: tagIds.length ? tagIds : null,
    });
  }, [exec, res, pageSize, pageInfo, query, tagIds]);

  return [notations, pageInfo, loadPage, res.status];
};
```

---

So IntersectionTrigger gatekeeps loadPage() on both first and subsequent page renders? Then if scroll threshold is used for subsequent, what is used for first? And what exactly does IntersectionTrigger do?

```
import { noop } from 'lodash';
import React, { useEffect, useRef } from 'react';

type Props = {
  onEnter?: () => void;
  onExit?: () => void;
};

export const IntersectionTrigger: React.FC<Props> = (props) => {
  const onEnter = props.onEnter || noop;
  const onExit = props.onExit || noop;

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) {
      return;
    }
    if (!onEnter && !onExit) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onEnter();
      } else {
        onExit();
      }
    });

    observer.observe(div);
    return () => {
      observer.disconnect();
    };
  }, [divRef, onEnter, onExit]);

  return (
    <div data-testid="intersection-trigger" ref={divRef}>
      <br />
    </div>
  );
};
```

Also, can you explain GraphQL nodes and edges in the context of this app's notation preview / pagination layer, as well as the meaning of "first" and "after" (and why "before" and "last" never seem to be provided client-side, but are handled on the backend)?

Backend - NotationRepo:findPage():

```
  // Trigger: "notations" query via <Library /> search field
  async findPage(args: NotationConnectionArgs): Promise<Connection<Notation>> {
    const tagIds = args.tagIds || null;
    // Search field query
    const query = args.query ? %${args.query}% : null;

    return await NotationRepo.pager.connect(args, async (pagingCtx: PagingCtx) => {
      const { cursor, limit, pagingType } = pagingCtx;  
      const queryArgs = { cursor, limit, pagingType, tagIds, query };

      const [entities, minRows, maxRows] = await Promise.all([
        this.db.query<Notation>(findNotationPageQuery(queryArgs)),
        this.db.query<number>(findNotationPageMinQuery(queryArgs)),
        this.db.query<number>(findNotationPageMaxQuery(queryArgs)),
      ]);

      // ==============================================================
      // SAME CODE FOR BOTH NOTATIONREPO.FINDPAGE AND USERREPO.FINDPAGE
      // ==============================================================

      if (pagingType === PagingType.BACKWARD) {
        entities.reverse();
      }

      const min = get(minRows, '[0].min') || -Infinity;
      const max = get(maxRows, '[0].max') || +Infinity;

      return { entities, min, max };
    });
```

Backend - Pager.ts (NotationRepo.pager):

```
// https://graphql.org/learn/pagination/

import { first, last } from 'lodash';
import { InternalError, UnknownError } from '../../errors';
import { Base64 } from '../base64';
import {
  Connection,
  ConnectionArgs,
  Edge,
  EntityFinder,
  EntityFinderResults,
  PageInfo,
  PagingCtx,
  PagingEntity,
  PagingMeta,
  PagingType,
} from './types';

export class Pager<T extends PagingEntity> {
  static DEFAULT_FORWARD_CURSOR = 0;
  static DEFAULT_BACKWARD_CURSOR = 2147483645;
  static CURSOR_DELIMITER = ':';

  static meta(connectionArgs: ConnectionArgs): PagingMeta {
    const { first = null, last = null, after = null, before = null } = connectionArgs;
    const isForwardPaging = !!first || !!after;
    const isBackwardPaging = !!last || !!before;

    if (isForwardPaging && isBackwardPaging) {
      throw new Error('cursor-based pagination cannot be forwards and backwards');
    }
    if ((isForwardPaging && before) || (isBackwardPaging && after)) {
      throw new Error('paging must use either first/after or last/before');
    }
    if ((typeof first === 'number' && first < 0) || (typeof last === 'number' && last < 0)) {
      throw new Error('paging limit must be positive');
    }

    if (isBackwardPaging) {
      return { pagingType: PagingType.BACKWARD, before, last };
    }
    return { pagingType: PagingType.FORWARD, after, first };
  }

  readonly defaultLimit: number;
  readonly cursorType: string;

  constructor(defaultLimit: number, cursorType: string) {
    this.defaultLimit = defaultLimit;
    this.cursorType = cursorType;
  }

  decodeCursor(encodedCursor: string): number {
    const [cursorType, cursor] = Base64.decode(encodedCursor).split(Pager.CURSOR_DELIMITER);
    if (cursorType !== this.cursorType) {
      throw new Error(expected cursor type '${this.cursorType}', got: ${cursorType});
    }
    try {
      return parseInt(cursor, 10);
    } catch (e) {
      throw new Error(cannot decode cursor: ${cursor});
    }
  }

  encodeCursor(decodedCursor: number): string {
    return Base64.encode(${this.cursorType}${Pager.CURSOR_DELIMITER}${decodedCursor});
  }
  
  async connect(connectionArgs: ConnectionArgs, findEntities: EntityFinder<T>): Promise<Connection<T>> {
    /* pagingCtx = {
        cursor: pagingMeta.after ? this.decodeCursor(pagingMeta.after) : Pager.DEFAULT_FORWARD_CURSOR,
        limit: typeof pagingMeta.first === 'number' ? pagingMeta.first : this.defaultLimit,
        pagingType: pagingMeta.pagingType,
      };
    */
    const pagingCtx = this.getPagingCtx(connectionArgs);

    // Pass pagingCtx to NotationRepo.pager.connect() callback
    let results = await findEntities(pagingCtx);
    results = this.sanitizeNaNs(results);
    this.validate(results, pagingCtx);

    const edges = this.getEdges(results);
    const pageInfo = this.getPageInfo(results, pagingCtx);

    return { edges, pageInfo };
  }

  private getPagingCtx(connectionArgs: ConnectionArgs): PagingCtx {
    /* pagingMeta = { 
        pagingType: PagingType.FORWARD, 
        after, 
        first 
      }
    */
    const pagingMeta = Pager.meta(connectionArgs);

    switch (pagingMeta.pagingType) {
      case PagingType.FORWARD:
        return {
          cursor: pagingMeta.after ? this.decodeCursor(pagingMeta.after) : Pager.DEFAULT_FORWARD_CURSOR,
          limit: typeof pagingMeta.first === 'number' ? pagingMeta.first : this.defaultLimit,
          pagingType: pagingMeta.pagingType,
        };

      case PagingType.BACKWARD:
        return {
          cursor: pagingMeta.before ? this.decodeCursor(pagingMeta.before) : Pager.DEFAULT_BACKWARD_CURSOR,
          limit: typeof pagingMeta.last === 'number' ? pagingMeta.last : this.defaultLimit,
          pagingType: pagingMeta.pagingType,
        };

      default:
        throw new UnknownError();
    }
  }

  private sanitizeNaNs(results: EntityFinderResults<T>): EntityFinderResults<T> {
    return {
      ...results,
      min: isNaN(results.min) ? -Infinity : results.min,
      max: isNaN(results.max) ? +Infinity : results.max,
    };
  }

  private validate(results: EntityFinderResults<T>, pagingCtx: PagingCtx): void {
    const { cursor, limit, pagingType } = pagingCtx;
    const { entities, min, max } = results;

    if (typeof min !== 'number') {
      throw new InternalError('min must be a number');
    }

    if (typeof max !== 'number') {
      throw new InternalError('max must be a number');
    }

    if (entities.length > limit) {
      throw new InternalError('too many entities returned');
    }

    for (let ndx = 0; ndx < entities.length - 1; ndx++) {
      const [curr, next] = entities.slice(ndx, ndx + 2);
      if (curr.cursor > next.cursor) {
        throw new InternalError('entities must be sorted in ascending cursors');
      }
    }

    switch (pagingType) {
      case PagingType.FORWARD:
        if (entities.some((entity) => entity.cursor < cursor)) {
          throw new InternalError('entity returned with cursor outside of context');
        }
        break;

      case PagingType.BACKWARD:
        if (entities.some((entity) => entity.cursor > cursor)) {
          throw new InternalError('entity returned with cursor outside of context');
        }
        break;

      default:
        throw new UnknownError();
    }
  }

  private getEdges(results: EntityFinderResults<T>): Array<Edge<T>> {
    return results.entities.map((entity) => ({ node: entity, cursor: this.encodeCursor(entity.cursor) }));
  }

  private getPageInfo(results: EntityFinderResults<T>, pagingCtx: PagingCtx): PageInfo {
    const { cursor, pagingType } = pagingCtx;
    const { entities, min, max } = results;

    let hasNextPage: boolean;
    let hasPreviousPage: boolean;
    const cursors = entities.map((entity) => entity.cursor);
    switch (pagingType) {
      case PagingType.FORWARD:
        hasNextPage = Boolean(cursors.length) && max > Math.max(...cursors);
        hasPreviousPage = cursor >= min && min < Math.min(...cursors);
        break;

      case PagingType.BACKWARD:
        hasNextPage = Boolean(cursors.length) && min < Math.min(...cursors);
        hasPreviousPage = cursor <= max && max > Math.max(...cursors);
        break;

      default:
        throw new UnknownError();
    }

    const startCursor = entities.length ? this.encodeCursor(first(entities)!.cursor) : null;
    const endCursor = entities.length ? this.encodeCursor(last(entities)!.cursor) : null;

    return { startCursor, endCursor, hasNextPage, hasPreviousPage };
  }
}
```

---

loadPage() isn't directly called anywhere on first page query, from what I'm seeing.

---

Throughout the codebase, loadPage() only exists in the locations mentioned. I'll assume it's rendered immediately due to a short DOM. 

The GraphQL response handler is confusing, since it calls properties that don't directly belong to the NotationRepo.findPage() (db) return type: pageInfo and edges.

On deeper inspection, the db results are passed up to the top-level API resolver, which seems to wrap them in NotationConnection object, providing the pageInfo and edges properties. But in that block, the db result (attrs) apparently has those properties as well. When were they set?

useNotationPreviews confusing bit:

```
  useGqlHandler.onSuccess(res, ({ data }) => {
    const connection = data.notations!;
    // the server sorts by ascending cursor, but we're pagingating backwards
    // this is correct according to spec:
    // https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments
    setNotations((notations) => [...notations, ...toNotationPreviews(connection).reverse()]);
    setPageInfo({ ...connection.pageInfo, hasLoadedFirstPage: true });
  });
```

Backend - NotationResolver:

```
  @Query((returns) => types.NotationConnection)
  async notations(@Args() args: types.NotationConnectionArgs): Promise<types.NotationConnection> {
    // connection = { entities, min, max }
    const connection = await this.notationService.findPage(args);
    return types.NotationConnection.of(connection);
  }
```

Backend - NotationConnection:

```
@ObjectType()
export class NotationConnection implements Connection<domain.Notation> {
  static of(attrs: Connection<domain.Notation>) {
    const connection = new NotationConnection();
    connection.pageInfo = PageInfo.of(attrs.pageInfo);
    connection.edges = attrs.edges;
    return connection;
  }

  @Field((type) => PageInfo)
  pageInfo!: PageInfo;

  @Field((type) => [NotationEdge])
  edges!: Edge<domain.Notation>[];
}
```

---

So how does the Pager track the most recent rendered page when loadPage() fires on the frontend?

---

So the backend passes back a new pageInfo.endCursor value with each query, and that value is used as the "after" variable in the next loadPage() call.

---

So an edge is composed of a cursor and a node, which is a single object in the array of data returned?

---