declare module 'pg-copy-streams' {
  import { Readable, Writable } from 'stream';
  
  export function from(query: string): Readable;
  export function to(query: string): Writable;
}

// pg 모듈 확장
declare module 'pg' {
  interface Client {
    query(stream: any): any;
  }
}
