import React, { useState } from 'react';
import { RadioButton, InputDropdown, Input } from '@/components/uikit';

export enum AddSong {
  fromExisting = 'From existing',
  fromSpotify = 'From Spotify link',
  manually = 'Manually',
}

interface Props {
  song: string;
  selectSong: (arg: string) => void;
}

export const SongAddition = ({ song, selectSong }: Props) => {
  const [songAdditionType, setSongAdditionType] = useState<AddSong | null>(null);
  const songList = ['Song 1', 'Song 2', 'Song 3', 'Song 4'];

  return (
    <div>
      <h3>Add song:</h3>
      <RadioButton
        name="Song Addition Type"
        value={AddSong.fromExisting}
        labelFor="fromExisting"
        onChange={() => setSongAdditionType(AddSong.fromExisting)}
        checked={songAdditionType === 'From existing'}
      />
      <RadioButton
        name="Song Addition Type"
        value={AddSong.fromSpotify}
        labelFor="spotifyLink"
        onChange={() => setSongAdditionType(AddSong.fromSpotify)}
        checked={songAdditionType === 'From Spotify link'}
      />
      <RadioButton
        name="Song Addition Type"
        value={AddSong.manually}
        labelFor="manually"
        onChange={() => setSongAdditionType(AddSong.manually)}
        checked={songAdditionType === 'Manually'}
      />

      {songAdditionType === 'From existing' && (
        <InputDropdown
          label="Songs:"
          placeholder="Choose song"
          values={songList}
          setValue={(song) => selectSong(song)}
        />
      )}
      {songAdditionType === 'From Spotify link' && (
        <Input
          type="text"
          value={song}
          placeholder="Enter Spotify link"
          label="Spotify Link"
          setValue={(song) => selectSong(song)}
        />
      )}
      {songAdditionType === 'Manually' && (
        <Input
          type="text"
          value={song}
          placeholder="Enter song name"
          label="Song Name"
          setValue={(song) => selectSong(song)}
        />
      )}
    </div>
  );
};
