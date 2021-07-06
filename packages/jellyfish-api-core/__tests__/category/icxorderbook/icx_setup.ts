import { BigNumber } from '@defichain/jellyfish-api-core'
import { ICXOrder, ICXGenericResult, ICXOrderInfo, ICXOfferInfo, ICXOffer, ICXOrderStatus, ICXHTLCType, ICXHTLCStatus, HTLC, ICXClaimDFCHTLCInfo, ICXDFCHTLCInfo, ICXEXTHTLCInfo, ICXListHTLCOptions } from '../../../src/category/icxorderbook'
import { MasterNodeRegTestContainer } from '@defichain/testcontainers'
import { createToken, mintTokens, accountToAccount } from '@defichain/testing'
import { ContainerAdapterClient } from 'jellyfish-api-core/__tests__/container_adapter_client'

// globals
export let symbolDFI: string
export let symbolBTC: string
export let accountDFI: string
export let accountBTC: string
export let poolOwner: string
export let idDFI: string
export let idBTC: string
export let ICX_TAKERFEE_PER_BTC: number
export let DEX_DFI_PER_BTC_RATE: number

export class ICXSetup {
  private readonly container: MasterNodeRegTestContainer
  private readonly client: ContainerAdapterClient
  constructor (container: MasterNodeRegTestContainer, client: ContainerAdapterClient) {
    this.container = container
    this.client = client
    // reset global variables
    symbolDFI = ''
    symbolBTC = ''
    accountDFI = ''
    accountBTC = ''
    poolOwner = ''
    idDFI = ''
    idBTC = ''
    ICX_TAKERFEE_PER_BTC = 0
    DEX_DFI_PER_BTC_RATE = 0

    symbolDFI = 'DFI'
    symbolBTC = 'BTC'
  }

  async createAccounts (): Promise<void> {
    accountDFI = await this.container.call('getnewaddress')
    accountBTC = await this.container.call('getnewaddress')
  }

  async createBTCToken (): Promise<void> {
    const createTokenOptions = {
      name: symbolBTC,
      isDAT: true,
      mintable: true,
      tradeable: true,
      collateralAddress: accountBTC
    }
    await createToken(this.container, symbolBTC, createTokenOptions)
  }

  async initializeTokensIds (): Promise<void> {
    let tokenInfo = await this.container.call('gettoken', [symbolBTC])
    idBTC = Object.keys(tokenInfo)[0]
    tokenInfo = await this.container.call('gettoken', [symbolDFI])
    idDFI = Object.keys(tokenInfo)[0]
  }

  async mintBTCtoken (amount: number): Promise<void> {
    const mintTokensOptions = {
      address: accountBTC,
      mintAmount: amount
    }
    await mintTokens(this.container, symbolBTC, mintTokensOptions)
  }

  async fundAccount (account: string, token: string, amount: number): Promise<void> {
    const payload: { [key: string]: string } = {}
    payload[account] = `${amount}@${token}`
    await this.container.call('utxostoaccount', [payload])
    await this.container.generate(1)
  }

  async createBTCDFIPool (): Promise<void> {
    poolOwner = await this.container.call('getnewaddress', ['', 'legacy'])
    await accountToAccount(this.container, symbolBTC, 1, { from: accountBTC, to: accountDFI })

    const poolPairMetadata = {
      tokenA: idBTC,
      tokenB: idDFI,
      commission: 1,
      status: true,
      ownerAddress: poolOwner,
      pairSymbol: 'BTC-DFI'
    }
    await this.container.call('createpoolpair', [poolPairMetadata, []])
    await this.container.generate(1)

    const pool = await this.container.call('getpoolpair', ['BTC-DFI'])
    const combToken = await this.container.call('gettoken', ['BTC-DFI'])
    const idDFIBTC = Object.keys(combToken)[0]
    expect(pool[idDFIBTC].idTokenA).toBe(idBTC)
    expect(pool[idDFIBTC].idTokenB).toBe(idDFI)
  }

  async addLiquidityToBTCDFIPool (amountInBTC: number, amountInDFI: number): Promise<void> {
    const poolLiquidityMetadata: { [key: string]: string [] } = {}
    poolLiquidityMetadata[accountDFI] = [`${amountInBTC}@${symbolBTC}`, `${amountInDFI}@${symbolDFI}`]

    await this.container.call('addpoolliquidity', [poolLiquidityMetadata, accountDFI, []])
    await this.container.generate(1)
    DEX_DFI_PER_BTC_RATE = amountInDFI / amountInBTC
  }

  async setTakerFee (fee: number): Promise<void> {
    await this.container.call('setgov', [{ ICX_TAKERFEE_PER_BTC: fee }])
    await this.container.generate(1)
    const result: any = await this.container.call('getgov', ['ICX_TAKERFEE_PER_BTC'])
    expect(result.ICX_TAKERFEE_PER_BTC as number).toStrictEqual(fee)
    ICX_TAKERFEE_PER_BTC = result.ICX_TAKERFEE_PER_BTC as number
  }

  async closeAllOpenOffers (): Promise<void> {
    const orders = await this.container.call('icx_listorders', [])
    for (const orderTx of Object.keys(orders).splice(1)) {
      const offers = await this.container.call('icx_listorders', [{ orderTx: orderTx }])
      for (const offerTx of Object.keys(offers).splice(1)) {
        if (offers[offerTx].status === 'OPEN') {
          await this.container.call('icx_closeoffer', [offerTx])
        }
      }
    }
    await this.container.generate(1)
  }

  // creates DFI sell order
  async createDFISellOrder (chainTo: string, ownerAddress: string, receivePubkey: string, amountFrom: BigNumber, orderPrice: BigNumber): Promise<{order: ICXOrder, createOrderTxId: string}> {
    // create order - maker
    const order: ICXOrder = {
      tokenFrom: idDFI,
      chainTo: chainTo,
      ownerAddress: ownerAddress,
      receivePubkey: receivePubkey,
      amountFrom: amountFrom,
      orderPrice: orderPrice
    }

    const createOrderResult: ICXGenericResult = await this.client.icxorderbook.createOrder(order)
    const createOrderTxId = createOrderResult.txid
    await this.container.generate(1)

    // list ICX orders
    const ordersAfterCreateOrder: Record<string, ICXOrderInfo | ICXOfferInfo> = await this.client.icxorderbook.listOrders()
    expect((ordersAfterCreateOrder as Record<string, ICXOrderInfo>)[createOrderTxId].status).toStrictEqual(ICXOrderStatus.OPEN)

    return {
      order: order,
      createOrderTxId: createOrderTxId
    }
  }

  // creates DFI buy offer
  async createDFIBuyOffer (orderTx: string, amount: BigNumber, ownerAddress: string): Promise<{offer: ICXOffer, makeOfferTxId: string}> {
    const accountBTCBeforeOffer: Record<string, BigNumber> = await this.client.call('getaccount', [accountBTC, {}, true], 'bignumber')
    // make Offer to partial amount 10 DFI - taker
    const offer: ICXOffer = {
      orderTx: orderTx,
      amount: amount, // 0.10 BTC = 10 DFI
      ownerAddress: ownerAddress
    }

    const makeOfferResult = await this.client.icxorderbook.makeOffer(offer, [])
    const makeOfferTxId = makeOfferResult.txid
    await this.container.generate(1)

    const accountBTCAfterOffer: Record<string, BigNumber> = await this.client.call('getaccount', [accountBTC, {}, true], 'bignumber')
    // check fee of 0.01 DFI has been reduced from the accountBTCBeforeOffer[idDFI]
    // Fee = takerFeePerBTC(inBTC) * amount(inBTC) * DEX DFI per BTC rate
    expect(accountBTCAfterOffer[idDFI]).toStrictEqual(accountBTCBeforeOffer[idDFI].minus(0.01))

    // List the ICX offers for orderTx = createOrderTxId and check
    const offersForOrder1: Record<string, ICXOrderInfo | ICXOfferInfo> = await this.client.icxorderbook.listOrders({ orderTx: orderTx })
    expect(Object.keys(offersForOrder1).length).toBe(2) // extra entry for the warning text returned by the RPC atm.
    expect((offersForOrder1 as Record<string, ICXOfferInfo>)[makeOfferTxId].status).toStrictEqual(ICXOrderStatus.OPEN)

    return {
      offer: offer,
      makeOfferTxId: makeOfferTxId
    }
  }

  // create and submits DFC HTLC for DFI buy order
  async createDFCHTLCForDFIBuyOffer (makeOfferTxId: string, amount: BigNumber, hash: string, timeout: number): Promise<{DFCHTLC: HTLC, DFCHTLCTxId: string}> {
    const accountDFIBeforeDFCHTLC: Record<string, BigNumber> = await this.client.call('getaccount', [accountDFI, {}, true], 'bignumber')
    // create DFCHTLC - maker
    const DFCHTLC: HTLC = {
      offerTx: makeOfferTxId,
      amount: amount, // in  DFC
      hash: hash,
      timeout: timeout
    }
    const DFCHTLCTxId = (await this.client.icxorderbook.submitDFCHTLC(DFCHTLC)).txid
    await this.container.generate(1)

    const accountDFIAfterDFCHTLC: Record<string, BigNumber> = await this.client.call('getaccount', [accountDFI, {}, true], 'bignumber')
    // maker fee should be reduced from accountDFIBeforeDFCHTLC
    expect(accountDFIAfterDFCHTLC[idDFI]).toStrictEqual(accountDFIBeforeDFCHTLC[idDFI].minus(0.01))

    // List htlc
    const listHTLCOptions: ICXListHTLCOptions = {
      offerTx: makeOfferTxId
    }
    const HTLCs: Record<string, ICXDFCHTLCInfo | ICXEXTHTLCInfo | ICXClaimDFCHTLCInfo> = await this.client.call('icx_listhtlcs', [listHTLCOptions], 'bignumber')
    expect(Object.keys(HTLCs).length).toBe(2) // extra entry for the warning text returned by the RPC atm.
    expect((HTLCs[DFCHTLCTxId] as ICXDFCHTLCInfo).type).toStrictEqual(ICXHTLCType.DFC)
    expect((HTLCs[DFCHTLCTxId] as ICXDFCHTLCInfo).status).toStrictEqual(ICXHTLCStatus.OPEN)

    return {
      DFCHTLC: DFCHTLC,
      DFCHTLCTxId: DFCHTLCTxId
    }
  }
}
