import { Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IcController } from './core/ic/ic.controller';

export async function getFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return files;
}

export function getContentType(filePath: string) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    txt: 'text/plain',
    pdf: 'application/pdf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
    otf: 'font/otf',
  };

  return contentTypes[extension ?? ''] || 'application/octet-stream';
}

export async function batchExecute<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void,
): Promise<R[]> {
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => fn(item)));
    results.push(...batchResults);

    if (onBatchComplete) {
      onBatchComplete(Math.floor(i / batchSize) + 1, totalBatches);
    }
  }

  return results;
}

export function isDuplicateKeyError(error: unknown): boolean {
  if (
    error instanceof Error &&
    'code' in error &&
    (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_DUP_KEY')
  ) {
    return true;
  }
  return false;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runInfinitely<T>({
  func,
  logger,
  sleepMs,
  errorSleepMs = 1000,
}: {
  func: () => T;
  logger: Logger;
  sleepMs: number;
  errorSleepMs?: number;
}) {
  while (true) {
    try {
      await func();
      await sleep(sleepMs);
    } catch (e) {
      logger.error(`runInfinitely: Function ${func.name} errored`, e);
      await sleep(errorSleepMs);
    }
  }
}

type IcResult<TOk, TErr> =
  | {
      Ok: TOk;
    }
  | {
      Err: TErr;
    };

export class IcError<T> extends Error {
  constructor(private _err: T) {
    super(`IcError: ${JSON.stringify(_err)}`);
  }

  static unwrap<TOk, TErr>(res: IcResult<TOk, TErr>): TOk {
    if ('Ok' in res) {
      return res.Ok;
    } else if ('Err' in res) {
      throw new IcError(res.Err);
    }
    throw new Error('Unexpected result');
  }

  get err() {
    return this._err;
  }
}

export function createFetchWithTimeout(timeout: number): typeof fetch {
  const f: typeof fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, options = {}] = args; // Ensure options is always an object
    return fetch(input, { ...options, signal: AbortSignal.timeout(timeout) });
  };
  return f;
}

export const ONE_TRILLION = BigInt(1000000) * BigInt(1000000);

export function cyclesToTC(cycles: bigint) {
  return (Number(cycles) / Number(ONE_TRILLION)).toFixed(3);
}

export function isInsufficientFundsError(
  error: unknown,
): error is IcError<{ InsufficientFunds: { balance: bigint } }> {
  return error instanceof IcError && 'InsufficientFunds' in error.err;
}
