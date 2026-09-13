"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  CircleCheck,
  FileCheck2,
  Globe2,
  LockKeyhole,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { AsaPhisApi } from "@/lib/api/contracts";
import type {
  Country,
  CountryConfig,
  IdentityDocument,
  OnboardingState,
  PaymentMethod,
  PaymentStatus,
  PhoneChannel,
} from "@/lib/types";
import { demoData } from "@/lib/mock-data";
import { formatContribution, onboardingSteps } from "@/lib/types";

const countries: Country[] = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "United Kingdom",
  "United States",
  "Other / support needed",
];

const defaultState: OnboardingState = {
  stepIndex: 0,
  account: { name: "", email: "", password: "" },
  phone: {
    number: "",
    otp: "",
    channel: "SMS",
    resendSeconds: 42,
    verified: false,
  },
  currentLocation: "Nigeria",
  citizenshipOrEligibility: "Nigeria",
  identityDocument: "NIN",
  identityStatus: "not_started",
  securityChecked: false,
  contribution: {
    amount: 25000,
    currency: "NGN",
    method: "Card",
    status: "Pending",
  },
  activated: false,
};

export function JoinJourney({
  api,
  onBackToPublic,
  onActivated,
}: {
  api: AsaPhisApi;
  onBackToPublic: () => void;
  onActivated: (email?: string) => void;
}) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [identityFileName, setIdentityFileName] = useState("");
  const [identityFileToken, setIdentityFileToken] = useState<string | null>(null);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);

  // Real country config from the backend; seed is display fallback only.
  // Payment amounts and identity options always sync from the real config
  // when it arrives so members never pay seed amounts.
  const configQuery = useQuery({
    queryKey: ["country-config", state.currentLocation],
    queryFn: () => api.getCountryConfig(state.currentLocation),
    staleTime: 300_000,
  });
  const countryConfig: CountryConfig =
    configQuery.data ?? demoData.countryConfigs[state.currentLocation];
  const syncedCountry = useRef<string | null>(null);
  useEffect(() => {
    if (!configQuery.data || syncedCountry.current === state.currentLocation) return;
    syncedCountry.current = state.currentLocation;
    const cfg = configQuery.data;
    setState((current) => ({
      ...current,
      identityDocument: (cfg.identityDocuments[0] ?? current.identityDocument) as IdentityDocument,
      contribution: {
        ...current.contribution,
        amount: Number(cfg.contribution.amount) || current.contribution.amount,
        currency: cfg.contribution.currency || current.contribution.currency,
        method: (cfg.contribution.methods[0] ?? current.contribution.method) as PaymentMethod,
      },
    }));
  }, [configQuery.data, state.currentLocation]);
  const progress = ((state.stepIndex + 1) / onboardingSteps.length) * 100;
  const currentStep = onboardingSteps[state.stepIndex];

  const setPatch = (patch: Partial<OnboardingState>) =>
    setState((current) => ({ ...current, ...patch }));
  const setContribution = (patch: Partial<OnboardingState["contribution"]>) =>
    setState((current) => ({
      ...current,
      contribution: { ...current.contribution, ...patch },
    }));
  const setPhone = (patch: Partial<OnboardingState["phone"]>) =>
    setState((current) => ({
      ...current,
      phone: { ...current.phone, ...patch },
    }));

  const identityOptions = useMemo(
    () => countryConfig.identityDocuments,
    [countryConfig.identityDocuments],
  );

  const sendPhone = async () => {
    const result = await api.sendPhoneCode({
      number: state.phone.number,
      channel: state.phone.channel,
    });
    setChallengeId(result.challengeId);
    setPhone({
      resendSeconds: result.resendAfterSeconds,
    });
    setPhoneSent(true);
    setFeedback(`A verification code was sent by ${state.phone.channel}.`);
  };

  const verifyPhone = async () => {
    if (!challengeId) {
      setFeedback("Send a verification code first.");
      return;
    }
    const result = await api.verifyPhoneCode({
      challengeId,
      code: state.phone.otp,
    });
    setPhone({ verified: result.verified });
    setFeedback(
      result.verified
        ? "Phone verified successfully."
        : "We could not verify that code.",
    );
  };

  const uploadIdentityFile = async (file: File | null) => {
    setIdentityFileName(file?.name ?? "");
    setIdentityFileToken(null);
    if (!file) return;
    setUploadingIdentity(true);
    try {
      const out = await api.uploadFile("identity", file);
      setIdentityFileToken(out.fileToken);
      setFeedback("Identity document uploaded.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Document upload failed. Try a JPG, PNG, or PDF.");
    } finally {
      setUploadingIdentity(false);
    }
  };

  const runSecurity = async () => {
    const result = await api.runSecurityCheck();
    setPatch({ securityChecked: result.passed });
    setFeedback(
      result.passed
        ? "Security check complete."
        : "Security check failed. Try again or contact support.",
    );
  };

  const setCountry = (country: Country) => {
    // Real config syncs in through the query effect above; close immediately.
    setPatch({ currentLocation: country });
    setCountryPickerOpen(false);
  };

  const updatePayment = async (status: PaymentStatus) => {
    // The recorded status always comes from the backend, never from tapping
    // a button. Non-start actions only update the local note.
    if (status !== "Successful") {
      setContribution({ status });
      setFeedback(`Payment status: ${status}.`);
      return;
    }
    try {
      const created = await api.createContribution({
        amount: state.contribution.amount,
        currency: state.contribution.currency,
        method: state.contribution.method,
      });
      setContribution({ status: "Pending" });
      setFeedback(
        `Contribution ${created.id} recorded as pending. It activates after provider confirmation.`,
      );
    } catch (err) {
      setContribution({ status: "Failed" });
      setFeedback(err instanceof Error ? err.message : "Contribution could not be started.");
    }
  };

  const next = async () => {
    setFeedback("");
    if (state.stepIndex === 1 && !state.phone.verified) {
      setFeedback("Verify your phone before continuing.");
      return;
    }
    if (state.stepIndex === 3) {
      if (!identityFileToken) {
        setFeedback("Upload your identity document first.");
        return;
      }
      const result = await api.submitIdentity({
        country: state.currentLocation,
        document: state.identityDocument,
        fileToken: identityFileToken,
      });
      setPatch({ identityStatus: result.status });
    }
    if (state.stepIndex === 4 && !state.securityChecked) {
      setFeedback("Run the security check before continuing.");
      return;
    }
    if (
      state.stepIndex === 5 &&
      !["Successful", "Processing", "Pending"].includes(state.contribution.status)
    ) {
      setFeedback(
        "Record a contribution first — it stays pending until the provider confirms it. Activation is blocked for failed or cancelled payments.",
      );
      return;
    }
    if (state.stepIndex === onboardingSteps.length - 2) {
      const activation = await api.getActivationStatus();
      if (activation.active)
        setState((current) => ({
          ...current,
          stepIndex: current.stepIndex + 1,
          activated: true,
        }));
      return;
    }
    setState((current) => ({
      ...current,
      stepIndex: Math.min(current.stepIndex + 1, onboardingSteps.length - 1),
    }));
  };

  const back = () => {
    if (state.stepIndex === 0) return onBackToPublic();
    setFeedback("");
    setState((current) => ({ ...current, stepIndex: current.stepIndex - 1 }));
  };

  return (
    <div className="join-view">
      <div className="site-shell onboarding-shell">
        <aside className="onboarding-aside weave-surface">
          <button
            type="button"
            className="back-link light-link"
            onClick={onBackToPublic}
          >
            <ChevronLeft size={15} aria-hidden="true" /> Back to public site
          </button>
          <p className="eyebrow eyebrow-light">Join the journey</p>
          <h1>Join AsaPhis.</h1>
          <p>Complete the steps below to activate your membership.</p>
          <ol className="step-list">
            {onboardingSteps.map((step, index) => (
              <li
                key={step}
                className={
                  index === state.stepIndex
                    ? "is-active"
                    : index < state.stepIndex
                      ? "is-complete"
                      : ""
                }
              >
                <span>
                  {index < state.stepIndex ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="aside-note">
            <LockKeyhole size={16} aria-hidden="true" />
            <span>Your documents stay protected.</span>
          </div>
        </aside>

        <section className="onboarding-main" aria-labelledby="onboarding-title">
          <div className="onboarding-top">
            <div>
              <p className="eyebrow">
                Step {state.stepIndex + 1} of {onboardingSteps.length}
              </p>
              <span className="onboarding-count">{currentStep}</span>
            </div>
          </div>
          <Progress
            value={progress}
            aria-label={`Onboarding progress: ${Math.round(progress)} percent`}
            className="onboarding-progress"
          />
          <div className="onboarding-step" aria-live="polite">
            {state.stepIndex === 0 ? (
              <AccountStep
                state={state}
                onChange={(account) => setPatch({ account })}
              />
            ) : null}
            {state.stepIndex === 1 ? (
              <PhoneStep
                state={state}
                phoneSent={phoneSent}
                onSend={sendPhone}
                onVerify={verifyPhone}
                onChange={setPhone}
              />
            ) : null}
            {state.stepIndex === 2 ? (
              <CountryStep
                state={state}
                open={countryPickerOpen}
                setOpen={setCountryPickerOpen}
                onCountry={setCountry}
                onCitizenship={(value) =>
                  setPatch({ citizenshipOrEligibility: value })
                }
              />
            ) : null}
            {state.stepIndex === 3 ? (
              <IdentityStep
                state={state}
                options={identityOptions}
                fileName={identityFileName}
                uploading={uploadingIdentity}
                onChange={(identityDocument) => setPatch({ identityDocument })}
                onFile={uploadIdentityFile}
              />
            ) : null}
            {state.stepIndex === 4 ? (
              <SecurityStep state={state} onRun={runSecurity} />
            ) : null}
            {state.stepIndex === 5 ? (
              <ContributionStep
                state={state}
                config={countryConfig}
                onChange={setContribution}
                onStatus={updatePayment}
              />
            ) : null}
            {state.stepIndex === 6 ? (
              <ActivationStep
                name={state.account.name}
                onOpenMember={() => onActivated(state.account.email)}
              />
            ) : null}
          </div>
          {feedback ? (
            <Alert
              className="feedback-alert"
              variant={
                feedback.includes("successfully") ||
                feedback.includes("complete") ||
                feedback.includes("recorded")
                  ? "default"
                  : "destructive"
              }
            >
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          ) : null}
          <div className="onboarding-footer">
            <Button
              type="button"
              variant="outline"
              className="ap-control ap-control-outline"
              onClick={back}
            >
              <ArrowLeft size={15} aria-hidden="true" />{" "}
              {state.stepIndex === 0 ? "Public site" : "Back"}
            </Button>
            {state.stepIndex < onboardingSteps.length - 1 ? (
              <Button
                type="button"
                className="ap-control ap-control-primary"
                onClick={next}
              >
                Continue <ArrowRight size={15} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                className="ap-control ap-control-dark"
                onClick={() => onActivated(state.account.email)}
              >
                Open member platform <ArrowRight size={15} aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountStep({
  state,
  onChange,
}: {
  state: OnboardingState;
  onChange: (value: OnboardingState["account"]) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Account</p>
      <h2 id="onboarding-title">Create your account.</h2>
      <p>Enter your details to get started.</p>
      <div className="form-grid form-grid-two">
        <Field label="Full name" htmlFor="account-name">
          <Input
            id="account-name"
            value={state.account.name}
            onChange={(event) =>
              onChange({ ...state.account, name: event.target.value })
            }
            placeholder="Your full name"
          />
        </Field>
        <Field label="Email address" htmlFor="account-email">
          <Input
            id="account-email"
            type="email"
            value={state.account.email}
            onChange={(event) =>
              onChange({ ...state.account, email: event.target.value })
            }
            placeholder="you@example.com"
          />
        </Field>
      </div>
      <Field
        label="Create a password"
        htmlFor="account-password"
        hint="At least 8 characters"
      >
        <Input
          id="account-password"
          type="password"
          value={state.account.password}
          onChange={(event) =>
            onChange({ ...state.account, password: event.target.value })
          }
          placeholder="At least 8 characters"
        />
      </Field>
      <PrivacyNote />
    </div>
  );
}

function PhoneStep({
  state,
  phoneSent,
  onSend,
  onVerify,
  onChange,
}: {
  state: OnboardingState;
  phoneSent: boolean;
  onSend: () => void;
  onVerify: () => void;
  onChange: (value: Partial<OnboardingState["phone"]>) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Phone verification</p>
      <h2 id="onboarding-title">Verify your phone.</h2>
      <p>Choose a channel and enter the code we send.</p>
      <Field label="Phone number" htmlFor="join-phone">
        <Input
          id="join-phone"
          value={state.phone.number}
          onChange={(event) => onChange({ number: event.target.value })}
          placeholder="+234 801 234 5678"
        />
      </Field>
      <div className="channel-label">
        <span>Channel</span>
        <span className="field-hint">Available options</span>
      </div>
      <div
        className="choice-row"
        role="group"
        aria-label="Phone verification channel"
      >
        {(["SMS", "WhatsApp", "Voice"] as PhoneChannel[]).map((channel) => (
          <button
            type="button"
            className={state.phone.channel === channel ? "is-active" : ""}
            key={channel}
            onClick={() => onChange({ channel })}
          >
            {channel === "SMS" ? (
              <Phone size={15} aria-hidden="true" />
            ) : channel === "WhatsApp" ? (
              <MessageCircle size={15} aria-hidden="true" />
            ) : (
              <Phone size={15} aria-hidden="true" />
            )}
            {channel}
          </button>
        ))}
      </div>
      {phoneSent ? (
        <div className="otp-area">
          <Field
            label="One-time code"
            htmlFor="join-otp"
            hint="Enter the 6-digit code sent to your phone"
          >
            <Input
              id="join-otp"
              inputMode="numeric"
              maxLength={6}
              value={state.phone.otp}
              onChange={(event) => onChange({ otp: event.target.value })}
            />
          </Field>
          <div className="otp-actions">
            <Button
              type="button"
              variant="outline"
              className="ap-control ap-control-outline"
              onClick={onVerify}
            >
              <CircleCheck size={15} aria-hidden="true" /> Verify code
            </Button>
            <button type="button" className="text-action" onClick={onSend}>
              Resend code · 00:
              {String(state.phone.resendSeconds).padStart(2, "0")}
            </button>
            <button
              type="button"
              className="text-action"
              onClick={() => onChange({ number: "" })}
            >
              Change number
            </button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="ap-control ap-control-outline send-code"
          onClick={onSend}
        >
          Send code <ArrowRight size={15} aria-hidden="true" />
        </Button>
      )}
      <div className="verified-note">
        <ShieldCheck size={17} aria-hidden="true" />
        <span>
          {state.phone.verified
            ? "Phone verified."
            : "Your number stays private."}
        </span>
      </div>
    </div>
  );
}

function CountryStep({
  state,
  open,
  setOpen,
  onCountry,
  onCitizenship,
}: {
  state: OnboardingState;
  open: boolean;
  setOpen: (value: boolean) => void;
  onCountry: (value: Country) => void;
  onCitizenship: (value: Country) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Country & eligibility</p>
      <h2 id="onboarding-title">Confirm your country.</h2>
      <p>We detected your current location. You can change it below.</p>
      <div className="detected-card">
        <Globe2 size={22} aria-hidden="true" />
        <div>
          <strong>We detected that you&apos;re currently in Nigeria.</strong>
          <span>Change this if it is not right.</span>
          <button
            type="button"
            className="text-action chocolate-link"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close options" : "Change country"}
          </button>
        </div>
      </div>
      {open ? (
        <div
          className="country-options"
          role="listbox"
          aria-label="Change current country"
        >
          {countries.map((country) => (
            <button
              type="button"
              key={country}
              onClick={() => onCountry(country)}
              className={state.currentLocation === country ? "is-active" : ""}
            >
              {country}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="form-grid form-grid-two">
        <Field label="Current location" htmlFor="current-location">
          <Select
            value={state.currentLocation}
            onValueChange={(value) => onCountry(value as Country)}
          >
            <SelectTrigger id="current-location" className="full-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Country of citizenship / eligibility"
          htmlFor="citizenship-country"
        >
          <Select
            value={state.citizenshipOrEligibility}
            onValueChange={(value) => onCitizenship(value as Country)}
          >
            <SelectTrigger id="citizenship-country" className="full-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="privacy-note">
        <LockKeyhole size={17} aria-hidden="true" />
        <span>These fields control the next verification options.</span>
      </div>
    </div>
  );
}

function IdentityStep({
  state,
  options,
  fileName,
  uploading,
  onChange,
  onFile,
}: {
  state: OnboardingState;
  options: IdentityDocument[];
  fileName: string;
  uploading: boolean;
  onChange: (value: IdentityDocument) => void;
  onFile: (file: File | null) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Identity</p>
      <h2 id="onboarding-title">Choose a document.</h2>
      <p>Available options for {state.currentLocation}.</p>
      <div
        className="identity-list"
        role="radiogroup"
        aria-label="Identity document type"
      >
        {options.map((document) => (
          <button
            type="button"
            className={state.identityDocument === document ? "is-active" : ""}
            key={document}
            onClick={() => onChange(document)}
            role="radio"
            aria-checked={state.identityDocument === document}
          >
            <span>
              <FileCheck2 size={17} aria-hidden="true" /> {document}
            </span>
            {state.identityDocument === document ? (
              <Check size={16} aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>
      <label className="upload-placeholder" htmlFor="identity-file">
        <FileCheck2 size={22} aria-hidden="true" />
        <div>
          <strong>Secure upload</strong>
          <span>{fileName || "PDF, JPG or PNG up to 10MB."}</span>
        </div>
        <span className="status-chip">{uploading ? "Uploading…" : fileName ? "Uploaded" : "Choose file"}</span>
        <input
          id="identity-file"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          hidden
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="privacy-note">
        <LockKeyhole size={17} aria-hidden="true" />
        <span>Only required information is requested.</span>
      </div>
    </div>
  );
}

function SecurityStep({
  state,
  onRun,
}: {
  state: OnboardingState;
  onRun: () => void;
}) {
  return (
    <div>
      <p className="eyebrow">Security check</p>
      <h2 id="onboarding-title">Confirm this device.</h2>
      <p>Run a quick check before you continue.</p>
      <div className="security-checklist">
        <div>
          <Check size={17} aria-hidden="true" />
          <span>Phone verification</span>
          <strong>{state.phone.verified ? "Complete" : "Waiting"}</strong>
        </div>
        <div>
          <Check size={17} aria-hidden="true" />
          <span>Identity document</span>
          <strong>{state.identityDocument}</strong>
        </div>
        <div>
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Device check</span>
          <strong>{state.securityChecked ? "Complete" : "Required"}</strong>
        </div>
      </div>
      <Button
        type="button"
        variant={state.securityChecked ? "default" : "outline"}
        className={`ap-control ${state.securityChecked ? "ap-control-dark" : "ap-control-outline"} security-button`}
        onClick={onRun}
      >
        {state.securityChecked ? (
          <CircleCheck size={15} aria-hidden="true" />
        ) : (
          <ShieldCheck size={15} aria-hidden="true" />
        )}
        {state.securityChecked ? "Check complete" : "Run security check"}
      </Button>
      <div className="privacy-note">
        <LockKeyhole size={17} aria-hidden="true" />
        <span>The backend makes the final access decision.</span>
      </div>
    </div>
  );
}

function ContributionStep({
  state,
  config,
  onChange,
  onStatus,
}: {
  state: OnboardingState;
  config: CountryConfig;
  onChange: (value: Partial<OnboardingState["contribution"]>) => void;
  onStatus: (status: PaymentStatus) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Contribution</p>
      <h2 id="onboarding-title">Choose an amount.</h2>
      <p>Select a method and continue.</p>
      <div className="contribution-summary">
        <div>
          <span className="field-hint">For {state.currentLocation}</span>
          <strong>
            {formatContribution(
              state.contribution.amount,
              state.contribution.currency,
            )}
          </strong>
        </div>
        <span className="status-chip">
          {config.contribution.usesGlobalFallback
            ? "International rate"
            : "Regional rate"}
        </span>
      </div>
      <div className="form-grid form-grid-two">
        <Field label="Amount" htmlFor="join-amount">
          <Input
            id="join-amount"
            type="number"
            value={state.contribution.amount}
            onChange={(event) =>
              onChange({ amount: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Currency" htmlFor="join-currency">
          <Select
            value={state.contribution.currency}
            onValueChange={(value) => onChange({ currency: value })}
          >
            <SelectTrigger id="join-currency" className="full-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["NGN", "GHS", "KES", "GBP", "USD"].map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <p className="field-label">Payment method</p>
      <div
        className="choice-row"
        role="group"
        aria-label="Contribution payment method"
      >
        {config.contribution.methods.map((method) => (
          <button
            type="button"
            className={state.contribution.method === method ? "is-active" : ""}
            key={method}
            onClick={() => onChange({ method: method as PaymentMethod })}
          >
            {method}
          </button>
        ))}
      </div>
      <p className="field-label">Payment status</p>
      <div
        className="status-choice-row"
        role="group"
        aria-label="Payment status"
      >
        {(
          [
            "Pending",
            "Processing",
            "Successful",
            "Failed",
            "Cancelled",
          ] as PaymentStatus[]
        ).map((status) => (
          <button
            type="button"
            className={
              state.contribution.status === status
                ? `is-active status-${status.toLowerCase()}`
                : ""
            }
            key={status}
            onClick={() => onStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="payment-note">
        <span>
          Status: <strong>{state.contribution.status}</strong>
        </span>
        <span>
          {state.contribution.status === "Successful"
            ? "Ready to activate."
            : "Waiting for confirmation."}
        </span>
      </div>
    </div>
  );
}

function ActivationStep({
  name,
  onOpenMember,
}: {
  name: string;
  onOpenMember: () => void;
}) {
  const firstName = name.trim().split(" ")[0] || "there";
  return (
    <div className="activation-step">
      <span className="activation-icon">
        <CircleCheck size={30} aria-hidden="true" />
      </span>
      <p className="eyebrow">Membership active</p>
      <h2 id="onboarding-title">Welcome, {firstName}.</h2>
      <p>
        Your member ID is ready in your platform profile.
      </p>
      <div className="activation-list">
        <span>
          <Check size={15} aria-hidden="true" /> Phone verified
        </span>
        <span>
          <Check size={15} aria-hidden="true" /> Identity verified
        </span>
        <span>
          <Check size={15} aria-hidden="true" /> Contribution successful
        </span>
      </div>
      <Button
        type="button"
        className="ap-control ap-control-dark"
        onClick={onOpenMember}
      >
        Open member platform <ArrowRight size={15} aria-hidden="true" />
      </Button>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <div className="field-label-row">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="privacy-note">
      <LockKeyhole size={17} aria-hidden="true" />
      <span>Your information is used for membership verification.</span>
    </div>
  );
}
