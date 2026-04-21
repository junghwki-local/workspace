"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitConsult, type ConsultState } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const initialState: ConsultState = { status: "idle" };

export function ConsultForm() {
  const [state, formAction, pending] = useActionState(submitConsult, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldError = (name: string) =>
    state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
      aria-describedby={state.status !== "idle" ? "form-status" : undefined}
    >
      <Field
        id="name"
        name="name"
        label="이름"
        autoComplete="name"
        required
        error={fieldError("name")}
      />
      <Field
        id="phone"
        name="phone"
        label="연락처"
        type="tel"
        autoComplete="tel"
        required
        error={fieldError("phone")}
      />
      <Field
        id="email"
        name="email"
        label="이메일"
        type="email"
        autoComplete="email"
        required
        error={fieldError("email")}
      />
      <TextArea
        id="message"
        name="message"
        label="문의 내용"
        required
        error={fieldError("message")}
      />

      {/* Honeypot: hidden from humans, bots often fill every field. */}
      <div aria-hidden className="hidden" tabIndex={-1}>
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "bg-ink text-bg mt-2 flex h-12 items-center justify-center rounded-sm px-6 text-sm tracking-[0.2em] transition-opacity",
          pending && "opacity-60",
        )}
      >
        {pending ? "전송 중..." : "보내기"}
      </button>

      {state.status !== "idle" && (
        <p
          id="form-status"
          role={state.status === "error" ? "alert" : "status"}
          className={cn("text-sm", state.status === "success" ? "text-accent" : "text-red-700")}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label: string;
  error?: string;
}

function Field({ id, name, label, error, required, ...rest }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink-soft text-xs tracking-[0.15em]">
        {label}
        {required && (
          <span aria-hidden className="text-accent ml-1">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "border-line text-ink focus-visible:border-ink h-11 border-b bg-transparent px-1 text-sm outline-none",
          error && "border-red-600",
        )}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  name: string;
  label: string;
  error?: string;
}

function TextArea({ id, name, label, error, required, ...rest }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink-soft text-xs tracking-[0.15em]">
        {label}
        {required && (
          <span aria-hidden className="text-accent ml-1">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={5}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "border-line text-ink focus-visible:border-ink resize-none border-b bg-transparent px-1 py-2 text-sm outline-none",
          error && "border-red-600",
        )}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
