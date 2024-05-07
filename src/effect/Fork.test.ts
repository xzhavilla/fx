import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Layer from '../Layer'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Exception from './Exception'
import * as $Fork from './Fork'
import * as $Proxy from './Proxy'

describe('Fork', () => {
  describe('fork', () => {
    test('forking normal function', async () => {
      await expect(
        $Runtime.runPromise(
          $Fork.fork()(
            async (run) =>
              [
                await run(function* () {
                  return 42
                }),
                await run(async function* () {
                  return 1337
                }),
              ] as const,
          ),
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual([$Exit.success(42), $Exit.success(1337)])
    })

    test('throwing error', async () => {
      await expect(
        $Runtime.runPromise(
          $Fork.fork()((run) =>
            run(function* () {
              throw new Error('foo')
            }),
          ),
          $Layer.layer(),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('foo'), {} as any)),
      )
    })

    test('raising error', async () => {
      await expect(
        $Runtime.runPromise(
          $Fork.fork()((run) =>
            run(function* () {
              return yield* $Exception.raise(new Error('foo'))
            }),
          ),
          $Layer.layer(),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('foo'), {} as any)),
      )
    })

    test('forking generator function', async () => {
      await expect(
        $Runtime.runPromise(
          $Fork.fork()(async function* (run) {
            return [
              await run(function* () {
                return 42
              }),
              await run(async function* () {
                return 1337
              }),
            ] as const
          }),
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual([$Exit.success(42), $Exit.success(1337)])
    })

    test('raising error from generator function', async () => {
      await expect(
        $Runtime.runExit(
          $Fork.fork()(() => $Exception.raise(new Error('foo'))),
          $Layer.layer(),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('foo'), {} as any)),
      )
    })

    test('forking function with effects', async () => {
      interface Get42 {
        readonly [uri]?: unique symbol
        (): 42
      }

      const tag42 = $Tag.tag<Get42>()
      const get42 = $Proxy.function(tag42)

      interface Get1337 {
        readonly [uri]?: unique symbol
        (): 1337
      }

      const tag1337 = $Tag.tag<Get1337>()
      const get1337 = $Proxy.function(tag1337)

      await expect(
        $Runtime.runPromise(
          $Fork.fork()(async function* (run) {
            const a = yield* get42()
            const b = yield* get1337()

            return run(function* () {
              return [a, b] as const
            })
          }),
          $Layer
            .layer()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual($Exit.success([42, 1337]))
    })

    test('running function with unexpected effect', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tag = $Tag.tag<Random>()
      const random = $Proxy.function(tag)

      await expect(
        $Runtime.runPromise(
          // @ts-expect-error
          $Fork.fork()((run) => run(random)),
          $Layer.layer(),
        ),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.die(new Error('Cannot find handler for effect'), {} as any),
        ),
      )
    })

    test('running functions with effects', async () => {
      interface Get42 {
        readonly [uri]?: unique symbol
        (): 42
      }

      const tag42 = $Tag.tag<Get42>()
      const get42 = $Proxy.function(tag42)

      interface Get1337 {
        readonly [uri]?: unique symbol
        (): 1337
      }

      const tag1337 = $Tag.tag<Get1337>()
      const get1337 = $Proxy.function(tag1337)

      await expect(
        $Runtime.runPromise(
          $Fork.fork<Get42 | Get1337>()(
            async (run) => [await run(get42), await run(get1337)] as const,
          ),
          $Layer
            .layer()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([$Exit.success(42), $Exit.success(1337)])
    })
  })
})
