import { NextResponse } from "next/server";

export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: ApiError, status = 400) {
  return NextResponse.json({ error }, { status });
}
