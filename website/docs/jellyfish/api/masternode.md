---
id: masternode
title: Masternode
sidebar_label: Masternode API
API slug: /jellyfish/api/masternode
---

```js
import {Client} from '@defichain/jellyfish'

const client = new Client()
// Using client.account.
const something = await client.masternode.method()
```

## createMasternode

Creates a masternode creation transaction with given owner and operator addresses.

```ts title="client.masternode.createMasternode()"
interface masternode {
  createMasternode (
    ownerAddress: string,
    operatorAddress?: string,
    options: CreateMasternodeOptions = {inputs: []}
  ): Promise<string>
}

interface UTXO {
  txid?: string
  vout?: number
}

interface CreateMasternodeOptions {
  inputs?: UTXO[]
}
```

## listMasternodes

Returns information about multiple masternodes.

```ts title="client.masternode.listMasternodes()"
interface masternode {
  listMasternodes (
    pagination: MasternodePagination = {
      including_start: true,
      limit: 10000
    },
    verbose: boolean = true
  ): Promise<MasternodeResult>
}

interface MasternodePagination {
  start?: string
  including_start?: boolean
  limit?: number
}

interface MasternodeInfo {
  ownerAuthAddress: string,
  operatorAuthAddress: string,
  creationHeight: number,
  resignHeight: number,
  resignTx: string,
  banHeight: number,
  banTx: string,
  state: MasternodeState,
  mintedBlocks: number,
  ownerIsMine: boolean,
  operatorIsMine: boolean,
  localMasternode: boolean
}

interface MasternodeResult {
  [id: string]: MasternodeInfo
}
```

## getMasternode

Returns information about a single masternode

```ts title="client.masternode.getMasternode()"
interface masternode {
  getMasternode (masternodeId: string): Promise<MasternodeResult>
}

interface MasternodeInfo {
  ownerAuthAddress: string,
  operatorAuthAddress: string,
  creationHeight: number,
  resignHeight: number,
  resignTx: string,
  banHeight: number,
  banTx: string,
  state: MasternodeState,
  mintedBlocks: number,
  ownerIsMine: boolean,
  operatorIsMine: boolean,
  localMasternode: boolean
}

interface MasternodeResult {
  [id: string]: MasternodeInfo
}
```