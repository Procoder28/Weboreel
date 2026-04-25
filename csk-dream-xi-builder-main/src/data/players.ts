import p1 from "@/assets/player-1.jpg";
import p2 from "@/assets/player-2.jpg";
import p3 from "@/assets/player-3.jpg";
import p4 from "@/assets/player-4.jpg";
import p5 from "@/assets/player-5.jpg";
import p6 from "@/assets/player-6.jpg";
import p7 from "@/assets/player-7.jpg";
import p8 from "@/assets/player-8.jpg";
import p9 from "@/assets/player-9.jpg";
import p10 from "@/assets/player-10.jpg";
import p11 from "@/assets/player-11.jpg";
import p12 from "@/assets/player-12.jpg";
import p13 from "@/assets/player-13.jpg";
import p14 from "@/assets/player-14.jpg";
import p15 from "@/assets/player-15.jpg";

export type Role = "BAT" | "BOWL" | "AR" | "WK";

export interface Player {
  id: string;
  name: string;
  role: Role;
  rating: number;
  era: "Legend" | "Modern";
  img: string;
  tag?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  BAT: "Batsman",
  BOWL: "Bowler",
  AR: "All-Rounder",
  WK: "Wicket-Keeper",
};

export const PLAYERS: Player[] = [
  { id: "msd",     name: "MS Dhoni",         role: "WK",   rating: 96, era: "Legend", img: p1,  tag: "Captain Cool" },
  { id: "raina",   name: "Suresh Raina",     role: "BAT",  rating: 90, era: "Legend", img: p2,  tag: "Mr. IPL" },
  { id: "jadeja",  name: "Ravindra Jadeja",  role: "AR",   rating: 93, era: "Modern", img: p3,  tag: "Sir Jadeja" },
  { id: "bravo",   name: "Dwayne Bravo",     role: "AR",   rating: 88, era: "Legend", img: p4,  tag: "DJ Bravo" },
  { id: "faf",     name: "Faf du Plessis",   role: "BAT",  rating: 89, era: "Modern", img: p5,  tag: "Rock Solid" },
  { id: "rituraj", name: "Ruturaj Gaikwad",  role: "BAT",  rating: 87, era: "Modern", img: p6,  tag: "The Heir" },
  { id: "deepak",  name: "Deepak Chahar",    role: "BOWL", rating: 84, era: "Modern", img: p7,  tag: "Swing King" },
  { id: "muralia", name: "Muttiah Muralitharan", role: "BOWL", rating: 92, era: "Legend", img: p8,  tag: "Smiling Assassin" },
  { id: "vinny",   name: "Stephen Fleming",  role: "BAT",  rating: 82, era: "Legend", img: p9,  tag: "The Coach" },
  { id: "ashwin",  name: "Ravichandran Ashwin", role: "BOWL", rating: 90, era: "Modern", img: p10, tag: "The Professor" },
  { id: "moeen",   name: "Sam Curran",       role: "AR",   rating: 83, era: "Modern", img: p11, tag: "Big Buy" },
  { id: "morkel",  name: "Lungi Ngidi",      role: "BOWL", rating: 81, era: "Modern", img: p12, tag: "Express Pace" },
  { id: "dube",    name: "Devon Conway",     role: "WK",   rating: 86, era: "Modern", img: p13, tag: "Kiwi Star" },
  { id: "shivam",  name: "Shivam Dube",      role: "AR",   rating: 82, era: "Modern", img: p14, tag: "Six Machine" },
  { id: "hayden",  name: "Matthew Hayden",   role: "BAT",  rating: 91, era: "Legend", img: p15, tag: "Mongoose" },
];
