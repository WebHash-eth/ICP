/* eslint-disable */
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import type { Principal } from '@dfinity/principal';

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const SetPermissions = IDL.Record({
    prepare: IDL.Vec(IDL.Principal),
    commit: IDL.Vec(IDL.Principal),
    manage_permissions: IDL.Vec(IDL.Principal),
  });
  const UpgradeArgs = IDL.Record({
    set_permissions: IDL.Opt(SetPermissions),
  });
  const InitArgs = IDL.Record({ set_permissions: IDL.Opt(SetPermissions) });
  const AssetCanisterArgs = IDL.Variant({
    Upgrade: UpgradeArgs,
    Init: InitArgs,
  });
  const ClearArguments = IDL.Record({});
  const BatchId = IDL.Nat;
  const Key = IDL.Text;
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const SetAssetPropertiesArguments = IDL.Record({
    key: Key,
    headers: IDL.Opt(IDL.Opt(IDL.Vec(HeaderField))),
    is_aliased: IDL.Opt(IDL.Opt(IDL.Bool)),
    allow_raw_access: IDL.Opt(IDL.Opt(IDL.Bool)),
    max_age: IDL.Opt(IDL.Opt(IDL.Nat64)),
  });
  const CreateAssetArguments = IDL.Record({
    key: Key,
    content_type: IDL.Text,
    headers: IDL.Opt(IDL.Vec(HeaderField)),
    allow_raw_access: IDL.Opt(IDL.Bool),
    max_age: IDL.Opt(IDL.Nat64),
    enable_aliasing: IDL.Opt(IDL.Bool),
  });
  const UnsetAssetContentArguments = IDL.Record({
    key: Key,
    content_encoding: IDL.Text,
  });
  const DeleteAssetArguments = IDL.Record({ key: Key });
  const ChunkId = IDL.Nat;
  const SetAssetContentArguments = IDL.Record({
    key: Key,
    sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
    chunk_ids: IDL.Vec(ChunkId),
    content_encoding: IDL.Text,
  });
  const BatchOperationKind = IDL.Variant({
    SetAssetProperties: SetAssetPropertiesArguments,
    CreateAsset: CreateAssetArguments,
    UnsetAssetContent: UnsetAssetContentArguments,
    DeleteAsset: DeleteAssetArguments,
    SetAssetContent: SetAssetContentArguments,
    Clear: ClearArguments,
  });
  const CommitBatchArguments = IDL.Record({
    batch_id: BatchId,
    operations: IDL.Vec(BatchOperationKind),
  });
  const CommitProposedBatchArguments = IDL.Record({
    batch_id: BatchId,
    evidence: IDL.Vec(IDL.Nat8),
  });
  const ComputeEvidenceArguments = IDL.Record({
    batch_id: BatchId,
    max_iterations: IDL.Opt(IDL.Nat16),
  });
  const ConfigureArguments = IDL.Record({
    max_batches: IDL.Opt(IDL.Opt(IDL.Nat64)),
    max_bytes: IDL.Opt(IDL.Opt(IDL.Nat64)),
    max_chunks: IDL.Opt(IDL.Opt(IDL.Nat64)),
  });
  const DeleteBatchArguments = IDL.Record({ batch_id: BatchId });
  const ConfigurationResponse = IDL.Record({
    max_batches: IDL.Opt(IDL.Nat64),
    max_bytes: IDL.Opt(IDL.Nat64),
    max_chunks: IDL.Opt(IDL.Nat64),
  });
  const Permission = IDL.Variant({
    Prepare: IDL.Null,
    ManagePermissions: IDL.Null,
    Commit: IDL.Null,
  });
  const GrantPermission = IDL.Record({
    permission: Permission,
    to_principal: IDL.Principal,
  });
  const HttpRequest = IDL.Record({
    url: IDL.Text,
    method: IDL.Text,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(HeaderField),
    certificate_version: IDL.Opt(IDL.Nat16),
  });
  const StreamingCallbackToken = IDL.Record({
    key: Key,
    sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
    index: IDL.Nat,
    content_encoding: IDL.Text,
  });
  const StreamingCallbackHttpResponse = IDL.Record({
    token: IDL.Opt(StreamingCallbackToken),
    body: IDL.Vec(IDL.Nat8),
  });
  const StreamingStrategy = IDL.Variant({
    Callback: IDL.Record({
      token: StreamingCallbackToken,
      callback: IDL.Func(
        [StreamingCallbackToken],
        [IDL.Opt(StreamingCallbackHttpResponse)],
        ['query'],
      ),
    }),
  });
  const HttpResponse = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(HeaderField),
    streaming_strategy: IDL.Opt(StreamingStrategy),
    status_code: IDL.Nat16,
  });
  const Time = IDL.Int;
  const ListPermitted = IDL.Record({ permission: Permission });
  const RevokePermission = IDL.Record({
    permission: Permission,
    of_principal: IDL.Principal,
  });
  const ValidationResult = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  return IDL.Service({
    api_version: IDL.Func([], [IDL.Nat16], ['query']),
    authorize: IDL.Func([IDL.Principal], [], []),
    certified_tree: IDL.Func(
      [IDL.Record({})],
      [
        IDL.Record({
          certificate: IDL.Vec(IDL.Nat8),
          tree: IDL.Vec(IDL.Nat8),
        }),
      ],
      ['query'],
    ),
    clear: IDL.Func([ClearArguments], [], []),
    commit_batch: IDL.Func([CommitBatchArguments], [], []),
    commit_proposed_batch: IDL.Func([CommitProposedBatchArguments], [], []),
    compute_evidence: IDL.Func(
      [ComputeEvidenceArguments],
      [IDL.Opt(IDL.Vec(IDL.Nat8))],
      [],
    ),
    configure: IDL.Func([ConfigureArguments], [], []),
    create_asset: IDL.Func([CreateAssetArguments], [], []),
    create_batch: IDL.Func(
      [IDL.Record({})],
      [IDL.Record({ batch_id: BatchId })],
      [],
    ),
    create_chunk: IDL.Func(
      [IDL.Record({ content: IDL.Vec(IDL.Nat8), batch_id: BatchId })],
      [IDL.Record({ chunk_id: ChunkId })],
      [],
    ),
    create_chunks: IDL.Func(
      [
        IDL.Record({
          content: IDL.Vec(IDL.Vec(IDL.Nat8)),
          batch_id: BatchId,
        }),
      ],
      [IDL.Record({ chunk_ids: IDL.Vec(ChunkId) })],
      [],
    ),
    deauthorize: IDL.Func([IDL.Principal], [], []),
    delete_asset: IDL.Func([DeleteAssetArguments], [], []),
    delete_batch: IDL.Func([DeleteBatchArguments], [], []),
    get: IDL.Func(
      [IDL.Record({ key: Key, accept_encodings: IDL.Vec(IDL.Text) })],
      [
        IDL.Record({
          content: IDL.Vec(IDL.Nat8),
          sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
          content_type: IDL.Text,
          content_encoding: IDL.Text,
          total_length: IDL.Nat,
        }),
      ],
      ['query'],
    ),
    get_asset_properties: IDL.Func(
      [Key],
      [
        IDL.Record({
          headers: IDL.Opt(IDL.Vec(HeaderField)),
          is_aliased: IDL.Opt(IDL.Bool),
          allow_raw_access: IDL.Opt(IDL.Bool),
          max_age: IDL.Opt(IDL.Nat64),
        }),
      ],
      ['query'],
    ),
    get_chunk: IDL.Func(
      [
        IDL.Record({
          key: Key,
          sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
          index: IDL.Nat,
          content_encoding: IDL.Text,
        }),
      ],
      [IDL.Record({ content: IDL.Vec(IDL.Nat8) })],
      ['query'],
    ),
    get_configuration: IDL.Func([], [ConfigurationResponse], []),
    grant_permission: IDL.Func([GrantPermission], [], []),
    http_request: IDL.Func([HttpRequest], [HttpResponse], ['query']),
    http_request_streaming_callback: IDL.Func(
      [StreamingCallbackToken],
      [IDL.Opt(StreamingCallbackHttpResponse)],
      ['query'],
    ),
    list: IDL.Func(
      [IDL.Record({})],
      [
        IDL.Vec(
          IDL.Record({
            key: Key,
            encodings: IDL.Vec(
              IDL.Record({
                modified: Time,
                sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
                length: IDL.Nat,
                content_encoding: IDL.Text,
              }),
            ),
            content_type: IDL.Text,
          }),
        ),
      ],
      ['query'],
    ),
    list_authorized: IDL.Func([], [IDL.Vec(IDL.Principal)], []),
    list_permitted: IDL.Func([ListPermitted], [IDL.Vec(IDL.Principal)], []),
    propose_commit_batch: IDL.Func([CommitBatchArguments], [], []),
    revoke_permission: IDL.Func([RevokePermission], [], []),
    set_asset_content: IDL.Func([SetAssetContentArguments], [], []),
    set_asset_properties: IDL.Func([SetAssetPropertiesArguments], [], []),
    store: IDL.Func(
      [
        IDL.Record({
          key: Key,
          content: IDL.Vec(IDL.Nat8),
          sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
          content_type: IDL.Text,
          content_encoding: IDL.Text,
        }),
      ],
      [],
      [],
    ),
    take_ownership: IDL.Func([], [], []),
    unset_asset_content: IDL.Func([UnsetAssetContentArguments], [], []),
    validate_commit_proposed_batch: IDL.Func(
      [CommitProposedBatchArguments],
      [ValidationResult],
      [],
    ),
    validate_configure: IDL.Func([ConfigureArguments], [ValidationResult], []),
    validate_grant_permission: IDL.Func(
      [GrantPermission],
      [ValidationResult],
      [],
    ),
    validate_revoke_permission: IDL.Func(
      [RevokePermission],
      [ValidationResult],
      [],
    ),
    validate_take_ownership: IDL.Func([], [ValidationResult], []),
  });
};

export type AssetCanisterArgs = { Upgrade: UpgradeArgs } | { Init: InitArgs };
export type BatchId = bigint;
export type BatchOperationKind =
  | {
      SetAssetProperties: SetAssetPropertiesArguments;
    }
  | { CreateAsset: CreateAssetArguments }
  | { UnsetAssetContent: UnsetAssetContentArguments }
  | { DeleteAsset: DeleteAssetArguments }
  | { SetAssetContent: SetAssetContentArguments }
  | { Clear: ClearArguments };
export type ChunkId = bigint;
export type ClearArguments = {};
export interface CommitBatchArguments {
  batch_id: BatchId;
  operations: Array<BatchOperationKind>;
}
export interface CommitProposedBatchArguments {
  batch_id: BatchId;
  evidence: Uint8Array | number[];
}
export interface ComputeEvidenceArguments {
  batch_id: BatchId;
  max_iterations: [] | [number];
}
export interface ConfigurationResponse {
  max_batches: [] | [bigint];
  max_bytes: [] | [bigint];
  max_chunks: [] | [bigint];
}
export interface ConfigureArguments {
  max_batches: [] | [[] | [bigint]];
  max_bytes: [] | [[] | [bigint]];
  max_chunks: [] | [[] | [bigint]];
}
export interface CreateAssetArguments {
  key: Key;
  content_type: string;
  headers: [] | [Array<HeaderField>];
  allow_raw_access: [] | [boolean];
  max_age: [] | [bigint];
  enable_aliasing: [] | [boolean];
}
export interface DeleteAssetArguments {
  key: Key;
}
export interface DeleteBatchArguments {
  batch_id: BatchId;
}
export interface GrantPermission {
  permission: Permission;
  to_principal: Principal;
}
export type HeaderField = [string, string];
export interface HttpRequest {
  url: string;
  method: string;
  body: Uint8Array | number[];
  headers: Array<HeaderField>;
  certificate_version: [] | [number];
}
export interface HttpResponse {
  body: Uint8Array | number[];
  headers: Array<HeaderField>;
  streaming_strategy: [] | [StreamingStrategy];
  status_code: number;
}
export interface InitArgs {
  set_permissions: [] | [SetPermissions];
}
export type Key = string;
export interface ListPermitted {
  permission: Permission;
}
export type Permission =
  | { Prepare: null }
  | { ManagePermissions: null }
  | { Commit: null };
export interface RevokePermission {
  permission: Permission;
  of_principal: Principal;
}
export interface SetAssetContentArguments {
  key: Key;
  sha256: [] | [Uint8Array | number[]];
  chunk_ids: Array<ChunkId>;
  content_encoding: string;
}
export interface SetAssetPropertiesArguments {
  key: Key;
  headers: [] | [[] | [Array<HeaderField>]];
  is_aliased: [] | [[] | [boolean]];
  allow_raw_access: [] | [[] | [boolean]];
  max_age: [] | [[] | [bigint]];
}
export interface SetPermissions {
  prepare: Array<Principal>;
  commit: Array<Principal>;
  manage_permissions: Array<Principal>;
}
export interface StreamingCallbackHttpResponse {
  token: [] | [StreamingCallbackToken];
  body: Uint8Array | number[];
}
export interface StreamingCallbackToken {
  key: Key;
  sha256: [] | [Uint8Array | number[]];
  index: bigint;
  content_encoding: string;
}
export type StreamingStrategy = {
  Callback: {
    token: StreamingCallbackToken;
    callback: [Principal, string];
  };
};
export type Time = bigint;
export interface UnsetAssetContentArguments {
  key: Key;
  content_encoding: string;
}
export interface UpgradeArgs {
  set_permissions: [] | [SetPermissions];
}
export type ValidationResult = { Ok: string } | { Err: string };
export interface _SERVICE {
  api_version: ActorMethod<[], number>;
  authorize: ActorMethod<[Principal], undefined>;
  certified_tree: ActorMethod<
    [{}],
    { certificate: Uint8Array | number[]; tree: Uint8Array | number[] }
  >;
  clear: ActorMethod<[ClearArguments], undefined>;
  commit_batch: ActorMethod<[CommitBatchArguments], undefined>;
  commit_proposed_batch: ActorMethod<[CommitProposedBatchArguments], undefined>;
  compute_evidence: ActorMethod<
    [ComputeEvidenceArguments],
    [] | [Uint8Array | number[]]
  >;
  configure: ActorMethod<[ConfigureArguments], undefined>;
  create_asset: ActorMethod<[CreateAssetArguments], undefined>;
  create_batch: ActorMethod<[{}], { batch_id: BatchId }>;
  create_chunk: ActorMethod<
    [{ content: Uint8Array | number[]; batch_id: BatchId }],
    { chunk_id: ChunkId }
  >;
  create_chunks: ActorMethod<
    [{ content: Array<Uint8Array | number[]>; batch_id: BatchId }],
    { chunk_ids: Array<ChunkId> }
  >;
  deauthorize: ActorMethod<[Principal], undefined>;
  delete_asset: ActorMethod<[DeleteAssetArguments], undefined>;
  delete_batch: ActorMethod<[DeleteBatchArguments], undefined>;
  get: ActorMethod<
    [{ key: Key; accept_encodings: Array<string> }],
    {
      content: Uint8Array | number[];
      sha256: [] | [Uint8Array | number[]];
      content_type: string;
      content_encoding: string;
      total_length: bigint;
    }
  >;
  get_asset_properties: ActorMethod<
    [Key],
    {
      headers: [] | [Array<HeaderField>];
      is_aliased: [] | [boolean];
      allow_raw_access: [] | [boolean];
      max_age: [] | [bigint];
    }
  >;
  get_chunk: ActorMethod<
    [
      {
        key: Key;
        sha256: [] | [Uint8Array | number[]];
        index: bigint;
        content_encoding: string;
      },
    ],
    { content: Uint8Array | number[] }
  >;
  get_configuration: ActorMethod<[], ConfigurationResponse>;
  grant_permission: ActorMethod<[GrantPermission], undefined>;
  http_request: ActorMethod<[HttpRequest], HttpResponse>;
  http_request_streaming_callback: ActorMethod<
    [StreamingCallbackToken],
    [] | [StreamingCallbackHttpResponse]
  >;
  list: ActorMethod<
    [{}],
    Array<{
      key: Key;
      encodings: Array<{
        modified: Time;
        sha256: [] | [Uint8Array | number[]];
        length: bigint;
        content_encoding: string;
      }>;
      content_type: string;
    }>
  >;
  list_authorized: ActorMethod<[], Array<Principal>>;
  list_permitted: ActorMethod<[ListPermitted], Array<Principal>>;
  propose_commit_batch: ActorMethod<[CommitBatchArguments], undefined>;
  revoke_permission: ActorMethod<[RevokePermission], undefined>;
  set_asset_content: ActorMethod<[SetAssetContentArguments], undefined>;
  set_asset_properties: ActorMethod<[SetAssetPropertiesArguments], undefined>;
  store: ActorMethod<
    [
      {
        key: Key;
        content: Uint8Array | number[];
        sha256: [] | [Uint8Array | number[]];
        content_type: string;
        content_encoding: string;
      },
    ],
    undefined
  >;
  take_ownership: ActorMethod<[], undefined>;
  unset_asset_content: ActorMethod<[UnsetAssetContentArguments], undefined>;
  validate_commit_proposed_batch: ActorMethod<
    [CommitProposedBatchArguments],
    ValidationResult
  >;
  validate_configure: ActorMethod<[ConfigureArguments], ValidationResult>;
  validate_grant_permission: ActorMethod<[GrantPermission], ValidationResult>;
  validate_revoke_permission: ActorMethod<[RevokePermission], ValidationResult>;
  validate_take_ownership: ActorMethod<[], ValidationResult>;
}
