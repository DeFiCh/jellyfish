import { ApiClient } from '../.'

/**
 * Mining RPCs for DeFi Blockchain
 */
export class Mining {
  private readonly client: ApiClient

  constructor (client: ApiClient) {
    this.client = client
  }

  /**
   * Returns the estimated network hashes per second
   *
   * @param {number} nblocks to estimate since last difficulty change.
   * @param {number} height to estimate at the time of the given height.
   * @return {Promise<number>}
   */
  async getNetworkHashPerSecond (nblocks: number = 120, height: number = -1): Promise<number> {
    return await this.client.call('getnetworkhashps', [nblocks, height], 'number')
  }

  /**
   * Get minting-related information
   * @return {Promise<MintingInfo>}
   * @deprecated Prefer using getMiningInfo.
   */
  async getMintingInfo (): Promise<MintingInfo> {
    return await this.client.call('getmintinginfo', [], 'number')
  }

  /**
   * Get mining-related information, replaces deprecated getMintingInfo
   * @return {Promise<MiningInfo>}
   */
  async getMiningInfo (): Promise<MiningInfo> {
    return await this.client.call('getmininginfo', [], 'number')
  }

  /**
   *
   * @param {number} confirmationTarget in blocks (1 - 1008)
   * @param {EstimateMode} [estimateMode='CONSERVATIVE'] estimateMode of fees.
   * @returns {Promise<SmartFeeEstimation>}
   */
  async estimateSmartFee (confirmationTarget: number, estimateMode: EstimateMode = 'CONSERVATIVE'): Promise<SmartFeeEstimation> {
    return await this.client.call('estimatesmartfee', [confirmationTarget, estimateMode], 'number')
  }
}

/**
 * Minting related information
 */
export interface MintingInfo {
  blocks: number
  currentblockweight?: number
  currentblocktx?: number
  difficulty: string
  isoperator: boolean
  masternodeid?: string
  masternodeoperator?: string
  masternodestate?: 'PRE_ENABLED' | 'ENABLED' | 'PRE_RESIGNED' | 'RESIGNED' | 'PRE_BANNED' | 'BANNED'
  generate?: boolean
  mintedblocks?: number
  networkhashps: number
  pooledtx: number
  chain: 'main' | 'test' | 'regtest' | string
  warnings: string
}

/**
 * Minting related information
 */
export interface MiningInfo {
  blocks: number
  currentblockweight?: number
  currentblocktx?: number
  difficulty: string
  isoperator: boolean
  masternodes: MasternodeInfo[]
  networkhashps: number
  pooledtx: number
  chain: 'main' | 'test' | 'regtest' | string
  warnings: string
}

/**
 * Masternode related information
 */
export interface MasternodeInfo {
  masternodeid?: string
  masternodeoperator?: string
  masternodestate?: 'PRE_ENABLED' | 'ENABLED' | 'PRE_RESIGNED' | 'RESIGNED' | 'PRE_BANNED' | 'BANNED'
  generate?: boolean
  mintedblocks?: number
  lastblockcreationattempt?: string
}

export interface SmartFeeEstimation {
  feerate?: number
  errors?: string[]
  blocks: number
}

type EstimateMode = 'UNSET' | 'ECONOMICAL' | 'CONSERVATIVE'
