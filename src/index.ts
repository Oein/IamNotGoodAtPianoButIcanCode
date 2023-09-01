console.log("Running");

import easymidi from "easymidi";
import { Midi } from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";
import { writeFileSync } from "fs";

var output = new easymidi.Output("BGC", true);
let playing = false;

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
}

export async function player(midiFile: Midi) {
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
            },
          ];
        else
          timemap[st].push({
            type: "ON",
            pitch: notepitch,
          });

        if (!timemap[ed])
          timemap[ed] = [
            {
              type: "OFF",
              pitch: notepitch,
            },
          ];
        else
          timemap[ed].push({
            type: "OFF",
            pitch: notepitch,
          });
      });
    });

    const timeList: number[] = [...timeset] as any;

    const playNt = (num: number) => {
      timemap[num].forEach((note) => {
        if (note.type == "ON")
          output.send("noteon", {
            note: note.pitch,
            velocity: 127,
            channel: 0,
          });
        if (note.type == "OFF")
          output.send("noteoff", {
            note: note.pitch,
            velocity: 127,
            channel: 0,
          });
      });
    };

    let stT = Date.now();
    const runNext = (i: number) => {
      if (!playing) return;
      playNt(timeList[i]);

      if (i + 1 < timeList.length) {
        console.log(
          "REQUIRED",
          timeList[i + 1] - timeList[i],
          "DIFFCHANGE",
          timeList[i + 1] - timeList[i] - (timeList[i + 1] + stT - Date.now())
        );
        setTimeout(runNext, timeList[i + 1] + stT - Date.now(), i + 1);
      } else {
        playing = false;
        return;
      }
    };
    runNext(0);
  });
}

export function stopper() {
  playing = false;
}

export function closer() {
  output.close();
}
