import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/domain/dates";
import { lineTotalCents, type InvoiceSummary } from "@/lib/domain/invoice";
import { countyLabel } from "@/lib/domain/labels";
import { formatEuro, formatVatRate } from "@/lib/domain/money";
import type { County, LineKind } from "@/generated/prisma/enums";

const GREEN = "#2f6b45";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  business: { fontSize: 16, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 4 },
  muted: { color: MUTED },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right", lineHeight: 1.1, marginBottom: 4 },
  meta: { textAlign: "right", marginTop: 4 },
  void: { color: "#b91c1c", fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 6 },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  label: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderTopWidth: 1, borderColor: BORDER },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: BORDER, paddingVertical: 6 },
  headRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#9ca3af" },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 210 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { borderTopWidth: 1, borderColor: "#111827", marginTop: 4, paddingTop: 4, fontSize: 12, fontFamily: "Helvetica-Bold" },
  section: { marginTop: 28 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, textAlign: "center", fontSize: 8, color: MUTED },
});

export interface InvoicePdfData {
  number: string;
  status: "ISSUED" | "VOID";
  issueDate: Date;
  dueDate: Date;
  vatRateBps: number;
  notes: string | null;
  summary: InvoiceSummary;
  lines: { description: string; kind: LineKind; quantity: number; unitPriceCents: number }[];
  client: {
    firstName: string;
    lastName: string;
    addressLine1: string | null;
    addressLine2: string | null;
    town: string | null;
    county: County;
    eircode: string | null;
    herdNumber: string;
  };
  applicationLabel: string | null;
  business: {
    businessName: string;
    ownerName: string | null;
    address: string;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    iban: string | null;
    bic: string | null;
    invoiceFooter: string | null;
  };
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { business, client, summary } = data;
  const clientAddress = [client.addressLine1, client.addressLine2, client.town, `Co. ${countyLabel(client.county)}`, client.eircode].filter(
    Boolean,
  ) as string[];

  return (
    <Document title={`Invoice ${data.number}`} author={business.businessName}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.business}>{business.businessName}</Text>
            {business.ownerName && <Text>{business.ownerName}</Text>}
            {business.address.split("\n").map((line) => (
              <Text key={line} style={s.muted}>{line}</Text>
            ))}
            {business.phone && <Text style={s.muted}>{business.phone}</Text>}
            {business.email && <Text style={s.muted}>{business.email}</Text>}
            {business.vatNumber && <Text style={s.muted}>VAT no. {business.vatNumber}</Text>}
          </View>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.meta}>{data.number}</Text>
            <Text style={[s.meta, s.muted]}>Issued {formatDate(data.issueDate)}</Text>
            <Text style={[s.meta, s.muted]}>Due {formatDate(data.dueDate)}</Text>
            {data.status === "VOID" && <Text style={s.void}>VOID</Text>}
          </View>
        </View>

        <View style={s.parties}>
          <View>
            <Text style={s.label}>Bill to</Text>
            <Text style={s.bold}>
              {client.firstName} {client.lastName}
            </Text>
            {clientAddress.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
            <Text style={s.muted}>Herd no. {client.herdNumber}</Text>
          </View>
          {data.applicationLabel && (
            <View>
              <Text style={s.label}>Re</Text>
              <Text>{data.applicationLabel}</Text>
            </View>
          )}
        </View>

        <View style={s.table}>
          <View style={s.headRow}>
            <Text style={[s.colDesc, s.bold]}>Description</Text>
            <Text style={[s.colQty, s.bold]}>Qty</Text>
            <Text style={[s.colPrice, s.bold]}>Price</Text>
            <Text style={[s.colAmount, s.bold]}>Amount</Text>
          </View>
          {data.lines.map((line, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={s.colDesc}>{line.description}</Text>
              <Text style={s.colQty}>
                {line.quantity}
                {line.kind === "HOURLY" ? " h" : ""}
              </Text>
              <Text style={s.colPrice}>{formatEuro(line.unitPriceCents)}</Text>
              <Text style={s.colAmount}>{formatEuro(lineTotalCents(line))}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{formatEuro(summary.netCents)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>VAT @ {formatVatRate(data.vatRateBps)}</Text>
            <Text>{formatEuro(summary.vatCents)}</Text>
          </View>
          <View style={[s.totalRow, s.grand]}>
            <Text>Total</Text>
            <Text>{formatEuro(summary.grossCents)}</Text>
          </View>
          {summary.paidCents > 0 && (
            <>
              <View style={s.totalRow}>
                <Text style={s.muted}>Paid</Text>
                <Text>-{formatEuro(summary.paidCents)}</Text>
              </View>
              <View style={[s.totalRow, s.bold]}>
                <Text>Balance due</Text>
                <Text>{formatEuro(summary.balanceCents)}</Text>
              </View>
            </>
          )}
        </View>

        {data.notes && (
          <View style={s.section}>
            <Text style={s.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {(business.iban || business.bic) && (
          <View style={s.section}>
            <Text style={s.label}>Payment details</Text>
            <Text>Please pay by bank transfer quoting {data.number}.</Text>
            {business.iban && <Text>IBAN: {business.iban}</Text>}
            {business.bic && <Text>BIC: {business.bic}</Text>}
          </View>
        )}

        {business.invoiceFooter && <Text style={s.footer} fixed>{business.invoiceFooter}</Text>}
      </Page>
    </Document>
  );
}
