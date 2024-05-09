import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Layer from '../Layer'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Interruption from './Interruption'
import * as $Proxy from './Proxy'

describe('Interruption', () => {
  interface Random {
    readonly [uri]?: unique symbol
    (): number
  }

  const tag = $Tag.tag<Random>()
  const random = $Proxy.function(tag)

  test('interrupting root fiber', async () => {
    await expect(
      $Runtime.runExit($Interruption.interrupt(), $Layer.layer()),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
  })

  test('interrupting child fiber', async () => {
    await expect(
      $Runtime.runExit(
        random,
        $Layer.layer().with(tag, function* () {
          return yield* $Interruption.interrupt()
        }),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
  })

  test('ignoring `catch` on interrupt', async () => {
    let a = 0

    await expect(
      $Runtime.runExit(
        function* () {
          try {
            return yield* random()
          } catch {
            a++
          }
        },
        $Layer.layer().with(tag, function* () {
          return yield* $Interruption.interrupt()
        }),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
    expect(a).toStrictEqual(0)
  })

  test('running `finally` on interrupt', async () => {
    let a = 0

    await expect(
      $Runtime.runExit(
        function* () {
          try {
            return yield* random()
          } finally {
            a++
          }
        },
        $Layer.layer().with(tag, function* () {
          return yield* $Interruption.interrupt()
        }),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
    expect(a).toStrictEqual(1)
  })
})