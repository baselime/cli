import type { BaseOptions } from "../../shared";

export interface Options extends BaseOptions {
  application?: string;
  ref?: string;
  id?: string;
  from?: string;
  to?: string;
}
