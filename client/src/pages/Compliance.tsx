import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Scale, FileText, Lock } from "lucide-react";

export default function Compliance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance & Legal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          DisputeOS compliance framework and legal disclaimers
        </p>
      </div>

      {/* Compliance Status */}
      <Card className="border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Compliance Status: Active</h2>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                All dispute operations in DisputeOS are governed by strict compliance rules.
                The system will never generate, approve, or send disputes that are false,
                fabricated, or unsupported by evidence from your credit reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              FCRA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>All disputes reference specific FCRA sections (§611, §623)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>30-day response deadlines automatically tracked per FCRA requirements</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Certified mail with return receipt for proof of delivery</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Complete audit trail of all dispute actions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Credit reports stored with encryption at rest</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Role-based access control for all operations</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Secure file upload with type and size validation</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>No sensitive data exposed in client-side code</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anti-Fraud Safeguards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Anti-Fraud Safeguards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
              <h4 className="text-sm font-medium">Evidence Requirement</h4>
              <p className="text-xs text-muted-foreground">
                Every dispute candidate must have supporting evidence extracted
                directly from the credit report. Candidates without evidence are
                automatically flagged as non-compliant and cannot be approved.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
              <h4 className="text-sm font-medium">Confidence Scoring</h4>
              <p className="text-xs text-muted-foreground">
                AI analysis assigns confidence scores based on evidence strength.
                Low-confidence disputes are flagged for additional review and
                placed in later dispute rounds.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
              <h4 className="text-sm font-medium">Compliance Gate</h4>
              <p className="text-xs text-muted-foreground">
                Non-compliant disputes cannot be approved or have letters generated.
                This prevents frivolous disputes that could harm the consumer's
                standing with credit bureaus.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
              <h4 className="text-sm font-medium">Human Review Required</h4>
              <p className="text-xs text-muted-foreground">
                All AI-identified candidates require explicit user approval before
                any letter is generated or mail is sent. No automated dispatch
                without human oversight.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Legal Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">DisputeOS is a credit dispute management tool, not a law firm or credit repair organization.</strong>{" "}
            The information and tools provided are for educational and organizational purposes only
            and do not constitute legal advice.
          </p>
          <p>
            By using DisputeOS, you acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              You are responsible for the accuracy and truthfulness of all disputes you submit.
            </li>
            <li>
              DisputeOS does not guarantee any specific outcome from credit bureau disputes.
            </li>
            <li>
              Filing false or frivolous disputes may violate federal and state laws, including
              the Fair Credit Reporting Act (FCRA) and state credit repair organization acts.
            </li>
            <li>
              You should consult with a licensed attorney for legal advice regarding your
              specific credit situation.
            </li>
            <li>
              DisputeOS maintains compliance safeguards but cannot verify the accuracy of
              information you provide about your credit history.
            </li>
          </ul>
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mt-4">
            <p className="text-xs">
              <strong className="text-amber-400">Important:</strong> Under the FCRA, consumers have the right
              to dispute inaccurate information on their credit reports. However, knowingly
              filing false disputes or misrepresenting information to credit bureaus may result
              in civil liability or criminal penalties. DisputeOS is designed to help you
              exercise your legitimate rights under consumer protection law.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
