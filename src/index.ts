console.log("Running");

import easymidi from "easymidi";
import { Midi } from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";

let output = new easymidi.Output("I am not good at piano but I can code", true);
let playing = false;

let pitAdder = 0;

export function setPit(pit: number) {
  pitAdder = pit;
}

export function shutdown() {
  for (let i = 0; i < 127; i++) {
    output.send("noteoff", {
      note: i,
      velocity: 0,
      channel: 0,
    });
  }
}

const toPitch = (note: Note) => {
  let notepit = note.name.slice(0, -1);

  return (
    parseInt(note.name[note.name.length - 1]) * 12 +
    (notepit == "C"
      ? 0
      : notepit == "C#"
      ? 1
      : notepit == "D"
      ? 2
      : notepit == "D#"
      ? 3
      : notepit == "E"
      ? 4
      : notepit == "F"
      ? 5
      : notepit == "F#"
      ? 6
      : notepit == "G"
      ? 7
      : notepit == "G#"
      ? 8
      : notepit == "A"
      ? 9
      : notepit == "A#"
      ? 10
      : 11)
  );
};

interface nt {
  pitch: number;
  type: "ON" | "OFF";
  velo: number;
}

export async function player(midiFile: Midi) {
  shutdown();

  let timemap: { [key: number]: nt[] } = {};
  let largest = 0;
  let timeset = new Set();

  return new Promise<void>(async (resolve, reject) => {
    playing = true;
    shutdown();
    midiFile.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        const notepitch = toPitch(note);
        const st = Math.floor(note.time * 1000);
        const ed = Math.floor((note.time + note.duration) * 1000);

        largest = Math.max(largest, ed);

        timeset.add(st);
        timeset.add(ed);
        if (!timemap[st])
          timemap[st] = [
            {
              type: "ON",
              pitch: notepitch,
              velo: note.velocity,
            },
          ];
        else
          timemap[st].push({
            type: "ON",
            pitch: notepitch,
            velo: note.velocity,
          });

        if (!timemap[ed])
          timemap[ed] = [
            {
              type: "OFF",
              pitch: notepitch,
              velo: note.noteOffVelocity,
            },
          ];
        else
          timemap[ed].push({
            type: "OFF",
            pitch: notepitch,
            velo: note.noteOffVelocity,
          });
      });
    });

    const timeList: number[] = ([...timeset] as any).sort(
      (a: number, b: number) => a - b
    );

    const playNt = (num: number) => {
      timemap[num].forEach((note) => {
        if (note.type == "ON")
          output.send("noteon", {
            note: note.pitch + pitAdder,
            velocity: note.velo,
            channel: 0,
          });
        if (note.type == "OFF")
          output.send("noteoff", {
            note: note.pitch + pitAdder,
            velocity: note.velo,
            channel: 0,
          });
      });
    };

    const runNext = (i: number) => {
      let stPlay = Date.now();
      console.log("Run", i);
      if (!playing) return;
      playNt(timeList[i]);

      if (i + 1 < timeList.length) {
        const DIFF = timeList[i + 1] - timeList[i];
        const REALLY_DIFF = DIFF + stPlay - Date.now();

        stPlay = Date.now();
        console.log("EXPECTED", DIFF, "REALLY", REALLY_DIFF);
        setTimeout(runNext, REALLY_DIFF, i + 1);
      } else {
        playing = false;
        shutdown();
        return;
      }
    };
    runNext(0);
  });
}

export function stopper() {
  playing = false;
  shutdown();
}

export function closer() {
  output.close();
}
