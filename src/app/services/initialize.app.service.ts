import { Injectable } from '@angular/core';

import { SQLiteService } from './sqlite.service';
import { DbService } from './db.service';

@Injectable()
export class InitializeAppService {
  isAppInit: boolean = false;
  platform!: string;

  constructor(
    private sqliteService: SQLiteService,
    private dbService: DbService
  ) {}

  async initializeApp() {
    await this.sqliteService.initializePlugin().then(async (ret) => {
      this.platform = this.sqliteService.platform;
      try {
        if (this.sqliteService.platform === 'web') {
          await this.sqliteService.initWebStore();
        }
        await this.dbService.initializeDatabase();
        this.isAppInit = true;
        console.log('app initialized');
      } catch (error) {
        console.log(`initializeAppError: ${error}`);
      }
    });
  }
}
