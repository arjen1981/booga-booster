# Soundboard credits

The kermis soundboard plays short excerpts of field recordings published on
[Freesound](https://freesound.org). Every recording is licensed under
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/); the
excerpts below are modified (trimmed, loudness-normalised, faded, downmixed to mono and
re-encoded). The same attribution is shown in the dashboard's soundboard **Credits**
popover (`src/app/soundboard/sounds.ts`).

| Clip | Recording | Author | Licence | Excerpt |
| --- | --- | --- | --- | --- |
| `draaiorgel.mp3` | [Mechanical Street Organ - The Hague](https://freesound.org/people/RTB45/sounds/203424/) | RTB45 | CC BY 4.0 | 103.5 s – 115.5 s |
| `booster.mp3` | [FunFair NL 002 160827_00.wav](https://freesound.org/people/klankbeeld/sounds/352980/) | klankbeeld | CC BY 4.0 | 102.5 s – 114.5 s |
| `kamelenrace.mp3` | [fairground camel race ambience NL 140829_19.wav](https://freesound.org/people/klankbeeld/sounds/263142/) | klankbeeld | CC BY 4.0 | 49.0 s – 61.0 s |
| `kermis.mp3` | [FunFair NL 001 160827_00.wav](https://freesound.org/people/klankbeeld/sounds/353221/) | klankbeeld | CC BY 4.0 | 0.0 s – 12.0 s |

## Reproducing the clips

Sources are Freesound's HQ previews (`https://cdn.freesound.org/previews/<id/1000>/<id>_<user>-hq.mp3`).
Excerpt starts were picked as the loudest 12 s window by an `ebur128` short-term
loudness scan. Each clip was then encoded with:

```bash
ffmpeg -ss <start> -t 12 -i <source>.mp3 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.3,afade=t=out:st=11.7:d=0.3" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 96k -map_metadata -1 <clip>.mp3
```

(run via Docker: `docker run --rm -v "$PWD:/w" -w /w linuxserver/ffmpeg …`). Result: four
12 s mono 96 kbit/s MP3s of ~145 KB each, ~580 KB in total.
