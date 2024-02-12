import fs from 'fs/promises';
import path from 'path';

import { NetworkConfigItem } from '../hardhat.network-config';

const STORAGE_PATH = '../deployments/localhost/_deploy-storage.json';

class DeployStorage {
  private dataFilePath: string;

  constructor(fileName: string) {
    this.dataFilePath = path.join(__dirname, fileName);
    this.ensureDirectoryExistence(this.dataFilePath);
  }

  public async write<K extends keyof NetworkConfigItem>(
    key: K,
    value: NetworkConfigItem[K],
  ): Promise<void> {
    try {
      let data: NetworkConfigItem = {};
      try {
        const fileContent = await fs.readFile(this.dataFilePath, {
          encoding: 'utf8',
        });
        data = JSON.parse(fileContent) as NetworkConfigItem;
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

  public async read<K extends keyof NetworkConfigItem>(
    key: K,
  ): Promise<NetworkConfigItem[K] | null> {
    try {
      const fileContent = await fs.readFile(this.dataFilePath, {
        encoding: 'utf8',
      });
      const data: Partial<NetworkConfigItem> = JSON.parse(fileContent);
      return data[key] ?? null;
    } catch (error) {
      console.error('Failed to read data:', error);
      return null;
    }
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
