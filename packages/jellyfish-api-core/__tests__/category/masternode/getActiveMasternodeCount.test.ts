import { MasterNodeRegTestContainer } from '@defichain/testcontainers'
import { ContainerAdapterClient } from '../../container_adapter_client'

describe('Masternode', () => {
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

  it('should getActiveMasternodeCount', async () => {
    jest.setTimeout(400000)
    await client.masternode.createMasternode(await client.wallet.getNewAddress())

    await container.generate(2016)

    const masternodeCount = await client.masternode.getActiveMasternodeCount()
    console.log(masternodeCount) // 1
  })
})
