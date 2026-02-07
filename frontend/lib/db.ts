import Dexie, { Table } from "dexie";

export interface Moodboard {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: number;
}

export interface BoardItem {
  id: string;
  boardId: string;
  type: "image";     
  fileBlob: Blob;      
  name: string;      
  x: number;
  y: number;
  zIndex: number;    
  width: number;
  height: number;      
}

export class MoodboardDB extends Dexie {
  boards!: Table<Moodboard>;
  items!: Table<BoardItem>;

  constructor() {
    super("MoodboardDB");
    this.version(1).stores({
      boards: "id, createdAt",
      items: "id, boardId", 
    });
  }
}

export const db = new MoodboardDB();