import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DbService } from './../services/db.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-song',
  templateUrl: './song.page.html',
  styleUrls: ['./song.page.scss'],
})
export class SongPage implements OnInit {
  editForm!: FormGroup;
  id: any;
  constructor(
    private db: DbService,
    private router: Router,
    public formBuilder: FormBuilder,
    private actRoute: ActivatedRoute
  ) {
    this.id = this.actRoute.snapshot.paramMap.get('id');
    this.db.getSong(this.id).then((song) => {
      this.editForm.setValue({
        artist_name: song['artist_name'],
        song_name: song['song_name'],
        stars: song['stars'],
      });
    });
  }
  ngOnInit() {
    this.editForm = this.formBuilder.group({
      artist_name: [''],
      song_name: [''],
      stars: [0],
    });
  }
  saveForm() {
    this.db.updateSong(this.id, this.editForm.value);
    this.router.navigate(['/home']);
  }
}
