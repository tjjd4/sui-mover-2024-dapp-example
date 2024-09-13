import tmp from 'tmp';
import { execSync } from 'child_process';
import { BuildPackageOptions, BuildPackageResult } from './types';
import { color } from './utils';

export const defaultBuildPackageOptions: BuildPackageOptions = {
  withUnpublishedDependencies: true,
  skipFetchLatestGitDeps: false,
};

/**
 * builds a package and returns the compiled modules and dependencies
 * the package is built in a temporary directory, which is cleaned up after the build
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @returns {BuildPackageResult}, the compiled modules and dependencies
 */
export const buildPackage = (
  suiBinPath: string,
  packagePath: string,
  options: BuildPackageOptions = defaultBuildPackageOptions
) => {
  tmp.setGracefulCleanup()

  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  try {
    const withUnpublishedDep = options.withUnpublishedDependencies ? '--with-unpublished-dependencies' : '';
    const skipDepFetch = options.skipFetchLatestGitDeps ? '--skip-fetch-latest-git-deps' : '';
    const buildCmd = `${suiBinPath} move build --dump-bytecode-as-base64 --path ${packagePath} ${skipDepFetch} ${withUnpublishedDep}`;
    console.info('Running Build Package:')
    console.info(color('bold')('-------------------------------------'));
    console.info(color('green')(buildCmd));
    const buildOutput = execSync(`${buildCmd} --install-dir ${tmpDir.name}`, { encoding: 'utf-8', stdio: 'pipe' });
    const { modules, dependencies, digest } = JSON.parse(buildOutput);
    console.info('Build Package Success!');

    return {
      modules,
      dependencies,
      digest,
    } as BuildPackageResult;
  } catch (e) {
    console.error('Build Package Failed!');
    throw new Error(`Error building package at ${color('gray')(packagePath)}, stdout: \n${e}`);
  }
};
