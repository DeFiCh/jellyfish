import { Network } from '@defichain/jellyfish-network'
import { Script } from '@defichain/jellyfish-transaction'
import { OP_CODES, OP_PUSHDATA } from '@defichain/jellyfish-transaction/src/script'
import { Base58Address } from './Base58Address'

export class P2PKH extends Base58Address {
  constructor (network: Network, utf8String: string, hex: string, validated: boolean = false) {
    super(network, utf8String, hex, validated, 'P2PKH')
  }

  getPrefix (): number {
    return this.network.pubKeyHashPrefix
  }

  getScript (): Script {
    if (!this.valid) {
      this.validate()
    }

    if (!this.valid) {
      throw new Error('InvalidDefiAddress')
    }

    return {
      stack: [
        OP_CODES.OP_DUP,
        OP_CODES.OP_HASH160,
        new OP_PUSHDATA(Buffer.from(this.hex.substring(2, 42), 'hex'), 'little'),
        OP_CODES.OP_EQUALVERIFY,
        OP_CODES.OP_CHECKSIG
      ]
    }
  }
}