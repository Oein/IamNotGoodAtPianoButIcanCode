console.log("Running");

import easymidi from "easymidi";
import { Midi } from "@tonejs/midi";

var output = new easymidi.Output("BGC", true);
let playing = false;

let timeouts: NodeJS.Timer[] = [];

export function shutdown() {
  for (let i = 0; i < 127; i++) {
    output.send("noteoff", {
      note: i,
      velocity: 0,
      channel: 0,
    });
  }
}

const shutdownAllTimeout = () => {
  timeouts.forEach((timeout) => {
    clearTimeout(timeout);
  });
  shutdown();
};

export async function player(midiFile: Midi) {
  return new Promise<void>(async (resolve, reject) => {
    playing = true;
    let noteTimeouted = 0;
    shutdown();
    midiFile.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        noteTimeouted++;
        let notepit = note.name.slice(0, -1);
        let notepitch =
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
            : 11);

        // note.duration : sec to play
        let meOnner = setTimeout(() => {
          console.log("Play", note.name, notepitch);
          output.send("noteon", {
            note: notepitch,
            velocity: 127,
            channel: 0,
          });
          timeouts = timeouts.filter((i) => i != meOnner);
          if (!playing) shutdownAllTimeout();
        }, note.time * 1000);
        timeouts.push(meOnner);

        let meOffer = setTimeout(() => {
          console.log("Stop", note.name);
          output.send("noteoff", {
            note: notepitch,
            velocity: 0,
            channel: 0,
          });
          noteTimeouted--;

          timeouts = timeouts.filter((i) => i != meOffer);
          if (noteTimeouted == 0) {
            playing = false;
            resolve();
          }
          if (!playing) shutdownAllTimeout();
        }, (note.time + note.duration) * 1000);
        timeouts.push(meOffer);
      });
    });
  });
}

export function stopper() {
  playing = false;
  shutdownAllTimeout();
}

export function closer() {
  output.close();
}
