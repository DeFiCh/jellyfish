import { ApiClient } from '../.'

export enum MasternodeState {
  PRE_ENABLED = 'PRE_ENABLED',
  ENABLED = 'ENABLED',
  PRE_RESIGNED = 'PRE_RESIGNED',
  RESIGNED = 'RESIGNED',
  PRE_BANNED = 'PRE_BANNED',
  BANNED = 'BANNED',
  UNKNOWN = 'UNKNOWN'
}

export class Masternode {
  private readonly client: ApiClient

  constructor (client: ApiClient) {
    this.client = client
  }

  /**
   * Creates a masternode creation transaction with given owner and operator addresses.
   *
   * @param {string} ownerAddress Any valid address for keeping collateral amount
   * @param {string} [operatorAddress]  Masternode operator auth address (P2PKH only, unique). If empty, owner address will be used.
   * @param {CreateMasternodeOptions} [options]
   * @param {UTXO[]} [options.utxos = []]
   * @param {string} [options.uxtos.txid] The transaction id
   * @param {string} [options.utxos.vout] The output number
   * @return {Promise<string>}
   */
  async createMasternode (
    ownerAddress: string,
    operatorAddress?: string,
    options: CreateMasternodeOptions = { utxos: [] }
  ): Promise<string> {
    operatorAddress = operatorAddress ?? ownerAddress
    return await this.client.call('createmasternode', [ownerAddress, operatorAddress, options.utxos], 'number')
  }

  /**
   * Returns information about multiple masternodes.
   *
   * @param {MasternodePagination} pagination
   * @param {string} [pagination.start]
   * @param {boolean} [pagination.including_start = true] Include starting position.
   * @param {string} [pagination.limit = 10000] Maximum number of orders to return.
   * @param {boolean} [verbose = true] Flag for verbose list. Only ids are returned when false.
   */
  async listMasternodes (
    pagination: MasternodePagination = {
      including_start: true,
      limit: 10000
    },
    verbose: boolean = true
  ): Promise<MasternodeResult> {
    return await this.client.call('listmasternodes', [pagination, verbose], 'number')
  }

  /**
   * Returns information about a single masternode
   *
   * @param {string} masternodeId The masternode's id.
   * @return {Promise<MasternodeResult>}
   */
  async getMasternode (masternodeId: string): Promise<MasternodeResult> {
    return await this.client.call('getmasternode', [masternodeId], 'number')
  }
}

export interface UTXO {
  txid: string
  vout: number
}

export interface CreateMasternodeOptions {
  utxos?: UTXO[]
}

export interface MasternodePagination {
  start?: string
  including_start?: boolean
  limit?: number
}

export interface MasternodeInfo {
  ownerAuthAddress: string
  operatorAuthAddress: string
  creationHeight: number
  resignHeight: number
  resignTx: string
  banHeight: number
  banTx: string
  state: MasternodeState
  mintedBlocks: number
  ownerIsMine: boolean
  operatorIsMine: boolean
  localMasternode: boolean
}

export interface MasternodeResult {
  [id: string]: MasternodeInfo
}