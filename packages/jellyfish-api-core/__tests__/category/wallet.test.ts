import { ContainerAdapterClient } from '../container_adapter_client'
import { MasterNodeRegTestContainer, RegTestContainer } from '@defichain/testcontainers'
import { BigNumber, ValidateAddressResult, AddressType, AddressInfo, ScriptType } from '../../src'
import waitForExpect from 'wait-for-expect'
import { UTXO, ListUnspentOptions } from '../../src/category/wallet'

describe('non masternode', () => {
  const container = new RegTestContainer()
  const client = new ContainerAdapterClient(container)
  let address = ''

  beforeAll(async () => {
    await container.start()
    await container.waitForReady()
  })

  afterAll(async () => {
    await container.stop()
  })

  describe('getBalance', () => {
    it('should getBalance = 0', async () => {
      const balance: BigNumber = await client.wallet.getBalance()

      expect(balance.toString()).toBe('0')
    })
  })

  describe('getNewAddress', () => {
    it('should getNewAddress', async () => {
      return await waitForExpect(async () => {
        address = await client.wallet.getNewAddress()

        expect(typeof address).toBe('string')
      })
    })

    it('should getNewAddress with label', async () => {
      return await waitForExpect(async () => {
        address = await client.wallet.getNewAddress('alice')

        expect(typeof address).toBe('string')
      })
    })

    it('should getNewAddress with address type specified', async () => {
      return await waitForExpect(async () => {
        const legacyAddress = await client.wallet.getNewAddress('', AddressType.LEGACY)
        const legacyAddressValidateResult = await client.wallet.validateAddress(legacyAddress)

        const p2shSegwitAddress = await client.wallet.getNewAddress('', AddressType['P2SH-SEGWIT'])
        const p2shSegwitAddressValidateResult = await client.wallet.validateAddress(p2shSegwitAddress)

        const bech32Address = await client.wallet.getNewAddress('bob', AddressType.BECH32)
        const bech32AddressValidateResult = await client.wallet.validateAddress(bech32Address)

        expect(typeof legacyAddress).toBe('string')
        expect(legacyAddressValidateResult.isvalid).toBe(true)
        expect(legacyAddressValidateResult.address).toBe(legacyAddress)
        expect(typeof legacyAddressValidateResult.scriptPubKey).toBe('string')
        expect(legacyAddressValidateResult.isscript).toBe(false)
        expect(legacyAddressValidateResult.iswitness).toBe(false)

        expect(typeof p2shSegwitAddress).toBe('string')
        expect(p2shSegwitAddressValidateResult.isvalid).toBe(true)
        expect(p2shSegwitAddressValidateResult.address).toBe(p2shSegwitAddress)
        expect(typeof p2shSegwitAddressValidateResult.scriptPubKey).toBe('string')
        expect(p2shSegwitAddressValidateResult.isscript).toBe(true)
        expect(p2shSegwitAddressValidateResult.iswitness).toBe(false)

        expect(typeof bech32Address).toBe('string')
        expect(bech32AddressValidateResult.isvalid).toBe(true)
        expect(bech32AddressValidateResult.address).toBe(bech32Address)
        expect(typeof bech32AddressValidateResult.scriptPubKey).toBe('string')
        expect(bech32AddressValidateResult.isscript).toBe(false)
        expect(bech32AddressValidateResult.iswitness).toBe(true)
      })
    })
  })

  describe('getAddressInfo', () => {
    it('should getAddressInfo', async () => {
      return await waitForExpect(async () => {
        const addressInfo: AddressInfo = await client.wallet.getAddressInfo(address)

        expect(addressInfo.address).toBe(address)
        expect(typeof addressInfo.scriptPubKey).toBe('string')
        expect(addressInfo.ismine).toBe(true)
        expect(addressInfo.solvable).toBe(true)
        expect(typeof addressInfo.desc).toBe('string')
        expect(addressInfo.iswatchonly).toBe(false)
        expect(addressInfo.isscript).toBe(true)
        expect(addressInfo.iswitness).toBe(false)
        expect(addressInfo.script).toBe(ScriptType.WITNESS_V0_KEYHASH)
        expect(typeof addressInfo.hex).toBe('string')
        expect(typeof addressInfo.pubkey).toBe('string')
        expect(addressInfo.embedded.isscript).toBe(false)
        expect(addressInfo.embedded.iswitness).toBe(true)
        expect(addressInfo.embedded.witness_version).toBe(0)
        expect(typeof addressInfo.embedded.witness_program).toBe('string')
        expect(typeof addressInfo.embedded.pubkey).toBe('string')
        expect(typeof addressInfo.embedded.address).toBe('string')
        expect(typeof addressInfo.embedded.scriptPubKey).toBe('string')
        expect(addressInfo.label).toBe('')
        expect(addressInfo.ischange).toBe(false)
        expect(typeof addressInfo.timestamp).toBe('number')
        expect(typeof addressInfo.hdkeypath).toBe('string')
        expect(typeof addressInfo.hdseedid).toBe('string')
        expect(addressInfo.labels.length).toBeGreaterThanOrEqual(1)
        expect(addressInfo.labels[0].name).toBe('')
        expect(addressInfo.labels[0].purpose).toBe('receive')
      })
    })
  })

  describe('validateAddress', () => {
    it('should validateAddress', async () => {
      return await waitForExpect(async () => {
        const result: ValidateAddressResult = await client.wallet.validateAddress(address)

        expect(result.isvalid).toBe(true)
        expect(result.address).toBe(address)
        expect(typeof result.scriptPubKey).toBe('string')
        expect(result.isscript).toBe(true)
        expect(result.iswitness).toBe(false)
      })
    })
  })
})

describe.only('masternode', () => {
  const container = new MasterNodeRegTestContainer()
  const client = new ContainerAdapterClient(container)
  let address = ''

  beforeAll(async () => {
    await container.start()
    await container.waitForReady()
    await container.waitForWalletCoinbaseMaturity()
  })

  afterAll(async () => {
    await container.stop()
  })

  describe('getBalance', () => {
    it('should getBalance >= 100', async () => {
      return await waitForExpect(async () => {
        const balance: BigNumber = await client.wallet.getBalance()
        expect(balance.isGreaterThan(new BigNumber('100'))).toBe(true)
      })
    })
  })

  describe('listUnspent', () => {
    it('should listUnspent', async () => {
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent()
        expect(utxos.length).toBeGreaterThan(0)
        for (let i = 0; i < utxos.length; i += 1) {
          const utxo = utxos[i]
          console.log('utxo: ', utxo)
          expect(typeof utxo.txid).toBe('string')
          expect(typeof utxo.vout).toBe('number')
          expect(typeof utxo.address).toBe('string')
          expect(typeof utxo.label).toBe('string')
          expect(typeof utxo.scriptPubKey).toBe('string')
          expect(utxo.amount instanceof BigNumber).toBe(true)
          expect(typeof utxo.tokenId).toBe('string')
          expect(typeof utxo.confirmations).toBe('number')
          expect(typeof utxo.spendable).toBe('boolean')
          expect(typeof utxo.solvable).toBe('boolean')
          expect(typeof utxo.desc).toBe('string')
          expect(typeof utxo.safe).toBe('boolean')
        }
      })
    })

    it('test listUnspent minimumConfirmation filter', async () => {
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(99)
        utxos.forEach(utxo => {
          expect(utxo.confirmations).toBeGreaterThanOrEqual(99)
        })
      })
    })

    it('test listUnspent maximumConfirmation filter', async () => {
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 300)
        utxos.forEach(utxo => {
          expect(utxo.confirmations).toBeLessThanOrEqual(300)
        })
      })
    })

    it('test listUnspent addresses filter', async () => {
      const options: ListUnspentOptions = {
        addresses: ['mwsZw8nF7pKxWH8eoKL9tPxTpaFkz7QeLU']
      }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        utxos.forEach(utxo => {
          expect(utxo.address).toBe('mwsZw8nF7pKxWH8eoKL9tPxTpaFkz7QeLU')
        })
      })
    })

    it('test listUnspent includeUnsafe filter', async () => {
      const options: ListUnspentOptions = { includeUnsafe: false }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        utxos.forEach(utxo => {
          expect(utxo.safe).toBe(true)
        })
      })
    })

    it('test listUnspent queryOptions minimumAmount filter', async () => {
      const options: ListUnspentOptions = { queryOptions: { minimumAmount: 5 } }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        utxos.forEach(utxo => {
          expect(utxo.amount.isGreaterThanOrEqualTo(new BigNumber('5'))).toBe(true)
        })
      })
    })

    it('test listUnspent queryOptions maximumAmount filter', async () => {
      const options: ListUnspentOptions = { queryOptions: { maximumAmount: 100 } }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        console.log('utxos: ', utxos)
        utxos.forEach(utxo => {
          expect(utxo.amount.isLessThanOrEqualTo(new BigNumber('100'))).toBe(true)
        })
      })
    })

    it('test listUnspent queryOptions maximumCount filter', async () => {
      const options: ListUnspentOptions = { queryOptions: { maximumCount: 100 } }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        expect(utxos.length).toBeLessThanOrEqual(100)
      })
    })

    it('test listUnspent queryOptions minimumSumAmount filter', async () => {
      const options: ListUnspentOptions = { queryOptions: { minimumSumAmount: 100 } }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        const sum: BigNumber = utxos.map(utxo => utxo.amount).reduce((acc, val) => acc.plus(val))
        expect(sum.isGreaterThanOrEqualTo(new BigNumber('100'))).toBe(true)
      })
    })

    it('test listUnspent queryOptions tokenId filter', async () => {
      const options: ListUnspentOptions = { queryOptions: { tokenId: '0' } }
      await waitForExpect(async () => {
        const utxos: UTXO[] = await client.wallet.listUnspent(1, 9999999, options)
        utxos.forEach(utxo => {
          expect(utxo.tokenId).toBe('0')
        })
      })
    })
  })

  describe('getNewAddress', () => {
    it('should getNewAddress', async () => {
      return await waitForExpect(async () => {
        address = await client.wallet.getNewAddress()

        expect(typeof address).toBe('string')
      })
    })

    it('should getNewAddress with label', async () => {
      return await waitForExpect(async () => {
        address = await client.wallet.getNewAddress('alice')

        expect(typeof address).toBe('string')
      })
    })

    it('should getNewAddress with address type specified', async () => {
      return await waitForExpect(async () => {
        const legacyAddress = await client.wallet.getNewAddress('', AddressType.LEGACY)
        const legacyAddressValidateResult = await client.wallet.validateAddress(legacyAddress)

        const p2shSegwitAddress = await client.wallet.getNewAddress('', AddressType['P2SH-SEGWIT'])
        const p2shSegwitAddressValidateResult = await client.wallet.validateAddress(p2shSegwitAddress)

        const bech32Address = await client.wallet.getNewAddress('bob', AddressType.BECH32)
        const bech32AddressValidateResult = await client.wallet.validateAddress(bech32Address)

        expect(typeof legacyAddress).toBe('string')
        expect(legacyAddressValidateResult.isvalid).toBe(true)
        expect(legacyAddressValidateResult.address).toBe(legacyAddress)
        expect(typeof legacyAddressValidateResult.scriptPubKey).toBe('string')
        expect(legacyAddressValidateResult.isscript).toBe(false)
        expect(legacyAddressValidateResult.iswitness).toBe(false)

        expect(typeof p2shSegwitAddress).toBe('string')
        expect(p2shSegwitAddressValidateResult.isvalid).toBe(true)
        expect(p2shSegwitAddressValidateResult.address).toBe(p2shSegwitAddress)
        expect(typeof p2shSegwitAddressValidateResult.scriptPubKey).toBe('string')
        expect(p2shSegwitAddressValidateResult.isscript).toBe(true)
        expect(p2shSegwitAddressValidateResult.iswitness).toBe(false)

        expect(typeof bech32Address).toBe('string')
        expect(bech32AddressValidateResult.isvalid).toBe(true)
        expect(bech32AddressValidateResult.address).toBe(bech32Address)
        expect(typeof bech32AddressValidateResult.scriptPubKey).toBe('string')
        expect(bech32AddressValidateResult.isscript).toBe(false)
        expect(bech32AddressValidateResult.iswitness).toBe(true)
      })
    })
  })

  describe('getAddressInfo', () => {
    it('should getAddressInfo', async () => {
      return await waitForExpect(async () => {
        const addressInfo: AddressInfo = await client.wallet.getAddressInfo(address)

        expect(addressInfo.address).toBe(address)
        expect(typeof addressInfo.scriptPubKey).toBe('string')
        expect(addressInfo.ismine).toBe(true)
        expect(addressInfo.solvable).toBe(true)
        expect(typeof addressInfo.desc).toBe('string')
        expect(addressInfo.iswatchonly).toBe(false)
        expect(addressInfo.isscript).toBe(true)
        expect(addressInfo.iswitness).toBe(false)
        expect(addressInfo.script).toBe(ScriptType.WITNESS_V0_KEYHASH)
        expect(typeof addressInfo.hex).toBe('string')
        expect(typeof addressInfo.pubkey).toBe('string')
        expect(addressInfo.embedded.isscript).toBe(false)
        expect(addressInfo.embedded.iswitness).toBe(true)
        expect(addressInfo.embedded.witness_version).toBe(0)
        expect(typeof addressInfo.embedded.witness_program).toBe('string')
        expect(typeof addressInfo.embedded.pubkey).toBe('string')
        expect(typeof addressInfo.embedded.address).toBe('string')
        expect(typeof addressInfo.embedded.scriptPubKey).toBe('string')
        expect(addressInfo.label).toBe('')
        expect(addressInfo.ischange).toBe(false)
        expect(typeof addressInfo.timestamp).toBe('number')
        expect(typeof addressInfo.hdkeypath).toBe('string')
        expect(typeof addressInfo.hdseedid).toBe('string')
        expect(addressInfo.labels.length).toBeGreaterThanOrEqual(1)
        expect(addressInfo.labels[0].name).toBe('')
        expect(addressInfo.labels[0].purpose).toBe('receive')
      })
    })
  })

  describe('validateAddress', () => {
    it('should validateAddress', async () => {
      return await waitForExpect(async () => {
        const result: ValidateAddressResult = await client.wallet.validateAddress(address)

        expect(result.isvalid).toBe(true)
        expect(result.address).toBe(address)
        expect(typeof result.scriptPubKey).toBe('string')
        expect(result.isscript).toBe(true)
        expect(result.iswitness).toBe(false)
      })
    })
  })

  describe('sendToAddress', () => {
    it('should sendToAddress', async () => {
      return await waitForExpect(async () => {
        const transactionId = await client.wallet.sendToAddress(address, 0.00001)
        console.log('transactionId: ', transactionId)
      })
    })
  })
})
