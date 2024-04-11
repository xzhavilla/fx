import * as E from './Effect'
import * as F from './Function'
import * as G from './Generator'
import { Generated } from './Generator'
import { Handler } from './Handler'
import { Has } from './Has'
import * as S from './Struct'
import * as T from './Tag'
import { URI } from './Type'

export interface Fork {
  readonly [URI]?: unique symbol
  <R = never>(): <
    F extends (
      run: <
        G extends
          | Generator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >
          | AsyncGenerator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >,
      >(
        f: () => G,
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => ReturnType<F> extends infer G extends Generator | AsyncGenerator
    ? Generator<
        | (R extends infer _R ? (_R extends never ? never : Has<_R>) : never)
        | G.YOf<G>,
        Generated<Awaited<G.ROf<G>>>
      >
    : Generator<
        R extends infer _R ? (_R extends never ? never : Has<_R>) : never,
        Generated<Awaited<ReturnType<F>>>
      >
}

export const tag = T.tag<Fork>('Fork')

export function fork<R = never>() {
  return <
    F extends (
      run: <
        G extends
          | Generator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >
          | AsyncGenerator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >,
      >(
        f: () => G,
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => E.functionA(tag)((r) => r<R>()(f))
}

export const forkWithContext = function (this: {
  run: <G extends Generator | AsyncGenerator>(
    f: () => G,
  ) => Promise<Generated<Awaited<G.ROf<G>>>>
}) {
  const ctx = this
  if (!S.is(ctx) || !S.has(ctx, 'run') || !F.is(ctx.run)) {
    throw new Error(
      `Cannot access context from "${tag.key.description}" handler`,
    )
  }

  return <
    F extends (
      run: <G extends Generator | AsyncGenerator>(
        f: () => G,
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => f(ctx.run)
} satisfies Handler<Fork>