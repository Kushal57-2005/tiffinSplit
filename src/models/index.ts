import mongoose, { Schema, Document, Model } from "mongoose";

// --- User Model ---
export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// --- Friend Model ---
export interface IFriend extends Document {
  ownerId: string;
  fullName: string;
  shortCode: string;
  phone?: string;
  email?: string;
  upiId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>(
  {
    ownerId: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    shortCode: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    upiId: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FriendSchema.index({ ownerId: 1, shortCode: 1 }, { unique: true });

export const FriendModel: Model<IFriend> =
  mongoose.models.Friend || mongoose.model<IFriend>("Friend", FriendSchema);

// --- MealEntry Item Schema ---
export interface IMealEntryItem {
  _id?: string;
  friendId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const MealEntryItemSchema = new Schema<IMealEntryItem>({
  friendId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  lineTotal: { type: Number, required: true, default: 0 },
});

// --- MealEntry Model ---
export interface IMealEntry extends Document {
  ownerId: string;
  entryDate: Date;
  mealType: "MORNING" | "NIGHT";
  defaultPrice: number;
  totalPersons: number;
  totalQuantity: number;
  totalAmount: number;
  notes?: string;
  items: IMealEntryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MealEntrySchema = new Schema<IMealEntry>(
  {
    ownerId: { type: String, required: true, index: true },
    entryDate: { type: Date, required: true, index: true },
    mealType: { type: String, enum: ["MORNING", "NIGHT"], required: true },
    defaultPrice: { type: Number, default: 70 },
    totalPersons: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String },
    items: [MealEntryItemSchema],
  },
  { timestamps: true }
);

export const MealEntryModel: Model<IMealEntry> =
  mongoose.models.MealEntry || mongoose.model<IMealEntry>("MealEntry", MealEntrySchema);

// --- MonthlyInvoice Item Schema ---
export interface IMonthlyInvoiceItem {
  _id?: string;
  entryDate: Date;
  mealType: "MORNING" | "NIGHT";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  description?: string;
}

const MonthlyInvoiceItemSchema = new Schema<IMonthlyInvoiceItem>({
  entryDate: { type: Date, required: true },
  mealType: { type: String, enum: ["MORNING", "NIGHT"], required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  description: { type: String },
});

// --- MonthlyInvoice Model ---
export interface IMonthlyInvoice extends Document {
  ownerId: string;
  friendId: string;
  month: number;
  year: number;
  totalMeals: number;
  totalQuantity: number;
  subtotalAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: "DRAFT" | "GENERATED" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  generatedAt?: Date;
  sentAt?: Date;
  emailSent?: boolean;
  emailTo?: string;
  qrPayload?: string;
  qrImageUrl?: string;
  items: IMonthlyInvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyInvoiceSchema = new Schema<IMonthlyInvoice>(
  {
    ownerId: { type: String, required: true, index: true },
    friendId: { type: String, required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalMeals: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    subtotalAmount: { type: Number, default: 0 },
    adjustmentAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["DRAFT", "GENERATED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
      default: "GENERATED",
    },
    generatedAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailTo: { type: String },
    qrPayload: { type: String },
    qrImageUrl: { type: String },
    items: [MonthlyInvoiceItemSchema],
  },
  { timestamps: true }
);

MonthlyInvoiceSchema.index({ ownerId: 1, friendId: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyInvoiceModel: Model<IMonthlyInvoice> =
  mongoose.models.MonthlyInvoice || mongoose.model<IMonthlyInvoice>("MonthlyInvoice", MonthlyInvoiceSchema);

// --- Payment Model ---
export interface IPayment extends Document {
  ownerId: string;
  friendId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "OTHER";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  transactionRef?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    ownerId: { type: String, required: true, index: true },
    friendId: { type: String, required: true, index: true },
    invoiceId: { type: String, index: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["UPI", "CASH", "BANK_TRANSFER", "OTHER"],
      default: "UPI",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "SUCCESS",
    },
    transactionRef: { type: String },
    notes: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

// --- AuditTask Model ---
export interface IAuditTask extends Document {
  ownerId: string;
  title: string;
  category: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  notes?: string;
  evidenceUrl?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditTaskSchema = new Schema<IAuditTask>(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"],
      default: "NOT_STARTED",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    notes: { type: String },
    evidenceUrl: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const AuditTaskModel: Model<IAuditTask> =
  mongoose.models.AuditTask || mongoose.model<IAuditTask>("AuditTask", AuditTaskSchema);
