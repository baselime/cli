import type { BaseOptions } from "../../shared";

export interface Options extends BaseOptions {
  application?: string;
  id?: string;
  from?: string;
  to?: string;
}
