import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Alokate',
    executableName: 'alokate',
    asar: true,
    icon: './assets/icon', // Will resolve to .ico on Windows, .icns on macOS, .png on Linux
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'Alokate',
      setupIcon: './assets/icon.ico',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      name: 'Alokate',
      icon: './assets/icon.icns',
    }),
    new MakerDeb({
      options: {
        name: 'alokate',
        productName: 'Alokate',
        genericName: 'University Faculty Scheduler',
        description: 'A desktop application for scheduling university faculty',
        categories: ['Education', 'Office'],
        icon: './assets/icon.png',
      },
    }),
    new MakerRpm({
      options: {
        name: 'alokate',
        productName: 'Alokate',
        genericName: 'University Faculty Scheduler',
        description: 'A desktop application for scheduling university faculty',
        categories: ['Education', 'Office'],
        icon: './assets/icon.png',
      },
    }),
  ],
};

export default config;
