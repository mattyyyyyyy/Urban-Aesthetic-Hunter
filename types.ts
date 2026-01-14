export enum AppRoute {
  HOME = 'home',
  CAMERA = 'camera',
  MAP = 'map',
  MUSEUM = 'museum'
}

export interface Sticker {
  id: string;
  imageUrl: string;
  name: string;
  location: string;
  date: string;
}

export interface Post {
  id: string;
  title: string;
  image: string;
  likes: number;
  user: {
    name: string;
    avatar: string;
  };
  heightClass: string; // Tailwind class for aspect ratio
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";