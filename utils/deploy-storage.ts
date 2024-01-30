import fs from 'fs/promises';
import path from 'path';

import { ENV } from '../config';
import { networkConfigItem } from '../helper-hardhat-config';

export type NetworkConfigKey = keyof Omit<networkConfigItem, 'priceFeeds'>;

const STORAGE_PATH =
  ENV.DEPLOY_STORAGE_PATH || '../deployments/localhost/deploy-storage.json';

class DeployStorage {
  private dataFilePath: string;

  constructor(fileName: string) {
    this.dataFilePath = path.join(__dirname, fileName);
    this.ensureDirectoryExistence(this.dataFilePath);
  }

  public async save(
    key: NetworkConfigKey,
    value: string | string[],
  ): Promise<void> {
    try {
      let data: { [key: string]: string | string[] } = {};
      try {
        const fileContent = await fs.readFile(this.dataFilePath, {
          encoding: 'utf8',
        });
        data = JSON.parse(fileContent) as { [key: string]: string | string[] };
      } catch (error) {
        console.error(
          'Could not read the existing file, creating a new one:',
          this.dataFilePath,
        );
      }
      data[key] = value;
      await fs.writeFile(this.dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  public async read(key: NetworkConfigKey): Promise<string | string[] | null> {
    try {
      const fileContent = await fs.readFile(this.dataFilePath, {
        encoding: 'utf8',
      });
      const data: Partial<networkConfigItem> = JSON.parse(fileContent);
      let value = data[key];

      if (typeof value === 'string' && this.isStringifiedArray(value)) {
        value = JSON.parse(value);
      }

      return value ?? null;
    } catch (error) {
      console.error('Failed to read data:', error);
      return null;
    }
  }

  private isStringifiedArray(value: string): boolean {
    return value.startsWith('[') && value.endsWith(']');
  }

  private async ensureDirectoryExistence(filePath: string): Promise<void> {
    const dirname = path.dirname(filePath);
    try {
      await fs.access(dirname);
    } catch (error) {
      await fs.mkdir(dirname, { recursive: true });
    }
  }
}

export const deployStorage = new DeployStorage(STORAGE_PATH);
