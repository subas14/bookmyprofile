"use client";

import { Card, cx } from "@/components/ui";

/** Advertiser + campaign asset details (step 3 of the booking flow). */

export interface FormValues {
  advertiserName: string;
  advertiserEmail: string;
  brandName: string;
  targetUrl: string;
  assetUrl: string;
  notes: string;
}

const FIELDS: {
  key: keyof FormValues;
  label: string;
  type: string;
  placeholder: string;
  hint?: string;
  required: boolean;
  full?: boolean;
}[] = [
  {
    key: "advertiserName",
    label: "Your name",
    type: "text",
    placeholder: "Jane Doe",
    required: true,
  },
  {
    key: "advertiserEmail",
    label: "Email",
    type: "email",
    placeholder: "jane@company.com",
    hint: "Invoices and campaign updates go here.",
    required: true,
  },
  {
    key: "brandName",
    label: "Brand / product name",
    type: "text",
    placeholder: "Acme Analytics",
    required: true,
  },
  {
    key: "targetUrl",
    label: "Destination URL",
    type: "url",
    placeholder: "https://acme.com",
    hint: "Where the placement should send people.",
    required: true,
  },
  {
    key: "assetUrl",
    label: "Logo / creative URL",
    type: "url",
    placeholder: "https://acme.com/logo.png",
    hint: "Optional, you can also send it after checkout.",
    required: false,
    full: true,
  },
];

const INPUT_CLASS =
  "mt-2 w-full rounded-xl bg-panel px-4 py-2.5 text-sm ring-1 transition-shadow placeholder:text-muted/60 focus:ring-2 focus:ring-accent";

export function FormFields({
  values,
  errors,
  onChange,
}: {
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: keyof FormValues, value: string) => void;
}) {
  return (
    <Card>
      <h2 className="text-base font-semibold">3. Your details</h2>
      <p className="mt-1 text-sm text-muted">
        Used for your invoice and to set the placement live.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.key];
          const describedBy = error
            ? `${field.key}-error`
            : field.hint
              ? `${field.key}-hint`
              : undefined;

          return (
            <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
              <label
                htmlFor={field.key}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
                {field.required ? null : (
                  <span className="ml-1 text-xs text-muted">(optional)</span>
                )}
              </label>
              <input
                id={field.key}
                name={field.key}
                type={field.type}
                value={values[field.key]}
                required={field.required}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => onChange(field.key, event.target.value)}
                className={cx(
                  INPUT_CLASS,
                  error ? "ring-danger" : "ring-line",
                )}
              />
              {error ? (
                <p
                  id={`${field.key}-error`}
                  className="mt-1.5 text-xs text-danger"
                >
                  {error}
                </p>
              ) : field.hint ? (
                <p id={`${field.key}-hint`} className="mt-1.5 text-xs text-muted">
                  {field.hint}
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground"
          >
            Anything else?
            <span className="ml-1 text-xs text-muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes}
            placeholder="Preferred copy, launch dates, or anything I should know."
            aria-invalid={errors.notes ? true : undefined}
            onChange={(event) => onChange("notes", event.target.value)}
            className={cx(
              INPUT_CLASS,
              "resize-y",
              errors.notes ? "ring-danger" : "ring-line",
            )}
          />
          {errors.notes ? (
            <p className="mt-1.5 text-xs text-danger">{errors.notes}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
