import { SmartBuffer } from 'smart-buffer'
import {
  CUpdateOracle,
  UpdateOracle
} from '../../../../src/script/defi/dftx_oracles'
import { OP_CODES } from '../../../../src/script'
import { toBuffer, toOPCodes } from '../../../../src/script/_buffer'
import { OP_DEFI_TX } from '../../../../src/script/defi'

// 04000000010005eac274a4a94f34e380410978335b136ed46d79ada30064736dd13a4ccf6a010000006a47304402200ab4dca88cd0b5a89c654242dd5fa5fa411cfe39aff18e518e3b6c1e743fedab02204d9a3338fdf6a5134b3c3746d434196e601318392d458623189572aba751bb250121030e73d57cc3cd9a450d6d34ba68b1b241e9a427f4ff929ed92c333a990315e4b9ffffffff020000000000000000626a4c5f4466547874061d35948925528b2025c4b84ea6f4899bab6efbcaf63776258186d7728424d11976a914ad1eaafdd6edcf2260f28cb31e24117c240681ca88ac0503055445534c4103455552055445534c41034a5059055445534c410355534400f0339c76000000001976a914e5ed1bfa532e2358e964381a70e0df6d4dd0041988ac0000000000
// 5f4466547874061d35948925528b2025c4b84ea6f4899bab6efbcaf63776258186d7728424d11976a914ad1eaafdd6edcf2260f28cb31e24117c240681ca88ac0503055445534c4103455552

it('should bi-directional buffer-object-buffer', () => {
  const fixtures = [
    '6a4c5f4466547874061d35948925528b2025c4b84ea6f4899bab6efbcaf63776258186d7728424d11976a914ad1eaafdd6edcf2260f28cb31e24117c240681ca88ac0503055445534c4103455552055445534c41034a5059055445534c4103555344'
  ]

  fixtures.forEach(hex => {
    const stack = toOPCodes(
      SmartBuffer.fromBuffer(Buffer.from(hex, 'hex'))
    )
    const buffer = toBuffer(stack)
    expect(buffer.toString('hex')).toBe(hex)
    expect((stack[1] as OP_DEFI_TX).tx.type).toBe(0x74)
  })
})

const header = '6a4c5f4466547874' // OP_RETURN, PUSH_DATA(5f44665478, 74)
const data = '061d35948925528b2025c4b84ea6f4899bab6efbcaf63776258186d7728424d11976a914ad1eaafdd6edcf2260f28cb31e24117c240681ca88ac0503055445534c4103455552055445534c41034a5059055445534c4103555344'
const updateOracle: UpdateOracle = {
  script: {
    stack: [
      OP_CODES.OP_DUP,
      OP_CODES.OP_HASH160,
      OP_CODES.OP_PUSHDATA_HEX_LE('ad1eaafdd6edcf2260f28cb31e24117c240681ca'),
      OP_CODES.OP_EQUALVERIFY,
      OP_CODES.OP_CHECKSIG
    ]
  },
  oracleId: 'd1248472d78681257637f6cafb6eab9b89f4a64eb8c425208b52258994351d06',
  weightage: 5,
  pricefeeds: [
    {
      token: 'TESLA',
      currency: 'EUR'
    },
    {
      token: 'TESLA',
      currency: 'JPY'
    },
    {
      token: 'TESLA',
      currency: 'USD'
    }
  ]
}

it('should craft dftx with OP_CODES._()', () => {
  const stack = [
    OP_CODES.OP_RETURN,
    OP_CODES.OP_DEFI_TX_UPDATE_ORACLE(updateOracle)
  ]

  const buffer = toBuffer(stack)
  expect(buffer.toString('hex')).toBe(header + data)
})

describe('Composable', () => {
  it('should compose from buffer to composable', () => {
    const buffer = SmartBuffer.fromBuffer(Buffer.from(data, 'hex'))
    const composable = new CUpdateOracle(buffer)

    expect(composable.toObject()).toEqual(updateOracle)
  })

  it('should compose from composable to buffer', () => {
    const composable = new CUpdateOracle(updateOracle)
    const buffer = new SmartBuffer()
    composable.toBuffer(buffer)

    expect(buffer.toBuffer().toString('hex')).toEqual(data)
  })
})
