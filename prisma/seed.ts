import "dotenv/config";
import { fakerEN_IE as faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  ApplicationStatus,
  County,
  DocumentStatus,
  EnterpriseType,
  PaymentMethod,
} from "../src/generated/prisma/enums";
import { addDays, todayDateOnly } from "../src/lib/domain/dates";
import { formatInvoiceNumber, invoiceTotals } from "../src/lib/domain/invoice";

// Every record here is fictional. Dates are generated relative to the day the seed
// runs so the dashboard always has upcoming deadlines and recent payments.

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
faker.seed(2026);

const today = todayDateOnly();
const day = (offset: number) => addDays(today, offset);

const FIRST_NAMES = [
  "Seán", "Patrick", "John", "Michael", "Martin", "Tom", "Declan", "Brendan", "Noel", "Pádraig", "Eamon", "Colm",
  "Ciarán", "Gerry", "Tadhg", "Dónal", "Kevin", "Liam", "Fergal", "Joe", "Mary", "Bridget", "Siobhán", "Áine",
  "Nora", "Maureen", "Catherine", "Gráinne", "Úna", "Margaret", "Eileen", "Deirdre",
];
const SURNAMES = [
  "Murphy", "Kelly", "Walsh", "O'Sullivan", "Byrne", "Ryan", "O'Brien", "Gallagher", "Burke", "Joyce", "Flaherty",
  "Keane", "Mannion", "Fahy", "Higgins", "Moran", "Gavin", "Coyne", "Duggan", "Hession", "Fallon", "Naughton",
  "McHugh", "Brennan", "Kilbane", "Gilmartin", "Durkan", "Ruane", "Molloy", "Feeney", "McLoughlin", "Hynes",
  "Cunningham", "Mulligan", "Tierney", "Egan", "Concannon", "Geraghty", "McNamara", "Keating",
];

interface Town {
  name: string;
  county: County;
  lat: number;
  lng: number;
  key: string;
  jitter?: number;
}

const TOWNS: Town[] = [
  { name: "Tuam", county: "GALWAY", lat: 53.515, lng: -8.851, key: "H54" },
  { name: "Loughrea", county: "GALWAY", lat: 53.197, lng: -8.567, key: "H62" },
  { name: "Ballinasloe", county: "GALWAY", lat: 53.328, lng: -8.219, key: "H53" },
  { name: "Athenry", county: "GALWAY", lat: 53.296, lng: -8.744, key: "H65" },
  { name: "Mountbellew", county: "GALWAY", lat: 53.469, lng: -8.508, key: "H53" },
  { name: "Headford", county: "GALWAY", lat: 53.469, lng: -9.107, key: "H91" },
  { name: "Oughterard", county: "GALWAY", lat: 53.428, lng: -9.32, key: "H91", jitter: 0.5 },
  { name: "Portumna", county: "GALWAY", lat: 53.09, lng: -8.218, key: "H53" },
  { name: "Castlebar", county: "MAYO", lat: 53.855, lng: -9.288, key: "F23" },
  { name: "Westport", county: "MAYO", lat: 53.8, lng: -9.518, key: "F28", jitter: 0.4 },
  { name: "Ballina", county: "MAYO", lat: 54.115, lng: -9.155, key: "F26" },
  { name: "Claremorris", county: "MAYO", lat: 53.72, lng: -8.99, key: "F12" },
  { name: "Swinford", county: "MAYO", lat: 53.943, lng: -8.951, key: "F12" },
  { name: "Ballinrobe", county: "MAYO", lat: 53.633, lng: -9.229, key: "F31" },
  { name: "Kiltimagh", county: "MAYO", lat: 53.85, lng: -9.0, key: "F12" },
  { name: "Roscommon", county: "ROSCOMMON", lat: 53.63, lng: -8.19, key: "F42" },
  { name: "Boyle", county: "ROSCOMMON", lat: 53.973, lng: -8.299, key: "F52" },
  { name: "Castlerea", county: "ROSCOMMON", lat: 53.768, lng: -8.49, key: "F45" },
  { name: "Strokestown", county: "ROSCOMMON", lat: 53.775, lng: -8.103, key: "F42" },
  { name: "Tubbercurry", county: "SLIGO", lat: 54.056, lng: -8.729, key: "F91" },
  { name: "Ballymote", county: "SLIGO", lat: 54.09, lng: -8.517, key: "F56" },
  { name: "Carrick-on-Shannon", county: "LEITRIM", lat: 53.946, lng: -8.09, key: "N41" },
  { name: "Manorhamilton", county: "LEITRIM", lat: 54.304, lng: -8.177, key: "F91" },
  { name: "Mohill", county: "LEITRIM", lat: 53.922, lng: -7.865, key: "N41" },
  { name: "Ennis", county: "CLARE", lat: 52.844, lng: -8.986, key: "V95" },
  { name: "Ennistymon", county: "CLARE", lat: 52.94, lng: -9.29, key: "V95", jitter: 0.5 },
  { name: "Scariff", county: "CLARE", lat: 52.909, lng: -8.528, key: "V94" },
  { name: "Tulla", county: "CLARE", lat: 52.865, lng: -8.761, key: "V95" },
  { name: "Ballybofey", county: "DONEGAL", lat: 54.799, lng: -7.79, key: "F93" },
  { name: "Donegal", county: "DONEGAL", lat: 54.654, lng: -8.11, key: "F94", jitter: 0.5 },
];

const HERD_LETTERS: Partial<Record<County, string>> = {
  GALWAY: "G", MAYO: "M", ROSCOMMON: "R", SLIGO: "S", LEITRIM: "L", CLARE: "C", DONEGAL: "D",
};

const EIRCODE_CHARS = "0123456789ACDEFHKNPRTVWXY";

const ENTERPRISE_WEIGHTS: { value: EnterpriseType; weight: number }[] = [
  { value: "BEEF", weight: 36 },
  { value: "SHEEP", weight: 20 },
  { value: "MIXED", weight: 15 },
  { value: "DAIRY", weight: 14 },
  { value: "TILLAGE", weight: 5 },
  { value: "FORESTRY", weight: 5 },
  { value: "OTHER", weight: 5 },
];

const SCHEMES = [
  {
    code: "ACRES",
    name: "ACRES",
    description: "Agri-Climate Rural Environment Scheme: agri-environment actions and annual payments.",
    fee: 45000,
    docs: ["Farm map / LPIS printout", "Signed farmer declaration", "Bank details (IBAN)", "Herd register", "ACRES training certificate"],
    deadlines: [
      { title: "ACRES 2026 tranche closed", offset: -290 },
      { title: "ACRES amendments window closes", offset: 16 },
      { title: "ACRES 2027 closing date", offset: 140 },
    ],
  },
  {
    code: "ECO",
    name: "Eco-Scheme",
    description: "Annual Eco-Scheme actions declared alongside the BISS application.",
    fee: 8000,
    docs: ["Agricultural activity declaration", "Herd profile"],
    deadlines: [{ title: "Eco-Scheme 2026 closing date", offset: -167 }, { title: "Eco-Scheme 2027 closing date", offset: 198 }],
  },
  {
    code: "BISS",
    name: "BISS",
    description: "Basic Income Support for Sustainability, the annual area-based payment application.",
    fee: 15000,
    docs: ["Land parcel maps", "Rental / lease agreements", "Herd profile", "Bank details (IBAN)"],
    deadlines: [{ title: "BISS 2026 closing date", offset: -167 }, { title: "BISS 2027 closing date", offset: 198 }],
  },
  {
    code: "TAMS3",
    name: "TAMS 3",
    description: "Targeted Agriculture Modernisation Scheme: capital investment grants for farm buildings and equipment.",
    fee: 65000,
    docs: ["Planning permission or exemption", "Contractor quotations", "Tax clearance certificate", "Site map & drawings", "Herd profile", "Bank details (IBAN)"],
    deadlines: [
      { title: "TAMS 3 Tranche 8 closed", offset: -62 },
      { title: "TAMS 3 Tranche 9 closes", offset: 29 },
      { title: "TAMS 3 Tranche 10 closes", offset: 120 },
    ],
  },
  {
    code: "SCEP",
    name: "SCEP",
    description: "Suckler Carbon Efficiency Programme: weighing, genotyping and training actions.",
    fee: 15000,
    docs: ["Herd profile", "Weighing records", "SCEP training certificate"],
    deadlines: [
      { title: "SCEP 2026 application closed", offset: -210 },
      { title: "SCEP weighing records due", offset: 4 },
      { title: "SCEP 2026 data submission", offset: 8 },
    ],
  },
  {
    code: "OFS",
    name: "Organic Farming Scheme",
    description: "Conversion and maintenance payments for certified organic farms.",
    fee: 40000,
    docs: ["Organic certification", "Conversion plan", "Farm map / LPIS printout", "Organic training certificate"],
    deadlines: [{ title: "OFS 2026 closing date", offset: -270 }, { title: "OFS 2027 closing date", offset: 93 }],
  },
  {
    code: "FORESTRY",
    name: "Forestry Programme",
    description: "Afforestation grants and premiums under the national Forestry Programme.",
    fee: 90000,
    docs: ["Forestry management plan", "Land Registry folio", "Environmental report", "Bank details (IBAN)"],
    deadlines: [{ title: "Forestry spring planting cut-off", offset: -120 }, { title: "Forestry planting grant cut-off", offset: 44 }],
  },
  {
    code: "NRES",
    name: "National Reserve",
    description: "Allocation of payment entitlements for young and new entrant farmers.",
    fee: 12000,
    docs: ["Agricultural education certificate", "Proof of age", "Herd number registration letter"],
    deadlines: [{ title: "National Reserve 2026 closing date", offset: -167 }, { title: "National Reserve 2027 closing date", offset: 198 }],
  },
];

const HOURLY_WORK = [
  "Farm visit and walk-over",
  "Nitrates plan preparation",
  "Land parcel mapping and digitising",
  "Meeting with DAFM inspector",
  "Correspondence with Department",
  "Inspection preparation",
  "Fertiliser planning",
];

function weighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = faker.number.float({ min: 0, max: total });
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// Weighted towards the last month so the outstanding list isn't all overdue.
function invoiceAge(): number {
  const band = weighted([
    { value: [1, 30], weight: 35 },
    { value: [31, 90], weight: 25 },
    { value: [91, 330], weight: 40 },
  ]);
  return faker.number.int({ min: band[0], max: band[1] });
}

// Most farmers pay within a couple of months, so unpaid invoices skew recent.
function paymentFor(ageDays: number): "full" | "partial" | "none" {
  if (ageDays <= 30) return weighted([{ value: "full", weight: 35 }, { value: "partial", weight: 10 }, { value: "none", weight: 55 }]);
  if (ageDays <= 90) return weighted([{ value: "full", weight: 72 }, { value: "partial", weight: 10 }, { value: "none", weight: 18 }]);
  return weighted([{ value: "full", weight: 94 }, { value: "partial", weight: 2 }, { value: "none", weight: 4 }]);
}

function eircodeFor(town: Town) {
  return `${town.key} ${Array.from({ length: 4 }, () => faker.helpers.arrayElement([...EIRCODE_CHARS])).join("")}`;
}

function phone() {
  return `08${faker.helpers.arrayElement(["3", "5", "6", "7", "9"])} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`;
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

async function reset() {
  await db.payment.deleteMany();
  await db.invoiceLine.deleteMany();
  await db.invoice.deleteMany();
  await db.invoiceSequence.deleteMany();
  await db.applicationDocument.deleteMany();
  await db.grantApplication.deleteMany();
  await db.activity.deleteMany();
  await db.client.deleteMany();
  await db.schemeDeadline.deleteMany();
  await db.schemeDocumentTemplate.deleteMany();
  await db.scheme.deleteMany();
  await db.businessSettings.deleteMany();
}

async function main() {
  await reset();

  await db.businessSettings.create({
    data: {
      id: 1,
      businessName: "Western Agri Advisory",
      ownerName: "Demo Consultant",
      address: "Unit 4, Demo Business Park\nTuam\nCo. Galway",
      phone: "093 00 00000",
      email: "office@example.ie",
      vatNumber: "IE0000000DEMO",
      iban: "IE00 DEMO 0000 0000 0000 00",
      bic: "DEMOIE2D",
      paymentTermsDays: 30,
      invoiceFooter: "Demo data · Thank you for your business.",
    },
  });

  const schemes = [];
  for (const s of SCHEMES) {
    schemes.push(
      await db.scheme.create({
        data: {
          code: s.code,
          name: s.name,
          description: s.description,
          defaultFeeCents: s.fee,
          documentTemplates: { create: s.docs.map((name, i) => ({ name, sortOrder: i })) },
          deadlines: { create: s.deadlines.map((d) => ({ title: d.title, date: day(d.offset) })) },
        },
        include: { documentTemplates: true, deadlines: true },
      }),
    );
  }

  const usedHerds = new Set<string>();
  const clients = [];
  for (let i = 0; i < 90; i++) {
    const town = faker.helpers.arrayElement(TOWNS);
    const firstName = faker.helpers.arrayElement(FIRST_NAMES);
    const lastName = faker.helpers.arrayElement(SURNAMES);
    let herdNumber: string;
    do herdNumber = `${HERD_LETTERS[town.county]}${faker.string.numeric({ length: 7, allowLeadingZeros: true })}`;
    while (usedHerds.has(herdNumber));
    usedHerds.add(herdNumber);

    const enterpriseType = weighted(ENTERPRISE_WEIGHTS);
    const total = faker.number.float({ min: enterpriseType === "DAIRY" ? 35 : 12, max: enterpriseType === "TILLAGE" ? 160 : 95, fractionDigits: 2 });
    const jitter = (town.jitter ?? 1) * 0.06;
    const hasPin = faker.datatype.boolean(0.95);

    clients.push(
      await db.client.create({
        data: {
          firstName,
          lastName,
          phone: phone(),
          email: faker.datatype.boolean(0.6) ? `${slug(firstName)}.${slug(lastName)}${faker.number.int({ min: 1, max: 99 })}@example.ie` : null,
          addressLine1: `${faker.helpers.arrayElement(["Carrow", "Knock", "Bally", "Gort", "Cloon", "Drum", "Kil", "Lis", "Rath"])}${faker.helpers.arrayElement(["more", "beg", "na", "glass", "keel", "reagh", "ard"])}`,
          town: town.name,
          county: town.county,
          eircode: eircodeFor(town),
          herdNumber,
          enterpriseType,
          totalHectares: total,
          eligibleHectares: Number((total * faker.number.float({ min: 0.82, max: 1 })).toFixed(2)),
          latitude: hasPin ? Number((town.lat + faker.number.float({ min: -jitter, max: jitter })).toFixed(5)) : null,
          longitude: hasPin ? Number((town.lng + faker.number.float({ min: -jitter * 1.5, max: jitter * 1.5 })).toFixed(5)) : null,
          agfoodId: faker.datatype.boolean(0.7) ? `AF${faker.string.numeric(6)}` : null,
          notes: faker.helpers.maybe(
            () =>
              faker.helpers.arrayElement([
                "Prefers a phone call in the evening.",
                "Son helps with paperwork, ring him first.",
                "Land is rented from a neighbour; check lease each year.",
                "Has a commonage share on the mountain.",
                "Keen on TAMS for a new slatted shed next year.",
              ]),
            { probability: 0.3 },
          ),
          createdAt: day(-faker.number.int({ min: 60, max: 2200 })),
        },
      }),
    );
  }

  // Applications and their documents.
  type Seeded = { id: string; clientId: string; status: ApplicationStatus; schemeIndex: number; year: number; deadline: Date };
  const applications: Seeded[] = [];
  for (const client of clients) {
    const count = weighted([
      { value: 0, weight: 10 },
      { value: 1, weight: 40 },
      { value: 2, weight: 35 },
      { value: 3, weight: 15 },
    ]);
    const picked = faker.helpers.arrayElements(schemes.map((_, i) => i), count);
    for (const schemeIndex of picked) {
      const scheme = schemes[schemeIndex];
      const deadline = faker.helpers.arrayElement(scheme.deadlines).date;
      const past = deadline < today;
      const status: ApplicationStatus = past
        ? weighted([
            { value: "SUBMITTED", weight: 25 },
            { value: "APPROVED", weight: 35 },
            { value: "PAID_OUT", weight: 30 },
            { value: "REJECTED", weight: 10 },
          ])
        : weighted([
            { value: "DRAFT", weight: 15 },
            { value: "GATHERING_DOCS", weight: 45 },
            { value: "READY", weight: 20 },
            { value: "SUBMITTED", weight: 20 },
          ]);

      const docStatus = (): DocumentStatus => {
        if (status === "DRAFT") return "MISSING";
        if (status === "GATHERING_DOCS") return weighted([{ value: "RECEIVED", weight: 55 }, { value: "MISSING", weight: 40 }, { value: "NOT_REQUIRED", weight: 5 }]);
        return weighted([{ value: "RECEIVED", weight: 90 }, { value: "NOT_REQUIRED", weight: 10 }]);
      };

      const submitted = ["SUBMITTED", "APPROVED", "REJECTED", "PAID_OUT"].includes(status);
      const decided = ["APPROVED", "REJECTED", "PAID_OUT"].includes(status);
      const submittedAt = submitted ? addDays(deadline < today ? deadline : today, -faker.number.int({ min: 2, max: 25 })) : null;
      const applied = faker.number.int({ min: 15, max: 400 }) * 2500;

      const app = await db.grantApplication.create({
        data: {
          clientId: client.id,
          schemeId: scheme.id,
          year: deadline.getUTCFullYear(),
          status,
          deadline,
          dafmReference: submitted ? `${scheme.code}-${faker.string.numeric(7)}` : null,
          amountAppliedCents: ["TAMS3", "FORESTRY", "ACRES", "OFS"].includes(scheme.code) ? applied : null,
          amountApprovedCents: decided && status !== "REJECTED" && ["TAMS3", "FORESTRY", "ACRES", "OFS"].includes(scheme.code) ? Math.round(applied * 0.9) : null,
          submittedAt,
          decisionAt: decided && submittedAt ? addDays(submittedAt, faker.number.int({ min: 20, max: 70 })) : null,
          documents: {
            create: (() => {
              const statuses = scheme.documentTemplates.map(() => docStatus());
              // Still gathering means at least one document is outstanding.
              if (status === "GATHERING_DOCS" && !statuses.includes("MISSING")) {
                statuses[faker.number.int({ min: 0, max: statuses.length - 1 })] = "MISSING";
              }
              return scheme.documentTemplates.map((t, i) => ({
                name: t.name,
                sortOrder: t.sortOrder,
                status: statuses[i],
                receivedAt: statuses[i] === "RECEIVED" ? day(-faker.number.int({ min: 3, max: 90 })) : null,
              }));
            })(),
          },
        },
      });
      applications.push({ id: app.id, clientId: client.id, status, schemeIndex, year: app.year, deadline });

      await db.activity.create({
        data: { clientId: client.id, type: "NOTE", body: `Started ${scheme.name} ${app.year} application.`, occurredAt: addDays(deadline < today ? deadline : today, -faker.number.int({ min: 30, max: 80 })) },
      });
      if (submittedAt) {
        await db.activity.create({
          data: { clientId: client.id, type: "SUBMISSION", body: `${scheme.name} ${app.year}: submitted online.`, occurredAt: submittedAt },
        });
      }
    }
  }

  // Invoices: one per submitted application plus some hourly work, numbered in issue order.
  type Draft = {
    clientId: string;
    applicationId: string | null;
    issueDate: Date;
    status: "DRAFT" | "ISSUED" | "VOID";
    lines: { description: string; kind: "FIXED" | "HOURLY"; quantity: number; unitPriceCents: number }[];
    payment: "full" | "partial" | "none";
  };
  const drafts: Draft[] = [];

  for (const app of applications) {
    if (!["SUBMITTED", "APPROVED", "PAID_OUT", "REJECTED"].includes(app.status) || faker.datatype.boolean(0.12)) continue;
    const scheme = SCHEMES[app.schemeIndex];
    const issueDate = day(-invoiceAge());
    const ageDays = (today.getTime() - issueDate.getTime()) / 86_400_000;
    drafts.push({
      clientId: app.clientId,
      applicationId: app.id,
      issueDate,
      status: "ISSUED",
      lines: [
        { description: `${scheme.name} ${app.year} application: professional fee`, kind: "FIXED", quantity: 1, unitPriceCents: scheme.fee },
        ...(faker.datatype.boolean(0.25)
          ? [{ description: faker.helpers.arrayElement(HOURLY_WORK), kind: "HOURLY" as const, quantity: faker.helpers.arrayElement([1, 1.5, 2, 3]), unitPriceCents: 6500 }]
          : []),
      ],
      payment: paymentFor(ageDays),
    });
  }

  for (let i = 0; i < 48; i++) {
    const client = faker.helpers.arrayElement(clients);
    const issueDate = day(-invoiceAge());
    drafts.push({
      clientId: client.id,
      applicationId: null,
      issueDate,
      status: "ISSUED",
      lines: faker.helpers.arrayElements(HOURLY_WORK, { min: 1, max: 2 }).map((description) => ({
        description,
        kind: "HOURLY",
        quantity: faker.helpers.arrayElement([1, 1.5, 2, 2.5, 4]),
        unitPriceCents: 6500,
      })),
      payment: paymentFor((today.getTime() - issueDate.getTime()) / 86_400_000),
    });
  }

  for (const app of applications.filter((a) => a.status === "READY").slice(0, 4)) {
    const scheme = SCHEMES[app.schemeIndex];
    drafts.push({
      clientId: app.clientId,
      applicationId: app.id,
      issueDate: today,
      status: "DRAFT",
      lines: [{ description: `${scheme.name} ${app.year} application: professional fee`, kind: "FIXED", quantity: 1, unitPriceCents: scheme.fee }],
      payment: "none",
    });
  }

  const issued = drafts.filter((d) => d.status !== "DRAFT").sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());
  faker.helpers.arrayElements(issued.filter((d) => d.payment === "none"), 2).forEach((d) => (d.status = "VOID"));

  const sequence = new Map<number, number>();
  for (const draft of [...issued, ...drafts.filter((d) => d.status === "DRAFT")]) {
    let number: string | null = null;
    if (draft.status !== "DRAFT") {
      const year = draft.issueDate.getUTCFullYear();
      const next = (sequence.get(year) ?? 0) + 1;
      sequence.set(year, next);
      number = formatInvoiceNumber(year, next);
    }

    const { grossCents } = invoiceTotals(draft.lines, 2300);
    const dueDate = addDays(draft.issueDate, 30);
    const payments: { amountCents: number; paidAt: Date; method: PaymentMethod; reference: string | null }[] = [];
    if (draft.status === "ISSUED" && draft.payment !== "none") {
      const latest = Math.min(55, Math.max(0, Math.floor((today.getTime() - draft.issueDate.getTime()) / 86_400_000)));
      const paidAt = addDays(draft.issueDate, faker.number.int({ min: 0, max: latest }));
      const method = weighted<PaymentMethod>([
        { value: "TRANSFER", weight: 55 },
        { value: "CHEQUE", weight: 30 },
        { value: "CASH", weight: 10 },
        { value: "CARD", weight: 5 },
      ]);
      const reference = method === "CHEQUE" ? `Chq ${faker.string.numeric(6)}` : method === "TRANSFER" ? `BOI ${faker.string.alphanumeric(8).toUpperCase()}` : null;
      const amount = draft.payment === "full" ? grossCents : Math.round(grossCents * faker.helpers.arrayElement([0.25, 0.4, 0.5]));
      payments.push({ amountCents: amount, paidAt, method, reference });
    }

    await db.invoice.create({
      data: {
        number,
        clientId: draft.clientId,
        applicationId: draft.applicationId,
        issueDate: draft.issueDate,
        dueDate,
        status: draft.status,
        lines: { create: draft.lines.map((l, i) => ({ ...l, sortOrder: i })) },
        payments: { create: payments },
      },
    });

    for (const p of payments) {
      await db.activity.create({
        data: {
          clientId: draft.clientId,
          type: "PAYMENT",
          body: `Paid €${(p.amountCents / 100).toFixed(2)} against ${number}.`,
          occurredAt: new Date(p.paidAt.getTime() + faker.number.int({ min: 9, max: 17 }) * 3_600_000),
        },
      });
    }
  }

  for (const [year, last] of sequence) await db.invoiceSequence.create({ data: { year, last } });

  // A sprinkling of calls and visits.
  for (const client of faker.helpers.arrayElements(clients, 55)) {
    for (let i = 0; i < faker.number.int({ min: 1, max: 3 }); i++) {
      const type = faker.helpers.arrayElement(["CALL", "CALL", "VISIT"] as const);
      await db.activity.create({
        data: {
          clientId: client.id,
          type,
          occurredAt: new Date(day(-faker.number.int({ min: 0, max: 120 })).getTime() + faker.number.int({ min: 9, max: 18 }) * 3_600_000),
          body:
            type === "VISIT"
              ? faker.helpers.arrayElement([
                  "Walked the land for ACRES actions, agreed on hedgerow planting.",
                  "Measured up the shed site for TAMS.",
                  "Went through the herd register and dosing records.",
                  "Visit to sign forms and collect bank details.",
                ])
              : faker.helpers.arrayElement([
                  "Rang about missing bank details.",
                  "Called to say the payment came through.",
                  "Query about the Eco-Scheme actions this year.",
                  "Left a voicemail re: outstanding invoice.",
                  "Asked about grant options for a new crush.",
                ]),
        },
      });
    }
  }

  const counts = {
    clients: await db.client.count(),
    applications: await db.grantApplication.count(),
    invoices: await db.invoice.count(),
    payments: await db.payment.count(),
    activities: await db.activity.count(),
  };
  console.log("Seeded demo data:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
