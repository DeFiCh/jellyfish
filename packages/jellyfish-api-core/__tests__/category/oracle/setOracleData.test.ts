import { MasterNodeRegTestContainer } from '@defichain/testcontainers'
import { ContainerAdapterClient } from '../../container_adapter_client'
import { RpcApiError } from '../../../src'

describe('Oracle', () => {
  const container = new MasterNodeRegTestContainer()
  const client = new ContainerAdapterClient(container)

  beforeAll(async () => {
    await container.start()
    await container.waitForReady()
    await container.waitForWalletCoinbaseMaturity()
  })

  afterAll(async () => {
    await container.stop()
  })

  it('should setOracleData', async () => {
    const priceFeeds = [
      { token: 'APPLE', currency: 'EUR' }
    ]

    const oracleid = await container.call('appointoracle', [await container.getNewAddress(), priceFeeds, 1])

    await container.generate(1)

    const timestamp = new Date().getTime()
    const prices = [{ tokenAmount: '0.5@APPLE', currency: 'EUR' }]

    await client.oracle.setOracleData(oracleid, timestamp, { prices })

    await container.generate(1)

    const data = await container.call('getoracledata', [oracleid])

    expect(data).toStrictEqual(
      {
        weightage: 1,
        oracleid,
        address: expect.any(String),
        priceFeeds,
        tokenPrices: [
          {
            token: 'APPLE',
            currency: 'EUR',
            amount: 0.5,
            timestamp
          }
        ]
      }
    )
  })

  it('should not setOracleData if oracleid is invalid', async () => {
    const oracleid = 'e40775f8bb396cd3d94429843453e66e68b1c7625d99b0b4c505ab004506697b'

    const prices = [{ tokenAmount: '0.5@APPLE', currency: 'EUR' }]
    const promise = client.oracle.setOracleData(oracleid, new Date().getTime(), { prices })

    await expect(promise).rejects.toThrow(RpcApiError)
    await expect(promise).rejects.toThrow(`RpcApiError: 'oracle <${oracleid as string}> not found', code: -32600, method: setoracledata`)
  })

  it('should not setOracleData if token and currency do not exist', async () => {
    const priceFeeds = [
      { token: 'APPLE', currency: 'EUR' }
    ]

    const oracleid = await container.call('appointoracle', [await container.getNewAddress(), priceFeeds, 1])

    await container.generate(1)

    const prices = [{ tokenAmount: '0.5@TESLA', currency: 'USD' }]

    const promise = client.oracle.setOracleData(oracleid, new Date().getTime(), { prices })

    await expect(promise).rejects.toThrow(RpcApiError)
    await expect(promise).rejects.toThrow('Test SetOracleDataTx execution failed:\ntoken <TESLA> - currency <USD> is not allowed\', code: -32600, method: setoracledata')
  })

  it('should not setOracleData if the token amount is 1 trillion', async () => {
    const priceFeeds = [
      { token: 'APPLE', currency: 'EUR' }
    ]

    const oracleid = await container.call('appointoracle', [await container.getNewAddress(), priceFeeds, 1])

    await container.generate(1)

    const prices = [{ tokenAmount: '1000000000000@APPLE', currency: 'EUR' }]

    const promise = client.oracle.setOracleData(oracleid, new Date().getTime(), { prices })

    await expect(promise).rejects.toThrow(RpcApiError)
    await expect(promise).rejects.toThrow('RpcApiError: \'Invalid amount\', code: -22, method: setoracledata')
  })

  it('should setOracleData with UTXOs', async () => {
    const address = await container.getNewAddress()

    const priceFeeds = [
      { token: 'APPLE', currency: 'EUR' }
    ]

    const oracleid = await container.call('appointoracle', [address, priceFeeds, 1])

    await container.generate(1)

    const timestamp = new Date().getTime()
    const prices = [{ tokenAmount: '0.5@APPLE', currency: 'EUR' }]

    const input = await container.fundAddress(address, 10)

    await client.oracle.setOracleData(oracleid, timestamp, { prices, utxos: [input] })

    await container.generate(1)

    const data = await container.call('getoracledata', [oracleid])

    expect(data).toStrictEqual(
      {
        weightage: 1,
        oracleid,
        address: expect.any(String),
        priceFeeds,
        tokenPrices: [
          {
            token: 'APPLE',
            currency: 'EUR',
            amount: 0.5,
            timestamp
          }
        ]
      }
    )
  })

  it('should not setOracleData with arbitrary UTXOs', async () => {
    const priceFeeds = [
      { token: 'APPLE', currency: 'EUR' }
    ]

    const oracleid = await container.call('appointoracle', [await container.getNewAddress(), priceFeeds, 1])

    await container.generate(1)

    const timestamp = new Date().getTime()
    const prices = [{ tokenAmount: '0.5@APPLE', currency: 'EUR' }]

    const { txid, vout } = await container.fundAddress(await container.getNewAddress(), 10)
    const promise = client.oracle.setOracleData(oracleid, timestamp, { prices, utxos: [{ txid, vout }] })

    await expect(promise).rejects.toThrow(RpcApiError)
    await expect(promise).rejects.toThrow('RpcApiError: \'Test SetOracleDataTx execution failed:\ntx must have at least one input from account owner\', code: -32600, method: setoracledata')
  })
})
