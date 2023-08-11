import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Song } from './song';
import { BehaviorSubject, Observable } from 'rxjs';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { songsVersionUpgrades } from '../upgrades/songs-upgrade-statements';
import { MOCK_SONG_DATA } from 'src/assets/song-data';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  songsList: any = new BehaviorSubject([]);
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public databaseName: string = 'my_db';
  private versionUpgrades = songsVersionUpgrades;
  private loadToVersion =
    songsVersionUpgrades[songsVersionUpgrades.length - 1].toVersion;
  private mDb!: SQLiteDBConnection;

  constructor(
    private platform: Platform,
    private sqliteService: SQLiteService,
    private dbVerService: DbnameVersionService
  ) {
    this.platform.ready().then(() => {});
  }

  async initializeDatabase() {
    // create upgrade statements
    await this.sqliteService.addUpgradeStatement({
      database: this.databaseName,
      upgrade: this.versionUpgrades,
    });
    // create and/or open the database
    await this.openDatabase();
    this.dbVerService.set(this.databaseName, this.loadToVersion);
    const isData = await this.mDb.query('select * from sqlite_sequence');
    // create database initial data
    if (isData.values!.length === 0) {
      await this.createInitialData();
    }
    await this.saveWebMemoryToStore();
    await this.getAllData();
  }

  private async createInitialData(): Promise<void> {
    for (const song of MOCK_SONG_DATA)
      await this.addSong(song.artist_name, song.song_name, song.stars);
  }

  async openDatabase() {
    if (
      (this.sqliteService.native ||
        this.sqliteService.platform === 'electron') &&
      (await this.sqliteService.isInConfigEncryption()).result &&
      (await this.sqliteService.isDatabaseEncrypted(this.databaseName)).result
    ) {
      this.mDb = await this.sqliteService.openDatabase(
        this.databaseName,
        true,
        'secret',
        this.loadToVersion,
        false
      );
    } else {
      this.mDb = await this.sqliteService.openDatabase(
        this.databaseName,
        false,
        'no-encryption',
        this.loadToVersion,
        false
      );
    }
  }

  dbState() {
    return this.isDbReady.asObservable();
  }

  fetchSongs(): Observable<Song[]> {
    return this.songsList.asObservable();
  }

  // Render fake data
  async getAllData() {
    await this.getSongs();
    this.isDbReady.next(true);
  }

  // Get list
  async getSongs() {
    const songs: Song[] = (await this.mDb.query('select * from song'))
      .values as Song[];
    this.songsList.next(songs);
  }

  // Get single object
  async getSong(id: number): Promise<Song> {
    let song: Song = await this.sqliteService.findOneBy(this.mDb, 'song', {
      id: id,
    });
    if (song) {
      return song;
    } else {
      return Promise.reject(`failed to manageSong for id ${id}`);
    }
  }

  // Add
  async addSong(
    artist_name: string,
    song_name: string,
    stars?: number
  ): Promise<Song> {
    let song: Song = new Song();
    if (artist_name && song_name) {
      // create a new song
      song.artist_name = artist_name;
      song.song_name = song_name;
      // for version 2
      if (stars) song.stars = stars;

      await this.sqliteService.save(this.mDb, 'song', song);
      await this.saveWebMemoryToStore();
    } else {
      return Promise.reject(`failed to addSong`);
    }
    await this.getSongs();
    return song;
  }

  // Update
  async updateSong(id: number, song: Song) {
    // update and existing song
    const updSong = new Song();
    updSong.id = id;
    updSong.artist_name = song.artist_name;
    updSong.song_name = song.song_name;
    // for version 2
    if (song.stars) updSong.stars = song.stars;

    await this.sqliteService.save(this.mDb, 'song', updSong, {
      id: id,
    });
    song = await this.sqliteService.findOneBy(this.mDb, 'song', {
      id: id,
    });
    if (song) {
      await this.saveWebMemoryToStore();
      await this.getSongs();
      return song;
    } else {
      return Promise.reject(`failed to updateSong for id ${id}`);
    }
  }

  // Delete
  async deleteSong(id: number): Promise<void> {
    let song = await this.getSong(id);
    if (song) {
      await this.sqliteService.remove(this.mDb, 'song', { id: id });
      await this.saveWebMemoryToStore();
      await this.getSongs();
    }
  }

  // save the databases from memory to store
  private async saveWebMemoryToStore(): Promise<void> {
    if (this.sqliteService.platform === 'web') {
      await this.sqliteService.sqliteConnection.saveToStore(this.databaseName);
    }
  }
}
