import type { AppManifest } from '@aegis/protocol';
import JSZip from 'jszip';

export interface AegisPackageExtractResult {
  manifest: AppManifest;
  entryPath: string;
  entryCode: string;
}

export async function extractAegisPackage(
  source: File | Blob | ArrayBuffer,
): Promise<AegisPackageExtractResult> {
  const zip = await JSZip.loadAsync(source);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Invalid .aegis package: missing manifest.json');

  const packageSpec = JSON.parse(await manifestFile.async('text')) as {
    manifest?: AppManifest;
    main?: string;
  };
  if (!packageSpec.manifest || typeof packageSpec.manifest.name !== 'string') {
    throw new Error('Invalid .aegis package: missing app manifest');
  }

  const entryPath = packageSpec.main || 'bundle.js';
  const entryFile = zip.file(entryPath);
  if (!entryFile) throw new Error(`Invalid .aegis package: entry file "${entryPath}" not found`);

  return {
    manifest: packageSpec.manifest,
    entryPath,
    entryCode: await entryFile.async('text'),
  };
}