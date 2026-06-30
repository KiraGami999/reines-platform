import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Consistent API response helpers.
 * All API routes should use these to ensure uniform error shapes.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have permission to access this resource") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function validationError(err: ZodError) {
  return NextResponse.json(
    { error: "Validation failed", issues: err.flatten().fieldErrors },
    { status: 422 }
  );
}

export function serverError(message = "An unexpected error occurred. Please try again.") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function serviceUnavailable(message = "Database unavailable") {
  return NextResponse.json({ error: message }, { status: 503 });
}
