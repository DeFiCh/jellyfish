import { DockerOptions } from 'dockerode'
import { DeFiDContainer, StartOptions } from '../container'

/**
 * RegTest DeFiD container
 */
export class RegTestContainer extends DeFiDContainer {
  constructor (options?: DockerOptions) {
    super('regtest', options)
  }

  protected getCmd (opts: StartOptions): string[] {
    return [...super.getCmd(opts),
      '-regtest=1',
      '-txnotokens=0',
      '-logtimemicros',
      '-txindex=1',
      '-acindex=1',
      '-amkheight=0',
      '-bayfrontheight=1',
      '-bayfrontgardensheight=2',
      '-clarkequayheight=3',
      '-dakotaheight=4',
      '-dakotacrescentheight=5'
    ]
  }

  async getNewAddress (label: string = '', addressType: 'legacy' | 'p2sh-segwit' | 'bech32' | string = 'bech32'): Promise<string> {
    return await this.call('getnewaddress', [label, addressType])
  }

  async getRpcPort (): Promise<string> {
    return await this.getPort('19554/tcp')
  }
}
